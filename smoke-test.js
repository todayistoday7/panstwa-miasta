/**
 * smoke-test.js — panstwamiastagra.com
 * Optimised — target runtime: 3-4 minutes
 * Run: node smoke-test.js
 * Run against staging: node smoke-test.js https://staging.example.com
 * Show browser: node smoke-test.js --watch
 * Requires: npm install playwright && npx playwright install chromium
 */

const { chromium } = require('playwright');

const BASE     = process.argv.find(a => a.startsWith('http')) || 'https://panstwamiastagra.com';
const HEADLESS = !process.argv.includes('--watch');
const TIMEOUT  = 12000;

let passed = 0, failed = 0;
const failures = [];

function ok(label)           { process.stdout.write(`  ✓ ${label}\n`); passed++; }
function fail(label, reason) { process.stdout.write(`  ✗ ${label}\n    → ${reason}\n`); failed++; failures.push(`${label}: ${reason}`); }
async function check(label, fn) {
  try { await fn(); ok(label); }
  catch (e) { fail(label, e.message.split('\n')[0].slice(0, 120)); }
}
function section(title) { console.log(`\n── ${title} ${'─'.repeat(Math.max(0, 50 - title.length))}`); }

async function openPage(browser, url) {
  const ctx  = await browser.newContext();
  const page = await ctx.newPage();
  page.setDefaultTimeout(TIMEOUT);
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
  return { page, ctx, errors };
}

// ─── 1. Page availability (pure HTTP, parallel) ───────────────────
async function testPageAvailability() {
  section('Page availability');
  const pages = [
    '/', '/games', '/rooms', '/privacy', '/health',
    '/gry', '/spiele', '/spel',
    '/jak-grac', '/how-to-play', '/wie-man-spielt', '/hur-man-spelar',
    '/jak-grac/tabu', '/jak-grac/wisielec', '/jak-grac/kropki-i-kreski',
    '/jak-grac/dwie-prawdy-jedno-klamstwo', '/jak-grac/szkicuj-i-zgaduj',
    '/how-to-play/taboo', '/how-to-play/hangman', '/how-to-play/dots-and-boxes',
    '/how-to-play/two-truths-one-lie', '/how-to-play/sketch-and-guess',
    '/kropki-i-kreski-online', '/dots-and-boxes-online',
    '/punkte-und-linien-online', '/punkter-och-linjer-online',
    '/dwie-prawdy-jedno-klamstwo', '/two-truths-one-lie',
    '/zwei-wahrheiten-eine-luege', '/tva-sanningar-en-logn',
    '/wisielec', '/hangman-online', '/galgenmaennchen-online', '/hanga-gubbe-online',
    '/szkicuj-i-zgaduj', '/sketch-and-guess', '/zeichnen-und-raten', '/skissa-och-gissa',
    '/zakazane-slowa', '/forbidden-words', '/verbotene-woerter', '/forbjudna-ord',
    '/korporacyjne-bingo', '/corporate-bingo', '/unternehmens-bingo', '/foretagsbingo',
    '/kim-jestem', '/who-am-i', '/wer-bin-ich', '/vem-ar-jag',
    '/kategorie', '/slowa',
  ];
  const legacy = ['/dots', '/taboo', '/twotruth', '/hangman', '/bingo', '/drawing'];

  for (let i = 0; i < pages.length; i += 8) {
    await Promise.all(pages.slice(i, i + 8).map(p =>
      check(p, async () => {
        const res = await fetch(BASE + p);
        if (res.status >= 400) throw new Error(`HTTP ${res.status}`);
      })
    ));
  }
  await Promise.all(legacy.map(p =>
    check(`${p} (redirect)`, async () => {
      const res = await fetch(BASE + p, { redirect: 'follow' });
      if (res.status >= 400) throw new Error(`HTTP ${res.status}`);
    })
  ));
}

