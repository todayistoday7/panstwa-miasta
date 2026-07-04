// ════════════════════════════════════════════════════════
// SERVER ENTRY POINT
// Handles Express setup, Socket.io, and delegates game
// logic to routes/pm.js and routes/taboo.js
// ════════════════════════════════════════════════════════
'use strict';

const express     = require('express');
const http        = require('http');
const { Server }  = require('socket.io');
const path        = require('path');
const compression = require('compression');

const pm    = require('./routes/pm');
const taboo = require('./routes/taboo');
const dots       = require('./routes/dots');
const twotruth   = require('./routes/twotruth');
const hangman    = require('./routes/hangman');
const bingo      = require('./routes/bingo');
const drawing    = require('./routes/drawing');
const whoami     = require('./routes/whoami');
const memory     = require('./routes/memory');
const charades   = require('./routes/charades');
const lobbyHub   = require('./routes/lobby');
const admin      = require('./routes/admin');

const app = express();
const seoInject = require('./seo-inject');
app.use(compression());
try {
  app.use(require('cookie-parser')());
} catch(e) {
  // cookie-parser not installed yet — admin sessions won't work until redeploy
  app.use(function(req, res, next) { req.cookies = {}; next(); });
}

// ─── SECURITY HEADERS ───────────────────────────────────
app.use(function(req, res, next) {
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// ─── MULTI-DOMAIN SUPPORT ────────────────────────────────
const GA_DEFAULT = 'G-BJ79ZM6WPQ'; // panstwamiastagra.com
const GA_RFG     = 'G-4T6TKZ7MPV'; // roomforgames.com

const PROD_DOMAINS = ['panstwamiastagra.com', 'www.panstwamiastagra.com', 'roomforgames.com', 'www.roomforgames.com'];

function isRFG(req) {
  const host = (req.hostname || req.headers.host || '').replace(/:\d+$/, '').toLowerCase();
  if (host === 'roomforgames.com' || host === 'www.roomforgames.com') return true;
  // Staging override: ?rfg=1 works only on non-production URLs (e.g. railway staging)
  if (req.query && req.query.rfg === '1' && PROD_DOMAINS.indexOf(host) === -1) return true;
  return false;
}

// Middleware: swap GA tag + inject _rfgDomain flag for RFG domain
// Uses stream-level interception to catch express.static (sendFile) responses
app.use((req, res, next) => {
  if (!isRFG(req)) return next();
  const _send = res.send.bind(res);
  const _end = res.end.bind(res);
  const _write = res.write.bind(res);
  let chunks = [];
  let isHtml = false;
  const _writeHead = res.writeHead.bind(res);

  function checkContentType() {
    const ct = res.getHeader('content-type') || '';
    return ct.includes('text/html') || ct.includes('application/javascript');
  }

  function swapBody(body) {
    if (body.includes(GA_DEFAULT)) body = body.split(GA_DEFAULT).join(GA_RFG);
    if (body.includes('<script') && !body.includes('window._rfgDomain')) {
      body = body.replace(/<script/, '<script>window._rfgDomain=true;</script>\n<script');
    }
    // Swap canonical + og:url so Google indexes RFG independently
    body = body.replace(/(rel="canonical"[^>]*href="https?:\/\/)panstwamiastagra\.com/g, '$1roomforgames.com');
    body = body.replace(/(property="og:url"[^>]*content="https?:\/\/)panstwamiastagra\.com/g, '$1roomforgames.com');
    return body;
  }

  res.writeHead = function(status, headers) {
    isHtml = checkContentType();
    if (isHtml) { res.removeHeader('content-length'); res.removeHeader('Content-Length'); }
    return _writeHead(status, headers);
  };
  res.send = function(body) {
    if (typeof body === 'string') body = swapBody(body);
    return _send(body);
  };
  res.write = function(chunk, encoding) {
    if (!isHtml && !chunks.length) { isHtml = checkContentType(); if (isHtml) { res.removeHeader('content-length'); res.removeHeader('Content-Length'); } }
    if (isHtml) { chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding)); return true; }
    return _write(chunk, encoding);
  };
  res.end = function(chunk, encoding) {
    if (chunk) {
      if (!isHtml) { isHtml = checkContentType(); if (isHtml) { res.removeHeader('content-length'); res.removeHeader('Content-Length'); } }
      if (isHtml) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding));
    }
    if (isHtml && chunks.length) {
      let body = swapBody(Buffer.concat(chunks).toString('utf-8'));
      return _end(body, 'utf-8');
    }
    return chunk ? _end(chunk, encoding) : _end();
  };
  next();
});

// ─── STATIC + PAGE ROUTES ────────────────────────────────
// Homepage: roomforgames.com → games hub | panstwamiastagra.com → PM game
app.get('/', function(req, res, next) {
  if (isRFG(req)) {
    const fs = require('fs');
    let html = fs.readFileSync(path.join(__dirname, 'public/home.html'), 'utf-8');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(html);
  }
  return seoInject('pm', 'pl')(req, res, next);
});

app.get('/taboo', (req, res) => res.sendFile(path.join(__dirname, 'public/taboo.html')));
app.get('/twotruth', (req, res) => res.sendFile(path.join(__dirname, 'public/twotruth.html')));
app.get('/dots',        (req, res) => res.sendFile(path.join(__dirname, 'public/dots.html')));
app.get('/hangman',     (req, res) => res.sendFile(path.join(__dirname, 'public/hangman.html')));
app.get('/bingo',       (req, res) => res.sendFile(path.join(__dirname, 'public/bingo.html')));
// DRAWING TELEPHONE — hidden until ready to launch
app.get('/drawing',     (req, res) => res.sendFile(path.join(__dirname, 'public/drawing.html')));
// /memory is now a 301 redirect to SEO pages (see below)

// ── Who Am I — SEO pages (not linked in nav yet) ────────────────
app.get('/kim-jestem', seoInject('whoami', 'pl'));
app.get('/who-am-i',   seoInject('whoami', 'en'));
app.get('/wer-bin-ich',seoInject('whoami', 'de'));
app.get('/vem-ar-jag', seoInject('whoami', 'sv'));
app.get('/whoami',     (req, res) => res.redirect(301, '/who-am-i'));

// ── Państwa Miasta — SEO pages (EN/DE/SV — PL stays on root /) ──
app.get('/countries-cities-game', seoInject('pm', 'en'));
app.get('/stadt-land-fluss-online', seoInject('pm', 'de'));
app.get('/laender-und-staedte', (req, res) => res.redirect(301, '/stadt-land-fluss-online'));
app.get('/laender-och-staeder',   seoInject('pm', 'sv'));

// ── How-to-play pages — new additions ───────────────────────────
app.get('/jak-grac/korporacyjne-bingo',          (req,res) => res.sendFile(path.join(__dirname,'public/jak-grac/korporacyjne-bingo.html')));
app.get('/how-to-play/corporate-bingo',           (req,res) => res.sendFile(path.join(__dirname,'public/how-to-play/corporate-bingo.html')));
app.get('/wie-man-spielt/galgenmaennchen-online', (req,res) => res.sendFile(path.join(__dirname,'public/wie-man-spielt/galgenmaennchen-online.html')));
app.get('/wie-man-spielt/verbotene-woerter',      (req,res) => res.sendFile(path.join(__dirname,'public/wie-man-spielt/verbotene-woerter.html')));
app.get('/wie-man-spielt/punkte-und-linien-online',(req,res) => res.sendFile(path.join(__dirname,'public/wie-man-spielt/punkte-und-linien-online.html')));
app.get('/wie-man-spielt/zwei-wahrheiten-eine-luege',(req,res) => res.sendFile(path.join(__dirname,'public/wie-man-spielt/zwei-wahrheiten-eine-luege.html')));
app.get('/wie-man-spielt/unternehmens-bingo',     (req,res) => res.sendFile(path.join(__dirname,'public/wie-man-spielt/unternehmens-bingo.html')));
app.get('/jak-grac/kim-jestem',              (req,res) => res.sendFile(path.join(__dirname,'public/jak-grac/kim-jestem.html')));
app.get('/how-to-play/who-am-i',             (req,res) => res.sendFile(path.join(__dirname,'public/how-to-play/who-am-i.html')));
app.get('/wie-man-spielt/wer-bin-ich',       (req,res) => res.sendFile(path.join(__dirname,'public/wie-man-spielt/wer-bin-ich.html')));
app.get('/hur-man-spelar/vem-ar-jag',        (req,res) => res.sendFile(path.join(__dirname,'public/hur-man-spelar/vem-ar-jag.html')));
// ── How-to-play — Find Pairs / Memo ──
app.get('/jak-grac/znajdz-pary',             (req,res) => res.sendFile(path.join(__dirname,'public/jak-grac/znajdz-pary.html')));
app.get('/how-to-play/find-pairs',           (req,res) => res.sendFile(path.join(__dirname,'public/how-to-play/find-pairs.html')));
app.get('/wie-man-spielt/memo-spiel',        (req,res) => res.sendFile(path.join(__dirname,'public/wie-man-spielt/memo-spiel.html')));
app.get('/hur-man-spelar/memo-spel',         (req,res) => res.sendFile(path.join(__dirname,'public/hur-man-spelar/memo-spel.html')));
app.get('/hur-man-spelar/hanga-gubbe-online',     (req,res) => res.sendFile(path.join(__dirname,'public/hur-man-spelar/hanga-gubbe-online.html')));
app.get('/hur-man-spelar/forbjudna-ord',          (req,res) => res.sendFile(path.join(__dirname,'public/hur-man-spelar/forbjudna-ord.html')));
app.get('/hur-man-spelar/punkter-och-linjer-online',(req,res) => res.sendFile(path.join(__dirname,'public/hur-man-spelar/punkter-och-linjer-online.html')));
app.get('/hur-man-spelar/tva-sanningar-en-logn',  (req,res) => res.sendFile(path.join(__dirname,'public/hur-man-spelar/tva-sanningar-en-logn.html')));
app.get('/hur-man-spelar/foretagsbingo',          (req,res) => res.sendFile(path.join(__dirname,'public/hur-man-spelar/foretagsbingo.html')));

// ── How to play — Charades ──────────────────────────────────────
app.get('/jak-grac/kalambury',                    (req,res) => res.sendFile(path.join(__dirname,'public/jak-grac/kalambury.html')));
app.get('/how-to-play/charades',                  (req,res) => res.sendFile(path.join(__dirname,'public/how-to-play/charades.html')));
app.get('/wie-man-spielt/scharade',               (req,res) => res.sendFile(path.join(__dirname,'public/wie-man-spielt/scharade.html')));
app.get('/hur-man-spelar/charader',               (req,res) => res.sendFile(path.join(__dirname,'public/hur-man-spelar/charader.html')));

// ── Blog Articles ───────────────────────────────────────────────
app.get('/blog/what-to-play-online',             (req,res) => res.sendFile(path.join(__dirname,'public/blog/what-to-play-online.html')));
app.get('/blog/w-co-grac-online',                (req,res) => res.sendFile(path.join(__dirname,'public/blog/w-co-grac-online.html')));
app.get('/blog/was-online-spielen',              (req,res) => res.sendFile(path.join(__dirname,'public/blog/was-online-spielen.html')));
app.get('/blog/vad-spela-online',                (req,res) => res.sendFile(path.join(__dirname,'public/blog/vad-spela-online.html')));

// ── SEO Landing Pages — Forbidden Words ─────────────────────────
app.get('/zakazane-slowa',    seoInject('taboo', 'pl'));
app.get('/forbidden-words',   seoInject('taboo', 'en'));
app.get('/verbotene-woerter', seoInject('taboo', 'de'));
app.get('/forbjudna-ord',     seoInject('taboo', 'sv'));

// Legacy redirect
app.get('/taboo', (req, res) => {
  const lang = req.query.lang || 'en';
  const map = { pl:'/zakazane-slowa', de:'/verbotene-woerter', sv:'/forbjudna-ord' };
  res.redirect(301, map[lang] || '/forbidden-words');
});

// ── SEO Landing Pages — Corporate Bingo ──────────────────────────
app.get('/korporacyjne-bingo',  seoInject('bingo', 'pl'));
app.get('/corporate-bingo',     seoInject('bingo', 'en'));
app.get('/unternehmens-bingo',  seoInject('bingo', 'de'));
app.get('/foretagsbingo',       seoInject('bingo', 'sv'));

// Legacy redirect
app.get('/bingo', (req, res) => {
  const lang = req.query.lang || 'en';
  const map = { pl:'/korporacyjne-bingo', de:'/unternehmens-bingo', sv:'/foretagsbingo' };
  res.redirect(301, map[lang] || '/corporate-bingo');
});

// ── SEO Landing Pages — Sketch & Guess ──────────────────────────
app.get('/szkicuj-i-zgaduj',   seoInject('drawing', 'pl'));
app.get('/sketch-and-guess',   seoInject('drawing', 'en'));
app.get('/zeichnen-und-raten', seoInject('drawing', 'de'));
app.get('/skissa-och-gissa',   seoInject('drawing', 'sv'));

// Legacy redirect
app.get('/drawing', (req, res) => {
  const lang = req.query.lang || 'pl';
  const map = { pl:'/szkicuj-i-zgaduj', en:'/sketch-and-guess', de:'/zeichnen-und-raten', sv:'/skissa-och-gissa' };
  res.redirect(301, map[lang] || '/sketch-and-guess');
});

// ── SEO Landing Pages — Hangman ─────────────────────────────────
app.get('/wisielec',                seoInject('hangman', 'pl'));
app.get('/hangman-online',          seoInject('hangman', 'en'));
app.get('/galgenmaennchen-online',  seoInject('hangman', 'de'));
app.get('/hanga-gubbe-online',      seoInject('hangman', 'sv'));

// Legacy redirect
app.get('/hangman', (req, res) => {
  const lang = req.query.lang || 'en';
  const map = { pl:'/wisielec', de:'/galgenmaennchen-online', sv:'/hanga-gubbe-online' };
  res.redirect(301, map[lang] || '/hangman-online');
});

// ── SEO Landing Pages — Two Truths One Lie ──────────────────────
app.get('/dwie-prawdy-jedno-klamstwo',  seoInject('twotruth', 'pl'));
app.get('/two-truths-one-lie',          seoInject('twotruth', 'en'));
app.get('/zwei-wahrheiten-eine-luege',  seoInject('twotruth', 'de'));
app.get('/tva-sanningar-en-logn',       seoInject('twotruth', 'sv'));

// Legacy redirect
app.get('/twotruth', (req, res) => {
  const lang = req.query.lang || 'en';
  const map = { pl:'/dwie-prawdy-jedno-klamstwo', de:'/zwei-wahrheiten-eine-luege', sv:'/tva-sanningar-en-logn' };
  res.redirect(301, map[lang] || '/two-truths-one-lie');
});

// ── SEO Landing Pages — Dots & Boxes ─────────────────────────────
// Dots SEO pages — Option B: server-side injection from dots.html + snippets
// Old static routes (kept for rollback):
// app.get('/kropki-i-kreski-online',   (req, res) => res.sendFile(path.join(__dirname, 'public/seo/kropki-i-kreski-online.html')));
// app.get('/dots-and-boxes-online',    (req, res) => res.sendFile(path.join(__dirname, 'public/seo/dots-and-boxes-online.html')));
// app.get('/punkte-und-linien-online', (req, res) => res.sendFile(path.join(__dirname, 'public/seo/punkte-und-linien-online.html')));
// app.get('/punkter-och-linjer-online',(req, res) => res.sendFile(path.join(__dirname, 'public/seo/punkter-och-linjer-online.html')));
app.get('/kropki-i-kreski-online',    seoInject('dots', 'pl'));
app.get('/dots-and-boxes-online',     seoInject('dots', 'en'));
app.get('/punkte-und-linien-online',  seoInject('dots', 'de'));
app.get('/punkter-och-linjer-online', seoInject('dots', 'sv'));

// ── SEO Landing Pages — Find Pairs ──────────────────────────────
app.get('/znajdz-pary',          seoInject('memory', 'pl'));
app.get('/find-pairs-online',    seoInject('memory', 'en'));
app.get('/memo-spiel-online',    seoInject('memory', 'de'));
app.get('/memo-spel-online',     seoInject('memory', 'sv'));
app.get('/paare-finden-online',  (req, res) => res.redirect(301, '/memo-spiel-online'));
app.get('/hitta-par-online',     (req, res) => res.redirect(301, '/memo-spel-online'));

// ── SEO Games Hub Pages ───────────────────────────────────────────
app.get('/gry',    (req, res) => res.sendFile(path.join(__dirname, 'public/seo/gry.html')));
app.get('/spiele', (req, res) => res.sendFile(path.join(__dirname, 'public/seo/spiele.html')));
app.get('/spel',   (req, res) => res.sendFile(path.join(__dirname, 'public/seo/spel.html')));

// ── Legacy redirects → new SEO slugs ─────────────────────────────
app.get('/dots', (req, res) => {
  const lang = req.query.lang || 'en';
  const map = { pl:'/kropki-i-kreski-online', de:'/punkte-und-linien-online', sv:'/punkter-och-linjer-online' };
  res.redirect(301, map[lang] || '/dots-and-boxes-online');
});

app.get('/memory', (req, res) => {
  const lang = req.query.lang || 'en';
  const map = { pl:'/znajdz-pary', de:'/memo-spiel-online', sv:'/memo-spel-online' };
  res.redirect(301, map[lang] || '/find-pairs-online');
});

app.get('/charades', (req, res) => {
  const lang = req.query.lang || 'en';
  const map = { pl:'/kalambury', de:'/scharade', sv:'/charader' };
  res.redirect(301, map[lang] || '/charades-online');
});
app.get('/kalambury',       seoInject('charades', 'pl'));
app.get('/charades-online', seoInject('charades', 'en'));
app.get('/scharade',        seoInject('charades', 'de'));
app.get('/charader',        seoInject('charades', 'sv'));

// ── Blog Routes ───────────────────────────────────────────────
app.get('/blog',                                   (req,res) => res.sendFile(path.join(__dirname,'public/blog/index.html')));
app.get('/blog/pl',                                (req,res) => res.sendFile(path.join(__dirname,'public/blog/pl/index.html')));
app.get('/blog/de',                                (req,res) => res.sendFile(path.join(__dirname,'public/blog/de/index.html')));
app.get('/blog/sv',                                (req,res) => res.sendFile(path.join(__dirname,'public/blog/sv/index.html')));
app.get('/blog/fun-games-to-play-on-zoom',         (req,res) => res.sendFile(path.join(__dirname,'public/blog/fun-games-to-play-on-zoom.html')));
app.get('/blog/online-party-games-no-download',    (req,res) => res.sendFile(path.join(__dirname,'public/blog/online-party-games-no-download.html')));
app.get('/blog/forbidden-words-examples',          (req,res) => res.sendFile(path.join(__dirname,'public/blog/forbidden-words-examples.html')));
app.get('/blog/hard-hangman-words',                (req,res) => res.sendFile(path.join(__dirname,'public/blog/hard-hangman-words.html')));
app.get('/blog/who-am-i-characters',              (req,res) => res.sendFile(path.join(__dirname,'public/blog/who-am-i-characters.html')));
app.get('/blog/categories-countries-cities-game',  (req,res) => res.sendFile(path.join(__dirname,'public/blog/categories-countries-cities-game.html')));
app.get('/blog/pl/gry-na-spotkania-online',        (req,res) => res.sendFile(path.join(__dirname,'public/blog/pl/gry-na-spotkania-online.html')));
app.get('/blog/pl/gry-integracyjne-dla-firm',      (req,res) => res.sendFile(path.join(__dirname,'public/blog/pl/gry-integracyjne-dla-firm.html')));
app.get('/blog/pl/przyklady-zakazanych-slow',      (req,res) => res.sendFile(path.join(__dirname,'public/blog/pl/przyklady-zakazanych-slow.html')));
app.get('/blog/pl/trudne-slowa-do-wisielca',       (req,res) => res.sendFile(path.join(__dirname,'public/blog/pl/trudne-slowa-do-wisielca.html')));
app.get('/blog/pl/kim-jestem-postacie',            (req,res) => res.sendFile(path.join(__dirname,'public/blog/pl/kim-jestem-postacie.html')));
app.get('/blog/pl/kategorie-panstwa-miasta',       (req,res) => res.sendFile(path.join(__dirname,'public/blog/pl/kategorie-panstwa-miasta.html')));
app.get('/blog/de/spiele-fuer-videokonferenzen',   (req,res) => res.sendFile(path.join(__dirname,'public/blog/de/spiele-fuer-videokonferenzen.html')));
app.get('/blog/de/online-partyspiele-kostenlos',   (req,res) => res.sendFile(path.join(__dirname,'public/blog/de/online-partyspiele-kostenlos.html')));
app.get('/blog/de/verbotene-woerter-beispiele',    (req,res) => res.sendFile(path.join(__dirname,'public/blog/de/verbotene-woerter-beispiele.html')));
app.get('/blog/de/schwere-galgenmaennchen-woerter',(req,res) => res.sendFile(path.join(__dirname,'public/blog/de/schwere-galgenmaennchen-woerter.html')));
app.get('/blog/de/wer-bin-ich-charaktere',         (req,res) => res.sendFile(path.join(__dirname,'public/blog/de/wer-bin-ich-charaktere.html')));
app.get('/blog/de/kategorien-stadt-land-fluss',    (req,res) => res.sendFile(path.join(__dirname,'public/blog/de/kategorien-stadt-land-fluss.html')));
app.get('/blog/sv/spel-att-spela-pa-distans',      (req,res) => res.sendFile(path.join(__dirname,'public/blog/sv/spel-att-spela-pa-distans.html')));
app.get('/blog/sv/roliga-spel-pa-zoom',            (req,res) => res.sendFile(path.join(__dirname,'public/blog/sv/roliga-spel-pa-zoom.html')));
app.get('/blog/sv/forbjudna-ord-exempel',          (req,res) => res.sendFile(path.join(__dirname,'public/blog/sv/forbjudna-ord-exempel.html')));
app.get('/blog/sv/svara-ord-hanga-gubbe',          (req,res) => res.sendFile(path.join(__dirname,'public/blog/sv/svara-ord-hanga-gubbe.html')));
app.get('/blog/sv/vem-ar-jag-karaktarer',          (req,res) => res.sendFile(path.join(__dirname,'public/blog/sv/vem-ar-jag-karaktarer.html')));
app.get('/blog/sv/kategorier-lansen-staden',       (req,res) => res.sendFile(path.join(__dirname,'public/blog/sv/kategorier-lansen-staden.html')));
app.get('/blog/play-charades-online',              (req,res) => res.sendFile(path.join(__dirname,'public/blog/play-charades-online.html')));
app.get('/blog/pl/kalambury-online',               (req,res) => res.sendFile(path.join(__dirname,'public/blog/pl/kalambury-online.html')));
app.get('/blog/de/scharade-online-spielen',        (req,res) => res.sendFile(path.join(__dirname,'public/blog/de/scharade-online-spielen.html')));
app.get('/blog/sv/spela-charader-online',          (req,res) => res.sendFile(path.join(__dirname,'public/blog/sv/spela-charader-online.html')));
// ── Family/Kids games blog posts ──
app.get('/blog/free-games-for-kids-and-families',            (req,res) => res.sendFile(path.join(__dirname,'public/blog/free-games-for-kids-and-families.html')));
app.get('/blog/pl/darmowe-gry-dla-dzieci-i-rodzin',         (req,res) => res.sendFile(path.join(__dirname,'public/blog/pl/darmowe-gry-dla-dzieci-i-rodzin.html')));
app.get('/blog/de/kostenlose-spiele-fuer-kinder-und-familien',(req,res) => res.sendFile(path.join(__dirname,'public/blog/de/kostenlose-spiele-fuer-kinder-und-familien.html')));
app.get('/blog/sv/gratis-spel-for-barn-och-familjer',       (req,res) => res.sendFile(path.join(__dirname,'public/blog/sv/gratis-spel-for-barn-och-familjer.html')));
// ── DE/SV SEO blog posts — Stadt Land Fluss, Unterricht, Sällskapsspel, Klassrum ──
app.get('/blog/de/stadt-land-fluss-online-spielen',         (req,res) => res.sendFile(path.join(__dirname,'public/blog/de/stadt-land-fluss-online-spielen.html')));
app.get('/blog/de/kostenlose-spiele-fuer-den-unterricht',   (req,res) => res.sendFile(path.join(__dirname,'public/blog/de/kostenlose-spiele-fuer-den-unterricht.html')));
app.get('/blog/sv/basta-gratis-sallskapsspel-online',       (req,res) => res.sendFile(path.join(__dirname,'public/blog/sv/basta-gratis-sallskapsspel-online.html')));
app.get('/blog/sv/spel-for-klassrummet',                    (req,res) => res.sendFile(path.join(__dirname,'public/blog/sv/spel-for-klassrummet.html')));

app.get('/rooms',       (req, res) => res.sendFile(path.join(__dirname, 'public/rooms.html')));
app.get('/privacy',     (req, res) => res.sendFile(path.join(__dirname, 'public/privacy.html')));
app.get('/games',       (req, res) => res.sendFile(path.join(__dirname, 'public/games.html')));
app.get('/jak-grac/tabu',                      (req, res) => res.redirect(301, '/jak-grac/zakazane-slowa'));
app.get('/jak-grac/zakazane-slowa',            (req, res) => res.sendFile(path.join(__dirname, 'public/jak-grac/tabu.html')));
app.get('/jak-grac/wisielec',                   (req, res) => res.sendFile(path.join(__dirname, 'public/jak-grac/wisielec.html')));
app.get('/jak-grac/kropki-i-kreski',            (req, res) => res.sendFile(path.join(__dirname, 'public/jak-grac/kropki-i-kreski.html')));
app.get('/jak-grac/dwie-prawdy-jedno-klamstwo', (req, res) => res.sendFile(path.join(__dirname, 'public/jak-grac/dwie-prawdy-jedno-klamstwo.html')));
app.get('/how-to-play/taboo',         (req, res) => res.redirect(301, '/how-to-play/forbidden-words'));
app.get('/how-to-play/forbidden-words', (req, res) => res.sendFile(path.join(__dirname, 'public/how-to-play/taboo.html')));
app.get('/how-to-play/hangman',       (req, res) => res.sendFile(path.join(__dirname, 'public/how-to-play/hangman.html')));
app.get('/how-to-play/dots-and-boxes',(req, res) => res.sendFile(path.join(__dirname, 'public/how-to-play/dots-and-boxes.html')));
app.get('/how-to-play/two-truths-one-lie', (req, res) => res.sendFile(path.join(__dirname, 'public/how-to-play/two-truths-one-lie.html')));
app.get('/jak-grac',    (req, res) => res.sendFile(path.join(__dirname, 'public/jak-grac/index.html')));
app.get('/how-to-play', (req, res) => res.sendFile(path.join(__dirname, 'public/how-to-play/index.html')));
app.get('/wie-man-spielt', (req, res) => res.sendFile(path.join(__dirname, 'public/wie-man-spielt/index.html')));
app.get('/wie-man-spielt/:game', (req, res) => res.sendFile(path.join(__dirname, 'public/wie-man-spielt/index.html')));
app.get('/how-to-play/sketch-and-guess',        (req, res) => res.sendFile(path.join(__dirname, 'public/how-to-play/sketch-and-guess.html')));
app.get('/jak-grac/szkicuj-i-zgaduj',            (req, res) => res.sendFile(path.join(__dirname, 'public/jak-grac/szkicuj-i-zgaduj.html')));
app.get('/wie-man-spielt/zeichnen-und-raten',    (req, res) => res.sendFile(path.join(__dirname, 'public/wie-man-spielt/zeichnen-und-raten.html')));
app.get('/hur-man-spelar/skissa-och-gissa',      (req, res) => res.sendFile(path.join(__dirname, 'public/hur-man-spelar/skissa-och-gissa.html')));
app.get('/hur-man-spelar', (req, res) => res.sendFile(path.join(__dirname, 'public/hur-man-spelar/index.html')));
app.get('/hur-man-spelar/:game', (req, res) => res.sendFile(path.join(__dirname, 'public/hur-man-spelar/index.html')));
app.get('/kategorie',   (req, res) => res.sendFile(path.join(__dirname, 'public/kategorie/index.html')));
app.get('/slowa',       (req, res) => res.sendFile(path.join(__dirname, 'public/slowa/index.html')));

// ─── SHARE ROUTE (OG tags with score for social preview) ─────────
app.get('/share', (req, res) => {
  const game  = req.query.game  || 'pm';
  const score = parseInt(req.query.score) || 0;
  const lang  = req.query.lang  || 'pl';
  const siteUrl = isRFG(req) ? 'https://roomforgames.com' : 'https://panstwamiastagra.com';
  const siteName = isRFG(req) ? 'roomforgames.com' : 'panstwamiastagra.com';

  const titles = {
    pm:       { pl: 'Państwa-Miasta', en: 'Countries & Cities', de: 'Stadt Land Fluss', fr: 'Pays & Villes', es: 'Países & Ciudades' },
    taboo:    { pl: 'Zakazane Słowa', en: 'Forbidden Words', de: 'Verbotene Wörter', fr: 'Mots Interdits', es: 'Palabras Prohibidas' },
    dots:     { pl: 'Kropki i Kreski', en: 'Dots & Boxes', de: 'Punkte & Linien', fr: 'Points & Lignes', es: 'Puntos & Líneas' },
    twotruth: { pl: 'Dwie Prawdy Jedno Kłamstwo', en: '2 Truths 1 Lie', de: '2 Wahrheiten 1 Lüge', fr: '2 Vérités 1 Mensonge', es: '2 Verdades 1 Mentira' },
    hangman:  { pl: 'Wisielec', en: 'Hangman', de: 'Galgenmännchen', fr: 'Pendu', es: 'El Ahorcado' },
  };

  const textFns = {
    pl: function(name, pts) { return pts > 0 ? 'Zagrałem w ' + name + ' online i zdobyłem ' + pts + ' punktów — spróbuj mnie pobić! 🎮' : 'Zagraj ze mną w ' + name + '! Darmowa gra online. 🎮'; },
    en: function(name, pts) { return pts > 0 ? 'Just played ' + name + ' online and scored ' + pts + ' points — can you beat me? 🎮' : 'Come play ' + name + ' with me! Free multiplayer game. 🎮'; },
    de: function(name, pts) { return pts > 0 ? 'Gerade ' + name + ' gespielt und ' + pts + ' Punkte gemacht — kannst du das toppen? 🎮' : 'Spiel ' + name + ' mit mir! Kostenloses Multiplayer-Spiel. 🎮'; },
    fr: function(name, pts) { return pts > 0 ? 'Je viens de jouer à ' + name + ' et j\'ai marqué ' + pts + ' points — peux-tu me battre ? 🎮' : 'Viens jouer à ' + name + ' avec moi ! 🎮'; },
    es: function(name, pts) { return pts > 0 ? 'Acabo de jugar a ' + name + ' y saqué ' + pts + ' puntos — ¡intenta superarme! 🎮' : 'Ven a jugar a ' + name + ' conmigo. Juego gratis. 🎮'; },
  };

  const gameName = (titles[game] || titles.pm)[lang] || (titles[game] || titles.pm)['en'];
  const ogDesc   = (textFns[lang] || textFns.en)(gameName, score);
  const rfgPaths = { pm: '/countries-cities-game', taboo: '/forbidden-words', dots: '/dots-and-boxes-online', twotruth: '/two-truths-one-lie', hangman: '/hangman-online', drawing: '/sketch-and-guess', bingo: '/corporate-bingo', 'who-am-i': '/who-am-i', whoami: '/who-am-i', memory: '/find-pairs-online', charades: '/charades-online' };
  const gameSlug = isRFG(req) ? (rfgPaths[game] || '/' + game) : (game === 'pm' ? '' : '/' + game);
  const playUrl  = siteUrl + gameSlug + '?lang=' + lang;
  const shareUrl = siteUrl + '/share?game=' + game + '&score=' + score + '&lang=' + lang;

  res.send(
    '<!DOCTYPE html>\n' +
    '<html lang="' + lang + '">\n<head>\n' +
    '<meta charset="UTF-8">\n' +
    '<title>' + gameName + ' — ' + siteName + '</title>\n' +
    '<meta property="og:title" content="' + gameName + ' — ' + ({pl:'Zagraj online za darmo!',en:'Play free online!',de:'Kostenlos online spielen!',fr:'Joue gratuitement en ligne!',es:'¡Juega gratis en línea!'}[lang]||'Play free online!') + '">\n' +
    '<meta property="og:description" content="' + ogDesc + '">\n' +
    '<meta property="og:url" content="' + shareUrl + '">\n' +
    '<meta property="og:type" content="website">\n' +
    '<meta property="og:image" content="' + siteUrl + '/og-image.png">\n' +
    '<meta name="twitter:card" content="summary">\n' +
    '<meta name="twitter:title" content="' + gameName + '">\n' +
    '<meta name="twitter:description" content="' + ogDesc + '">\n' +
    '<meta http-equiv="refresh" content="0;url=' + playUrl + '">\n' +
    '</head>\n<body><p>Redirecting... <a href="' + playUrl + '">Click here</a></p></body>\n</html>'
  );
});
// JS files: 1 hour cache — short enough that deploys propagate quickly
app.use('/js', express.static(path.join(__dirname, 'public/js'), {
  setHeaders: function(res) {
    res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate');
  }
}));
// HTML: never cache — always fresh so deploys are instant
// CSS/images: 1 day
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: function(res, filePath) {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    } else if (filePath.match(/\.(css|png|ico|svg|woff2?)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=86400');
    }
  }
}));

