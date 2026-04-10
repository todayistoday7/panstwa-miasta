'use strict';
// ════════════════════════════════════════════════════════
// CORPORATE BINGO — Client
// ════════════════════════════════════════════════════════

const LANGS_BINGO = {
  pl: {
    name:            '🇵🇱 PL',
    gameTitle:       'Korporacyjne Bingo',
    gameSubtitle:    'Gra na spotkania · 2–50 graczy',
    yourName:        'Twoje imię',
    createRoom:      'Stwórz pokój',
    joinRoom:        'Dołącz do pokoju',
    createDisclaimer: 'Stwórz publiczny lub prywatny pokój. Zaproś znajomych — otrzymasz kod pokoju, który przekażesz innym graczom.',
    joinDisclaimer: 'Masz kod od znajomego lub z listy otwartych pokoi? Wpisz go tutaj i graj razem!',
    roomCode:        'Kod pokoju',
    createBtn:       'Stwórz pokój',
    joinBtn:         'Dołącz',
    playersInRoom:   'Gracze w pokoju',
    startBtn:        '▶ Zacznij grę',
    shareRoom:       '📤 Udostępnij pokój',
    waitingHost:     'Czekaj na rozpoczęcie gry przez hosta...',
    needPlayers:     'Potrzeba minimum 2 graczy',
    callBingo:       '🎉 BINGO!',
    falseBingo:      '❌ To nie jest jeszcze Bingo! Sprawdź swoją kartę.',
    winnerMsg:       (n) => `🎉 ${n} ma BINGO!`,
    youWon:          '🎉 Masz BINGO! Wygrywasz!',
    playAgain:       '🔄 Zagraj jeszcze raz',
    freeSquare:      'BINGO',
    howToPlay:       'Zasady gry',
    navHome:         'Strona główna',
    navAllGames:     'Wszystkie gry',
    rule1:           'Stwórz pokój i udostępnij kod znajomym',
    rule2:           'Każdy gracz dostaje unikalną kartę 5×5 z hasłami korporacyjnymi',
    rule3:           'Podczas spotkania — kliknij hasło gdy je usłyszysz',
    rule4:           'Środkowe pole jest zawsze wolne i zaznaczone',
    rule5:           'Pierwszy kto ułoży linię w dowolnym kierunku — klika BINGO i wygrywa!',
    rejoinTip:       'Jeśli przypadkowo opuścisz grę, wróć z tym samym imieniem i kodem pokoju.',
    language:        'Język',
    leaveRoom:       'Opuść pokój',
    youBadge:        'TY',
    hostBadge:       'HOST',
    markedCount:     (n) => `${n} zaznaczonych`,
    progressLabel:   'Postęp graczy',
    gameOver:        'Koniec gry!',
  },
  en: {
    name:            '🇬🇧 EN',
    gameTitle:       'Corporate Bingo',
    gameSubtitle:    'Meeting game · 2–50 players',
    yourName:        'Your name',
    createRoom:      'Create Room',
    joinRoom:        'Join Room',
    joinDisclaimer: 'Have a code from a friend or from the Live Rooms page? Enter it here and join the game!',
    roomCode:        'Room code',
    createBtn:       'Create Room',
    joinBtn:         'Join',
    playersInRoom:   'Players in room',
    startBtn:        '▶ Start Game',
    shareRoom:       '📤 Share Room',
    homeRejoinTip:   'If you accidentally leave, rejoin with the same name and room code.',
    createDisclaimer: 'Stwórz publiczny lub prywatny pokój. Zaproś znajomych — otrzymasz kod pokoju, który przekażesz innym graczom.',
    waitingHost:     'Waiting for host to start the game...',
    needPlayers:     'Need at least 2 players',
    callBingo:       '🎉 BINGO!',
    falseBingo:      "❌ Not quite Bingo yet! Check your card.",
    winnerMsg:       (n) => `🎉 ${n} has BINGO!`,
    youWon:          '🎉 You got BINGO! You win!',
    playAgain:       '🔄 Play Again',
    freeSquare:      'BINGO',
    howToPlay:       'How to play',
    navHome:         'Home',
    navAllGames:     'All Games',
    rule1:           'Create a room and share the code with friends',
    rule2:           'Each player gets a unique 5×5 card with corporate phrases',
    rule3:           'During a meeting — tap a phrase when you hear it',
    rule4:           'The centre square is always free and pre-marked',
    rule5:           'First to complete a line in any direction — click BINGO and win!',
    rejoinTip:       'If you accidentally leave, rejoin with the same name and room code.',
    language:        'Language',
    leaveRoom:       'Leave Room',
    youBadge:        'YOU',
    hostBadge:       'HOST',
    markedCount:     (n) => `${n} marked`,
    progressLabel:   'Player progress',
    gameOver:        'Game Over!',
  },
  de: {
    name:            '🇩🇪 DE',
    gameTitle:       'Unternehmens-Bingo',
    gameSubtitle:    'Meeting-Spiel · 2–50 Spieler',
    yourName:        'Dein Name',
    createRoom:      'Raum erstellen',
    joinRoom:        'Raum beitreten',
    roomCode:        'Raumcode',
    createBtn:       'Raum erstellen',
    joinBtn:         'Beitreten',
    playersInRoom:   'Spieler im Raum',
    startBtn:        '▶ Spiel starten',
    shareRoom:       '📤 Raum teilen',
    homeRejoinTip:   'Falls du den Raum verlässt, tritt mit demselben Namen und Code wieder bei.',
    waitingHost:     'Warte auf den Host...',
    needPlayers:     'Mindestens 2 Spieler erforderlich',
    callBingo:       '🎉 BINGO!',
    falseBingo:      '❌ Noch kein Bingo! Überprüfe deine Karte.',
    winnerMsg:       (n) => `🎉 ${n} hat BINGO!`,
    youWon:          '🎉 Du hast BINGO! Du gewinnst!',
    playAgain:       '🔄 Nochmal spielen',
    freeSquare:      'BINGO',
    howToPlay:       'Spielregeln',
    navHome:         'Startseite',
    navAllGames:     'Alle Spiele',
    rule1:           'Erstelle einen Raum und teile den Code mit Freunden',
    rule2:           'Jeder Spieler erhält eine einzigartige 5×5-Karte mit Unternehmensphrasen',
    rule3:           'Während eines Meetings — tippe eine Phrase wenn du sie hörst',
    rule4:           'Das mittlere Feld ist immer frei und vormarkiert',
    rule5:           'Wer zuerst eine Linie in beliebiger Richtung vervollständigt — klickt BINGO und gewinnt!',
    rejoinTip:       'Falls du das Spiel versehentlich verlässt, tritt mit demselben Namen und Code wieder bei.',
    language:        'Sprache',
    leaveRoom:       'Raum verlassen',
    youBadge:        'DU',
    hostBadge:       'HOST',
    markedCount:     (n) => `${n} markiert`,
    progressLabel:   'Spielerfortschritt',
    gameOver:        'Spiel vorbei!',
  },
  sv: {
    name:            '🇸🇪 SV',
    gameTitle:       'FÖRETAGSBINGO',
    gameSubtitle:    'Mötespel · 2–50 spelare',
    createRoom:      'Skapa rum',
    joinRoom:        'Gå med i rum',
    yourName:        'Ditt namn',
    joinName:        'Ditt namn',
    roomCode:        'Rumskod',
    createBtn:       'Skapa rum',
    joinBtn:         'Gå med',
    startBtn:        '▶ Starta spelet',
    waitingForHost:  'Väntar på värden...',
    needPlayers:     'Minst 2 spelare krävs',
    shareRoom:       '📤 Dela rum',
    copyCode:        'Kopiera kod',
    howToPlay:       'Spelregler',
    freeSquare:      'GRATIS',
    callBingo:       '🎉 BINGO!',
    playAgain:       '🔄 Spela igen',
    goHome:          '🏠 Hem',
    createDisclaimer:'Skapa ett offentligt eller privat rum. Bjud in kollegor — du får en kod att dela.',
    joinDisclaimer: 'Har du en kod från en vän eller från sidan med aktiva rum? Skriv in den här och gå med i spelet!',
    homeRejoinTip:   'Om du lämnar av misstag, gå tillbaka med samma namn och rumskod.',
    winner:          (n) => `🏆 ${n} har BINGO!`,
    rule1:           'Skapa ett rum och dela koden med kollegor',
    rule2:           'Varje spelare får ett unikt 5×5-kort med företagsfraser',
    rule3:           'Under ett möte — tryck på en fras när du hör den',
    rule4:           'Mittenfältet är alltid gratis och förmarkerat',
    rule5:           'Den som först fyller en rad i valfri riktning — trycker BINGO och vinner!',
    rejoinTip:       'Om du lämnar spelet av misstag, gå tillbaka med samma namn och rumskod.',
    language:        'Språk',
    leaveRoom:       'Lämna rummet',
    youBadge:        'DU',
    hostBadge:       'VÄRD',
    markedCount:     (n) => `${n} markerade`,
    progressLabel:   'Spelarframsteg',
    gameOver:        'Spelet är slut!',
    navHome:         'Startsida',
    navAllGames:     'Alla spel',
    playersInRoom:   'Spelare i rummet',
    waitingHost:     'Väntar på att värden startar spelet...',
    youWon:          '🎉 Du fick BINGO! Du vinner!',
    falseBingo:      '❌ Inte riktigt Bingo än! Kontrollera ditt kort.',
    winnerMsg:       (n) => `🏆 ${n} fick BINGO!`,
  },
};

