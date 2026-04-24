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
const lobbyHub   = require('./routes/lobby');
const admin      = require('./routes/admin');

const app = express();
app.use(compression());
try {
  app.use(require('cookie-parser')());
} catch(e) {
  // cookie-parser not installed yet — admin sessions won't work until redeploy
  app.use(function(req, res, next) { req.cookies = {}; next(); });
}

// ─── STATIC + PAGE ROUTES ────────────────────────────────
app.get('/taboo', (req, res) => res.sendFile(path.join(__dirname, 'public/taboo.html')));
app.get('/twotruth', (req, res) => res.sendFile(path.join(__dirname, 'public/twotruth.html')));
app.get('/dots',        (req, res) => res.sendFile(path.join(__dirname, 'public/dots.html')));
app.get('/hangman',     (req, res) => res.sendFile(path.join(__dirname, 'public/hangman.html')));
app.get('/bingo',       (req, res) => res.sendFile(path.join(__dirname, 'public/bingo.html')));
// DRAWING TELEPHONE — hidden until ready to launch
app.get('/drawing',     (req, res) => res.sendFile(path.join(__dirname, 'public/drawing.html')));

// ── Who Am I — SEO pages (not linked in nav yet) ────────────────
app.get('/kim-jestem', (req, res) => res.sendFile(path.join(__dirname, 'public/seo/kim-jestem.html')));
app.get('/who-am-i',   (req, res) => res.sendFile(path.join(__dirname, 'public/seo/who-am-i.html')));
app.get('/wer-bin-ich',(req, res) => res.sendFile(path.join(__dirname, 'public/seo/wer-bin-ich.html')));
app.get('/vem-ar-jag', (req, res) => res.sendFile(path.join(__dirname, 'public/seo/vem-ar-jag.html')));
app.get('/whoami',     (req, res) => res.redirect(301, '/who-am-i'));

// ── Państwa Miasta — SEO pages (EN/DE/SV — PL stays on root /) ──
app.get('/countries-cities-game', (req, res) => res.sendFile(path.join(__dirname, 'public/seo/countries-cities-game.html')));
app.get('/laender-und-staedte',   (req, res) => res.sendFile(path.join(__dirname, 'public/seo/laender-und-staedte.html')));
app.get('/laender-och-staeder',   (req, res) => res.sendFile(path.join(__dirname, 'public/seo/laender-och-staeder.html')));

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
app.get('/hur-man-spelar/hanga-gubbe-online',     (req,res) => res.sendFile(path.join(__dirname,'public/hur-man-spelar/hanga-gubbe-online.html')));
app.get('/hur-man-spelar/forbjudna-ord',          (req,res) => res.sendFile(path.join(__dirname,'public/hur-man-spelar/forbjudna-ord.html')));
app.get('/hur-man-spelar/punkter-och-linjer-online',(req,res) => res.sendFile(path.join(__dirname,'public/hur-man-spelar/punkter-och-linjer-online.html')));
app.get('/hur-man-spelar/tva-sanningar-en-logn',  (req,res) => res.sendFile(path.join(__dirname,'public/hur-man-spelar/tva-sanningar-en-logn.html')));
app.get('/hur-man-spelar/foretagsbingo',          (req,res) => res.sendFile(path.join(__dirname,'public/hur-man-spelar/foretagsbingo.html')));

// ── SEO Landing Pages — Forbidden Words ─────────────────────────
app.get('/zakazane-slowa',    (req, res) => res.sendFile(path.join(__dirname, 'public/seo/zakazane-slowa.html')));
app.get('/forbidden-words',   (req, res) => res.sendFile(path.join(__dirname, 'public/seo/forbidden-words.html')));
app.get('/verbotene-woerter', (req, res) => res.sendFile(path.join(__dirname, 'public/seo/verbotene-woerter.html')));
app.get('/forbjudna-ord',     (req, res) => res.sendFile(path.join(__dirname, 'public/seo/forbjudna-ord.html')));

// Legacy redirect
app.get('/taboo', (req, res) => {
  const lang = req.query.lang || 'en';
  const map = { pl:'/zakazane-slowa', de:'/verbotene-woerter', sv:'/forbjudna-ord' };
  res.redirect(301, map[lang] || '/forbidden-words');
});

// ── SEO Landing Pages — Corporate Bingo ──────────────────────────
app.get('/korporacyjne-bingo',  (req, res) => res.sendFile(path.join(__dirname, 'public/seo/korporacyjne-bingo.html')));
app.get('/corporate-bingo',     (req, res) => res.sendFile(path.join(__dirname, 'public/seo/corporate-bingo.html')));
app.get('/unternehmens-bingo',  (req, res) => res.sendFile(path.join(__dirname, 'public/seo/unternehmens-bingo.html')));
app.get('/foretagsbingo',       (req, res) => res.sendFile(path.join(__dirname, 'public/seo/foretagsbingo.html')));

// Legacy redirect
app.get('/bingo', (req, res) => {
  const lang = req.query.lang || 'en';
  const map = { pl:'/korporacyjne-bingo', de:'/unternehmens-bingo', sv:'/foretagsbingo' };
  res.redirect(301, map[lang] || '/corporate-bingo');
});

