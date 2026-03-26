// ═══════════════════════════════════════════════════════
// DOTS AND BOXES — Client
// ═══════════════════════════════════════════════════════
'use strict';

const socket = io();
const _urlLang = new URLSearchParams(window.location.search).get('lang');
let lang     = (['pl','en'].includes(_urlLang) ? _urlLang : 'en');
let myId     = null;
let myName   = '';
let roomCode = '';
let roomState = null;
let keepAliveInterval = null;

// ─── TRANSLATIONS ────────────────────────────────────────────────
const LANGS = {
  pl: {
    name: '🇵🇱 PL',
    gameTitle:    'KROPKI I KRESKI',
    subtitle:     'Klasyczna gra strategiczna online · 2-4 graczy',
    createRoom:   'Stwórz pokój',   joinRoom:    'Dołącz do pokoju',
    yourName:     'Twoje imię',     joinName:    'Twoje imię',
    roomCode:     'Kod pokoju',     createBtn:   'Stwórz pokój',
    joinBtn:      'Dołącz',         settings:    'Ustawienia',
    gridSize:     'Rozmiar planszy', maxPlayers:  'Max graczy',
    playersTitle: 'Gracze',
    startBtn:     '🎮 Rozpocznij',  leaveRoom:   '🚪 Wyjdź',
    shareCode:    'Udostępnij kod znajomym',
    copyCode:     'Skopiuj kod',
    createDisclaimer: 'Stwórz pokój otwarty lub prywatny. Zaproś znajomych — otrzymasz kod pokoju, który przekażesz innym graczom.',
    waitingForHost: 'Czekam na hosta...',
    needPlayers:  'Potrzeba minimum 2 graczy',
    howToPlay:    'Zasady gry',
    rule1:        'Stwórz pokój i udostępnij kod znajomym',
    rule2:        'Na zmianę rysuj kreskę między dwiema sąsiednimi kropkami',
    rule3:        'Narysuj ostatnią krawędź kwadratu — zdobywasz punkt i grasz dalej!',
    rule4:        'Gracz z największą liczbą pól wygrywa',
    yourTurn:     'Twoja kolej!',
    theirTurn:    (n) => `Kolej gracza ${n}`,
    gameOver:     'Koniec gry!',
    winner:       (n) => `🏆 ${n} wygrywa!`,
    draw:         'Remis! 🤝',
    boxes:        'pól',
    rematch:      '🔄 Zagraj jeszcze raz z tą grupą',
    newGame:      '🏠 Powrót',
    hostBadge:    'HOST',
    youBadge:     'TY',
    leaveTitle:   'Opuścić grę?',
    leaveMsg:     'Gra jest w toku. Na pewno chcesz wyjść?',
    leaveYes:     'Tak, wyjdź',
    leaveNo:      'Anuluj',
    confirmLeave: 'Na pewno chcesz opuścić pokój?',
  },
  en: {
    name: '🇬🇧 EN',
    gameTitle:    'DOTS & BOXES',
    subtitle:     'Online multiplayer · 2-4 players',
    createRoom:   'Create Room',    joinRoom:    'Join Room',
    yourName:     'Your name',      joinName:    'Your name',
    roomCode:     'Room code',      createBtn:   'Create Room',
    joinBtn:      'Join Room',      settings:    'Settings',
    gridSize:     'Grid size',      maxPlayers:  'Max players',
    playersTitle: 'Players',
    startBtn:     '🎮 Start Game',  leaveRoom:   '🚪 Leave Room',
    shareCode:    'Share this code with friends',
    copyCode:     'Copy Code',
    createDisclaimer: 'Create a public or private room. Invite friends — you\'ll get a room code to share with other players.',
    waitingForHost: 'Waiting for host...',
    needPlayers:  'Need at least 2 players',
    howToPlay:    'How to play',
    rule1:        'Create a room and share the code with friends',
    rule2:        'Take turns drawing a line between two adjacent dots',
    rule3:        'Complete the 4th side of a box to claim it and go again!',
    rule4:        'The player with the most boxes wins',
    yourTurn:     'Your turn!',
    theirTurn:    (n) => `${n}'s turn`,
    gameOver:     'Game Over!',
    winner:       (n) => `🏆 ${n} wins!`,
    draw:         "It's a draw! 🤝",
    boxes:        'boxes',
    rematch:      '🔄 Play Again With This Group',
    newGame:      '🏠 Home',
    hostBadge:    'HOST',
    youBadge:     'YOU',
    leaveTitle:   'Leave Game?',
    leaveMsg:     'A game is in progress. Are you sure?',
    leaveYes:     'Yes, leave',
    leaveNo:      'Cancel',
    confirmLeave: 'Are you sure you want to leave the room?',
  },
};
let L = LANGS[lang];