// ── State ────────────────────────────────────────────────
const socket  = io({ transports: ['websocket', 'polling'] });
let lang      = (window._forceLang && ['pl','en','de','sv'].includes(window._forceLang))
               ? window._forceLang
               : (new URLSearchParams(window.location.search).get('lang') || 'pl');
if (!LANGS_BINGO[lang]) lang = 'pl';
let L         = LANGS_BINGO[lang];
let myId      = null;
let myName    = '';
let roomCode  = '';
let roomState = null;
let isHost    = false;

// ── Socket plumbing ───────────────────────────────────────
socket.on('connect', () => {
  myId = socket.id;
});
socket.on('reconnect', () => {
  myId = socket.id;
});

socket.on('bingo_created', ({ code }) => {
  roomCode = code;
  isHost   = true;
  document.getElementById('host-name').value = '';
  showScreen('screen-lobby');
});

socket.on('bingo_joined', ({ code, isHost: h }) => {
  roomCode = code;
  isHost   = h;
  document.getElementById('join-name').value = '';
  showScreen('screen-lobby');
});

socket.on('bingo_state', (data) => {
  roomState = data;
  switch (data.phase) {
    case 'lobby':   showScreen('screen-lobby');  renderLobby(data);  break;
    case 'playing': showScreen('screen-playing');renderPlaying(data);break;
    case 'final':   showScreen('screen-final');  renderFinal(data);  break;
  }
});

