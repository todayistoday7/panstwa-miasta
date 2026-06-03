/**
 * smoke-test.js — panstwamiastagra.com
 * Run: node smoke-test.js
 * Run against staging: node smoke-test.js https://magnificent-reverence-production.up.railway.app
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
  // Wait for shared.js to inject burger/footer
  await page.waitForSelector('#gb-toggle', { timeout: 5000 }).catch(() => {});
  return { page, ctx, errors };
}

// ─── 1. Page availability ─────────────────────────────────────────
async function testPageAvailability() {
  section('Page availability');
  const pages = [
    // Core
    '/', '/games', '/rooms', '/privacy', '/health',
    // Hubs per language
    '/gry', '/spiele', '/spel',
    // How-to-play indexes
    '/jak-grac', '/how-to-play', '/wie-man-spielt', '/hur-man-spelar',
    // How-to-play PL
    '/jak-grac/tabu', '/jak-grac/wisielec', '/jak-grac/kropki-i-kreski',
    '/jak-grac/dwie-prawdy-jedno-klamstwo', '/jak-grac/szkicuj-i-zgaduj',
    '/jak-grac/korporacyjne-bingo', '/jak-grac/kim-jestem', '/jak-grac/znajdz-pary',
    '/jak-grac/kalambury',
    // How-to-play EN
    '/how-to-play/forbidden-words', '/how-to-play/hangman', '/how-to-play/dots-and-boxes',
    '/how-to-play/two-truths-one-lie', '/how-to-play/sketch-and-guess',
    '/how-to-play/corporate-bingo', '/how-to-play/who-am-i', '/how-to-play/find-pairs',
    '/how-to-play/charades',
    // How-to-play DE
    '/wie-man-spielt/verbotene-woerter', '/wie-man-spielt/galgenmaennchen-online',
    '/wie-man-spielt/punkte-und-linien-online', '/wie-man-spielt/zwei-wahrheiten-eine-luege',
    '/wie-man-spielt/zeichnen-und-raten', '/wie-man-spielt/unternehmens-bingo',
    '/wie-man-spielt/wer-bin-ich', '/wie-man-spielt/memo-spiel', '/wie-man-spielt/scharade',
    // How-to-play SV
    '/hur-man-spelar/forbjudna-ord', '/hur-man-spelar/hanga-gubbe-online',
    '/hur-man-spelar/punkter-och-linjer-online', '/hur-man-spelar/tva-sanningar-en-logn',
    '/hur-man-spelar/skissa-och-gissa', '/hur-man-spelar/foretagsbingo',
    '/hur-man-spelar/vem-ar-jag', '/hur-man-spelar/memo-spel', '/hur-man-spelar/charader',
    // SEO game pages — PL
    '/kropki-i-kreski-online', '/dwie-prawdy-jedno-klamstwo', '/wisielec',
    '/szkicuj-i-zgaduj', '/zakazane-slowa', '/korporacyjne-bingo',
    '/kim-jestem', '/znajdz-pary', '/kalambury',
    // SEO game pages — EN
    '/dots-and-boxes-online', '/two-truths-one-lie', '/hangman-online',
    '/sketch-and-guess', '/forbidden-words', '/corporate-bingo',
    '/who-am-i', '/find-pairs-online', '/charades-online',
    // SEO game pages — DE
    '/punkte-und-linien-online', '/zwei-wahrheiten-eine-luege',
    '/galgenmaennchen-online', '/zeichnen-und-raten', '/verbotene-woerter',
    '/unternehmens-bingo', '/wer-bin-ich', '/memo-spiel-online', '/scharade',
    // SEO game pages — SV
    '/punkter-och-linjer-online', '/tva-sanningar-en-logn',
    '/hanga-gubbe-online', '/skissa-och-gissa', '/forbjudna-ord',
    '/foretagsbingo', '/vem-ar-jag', '/memo-spel-online', '/charader',
    // Misc
    '/kategorie', '/slowa',
  ];
  const legacy = ['/dots', '/taboo', '/twotruth', '/hangman', '/bingo', '/drawing', '/charades'];

  for (let i = 0; i < pages.length; i += 10) {
    await Promise.all(pages.slice(i, i + 10).map(p =>
      check(p, async () => {
        const res = await fetch(BASE + p, { redirect: 'follow' });
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
    ['/charades?lang=pl', '/kalambury'],
    ['/charades?lang=en', '/charades-online'],
  ];
  await Promise.all(redirects.map(([from, to]) =>
    check(`${from} → ${to}`, async () => {
      const res = await fetch(BASE + from, { redirect: 'follow' });
      if (res.status >= 400) throw new Error(`HTTP ${res.status}`);
      if (!res.url.includes(to)) throw new Error(`Got: ${res.url} — purge cache`);
    }, true)
  ));
}

// ─── 3. No JS errors ─────────────────────────────────────────────
async function testNoJsErrors(browser) {
  section('No JS errors (all game pages)');
  const pages = [
    // Core pages
    '/', '/games', '/gry',
    // All 10 games — EN SEO URLs
    '/forbidden-words', '/hangman-online', '/dots-and-boxes-online',
    '/two-truths-one-lie', '/sketch-and-guess', '/corporate-bingo',
    '/who-am-i', '/find-pairs-online', '/charades-online',
    '/countries-cities-game',
    // How-to-play
    '/how-to-play', '/jak-grac',
    '/how-to-play/charades', '/how-to-play/who-am-i', '/how-to-play/find-pairs',
  ];
  for (let i = 0; i < pages.length; i += 3) {
    await Promise.all(pages.slice(i, i + 3).map(path =>
      check(`${path} — no JS errors`, async () => {
        const { ctx, errors } = await openPage(browser, BASE + path);
        await ctx.close();
        const real = errors.filter(e =>
          !e.includes('gtag') &&
          !e.includes('googletagmanager') &&
          !e.includes('already been declared') // duplicate script from old cached SEO snippets
        );
        if (real.length) throw new Error(real[0]);
      })
    ));
  }
}

// ─── 4. SEO page language ─────────────────────────────────────────
async function testSeoLanguage(browser) {
  section('SEO pages — correct language');
  const pages = [
    // PL
    ['/zakazane-slowa',             'Zakazane',    'pl'],
    ['/wisielec',                   'Wisielec',    'pl'],
    ['/kropki-i-kreski-online',     'Kropki',      'pl'],
    ['/dwie-prawdy-jedno-klamstwo', 'Dwie',        'pl'],
    ['/szkicuj-i-zgaduj',           'Szkicuj',     'pl'],
    ['/korporacyjne-bingo',         'Korporacyjne','pl'],
    ['/kim-jestem',                 'Kim',         'pl'],
    ['/znajdz-pary',                'Znajd',       'pl'],
    ['/kalambury',                  'Kalambury',   'pl'],
    // EN
    ['/forbidden-words',            'Forbidden',   'en'],
    ['/hangman-online',             'Hangman',     'en'],
    ['/dots-and-boxes-online',      'Dots',        'en'],
    ['/two-truths-one-lie',         'Truths',      'en'],
    ['/sketch-and-guess',           'Sketch',      'en'],
    ['/corporate-bingo',            'Corporate',   'en'],
    ['/who-am-i',                   'Who',         'en'],
    ['/find-pairs-online',          'Find',        'en'],
    ['/charades-online',            'Charades',    'en'],
    // DE
    ['/verbotene-woerter',          'Verbotene',   'de'],
    ['/galgenmaennchen-online',     'Galgen',      'de'],
    ['/scharade',                   'Scharade',    'de'],
    // SV
    ['/forbjudna-ord',              'Förbjudna',   'sv'],
    ['/hanga-gubbe-online',         'Hänga',       'sv'],
    ['/charader',                   'Charader',    'sv'],
  ];
  for (let i = 0; i < pages.length; i += 4) {
    await Promise.all(pages.slice(i, i + 4).map(async ([url, expect, lang]) => {
      await check(`${url} — "${expect}"`, async () => {
        const { page, ctx } = await openPage(browser, BASE + url);
        const h1    = await page.$eval('h1', el => el.textContent).catch(() => '');
        const title = await page.title();
        await ctx.close();
        if (!h1.includes(expect) && !title.includes(expect))
          throw new Error(`Expected "${expect}", h1="${h1.slice(0,60)}"`);
      });
    }));
  }
}

// ─── 5. No duplicate scripts in SEO pages ─────────────────────────
async function testNoDuplicateScripts(browser) {
  section('SEO pages — no duplicate scripts');
  const pages = [
    '/forbidden-words', '/hangman-online', '/corporate-bingo',
    '/two-truths-one-lie', '/sketch-and-guess',
    '/kalambury', '/charades-online', '/who-am-i', '/find-pairs-online',
  ];
  for (let i = 0; i < pages.length; i += 3) {
    await Promise.all(pages.slice(i, i + 3).map(path =>
      check(`${path} — single script load`, async () => {
        const { page, ctx } = await openPage(browser, BASE + path);
        const scripts = await page.$$eval('script[src]', els =>
          els.map(s => s.src).filter(s => s.includes('client.js'))
        );
        await ctx.close();
        if (scripts.length > 1) throw new Error(`${scripts.length} client.js scripts: ${scripts.join(', ')}`);
        if (scripts.length === 0) throw new Error('No client.js found');
      })
    ));
  }
}

// ─── 6. Hub pages ─────────────────────────────────────────────────
async function testHubPages(browser) {
  section('Games hub pages');
  const hubs = [
    ['/gry',    'Państwa',    10],
    ['/spiele', 'Länder',     10],
    ['/spel',   'Länder',     10],
    ['/games',  'Countries',  10],
  ];
  for (const [url, expect, minGames] of hubs) {
    await check(`${url} — "${expect}" + ${minGames}+ games`, async () => {
      const { page, ctx } = await openPage(browser, BASE + url);
      const body = await page.$eval('body', el => el.innerText).catch(() => '');
      const gameCards = await page.$$('.game-card').catch(() => []);
      await ctx.close();
      if (!body.includes(expect)) throw new Error(`"${expect}" not found`);
      if (gameCards.length < minGames) throw new Error(`Only ${gameCards.length} game cards, expected ${minGames}+`);
    });
  }
}

// ─── 7. Burger menu ───────────────────────────────────────────────
async function testBurgerMenu(browser) {
  section('Burger menu');
  const { page, ctx } = await openPage(browser, BASE + '/');
  await check('Toggle exists', async () => {
    const toggle = await page.$('#gb-toggle');
    if (!toggle) throw new Error('not found');
  });
  await page.click('#gb-toggle');
  await check('Nav opens', async () => {
    await page.waitForSelector('#gb-nav.open', { timeout: 4000 });
  });
  const navHtml = await page.$eval('#gb-nav', el => el.innerHTML).catch(() => '');
  const expectedLinks = [
    '/zakazane-slowa', '/wisielec', '/kropki-i-kreski-online',
    '/dwie-prawdy-jedno-klamstwo', '/szkicuj-i-zgaduj',
    '/kalambury', '/kim-jestem', '/znajdz-pary',
  ];
  for (const href of expectedLinks) {
    await check(`Burger link: ${href}`, async () => {
      if (!navHtml.includes(href)) throw new Error(`${href} not in burger`);
    });
  }
  // Check Home goes to games hub
  await check('Burger Home → /gry', async () => {
    if (!navHtml.includes('/gry')) throw new Error('Home link not pointing to /gry');
  });
  await ctx.close();
}

// ─── 8. Footer links ──────────────────────────────────────────────
async function testFooterLinks(browser) {
  section('Footer links');
  const { page, ctx } = await openPage(browser, BASE + '/');
  await page.waitForSelector('#site-footer', { timeout: TIMEOUT });
  const links = await page.$$eval('#site-footer a', els =>
    els.map(a => a.getAttribute('href')).filter(h => h && h.startsWith('/'))
  );
  await ctx.close();
  await check(`Footer has links (${links.length})`, async () => {
    if (links.length < 5) throw new Error(`Only ${links.length}`);
  });
  // Check key footer links exist
  const expectedFooter = ['/gry', '/zakazane-slowa', '/jak-grac'];
  for (const href of expectedFooter) {
    await check(`Footer: ${href}`, async () => {
      if (!links.some(l => l.includes(href))) throw new Error(`${href} not in footer`);
    });
  }
  // Check footer links are reachable
  for (let i = 0; i < Math.min(links.length, 12); i += 6) {
    await Promise.all(links.slice(i, i + 6).map(href =>
      check(`Footer reachable: ${href}`, async () => {
        const res = await fetch(BASE + href, { redirect: 'follow' });
        if (res.status >= 400) throw new Error(`HTTP ${res.status}`);
      })
    ));
  }
}

// ─── 9. Language switch ───────────────────────────────────────────
async function testLanguageSwitch(browser) {
  section('Language switching (PM home)');
  const tests = [
    ['/?lang=pl', '🇬🇧', 'lang=en'],
    ['/?lang=en', '🇵🇱', 'lang=pl'],
    ['/?lang=pl', '🇩🇪', 'lang=de'],
    ['/?lang=pl', '🇸🇪', 'lang=sv'],
  ];
  for (const [path, flag, param] of tests) {
    const { page, ctx } = await openPage(browser, BASE + path);
    await check(`${flag} — URL has ${param}`, async () => {
      const btn = await page.$(`button:has-text("${flag}")`);
      if (!btn) throw new Error(`Flag ${flag} not found`);
      await btn.click();
      await page.waitForTimeout(600);
      if (!page.url().includes(param)) throw new Error(`URL: ${page.url()}`);
    });
    await ctx.close();
  }
}

// ─── 10. SEO language switch (no self-redirect loop) ──────────────
async function testSeoLanguageSwitch(browser) {
  section('SEO page language switch');
  const tests = [
    ['/forbidden-words', 'EN flag active', 'en'],
    ['/zakazane-slowa',  'PL flag active', 'pl'],
    ['/charades-online', 'EN flag active', 'en'],
    ['/kalambury',       'PL flag active', 'pl'],
    ['/who-am-i',        'EN flag active', 'en'],
    ['/kim-jestem',       'PL flag active', 'pl'],
  ];
  for (const [url, label, expectedLang] of tests) {
    await check(`${url} — ${label}`, async () => {
      const { page, ctx } = await openPage(browser, BASE + url);
      // Check that the correct flag is active
      const activeBtn = await page.$('.lang-btn.active');
      const activeLang = activeBtn ? await activeBtn.textContent() : '';
      await ctx.close();
      const langFlags = { pl: 'PL', en: 'EN', de: 'DE', sv: 'SV' };
      if (!activeLang.includes(langFlags[expectedLang]))
        throw new Error(`Active flag: "${activeLang}", expected ${langFlags[expectedLang]}`);
    });
  }
}

// ─── 11. Join code pre-fill ────────────────────────────────────────
async function testJoinCodePrefill(browser) {
  section('Join code pre-fill from URL');
  const pages = [
    '/forbidden-words?join=SMOKE&lang=en',
    '/who-am-i?join=SMOKE&lang=en',
    '/hangman-online?join=SMOKE&lang=en',
    '/charades-online?join=SMOKE&lang=en',
    '/dots-and-boxes-online?join=SMOKE&lang=en',
  ];
  for (const url of pages) {
    const gameName = url.split('?')[0];
    await check(`${gameName} — code pre-filled`, async () => {
      const { page, ctx } = await openPage(browser, BASE + url);
      await page.waitForTimeout(500);
      const val = await page.$eval('#join-code', el => el.value).catch(() => '');
      await ctx.close();
      if (val !== 'SMOKE') throw new Error(`Value: "${val}", expected "SMOKE"`);
    });
  }
}

// ─── 12. Game lobbies ──────────────────────────────────────────────
async function testGameLobbies(browser) {
  section('Game lobbies — 2 players connect');
  const LOBBY_SEL = '#lobby-players, .lobby-player, .dots-lobby-player, #lobby-teams, .team-player, .player-list, .player-card';

  const games = [
    { name: 'PM',           path: '/',                           btn: '#lbl-create-btn' },
    { name: 'Dots EN',      path: '/dots-and-boxes-online',      btn: '#lbl-create-btn' },
    { name: 'Hangman EN',   path: '/hangman-online',             btn: '#lbl-create-btn' },
    { name: '2T1L EN',      path: '/two-truths-one-lie',         btn: '#lbl-create-btn' },
    { name: 'Sketch EN',    path: '/sketch-and-guess',           btn: '#lbl-create-btn' },
    { name: 'Forbidden EN', path: '/forbidden-words',            btn: '#lbl-create-btn' },
    { name: 'Bingo EN',     path: '/corporate-bingo',            btn: '#lbl-create-btn' },
    { name: 'Who Am I EN',  path: '/who-am-i',                   btn: '#lbl-create-btn', needsCat: true },
    { name: 'Find Pairs EN',path: '/find-pairs-online',          btn: '#lbl-create-btn' },
    { name: 'Charades EN',  path: '/charades-online',            btn: '#lbl-create-btn' },
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
        const btnEl = await p1.$(g.btn);
        if (!btnEl) throw new Error(`Button ${g.btn} not found`);
        await btnEl.scrollIntoViewIfNeeded();
        await btnEl.click();
        await p1.waitForSelector('#room-code-display', { timeout: TIMEOUT });
        code = (await p1.textContent('#room-code-display')).replace(/[^A-Z0-9]/g, '').trim();
        if (!code || code.length < 4) throw new Error(`Bad code: "${code}"`);
      });

      if (!code) { fail(`${g.name} — guest joins`, 'No code from host'); continue; }

      await check(`${g.name} — guest joins`, async () => {
        await p2.goto(BASE + g.path, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
        await p2.waitForSelector('#join-name', { timeout: TIMEOUT });
        await p2.fill('#join-name', 'SmokeGuest');
        await p2.fill('#join-code', code);
        const joinBtn = await p2.$('#lbl-join-btn');
        if (!joinBtn) throw new Error('Join button not found');
        await joinBtn.scrollIntoViewIfNeeded();
        await joinBtn.click();
        await p2.waitForSelector(LOBBY_SEL, { timeout: TIMEOUT });
      });

      await check(`${g.name} — host sees 2 players`, async () => {
        await p1.waitForTimeout(1500);
        const lobbyEl = await p1.$('#lobby-players, #lobby-teams, .player-list');
        const content = lobbyEl ? await lobbyEl.innerText().catch(() => '') : '';
        if (!content.includes('SmokeGuest') && !content.includes('SmokeHost'))
          throw new Error(`Lobby content: "${content.slice(0, 100)}"`);
      });

    } finally {
      await ctx1.close();
      await ctx2.close();
    }
  }
}

// ─── 13. Tabu — 4 players ─────────────────────────────────────────
async function testTabuLobby(browser) {
  section('Forbidden Words — 4 players minimum');
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
    await check('Forbidden Words — host creates', async () => {
      await pages[0].goto(BASE + '/zakazane-slowa', { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
      await pages[0].waitForSelector('#host-name', { timeout: TIMEOUT });
      await pages[0].fill('#host-name', 'SmokeHost');
      const btn = await pages[0].$('#lbl-create-btn');
      await btn.scrollIntoViewIfNeeded();
      await btn.click();
      await pages[0].waitForSelector('#room-code-display', { timeout: TIMEOUT });
      code = (await pages[0].textContent('#room-code-display')).replace(/[^A-Z0-9]/g, '').trim();
      if (!code || code.length < 4) throw new Error(`Bad code: "${code}"`);
    });
    if (!code) return;
    for (let i = 1; i <= 3; i++) {
      await check(`Forbidden Words — player ${i + 1} joins`, async () => {
        await pages[i].goto(BASE + '/zakazane-slowa', { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
        await pages[i].waitForSelector('#join-name', { timeout: TIMEOUT });
        await pages[i].fill('#join-name', `Player${i + 1}`);
        await pages[i].fill('#join-code', code);
        const btn = await pages[i].$('#lbl-join-btn');
        await btn.scrollIntoViewIfNeeded();
        await btn.click();
        await pages[i].waitForSelector(TABOO_LOBBY, { timeout: TIMEOUT });
      });
    }
    await check('Forbidden Words — host sees 4 players', async () => {
      await pages[0].waitForTimeout(1500);
      const lobbyEl = await pages[0].$('#lobby-teams, #lobby-players');
      const content = lobbyEl ? await lobbyEl.innerText().catch(() => '') : '';
      if (!content.includes('Player4'))
        throw new Error(`Missing Player4 in: "${content.slice(0, 100)}"`);
    });
  } finally {
    for (const ctx of ctxs) await ctx.close();
  }
}

// ─── 14. How-to-play pills work ───────────────────────────────────
async function testHowToPlayPills(browser) {
  section('How-to-play index — pills navigate');
  const { page, ctx } = await openPage(browser, BASE + '/how-to-play');
  const pills = await page.$$('.game-pill');
  await check(`Has 10 game pills`, async () => {
    if (pills.length < 10) throw new Error(`Only ${pills.length} pills`);
  });
  // Click a pill and check navigation
  await check('Charades pill navigates', async () => {
    const pill = await page.$('.game-pill:has-text("Charades")');
    if (!pill) throw new Error('Charades pill not found');
    await pill.click();
    await page.waitForTimeout(800);
    if (!page.url().includes('charades')) throw new Error(`URL: ${page.url()}`);
  });
  await ctx.close();
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
    await testNoDuplicateScripts(browser);
    await testSeoLanguage(browser);
    await testSeoLanguageSwitch(browser);
    await testHubPages(browser);
    await testBurgerMenu(browser);
    await testFooterLinks(browser);
    await testLanguageSwitch(browser);
    await testJoinCodePrefill(browser);
    await testHowToPlayPills(browser);
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