// ─── HEALTH + DEBUG ──────────────────────────────────────
// ─── ADMIN PANEL ─────────────────────────────────────────
const { getPMRooms } = require('./routes/pm');
admin.init(() => {
  const rooms = {};
  try { rooms.pm       = getPMRooms       ? getPMRooms()       : []; } catch(e){ rooms.pm=[]; }
  try { rooms.taboo    = require('./routes/taboo').getTabooRooms    ? require('./routes/taboo').getTabooRooms()    : []; } catch(e){ rooms.taboo=[]; }
  try { rooms.dots     = require('./routes/dots').getDotsRooms      ? require('./routes/dots').getDotsRooms()      : []; } catch(e){ rooms.dots=[]; }
  try { rooms.hangman  = require('./routes/hangman').getHangRooms   ? require('./routes/hangman').getHangRooms()   : []; } catch(e){ rooms.hangman=[]; }
  try { rooms.twotruth = require('./routes/twotruth').getTTRooms    ? require('./routes/twotruth').getTTRooms()    : []; } catch(e){ rooms.twotruth=[]; }
  try { rooms.memory   = require('./routes/memory').getMemRooms     ? require('./routes/memory').getMemRooms()     : []; } catch(e){ rooms.memory=[]; }
  try { rooms.charades = require('./routes/charades').getCharadesRooms ? require('./routes/charades').getCharadesRooms() : []; } catch(e){ rooms.charades=[]; }
  return rooms;
});
app.use('/admin', admin.router);

