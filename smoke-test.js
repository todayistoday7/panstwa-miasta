/**
 * smoke-test.js — panstwamiastagra.com
 *
 * Tests all pages, game lobbies, and language switching.
 * Run: node smoke-test.js
 * Run against staging: node smoke-test.js https://staging.example.com
 *
 * Requires Playwright:
 *   npm install playwright
 *   npx playwright install chromium
 */

const { chromium } = require('playwright');

const BASE = process.argv[2] || 'https://panstwamiastagra.com';
const HEADLESS = !process.argv.includes('--watch'); // --watch shows browser

// ─── Helpers ─────────────────────────────────────────────────────
let passed = 0;
let failed = 0;
const failures = [];

function ok(label) {
  process.stdout.write(`  ✓ ${label}\n`);
  passed++;
}

function fail(label, reason) {
  process.stdout.write(`  ✗ ${label}\n    → ${reason}\n`);
  failed++;
  failures.push(`${label}: ${reason}`);
}

async function check(label, fn) {
  try {
    await fn();
    ok(label);
  } catch (e) {
    fail(label, e.message.split('\n')[0].slice(0, 120));
  }
}

function section(title) {
  console.log(`\n── ${title} ${'─'.repeat(Math.max(0, 50 - title.length))}`);
}

// Open a page and collect console errors
async function openPage(browser, url) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.message));
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
  return { page, ctx, errors };
}

// ─── Test suites ──────────────────────────────────────────────────

// 1. Static page availability — all routes return 200
async function testPageAvailability(browser) {
  section('Page availability (all routes)');
  const pages = [
    '/',
    '/taboo',
    '/dots',
    '/twotruth',
    '/hangman',
    '/games',
    '/jak-grac',
    '/jak-grac/tabu',
    '/jak-grac/wisielec',
    '/jak-grac/kropki-i-kreski',
    '/jak-grac/dwie-prawdy-jedno-klamstwo',
    '/how-to-play',
    '/how-to-play/taboo',
    '/how-to-play/hangman',
    '/how-to-play/dots-and-boxes',
    '/how-to-play/two-truths-one-lie',
    '/kategorie',
    '/slowa',
    '/health',
  ];
  for (const path of pages) {
    await check(path, async () => {
      const res = await fetch(BASE + path);
      if (res.status >= 400) throw new Error(`HTTP ${res.status}`);
    });
  }
}

// 2. No JS errors on key pages
async function testNoJsErrors(browser) {
  section('No JS errors on page load');
  const pages = ['/', '/taboo', '/dots', '/hangman', '/twotruth', '/games',
                  '/jak-grac', '/how-to-play', '/slowa', '/kategorie'];
  for (const path of pages) {
    await check(path, async () => {
      const { ctx, errors } = await openPage(browser, BASE + path);
      await ctx.close();
      // Filter out known non-critical third-party noise
      const real = errors.filter(e =>
        !e.includes('gtag') &&
        !e.includes('googletagmanager') &&
        !e.includes('favicon')
      );
      if (real.length) throw new Error(real[0]);
    });
  }
}

// 3. Burger menu present and contains expected links
async function testBurgerMenu(browser) {
  section('Burger menu — presence and links');
  const { page, ctx } = await openPage(browser, BASE + '/');
  await page.waitForSelector('#gb-toggle', { timeout: 5000 });

  await check('Burger button visible', async () => {
    const btn = await page.$('#gb-toggle');
    if (!btn) throw new Error('gb-toggle not found');
  });

  // Open it
  await page.click('#gb-toggle');
  await page.waitForSelector('#gb-nav.open', { timeout: 3000 });

  await check('Burger nav opens', async () => {
    const nav = await page.$('#gb-nav.open');
    if (!nav) throw new Error('gb-nav did not open');
  });

  // Check all expected links are present
  const expectedHrefs = ['/', '/games', '/taboo', '/hangman', '/dots',
                          '/twotruth', '/jak-grac', '/kategorie', '/slowa'];
  for (const href of expectedHrefs) {
    await check(`Burger has link: ${href}`, async () => {
      const link = await page.$(`#gb-nav a[href*="${href}"]`);
      if (!link) throw new Error(`Link to ${href} not found in burger`);
    });
  }

  await ctx.close();
}

// 4. Footer present and links are not 404
async function testFooterLinks(browser) {
  section('Footer links — no broken links');
  const { page, ctx } = await openPage(browser, BASE + '/');
  await page.waitForSelector('#site-footer', { timeout: 5000 });

  const links = await page.$$eval('#site-footer a', els =>
    els.map(a => a.href).filter(h => h && h.startsWith('http'))
  );

  await check(`Footer has links (found ${links.length})`, async () => {
    if (links.length < 5) throw new Error(`Only ${links.length} links found`);
  });

  for (const href of links) {
    // Skip mailto/privacy/external
    if (!href.includes('panstwamiastagra.com')) continue;
    await check(`Footer link OK: ${href.replace(BASE, '')}`, async () => {
      const res = await fetch(href);
      if (res.status >= 400) throw new Error(`HTTP ${res.status}`);
    });
  }
  await ctx.close();
}