// ─── GRID RENDERING CONFIG ───────────────────────────────────────
const DOT_R   = 6;     // dot radius px
const GAP     = 64;    // px between dots
const MARGIN  = 20;    // px margin around grid
const LINE_W  = 6;     // claimed line stroke width
const HOVER_W = 4;     // hover line stroke width

// ─── SOCKET EVENTS ───────────────────────────────────────────────
socket.on('connect', () => {
  myId = socket.id;
  clearInterval(keepAliveInterval);
  keepAliveInterval = setInterval(() => {
    if (roomCode) socket.emit('dots_keep_alive');
  }, 20000);

  // Always attempt rejoin on (re)connect if we have saved session data.
  // Reset roomCode so the rejoin response sets it cleanly.
  const savedCode = sessionStorage.getItem('dots_code');
  const savedName = sessionStorage.getItem('dots_name');
  if (savedCode && savedName) {
    roomCode = ''; myName = savedName;
    socket.emit('dots_rejoin', { code: savedCode, name: savedName });
  }
});

socket.on('dots_room_created', ({ code }) => {
  _ga('room_created', { game:'dots', language:lang });
  roomCode = code; roomState = null;
  sessionStorage.setItem('dots_code', code);
  sessionStorage.setItem('dots_name', myName);
  document.getElementById('room-code-display').textContent = code;
  showScreen('screen-lobby');
});

socket.on('dots_room_joined', ({ code }) => {
  _ga('room_joined', { game:'dots', language:lang });
  roomCode = code; roomState = null;
  sessionStorage.setItem('dots_code', code);
  sessionStorage.setItem('dots_name', myName);
  document.getElementById('room-code-display').textContent = code;
  showScreen('screen-lobby');
});

socket.on('dots_error',  ({ msg })  => { showError(msg); });
socket.on('dots_state',  (data)     => { roomState = data; applyState(data); });
socket.on('dots_move_made', (move)  => { applyMove(move); });

// ─── STATE HANDLER ───────────────────────────────────────────────
function applyState(data) {
  switch (data.phase) {
    case 'lobby':   showScreen('screen-lobby');   renderLobby(data);   break;
    case 'playing': showScreen('screen-playing'); renderPlaying(data); if(!window._gaGameStarted){_ga('game_started',{game:'dots',language:lang});window._gaGameStarted=true;} break;
    case 'final':   showScreen('screen-final');   renderFinal(data);   _ga('game_completed',{game:'dots',language:lang}); window._gaGameStarted=false; break;
  }
}

