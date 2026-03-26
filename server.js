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
const lobbyHub   = require('./routes/lobby');

const app = express();
app.use(compression());

// ─── STATIC + PAGE ROUTES ────────────────────────────────
app.get('/taboo', (req, res) => res.sendFile(path.join(__dirname, 'public/taboo.html')));
app.get('/twotruth', (req, res) => res.sendFile(path.join(__dirname, 'public/twotruth.html')));
app.get('/dots',        (req, res) => res.sendFile(path.join(__dirname, 'public/dots.html')));
app.get('/hangman',     (req, res) => res.sendFile(path.join(__dirname, 'public/hangman.html')));
app.get('/games',       (req, res) => res.sendFile(path.join(__dirname, 'public/games.html')));
app.get('/jak-grac/tabu',                      (req, res) => res.sendFile(path.join(__dirname, 'public/jak-grac/tabu.html')));
app.get('/jak-grac/wisielec',                   (req, res) => res.sendFile(path.join(__dirname, 'public/jak-grac/wisielec.html')));
app.get('/jak-grac/kropki-i-kreski',            (req, res) => res.sendFile(path.join(__dirname, 'public/jak-grac/kropki-i-kreski.html')));
app.get('/jak-grac/dwie-prawdy-jedno-klamstwo', (req, res) => res.sendFile(path.join(__dirname, 'public/jak-grac/dwie-prawdy-jedno-klamstwo.html')));
app.get('/how-to-play/taboo',         (req, res) => res.sendFile(path.join(__dirname, 'public/how-to-play/taboo.html')));
app.get('/how-to-play/hangman',       (req, res) => res.sendFile(path.join(__dirname, 'public/how-to-play/hangman.html')));
app.get('/how-to-play/dots-and-boxes',(req, res) => res.sendFile(path.join(__dirname, 'public/how-to-play/dots-and-boxes.html')));
app.get('/how-to-play/two-truths-one-lie', (req, res) => res.sendFile(path.join(__dirname, 'public/how-to-play/two-truths-one-lie.html')));
app.get('/jak-grac',    (req, res) => res.sendFile(path.join(__dirname, 'public/jak-grac/index.html')));
app.get('/how-to-play', (req, res) => res.sendFile(path.join(__dirname, 'public/how-to-play/index.html')));
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
    taboo:    { pl: 'Tabu', en: 'Taboo', de: 'Tabu', fr: 'Tabou', es: 'Tabú' },
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
    '<meta property="og:title" content="' + gameName + ' — zagraj online za darmo!">\n' +
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
  pingTimeout:   60000,
  pingInterval:  25000,
});

lobbyHub.init(io);

io.on('connection', (socket) => {
  pm.register(io, socket);
  taboo.register(io, socket);
  dots.register(io, socket);
  twotruth.register(io, socket);
  hangman.register(io, socket);
});

// ─── START ───────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🎮 Server running on http://localhost:${PORT}`));