socket.on('bingo_error', ({ msg }) => {
  const el = document.getElementById('home-error');
  if (el) { el.textContent = msg; el.style.display = 'block'; }
  setTimeout(() => { if (el) el.style.display = 'none'; }, 4000);
});

socket.on('bingo_false', () => {
  showToast(L.falseBingo, 4000);
});

// ── Screens ──────────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
  const el = document.getElementById(id);
  if (el) el.style.display = 'flex';
  // show/hide nav share btn
  const navShare = document.getElementById('nav-share-btn');
  if (navShare) navShare.style.display = (roomCode && id !== 'screen-home') ? 'flex' : 'none';
}

// ── Render lobby ─────────────────────────────────────────
function renderLobby(data) {
  const { players, hostId } = data;

  // Room code display
  const codeEl = document.getElementById('room-code-display');
  if (codeEl) codeEl.textContent = data.code;

  // Init visibility toggle once
  if (isHost && typeof initVisibilityToggle === 'function') {
    var togWrap = document.getElementById('vis-private');
    if (togWrap && !togWrap._bingoVisInit) {
      togWrap._bingoVisInit = true;
      initVisibilityToggle();
    }
  }

  // Player list
  const list = document.getElementById('lobby-players');
  if (list) {
    list.innerHTML = '';
    players.forEach(p => {
      const div = document.createElement('div');
      div.className = 'lobby-player' + (p.connected ? '' : ' offline');
      div.innerHTML =
        '<div class="avatar">' + p.name.charAt(0).toUpperCase() + '</div>' +
        '<span>' + escHtml(p.name) +
          (p.id === myId ? ' <span class="you-badge">' + L.youBadge + '</span>' : '') +
          (p.id === hostId ? ' <span class="host-badge">' + L.hostBadge + '</span>' : '') +
        '</span>';
      list.appendChild(div);
    });
  }

  // Host controls
  const startBtn = document.getElementById('start-btn');
  const waitMsg  = document.getElementById('waiting-msg');
  const needMsg  = document.getElementById('need-players-msg');
  const connected = players.filter(p => p.connected).length;

  if (isHost) {
    if (startBtn) {
      startBtn.style.display = 'inline-flex';
      startBtn.disabled = connected < 2;
    }
    if (waitMsg)  waitMsg.style.display  = 'none';
    if (needMsg)  needMsg.style.display  = connected < 2 ? 'block' : 'none';
  } else {
    if (startBtn) startBtn.style.display = 'none';
    if (waitMsg)  waitMsg.style.display  = 'block';
    if (needMsg)  needMsg.style.display  = 'none';
  }

  applyTranslations();
}

