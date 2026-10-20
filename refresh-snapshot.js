const fs = require('node:fs/promises');
const { createCatalogService } = require('./server.js');

async function refreshSnapshot() {
  const service = createCatalogService();
  const catalogs = await Promise.all(['phones', 'laptops', 'accessories'].map(c => service.catalog(c)));
  for (const catalog of catalogs) {
    await Promise.all(catalog.products.map(async p => {
      try {
        const image = await service.image(p.id);
        p.image = image ? `data:${image.type};base64,${image.bytes.toString('base64')}` : '';
      } catch { p.image = ''; }
    }));
  }
  const hero = await fs.readFile(`${__dirname}/assets/apple-airpods-max-silver.webp`);
  const snapshot = { catalogs, heroImage: `data:image/webp;base64,${hero.toString('base64')}` };
  await fs.writeFile(`${__dirname}/catalog-snapshot.js`, `globalThis.DAH_TA_SNAPSHOT = ${JSON.stringify(snapshot).replace(/</g, '\\u003c')};\n`);
  console.log(`Saved ${catalogs.reduce((n, c) => n + c.products.length, 0)} live products with embedded images.`);
}
refreshSnapshot().catch(() => { console.error('Catalog snapshot could not be refreshed.'); process.exitCode = 1; });