// ── SEO Landing Pages — Sketch & Guess ──────────────────────────
app.get('/szkicuj-i-zgaduj',   (req, res) => res.sendFile(path.join(__dirname, 'public/seo/szkicuj-i-zgaduj.html')));
app.get('/sketch-and-guess',   (req, res) => res.sendFile(path.join(__dirname, 'public/seo/sketch-and-guess.html')));
app.get('/zeichnen-und-raten', (req, res) => res.sendFile(path.join(__dirname, 'public/seo/zeichnen-und-raten.html')));
app.get('/skissa-och-gissa',   (req, res) => res.sendFile(path.join(__dirname, 'public/seo/skissa-och-gissa.html')));

// Legacy redirect
app.get('/drawing', (req, res) => {
  const lang = req.query.lang || 'pl';
  const map = { pl:'/szkicuj-i-zgaduj', en:'/sketch-and-guess', de:'/zeichnen-und-raten', sv:'/skissa-och-gissa' };
  res.redirect(301, map[lang] || '/sketch-and-guess');
});

// ── SEO Landing Pages — Hangman ─────────────────────────────────
app.get('/wisielec',                (req, res) => res.sendFile(path.join(__dirname, 'public/seo/wisielec.html')));
app.get('/hangman-online',          (req, res) => res.sendFile(path.join(__dirname, 'public/seo/hangman-online.html')));
app.get('/galgenmaennchen-online',  (req, res) => res.sendFile(path.join(__dirname, 'public/seo/galgenmaennchen-online.html')));
app.get('/hanga-gubbe-online',      (req, res) => res.sendFile(path.join(__dirname, 'public/seo/hanga-gubbe-online.html')));

// Legacy redirect
app.get('/hangman', (req, res) => {
  const lang = req.query.lang || 'en';
  const map = { pl:'/wisielec', de:'/galgenmaennchen-online', sv:'/hanga-gubbe-online' };
  res.redirect(301, map[lang] || '/hangman-online');
});

// ── SEO Landing Pages — Two Truths One Lie ──────────────────────
app.get('/dwie-prawdy-jedno-klamstwo',  (req, res) => res.sendFile(path.join(__dirname, 'public/seo/dwie-prawdy-jedno-klamstwo.html')));
app.get('/two-truths-one-lie',          (req, res) => res.sendFile(path.join(__dirname, 'public/seo/two-truths-one-lie.html')));
app.get('/zwei-wahrheiten-eine-luege',  (req, res) => res.sendFile(path.join(__dirname, 'public/seo/zwei-wahrheiten-eine-luege.html')));
app.get('/tva-sanningar-en-logn',       (req, res) => res.sendFile(path.join(__dirname, 'public/seo/tva-sanningar-en-logn.html')));

// Legacy redirect
app.get('/twotruth', (req, res) => {
  const lang = req.query.lang || 'en';
  const map = { pl:'/dwie-prawdy-jedno-klamstwo', de:'/zwei-wahrheiten-eine-luege', sv:'/tva-sanningar-en-logn' };
  res.redirect(301, map[lang] || '/two-truths-one-lie');
});

// ── SEO Landing Pages — Dots & Boxes ─────────────────────────────
app.get('/kropki-i-kreski-online',   (req, res) => res.sendFile(path.join(__dirname, 'public/seo/kropki-i-kreski-online.html')));
app.get('/dots-and-boxes-online',    (req, res) => res.sendFile(path.join(__dirname, 'public/seo/dots-and-boxes-online.html')));
app.get('/punkte-und-linien-online', (req, res) => res.sendFile(path.join(__dirname, 'public/seo/punkte-und-linien-online.html')));
app.get('/punkter-och-linjer-online',(req, res) => res.sendFile(path.join(__dirname, 'public/seo/punkter-och-linjer-online.html')));

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
  const siteUrl = 'https://panstwamiastagra.com';

  const titles = {
    pm:       { pl: 'Państwa-Miasta', en: 'Countries & Cities', de: 'Länder & Städte', fr: 'Pays & Villes', es: 'Países & Ciudades' },
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
  const gameSlug = game === 'pm' ? '' : '/' + game;
  const playUrl  = siteUrl + gameSlug + '?lang=' + lang;
  const shareUrl = siteUrl + '/share?game=' + game + '&score=' + score + '&lang=' + lang;

  res.send(
    '<!DOCTYPE html>\n' +
    '<html lang="' + lang + '">\n<head>\n' +
    '<meta charset="UTF-8">\n' +
    '<title>' + gameName + ' — panstwamiastagra.com</title>\n' +
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

io.on('connection', (socket) => {
  pm.register(io, socket);
  taboo.register(io, socket);
  dots.register(io, socket);
  twotruth.register(io, socket);
  hangman.register(io, socket);
  bingo.register(io, socket);
  drawing.register(io, socket);
  whoami.register(io, socket);
});

// ─── START ───────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🎮 Server running on http://localhost:${PORT}`));