// ── Render playing ────────────────────────────────────────
function renderPlaying(data) {
  const { players, myCard, myMarked } = data;
  // Ensure myId is set - may be null on first render
  if (!myId) myId = socket.id;
  if (!myCard || !myCard.length) return;

  // Build/update grid
  const grid = document.getElementById('bingo-grid');
  if (!grid) return;
  grid.innerHTML = '';

  myCard.forEach((phrase, i) => {
    const cell = document.createElement('div');
    const isFree = phrase === '__FREE__';
    cell.className = 'bingo-cell' +
      (myMarked[i] ? ' marked' : '') +
      (isFree ? ' free' : '');
    cell.textContent = isFree ? L.freeSquare : phrase;
    if (!isFree) {
      cell.onclick = () => socket.emit('bingo_mark', { code: roomCode, index: i });
    }
    grid.appendChild(cell);
  });

  // Progress sidebar
  renderProgress(players, data);
  applyTranslations();
}

function renderProgress(players, data) {
  const el = document.getElementById('player-progress');
  if (!el) return;
  el.innerHTML = '';
  players.forEach(p => {
    // Server sends full marked array in players list for progress display
    const markedArr = (p.id === myId) ? data.myMarked : (p.marked || []);
    const marked = markedArr.filter(Boolean).length;
    const row = document.createElement('div');
    row.className = 'progress-row';
    row.innerHTML =
      '<span class="progress-name">' + escHtml(p.name) +
        (p.id === myId ? ' <span class="you-badge">' + L.youBadge + '</span>' : '') +
      '</span>' +
      '<div class="progress-bar-wrap">' +
        '<div class="progress-bar" style="width:' + Math.round(marked/24*100) + '%"></div>' +
      '</div>' +
      '<span class="progress-count">' + marked + '/24</span>';
    el.appendChild(row);
  });
}

