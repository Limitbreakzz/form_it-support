import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER PAGEERROR:', err.message));
  
  await page.goto('http://127.0.0.1:3100', { waitUntil: 'networkidle' });
  console.log('Loaded home');
  await page.click('button:has-text("กรอกใบแจ้งซ่อม")');
  await page.waitForTimeout(600);
  
  const headings = await page.locator('h1, h2').allTextContents();
  console.log('Headings:', headings);
  
  const comboboxes = await page.locator('button[role="combobox"]').count();
  console.log('Comboboxes found:', comboboxes);

  if (comboboxes === 0) {
    const selects = await page.locator('select').count();
    console.log('Select elements found:', selects);
  }
  
  await browser.close();
})();