// ─── 2. Legacy redirects ──────────────────────────────────────────
async function testLegacyRedirects() {
  section('Legacy redirects');
  const redirects = [
    ['/dots?lang=pl',     '/kropki-i-kreski-online'],
    ['/dots?lang=en',     '/dots-and-boxes-online'],
    ['/hangman?lang=pl',  '/wisielec'],
    ['/hangman?lang=en',  '/hangman-online'],
    ['/taboo?lang=pl',    '/zakazane-slowa'],
    ['/taboo?lang=en',    '/forbidden-words'],
    ['/twotruth?lang=pl', '/dwie-prawdy-jedno-klamstwo'],
    ['/twotruth?lang=en', '/two-truths-one-lie'],
    ['/bingo?lang=pl',    '/korporacyjne-bingo'],
    ['/drawing?lang=pl',  '/szkicuj-i-zgaduj'],
    ['/drawing?lang=en',  '/sketch-and-guess'],
  ];
  await Promise.all(redirects.map(([from, to]) =>
    check(`${from} → ${to}`, async () => {
      const res = await fetch(BASE + from, { redirect: 'follow' });
      if (!res.url.includes(to)) throw new Error(`Got: ${res.url}`);
    })
  ));
}

// ─── 3. No JS errors (key pages only, parallel pairs) ────────────
async function testNoJsErrors(browser) {
  section('No JS errors (key pages)');
  const pages = [
    '/', '/games', '/gry', '/kropki-i-kreski-online',
    '/dots-and-boxes-online', '/who-am-i', '/jak-grac', '/how-to-play',
  ];
  for (let i = 0; i < pages.length; i += 2) {
    await Promise.all(pages.slice(i, i + 2).map(path =>
      check(path, async () => {
        const { ctx, errors } = await openPage(browser, BASE + path);
        await ctx.close();
        const real = errors.filter(e => !e.includes('gtag') && !e.includes('googletagmanager'));
        if (real.length) throw new Error(real[0]);
      })
    ));
  }
}

// ─── 4. SEO page language (parallel triples) ─────────────────────
async function testSeoLanguage(browser) {
  section('SEO pages — correct language on load');
  const pages = [
    ['/kropki-i-kreski-online',     'Kropki',      'Wszystkie gry'],
    ['/dots-and-boxes-online',      'Dots',        'All Games'],
    ['/punkte-und-linien-online',   'Punkte',      'Alle Spiele'],
    ['/punkter-och-linjer-online',  'Punkter',     'Alla spel'],
    ['/dwie-prawdy-jedno-klamstwo', 'Dwie',        'Wszystkie gry'],
    ['/two-truths-one-lie',         'Truths',      'All Games'],
    ['/wisielec',                   'Wisielec',    'Wszystkie gry'],
    ['/hangman-online',             'Hangman',     'All Games'],
    ['/szkicuj-i-zgaduj',           'Szkicuj',     'Wszystkie gry'],
    ['/sketch-and-guess',           'Sketch',      'All Games'],
    ['/zakazane-slowa',             'Zakazane',    'Wszystkie gry'],
    ['/forbidden-words',            'Forbidden',   'All Games'],
    ['/korporacyjne-bingo',         'Korporacyjne','Wszystkie gry'],
    ['/corporate-bingo',            'Corporate',   'All Games'],
    ['/kim-jestem',                 'Kim',         'Wszystkie gry'],
    ['/who-am-i',                   'Who',         'All Games'],
  ];
  for (let i = 0; i < pages.length; i += 3) {
    await Promise.all(pages.slice(i, i + 3).map(async ([url, expect, burger]) => {
      await check(`${url} — content "${expect}"`, async () => {
        const { page, ctx } = await openPage(browser, BASE + url);
        const h1    = await page.$eval('h1', el => el.textContent).catch(() => '');
        const title = await page.title();
        await ctx.close();
        if (!h1.includes(expect) && !title.includes(expect))
          throw new Error(`Expected "${expect}", h1="${h1.slice(0,50)}"`);
      });
      await check(`${url} — burger "${burger}"`, async () => {
        const { page, ctx } = await openPage(browser, BASE + url);
        await page.click('#gb-toggle').catch(() => {});
        await page.waitForSelector('#gb-nav.open', { timeout: 3000 }).catch(() => {});
        const text = await page.$eval('#gb-nav', el => el.innerText).catch(() => '');
        await ctx.close();
        if (!text.includes(burger)) throw new Error(`Expected "${burger}" in burger`);
      });
    }));
  }
}

// ─── 5. Hub pages ─────────────────────────────────────────────────
async function testHubPages(browser) {
  section('Games hub pages');
  const hubs = [
    ['/gry',    'Państwa',   'Wszystkie gry'],
    ['/spiele', 'Länder',    'Alle Spiele'],
    ['/spel',   'Länder',    'Alla spel'],
    ['/games',  'Countries', 'All Games'],
  ];
  await Promise.all(hubs.map(async ([url, expect, burger]) => {
    await check(`${url} — "${expect}"`, async () => {
      const { page, ctx } = await openPage(browser, BASE + url);
      const body = await page.$eval('body', el => el.innerText).catch(() => '');
      await ctx.close();
      if (!body.includes(expect)) throw new Error(`"${expect}" not found`);
    });
  }));
}

