const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const sharp = require('sharp');

const url = process.env.EVERCOAT_URL || 'http://127.0.0.1:3340/';
const dir = process.env.EVERCOAT_QA_DIR || path.join(__dirname, '../test-results/evercoat-seo');
const baseline = process.env.EVERCOAT_BASELINE_HTML;
fs.mkdirSync(dir, { recursive: true });

(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
  const errors = [], visual = [];
  try {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    const canonical = page.locator('link[rel=canonical]');
    assert.equal(await canonical.count(), 1);
    const mainUrl = await canonical.getAttribute('href');
    assert.equal(mainUrl, 'https://fp-group.su/');
    const websiteLink = page.locator('.footer-details a[href^="https://"]');
    assert.equal(await websiteLink.getAttribute('href'), mainUrl);
    assert.equal(await websiteLink.textContent(), new URL(mainUrl).hostname);
    assert.equal(await page.title(), 'FP Group — ремонт коммерческих помещений');
    assert.equal(await page.locator('meta[name=description]').count(), 1);
    assert.equal(await page.locator('meta[property="og:url"]').getAttribute('content'), mainUrl);
    const robotsMeta = await page.locator('meta[name=robots]').getAttribute('content');
    assert.ok(!robotsMeta.includes('noindex') && !robotsMeta.includes('nofollow'));

    const structured = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent());
    assert.equal(structured['@context'], 'https://schema.org');
    const graph = structured['@graph'];
    const company = graph.find(node => node['@type'] === 'GeneralContractor');
    assert.equal(company.url, mainUrl);
    assert.equal(await page.locator(`.footer a[href="mailto:${company.email}"]`).count(), 1);
    for (const contact of company.contactPoint) {
      assert.equal(await page.locator(`.footer a[href="tel:${contact.telephone}"]`).count(), 1);
    }
    const address = await page.locator('.footer-details').innerText();
    assert.ok(address.includes(company.address.addressLocality));
    assert.ok(address.includes(company.address.addressRegion));
    assert.ok(address.replace(/\s+/g, ' ').includes(company.address.streetAddress));
    for (const node of graph) assert.equal(node.url, mainUrl);

    const robotsResponse = await page.request.get(new URL('robots.txt', url).href);
    assert.equal(robotsResponse.status(), 200);
    const robots = await robotsResponse.text();
    assert.match(robots, /^User-agent: \*$/m);
    assert.match(robots, /^Allow: \/$/m);
    assert.ok(robots.includes(`Sitemap: ${mainUrl}sitemap.xml`));
    assert.ok(!/^Disallow:\s*\/\s*$/m.test(robots));
    const sitemapResponse = await page.request.get(new URL('sitemap.xml', url).href);
    assert.equal(sitemapResponse.status(), 200);
    const locations = await page.evaluate(xml => {
      const doc = new DOMParser().parseFromString(xml, 'application/xml');
      if (doc.querySelector('parsererror')) throw Error('Invalid sitemap XML');
      return [...doc.querySelectorAll('loc')].map(node => node.textContent);
    }, await sitemapResponse.text());
    assert.deepEqual(locations, [mainUrl]);

    const images = await page.locator('meta[property="og:image"],meta[name="twitter:image"]').evaluateAll(es => es.map(e => e.content));
    assert.equal(new Set(images).size, 1);
    for (const imageUrl of [...new Set(images), company.logo]) {
      assert.equal(new URL(imageUrl).origin, new URL(mainUrl).origin);
      const response = await page.request.get(new URL(new URL(imageUrl).pathname.slice(1), url).href);
      assert.equal(response.status(), 200);
      assert.match(response.headers()['content-type'], /^image\//);
      const dimensions = await sharp(await response.body()).metadata();
      if (images.includes(imageUrl)) {
        assert.equal(dimensions.width, Number(await page.locator('meta[property="og:image:width"]').getAttribute('content')));
        assert.equal(dimensions.height, Number(await page.locator('meta[property="og:image:height"]').getAttribute('content')));
      }
    }
    assert.equal(await page.locator('h1').count(), 1);
    const heading = (await page.locator('h1').innerText()).trim();
    assert.equal(heading, 'РЕМОНТ И ОТДЕЛКА КОММЕРЧЕСКИХ ПРОСТРАНСТВ');
    assert.ok(await page.locator('h1').isVisible());
    for (let room = 1; room < 5; room++) {
      await page.locator('.flight-route>button').nth(room).click();
      await page.waitForFunction(room => window.fpFlight.room === room && !window.fpFlight.busy, room);
      assert.equal((await page.locator('h1').innerText()).trim(), heading);
    }

    // Optional before/after screenshots prove the semantic heading change has no visual effect.
    if (baseline) {
      const before = await context.newPage();
      before.on('pageerror', error => errors.push(error.message));
      const beforeUrl = new URL('seo-before.html', url).href;
      await before.route(beforeUrl, route => route.fulfill({ contentType: 'text/html', body: fs.readFileSync(baseline, 'utf8') }));
      const settle = async p => {
        await p.evaluate(() => document.fonts.ready);
        await p.addStyleTag({ content: '*{animation:none!important;transition:none!important;scroll-behavior:auto!important}.reveal{opacity:1!important;transform:none!important}' });
        await p.locator('img[src]').evaluateAll(images => Promise.all(images.filter(img => img.getAttribute('src')).map(img => {
          img.loading = 'eager'; return img.decode();
        })));
      };
      for (const width of [1440, 900, 390, 320]) {
        const viewport = { width, height: width < 600 ? 844 : 900 };
        await before.setViewportSize(viewport); await page.setViewportSize(viewport);
        await before.goto(beforeUrl, { waitUntil: 'domcontentloaded' });
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        await settle(before); await settle(page);
        const frames = width === 1440 || width === 390 ? [0, 1, 2, 3, 4] : [0];
        for (const room of frames) {
          for (const p of [before, page]) {
            await p.locator('.flight-route>button').nth(room).click();
            await p.waitForFunction(room => window.fpFlight.room === room && !window.fpFlight.busy, room);
            await p.locator('#flight-still').evaluate(img => img.decode());
            await p.locator('.flight-route>button').nth(room).evaluate(button => button.blur());
          }
          const visibleText = async p => (await p.locator('body').innerText()).replace(/\s+/g, ' ').trim();
          assert.equal(await visibleText(before), await visibleText(page));
          const fullPage = room === 0 && (width === 1440 || width === 390);
          const buffers = [];
          for (const [name, p] of [['before', before], ['after', page]]) {
            const screenshot = await p.screenshot({ path: path.join(dir, `${name}-${width}-room-${room}.png`), fullPage, animations: 'disabled' });
            buffers.push(await sharp(screenshot).raw().toBuffer({ resolveWithObject: true }));
          }
          assert.deepEqual(buffers[0].info, buffers[1].info);
          const equal = buffers[0].data.equals(buffers[1].data);
          visual.push({ width, room, fullPage, identicalPixels: equal });
          assert.ok(equal, `Visual change at width ${width}, room ${room}`);
        }
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      }
    }
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(dir, 'results.json'), JSON.stringify({ passed: true, canonical: mainUrl, heading, visual, errors }, null, 2));
    console.log('PASS metadata, structured contacts, sitemap, robots, share images, stable H1', JSON.stringify(visual));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
