const iconPaths = {
 heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
 arrow:'<path d="M19 12H5m6-6-6 6 6 6"/>',check:'<path d="m5 12 4 4L19 6"/>',award:'<circle cx="12" cy="8" r="5"/><path d="m8 12-1 9 5-3 5 3-1-9"/>',sliders:'<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="2" fill="currentColor"/><circle cx="15" cy="17" r="2" fill="currentColor"/>',external:'<path d="M14 3h7v7m0-7L10 14m0-11H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5"/>',search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',sort:'<path d="M4 6h16M7 12h10m-7 6h4"/>',info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10h.01"/>',bulb:'<path d="M9 18h6m-6 3h6M8 14a6 6 0 1 1 8 0c-1 1-1 2-1 2H9s0-1-1-2Z"/>',grid:'<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',phone:'<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M10 5h4m-3 14h2"/>',laptop:'<rect x="4" y="3" width="16" height="13" rx="2"/><path d="m4 16-2 4h20l-2-4M9 20h6"/>',headphones:'<path d="M4 14v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="12" width="4" height="8" rx="2"/><rect x="17" y="12" width="4" height="8" rx="2"/>',crown:'<path d="m3 6 4 4 5-7 5 7 4-4-2 13H5L3 6Zm2 16h14"/>'
};
const MAX_AGE_MS = 300_000;
const categories = [{id:'all',name:'همه پرفروش‌ها',english:'BEST SELLERS',icon:'grid'},{id:'phones',name:'گوشی موبایل',english:'SMARTPHONES',icon:'phone'},{id:'laptops',name:'لپ‌تاپ',english:'LAPTOPS',icon:'laptop'},{id:'accessories',name:'هدفون و هندزفری',english:'HEADPHONES',icon:'headphones'}];
const snapshot = globalThis.DAH_TA_SNAPSHOT || { catalogs: [] };
const catalogs = new Map(snapshot.catalogs.map(c => [c.category, c]));
const embeddedImages = new Map(snapshot.catalogs.flatMap(c => c.products.map(p => [p.id, p.image])));
const fa = value => Number(value).toLocaleString('fa-IR');
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function icon(name) { return `<svg viewBox="0 0 24 24" aria-hidden="true">${iconPaths[name] || iconPaths.grid}</svg>`; }
function isFresh(checkedAt, now = Date.now()) { const age = now - Date.parse(checkedAt); return Number.isFinite(age) && age >= -60_000 && age < MAX_AGE_MS; }
function allProducts() { return [...catalogs.values()].flatMap(c => c.products.map(p => ({ ...p, checkedAt: c.checkedAt }))); }
function getResults(category, query, sort, saved, onlySaved, products = allProducts()) {
  let list;
  if (onlySaved) list = products.filter(p => saved.has(p.id));
  else if (category === 'all') {
    const groups = categories.slice(1).map(c => products.filter(p => p.category === c.id));
    list = Array.from({length:10}, (_, i) => groups.map(g => g[i])).flat().filter(Boolean).slice(0,10).map((p,i) => ({...p,rank:i+1}));
  } else list = products.filter(p => p.category === category);
  const normalize = s => s.toLowerCase().replace(/ي/g,'ی').replace(/ك/g,'ک').trim();
  const q = normalize(query);
  list = list.filter(p => normalize(`${p.name} ${p.brand} ${p.spec}`).includes(q));
  if (sort === 'price-asc') list.sort((a,b) => a.price-b.price);
  if (sort === 'price-desc') list.sort((a,b) => b.price-a.price);
  if (sort === 'rating') list.sort((a,b) => (b.rating ?? -1)-(a.rating ?? -1));
  return list;
}
function acceptCatalog(data, category) {
  if (data?.category !== category || !Array.isArray(data.products) || !data.products.length || data.products.length > 10 || !isFresh(data.checkedAt)) throw new Error('Invalid catalog');
  const ids = new Set();
  for (const p of data.products) {
    if (!/^dk-\d+$/.test(p.id) || ids.has(p.id) || p.category !== category || typeof p.name !== 'string' || typeof p.brand !== 'string' || typeof p.spec !== 'string' || !Number.isFinite(p.price) || p.price <= 0 || p.url !== `https://www.digikala.com/product/dkp-${p.id.slice(3)}/` || (p.image !== '' && p.image !== `api/images/${p.id}`)) throw new Error('Invalid product');
    ids.add(p.id);
  }
  return data;
}
function priceHtml(p, detail = false, now = Date.now()) {
  if (!isFresh(p.checkedAt, now)) return `<div class="${detail?'detail-price':'price'} price-unavailable">قیمت نیازمند به‌روزرسانی</div>`;
  const discount = p.originalPrice > p.price ? `<div class="old-price-row"><span class="discount">${fa(p.discount)}٪</span><del>${fa(p.originalPrice)}</del></div>` : '';
  return `${detail?'':discount}<div class="${detail?'detail-price':'price'}">${fa(p.price)} <small>تومان</small></div>`;
}
function setup() {
  const $ = s => document.querySelector(s);
  let category = 'all', onlySaved = false, saved = new Set(), refreshing = false, toastTimer, detailId;
  const errors = new Set();
  try { const stored = JSON.parse(localStorage.getItem('dah-ta-saved') || '[]'); if (Array.isArray(stored)) saved = new Set(stored.filter(id => typeof id === 'string' && /^dk-\d+$/.test(id))); } catch {}
  document.querySelectorAll('[data-icon]').forEach(el => el.innerHTML = icon(el.dataset.icon));
  if (snapshot.heroImage) $('.hero-headphone').src = snapshot.heroImage;
  $('#categories').innerHTML = categories.map(c => `<button class="category ${c.id==='all'?'active':''}" data-category="${c.id}" aria-pressed="${c.id==='all'}">${icon(c.icon)}<span><strong>${c.name}</strong><small>${c.english}</small></span></button>`).join('');
  function toast(message) { $('#toast').textContent = message; $('#toast').classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').classList.remove('visible'),2400); }
  function renderDetail(p) {
    $('#dialog-content').innerHTML = `<img class="detail-image" data-product-image="${p.id}" src="${escapeHtml(p.image || embeddedImages.get(p.id) || '')}" alt="${escapeHtml(p.name)}"><div class="product-brand">${escapeHtml(p.brand)}</div><h2 class="detail-title">${escapeHtml(p.name)}</h2><p class="detail-specs">${escapeHtml(p.spec)} ${p.rating === null?'· بدون امتیاز':`· امتیاز ${fa(p.rating)} از ۵ (${fa(p.reviewCount)} نظر)`}</p>${priceHtml(p,true)}<p class="detail-note">آخرین دریافت: ${escapeHtml(new Date(p.checkedAt).toLocaleString('fa-IR'))}. قیمت مربوط به پیشنهاد فروشنده در زمان دریافت است و تا نهایی‌شدن خرید ممکن است تغییر کند.</p><a class="primary-button" target="_blank" rel="noopener noreferrer" href="${escapeHtml(p.url)}">مشاهده و خرید در دیجی‌کالا ${icon('external')}</a>`;
  }
  function render() {
    const all = allProducts();
    const relevant = onlySaved ? all.filter(p => saved.has(p.id)) : category === 'all' ? all : all.filter(p => p.category === category);
    const stale = relevant.some(p => !isFresh(p.checkedAt));
    for (const option of $('#sort').options) if (option.value.startsWith('price')) option.disabled = stale;
    if (stale && $('#sort').value.startsWith('price')) $('#sort').value = 'rank';
    const list = getResults(category,$('#search').value,$('#sort').value,saved,onlySaved);
    $('#saved-count').textContent = fa(saved.size);
    $('#result-title').textContent = onlySaved?'انتخاب‌های ذخیره‌شده':category==='all'?'۱۰ انتخاب از پرفروش‌ها':`پرفروش‌های ${categories.find(c => c.id === category).name}`;
    $('#result-count').textContent = `${fa(list.length)} محصول`;
    $('#empty-state').hidden = list.length > 0;
    $('#product-grid').innerHTML = list.map(p => `<article class="product-card"><div class="card-top"><span class="rank ${p.rank===1?'first':''}">${p.rank===1?icon('crown'):''} ${category==='all'?'انتخاب':'رتبه'} ${fa(p.rank)}</span><button class="favorite ${saved.has(p.id)?'selected':''}" data-save="${p.id}" aria-label="${saved.has(p.id)?'حذف از':'افزودن به'} ذخیره‌شده‌ها: ${escapeHtml(p.name)}" aria-pressed="${saved.has(p.id)}">${icon('heart')}</button></div><button class="product-image-button" data-detail="${p.id}" aria-label="جزئیات ${escapeHtml(p.name)}"><img class="product-image" data-product-image="${p.id}" src="${escapeHtml(p.image || embeddedImages.get(p.id) || '')}" alt="${escapeHtml(p.name)}" loading="lazy" width="220" height="170"></button><span class="product-brand">${escapeHtml(p.brand)}</span><button class="product-name" data-detail="${p.id}">${escapeHtml(p.name)}</button><div class="card-meta"><span class="spec">${escapeHtml(p.spec)}</span><span class="rating">${p.rating === null?'بدون امتیاز':`${fa(p.rating)} <span class="star">★</span>`}</span></div><div class="price-section">${priceHtml(p)}<a class="buy-link" href="${escapeHtml(p.url)}" target="_blank" rel="noopener noreferrer">مشاهده در دیجی‌کالا ${icon('external')}</a></div></article>`).join('');
    document.querySelectorAll('[data-category]').forEach(el => { const active = !onlySaved && el.dataset.category === category; el.classList.toggle('active',active); el.setAttribute('aria-pressed',String(active)); });
    const times = relevant.map(p => Date.parse(p.checkedAt)).filter(Number.isFinite);
    const oldest = times.length ? new Date(Math.min(...times)).toLocaleString('fa-IR') : '';
    const failed = (category === 'all' || onlySaved) ? errors.size > 0 : errors.has(category);
    $('#data-status').textContent = refreshing?'در حال دریافت قیمت‌ها از دیجی‌کالا…':failed?`اتصال به‌روزرسانی برقرار نشد.${stale?' قیمت‌های قدیمی پنهان شدند.':''} برای دریافت خودکار، سرویس سروری سایت باید فعال باشد.`:stale?'اطلاعات ذخیره‌شده قدیمی شده؛ تا دریافت اطلاعات تازه، قیمت نمایش داده نمی‌شود.':`آخرین دریافت: ${oldest} · بررسی خودکار هر ۶۰ ثانیه · قیمت نهایی در دیجی‌کالا`;
    $('#connection-status').textContent = refreshing?'در حال همگام‌سازی':failed?'اتصال برقرار نیست':stale?'نیازمند به‌روزرسانی':'اطلاعات دریافت‌شده';
    $('#refresh').disabled = refreshing;
    if ($('#details').open && detailId) { const p = all.find(p => p.id === detailId); if (p) renderDetail(p); else { $('#dialog-content').innerHTML = '<p class="detail-note">این محصول دیگر در فهرست فعلی نیست. برای قیمت روز، صفحه محصول را در دیجی‌کالا بررسی کنید.</p>'; } }
  }
  async function refresh() {
    if (refreshing || document.hidden) return;
    refreshing = true; render();
    await Promise.all(categories.slice(1).map(async c => {
      try {
        const response = await fetch(`api/catalog?category=${c.id}`,{ cache:'no-store', signal:AbortSignal.timeout(25_000) });
        if (!response.ok) throw new Error('Unavailable');
        const data = acceptCatalog(await response.json(),c.id);
        catalogs.set(c.id,data); errors.delete(c.id);
      } catch { errors.add(c.id); }
    }));
    refreshing = false; render();
  }
  function openAbout() {
    detailId = null;
    $('#dialog-content').innerHTML = '<div class="about-copy"><div class="section-kicker">شفافیت، قبل از هر انتخاب</div><h2>پرفروش‌ها، با اطلاعات واقعی</h2><p>ده‌تا مستقل از دیجی‌کالاست. فهرست هر دسته از ترتیب «پرفروش‌ترین» دیجی‌کالا و از میان کالاهای موجود، حداکثر ۱۰ محصول را نمایش می‌دهد؛ این ترتیب به معنی بهترین کیفیت مطلق نیست.</p><ul><li>قیمت، تخفیف و امتیاز مستقیماً از داده‌های عمومی دیجی‌کالا دریافت می‌شوند. قیمت ریالی منبع به تومان تبدیل می‌شود.</li><li>هنگام بازبودن صفحه، هر ۶۰ ثانیه دریافت اطلاعات بررسی می‌شود. حافظهٔ موقت سرور حداکثر ۶۰ ثانیه است.</li><li>اگر دریافت قطع شود، زمان آخرین دریافت مشخص است و قیمت‌های بیش از ۵ دقیقه نمایش داده نمی‌شوند.</li><li>تصاویر واقعی محصولات از سرویس همین سایت بارگذاری می‌شوند. نسخهٔ تعبیه‌شدهٔ تصویر نیز برای محصولات اولیه موجود است.</li></ul><p class="detail-note">به‌روزرسانی خودکار به اجرای سرویس سروری سایت و دسترسی آن به دیجی‌کالا وابسته است. قیمت فروشنده، موجودی و شرایط ارسال ممکن است پیش از خرید تغییر کنند.</p></div>';
    $('#details').showModal();
  }
  document.addEventListener('error',e => {
    const img = e.target;
    if (img.tagName !== 'IMG' || !img.dataset.productImage) return;
    const fallback = embeddedImages.get(img.dataset.productImage);
    if (fallback && !img.dataset.usedFallback && img.getAttribute('src') !== fallback) { img.dataset.usedFallback = 'true'; img.src = fallback; }
    else { img.hidden = true; const text = document.createElement('span'); text.className = 'image-unavailable'; text.textContent = 'تصویر در دسترس نیست'; img.after(text); }
  },true);
  document.addEventListener('click',e => {
    const cat = e.target.closest('[data-category]');
    if (cat) { category = cat.dataset.category; onlySaved = false; $('#search').value = ''; render(); }
    const save = e.target.closest('[data-save]');
    if (save) { const id = save.dataset.save; saved.has(id)?saved.delete(id):saved.add(id); let persistent = true; try { localStorage.setItem('dah-ta-saved',JSON.stringify([...saved])); } catch { persistent = false; } render(); toast(persistent?(saved.has(id)?'به انتخاب‌های ذخیره‌شده اضافه شد':'از ذخیره‌شده‌ها حذف شد'):'انتخاب در این صفحه ثبت شد؛ مرورگر اجازه ذخیره دائمی نمی‌دهد.'); }
    const detail = e.target.closest('[data-detail]');
    if (detail) { const p = allProducts().find(p => p.id === detail.dataset.detail); if (p) { detailId = p.id; renderDetail(p); $('#details').showModal(); } }
    const action = e.target.closest('[data-action]')?.dataset.action;
    if (action === 'about') openAbout();
    if (action === 'close') $('#details').close();
    if (action === 'saved') { onlySaved = !onlySaved; render(); $('#products').scrollIntoView({behavior:'smooth'}); }
    if (action === 'refresh') refresh();
    if (action === 'reset') { onlySaved = false; category = 'all'; $('#search').value = ''; $('#sort').value = 'rank'; render(); }
  });
  $('#details').addEventListener('click',e => { if (e.target === $('#details')) { const r = e.target.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) e.target.close(); } });
  $('#search').addEventListener('input',render); $('#sort').addEventListener('change',render);
  document.addEventListener('visibilitychange',() => { if (!document.hidden) refresh(); });
  render(); refresh();
  setInterval(() => { if (!document.hidden) refresh(); },60_000);
  setInterval(() => { if (!document.hidden) render(); },15_000);
}
if (typeof document !== 'undefined') setup();
if (typeof module !== 'undefined') module.exports = { categories, getResults, isFresh, priceHtml, acceptCatalog, escapeHtml };