// Banner API — served to all game pages
const BANNER_FILE_PATH = require('path').join(__dirname, 'data', 'banner.json');
app.get('/api/banner', (req, res) => {
  try {
    const b = JSON.parse(require('fs').readFileSync(BANNER_FILE_PATH, 'utf8'));
    res.json(b);
  } catch(e) {
    res.json({ active: false, text: '', type: 'info' });
  }
});

// ─── ROOM HISTORY API ─────────────────────────────────────
app.get('/api/rooms/:game', (req, res) => {
  try {
    const { getDb } = require('./db/stats');
    const game = req.params.game;
    const rows = getDb().prepare(`
      SELECT room_code, lang, is_public, player_count, status, created_ts, ended_ts
      FROM room_history
      WHERE game = ?
      ORDER BY created_ts DESC
      LIMIT 7
    `).all(game);
    res.json(rows);
  } catch(e) {
    res.json([]);
  }
});


// ─── BUG REPORT API ──────────────────────────────────────
const BUG_FILE_PATH = require('path').join(__dirname, 'data', 'bug-reports.json');
const bugRateLimit  = new Map(); // ip -> [timestamps]

function readBugReports() {
  try { return JSON.parse(require('fs').readFileSync(BUG_FILE_PATH, 'utf8')); }
  catch(e) { return []; }
}
function saveBugReports(reports) {
  try {
    if (!require('fs').existsSync(require('path').join(__dirname, 'data'))) {
      require('fs').mkdirSync(require('path').join(__dirname, 'data'), { recursive: true });
    }
    require('fs').writeFileSync(BUG_FILE_PATH, JSON.stringify(reports, null, 2), 'utf8');
  } catch(e) {}
}