// ─── LOBBY ───────────────────────────────────────────────────────
function renderLobby(data) {
  const { players, settings, hostId } = data;
  const isHost = myId === hostId;
  const connected = players.filter(p => p.connected !== false);
  const togWrap = document.getElementById('visibility-toggle');
  if (togWrap) { togWrap.style.pointerEvents = isHost ? 'auto' : 'none'; togWrap.style.opacity = isHost ? '1' : '0.4'; }
  if (settings && settings.isPublic !== undefined) setVisibility(settings.isPublic);

  const el = document.getElementById('lobby-players');
  el.innerHTML = '';
  connected.forEach(p => {
    el.innerHTML +=
      '<div class="dots-lobby-player">' +
        '<div class="dots-color-swatch" style="background:' + p.color + '"></div>' +
        '<span style="font-weight:800;flex:1">' + p.name +
          (p.id === myId   ? ' <span class="you-badge">'  + L.youBadge  + '</span>' : '') +
          (p.id === hostId ? ' <span class="host-badge">' + L.hostBadge + '</span>' : '') +
        '</span>' +
      '</div>';
  });

  const warn = document.getElementById('player-warning');
  if (warn) {
    warn.style.display   = connected.length < 2 ? 'block' : 'none';
    warn.textContent     = L.needPlayers;
  }

  const gridSel = document.getElementById('settings-grid');
  const maxSel  = document.getElementById('settings-maxplayers');
  if (isHost) {
    if (gridSel) gridSel.value = settings.gridSize || 4;
    if (maxSel)  maxSel.value  = settings.maxPlayers || 4;
    gridSel.disabled = false; maxSel.disabled = false;
    document.getElementById('lobby-btn-row').style.display = 'flex';
    document.getElementById('waiting-msg').style.display   = 'none';
  } else {
    if (gridSel) { gridSel.value = settings.gridSize || 4; gridSel.disabled = true; }
    if (maxSel)  { maxSel.value  = settings.maxPlayers || 4; maxSel.disabled = true; }
    document.getElementById('lobby-btn-row').style.display = 'none';
    document.getElementById('waiting-msg').style.display   = 'block';
    document.getElementById('waiting-msg').textContent     = L.waitingForHost;
  }
}

// ─── PLAYING: RENDER ─────────────────────────────────────────────
function renderPlaying(data) {
  renderScoreboard(data);
  renderTurnBar(data);
  renderGrid(data);
}

function renderScoreboard(data) {
  const { players, currentPlayer } = data;
  const el = document.getElementById('dots-scoreboard');
  el.innerHTML = '';
  players.filter(p => p.connected !== false).forEach(p => {
    const isActive = p.id === currentPlayer;
    const card = document.createElement('div');
    card.className = 'dots-score-card' + (isActive ? ' active' : '');
    card.style.borderColor = isActive ? p.color : 'var(--border)';
    card.innerHTML =
      '<div class="dots-score-swatch" style="background:' + p.color + '"></div>' +
      '<span class="dots-score-name">' + p.name + (p.id === myId ? ' (' + L.youBadge + ')' : '') + '</span>' +
      '<span class="dots-score-pts" style="color:' + p.color + '">' + p.score + '</span>';
    el.appendChild(card);
  });
}

function renderTurnBar(data) {
  const { players, currentPlayer } = data;
  const el  = document.getElementById('dots-turn-bar');
  const cur = players.find(p => p.id === currentPlayer);
  if (!cur) return;
  const isMe = currentPlayer === myId;
  el.innerHTML =
    '<div class="dots-turn-dot" style="background:' + cur.color + '"></div>' +
    '<span style="color:' + cur.color + '">' + (isMe ? L.yourTurn : L.theirTurn(cur.name)) + '</span>';
}

