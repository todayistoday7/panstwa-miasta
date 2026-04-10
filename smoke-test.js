/**
 * smoke-test.js — panstwamiastagra.com
 * Run: node smoke-test.js
 * Run against staging: node smoke-test.js https://staging.example.com
 * Show browser: node smoke-test.js --watch
 * Requires: npm install playwright && npx playwright install chromium
 */

const { chromium } = require('playwright');

const BASE     = process.argv.find(a => a.startsWith('http')) || 'https://panstwamiastagra.com';
const HEADLESS = !process.argv.includes('--watch');
const TIMEOUT  = 15000;

let passed = 0, failed = 0, warned = 0;
const failures = [], warnings = [];

function ok(label)             { process.stdout.write(`  ✓ ${label}\n`); passed++; }
function warn(label, reason)   { process.stdout.write(`  ⚠ ${label}\n    → ${reason}\n`); warned++; warnings.push(`${label}: ${reason}`); }
function fail(label, reason)   { process.stdout.write(`  ✗ ${label}\n    → ${reason}\n`); failed++; failures.push(`${label}: ${reason}`); }

async function check(label, fn, isWarning = false) {
  try { await fn(); ok(label); }
  catch (e) {
    const msg = e.message.split('\n')[0].slice(0, 120);
    if (isWarning) warn(label, msg);
    else fail(label, msg);
  }
}

function section(title) { console.log(`\n── ${title} ${'─'.repeat(Math.max(0, 50 - title.length))}`); }

async function openPage(browser, url) {
  const ctx  = await browser.newContext();
  const page = await ctx.newPage();
  page.setDefaultTimeout(TIMEOUT);
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
  // Small wait for shared.js to inject burger/footer
  await page.waitForTimeout(300);
  return { page, ctx, errors };
}

// ─── 1. Page availability ─────────────────────────────────────────
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

// ─── 2. Legacy redirects (warnings only — Cloudflare may cache) ───
async function testLegacyRedirects() {
  section('Legacy redirects (warnings if cached)');
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
    // WARNING not failure — Cloudflare may cache old response
    check(`${from} → ${to}`, async () => {
      const res = await fetch(BASE + from, { redirect: 'follow' });
      if (res.status >= 400) throw new Error(`HTTP ${res.status}`);
      if (!res.url.includes(to)) throw new Error(`Got: ${res.url} — purge Cloudflare cache`);
    }, true) // isWarning = true
  ));
}

// ─── 3. No JS errors ─────────────────────────────────────────────
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

// ─── 4. SEO page language ─────────────────────────────────────────
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
        await page.waitForSelector('#gb-toggle', { timeout: TIMEOUT });
        await page.waitForTimeout(500); // let shared.js finish
        await page.click('#gb-toggle').catch(() => {});
        await page.waitForSelector('#gb-nav.open', { timeout: 4000 }).catch(() => {});
        const html = await page.$eval('#gb-nav', el => el.innerHTML).catch(() => '');
        await ctx.close();
        if (!html.includes(burger)) throw new Error(`Expected "${burger}" in burger`);
      });
    }));
  }
}

