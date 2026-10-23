'use strict';
// ════════════════════════════════════════════════════════
// ROOM HINT — friendlier "room not found" message.
// If the code belongs to a room in ANOTHER game, tell the player
// which game it is (text only, no link). Language is taken from the
// page the player is on. Never throws: falls back to a plain message.
// ════════════════════════════════════════════════════════
const fs   = require('fs');
const path = require('path');

const GAMES = ['pm','taboo','dots','twotruth','hangman','bingo','drawing','whoami','memory','charades'];

const NAMES = {
  pl: { pm:'🌍 Państwa-Miasta', taboo:'🎭 Zakazane Słowa', dots:'🔵 Kropki i Kreski', twotruth:'🤥 Dwie Prawdy Jedno Kłamstwo', hangman:'🪢 Wisielec', bingo:'🎯 Korporacyjne Bingo', drawing:'🎨 Szkicuj i Zgaduj', whoami:'❓ Kim Jestem?', memory:'🧩 Znajdź Pary', charades:'🤫 Kalambury' },
  en: { pm:'🌍 Countries & Cities', taboo:'🎭 Forbidden Words', dots:'🔵 Dots & Boxes', twotruth:'🤥 2 Truths 1 Lie', hangman:'🪢 Hangman', bingo:'🎯 Corporate Bingo', drawing:'🎨 Sketch & Guess', whoami:'❓ Who Am I?', memory:'🧩 Find Pairs', charades:'🤫 Charades' },
  de: { pm:'🌍 Stadt Land Fluss', taboo:'🎭 Verbotene Wörter', dots:'🔵 Punkte & Linien', twotruth:'🤥 2 Wahrheiten 1 Lüge', hangman:'🪢 Galgenmännchen', bingo:'🎯 Unternehmens-Bingo', drawing:'🎨 Zeichnen & Raten', whoami:'❓ Wer bin ich?', memory:'🧩 Memo-Spiel', charades:'🤫 Scharade' },
  sv: { pm:'🌍 Länder & Städer', taboo:'🎭 Förbjudna ord', dots:'🔵 Punkter & Linjer', twotruth:'🤥 2 Sanningar 1 Lögn', hangman:'🪢 Hänga gubbe', bingo:'🎯 Företagsbingo', drawing:'🎨 Skissa & Gissa', whoami:'❓ Vem är jag?', memory:'🧩 Memo-spel', charades:'🤫 Charader' },
};

const TEXT = {
  pl: { other: n => `Ten kod należy do gry „${n}”. Przejdź do tej gry i tam wpisz kod.`, none: 'Nie znaleziono pokoju. Sprawdź kod.' },
  en: { other: n => `This code belongs to "${n}". Go to that game and enter the code there.`, none: 'Room not found. Check the code.' },
  de: { other: n => `Dieser Code gehört zum Spiel „${n}“. Wechsle zu diesem Spiel und gib den Code dort ein.`, none: 'Raum nicht gefunden. Prüfe den Code.' },
  sv: { other: n => `Den här koden hör till spelet ”${n}”. Gå till det spelet och skriv in koden där.`, none: 'Rummet hittades inte. Kontrollera koden.' },
};

// Page path → language, built from the SEO snippets (canonical URLs)
let PATH_LANG = null;
function pathLang(p) {
  if (!PATH_LANG) {
    PATH_LANG = {};
    try {
      const dir = path.join(__dirname, '..', 'seo-snippets');
      fs.readdirSync(dir).forEach(g => {
        let files = [];
        try { files = fs.readdirSync(path.join(dir, g)); } catch (e) { return; }
        files.forEach(f => {
          try {
            const d = JSON.parse(fs.readFileSync(path.join(dir, g, f), 'utf8'));
            const u = new URL(d.canonical);
            if (u.pathname !== '/') PATH_LANG[u.pathname.replace(/\/$/, '')] = d.lang;
          } catch (e) {}
        });
      });
    } catch (e) {}
  }
  return PATH_LANG[(p || '').replace(/\/$/, '')] || null;
}

function langOf(socket) {
  try {
    const qy = (socket && socket.handshake && socket.handshake.query) || {};
    if (TEXT[qy.pl_lang]) return qy.pl_lang;
    const h = (socket && socket.handshake && socket.handshake.headers) || {};
    if (h.referer) {
      const u = new URL(h.referer);
      const q = u.searchParams.get('lang');
      if (TEXT[q]) return q;
      const pl = pathLang(u.pathname);
      if (pl && TEXT[pl]) return pl;
      if (u.pathname === '/' && !/roomforgames/.test(u.hostname)) return 'pl';
    }
    const al = String(h['accept-language'] || '').slice(0, 2).toLowerCase();
    if (TEXT[al]) return al;
  } catch (e) {}
  return 'en';
}

function findOtherGame(code, currentGame) {
  const c = String(code || '').trim().toUpperCase();
  if (!c) return null;
  for (const g of GAMES) {
    if (g === currentGame) continue;
    try {
      const map = require('./' + g).getRooms();
      if (map && map[c]) return g;
    } catch (e) {}
  }
  return null;
}

// Text for the error box, in the player's language
function notFound(socket, code, currentGame) {
  try {
    const lang = langOf(socket);
    const other = findOtherGame(code, currentGame);
    return other ? TEXT[lang].other(NAMES[lang][other]) : TEXT[lang].none;
  } catch (e) {
    return 'Room not found.';
  }
}

module.exports = { notFound };
