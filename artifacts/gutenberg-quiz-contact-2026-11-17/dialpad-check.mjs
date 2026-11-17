import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const { chromium } = createRequire('D:/works/lenremont-gutenberg/package.json')('playwright');
const browser = await chromium.launch({ channel: 'chromium', args: ['--no-proxy-server'] });
try {
  const page = await browser.newPage({ viewport: { width: 375, height: 900 } });
  await page.goto('http://127.0.0.1:4322/', { waitUntil: 'domcontentloaded' });
  const forms = await page.locator('[data-lr-form]').evaluateAll(forms => forms.map(form => {
    const phone = form.querySelector('[data-lr-phone]');
    const key = form.querySelector('[data-lr-digit="1"]');
    const style = getComputedStyle(key);
    return { align: getComputedStyle(phone).textAlign, keyboard: [style.minHeight, style.borderRadius, style.backgroundColor, style.color, style.fontSize] };
  }));
  assert.ok(forms.length > 1);
  for (const form of forms) {
    assert.equal(form.align, 'center');
    assert.deepEqual(form.keyboard, forms[0].keyboard);
  }
  console.log(`PASS: centered phone text and matching keypad styles in ${forms.length} forms`);
} finally { await browser.close(); }
