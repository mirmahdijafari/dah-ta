const iconPaths = {
 heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
 arrow:'<path d="M19 12H5m6-6-6 6 6 6"/>',check:'<path d="m5 12 4 4L19 6"/>',award:'<circle cx="12" cy="8" r="5"/><path d="m8 12-1 9 5-3 5 3-1-9"/>',sliders:'<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="2" fill="currentColor"/><circle cx="15" cy="17" r="2" fill="currentColor"/>',external:'<path d="M14 3h7v7m0-7L10 14m0-11H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5"/>',search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',sort:'<path d="M4 6h16M7 12h10m-7 6h4"/>',info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10h.01"/>',bulb:'<path d="M9 18h6m-6 3h6M8 14a6 6 0 1 1 8 0c-1 1-1 2-1 2H9s0-1-1-2Z"/>',grid:'<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',phone:'<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M10 5h4m-3 14h2"/>',laptop:'<rect x="4" y="3" width="16" height="13" rx="2"/><path d="m4 16-2 4h20l-2-4M9 20h6"/>',headphones:'<path d="M4 14v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="12" width="4" height="8" rx="2"/><rect x="17" y="12" width="4" height="8" rx="2"/>',crown:'<path d="m3 6 4 4 5-7 5 7 4-4-2 13H5L3 6Zm2 16h14"/>'
};
function icon(name){return `<svg viewBox="0 0 24 24" aria-hidden="true">${iconPaths[name] || iconPaths.grid}</svg>`;}
const fa = value => Number(value).toLocaleString('fa-IR');
const image = slug => `assets/${slug}.webp`;
const definitions = {
 phones:[
 ['گوشی اپل مدل iPhone 13 Pro','Apple','iphone-13-pro',58900000,'حافظه ۲۵۶ گیگابایت'],
 ['گوشی سامسونگ مدل Galaxy S10','Samsung','samsung-galaxy-s10',18500000,'حافظه ۱۲۸ گیگابایت'],
 ['گوشی اپو مدل F19 Pro Plus','Oppo','oppo-f19-pro-plus',12700000,'رم ۸ گیگابایت'],
 ['گوشی ریلمی مدل XT','Realme','realme-xt',11200000,'حافظه ۱۲۸ گیگابایت'],
 ['گوشی ویوو مدل X21','Vivo','vivo-x21',9800000,'حافظه ۱۲۸ گیگابایت'],
 ['گوشی اپل مدل iPhone X','Apple','iphone-x',22000000,'حافظه ۲۵۶ گیگابایت'],
 ['گوشی سامسونگ مدل Galaxy S8','Samsung','samsung-galaxy-s8',10400000,'حافظه ۶۴ گیگابایت'],
 ['گوشی ریلمی مدل C35','Realme','realme-c35',8300000,'باتری ۵۰۰۰ میلی‌آمپر'],
 ['گوشی اپو مدل A57','Oppo','oppo-a57',7500000,'حافظه ۶۴ گیگابایت'],
 ['گوشی ویوو مدل S1','Vivo','vivo-s1',9100000,'حافظه ۱۲۸ گیگابایت']
 ],
 laptops:[
 ['لپ‌تاپ اپل MacBook Pro 14','Apple','apple-macbook-pro-14-inch-space-grey',98500000,'رم ۱۶ · حافظه ۵۱۲'],
 ['لپ‌تاپ ایسوس Zenbook Pro Duo','Asus','asus-zenbook-pro-dual-screen-laptop',87000000,'رم ۱۶ · حافظه ۱ ترابایت'],
 ['لپ‌تاپ دل مدل XPS 13 9300','Dell','new-dell-xps-13-9300-laptop',76500000,'رم ۱۶ · حافظه ۵۱۲'],
 ['لپ‌تاپ هواوی MateBook X Pro','Huawei','huawei-matebook-x-pro',64000000,'رم ۱۶ · حافظه ۵۱۲'],
 ['لپ‌تاپ لنوو مدل Yoga 920','Lenovo','lenovo-yoga-920',43500000,'رم ۸ · حافظه ۲۵۶'],
 ['لپ‌تاپ اپل MacBook Pro 14 یک ترابایت','Apple','apple-macbook-pro-14-inch-space-grey',112000000,'رم ۱۶ · حافظه ۱ ترابایت'],
 ['لپ‌تاپ ایسوس Zenbook Pro Duo حرفه‌ای','Asus','asus-zenbook-pro-dual-screen-laptop',102000000,'رم ۳۲ · حافظه ۱ ترابایت'],
 ['لپ‌تاپ دل مدل XPS 13 یک ترابایت','Dell','new-dell-xps-13-9300-laptop',82000000,'رم ۱۶ · حافظه ۱ ترابایت'],
 ['لپ‌تاپ هواوی MateBook X Pro یک ترابایت','Huawei','huawei-matebook-x-pro',70500000,'رم ۱۶ · حافظه ۱ ترابایت'],
 ['لپ‌تاپ لنوو Yoga 920 نسخه ۵۱۲','Lenovo','lenovo-yoga-920',48000000,'رم ۱۶ · حافظه ۵۱۲']
 ],
 accessories:[
 ['هدفون بی‌سیم اپل AirPods Max','Apple','apple-airpods-max-silver',32500000,'حذف نویز فعال'],
 ['هدفون بی‌سیم اپل AirPods','Apple','apple-airpods',8900000,'اتصال بی‌سیم بلوتوث'],
 ['اسپیکر هوشمند اپل HomePod Mini','Apple','apple-homepod-mini-cosmic-grey',7200000,'صدای ۳۶۰ درجه'],
 ['ساعت هوشمند اپل Watch Series 4','Apple','apple-watch-series-4-gold',13500000,'پایش سلامت و ورزش'],
 ['هدفون بی‌سیم بیتس مدل Flex','Beats','beats-flex-wireless-earphones',3500000,'شارژدهی ۱۲ ساعته'],
 ['اسپیکر هوشمند آمازون Echo Plus','Amazon','amazon-echo-plus',6900000,'دستیار صوتی الکسا'],
 ['شارژر بی‌سیم اپل AirPower','Apple','apple-airpower-wireless-charger',2700000,'شارژ بی‌سیم'],
 ['پاوربانک اپل MagSafe Battery Pack','Apple','apple-magsafe-battery-pack',5400000,'اتصال مغناطیسی'],
 ['شارژر دیواری اپل iPhone Charger','Apple','apple-iphone-charger',1250000,'سبک و قابل حمل'],
 ['قاب سیلیکونی اپل iPhone 12 MagSafe','Apple','iphone-12-silicone-case-with-magsafe-plum',980000,'پشتیبانی از مگ‌سیف']
 ]
};
const products = Object.entries(definitions).flatMap(([category,items]) => items.map((p,i)=>({id:`${category}-${i}`,category,name:p[0],brand:p[1],image:image(p[2]),price:p[3],spec:p[4],rank:i+1,rating:Number((4.9-i*.07).toFixed(1)),discount:[12,8,6,15,10,5,9,7,11,4][i]})));
const featuredIds=['phones-0','accessories-0','laptops-0','accessories-3','accessories-1','phones-1','laptops-1','accessories-2','phones-2','accessories-4'];
const categories=[{id:'all',name:'همه بهترین‌ها',english:'ALL THE BEST',icon:'grid'},{id:'phones',name:'گوشی موبایل',english:'SMARTPHONES',icon:'phone'},{id:'laptops',name:'لپ‌تاپ',english:'LAPTOPS',icon:'laptop'},{id:'accessories',name:'لوازم جانبی و صدا',english:'AUDIO & ACCESSORIES',icon:'headphones'}];
function getResults(category,query,sort,saved,onlySaved){
 let list=onlySaved?products.filter(p=>saved.has(p.id)):category==='all'?featuredIds.map(id=>products.find(p=>p.id===id)).map((p,i)=>({...p,rank:i+1})):products.filter(p=>p.category===category);
 const normalize=s=>s.toLowerCase().replace(/ي/g,'ی').replace(/ك/g,'ک').trim();
 const q=normalize(query);list=list.filter(p=>normalize(`${p.name} ${p.brand} ${p.spec}`).includes(q));
 if(sort==='price-asc') list.sort((a,b)=>a.price-b.price);
 if(sort==='price-desc') list.sort((a,b)=>b.price-a.price);
 if(sort==='rating') list.sort((a,b)=>b.rating-a.rating);
 return list;
}
function searchUrl(p){return `https://www.digikala.com/search/?q=${encodeURIComponent(p.name)}`;}
function setup(){
 const $=s=>document.querySelector(s);let category='all',onlySaved=false,saved=new Set();let toastTimer;
 try{const stored=JSON.parse(localStorage.getItem('dah-ta-saved')||'[]');if(Array.isArray(stored))saved=new Set(stored.filter(id=>products.some(p=>p.id===id)));}catch{}
 document.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=icon(el.dataset.icon));
 $('#categories').innerHTML=categories.map(c=>`<button class="category ${c.id==='all'?'active':''}" data-category="${c.id}" aria-pressed="${c.id==='all'}">${icon(c.icon)}<span><strong>${c.name}</strong><small>${c.english}</small></span></button>`).join('');
 function toast(message){$('#toast').textContent=message;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),2400);}
 function render(){
 const list=getResults(category,$('#search').value,$('#sort').value,saved,onlySaved);
 $('#saved-count').textContent=fa(saved.size);$('#result-title').textContent=onlySaved?'انتخاب‌های ذخیره‌شده':category==='all'?'۱۰ انتخاب برتر':`۱۰ ${categories.find(c=>c.id===category).name} برتر`;
 $('#result-count').textContent=`${fa(list.length)} محصول`;$('#empty-state').hidden=list.length>0;
 $('#product-grid').innerHTML=list.map(p=>`<article class="product-card"><div class="card-top"><span class="rank ${p.rank===1?'first':''}">${p.rank===1?icon('crown'):''} رتبه ${fa(p.rank)}</span><button class="favorite ${saved.has(p.id)?'selected':''}" data-save="${p.id}" aria-label="${saved.has(p.id)?'حذف از':'افزودن به'} ذخیره‌شده‌ها: ${p.name}" aria-pressed="${saved.has(p.id)}">${icon('heart')}</button></div><button class="product-image-button" data-detail="${p.id}" aria-label="جزئیات ${p.name}"><img class="product-image" src="${p.image}" alt="${p.name}" loading="lazy" width="220" height="170"></button><span class="product-brand">${p.brand.toUpperCase()}</span><button class="product-name" data-detail="${p.id}">${p.name}</button><div class="card-meta"><span class="spec">${p.spec}</span><span class="rating">${fa(p.rating)} <span class="star">★</span></span></div><div class="price-section"><div class="old-price-row"><span class="discount">${fa(p.discount)}٪</span><del>${fa(Math.round(p.price/(1-p.discount/100)/10000)*10000)}</del></div><div class="price">${fa(p.price)} <small>تومان</small></div><a class="buy-link" href="${searchUrl(p)}" target="_blank" rel="noopener noreferrer">جست‌وجو در دیجی‌کالا ${icon('external')}</a></div></article>`).join('');
 document.querySelectorAll('[data-category]').forEach(el=>{const active=!onlySaved&&el.dataset.category===category;el.classList.toggle('active',active);el.setAttribute('aria-pressed',String(active));});
 }
 function openAbout(){ $('#dialog-content').innerHTML='<div class="about-copy"><div class="section-kicker">شفافیت، قبل از هر انتخاب</div><h2>پشت انتخاب‌های ده‌تا چیست؟</h2><p>ده‌تا یک طرح مستقل برای ساده‌تر کردن کشف و مقایسه محصولات الکترونیکی است و وابستگی رسمی به دیجی‌کالا ندارد.</p><ul><li>در این نسخه، هر دسته ۱۰ محصول نمونه دارد. قیمت‌ها، امتیازها، تخفیف‌ها و ترتیب رتبه‌ها صرفاً برای نمایش رابط کاربری هستند.</li><li>تصاویر از کاتالوگ عمومی DummyJSON استفاده شده‌اند. مدل‌ها و پیکربندی‌ها نمونه‌اند و موجودی آن‌ها تأیید نشده است.</li><li>دکمه هر محصول، جست‌وجوی همان نام را در دیجی‌کالا باز می‌کند؛ نه صفحه یک کالای تأییدشده.</li></ul><p class="detail-note">برای رتبه‌بندی واقعی و به‌روزرسانی خودکار، اتصال به یک منبع دادهٔ مجاز دیجی‌کالا لازم است. پیش از خرید، اطلاعات روز را در فروشگاه بررسی کنید.</p></div>';$('#details').showModal();}
 document.addEventListener('click',e=>{
 const cat=e.target.closest('[data-category]');if(cat){category=cat.dataset.category;onlySaved=false;$('#search').value='';render();}
 const save=e.target.closest('[data-save]');if(save){const id=save.dataset.save;saved.has(id)?saved.delete(id):saved.add(id);try{localStorage.setItem('dah-ta-saved',JSON.stringify([...saved]));}catch{toast('مرورگر اجازه ذخیره دائمی نمی‌دهد.');}render();toast(saved.has(id)?'به انتخاب‌های ذخیره‌شده اضافه شد':'از ذخیره‌شده‌ها حذف شد');}
 const detail=e.target.closest('[data-detail]');if(detail){const p=products.find(p=>p.id===detail.dataset.detail);$('#dialog-content').innerHTML=`<img class="detail-image" src="${p.image}" alt="${p.name}"><div class="product-brand">${p.brand.toUpperCase()}</div><h2 class="detail-title">${p.name}</h2><p class="detail-specs">${p.spec} · امتیاز نمونه ${fa(p.rating)} از ۵</p><div class="detail-price">${fa(p.price)} <small>تومان</small></div><p class="detail-note">اطلاعات این محصول نمایشی است. موجودی، مشخصات دقیق و قیمت روز را در دیجی‌کالا بررسی کنید.</p><a class="primary-button" target="_blank" rel="noopener noreferrer" href="${searchUrl(p)}">جست‌وجو در دیجی‌کالا ${icon('external')}</a>`;$('#details').showModal();}
 const action=e.target.closest('[data-action]')?.dataset.action;
 if(action==='about')openAbout();
 if(action==='close')$('#details').close();
 if(action==='saved'){onlySaved=!onlySaved;render();$('#products').scrollIntoView({behavior:'smooth'});}
 if(action==='reset'){onlySaved=false;category='all';$('#search').value='';$('#sort').value='rank';render();}
 });
 $('#details').addEventListener('click',e=>{if(e.target===$('#details')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
 $('#search').addEventListener('input',render);$('#sort').addEventListener('change',render);render();
}
if(typeof document!=='undefined')setup();
if(typeof module!=='undefined')module.exports={products,categories,getResults,featuredIds,searchUrl};