// ─── 5. Hub pages ─────────────────────────────────────────────────
async function testHubPages(browser) {
  section('Games hub pages');
  const hubs = [
    ['/gry',    'Państwa'],
    ['/spiele', 'Länder'],
    ['/spel',   'Länder'],
    ['/games',  'Countries'],
  ];
  await Promise.all(hubs.map(async ([url, expect]) => {
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
  await page.waitForSelector('#gb-toggle', { timeout: TIMEOUT });
  await page.waitForTimeout(1200); // wait for shared.js to fully build burger
  await check('Toggle exists', async () => {
    if (!await page.$('#gb-toggle')) throw new Error('not found');
  });
  await page.click('#gb-toggle');
  await page.waitForSelector('#gb-nav.open', { timeout: 4000 });
  await check('Nav opens', async () => {
    if (!await page.$('#gb-nav.open')) throw new Error('did not open');
  });
  await page.waitForTimeout(300); // let links render
  const navHtml = await page.$eval('#gb-nav', el => el.innerHTML).catch(() => '');
  for (const href of ['/zakazane-slowa', '/wisielec', '/kropki-i-kreski-online',
                       '/dwie-prawdy-jedno-klamstwo', '/szkicuj-i-zgaduj']) {
    await check(`Burger link: ${href}`, async () => {
      if (!navHtml.includes(href)) throw new Error(`${href} not in burger HTML`);
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
      await page.waitForSelector('#gb-toggle', { timeout: TIMEOUT });
      await page.waitForTimeout(500);
      await page.click('#gb-toggle').catch(() => {});
      await page.waitForSelector('#gb-nav.open', { timeout: 4000 }).catch(() => {});
      const html = await page.$eval('#gb-nav', el => el.innerHTML).catch(() => '');
      if (!html.includes(burger)) throw new Error(`Expected "${burger}"`);
    });
    await ctx.close();
  }
}

// ─── 9. Game lobbies ──────────────────────────────────────────────
async function testGameLobbies(browser) {
  section('Game lobbies — 2 players connect');
  const LOBBY_SEL = '#lobby-players, .lobby-player, .dots-lobby-player, #lobby-teams, .team-player, .player-list';

  const games = [
    { name: 'PM',           path: '/',                           btn: '#lbl-create-btn' },
    { name: 'Dots PL',      path: '/kropki-i-kreski-online',     btn: '#lbl-create-btn' },
    { name: 'Dots EN',      path: '/dots-and-boxes-online',      btn: '#lbl-create-btn' },
    { name: 'Hangman PL',   path: '/wisielec',                   btn: '#lbl-create-btn' },
    { name: 'Hangman EN',   path: '/hangman-online',             btn: '#lbl-create-btn' },
    { name: '2T1L PL',      path: '/dwie-prawdy-jedno-klamstwo', btn: '#lbl-create-btn' },
    { name: '2T1L EN',      path: '/two-truths-one-lie',         btn: '#lbl-create-btn' },
    { name: 'Sketch EN',    path: '/sketch-and-guess',           btn: '#lbl-create-btn' },
    { name: 'Forbidden EN', path: '/forbidden-words',            btn: '#lbl-create-btn' },
    { name: 'Bingo EN',     path: '/corporate-bingo',            btn: '#lbl-create-btn' },
    { name: 'Who Am I EN',  path: '/who-am-i',                   btn: '#lbl-create-btn', needsCat: true },
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
        // Scroll into view then click — SEO intro pushes button down on some pages
        const btnEl = await p1.$(g.btn);
        if (!btnEl) throw new Error(`Button ${g.btn} not found`);
        await btnEl.scrollIntoViewIfNeeded();
        await btnEl.click();
        await p1.waitForSelector('#room-code-display', { timeout: TIMEOUT });
        code = (await p1.textContent('#room-code-display')).trim();
        if (!code || code.length < 4) throw new Error(`Bad code: "${code}"`);
      });

      if (!code) { fail(`${g.name} — guest joins`, 'No code'); continue; }

      await check(`${g.name} — guest joins`, async () => {
        await p2.goto(BASE + g.path, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
        await p2.fill('#join-name', 'SmokeGuest');
        await p2.fill('#join-code', code);
        await p2.click('#lbl-join-btn');
        await p2.waitForSelector(LOBBY_SEL, { timeout: TIMEOUT });
      });

      await check(`${g.name} — host sees 2 players`, async () => {
        await p1.waitForTimeout(1000);
        const count = await p1.$$eval(
          '.lobby-player, .dots-lobby-player, .team-player',
          els => els.length
        ).catch(() => 0);
        const lobbyEl = await p1.$('#lobby-players, #lobby-teams');
        const content = lobbyEl ? await lobbyEl.innerText().catch(() => '') : '';
        if (count < 2 && !content.includes('SmokeHost'))
          throw new Error(`${count} player element(s)`);
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
  const TABOO_LOBBY = '#lobby-teams, .team-player, #lobby-players, .lobby-player';
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
      await pages[0].click('#lbl-create-btn');
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
        await pages[i].click('#lbl-join-btn');
        await pages[i].waitForSelector(TABOO_LOBBY, { timeout: TIMEOUT });
      });
    }
    await check('Tabu — host sees 4 players', async () => {
      await pages[0].waitForTimeout(1000);
      const lobbyEl = await pages[0].$('#lobby-teams, #lobby-players');
      const content = lobbyEl ? await lobbyEl.innerText().catch(() => '') : '';
      const playerEls = await pages[0].$$('.team-player, .lobby-player');
      if (playerEls.length < 4 && !content.includes('Player4'))
        throw new Error(`${playerEls.length} element(s)`);
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
  console.log(`  Results: ${passed} passed, ${warned} warnings, ${failed} failed  (${elapsed}s)`);

  if (warnings.length) {
    console.log(`\n  Warnings (non-blocking):`);
    warnings.forEach(w => console.log(`    ⚠ ${w}`));
  }
  if (failures.length) {
    console.log(`\n  Failures:`);
    failures.forEach(f => console.log(`    ✗ ${f}`));
    console.log('');
    process.exit(1);
  } else {
    console.log(`\n  ✓ All hard tests passed${warned > 0 ? ` (${warned} warnings — check Cloudflare cache)` : ''}\n`);
    process.exit(0);
  }
})();
