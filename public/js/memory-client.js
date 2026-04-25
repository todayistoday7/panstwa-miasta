// ═══════════════════════════════════════════════════════
// FIND PAIRS (Memory) — Client
// ═══════════════════════════════════════════════════════
'use strict';

const socket = io();
const _urlLang = new URLSearchParams(window.location.search).get('lang');
let lang     = (window._forceLang && ['pl','en','de','sv'].includes(window._forceLang))
               ? window._forceLang
               : (['pl','en','de','sv'].includes(_urlLang) ? _urlLang : 'pl');
let myId     = null;
let myName   = '';
window._gameSlug = 'memory';
var _settingsInitMem = false;
let roomCode = '';
let roomState = null;
let keepAliveInterval = null;

// ─── TRANSLATIONS ────────────────────────────────────────────────
const LANGS = {
  pl: {
    name: '🇵🇱 PL',
    gameTitle:    'ZNAJDŹ PARY',
    subtitle:     'Gra karciana online · 2-6 graczy',
    createRoom:   'Stwórz pokój',   joinRoom:    'Dołącz do pokoju',
    yourName:     'Twoje imię',     joinName:    'Twoje imię',
    roomCode:     'Kod pokoju',     createBtn:   'Stwórz pokój',
    joinBtn:      'Dołącz',         settings:    'Ustawienia',
    theme:        'Motyw',          boardSize:   'Rozmiar planszy',
    maxPlayers:   'Max graczy',
    rejoinTip:    'Jeśli przypadkowo opuścisz grę, wróć z tym samym imieniem i kodem pokoju.',
    playersTitle: 'Gracze',
    startBtn:     '🎮 Rozpocznij',  leaveRoom:   '🚪 Wyjdź',
    shareCode:    'Udostępnij kod znajomym',
    shareRoom:    'Udostępnij pokój',
    demoCaption:  'Odkrywaj karty i szukaj pasujących par',
    homeRejoinTip:'Jeśli przypadkowo opuścisz grę, wróć z tym samym imieniem i kodem pokoju.',
    copyCode:     'Skopiuj kod',
    createDisclaimer: 'Stwórz pokój otwarty lub prywatny. Zaproś znajomych — otrzymasz kod pokoju, który przekażesz innym graczom.',
    joinDisclaimer: 'Masz kod od znajomego lub z listy otwartych pokoi? Wpisz go tutaj i graj razem!',
    waitingForHost: 'Czekam na hosta...',
    needPlayers:  'Potrzeba minimum 2 graczy',
    howToPlay:    'Zasady gry',
    rule1:        'Stwórz pokój i udostępnij kod znajomym',
    rule2:        'Na zmianę odkrywajcie po dwie karty, szukając pasujących par',
    rule3:        'Znalazłeś parę? Zatrzymujesz ją i grasz dalej!',
    rule4:        'Gracz z największą liczbą par wygrywa',
    yourTurn:     'Twoja kolej!',
    theirTurn:    (n) => `Kolej gracza ${n}`,
    gameOver:     'Koniec gry!',
    pairs:        'par',
    pairsInfo:    (f, t) => `${f}/${t} par`,
    playerWord:   'graczy',
    cardsWord:    'kart',
    navHome:      'Strona główna',
    navAllGames:  'Wszystkie gry',
    playAgain:    '🔄 Zagraj jeszcze raz z tą grupą',
    newGame:      '🏠 Powrót',
    hostBadge:    'HOST',
    youBadge:     'TY ·',
    offlineBadge: 'offline',
    leaveTitle:   'Opuścić grę?',
    leaveMsg:     'Gra jest w toku. Na pewno chcesz wyjść?',
    leaveYes:     'Tak, wyjdź',
    leaveNo:      'Anuluj',
    confirmLeave: 'Na pewno chcesz opuścić pokój?',
    themeAnimals: 'Zwierzęta', themeFood: 'Jedzenie', themeNature: 'Natura',
    themeTravel:  'Podróże',   themeSports: 'Sport',   themeFlags: 'Flagi',
  },
  en: {
    name: '🇬🇧 EN',
    gameTitle:    'FIND PAIRS',
    subtitle:     'Online multiplayer · 2-6 players',
    createRoom:   'Create Room',    joinRoom:    'Join Room',
    yourName:     'Your name',      joinName:    'Your name',
    roomCode:     'Room code',      createBtn:   'Create Room',
    joinBtn:      'Join Room',      settings:    'Settings',
    theme:        'Theme',          boardSize:   'Board size',
    maxPlayers:   'Max players',
    rejoinTip:    'If you accidentally leave, rejoin using the same name and room code.',
    playersTitle: 'Players',
    startBtn:     '🎮 Start Game',  leaveRoom:   '🚪 Leave Room',
    shareCode:    'Share this code with friends',
    shareRoom:    'Share Room',
    demoCaption:  'Flip cards to find matching pairs',
    homeRejoinTip:'If you accidentally leave mid-game, rejoin with the same name and room code.',
    copyCode:     'Copy Code',
    createDisclaimer: 'Create a public or private room. Invite friends — you\'ll get a room code to share with other players.',
    joinDisclaimer: 'Have a code from a friend or from the Live Rooms page? Enter it here and join the game!',
    waitingForHost: 'Waiting for host...',
    needPlayers:  'Need at least 2 players',
    howToPlay:    'How to play',
    rule1:        'Create a room and share the code with friends',
    rule2:        'Take turns flipping two cards to find matching pairs',
    rule3:        'Find a pair? Keep the cards and go again!',
    rule4:        'The player with the most pairs wins',
    yourTurn:     'Your turn!',
    theirTurn:    (n) => `${n}'s turn`,
    gameOver:     'Game Over!',
    pairs:        'pairs',
    pairsInfo:    (f, t) => `${f}/${t} pairs`,
    playerWord:   'players',
    cardsWord:    'cards',
    navHome:      'Home',
    navAllGames:  'All Games',
    playAgain:    '🔄 Play Again With This Group',
    newGame:      '🏠 Home',
    hostBadge:    'HOST',
    youBadge:     'YOU ·',
    offlineBadge: 'offline',
    leaveTitle:   'Leave Game?',
    leaveMsg:     'A game is in progress. Are you sure?',
    leaveYes:     'Yes, leave',
    leaveNo:      'Cancel',
    confirmLeave: 'Are you sure you want to leave the room?',
    themeAnimals: 'Animals', themeFood: 'Food', themeNature: 'Nature',
    themeTravel:  'Travel',  themeSports: 'Sports', themeFlags: 'Flags',
  },
  de: {
    name: '🇩🇪 DE',
    gameTitle:    'MEMO-SPIEL',
    subtitle:     'Online-Kartenspiel · 2-6 Spieler',
    createRoom:   'Raum erstellen',  joinRoom:    'Raum beitreten',
    yourName:     'Dein Name',       joinName:    'Dein Name',
    roomCode:     'Raumcode',        createBtn:   'Raum erstellen',
    joinBtn:      'Beitreten',       settings:    'Einstellungen',
    theme:        'Thema',           boardSize:   'Spielfeldgröße',
    maxPlayers:   'Max. Spieler',
    rejoinTip:    'Falls du das Spiel verlässt, tritt mit demselben Namen und Code wieder bei.',
    playersTitle: 'Spieler',
    startBtn:     '🎮 Spiel starten', leaveRoom:  '🚪 Raum verlassen',
    shareCode:    'Teile diesen Code mit Freunden',
    shareRoom:    'Raum teilen',
    demoCaption:  'Decke Karten auf und finde passende Paare',
    homeRejoinTip:'Falls du das Spiel verlässt, tritt mit demselben Namen und Code wieder bei.',
    copyCode:     'Code kopieren',
    createDisclaimer: 'Erstelle einen öffentlichen oder privaten Raum. Lade Freunde ein — du erhältst einen Code zum Teilen.',
    joinDisclaimer: 'Hast du einen Code von einem Freund oder von der Seite mit offenen Räumen? Gib ihn hier ein und spiel mit!',
    waitingForHost: 'Warte auf den Host...',
    needPlayers:  'Mindestens 2 Spieler erforderlich',
    howToPlay:    'Spielregeln',
    rule1:        'Erstelle einen Raum und teile den Code mit Freunden',
    rule2:        'Deckt abwechselnd zwei Karten auf und sucht nach passenden Paaren',
    rule3:        'Paar gefunden? Behalte die Karten und spiele weiter!',
    rule4:        'Der Spieler mit den meisten Paaren gewinnt',
    yourTurn:     'Du bist dran!',
    theirTurn:    (n) => `${n} ist dran`,
    gameOver:     'Spiel vorbei!',
    pairs:        'Paare',
    pairsInfo:    (f, t) => `${f}/${t} Paare`,
    playerWord:   'Spieler',
    cardsWord:    'Karten',
    navHome:      'Startseite',
    navAllGames:  'Alle Spiele',
    playAgain:    '🔄 Nochmal mit dieser Gruppe',
    newGame:      '🏠 Startseite',
    hostBadge:    'HOST',
    youBadge:     'DU ·',
    offlineBadge: 'offline',
    leaveTitle:   'Spiel verlassen?',
    leaveMsg:     'Ein Spiel läuft. Bist du sicher?',
    leaveYes:     'Ja, verlassen',
    leaveNo:      'Abbrechen',
    confirmLeave: 'Möchtest du den Raum wirklich verlassen?',
    themeAnimals: 'Tiere', themeFood: 'Essen', themeNature: 'Natur',
    themeTravel:  'Reise', themeSports: 'Sport', themeFlags: 'Flaggen',
  },
  sv: {
    name: '🇸🇪 SV',
    gameTitle:    'MEMO-SPEL',
    subtitle:     'Online multiplayer · 2-6 spelare',
    createRoom:   'Skapa rum',       joinRoom:    'Gå med i rum',
    yourName:     'Ditt namn',       joinName:    'Ditt namn',
    roomCode:     'Rumskod',         createBtn:   'Skapa rum',
    joinBtn:      'Gå med',          settings:    'Inställningar',
    theme:        'Tema',            boardSize:   'Spelplansstorlek',
    maxPlayers:   'Max spelare',
    rejoinTip:    'Om du lämnar spelet av misstag, gå tillbaka med samma namn och rumskod.',
    playersTitle: 'Spelare',
    startBtn:     '🎮 Starta spelet', leaveRoom:  '🚪 Lämna rummet',
    shareCode:    'Dela den här koden med vänner',
    shareRoom:    'Dela rum',
    demoCaption:  'Vänd kort för att hitta matchande par',
    homeRejoinTip:'Om du lämnar spelet av misstag, gå tillbaka med samma namn och rumskod.',
    copyCode:     'Kopiera kod',
    createDisclaimer: 'Skapa ett offentligt eller privat rum. Bjud in vänner — du får en kod att dela.',
    joinDisclaimer: 'Har du en kod från en vän eller från sidan med aktiva rum? Skriv in den här och gå med i spelet!',
    waitingForHost: 'Väntar på värden...',
    needPlayers:  'Minst 2 spelare krävs',
    howToPlay:    'Så spelar du',
    rule1:        'Skapa ett rum och dela koden med vänner',
    rule2:        'Turas om att vända två kort för att hitta matchande par',
    rule3:        'Hittade du ett par? Behåll korten och spela vidare!',
    rule4:        'Spelaren med flest par vinner',
    yourTurn:     'Din tur!',
    theirTurn:    (n) => `${n}s tur`,
    gameOver:     'Spelet slut!',
    pairs:        'par',
    pairsInfo:    (f, t) => `${f}/${t} par`,
    playerWord:   'spelare',
    cardsWord:    'kort',
    navHome:      'Startsida',
    navAllGames:  'Alla spel',
    playAgain:    '🔄 Spela igen med denna grupp',
    newGame:      '🏠 Startsida',
    hostBadge:    'HOST',
    youBadge:     'DU ·',
    offlineBadge: 'offline',
    leaveTitle:   'Lämna spelet?',
    leaveMsg:     'Ett spel pågår. Är du säker?',
    leaveYes:     'Ja, lämna',
    leaveNo:      'Avbryt',
    confirmLeave: 'Vill du verkligen lämna rummet?',
    themeAnimals: 'Djur', themeFood: 'Mat', themeNature: 'Natur',
    themeTravel:  'Resor', themeSports: 'Sport', themeFlags: 'Flaggor',
  },
};

