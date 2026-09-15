const { chromium } = require('playwright');

const BASE = 'http://localhost:8123/index.html';
const results = [];
const consoleErrors = [];

function check(name, condition, extra) {
  results.push({ name, pass: !!condition, extra: extra || '' });
}

(async () => {
  const browser = await chromium.launch();

  /* ============ DESKTOP PASS ============ */
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await desktop.newPage();
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push('[desktop] ' + msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push('[desktop pageerror] ' + err.message));

  await page.goto(BASE, { waitUntil: 'networkidle' });
  check('Page loaded (desktop)', await page.title());

  // Header nav visible, burger hidden
  check('Desktop nav visible', await page.isVisible('.nav'));
  check('Burger hidden on desktop', !(await page.isVisible('#burger')));

  // Smooth scroll nav link
  await page.click('a.nav__link[href="#services"]');
  await page.waitForTimeout(700);
  const servicesInView = await page.evaluate(() => {
    const r = document.querySelector('#services').getBoundingClientRect();
    return r.top < 200 && r.bottom > 0;
  });
  check('Nav link scrolls to #services', servicesInView);

  // Service modal open/close
  await page.click('[data-modal="modal-service-1"]');
  await page.waitForTimeout(300);
  check('Service modal opens', await page.isVisible('#modal-service-1'));
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  check('Escape closes service modal', !(await page.isVisible('#modal-service-1')));

  // Work modal open via keyboard (Enter on focusable card)
  await page.click('[data-modal="modal-work-1"]');
  await page.waitForTimeout(300);
  check('Work modal opens on click', await page.isVisible('#modal-work-1'));

  // Click outside closes
  await page.mouse.click(10, 10);
  await page.waitForTimeout(300);
  check('Click outside closes work modal', !(await page.isVisible('#modal-work-1')));

  // Demo project button toast
  await page.click('[data-modal="modal-work-2"]');
  await page.waitForTimeout(300);
  await page.click('#modal-work-2 [data-demo-link]');
  await page.waitForTimeout(200);
  check('Toast shows on demo project click', await page.isVisible('#toast.is-visible'));
  await page.keyboard.press('Escape');

  // Privacy modal via footer button
  await page.click('.footer__policy');
  await page.waitForTimeout(300);
  check('Privacy modal opens', await page.isVisible('#modal-privacy'));
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);

  // FAQ accordion
  await page.click('a.nav__link[href="#contacts"]'); // scroll away first not needed
  await page.goto(BASE + '#faq', { waitUntil: 'networkidle' });
  const firstTrigger = page.locator('.accordion__trigger').first();
  await firstTrigger.scrollIntoViewIfNeeded();
  await firstTrigger.click();
  await page.waitForTimeout(400);
  const expanded = await firstTrigger.getAttribute('aria-expanded');
  const panelHeight = await page.evaluate(() => {
    const p = document.querySelector('.accordion__panel');
    return parseInt(p.style.maxHeight, 10);
  });
  check('FAQ item expands', expanded === 'true' && panelHeight > 0, `maxHeight=${panelHeight}`);

  const secondTrigger = page.locator('.accordion__trigger').nth(1);
  await secondTrigger.click();
  await page.waitForTimeout(400);
  const firstStillOpen = await firstTrigger.getAttribute('aria-expanded');
  check('FAQ accordion closes previous item when another opens', firstStillOpen === 'false');

  // Form validation - empty submit
  await page.goto(BASE + '#request', { waitUntil: 'networkidle' });
  await page.click('.form__submit');
  await page.waitForTimeout(200);
  const nameError = await page.textContent('#err-name');
  check('Form shows validation error on empty submit', nameError.trim().length > 0, nameError);

  // Form validation - fill and submit
  await page.fill('#f-name', 'Тест Тестенко');
  await page.fill('#f-phone', '+380671234567');
  await page.click('.form__submit');
  await page.waitForTimeout(200);
  const status = await page.textContent('#form-status');
  check('Form shows demo-mode status message on valid submit', status.includes('демонстрационном режиме'), status);

  // CONFIG applied to contact links
  const tgHref = await page.getAttribute('#contact-telegram', 'href');
  const tgText = await page.textContent('#contact-telegram');
  check('CONFIG telegram applied to href', tgHref === 'https://t.me/your_username', tgHref);
  check('CONFIG telegram applied to label', tgText.trim() === '@your_username', tgText);

  // Back to top button
  await page.evaluate(() => window.scrollTo(0, 2000));
  await page.waitForTimeout(300);
  check('Back-to-top visible after scroll', await page.isVisible('#to-top.is-visible'));
  await page.click('#to-top');
  await page.waitForTimeout(1200);
  const scrollY = await page.evaluate(() => window.scrollY);
  check('Back-to-top scrolls to top', scrollY < 50, `scrollY=${scrollY}`);

  await page.screenshot({ path: '/home/claude/zavod/screenshot-desktop.png', fullPage: true });

  await desktop.close();

  /* ============ MOBILE PASS ============ */
  const mobile = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const mpage = await mobile.newPage();
  mpage.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push('[mobile] ' + msg.text());
  });
  mpage.on('pageerror', (err) => consoleErrors.push('[mobile pageerror] ' + err.message));

  await mpage.goto(BASE, { waitUntil: 'networkidle' });
  check('Nav hidden on mobile', !(await mpage.isVisible('.nav')));
  check('Burger visible on mobile', await mpage.isVisible('#burger'));

  await mpage.click('#burger');
  await mpage.waitForTimeout(400);
  check('Mobile menu opens', await mpage.isVisible('#mobile-nav.is-open'));

  await mpage.click('.mobile-nav__link[href="#services"]');
  await mpage.waitForTimeout(600);
  check('Mobile menu closes after link click', !(await mpage.locator('#mobile-nav').evaluate(el => el.classList.contains('is-open'))));

  // Check no horizontal overflow at 320px and 375px
  for (const w of [320, 375, 430]) {
    await mpage.setViewportSize({ width: w, height: 800 });
    await mpage.waitForTimeout(150);
    const overflow = await mpage.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check(`No horizontal overflow at ${w}px`, overflow <= 1, `overflow=${overflow}px`);
  }

  await mpage.setViewportSize({ width: 375, height: 812 });
  await mpage.screenshot({ path: '/home/claude/zavod/screenshot-mobile.png', fullPage: true });

  await mobile.close();
  await browser.close();

  /* ============ REPORT ============ */
  console.log('\n=== TEST RESULTS ===');
  let fails = 0;
  results.forEach((r) => {
    console.log(`${r.pass ? 'PASS' : 'FAIL'} — ${r.name}${r.extra ? ' (' + r.extra + ')' : ''}`);
    if (!r.pass) fails++;
  });
  console.log(`\n${results.length - fails}/${results.length} passed`);

  console.log('\n=== CONSOLE ERRORS ===');
  if (consoleErrors.length === 0) console.log('None');
  else consoleErrors.forEach((e) => console.log(e));

  process.exit(fails > 0 || consoleErrors.length > 0 ? 1 : 0);
})();