// ── Render final ──────────────────────────────────────────
function renderFinal(data) {
  const { players, hostId } = data;
  const winner = players.find(p => p.bingo);

  const banner = document.getElementById('final-banner');
  if (banner) {
    if (winner) {
      banner.textContent = winner.id === myId ? L.youWon : L.winnerMsg(winner.name);
    }
  }

  const el = document.getElementById('final-results');
  if (el) {
    el.innerHTML = '';
    players.forEach(p => {
      const marked = p.marked ? p.marked.filter(Boolean).length : 0;
      const row = document.createElement('div');
      row.className = 'final-row' + (p.bingo ? ' winner' : '');
      row.innerHTML =
        '<span class="final-name">' +
          (p.bingo ? '🏆 ' : '') + escHtml(p.name) +
          (p.id === myId ? ' <span class="you-badge">' + L.youBadge + '</span>' : '') +
        '</span>' +
        '<span class="final-score">' + marked + '/24</span>';
      el.appendChild(row);
    });
  }

  const playAgainBtn = document.getElementById('play-again-btn');
  if (playAgainBtn) playAgainBtn.style.display = isHost ? 'inline-flex' : 'none';

  applyTranslations();
}

// ── Actions ──────────────────────────────────────────────
function createRoom() {
  const name = document.getElementById('host-name').value.trim();
  if (!name) return;
  myName = name;
  const _hp = document.getElementById('hp-website');
  if (_hp && _hp.value) return;
  socket.emit('bingo_create', { name, lang });
}

function joinRoom() {
  const name = document.getElementById('join-name').value.trim();
  const code = document.getElementById('join-code').value.trim().toUpperCase();
  if (!name || !code) return;
  myName = name;
  socket.emit('bingo_join', { name, code });
}

function startGame() {
  socket.emit('bingo_start', { code: roomCode });
}

function callBingo() {
  socket.emit('bingo_call', { code: roomCode });
}

function playAgain() {
  socket.emit('bingo_restart', { code: roomCode });
}

function leaveRoom() {
  roomCode = ''; roomState = null; isHost = false; myName = '';
  showScreen('screen-home');
  applyTranslations();
}

// ── Language ─────────────────────────────────────────────
function buildLangBar() {
  const bar = document.getElementById('lang-bar');
  if (!bar) return;
  bar.innerHTML = Object.keys(LANGS_BINGO).map(code =>
    '<button class="lang-btn' + (code === lang ? ' active' : '') + '" onclick="setUiLang(\'' + code + '\')">' +
    LANGS_BINGO[code].name + '</button>'
  ).join('');
}

function setUiLang(code) {
  lang = code; L = LANGS_BINGO[code] || LANGS_BINGO['en'];
  document.querySelectorAll('.lang-btn').forEach(b =>
    b.classList.toggle('active', b.textContent === LANGS_BINGO[code].name));
  applyTranslations();
  if (roomState) {
    switch (roomState.phase) {
      case 'lobby':   renderLobby(roomState);   break;
      case 'playing': renderPlaying(roomState); break;
      case 'final':   renderFinal(roomState);   break;
    }
  }
  history.replaceState(null, '', window.location.pathname + '?lang=' + code);
  window.lang = lang;
  if (typeof window._rebuildBurger === 'function') window._rebuildBurger(code);
  if (typeof window._refreshFooter  === 'function') window._refreshFooter();
  _ga('language_switched', { game: 'bingo', new_language: code });
}