let L = LANGS[lang];

const THEME_META = {
  animals: { preview: '🐶🐱🦁', labelKey: 'themeAnimals' },
  food:    { preview: '🍕🍦🍎', labelKey: 'themeFood' },
  nature:  { preview: '🌸🌊🌈', labelKey: 'themeNature' },
  travel:  { preview: '✈️🚀🏰', labelKey: 'themeTravel' },
  sports:  { preview: '⚽🏀🎾', labelKey: 'themeSports' },
  flags:   { preview: '🇵🇱🇬🇧🇩🇪', labelKey: 'themeFlags' },
};

// ─── HOME DEMO ANIMATION ─────────────────────────────────────────
function runDemoAnimation() {
  var board = document.getElementById('demo-board');
  if (!board) return;

  var emojis = ['🐶','⭐','🐱','⭐','🐶','🐱'];
  var cards = emojis.map(function(e, i) {
    return { emoji: e, state: 'down', idx: i };
  });

  function render() {
    board.innerHTML = cards.map(function(c) {
      var cls = 'mem-demo-card ';
      if (c.state === 'down') cls += 'face-down';
      else if (c.state === 'up') cls += 'face-up';
      else cls += 'matched';
      return '<div class="' + cls + '">' + (c.state !== 'down' ? c.emoji : '') + '</div>';
    }).join('');
  }

  render();

  var step = 0;
  var seq = [
    // First pair attempt: flip card 0 (🐶), flip card 3 (⭐) — no match
    function() { cards[0].state = 'up'; render(); },
    function() { cards[3].state = 'up'; render(); },
    function() { cards[0].state = 'down'; cards[3].state = 'down'; render(); },
    // Second attempt: flip card 1 (⭐), flip card 3 (⭐) — match!
    function() { cards[1].state = 'up'; render(); },
    function() { cards[3].state = 'up'; render(); },
    function() { cards[1].state = 'matched'; cards[3].state = 'matched'; render(); },
    // Third attempt: flip card 0 (🐶), flip card 4 (🐶) — match!
    function() { cards[0].state = 'up'; render(); },
    function() { cards[4].state = 'up'; render(); },
    function() { cards[0].state = 'matched'; cards[4].state = 'matched'; render(); },
    // Reset
    function() {
      cards.forEach(function(c) { c.state = 'down'; });
      render();
    },
  ];

  setInterval(function() {
    seq[step]();
    step = (step + 1) % seq.length;
  }, 900);
}