app.post('/api/bug-report', express.json(), (req, res) => {
  const ip = req.ip || 'unknown';
  const now = Date.now();

  // Honeypot — bots fill this field, humans don't
  if (req.body.website) { return res.json({ ok: true }); }

  // Rate limit: max 3 per IP per hour
  const times = (bugRateLimit.get(ip) || []).filter(t => now - t < 60 * 60 * 1000);
  if (times.length >= 3) {
    return res.status(429).json({ error: 'Too many reports. Please try again later.' });
  }
  times.push(now);
  bugRateLimit.set(ip, times);

  // Validate
  const game = (req.body.game || '').slice(0, 50).trim();
  const desc = (req.body.description || '').slice(0, 1000).trim();
  const email = (req.body.email || '').slice(0, 100).trim();

  if (desc.length < 20) {
    return res.status(400).json({ error: 'Please describe the bug in more detail (min 20 characters).' });
  }

  // Save
  const reports = readBugReports();
  reports.unshift({
    id:        Date.now(),
    game:      game || 'Unknown',
    description: desc,
    email:     email || null,
    timestamp: new Date().toISOString(),
    resolved:  false,
  });

  // Keep max 500 reports
  if (reports.length > 500) reports.splice(500);
  saveBugReports(reports);

  res.json({ ok: true });
});

