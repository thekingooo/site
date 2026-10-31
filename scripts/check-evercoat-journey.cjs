const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const url = process.env.EVERCOAT_URL || 'http://127.0.0.1:3340';
const output = process.env.EVERCOAT_QA_DIR || path.join(__dirname, '../test-results/evercoat-journey');
fs.mkdirSync(output, { recursive: true });

(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
  const errors = [], results = [];
  async function open(viewport, options = {}) {
    const page = await browser.newPage({ viewport, ...options });
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(url);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(200);
    return page;
  }
  async function scrollProgress(page, fraction) {
    await page.evaluate(fraction => {
      const section = document.getElementById('process');
      const pin = section.querySelector('.process-pin');
      const header = document.querySelector('.header').offsetHeight;
      window.scrollTo({ top: scrollY + section.getBoundingClientRect().top - header + fraction * (section.offsetHeight - pin.offsetHeight), behavior: 'instant' });
    }, fraction);
    await page.waitForTimeout(1000);
    return page.locator('.road-step[aria-current="step"]').getAttribute('data-step');
  }
  const desktop = await open({ width: 1440, height: 900 });
  assert.equal(await desktop.locator('.trust>div').count(), 5);
  assert.equal(await desktop.locator('#about').count(), 0);
  assert.equal(await desktop.locator('#navigation a[href="#spaces"]').textContent(), 'О компании');
  assert.match(await desktop.locator('[data-project="0"] img').getAttribute('src'), /el-machete-01/);
  assert.match(await desktop.locator('[data-project="2"] img').getAttribute('src'), /demokrat-04/);
  const checkbox = desktop.getByRole('checkbox', { name: 'Без анимации' });
  await checkbox.check();
  assert.equal(await desktop.evaluate(() => window.fpFlight.reduced), true);
  assert.equal(await desktop.locator('.motion-box svg').evaluate(el => getComputedStyle(el).opacity), '1');
  await desktop.screenshot({ path: path.join(output, 'hero-checkbox.png') });
  await checkbox.focus();
  await desktop.keyboard.press('Space');
  assert.equal(await checkbox.isChecked(), false);
  assert.equal(await desktop.evaluate(() => window.fpFlight.reduced), false);
  assert.equal(await desktop.locator('.motion-box svg').evaluate(el => getComputedStyle(el).opacity), '0');
  await desktop.locator('.trust').screenshot({ path: path.join(output, 'trust.png') });
  assert.equal(await desktop.locator('#process').getAttribute('data-pin'), 'true');
  for (const [fraction, expected] of [[0, '0'], [0.5, '4'], [1, '8'], [0, '0']]) {
    const step = await scrollProgress(desktop, fraction);
    assert.equal(step, expected);
    results.push({ fraction, step });
    await desktop.screenshot({ path: path.join(output, `route-${fraction}.png`) });
  }
  await desktop.locator('.road-step[data-step="6"]').click();
  await desktop.waitForTimeout(1200);
  assert.equal(await desktop.locator('.road-step[aria-current="step"]').getAttribute('data-step'), '6');
  assert.ok(Number(await desktop.locator('.road-fill').evaluate(el => el.style.strokeDashoffset)) > 0);
  await scrollProgress(desktop, 1);
  assert.equal(await desktop.locator('.road-step[aria-current="step"]').getAttribute('data-step'), '8');
  assert.equal(await desktop.locator('.journey-footer').count(), 0);
  assert.equal(await desktop.locator('#process').evaluate(el => el.classList.contains('is-complete')), true);
  await desktop.locator('.contact-map').scrollIntoViewIfNeeded();
  await desktop.locator('.contact-map img').evaluate(img => img.decode());
  const mapUrl = new URL(await desktop.locator('.contact-map').getAttribute('href'));
  assert.equal(mapUrl.hostname, 'yandex.ru');
  assert.equal(mapUrl.searchParams.get('ll'), '55.9721,54.7388');
  await desktop.locator('.contact-map').screenshot({ path: path.join(output, 'ufa-map.png') });

  for (const width of [320, 390, 768, 1024]) {
    const page = await open({ width, height: 844 }, { isMobile: width < 1000, hasTouch: width < 1000 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    if (width < 1000) {
      assert.equal(await page.locator('#process').getAttribute('data-pin'), 'false');
      const positions = await page.locator('.road-step').evaluateAll(steps => steps.map(step => step.getBoundingClientRect().top));
      assert.ok(positions.every((top, i) => i === 0 || top > positions[i - 1]));
      await page.locator('.road-step').last().evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
      await page.waitForTimeout(1000);
      assert.equal(await page.locator('.road-step[aria-current="step"]').getAttribute('data-step'), '8');
      if (width === 390) await page.screenshot({ path: path.join(output, 'mobile-finish.png') });
    }
    results.push({ width, overflow: false, pinned: await page.locator('#process').getAttribute('data-pin') });
    await page.close();
  }
  const reduced = await open({ width: 1440, height: 900 }, { reducedMotion: 'reduce' });
  assert.equal(await reduced.getByRole('checkbox', { name: 'Без анимации' }).isChecked(), true);
  assert.equal(await reduced.locator('#process').getAttribute('data-pin'), 'false');
  assert.equal(await reduced.locator('.road-step[aria-current="step"]').getAttribute('data-step'), '8');
  assert.equal(await reduced.locator('.road-fill').evaluate(el => el.style.strokeDashoffset), '0');
  assert.deepEqual(errors, []);
  fs.writeFileSync(path.join(output, 'journey-results.json'), JSON.stringify({ passed: true, errors, results }, null, 2));
  console.log('PASS journey, checkbox, covers, company, map and responsive layout');
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