// ─── LOBBY RENDERING ─────────────────────────────────────────────
function renderLobby(data) {
  var players = data.players || [];
  var hostId  = data.hostId;
  var settings = data.settings || {};
  var connected = players.filter(function(p) { return p.connected !== false; });
  var isHost = data.hostId === myId;

  // Room code display
  var codeEl = document.getElementById('room-code-display');
  if (codeEl) codeEl.textContent = roomCode;

  // Rejoin tip
  var tip = document.getElementById('rejoin-tip');
  if (tip) tip.style.display = players.length >= 1 ? 'block' : 'none';

  // Player list
  var el = document.getElementById('lobby-players');
  el.innerHTML = '';
  players.forEach(function(p, i) {
    var isConn = p.connected !== false;
    el.innerHTML +=
      '<div class="lobby-player" style="' + (!isConn ? 'opacity:0.4;' : '') + '">' +
        '<div class="avatar av-' + (i % 8) + '" style="background:' + p.color + ';color:#fff;">' +
          p.name.charAt(0).toUpperCase() +
        '</div>' +
        '<span class="pname">' + p.name +
          (p.id === myId   ? ' <span class="you-badge">'  + L.youBadge  + '</span>' : '') +
          (p.id === hostId ? ' <span class="host-badge">' + L.hostBadge + '</span>' : '') +
          (!isConn ? ' <span class="offline-badge">' + (L.offlineBadge || 'offline') + '</span>' : '') +
        '</span>' +
      '</div>';
  });

  // Player warning
  var warn = document.getElementById('player-warning');
  if (warn) {
    warn.style.display   = connected.length < 2 ? 'block' : 'none';
    warn.textContent     = L.needPlayers;
  }

  // Settings (host only)
  var maxSel = document.getElementById('settings-maxplayers');
  if (isHost) {
    if (!_settingsInitMem) {
      if (maxSel) maxSel.value = settings.maxPlayers || 6;
      _settingsInitMem = true;
    }
    if (maxSel) maxSel.disabled = false;
    document.getElementById('lobby-btn-row').style.display = 'flex';
    document.getElementById('waiting-msg').style.display   = 'none';
  } else {
    if (maxSel) maxSel.disabled = true;
    document.getElementById('lobby-btn-row').style.display = 'none';
    document.getElementById('waiting-msg').style.display   = 'block';
    document.getElementById('waiting-msg').textContent     = L.waitingForHost;
  }

  // Lobby settings card visibility
  var settingsCard = document.getElementById('lobby-settings-card');
  if (settingsCard) settingsCard.style.display = isHost ? 'block' : 'none';

  // Sync theme/size buttons from server state
  if (settings) {
    document.querySelectorAll('.mem-theme-btn').forEach(function(b) {
      b.classList.toggle('active', b.dataset.theme === settings.theme);
    });
    document.querySelectorAll('.mem-size-btn').forEach(function(b) {
      b.classList.toggle('active', parseInt(b.dataset.size) === settings.boardSize);
    });
  }

  buildThemeGrid();
}