function renderGrid(data) {
  const { grid, settings, players, currentPlayer } = data;
  const n    = settings.gridSize;
  const size = MARGIN * 2 + GAP * n;
  const svg  = document.getElementById('dots-svg');
  svg.setAttribute('width',  size);
  svg.setAttribute('height', size);
  svg.setAttribute('viewBox', '0 0 ' + size + ' ' + size);

  // Build player colour lookup
  const colorOf = {};
  players.forEach(p => colorOf[p.id] = p.color);

  // Clear and rebuild
  svg.innerHTML = '';
  const isMyTurn = currentPlayer === myId;

  // ── Filled boxes ──────────────────────────────────────────────
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const owner = grid.boxes[r][c];
      if (owner) {
        const x = MARGIN + c * GAP;
        const y = MARGIN + r * GAP;
        const rect = svgEl('rect', {
          x: x + 1, y: y + 1,
          width: GAP - 2, height: GAP - 2,
          fill: colorOf[owner] || '#888',
          opacity: '0.25',
          rx: '3',
        });
        svg.appendChild(rect);
        // Initial of player inside box
        const txt = svgEl('text', {
          x: x + GAP / 2, y: y + GAP / 2 + 5,
          'text-anchor': 'middle',
          fill: colorOf[owner] || '#888',
          'font-size': '14',
          'font-weight': '900',
          'font-family': 'Nunito, sans-serif',
          opacity: '0.7',
        });
        const p = players.find(pl => pl.id === owner);
        txt.textContent = p ? p.name.charAt(0).toUpperCase() : '?';
        svg.appendChild(txt);
      }
    }
  }

  // ── Claimed horizontal lines ───────────────────────────────────
  for (let r = 0; r <= n; r++) {
    for (let c = 0; c < n; c++) {
      const owner = grid.hLines[r][c];
      if (owner) {
        svg.appendChild(svgEl('line', {
          x1: MARGIN + c * GAP, y1: MARGIN + r * GAP,
          x2: MARGIN + (c+1)*GAP, y2: MARGIN + r * GAP,
          stroke: colorOf[owner] || '#888',
          'stroke-width': LINE_W,
          'stroke-linecap': 'round',
        }));
      }
    }
  }

  // ── Claimed vertical lines ─────────────────────────────────────
  for (let r = 0; r < n; r++) {
    for (let c = 0; c <= n; c++) {
      const owner = grid.vLines[r][c];
      if (owner) {
        svg.appendChild(svgEl('line', {
          x1: MARGIN + c * GAP, y1: MARGIN + r * GAP,
          x2: MARGIN + c * GAP, y2: MARGIN + (r+1)*GAP,
          stroke: colorOf[owner] || '#888',
          'stroke-width': LINE_W,
          'stroke-linecap': 'round',
        }));
      }
    }
  }

  // ── Hoverable unclaimed horizontal lines ──────────────────────
  if (isMyTurn) {
    for (let r = 0; r <= n; r++) {
      for (let c = 0; c < n; c++) {
        if (grid.hLines[r][c] !== null) continue;
        const hit = svgEl('line', {
          x1: MARGIN + c * GAP + DOT_R, y1: MARGIN + r * GAP,
          x2: MARGIN + (c+1)*GAP - DOT_R, y2: MARGIN + r * GAP,
          stroke: 'transparent',
          'stroke-width': 20,
          class: 'dots-line-hover',
        });
        const preview = svgEl('line', {
          x1: MARGIN + c * GAP + DOT_R, y1: MARGIN + r * GAP,
          x2: MARGIN + (c+1)*GAP - DOT_R, y2: MARGIN + r * GAP,
          stroke: 'var(--border)',
          'stroke-width': HOVER_W,
          'stroke-linecap': 'round',
          'stroke-dasharray': '4 4',
          opacity: '0.4',
          'pointer-events': 'none',
        });
        svg.appendChild(preview);
        (function(row, col, prev) {
          hit.addEventListener('mouseenter', () => {
            prev.setAttribute('stroke', 'var(--accent)');
            prev.setAttribute('opacity', '0.8');
            prev.setAttribute('stroke-dasharray', 'none');
          });
          hit.addEventListener('mouseleave', () => {
            prev.setAttribute('stroke', 'var(--border)');
            prev.setAttribute('opacity', '0.4');
            prev.setAttribute('stroke-dasharray', '4 4');
          });
          hit.addEventListener('click',      () => makeMove('h', row, col));
          hit.addEventListener('touchstart', (e) => { e.preventDefault(); makeMove('h', row, col); }, { passive: false });
        })(r, c, preview);
        svg.appendChild(hit);
      }
    }

    // ── Hoverable unclaimed vertical lines ────────────────────────
    for (let r = 0; r < n; r++) {
      for (let c = 0; c <= n; c++) {
        if (grid.vLines[r][c] !== null) continue;
        const hit = svgEl('line', {
          x1: MARGIN + c * GAP, y1: MARGIN + r * GAP + DOT_R,
          x2: MARGIN + c * GAP, y2: MARGIN + (r+1)*GAP - DOT_R,
          stroke: 'transparent',
          'stroke-width': 20,
          class: 'dots-line-hover',
        });
        const preview = svgEl('line', {
          x1: MARGIN + c * GAP, y1: MARGIN + r * GAP + DOT_R,
          x2: MARGIN + c * GAP, y2: MARGIN + (r+1)*GAP - DOT_R,
          stroke: 'var(--border)',
          'stroke-width': HOVER_W,
          'stroke-linecap': 'round',
          'stroke-dasharray': '4 4',
          opacity: '0.4',
          'pointer-events': 'none',
        });
        svg.appendChild(preview);
        (function(row, col, prev) {
          hit.addEventListener('mouseenter', () => {
            prev.setAttribute('stroke', 'var(--accent)');
            prev.setAttribute('opacity', '0.8');
            prev.setAttribute('stroke-dasharray', 'none');
          });
          hit.addEventListener('mouseleave', () => {
            prev.setAttribute('stroke', 'var(--border)');
            prev.setAttribute('opacity', '0.4');
            prev.setAttribute('stroke-dasharray', '4 4');
          });
          hit.addEventListener('click',      () => makeMove('v', row, col));
          hit.addEventListener('touchstart', (e) => { e.preventDefault(); makeMove('v', row, col); }, { passive: false });
        })(r, c, preview);
        svg.appendChild(hit);
      }
    }
  } else {
    // Not my turn — show faint dashed lines but not interactive
    for (let r = 0; r <= n; r++) {
      for (let c = 0; c < n; c++) {
        if (grid.hLines[r][c] !== null) continue;
        svg.appendChild(svgEl('line', {
          x1: MARGIN + c * GAP + DOT_R, y1: MARGIN + r * GAP,
          x2: MARGIN + (c+1)*GAP - DOT_R, y2: MARGIN + r * GAP,
          stroke: 'var(--border)', 'stroke-width': '2',
          'stroke-dasharray': '3 5', opacity: '0.25', 'pointer-events': 'none',
        }));
      }
    }
    for (let r = 0; r < n; r++) {
      for (let c = 0; c <= n; c++) {
        if (grid.vLines[r][c] !== null) continue;
        svg.appendChild(svgEl('line', {
          x1: MARGIN + c * GAP, y1: MARGIN + r * GAP + DOT_R,
          x2: MARGIN + c * GAP, y2: MARGIN + (r+1)*GAP - DOT_R,
          stroke: 'var(--border)', 'stroke-width': '2',
          'stroke-dasharray': '3 5', opacity: '0.25', 'pointer-events': 'none',
        }));
      }
    }
  }

  // ── Dots (drawn last so they sit on top) ──────────────────────
  for (let r = 0; r <= n; r++) {
    for (let c = 0; c <= n; c++) {
      svg.appendChild(svgEl('circle', {
        cx: MARGIN + c * GAP, cy: MARGIN + r * GAP,
        r: DOT_R,
        fill: 'var(--text)',
      }));
    }
  }
}