// ─── 6. Burger menu ───────────────────────────────────────────────
async function testBurgerMenu(browser) {
  section('Burger menu');
  const { page, ctx } = await openPage(browser, BASE + '/');
  await check('Toggle exists', async () => {
    if (!await page.$('#gb-toggle')) throw new Error('gb-toggle not found');
  });
  await page.click('#gb-toggle');
  await page.waitForSelector('#gb-nav.open', { timeout: 3000 });
  await check('Nav opens', async () => {
    if (!await page.$('#gb-nav.open')) throw new Error('did not open');
  });
  for (const href of ['/zakazane-slowa', '/wisielec', '/kropki-i-kreski-online',
                       '/dwie-prawdy-jedno-klamstwo', '/szkicuj-i-zgaduj']) {
    await check(`Link: ${href}`, async () => {
      if (!await page.$(`#gb-nav a[href*="${href}"]`)) throw new Error(`${href} not found`);
    });
  }
  await ctx.close();
}

// ─── 7. Footer links ──────────────────────────────────────────────
async function testFooterLinks(browser) {
  section('Footer links');
  const { page, ctx } = await openPage(browser, BASE + '/');
  await page.waitForSelector('#site-footer', { timeout: TIMEOUT });
  const links = await page.$$eval('#site-footer a', els =>
    els.map(a => a.href).filter(h => h && h.includes('panstwamiastagra.com'))
  );
  await ctx.close();
  await check(`Footer has links (${links.length})`, async () => {
    if (links.length < 5) throw new Error(`Only ${links.length}`);
  });
  for (let i = 0; i < links.length; i += 6) {
    await Promise.all(links.slice(i, i + 6).map(href =>
      check(`Footer: ${href.replace(BASE, '')}`, async () => {
        const res = await fetch(href, { redirect: 'follow' });
        if (res.status >= 400) throw new Error(`HTTP ${res.status}`);
      })
    ));
  }
}

// ─── 8. Language switch ───────────────────────────────────────────
async function testLanguageSwitch(browser) {
  section('Language switching');
  const tests = [
    ['/?lang=pl', '🇬🇧', 'All Games',     'lang=en'],
    ['/?lang=en', '🇵🇱', 'Wszystkie gry', 'lang=pl'],
    ['/?lang=pl', '🇩🇪', 'Alle Spiele',   'lang=de'],
    ['/?lang=pl', '🇸🇪', 'Alla spel',     'lang=sv'],
  ];
  for (const [path, flag, burger, param] of tests) {
    const { page, ctx } = await openPage(browser, BASE + path);
    await check(`${flag} — URL has ${param}`, async () => {
      const btn = await page.$(`button:has-text("${flag}")`);
      if (!btn) throw new Error(`Flag ${flag} not found`);
      await btn.click();
      await page.waitForTimeout(600);
      if (!page.url().includes(param)) throw new Error(`URL: ${page.url()}`);
    });
    await check(`${flag} — burger "${burger}"`, async () => {
      await page.click('#gb-toggle').catch(() => {});
      await page.waitForSelector('#gb-nav.open', { timeout: 3000 }).catch(() => {});
      const text = await page.$eval('#gb-nav', el => el.innerText).catch(() => '');
      if (!text.includes(burger)) throw new Error(`Expected "${burger}"`);
    });
    await ctx.close();
  }
}