// ─── THEME GRID ──────────────────────────────────────────────────
function buildThemeGrid() {
  var grid = document.getElementById('theme-grid');
  if (!grid) return;
  var currentTheme = roomState ? roomState.settings.theme : 'animals';
  grid.innerHTML = Object.entries(THEME_META).map(function(entry) {
    var key = entry[0], t = entry[1];
    var label = L[t.labelKey] || key;
    return '<button class="mem-theme-btn ' + (key === currentTheme ? 'active' : '') + '" data-theme="' + key + '" onclick="setTheme(\'' + key + '\',this)">' +
      '<span class="tp">' + t.preview + '</span>' + label +
    '</button>';
  }).join('');
}

function setTheme(theme, btn) {
  document.querySelectorAll('.mem-theme-btn').forEach(function(b) { b.classList.remove('active'); });
  if (btn) btn.classList.add('active');
  if (roomCode) socket.emit('mem_update_settings', { code: roomCode, settings: { theme: theme } });
}

function setSize(size, btn) {
  document.querySelectorAll('.mem-size-btn').forEach(function(b) { b.classList.remove('active'); });
  if (btn) btn.classList.add('active');
  if (roomCode) socket.emit('mem_update_settings', { code: roomCode, settings: { boardSize: size } });
}

// ─── GAME RENDERING ─────────────────────────────────────────────
function renderGame(state) {
  // Turn bar — player pills
  var turnBar = document.getElementById('turn-bar');
  turnBar.innerHTML = state.players.map(function(p) {
    return '<div class="mem-player-pill ' + (p.id === state.currentPlayer ? 'active' : '') + '" ' +
      'style="border-color:' + (p.id === state.currentPlayer ? p.color : 'var(--border)') + ';">' +
      p.name + (p.id === myId ? ' (you)' : '') +
      '<span class="pill-score">' + p.score + '</span>' +
    '</div>';
  }).join('');

  // Turn label
  var turnLabel = document.getElementById('turn-label');
  if (state.currentPlayer === myId) {
    turnLabel.textContent = L.yourTurn;
    turnLabel.style.color = 'var(--accent)';
  } else {
    var cp = state.players.find(function(p) { return p.id === state.currentPlayer; });
    turnLabel.textContent = L.theirTurn(cp ? cp.name : '...');
    turnLabel.style.color = 'var(--muted)';
  }

  // Pairs info
  document.getElementById('pairs-info').textContent = L.pairsInfo(state.foundPairs, state.totalPairs);

  // Board
  var board = document.getElementById('board');
  board.className = 'mem-board size-' + state.board.length;

  board.innerHTML = state.board.map(function(card, i) {
    var isFlipped = card.flipped || card.matched;
    var matchClass = card.matched ? ' matched' : '';
    return '<div class="mem-card-wrap">' +
      '<div class="mem-card' + (isFlipped ? ' flipped' : '') + matchClass + '" onclick="flipCard(' + i + ')">' +
        '<div class="mem-face mem-front"></div>' +
        '<div class="mem-face mem-back">' + (card.emoji || '') + '</div>' +
      '</div>' +
    '</div>';
  }).join('');
}