// ── Apply a move optimistically (server confirms via dots_state) ──
function applyMove(move) {
  // Just re-render from roomState when server sends dots_state
  // This is called alongside dots_state so we don't need to do anything here
}

// ─── FINAL SCREEN ────────────────────────────────────────────────
function renderFinal(data) {
  const { players, hostId } = data;
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const maxScore = sorted[0] ? sorted[0].score : 0;
  const winners  = sorted.filter(p => p.score === maxScore);
  const isDraw   = winners.length > 1;

  document.getElementById('lbl-game-over').textContent = L.gameOver;

  const heading = isDraw
    ? L.draw
    : L.winner(winners[0].name);

  const el = document.getElementById('final-results');
  el.innerHTML = '<div style="text-align:center;font-size:22px;font-weight:900;margin-bottom:20px;color:var(--accent2)">' + heading + '</div>';

  sorted.forEach((p, i) => {
    const isWinner = p.score === maxScore && !isDraw;
    el.innerHTML +=
      '<div class="dots-final-row' + (isWinner ? ' winner' : '') + '" style="border-color:' + p.color + '">' +
        '<div class="dots-final-name">' +
          '<div class="dots-color-swatch" style="background:' + p.color + ';width:18px;height:18px;border-radius:4px;"></div>' +
          (i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i+1)+'.') + ' ' +
          p.name + (p.id === myId ? ' (' + L.youBadge + ')' : '') +
        '</div>' +
        '<div class="dots-final-pts" style="color:' + p.color + '">' + p.score + ' <span style="font-size:14px;font-family:Nunito">' + L.boxes + '</span></div>' +
      '</div>';
  });

  const rematchBtn = document.getElementById('lbl-rematch');
  if (rematchBtn) {
    rematchBtn.style.display = myId === hostId ? 'inline-flex' : 'none';
    rematchBtn.textContent   = L.rematch;
  }
  document.getElementById('lbl-new-game').textContent = L.newGame;
}

