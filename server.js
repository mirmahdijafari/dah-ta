const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');

const SOURCES = { phones: 'mobile-phone', laptops: 'notebook-netbook-ultrabook', accessories: 'headphone' };
const CACHE_MS = 60_000;
const MAX_AGE_MS = 300_000;
const IMAGE_HOST = 'dkstatics-public.digikala.com';

function normalizeProduct(p, category, rank) {
  const price = p.default_variant?.price;
  const selling = price?.selling_price;
  if (!Number.isSafeInteger(p.id) || typeof p.title_fa !== 'string' || p.status !== 'marketable' || !Number.isSafeInteger(selling) || selling <= 0) return null;
  let image;
  try {
    const url = new URL(p.images?.main?.url?.[0]);
    if (url.protocol === 'https:' && url.hostname === IMAGE_HOST) image = url.href;
  } catch {}
  const rating = Number(p.rating?.rate);
  return {
    id: `dk-${p.id}`, category, name: p.title_fa, brand: p.data_layer?.brand || '',
    image: image || '', price: selling / 10,
    originalPrice: Number.isSafeInteger(price.rrp_price) && price.rrp_price > selling ? price.rrp_price / 10 : null,
    rank, rating: p.rating?.count > 0 && Number.isFinite(rating) && rating >= 0 && rating <= 100 ? Number((rating / 20).toFixed(1)) : null,
    reviewCount: p.rating?.count || 0, spec: p.default_variant?.color?.title || '',
    discount: price.rrp_price > selling ? Math.round((1 - selling / price.rrp_price) * 100) : 0,
    url: `https://www.digikala.com/product/dkp-${p.id}/`
  };
}

function createCatalogService(fetcher = fetch, now = Date.now) {
  const cache = new Map();
  const pending = new Map();
  const imageSources = new Map();
  const imageCache = new Map();
  async function catalog(category) {
    if (!Object.hasOwn(SOURCES, category)) throw new Error('Unknown category');
    const cached = cache.get(category);
    if (cached && now() - Date.parse(cached.checkedAt) < CACHE_MS) return cached;
    if (pending.has(category)) return pending.get(category);
    const task = (async () => {
      const response = await fetcher(`https://api.digikala.com/v1/categories/${SOURCES[category]}/search/?sort=7&has_selling_stock=1`, { signal: AbortSignal.timeout(20_000), redirect: 'error' });
      if (!response.ok) throw new Error('Catalog unavailable');
      const data = await response.json();
      if (!Array.isArray(data.data?.products)) throw new Error('Invalid catalog');
      const products = data.data.products.map(p => normalizeProduct(p, category, 0)).filter(Boolean).slice(0, 10).map((p, i) => ({ ...p, rank: i + 1 }));
      if (!products.length) throw new Error('Empty catalog');
      const knownIds = new Set([...cache.values()].flatMap(c => c.products.map(p => p.id)));
      for (const [id] of imageSources) if (!knownIds.has(id)) { imageSources.delete(id); imageCache.delete(id); }
      for (const p of products) if (p.image) imageSources.set(p.id, p.image);
      const result = { category, checkedAt: new Date(now()).toISOString(), maxAgeMs: MAX_AGE_MS, products: products.map(p => ({ ...p, image: p.image ? `api/images/${p.id}` : '' })) };
      cache.set(category, result);
      return result;
    })();
    pending.set(category, task);
    try { return await task; } finally { pending.delete(category); }
  }
  async function image(id) {
    const source = imageSources.get(id);
    if (!source) return null;
    const cached = imageCache.get(id);
    if (cached?.source === source && now() - cached.time < 3_600_000) return cached;
    const response = await fetcher(source, { signal: AbortSignal.timeout(15_000), redirect: 'error' });
    const type = response.headers.get('content-type')?.split(';')[0];
    if (!response.ok || !['image/jpeg', 'image/png', 'image/webp'].includes(type)) throw new Error('Image unavailable');
    const reader = response.body.getReader();
    const chunks = []; let size = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 2_000_000) { await reader.cancel(); throw new Error('Image too large'); }
        chunks.push(Buffer.from(value));
      }
    } finally { reader.releaseLock(); }
    const result = { bytes: Buffer.concat(chunks), type, source, time: now() };
    imageCache.set(id, result);
    return result;
  }
  return { catalog, image };
}

function createServer(service = createCatalogService()) {
  const publicFiles = new Map([
    ['/', ['index.html', 'text/html; charset=utf-8']],
    ['/index.html', ['index.html', 'text/html; charset=utf-8']],
    ['/app.js', ['app.js', 'text/javascript; charset=utf-8']],
    ['/catalog-snapshot.js', ['catalog-snapshot.js', 'text/javascript; charset=utf-8']],
    ['/styles.css', ['styles.css', 'text/css; charset=utf-8']],
    ['/assets/apple-airpods-max-silver.webp', ['assets/apple-airpods-max-silver.webp', 'image/webp']]
  ]);
  return http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405, { Allow: 'GET, HEAD' }); return res.end(); }
    try {
      if (url.pathname === '/api/catalog') {
        const category = url.searchParams.get('category');
        if (!Object.hasOwn(SOURCES, category)) { res.writeHead(400); return res.end(); }
        const data = await service.catalog(category);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
        return res.end(req.method === 'HEAD' ? undefined : JSON.stringify(data));
      }
      const imageId = /^\/api\/images\/(dk-\d+)$/.exec(url.pathname)?.[1];
      if (imageId) {
        const image = await service.image(imageId);
        if (!image) { res.writeHead(404); return res.end(); }
        res.writeHead(200, { 'Content-Type': image.type, 'Cache-Control': 'public, max-age=3600' });
        return res.end(req.method === 'HEAD' ? undefined : image.bytes);
      }
      const file = publicFiles.get(url.pathname);
      if (!file) { res.writeHead(404); return res.end(); }
      const bytes = await fs.readFile(path.join(__dirname, file[0]));
      res.writeHead(200, { 'Content-Type': file[1], 'Cache-Control': 'no-cache' });
      res.end(req.method === 'HEAD' ? undefined : bytes);
    } catch {
      res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify({ error: 'دریافت اطلاعات از دیجی‌کالا ممکن نشد؛ دوباره تلاش کنید.' }));
    }
  });
}
if (require.main === module) createServer().listen(Number(process.env.PORT) || 3000, '0.0.0.0');
module.exports = { normalizeProduct, createCatalogService, createServer, MAX_AGE_MS };
