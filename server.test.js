const { test } = require('node:test');
const assert = require('node:assert/strict');
const { normalizeProduct, createCatalogService, createServer } = require('./server.js');
const sourceProduct = (id=123) => ({id,title_fa:'گوشی تست',status:'marketable',data_layer:{brand:'تست'},images:{main:{url:['https://dkstatics-public.digikala.com/digikala-products/test.jpg']}},rating:{rate:90,count:20},default_variant:{price:{selling_price:12000000,rrp_price:15000000},color:{title:'مشکی'}}});
const catalogResponse = () => new Response(JSON.stringify({data:{products:Array.from({length:12},(_,i)=>sourceProduct(100+i))}}),{headers:{'Content-Type':'application/json'}});

test('prices convert from rial to toman and discounts use real original prices', () => {
  const p = normalizeProduct(sourceProduct(),'phones',1);
  assert.equal(p.price,1200000);
  assert.equal(p.originalPrice,1500000);
  assert.equal(p.discount,20);
  assert.equal(p.rating,4.5);
  assert.equal(p.url,'https://www.digikala.com/product/dkp-123/');
  const raw = sourceProduct(); raw.default_variant.price.rrp_price=12000000; raw.rating.count=0;
  const noDiscount = normalizeProduct(raw,'phones',1);
  assert.equal(noDiscount.discount,0); assert.equal(noDiscount.originalPrice,null); assert.equal(noDiscount.rating,null);
});
test('unavailable products and unsafe image origins are not passed through', () => {
  for (const raw of [{...sourceProduct(),status:'out_of_stock'},{...sourceProduct(),default_variant:[]},{...sourceProduct(),id:'invalid'}]) assert.equal(normalizeProduct(raw,'phones',1),null);
  const p = sourceProduct(); p.images.main.url=['http://127.0.0.1/private'];
  assert.equal(normalizeProduct(p,'phones',1).image,'');
});
test('catalog requests coalesce, cache for sixty seconds, and refresh prices afterward', async () => {
  let now=Date.now(),requests=0;
  const service=createCatalogService(async()=>{requests++;return catalogResponse()},()=>now);
  const [a,b]=await Promise.all([service.catalog('phones'),service.catalog('phones')]);
  assert.equal(requests,1);assert.equal(a,b);assert.equal(a.products.length,10);
  assert.equal(a.products[0].image,'api/images/dk-100');
  now+=59_999;await service.catalog('phones');assert.equal(requests,1);
  now+=1;const refreshed=await service.catalog('phones');assert.equal(requests,2);assert.notEqual(refreshed.checkedAt,a.checkedAt);
});
test('upstream failure is returned as an error rather than silently renewing stale prices', async () => {
  let now=Date.now(),fail=false;
  const service=createCatalogService(async()=>{if(fail)throw new Error('Offline');return catalogResponse()},()=>now);
  await service.catalog('phones');now+=60_001;fail=true;
  await assert.rejects(service.catalog('phones'));
  fail=false;assert.ok((await service.catalog('phones')).products.length);
  await assert.rejects(service.catalog('https://other.example/'));
});
test('image proxy only serves catalog images and caches valid bytes', async () => {
  let imageRequests=0;
  const service=createCatalogService(async url=>{
    if(url.startsWith('https://api.digikala.com/'))return catalogResponse();
    imageRequests++;return new Response(Buffer.from('image bytes'),{headers:{'Content-Type':'image/jpeg'}});
  });
  assert.equal(await service.image('dk-999'),null);
  await service.catalog('phones');
  assert.equal((await service.image('dk-100')).type,'image/jpeg');
  await service.image('dk-100');assert.equal(imageRequests,1);
});
test('image proxy rejects non-images and oversized responses', async () => {
  for(const [type,bytes] of [['text/html','not an image'],['image/jpeg',Buffer.alloc(2_000_001)]]) {
    const service=createCatalogService(async url=>url.startsWith('https://api.digikala.com/')?catalogResponse():new Response(bytes,{headers:{'Content-Type':type}}));
    await service.catalog('phones');await assert.rejects(service.image('dk-100'));
  }
});
test('HTTP integration serves the site, catalog and images but rejects private files and arbitrary URLs', async t => {
  const service=createCatalogService(async url=>url.startsWith('https://api.digikala.com/')?catalogResponse():new Response('image bytes',{headers:{'Content-Type':'image/jpeg'}}));
  const server=createServer(service);
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve)}));
  const base=`http://127.0.0.1:${server.address().port}`;
  const home=await fetch(base);assert.equal(home.status,200);assert.match(await home.text(),/catalog-snapshot.js/);
  const js=await fetch(`${base}/app.js`);assert.match(js.headers.get('content-type'),/javascript/);
  const result=await fetch(`${base}/api/catalog?category=phones`);assert.equal(result.status,200);assert.equal(result.headers.get('cache-control'),'no-store');assert.equal((await result.json()).products.length,10);
  const img=await fetch(`${base}/api/images/dk-100`);assert.equal(img.status,200);assert.equal(img.headers.get('content-type'),'image/jpeg');
  for(const file of ['server.js','package.json','.git/config','api/images/dk-999']) assert.equal((await fetch(`${base}/${file}`)).status,404);
  assert.equal((await fetch(`${base}/api/catalog?category=https://example.com`)).status,400);
  assert.equal((await fetch(base,{method:'POST'})).status,405);
});
test('HTTP upstream outage has a non-cacheable error response', async t => {
  const server=createServer({catalog:async()=>{throw new Error('Offline')}});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve)}));
  const response=await fetch(`http://127.0.0.1:${server.address().port}/api/catalog?category=phones`);
  assert.equal(response.status,502);assert.equal(response.headers.get('cache-control'),'no-store');
});