// ─── FINAL RENDERING ─────────────────────────────────────────────
function renderFinal(state) {
  var sorted = state.players.slice().sort(function(a, b) { return b.score - a.score; });
  var maxScore = sorted[0] ? sorted[0].score : 0;

  var container = document.getElementById('final-results');
  container.innerHTML = '<div class="mem-final-players">' +
    sorted.map(function(p, i) {
      return '<div class="mem-final-row ' + (p.score === maxScore ? 'winner' : '') + '">' +
        '<span class="mem-final-name">' + (i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '  ') +
          ' ' + p.name + (p.id === myId ? ' (you)' : '') + '</span>' +
        '<span class="mem-final-score">' + p.score + ' ' + L.pairs + '</span>' +
      '</div>';
    }).join('') +
  '</div>';

  // Show play again only for host
  var remBtn = document.getElementById('lbl-rematch');
  if (remBtn) remBtn.style.display = (state.hostId === myId) ? 'block' : 'none';

  if (typeof renderOtherGames === 'function') renderOtherGames('memory');
}

// ─── ACTIONS ─────────────────────────────────────────────────────
function createRoom() {
  var name = (document.getElementById('host-name').value || '').trim();
  if (!name) { showError(lang === 'pl' ? 'Wpisz swoje imię.' : 'Please enter your name.'); return; }
  var hp = document.getElementById('hp-website');
  if (hp && hp.value) return;
  myName = name;
  sessionStorage.setItem('mem_name', name);
  socket.emit('mem_create', { name: name, settings: { boardSize: 16, theme: 'animals', maxPlayers: 6 } });
}