// ─── 9. Game lobbies ──────────────────────────────────────────────
async function testGameLobbies(browser) {
  section('Game lobbies — 2 players connect');
  const games = [
    { name: 'PM',             path: '/',                           btn: 'Stwórz' },
    { name: 'Dots PL',        path: '/kropki-i-kreski-online',     btn: 'Stwórz' },
    { name: 'Dots EN',        path: '/dots-and-boxes-online',      btn: 'Create' },
    { name: 'Hangman PL',     path: '/wisielec',                   btn: 'Stwórz' },
    { name: 'Hangman EN',     path: '/hangman-online',             btn: 'Create' },
    { name: '2T1L PL',        path: '/dwie-prawdy-jedno-klamstwo', btn: 'Stwórz' },
    { name: '2T1L EN',        path: '/two-truths-one-lie',         btn: 'Create' },
    { name: 'Sketch EN',      path: '/sketch-and-guess',           btn: 'Create' },
    { name: 'Forbidden EN',   path: '/forbidden-words',            btn: 'Create' },
    { name: 'Bingo EN',       path: '/corporate-bingo',            btn: 'Create' },
    { name: 'Who Am I EN',    path: '/who-am-i',                   btn: 'Create', needsCat: true },
  ];

  for (const g of games) {
    const ctx1 = await browser.newContext();
    const ctx2 = await browser.newContext();
    const p1   = await ctx1.newPage();
    const p2   = await ctx2.newPage();
    p1.setDefaultTimeout(TIMEOUT);
    p2.setDefaultTimeout(TIMEOUT);
    let code = null;

    try {
      await check(`${g.name} — host creates room`, async () => {
        await p1.goto(BASE + g.path, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
        await p1.waitForSelector('#host-name', { timeout: TIMEOUT });
        await p1.fill('#host-name', 'SmokeHost');
        if (g.needsCat) await p1.click('[data-cat="mixed"]').catch(() => {});
        await p1.click(`button:has-text("${g.btn}")`);
        await p1.waitForSelector('#room-code-display', { timeout: TIMEOUT });
        code = (await p1.textContent('#room-code-display')).trim();
        if (!code || code.length < 4) throw new Error(`Bad code: "${code}"`);
      });

      if (!code) { fail(`${g.name} — guest joins`, 'No code'); continue; }

      await check(`${g.name} — guest joins`, async () => {
        await p2.goto(BASE + g.path, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
        await p2.fill('#join-name', 'SmokeGuest');
        await p2.fill('#join-code', code);
        await p2.click('button:has-text("Join"), button:has-text("Dołącz"), button:has-text("Gå med"), button:has-text("Beitreten")');
        await p2.waitForSelector('#lobby-players, .lobby-player, .dots-lobby-player', { timeout: TIMEOUT });
      });

      await check(`${g.name} — host sees 2 players`, async () => {
        await p1.waitForTimeout(700);
        const players = await p1.$$('.lobby-player, .dots-lobby-player');
        if (players.length < 2) throw new Error(`Only ${players.length} player(s)`);
      });

    } finally {
      await ctx1.close();
      await ctx2.close();
    }
  }
}

// ─── 10. Tabu — 4 players ─────────────────────────────────────────
async function testTabuLobby(browser) {
  section('Tabu — 4 players minimum');
  const ctxs = [], pages = [];
  try {
    for (let i = 0; i < 4; i++) {
      const ctx = await browser.newContext();
      const p   = await ctx.newPage();
      p.setDefaultTimeout(TIMEOUT);
      ctxs.push(ctx); pages.push(p);
    }
    let code = null;
    await check('Tabu — host creates', async () => {
      await pages[0].goto(BASE + '/zakazane-slowa', { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
      await pages[0].fill('#host-name', 'SmokeHost');
      await pages[0].click('button:has-text("Stwórz"), button:has-text("Create")');
      await pages[0].waitForSelector('#room-code-display', { timeout: TIMEOUT });
      code = (await pages[0].textContent('#room-code-display')).trim();
      if (!code || code.length < 4) throw new Error(`Bad code: "${code}"`);
    });
    if (!code) return;
    for (let i = 1; i <= 3; i++) {
      await check(`Tabu — player ${i + 1} joins`, async () => {
        await pages[i].goto(BASE + '/zakazane-slowa', { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
        await pages[i].fill('#join-name', `Player${i + 1}`);
        await pages[i].fill('#join-code', code);
        await pages[i].click('button:has-text("Dołącz"), button:has-text("Join")');
        await pages[i].waitForSelector('.lobby-player, #lobby-players', { timeout: TIMEOUT });
      });
    }
    await check('Tabu — host sees 4 players', async () => {
      await pages[0].waitForTimeout(700);
      const players = await pages[0].$$('.lobby-player, .team-player');
      if (players.length < 4) throw new Error(`Only ${players.length}`);
    });
  } finally {
    for (const ctx of ctxs) await ctx.close();
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
  const start   = Date.now();

  try {
    await testPageAvailability();
    await testLegacyRedirects();
    await testNoJsErrors(browser);
    await testSeoLanguage(browser);
    await testHubPages(browser);
    await testBurgerMenu(browser);
    await testFooterLinks(browser);
    await testLanguageSwitch(browser);
    await testGameLobbies(browser);
    await testTabuLobby(browser);
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