// ─── ACTIONS ─────────────────────────────────────────────────────
function makeMove(type, row, col) {
  socket.emit('dots_move', { code: roomCode, type, row, col });
}

function createRoom() {
  const name = document.getElementById('host-name').value.trim();
  if (!name) { showError(lang === 'pl' ? 'Wpisz swoje imię!' : 'Enter your name!'); return; }
  myName = name;
  socket.emit('dots_create', { name, settings: { gridSize: 4, maxPlayers: 4, isPublic: getIsPublic() } });
}

function joinRoom() {
  const name = document.getElementById('join-name').value.trim();
  const code = document.getElementById('join-code').value.trim().toUpperCase();
  if (!name) { showError(lang === 'pl' ? 'Wpisz swoje imię!' : 'Enter your name!'); return; }
  if (!code || code.length < 5) { showError(lang === 'pl' ? 'Wpisz kod pokoju!' : 'Enter the room code!'); return; }
  myName = name;
  socket.emit('dots_join', { name, code });
}

function startGame() { socket.emit('dots_start', { code: roomCode }); }
function rematch()   { socket.emit('dots_rematch', { code: roomCode }); }

function updateSettings() {
  const gridSize  = parseInt(document.getElementById('settings-grid').value);
  const maxPlayers = parseInt(document.getElementById('settings-maxplayers').value);
  socket.emit('dots_update_settings', { code: roomCode, settings: { gridSize, maxPlayers, isPublic: getIsPublic() } });
}


function goHome() {
  roomCode = ''; roomState = null; myName = '';
  sessionStorage.removeItem('dots_code');
  sessionStorage.removeItem('dots_name');
  showScreen('screen-home');
}

function doGoHome()     { closeConfirm(); goHome(); }

// ─── LANG BAR ────────────────────────────────────────────────────

function setUiLang(code) {
  lang = code; L = LANGS[code] || LANGS['en'];
  document.querySelectorAll('.lang-btn').forEach(b =>
    b.classList.toggle('active', b.textContent === LANGS[code].name));
  applyTranslations();
  if (roomState) applyState(roomState);
  history.replaceState(null, '', window.location.pathname + '?lang=' + code);
}

function applyTranslations() {
  const map = {
    'game-title':       'gameTitle',   'game-subtitle':    'subtitle',
    'lbl-create-room':  'createRoom',  'lbl-create-disclaimer': 'createDisclaimer',  'lbl-join-room':    'joinRoom',
    'lbl-your-name':    'yourName',    'lbl-join-name':    'joinName',
    'lbl-room-code':    'roomCode',    'lbl-create-btn':   'createBtn',
    'lbl-join-btn':     'joinBtn',     'lbl-settings':     'settings',
    'lbl-grid-size':    'gridSize',    'lbl-max-players':  'maxPlayers',
    'lbl-players-title':'playersTitle','lbl-start-btn':    'startBtn',
    'lbl-leave-room':   'leaveRoom',   'lbl-share-code':   'shareCode',
    'lbl-copy-code':    'copyCode',    'lbl-how-to-play':  'howToPlay',
    'lbl-rule-1':       'rule1',       'lbl-rule-2':       'rule2',
    'lbl-rule-3':       'rule3',       'lbl-rule-4':       'rule4',
    'lbl-rematch':      'rematch',     'lbl-new-game':     'newGame',
    'lbl-game-over':    'gameOver',
  };
  for (const [id, key] of Object.entries(map)) {
    const el = document.getElementById(id);
    if (el && L[key] && typeof L[key] === 'string') el.textContent = L[key];
  }
}

// ─── SVG HELPER ──────────────────────────────────────────────────
function svgEl(tag, attrs) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}



// ─── INIT ────────────────────────────────────────────────────────
buildLangBar();
applyTranslations();
initVisibilityToggle();
prefillJoinCode();