function joinRoom() {
  var name = (document.getElementById('join-name').value || '').trim();
  var code = (document.getElementById('join-code').value || '').trim().toUpperCase();
  if (!name) { showError(lang === 'pl' ? 'Wpisz swoje imię.' : 'Please enter your name.'); return; }
  if (!code) { showError(lang === 'pl' ? 'Wpisz kod pokoju.' : 'Please enter a room code.'); return; }
  myName = name;
  sessionStorage.setItem('mem_name', name);
  socket.emit('mem_join', { code: code, name: name });
}

function startGame() {
  if (roomCode) socket.emit('mem_start', { code: roomCode });
}

function playAgain() {
  if (roomCode) socket.emit('mem_play_again', { code: roomCode });
}

function flipCard(index) {
  if (!roomCode || !roomState) return;
  if (roomState.currentPlayer !== myId) return;
  socket.emit('mem_flip', { code: roomCode, cardIndex: index });
}

function updateSettings() {
  if (!roomCode) return;
  var maxSel = document.getElementById('settings-maxplayers');
  var maxP = maxSel ? parseInt(maxSel.value) : 6;
  socket.emit('mem_update_settings', { code: roomCode, settings: { maxPlayers: maxP, isPublic: getIsPublic() } });
}

function goHome() {
  if (roomCode) socket.emit('mem_leave', { code: roomCode });
  roomCode = '';
  roomState = null;
  _settingsInitMem = false;
  showScreen('screen-home');
  if (keepAliveInterval) { clearInterval(keepAliveInterval); keepAliveInterval = null; }
}

function doGoHome() { closeConfirm(); goHome(); }

// ─── SOCKET EVENTS ───────────────────────────────────────────────
socket.on('connect', function() { myId = socket.id; });

socket.on('mem_room_created', function(data) {
  roomCode = data.code;
  document.getElementById('room-code-display').textContent = data.code;
  buildThemeGrid();
  showScreen('screen-lobby');
  // Keep alive
  if (keepAliveInterval) clearInterval(keepAliveInterval);
  keepAliveInterval = setInterval(function() {
    if (roomCode) socket.emit('mem_keepalive', { code: roomCode });
  }, 25000);
});

socket.on('mem_error', function(data) {
  showError(data.msg);
});

socket.on('mem_state', function(state) {
  roomState = state;

  if (state.phase === 'lobby') {
    renderLobby(state);
    showScreen('screen-lobby');
  } else if (state.phase === 'playing') {
    renderGame(state);
    showScreen('screen-playing');
  } else if (state.phase === 'final') {
    renderFinal(state);
    showScreen('screen-final');
  }
});

