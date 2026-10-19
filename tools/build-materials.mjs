// Vygeneruje PDF materiálov pre učiteľov z HTML v priečinku materials/ (sk/, en/).
// Spustenie: node tools/build-materials.mjs  (vyžaduje balík playwright a prehliadač Chromium).
import { readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'materials');
const browser = await chromium.launch();
const page = await browser.newPage();
for (const lang of ['sk', 'en']) {
  for (const file of readdirSync(join(root, lang)).filter((f) => f.endsWith('.html'))) {
    const src = join(root, lang, file);
    await page.goto(pathToFileURL(src).href, { waitUntil: 'load' });
    const out = src.replace(/\.html$/, '.pdf');
    await page.pdf({ path: out, preferCSSPageSize: true, printBackground: true });
    console.log('PDF:', out);
  }
}
await browser.close();