// ── Translations ─────────────────────────────────────────
function applyTranslations() {
  const map = {
    'game-title':         'gameTitle',
    'game-subtitle':      'gameSubtitle',
    'lbl-create-room':    'createRoom',
    'lbl-join-room':      'joinRoom',
    'lbl-join-disclaimer':'joinDisclaimer',
    'lbl-your-name':      'yourName',
    'lbl-join-name':      'yourName',
    'lbl-room-code':      'roomCode',
    'lbl-create-btn':     'createBtn',
    'lbl-join-btn':       'joinBtn',
    'lbl-players-title':  'playersInRoom',
    'lbl-start-btn':      'startBtn',
    'lbl-share-room':     'shareRoom',
    'lbl-waiting-msg':    'waitingHost',
    'lbl-need-players':   'needPlayers',
    'lbl-call-bingo':     'callBingo',
    'lbl-play-again':     'playAgain',
    'lbl-how-to-play':    'howToPlay',
    'lbl-nav-home':       'navHome',
    'lbl-nav-all-games':  'navAllGames',
    'lbl-rule-1':         'rule1',
    'lbl-rule-2':         'rule2',
    'lbl-rule-3':         'rule3',
    'lbl-rule-4':         'rule4',
    'lbl-rule-5':         'rule5',
    'lbl-lobby-how-to-play':'howToPlay',
    'lbl-lobby-rule-1':   'rule1',
    'lbl-lobby-rule-2':   'rule2',
    'lbl-lobby-rule-3':   'rule3',
    'lbl-lobby-rule-4':   'rule4',
    'lbl-lobby-rule-5':   'rule5',
    'lbl-rejoin-tip':     'rejoinTip',
    'lbl-leave-room':          'leaveRoom',
    'lbl-leave-room-playing':  'leaveRoom',
    'lbl-leave-room-final':    'leaveRoom',
    'lbl-language':       'language',
    'lbl-progress':       'progressLabel',
    'lbl-game-over':      'gameOver',

    'lbl-home-rejoin-tip': 'homeRejoinTip',
  };
  for (const [id, key] of Object.entries(map)) {
    const el = document.getElementById(id);
    if (el && L[key] && typeof L[key] === 'string') el.textContent = L[key];
  }
  // Page title
  document.title = L.gameTitle + ' — panstwamiastagra.com';

  document.querySelectorAll('.lbl-nav-home-dup').forEach(function(el) { if (L.navHome) el.textContent = L.navHome; });
  document.querySelectorAll('.lbl-nav-all-games-dup').forEach(function(el) { if (L.navAllGames) el.textContent = L.navAllGames; });
}

// ── Helpers ──────────────────────────────────────────────
function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function showToast(msg, duration) {
  duration = duration || 3000;
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);' +
      'background:var(--surface);border:1px solid var(--border);color:var(--text);' +
      'padding:10px 20px;border-radius:10px;font-size:13px;font-weight:700;' +
      'z-index:9999;pointer-events:none;transition:opacity .3s;';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.style.opacity = '0'; }, duration);
}

function _ga(event, params) {
  try { if (typeof gtag !== 'undefined') gtag('event', event, params || {}); } catch(e) {}
}

// ── Prefill join code from URL ────────────────────────────
function prefillJoinCode() {
  const join = new URLSearchParams(window.location.search).get('join');
  if (join) {
    const el = document.getElementById('join-code');
    if (el) el.value = join.toUpperCase();
    const nameEl = document.getElementById('join-name');
    if (nameEl) nameEl.focus();
  }
}

// ── Nav share ─────────────────────────────────────────────
function shareRoomBingo() {
  // Use shared.js shareRoom — respects SEO slug for current page
  if (typeof shareRoom === 'function') {
    shareRoom('bingo');
  } else {
    const url = 'https://panstwamiastagra.com/bingo?join=' + roomCode + '&lang=' + lang;
    navigator.clipboard.writeText(url).then(() => {
      showToast(lang === 'pl' ? '🔗 Link skopiowany!' : lang === 'de' ? '🔗 Link kopiert!' : lang === 'sv' ? '🔗 Länk kopierad!' : '🔗 Link copied!');
    });
  }
}

// ── Init ─────────────────────────────────────────────────
buildLangBar();
applyTranslations();
window.lang = lang;
prefillJoinCode();
showScreen('screen-home');
