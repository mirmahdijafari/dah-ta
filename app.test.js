const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
require('./catalog-snapshot.js');
const { categories, getResults, isFresh, priceHtml, acceptCatalog, escapeHtml } = require('./app.js');
const snapshot = globalThis.DAH_TA_SNAPSHOT;
const products = snapshot.catalogs.flatMap(c => c.products.map(p => ({ ...p, checkedAt: c.checkedAt })));
const results = (category='all',query='',sort='rank',saved=new Set(),onlySaved=false) => getResults(category,query,sort,saved,onlySaved,products);

test('each live category and the combined selection contain ten distinct products', () => {
  for (const c of categories) {
    const list = results(c.id);
    assert.equal(list.length,10);
    assert.equal(new Set(list.map(p=>p.id)).size,10);
    assert.deepEqual(list.map(p=>p.rank),[1,2,3,4,5,6,7,8,9,10]);
  }
});
test('all snapshot images are embedded and all links refer to actual product IDs', () => {
  assert.equal(products.length,30);
  for (const p of products) {
    assert.match(p.image,/^data:image\/(jpeg|png|webp);base64,/);
    assert.ok(Buffer.from(p.image.split(',')[1],'base64').length>100);
    assert.equal(p.url,`https://www.digikala.com/product/dkp-${p.id.slice(3)}/`);
  }
  assert.match(snapshot.heroImage,/^data:image\/webp;base64,/);
});
test('search normalizes Arabic characters and supports product names', () => {
  assert.ok(results('phones','سامسونگ').length>0);
  assert.ok(results('phones','گوشي').length>0);
  assert.equal(results('all','not-a-product').length,0);
  assert.equal(results('all','   ').length,10);
});
test('sorting and saved selection preserve source data', () => {
  for (const sort of ['price-asc','price-desc','rating']) {
    const list = results('all','',sort);
    for (let i=1;i<list.length;i++) {
      if (sort==='price-asc') assert.ok(list[i].price>=list[i-1].price);
      if (sort==='price-desc') assert.ok(list[i].price<=list[i-1].price);
      if (sort==='rating') assert.ok((list[i].rating??-1)<=(list[i-1].rating??-1));
    }
  }
  const saved = new Set([products[0].id,products[15].id]);
  assert.equal(results('all','','rank',saved,true).length,2);
  assert.equal(results('all','','rank',new Set(),true).length,0);
  assert.equal(products[0].rank,1);
});
test('freshness rejects invalid dates, future dates and expired prices', () => {
  const now = Date.now();
  assert.ok(isFresh(new Date(now-60_000).toISOString(),now));
  for (const date of ['invalid',new Date(now-300_000).toISOString(),new Date(now+120_000).toISOString()]) assert.equal(isFresh(date,now),false);
});
test('expired prices and discounts are hidden in cards and details', () => {
  const now = Date.now();
  const p = {...products[0],price:1234567,originalPrice:2345678,discount:47,checkedAt:new Date(now-300_000).toISOString()};
  for (const detail of [false,true]) {
    const html = priceHtml(p,detail,now);
    assert.match(html,/نیازمند به‌روزرسانی/);
    assert.ok(!html.includes('تومان'));
    assert.ok(!html.includes('<del>'));
  }
  p.checkedAt = new Date(now).toISOString();
  assert.match(priceHtml(p,false,now),/تومان/);
  assert.match(priceHtml(p,false,now),/<del>/);
  p.originalPrice = null;
  assert.ok(!priceHtml(p,false,now).includes('<del>'));
});
test('catalog boundary rejects stale data and injected URLs', () => {
  const c = { ...snapshot.catalogs[0],checkedAt:new Date().toISOString(),products:snapshot.catalogs[0].products.map(p=>({...p,image:`api/images/${p.id}`})) };
  assert.equal(acceptCatalog(c,'phones'),c);
  assert.throws(()=>acceptCatalog({...c,checkedAt:'2000-01-01'},'phones'));
  assert.throws(()=>acceptCatalog(c,'laptops'));
  for (const field of ['image','url','id']) {
    const invalid = structuredClone(c); invalid.products[0][field] = 'javascript:alert(1)';
    assert.throws(()=>acceptCatalog(invalid,'phones'));
  }
});
test('HTML escaping prevents product metadata from injecting markup', () => {
  assert.equal(escapeHtml('<img src=x onerror="bad">'), '&lt;img src=x onerror=&quot;bad&quot;&gt;');
});
test('UI handles refresh failure, stale pricing, category filtering and image fallback without a browser', async () => {
  const listeners = new Map(), intervals = [], elements = new Map();
  function element() { return {innerHTML:'',textContent:'',value:'',dataset:{},hidden:false,open:false,disabled:false,options:[],classList:{add(){},remove(){},toggle(){}},addEventListener(){},setAttribute(){},scrollIntoView(){},showModal(){this.open=true},close(){this.open=false}}; }
  const document = {
    hidden:false,
    querySelector(selector) { if (!elements.has(selector)) elements.set(selector,element()); return elements.get(selector); },
    querySelectorAll() { return []; },
    addEventListener(type,fn) { listeners.set(type,fn); },
    createElement() { return element(); }
  };
  const staleSnapshot = structuredClone(snapshot);
  for (const c of staleSnapshot.catalogs) c.checkedAt='2000-01-01';
  document.querySelector('#sort').value='rank';
  document.querySelector('#sort').options=[{value:'rank'},{value:'price-asc'},{value:'price-desc'}];
  const context = vm.createContext({document,DAH_TA_SNAPSHOT:staleSnapshot,fetch:async()=>{throw new Error('Offline')},localStorage:{getItem(){return null},setItem(){}},AbortSignal,setTimeout,clearTimeout,setInterval(fn){intervals.push(fn)}});
  vm.runInContext(fs.readFileSync('app.js','utf8'),context);
  await new Promise(resolve=>setImmediate(resolve));
  assert.match(document.querySelector('#data-status').textContent,/برقرار نشد/);
  assert.match(document.querySelector('#product-grid').innerHTML,/نیازمند به‌روزرسانی/);
  assert.ok(!document.querySelector('#product-grid').innerHTML.includes('<small>تومان</small>'));
  assert.equal(document.querySelector('#sort').options[1].disabled,true);
  assert.equal(intervals.length,2);
  listeners.get('click')({target:{closest(selector){return selector==='[data-category]'?{dataset:{category:'laptops'}}:null}}});
  assert.match(document.querySelector('#result-title').textContent,/لپ‌تاپ/);
  assert.ok(document.querySelector('#product-grid').innerHTML.includes(products[10].name));
  const img = {tagName:'IMG',dataset:{productImage:products[0].id},getAttribute(){return 'api/images/failure'},after(){}};
  listeners.get('error')({target:img});
  assert.equal(img.src,products[0].image);
  listeners.get('error')({target:img});
  assert.equal(img.hidden,true);
});