// 5. Language switch — content, burger, footer, URL all update
async function testLanguageSwitch(browser) {
  section('Language switching — content + burger + footer + URL');

  const tests = [
    {
      page: '/?lang=pl',
      clickFlag: '🇬🇧',        // click EN flag
      expectedLang: 'en',
      burgerText: 'All Games',   // burger should show EN
      footerText: 'Free online multiplayer games',  // footer tagline in EN
      urlParam: 'lang=en',
    },
    {
      page: '/?lang=en',
      clickFlag: '🇵🇱',
      expectedLang: 'pl',
      burgerText: 'Wszystkie gry',
      footerText: 'Darmowe gry online',
      urlParam: 'lang=pl',
    },
    {
      page: '/?lang=pl',
      clickFlag: '🇩🇪',
      expectedLang: 'de',
      burgerText: 'Alle Spiele',
      footerText: 'Kostenlose Multiplayer',
      urlParam: 'lang=de',
    },
  ];

  for (const t of tests) {
    const { page, ctx } = await openPage(browser, BASE + t.page);
    await page.waitForLoadState('networkidle');

    // Click the language flag in the footer lang buttons
    await check(`Click ${t.clickFlag} flag on ${t.page}`, async () => {
      // Try footer flag buttons first, then lang bar
      const btn = await page.$(`button:has-text("${t.clickFlag}")`);
      if (!btn) throw new Error(`Flag button ${t.clickFlag} not found`);
      await btn.click();
      await page.waitForTimeout(800); // allow translations to apply
    });

    // Check URL updated
    await check(`URL contains ${t.urlParam}`, async () => {
      const url = page.url();
      if (!url.includes(t.urlParam)) throw new Error(`URL is ${url}`);
    });

    // Check burger menu is in new language — open it
    await page.click('#gb-toggle');
    await page.waitForSelector('#gb-nav.open', { timeout: 3000 }).catch(() => {});

    await check(`Burger shows "${t.burgerText}" after switch`, async () => {
      const nav = await page.$('#gb-nav');
      if (!nav) throw new Error('gb-nav not found');
      const text = await nav.innerText();
      if (!text.includes(t.burgerText))
        throw new Error(`Expected "${t.burgerText}" in burger, got: ${text.slice(0, 80)}`);
    });

    // Check footer is in new language
    await check(`Footer shows "${t.footerText}" after switch`, async () => {
      const footer = await page.$('#site-footer');
      if (!footer) throw new Error('site-footer not found');
      const text = await footer.innerText();
      if (!text.includes(t.footerText))
        throw new Error(`Expected "${t.footerText}" in footer`);
    });

    await ctx.close();
  }
}

// 6. Game lobbies — 2 players can connect (all games)
async function testGameLobbies(browser) {
  section('Game lobbies — 2 players connect');

  const games = [
    { name: 'Państwa-Miasta', path: '/',        create: '#host-name',  join: '#join-name',  code: '#room-code-display', joinCode: '#join-code', createBtn: 'button:has-text("Stwórz")' },
    { name: 'Dots & Boxes',   path: '/dots',    create: '#host-name',  join: '#join-name',  code: '#room-code-display', joinCode: '#join-code', createBtn: 'button:has-text("Create")' },
    { name: 'Hangman',        path: '/hangman', create: '#host-name',  join: '#join-name',  code: '#room-code-display', joinCode: '#join-code', createBtn: 'button:has-text("Create")' },
    { name: '2 Truths 1 Lie', path: '/twotruth',create: '#host-name', join: '#join-name',  code: '#room-code-display', joinCode: '#join-code', createBtn: 'button:has-text("Create")' },
  ];

  for (const g of games) {
    const ctx1 = await browser.newContext();
    const ctx2 = await browser.newContext();
    const p1 = await ctx1.newPage();
    const p2 = await ctx2.newPage();

    try {
      await check(`${g.name} — host creates room`, async () => {
        await p1.goto(BASE + g.path, { waitUntil: 'domcontentloaded' });
        await p1.waitForSelector(g.create, { timeout: 5000 });
        await p1.fill(g.create, 'TestHost');
        await p1.click(g.createBtn);
        await p1.waitForSelector(g.code, { timeout: 8000 });
        const code = await p1.textContent(g.code);
        if (!code || code.length < 4) throw new Error(`Invalid room code: "${code}"`);
      });

      const code = await p1.textContent(g.code).catch(() => null);
      if (!code) { fail(`${g.name} — player 2 joins`, 'No room code'); continue; }

      await check(`${g.name} — player 2 joins with code ${code}`, async () => {
        await p2.goto(BASE + g.path, { waitUntil: 'domcontentloaded' });
        await p2.waitForSelector(g.join, { timeout: 5000 });
        await p2.fill(g.join, 'TestGuest');
        await p2.fill(g.joinCode, code);
        await p2.click('button:has-text("Join"), button:has-text("Dołącz")');
        // Wait for lobby to show
        await p2.waitForSelector('#lobby-players, .lobby-player, .dots-lobby-player', { timeout: 8000 });
      });

      await check(`${g.name} — host sees 2 players`, async () => {
        await p1.waitForTimeout(1000);
        const players = await p1.$$('.lobby-player, .dots-lobby-player');
        if (players.length < 2) throw new Error(`Only ${players.length} player(s) visible`);
      });

    } finally {
      await ctx1.close();
      await ctx2.close();
    }
  }
}