// ─── LANG BAR ────────────────────────────────────────────────────
function setUiLang(code) {
  lang = code; L = LANGS[code] || LANGS['en'];
  document.querySelectorAll('.lang-btn').forEach(function(b) {
    b.classList.toggle('active', b.textContent === LANGS[code].name);
  });
  applyTranslations();
  if (roomState) {
    if (roomState.phase === 'lobby') renderLobby(roomState);
    else if (roomState.phase === 'playing') renderGame(roomState);
    else if (roomState.phase === 'final') renderFinal(roomState);
  }
  history.replaceState(null, '', window.location.pathname + '?lang=' + code);
  window.lang = lang;
  if (typeof window._rebuildBurger === 'function') window._rebuildBurger(code);
  if (typeof window._refreshFooter  === 'function') window._refreshFooter();
}

function applyTranslations() {
  var map = {
    'game-title':       'gameTitle',   'game-subtitle':    'subtitle',
    'lbl-create-room':  'createRoom',  'lbl-create-disclaimer': 'createDisclaimer',
    'lbl-join-room':    'joinRoom',    'lbl-join-disclaimer': 'joinDisclaimer',
    'lbl-your-name':    'yourName',    'lbl-join-name':    'joinName',
    'lbl-room-code':    'roomCode',    'lbl-create-btn':   'createBtn',
    'lbl-join-btn':     'joinBtn',     'lbl-settings':     'settings',
    'lbl-theme':        'theme',       'lbl-board-size':   'boardSize',
    'lbl-max-players':  'maxPlayers',
    'lbl-players-title':'playersTitle','lbl-start-btn':    'startBtn',
    'lbl-leave-room':   'leaveRoom',   'lbl-share-code':   'shareCode',
    'lbl-copy-code':    'copyCode',    'lbl-how-to-play':  'howToPlay',
    'lbl-nav-home':     'navHome',     'lbl-nav-all-games':'navAllGames',
    'lbl-rule-1':       'rule1',       'lbl-rule-2':       'rule2',
    'lbl-rule-3':       'rule3',       'lbl-rule-4':       'rule4',
    'lbl-lobby-how-to-play':'howToPlay',
    'lbl-lobby-rule-1': 'rule1',       'lbl-lobby-rule-2': 'rule2',
    'lbl-lobby-rule-3': 'rule3',       'lbl-lobby-rule-4': 'rule4',
    'lbl-play-again':   'playAgain',   'lbl-new-game':     'newGame',
    'lbl-game-over':    'gameOver',    'lbl-share-room':   'shareRoom',
    'lbl-demo-caption': 'demoCaption', 'lbl-home-rejoin-tip': 'homeRejoinTip',
    'lbl-rejoin-tip':   'rejoinTip',
  };
  for (var id in map) {
    var el = document.getElementById(id);
    if (el && L[map[id]] && typeof L[map[id]] === 'string') el.textContent = L[map[id]];
  }

  document.querySelectorAll('.lbl-nav-home-dup').forEach(function(el) { if (L.navHome) el.textContent = L.navHome; });

  // Translate max players dropdown
  var pl = L.playerWord || 'players';
  var maxSel = document.getElementById('settings-maxplayers');
  if (maxSel) {
    [2,3,4,5,6].forEach(function(n, i) {
      if (maxSel.options[i]) maxSel.options[i].text = n + ' ' + pl;
    });
  }

  // Translate size buttons
  var cw = L.cardsWord || 'cards';
  var sizeLabels = { 12: '12 ' + cw, 16: '16 ' + cw, 20: '20 ' + cw };
  ['12','16','20'].forEach(function(s) {
    var el = document.getElementById('lbl-size-' + s);
    if (el) el.textContent = sizeLabels[parseInt(s)];
  });

  // Rebuild theme grid with translated labels
  buildThemeGrid();
}

// ─── PRE-FILL JOIN CODE FROM URL ─────────────────────────────────
(function() {
  var params = new URLSearchParams(window.location.search);
  var join = params.get('join');
  if (join) {
    var el = document.getElementById('join-code');
    if (el) el.value = join.toUpperCase();
    var nameEl = document.getElementById('join-name');
    if (nameEl) nameEl.focus();
  }
  // Restore name
  var saved = sessionStorage.getItem('mem_name');
  if (saved) {
    var h = document.getElementById('host-name');
    var j = document.getElementById('join-name');
    if (h) h.value = saved;
    if (j) j.value = saved;
  }
})();

// ─── INIT ────────────────────────────────────────────────────────
buildLangBar();
applyTranslations();
initVisibilityToggle();
prefillJoinCode();
runDemoAnimation();
window.lang = lang;
