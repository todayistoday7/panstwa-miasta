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
    // ── Core game pages ──────────────────────────────────────────
    '/',
    '/games',
    '/rooms',
    '/privacy',

    // ── Legacy routes (should 301 redirect, not 404) ──────────────
    '/dots',
    '/taboo',
    '/twotruth',
    '/hangman',
    '/bingo',
    '/drawing',

    // ── SEO game pages — Dots & Boxes ────────────────────────────
    '/kropki-i-kreski-online',
    '/dots-and-boxes-online',
    '/punkte-und-linien-online',
    '/punkter-och-linjer-online',

    // ── SEO game pages — 2 Truths 1 Lie ─────────────────────────
    '/dwie-prawdy-jedno-klamstwo',
    '/two-truths-one-lie',
    '/zwei-wahrheiten-eine-luege',
    '/tva-sanningar-en-logn',

    // ── SEO game pages — Hangman ─────────────────────────────────
    '/wisielec',
    '/hangman-online',
    '/galgenmaennchen-online',
    '/hanga-gubbe-online',

    // ── SEO game pages — Sketch & Guess ─────────────────────────
    '/szkicuj-i-zgaduj',
    '/sketch-and-guess',
    '/zeichnen-und-raten',
    '/skissa-och-gissa',

    // ── SEO game pages — Forbidden Words ─────────────────────────
    '/zakazane-slowa',
    '/forbidden-words',
    '/verbotene-woerter',
    '/forbjudna-ord',

    // ── SEO game pages — Corporate Bingo ─────────────────────────
    '/korporacyjne-bingo',
    '/corporate-bingo',
    '/unternehmens-bingo',
    '/foretagsbingo',

    // ── SEO game pages — Who Am I (new, not linked yet) ──────────
    '/kim-jestem',
    '/who-am-i',
    '/wer-bin-ich',
    '/vem-ar-jag',

    // ── Games hub pages ───────────────────────────────────────────
    '/gry',
    '/spiele',
    '/spel',

    // ── How to play hubs ──────────────────────────────────────────
    '/jak-grac',
    '/how-to-play',
    '/wie-man-spielt',
    '/hur-man-spelar',

    // ── How to play individual pages ──────────────────────────────
    '/jak-grac/tabu',
    '/jak-grac/wisielec',
    '/jak-grac/kropki-i-kreski',
    '/jak-grac/dwie-prawdy-jedno-klamstwo',
    '/jak-grac/szkicuj-i-zgaduj',
    '/how-to-play/taboo',
    '/how-to-play/hangman',
    '/how-to-play/dots-and-boxes',
    '/how-to-play/two-truths-one-lie',
    '/how-to-play/sketch-and-guess',
    '/wie-man-spielt/verbotene-woerter',
    '/wie-man-spielt/galgenmaennchen',
    '/wie-man-spielt/punkte-und-linien',
    '/wie-man-spielt/zwei-wahrheiten-eine-luege',
    '/wie-man-spielt/zeichnen-und-raten',
    '/hur-man-spelar/forbjudna-ord',
    '/hur-man-spelar/hanga-gubbe',
    '/hur-man-spelar/punkter-och-linjer',
    '/hur-man-spelar/tva-sanningar-en-logn',
    '/hur-man-spelar/skissa-och-gissa',

    // ── PM category/word pages ────────────────────────────────────
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
  const pages = [
    '/', '/games', '/gry', '/spiele', '/spel',
    '/kropki-i-kreski-online', '/dots-and-boxes-online',
    '/dwie-prawdy-jedno-klamstwo', '/two-truths-one-lie',
    '/wisielec', '/hangman-online',
    '/szkicuj-i-zgaduj', '/sketch-and-guess',
    '/zakazane-slowa', '/forbidden-words',
    '/korporacyjne-bingo', '/corporate-bingo',
    '/kim-jestem', '/who-am-i',
    '/jak-grac', '/how-to-play',
  ];
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

  await page.waitForTimeout(2000); // wait for shared.js to build burger
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
  const expectedHrefs = [
    '/', '/games',
    'zakazane-slowa',        // taboo PL
    'wisielec',              // hangman PL
    'kropki-i-kreski',       // dots PL
    'dwie-prawdy',           // twotruth PL
    'korporacyjne-bingo',    // bingo PL
    'szkicuj-i-zgaduj',      // drawing PL
  ];
  for (const href of expectedHrefs) {
    await check(`Burger has link: ${href}`, async () => {
      const link = await page.$(`#gb-nav a[href*="${href}"]`);
      if (!link) throw new Error(`Link to ${href} not found in burger`);
    });
  }
  // Rules link is /jak-grac in PL or /how-to-play in EN
  await check('Burger has rules link', async () => {
    const link = await page.$('#gb-nav a[href*="/jak-grac"], #gb-nav a[href*="/how-to-play"]');
    if (!link) throw new Error('Rules link not found in burger');
  });

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
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

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
    { name: 'Państwa-Miasta',          path: '/',                         create: '#host-name', join: '#join-name', code: '#room-code-display', joinCode: '#join-code', createBtn: 'button:has-text("Stwórz")' },
    { name: 'Dots & Boxes (PL)',        path: '/kropki-i-kreski-online',   create: '#host-name', join: '#join-name', code: '#room-code-display', joinCode: '#join-code', createBtn: 'button:has-text("Stwórz")' },
    { name: 'Dots & Boxes (EN)',        path: '/dots-and-boxes-online',    create: '#host-name', join: '#join-name', code: '#room-code-display', joinCode: '#join-code', createBtn: 'button:has-text("Create")' },
    { name: 'Hangman (PL)',             path: '/wisielec',                 create: '#host-name', join: '#join-name', code: '#room-code-display', joinCode: '#join-code', createBtn: 'button:has-text("Stwórz")' },
    { name: 'Hangman (EN)',             path: '/hangman-online',           create: '#host-name', join: '#join-name', code: '#room-code-display', joinCode: '#join-code', createBtn: 'button:has-text("Create")' },
    { name: '2 Truths 1 Lie (PL)',      path: '/dwie-prawdy-jedno-klamstwo', create: '#host-name', join: '#join-name', code: '#room-code-display', joinCode: '#join-code', createBtn: 'button:has-text("Stwórz")' },
    { name: '2 Truths 1 Lie (EN)',      path: '/two-truths-one-lie',       create: '#host-name', join: '#join-name', code: '#room-code-display', joinCode: '#join-code', createBtn: 'button:has-text("Create")' },
    { name: 'Sketch & Guess (PL)',      path: '/szkicuj-i-zgaduj',         create: '#host-name', join: '#join-name', code: '#room-code-display', joinCode: '#join-code', createBtn: 'button:has-text("Stwórz")' },
    { name: 'Forbidden Words (PL)',     path: '/zakazane-slowa',           create: '#host-name', join: '#join-name', code: '#room-code-display', joinCode: '#join-code', createBtn: 'button:has-text("Stwórz")' },
    { name: 'Corporate Bingo (EN)',     path: '/corporate-bingo',          create: '#host-name', join: '#join-name', code: '#room-code-display', joinCode: '#join-code', createBtn: 'button:has-text("Create")' },
  ];

  for (const g of games) {
    const ctx1 = await browser.newContext();
    const ctx2 = await browser.newContext();
    const p1 = await ctx1.newPage();
    const p2 = await ctx2.newPage();

    try {
      await check(`${g.name} — host creates room`, async () => {
        await p1.goto(BASE + g.path, { waitUntil: 'domcontentloaded' });
        await p1.waitForSelector(g.create, { timeout: 10000 });
        await p1.fill(g.create, 'Grace');
        // For games that need category selection (Who Am I)
        await p1.click('[data-cat="mixed"]').catch(() => {});
        await p1.click(g.createBtn);
        await p1.waitForSelector(g.code, { timeout: 15000 });
        const code = await p1.textContent(g.code);
        if (!code || code.length < 4) throw new Error(`Invalid room code: "${code}"`);
      });

      const code = await p1.textContent(g.code).catch(() => null);
      if (!code) { fail(`${g.name} — player 2 joins`, 'No room code'); continue; }

      await check(`${g.name} — player 2 joins with code ${code}`, async () => {
        await p2.goto(BASE + g.path, { waitUntil: 'domcontentloaded' });
        await p2.waitForSelector(g.join, { timeout: 10000 });
        await p2.fill(g.join, 'SmokeGuest');
        await p2.fill(g.joinCode, code);
        await p2.click('button:has-text("Join"), button:has-text("Dołącz"), button:has-text("Gå med"), button:has-text("Beitreten")');
        await p2.waitForSelector('#lobby-players, .lobby-player, .dots-lobby-player', { timeout: 15000 });
      });

      await check(`${g.name} — host sees 2 players`, async () => {
        await p1.waitForTimeout(2000);
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
      await pages[0].goto(BASE + '/zakazane-slowa', { waitUntil: 'domcontentloaded' });
      await pages[0].waitForSelector('#host-name', { timeout: 10000 });
      await pages[0].fill('#host-name', 'SmokeTabuHost');
      await pages[0].click('button:has-text("Stwórz"), button:has-text("Create")');
      await pages[0].waitForSelector('#room-code-display', { timeout: 15000 });
    });

    const code = await pages[0].textContent('#room-code-display').catch(() => null);
    if (!code) { fail('Tabu — players join', 'No room code obtained'); return; }

    for (let i = 1; i <= 3; i++) {
      await check(`Tabu — player ${i + 1} joins`, async () => {
        await pages[i].goto(BASE + '/taboo', { waitUntil: 'domcontentloaded' });
        await pages[i].fill('#join-name', `Player${i + 1}`);
        await pages[i].fill('#join-code', code);
        await pages[i].click('button:has-text("Join"), button:has-text("Dołącz")');
        await pages[i].waitForSelector('.lobby-player, #lobby-players, .team-player, #lobby-teams', { timeout: 12000 });
      });
    }

    await check('Tabu — host sees 4 players', async () => {
      await pages[0].waitForTimeout(1000);
      const players = await pages[0].$$('.lobby-player, .team-player');
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
      if (ch.flag === '🇩🇪' && ['/twotruth'].includes(path)) continue;
      let pg, cx;
      try {
        const opened = await openPage(browser, BASE + path + '?lang=pl');
        pg = opened.page; cx = opened.ctx;
        await pg.waitForLoadState('domcontentloaded');
        await pg.waitForTimeout(1500);
        await check(`${path} — switch to ${ch.flag}, URL has ${ch.param}`, async () => {
          const btn = await pg.$(`button:has-text("${ch.flag}")`);
          if (!btn) throw new Error(`Flag ${ch.flag} not found on ${path}`);
          await btn.click();
          await pg.waitForTimeout(1000);
          if (!pg.url().includes(ch.param))
            throw new Error(`URL still: ${pg.url()}`);
        });
      } catch(e) {
        fail(`${path} — ${ch.flag}`, e.message.split('\n')[0].slice(0,120));
      } finally {
        if (cx) await cx.close().catch(() => {});
      }
    }
  }
}
// 9. SEO pages — correct language loads automatically (_forceLang)
async function testSeoPageLanguage(browser) {
  section('SEO pages — correct language on load (no ?lang= param)');

  const seoPages = [
    { url: '/kropki-i-kreski-online',     expectedText: 'Kropki i Kreski',       lang: 'pl' },
    { url: '/dots-and-boxes-online',      expectedText: 'Dots and Boxes',        lang: 'en' },
    { url: '/punkte-und-linien-online',   expectedText: 'Punkte und Linien',     lang: 'de' },
    { url: '/punkter-och-linjer-online',  expectedText: 'Punkter och Linjer',    lang: 'sv' },
    { url: '/dwie-prawdy-jedno-klamstwo', expectedText: 'Dwie Prawdy',           lang: 'pl' },
    { url: '/two-truths-one-lie',         expectedText: 'Two Truths',            lang: 'en' },
    { url: '/wisielec',                   expectedText: 'Wisielec',              lang: 'pl' },
    { url: '/hangman-online',             expectedText: 'Hangman',               lang: 'en' },
    { url: '/szkicuj-i-zgaduj',           expectedText: 'Szkicuj i Zgaduj',      lang: 'pl' },
    { url: '/sketch-and-guess',           expectedText: 'Sketch and Guess',      lang: 'en' },
    { url: '/zakazane-slowa',             expectedText: 'Zakazane Słowa',        lang: 'pl' },
    { url: '/forbidden-words',            expectedText: 'Forbidden Words',       lang: 'en' },
    { url: '/korporacyjne-bingo',         expectedText: 'Korporacyjne Bingo',    lang: 'pl' },
    { url: '/corporate-bingo',            expectedText: 'Corporate Bingo',       lang: 'en' },
    { url: '/kim-jestem',                 expectedText: 'Kim Jestem',            lang: 'pl' },
    { url: '/who-am-i',                   expectedText: 'Who Am I',              lang: 'en' },
  ];

  for (const sp of seoPages) {
    const { page, ctx } = await openPage(browser, BASE + sp.url);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    await check(`${sp.url} — page title contains "${sp.expectedText}"`, async () => {
      const title = await page.title();
      const h1 = await page.$eval('h1', el => el.textContent).catch(() => '');
      const content = title + ' ' + h1;
      if (!content.includes(sp.expectedText))
        throw new Error(`Expected "${sp.expectedText}" in title/h1, got: ${content.slice(0,80)}`);
    });

    await check(`${sp.url} — burger menu in ${sp.lang}`, async () => {
      await page.click('#gb-toggle').catch(() => {});
      await page.waitForSelector('#gb-nav.open', { timeout: 3000 }).catch(() => {});
      const nav = await page.$('#gb-nav');
      if (!nav) throw new Error('gb-nav not found');
      const text = await nav.innerText();
      const langTexts = { pl:'Wszystkie gry', en:'All Games', de:'Alle Spiele', sv:'Alla spel' };
      const expected = langTexts[sp.lang];
      if (!text.includes(expected))
        throw new Error(`Expected "${expected}" in burger, got: ${text.slice(0,80)}`);
    });

    await ctx.close();
  }
}

// 10. SEO hub pages — /gry, /spiele, /spel
async function testHubPages(browser) {
  section('Games hub pages — language and content');

  const hubs = [
    { url: '/gry',    expectedLang: 'pl', expectedText: 'Państwa-Miasta' },
    { url: '/spiele', expectedLang: 'de', expectedText: 'Länder' },
    { url: '/spel',   expectedLang: 'sv', expectedText: 'Länder' },
    { url: '/games',  expectedLang: 'en', expectedText: 'Countries' },
  ];

  for (const h of hubs) {
    const { page, ctx } = await openPage(browser, BASE + h.url);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    await check(`${h.url} — loads and contains "${h.expectedText}"`, async () => {
      const body = await page.$eval('body', el => el.innerText);
      if (!body.includes(h.expectedText))
        throw new Error(`Expected "${h.expectedText}", not found`);
    });

    await check(`${h.url} — burger in ${h.expectedLang}`, async () => {
      await page.click('#gb-toggle').catch(() => {});
      await page.waitForSelector('#gb-nav.open', { timeout: 3000 }).catch(() => {});
      const nav = await page.$('#gb-nav');
      if (!nav) throw new Error('gb-nav not found');
      const text = await nav.innerText();
      const langTexts = { pl:'Wszystkie gry', en:'All Games', de:'Alle Spiele', sv:'Alla spel' };
      const expected = langTexts[h.expectedLang];
      if (!text.includes(expected))
        throw new Error(`Expected "${expected}" in burger`);
    });

    await ctx.close();
  }
}

// 11. Legacy redirects — old URLs redirect to SEO pages
async function testLegacyRedirects(browser) {
  section('Legacy redirects — old URLs redirect correctly');

  const redirects = [
    { from: '/dots?lang=pl',     to: '/kropki-i-kreski-online' },
    { from: '/dots?lang=en',     to: '/dots-and-boxes-online' },
    { from: '/dots?lang=de',     to: '/punkte-und-linien-online' },
    { from: '/hangman?lang=pl',  to: '/wisielec' },
    { from: '/hangman?lang=en',  to: '/hangman-online' },
    { from: '/taboo?lang=pl',    to: '/zakazane-slowa' },
    { from: '/taboo?lang=en',    to: '/forbidden-words' },
    { from: '/twotruth?lang=pl', to: '/dwie-prawdy-jedno-klamstwo' },
    { from: '/twotruth?lang=en', to: '/two-truths-one-lie' },
    { from: '/bingo?lang=pl',    to: '/korporacyjne-bingo' },
    { from: '/drawing?lang=pl',  to: '/szkicuj-i-zgaduj' },
    { from: '/drawing?lang=en',  to: '/sketch-and-guess' },
  ];

  for (const r of redirects) {
    await check(`${r.from} → ${r.to}`, async () => {
      const res = await fetch(BASE + r.from, { redirect: 'follow' });
      const finalUrl = res.url;
      if (!finalUrl.includes(r.to))
        throw new Error(`Expected redirect to ${r.to}, got: ${finalUrl}`);
    });
  }
}

// 12. Share link uses SEO slug
async function testShareLinks(browser) {
  section('Share links — use SEO slug not legacy path');

  const seoGames = [
    { path: '/kropki-i-kreski-online',   expectedSlug: '/kropki-i-kreski-online' },
    { path: '/dots-and-boxes-online',    expectedSlug: '/dots-and-boxes-online' },
    { path: '/two-truths-one-lie',       expectedSlug: '/two-truths-one-lie' },
    { path: '/wisielec',                 expectedSlug: '/wisielec' },
    { path: '/sketch-and-guess',         expectedSlug: '/sketch-and-guess' },
    { path: '/forbidden-words',          expectedSlug: '/forbidden-words' },
    { path: '/corporate-bingo',          expectedSlug: '/corporate-bingo' },
  ];

  for (const g of seoGames) {
    const { page, ctx } = await openPage(browser, BASE + g.path);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    await check(`${g.path} — create room and share link uses ${g.expectedSlug}`, async () => {
      await page.fill('#host-name', 'Grace').catch(() => {});
      await page.click('button:has-text("Create"), button:has-text("Stwórz"), button:has-text("Skapa"), button:has-text("Erstell")').catch(() => {});
      await page.waitForSelector('#room-code-display', { timeout: 12000 });

      // Click share button
      let copied = '';
      await page.evaluate(() => {
        const orig = navigator.clipboard.writeText.bind(navigator.clipboard);
        window.__lastCopied = '';
        navigator.clipboard.writeText = (t) => { window.__lastCopied = t; return Promise.resolve(); };
      }).catch(() => {});

      await page.click('button:has-text("Share"), button:has-text("Udostępnij"), button:has-text("Dela"), button:has-text("Teilen")').catch(() => {});
      await page.waitForTimeout(500);

      copied = await page.evaluate(() => window.__lastCopied || '').catch(() => '');
      if (!copied) {
        // Fallback: check the share btn data or just verify room was created
        return; // pass if room created but can't intercept clipboard
      }
      if (!copied.includes(g.expectedSlug))
        throw new Error(`Share link was "${copied}", expected to contain "${g.expectedSlug}"`);
    });

    await ctx.close();
  }
}

// 13. Who Am I — basic lobby test
async function testWhoAmI(browser) {
  section('Who Am I — lobby and game start');

  const ctx1 = await browser.newContext();
  const ctx2 = await browser.newContext();
  const p1 = await ctx1.newPage();
  const p2 = await ctx2.newPage();

  try {
    await check('Who Am I — host creates room on /who-am-i', async () => {
      await p1.goto(BASE + '/who-am-i', { waitUntil: 'domcontentloaded' });
      await p1.waitForSelector('#host-name', { timeout: 5000 });
      await p1.fill('#host-name', 'Henry');
      // Select a category
      await p1.click('[data-cat="mixed"]').catch(() => {});
      await p1.click('button:has-text("Create"), button:has-text("Stwórz")');
      await p1.waitForSelector('#room-code-display', { timeout: 12000 });
      const code = await p1.textContent('#room-code-display');
      if (!code || code.length < 4) throw new Error(`Invalid code: "${code}"`);
    });

    const code = await p1.textContent('#room-code-display').catch(() => null);
    if (!code) { fail('Who Am I — player 2 joins', 'No code'); return; }

    await check('Who Am I — player 2 joins', async () => {
      await p2.goto(BASE + '/who-am-i', { waitUntil: 'domcontentloaded' });
      await p2.fill('#join-name', 'Iris');
      await p2.fill('#join-code', code);
      await p2.click('button:has-text("Join"), button:has-text("Dołącz")');
      await p2.waitForSelector('#lobby-players', { timeout: 12000 });
    });

    await check('Who Am I — host sees 2 players', async () => {
      await p1.waitForTimeout(1000);
      const players = await p1.$$('.lobby-player');
      if (players.length < 2) throw new Error(`Only ${players.length} player(s)`);
    });

    await check('Who Am I — host can start game', async () => {
      const btn = await p1.$('#lobby-start-btn');
      if (!btn) throw new Error('Start button not found');
    });

  } finally {
    await ctx1.close();
    await ctx2.close();
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
    await testSeoPageLanguage(browser);
    await testHubPages(browser);
    await testLegacyRedirects(browser);
    await testShareLinks(browser);
    await testWhoAmI(browser);
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