app.delete('/api/bug-report/:id', (req, res) => {
  // Only allow from admin session
  const token = req.cookies && req.cookies.admin_token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  const reports = readBugReports();
  const filtered = reports.filter(r => String(r.id) !== String(req.params.id));
  saveBugReports(filtered);
  res.json({ ok: true });
});

app.patch('/api/bug-report/:id/resolve', (req, res) => {
  const token = req.cookies && req.cookies.admin_token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  const reports = readBugReports();
  const report = reports.find(r => String(r.id) === String(req.params.id));
  if (report) report.resolved = true;
  saveBugReports(reports);
  res.json({ ok: true });
});

app.get('/health', (req, res) => res.json({
  status: 'ok',
  pm_rooms:    pm.getRoomCount(),
  taboo_rooms: taboo.getTabooRoomCount(),
  dots_rooms:       dots.getDotsRoomCount(),
  twotruth_rooms:   twotruth.getTTRoomCount(),
  hangman_rooms:    hangman.getHangRoomCount(),
}));

app.get('/room/:code', (req, res) => {
  const room = pm.getRoomByCode(req.params.code.toUpperCase());
  if (!room) return res.json({ exists: false });
  res.json({ exists: true, players: room.players.length, phase: room.state.phase });
});

// ─── SOCKET.IO ───────────────────────────────────────────
const server = http.createServer(app);
const io     = new Server(server, {
  cors:          { origin: '*' },
  transports:    ['websocket', 'polling'],
  allowEIO3:     true,
  pingTimeout:   120000,
  pingInterval:  30000,
});