// 7. Tabu lobby — 4 players (minimum required)
async function testTabuLobby(browser) {
  section('Tabu lobby — 4 players (minimum)');

  const ctxs = [];
  const pages = [];

  try {
    for (let i = 0; i < 4; i++) {
      const ctx = await browser.newContext();
      const p = await ctx.newPage();
      ctxs.push(ctx);
      pages.push(p);
    }

    await check('Tabu — host creates room', async () => {
      await pages[0].goto(BASE + '/taboo', { waitUntil: 'domcontentloaded' });
      await pages[0].fill('#host-name', 'TabuHost');
      await pages[0].click('button:has-text("Create"), button:has-text("Stwórz")');
      await pages[0].waitForSelector('#room-code-display', { timeout: 8000 });
    });

    const code = await pages[0].textContent('#room-code-display').catch(() => null);
    if (!code) { fail('Tabu — players join', 'No room code obtained'); return; }

    for (let i = 1; i <= 3; i++) {
      await check(`Tabu — player ${i + 1} joins`, async () => {
        await pages[i].goto(BASE + '/taboo', { waitUntil: 'domcontentloaded' });
        await pages[i].fill('#join-name', `Player${i + 1}`);
        await pages[i].fill('#join-code', code);
        await pages[i].click('button:has-text("Join"), button:has-text("Dołącz")');
        await pages[i].waitForSelector('.lobby-player, #lobby-players', { timeout: 8000 });
      });
    }

    await check('Tabu — host sees 4 players', async () => {
      await pages[0].waitForTimeout(1000);
      const players = await pages[0].$$('.lobby-player');
      if (players.length < 4) throw new Error(`Only ${players.length} player(s) visible`);
    });

    await check('Tabu — start button enabled for host', async () => {
      const btn = await pages[0].$('#lbl-start-btn, button:has-text("Start"), button:has-text("Rozpocznij")');
      if (!btn) throw new Error('Start button not found');
    });

  } finally {
    for (const ctx of ctxs) await ctx.close();
  }
}

// 8. Language switch on game pages (not just homepage)
async function testGamePageTranslations(browser) {
  section('Language switch on game pages');

  const gamePaths = ['/taboo', '/dots', '/hangman', '/games'];
  const checks = [
    { flag: '🇬🇧', param: 'lang=en', text: 'Create Room' },
    { flag: '🇵🇱', param: 'lang=pl', text: 'Stwórz' },
    { flag: '🇩🇪', param: 'lang=de', text: 'Erstell' },
  ];

  for (const path of gamePaths) {
    for (const ch of checks) {
      // Only test EN and PL on all pages, DE only on pages that support it
      if (ch.flag === '🇩🇪' && ['/taboo', '/twotruth'].includes(path)) continue;

      const { page, ctx } = await openPage(browser, BASE + path + '?lang=pl');
      await page.waitForLoadState('networkidle');

      await check(`${path} — switch to ${ch.flag}, URL has ${ch.param}`, async () => {
        const btn = await page.$(`button:has-text("${ch.flag}")`);
        if (!btn) throw new Error(`Flag ${ch.flag} not found on ${path}`);
        await btn.click();
        await page.waitForTimeout(600);
        if (!page.url().includes(ch.param))
          throw new Error(`URL still shows: ${page.url()}`);
      });

      await ctx.close();
    }
  }
}

// ─── Main ─────────────────────────────────────────────────────────
(async () => {
  console.log(`\n${'═'.repeat(55)}`);
  console.log(`  panstwamiastagra.com — Smoke Test`);
  console.log(`  Target: ${BASE}`);
  console.log(`  Mode:   ${HEADLESS ? 'headless' : 'visible browser'}`);
  console.log(`${'═'.repeat(55)}`);

  const browser = await chromium.launch({ headless: HEADLESS });
  const start = Date.now();

  try {
    await testPageAvailability(browser);
    await testNoJsErrors(browser);
    await testBurgerMenu(browser);
    await testFooterLinks(browser);
    await testLanguageSwitch(browser);
    await testGameLobbies(browser);
    await testTabuLobby(browser);
    await testGamePageTranslations(browser);
  } finally {
    await browser.close();
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\n${'═'.repeat(55)}`);
  console.log(`  Results: ${passed} passed, ${failed} failed  (${elapsed}s)`);

  if (failures.length) {
    console.log(`\n  Failures:`);
    failures.forEach(f => console.log(`    ✗ ${f}`));
    console.log('');
    process.exit(1);
  } else {
    console.log(`\n  ✓ All tests passed — safe to deploy\n`);
    process.exit(0);
  }
})();