lobbyHub.init(io);

// ─── MEMORY CLEANUP ──────────────────────────────────────────────
// Periodic cleanup to prevent memory leaks from orphaned rooms
// Runs every 30 minutes
setInterval(() => {
  const now = Date.now();
  const MAX_AGE = 2 * 60 * 60 * 1000; // 2 hours

  // Clean each game's rooms
  const gameModules = [
    { name: 'pm', getRooms: () => pm.getRooms() },
    { name: 'taboo', getRooms: () => taboo.getRooms() },
    { name: 'dots', getRooms: () => dots.getRooms() },
    { name: 'hangman', getRooms: () => hangman.getRooms() },
    { name: 'twotruth', getRooms: () => twotruth.getRooms() },
    { name: 'whoami', getRooms: () => whoami.getRooms() },
    { name: 'bingo', getRooms: () => bingo.getRooms() },
    { name: 'drawing', getRooms: () => drawing.getRooms() },
    { name: 'memory', getRooms: () => memory.getRooms() },
    { name: 'charades', getRooms: () => charades.getRooms() },
  ];

  let totalCleaned = 0;
  gameModules.forEach(({ name, getRooms }) => {
    try {
      const rooms = getRooms();
      if (!rooms) return;
      Object.keys(rooms).forEach(code => {
        const room = rooms[code];
        const createdAt = room._createdAt || 0;
        const allDisconnected = (room.players || []).every(p => !p.connected || p.connected === false);
        // Delete rooms older than 2 hours OR rooms where everyone is disconnected and older than 30 min
        if (now - createdAt > MAX_AGE || (allDisconnected && now - createdAt > 30 * 60 * 1000)) {
          // Clear any lingering timers
          if (room.state && room.state.timer) clearTimeout(room.state.timer);
          if (room.state && room.state.turnTimer) clearInterval(room.state.turnTimer);
          if (room._deleteTimer) clearTimeout(room._deleteTimer);
          if (room._lobbyTimer) clearTimeout(room._lobbyTimer);
          delete rooms[code];
          totalCleaned++;
        }
      });
    } catch(e) { /* ignore errors in cleanup */ }
  });

  // Clean bugRateLimit map
  if (typeof bugRateLimit !== 'undefined') {
    bugRateLimit.forEach((times, ip) => {
      const recent = times.filter(t => now - t < 60 * 60 * 1000);
      if (recent.length === 0) bugRateLimit.delete(ip);
      else bugRateLimit.set(ip, recent);
    });
  }

  if (totalCleaned > 0) console.log(`[cleanup] Removed ${totalCleaned} stale rooms`);
}, 30 * 60 * 1000); // Every 30 minutes

io.on('connection', (socket) => {
  pm.register(io, socket);
  taboo.register(io, socket);
  dots.register(io, socket);
  twotruth.register(io, socket);
  hangman.register(io, socket);
  bingo.register(io, socket);
  drawing.register(io, socket);
  whoami.register(io, socket);
  memory.register(io, socket);
  charades.register(io, socket);

  // ── Global nudge system ──
  socket.on('nudge', ({ code, name }) => {
    if (code) socket.to(code).emit('nudge_received', { name: name || '?' });
  });
  socket.on('host_response', ({ code, name, message }) => {
    if (code) socket.to(code).emit('host_response_received', { name: name || '?', message: message || '' });
  });
  socket.on('game_reaction', ({ code, name, emoji, text }) => {
    if (code) io.to(code).emit('game_reaction_received', { name: name || '?', emoji: emoji || '👏', text: text || '' });
  });
});

// ─── START ───────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🎮 Server running on http://localhost:${PORT}`));
