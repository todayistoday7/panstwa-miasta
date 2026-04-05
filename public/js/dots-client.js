// ═══════════════════════════════════════════════════════
// DOTS AND BOXES — Client
// ═══════════════════════════════════════════════════════
'use strict';

const socket = io();
const _urlLang = new URLSearchParams(window.location.search).get('lang');
let lang     = (['pl','en'].includes(_urlLang) ? _urlLang : 'en');
let myId     = null;
let myName   = '';
window._gameSlug = 'dots';
var _settingsInitDots = false;
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
    rejoinTip:    'Jeśli przypadkowo opuścisz grę, wróć z tym samym imieniem i kodem pokoju.',
    playersTitle: 'Gracze',
    startBtn:     '🎮 Rozpocznij',  leaveRoom:   '🚪 Wyjdź',
    shareCode:    'Udostępnij kod znajomym',
    shareRoom:    'Udostępnij pokój',
    demoCaption:  'Kliknij na linię między kropkami żeby ją narysować',
    homeRejoinTip:'Jeśli przypadkowo opuścisz grę, wróć z tym samym imieniem i kodem pokoju.',
    copyCode:     'Skopiuj kod',
    createDisclaimer: 'Stwórz pokój otwarty lub prywatny. Zaproś znajomych — otrzymasz kod pokoju, który przekażesz innym graczom.',
    waitingForHost: 'Czekam na hosta...',
    needPlayers:  'Potrzeba minimum 2 graczy',
    roundsLabel:  'Rundy',
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
    youBadge:     'TY ·',
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
    rejoinTip:    'If you accidentally leave, rejoin using the same name and room code.',
    playersTitle: 'Players',
    startBtn:     '🎮 Start Game',  leaveRoom:   '🚪 Leave Room',
    shareCode:    'Share this code with friends',
    shareRoom:    'Share Room',
    demoCaption:  'Tap on a line between two dots to draw it',
    homeRejoinTip:'If you accidentally leave mid-game, rejoin with the same name and room code.',
    copyCode:     'Copy Code',
    createDisclaimer: 'Create a public or private room. Invite friends — you\'ll get a room code to share with other players.',
    waitingForHost: 'Waiting for host...',
    needPlayers:  'Need at least 2 players',
    roundsLabel:  'Rounds',
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
    youBadge:     'YOU ·',
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
const MARGIN  = 16;    // px margin around grid
// GAP is calculated dynamically in renderGrid to fit screen
const BASE_GAP = 64;   // base gap — scales down on small screens
const LINE_W  = 6;     // claimed line stroke width
const HOVER_W = 4;     // hover line stroke width


// ─── HOME SCREEN DEMO ANIMATION ──────────────────────────────────
function runDemoAnimation() {
  var line   = document.getElementById('demo-line');
  var box    = document.getElementById('demo-box');
  var finger = document.getElementById('demo-finger');
  var label  = document.getElementById('demo-label');
  if (!line) return;

  var step = 0;
  function next() {
    // Reset
    if (step === 0) {
      line.style.transition   = 'none';
      line.setAttribute('stroke-dashoffset', '70');
      line.setAttribute('opacity', '0');
      box.setAttribute('opacity', '0');
      finger.setAttribute('opacity', '0');
      if (label) { label.textContent = ''; label.setAttribute('opacity','0'); }
      setTimeout(function() { step = 1; next(); }, 600);
      return;
    }
    // Finger appears near the line
    if (step === 1) {
      finger.setAttribute('opacity', '1');
      finger.setAttribute('x', '118'); finger.setAttribute('y', '55');
      setTimeout(function() { step = 2; next(); }, 700);
      return;
    }
    // Line draws in
    if (step === 2) {
      line.setAttribute('opacity', '1');
      line.style.transition = 'stroke-dashoffset 0.5s ease';
      line.setAttribute('stroke-dashoffset', '0');
      setTimeout(function() { step = 3; next(); }, 700);
      return;
    }
    // Finger disappears, box fills
    if (step === 3) {
      finger.setAttribute('opacity', '0');
      box.style.transition = 'opacity 0.35s ease';
      box.setAttribute('opacity', '0.25');
      if (label) {
        label.setAttribute('opacity','1');
        label.textContent = lang === 'pl' ? '🎉 Pole zdobyte!' : '🎉 Box claimed!';
      }
      setTimeout(function() { step = 0; next(); }, 2200);
      return;
    }
  }
  next();
  return setInterval(function() {}, 99999); // keep alive reference
}

// Start demo when home screen is visible
var _demoStarted = false;
function maybeStartDemo() {
  if (!_demoStarted && document.getElementById('demo-line')) {
    _demoStarted = true;
    runDemoAnimation();
  }
}

// ─── FIRST-MOVE HINT ─────────────────────────────────────────────
var _hintShown = false;
function showFirstMoveHint() {
  var hint = document.getElementById('first-move-hint');
  if (!hint) return;
  if (localStorage.getItem('dots_played')) return;
  var title = document.getElementById('hint-title');
  var body  = document.getElementById('hint-body');
  if (title) title.textContent = lang === 'pl' ? 'Twoja kolej!' : 'Your Turn!';
  if (body)  body.textContent  = lang === 'pl'
    ? 'Kliknij na linię między kropkami żeby ją narysować'
    : 'Tap on a line between two dots to draw it';
  hint.style.pointerEvents = 'auto'; // allow X button click
  hint.style.display = 'block';
  _hintShown = true;
  // Auto-dismiss after 4 seconds — no need to tap it
  clearTimeout(window._hintTimer);
  window._hintTimer = setTimeout(function() {
    hint.style.display = 'none';
    localStorage.setItem('dots_played', '1');
  }, 4000);
}

function hideFirstMoveHint() {
  var hint = document.getElementById('first-move-hint');
  if (hint) hint.style.display = 'none';
}
// ─── SOCKET EVENTS ───────────────────────────────────────────────
socket.on('connect', () => {
  const prevId = myId;
  myId = socket.id;
  clearInterval(keepAliveInterval);
  keepAliveInterval = setInterval(() => {
    if (roomCode) socket.emit('dots_keep_alive');
  }, 20000);

  // Only attempt rejoin if this is a REconnect (we had a previous socket id)
  // and we actually have a saved room. Never clear roomCode — it breaks the game.
  if (prevId && prevId !== socket.id) {
    const savedCode = sessionStorage.getItem('dots_code');
    const savedName = sessionStorage.getItem('dots_name');
    if (savedCode && savedName) {
      socket.emit('dots_rejoin', { code: savedCode, name: savedName });
    }
  }
});

socket.on('dots_room_created', ({ code }) => {
  _settingsInitDots = false;
  _ga('room_created', { game:'dots', language:lang });
  roomCode = code; roomState = null;
  sessionStorage.setItem('dots_code', code);
  sessionStorage.setItem('dots_name', myName);
  document.getElementById('room-code-display').textContent = code;
  showScreen('screen-lobby');
  var rt=document.getElementById('rejoin-tip'); if(rt) rt.style.display='block';
});

socket.on('dots_room_joined', ({ code }) => {
  _settingsInitDots = false;
  _ga('room_joined', { game:'dots', language:lang });
  roomCode = code; roomState = null;
  sessionStorage.setItem('dots_code', code);
  sessionStorage.setItem('dots_name', myName);
  document.getElementById('room-code-display').textContent = code;
  showScreen('screen-lobby');
  var rt=document.getElementById('rejoin-tip'); if(rt) rt.style.display='block';
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
  // Show rejoin tip with correct translation
  var rejoinTip = document.getElementById('rejoin-tip');
  var rejoinLbl = document.getElementById('lbl-rejoin-tip');
  if (rejoinTip) rejoinTip.style.display = 'block';
  if (rejoinLbl && L.rejoinTip) rejoinLbl.textContent = L.rejoinTip;

  const togWrap = document.getElementById('visibility-toggle');
  if (togWrap) { togWrap.style.pointerEvents = isHost ? 'auto' : 'none'; togWrap.style.opacity = isHost ? '1' : '0.4'; }
  // Only sync visibility on first load — host owns it after that
  // Don't call setVisibility() here as it triggers updateSettings()
  if (!_settingsInitDots && settings && settings.isPublic !== undefined) {
    _isPublic = !!settings.isPublic;
    var _vPriv = document.getElementById('vis-private');
    var _vPub  = document.getElementById('vis-public');
    if (_vPriv) _vPriv.classList.toggle('active', !_isPublic);
    if (_vPub)  _vPub.classList.toggle('active',   _isPublic);
  }

  const el = document.getElementById('lobby-players');
  el.innerHTML = '';
  players.forEach((p, i) => {
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

  const warn = document.getElementById('player-warning');
  if (warn) {
    warn.style.display   = connected.length < 2 ? 'block' : 'none';
    warn.textContent     = L.needPlayers;
  }

  const gridSel = document.getElementById('settings-grid');
  const maxSel  = document.getElementById('settings-maxplayers');
  if (isHost) {
    // Init selects once from server — host owns them after that
    if (!_settingsInitDots) {
      if (gridSel) gridSel.value = settings.gridSize || 4;
      if (maxSel)  maxSel.value  = settings.maxPlayers || 4;
      const roundsSel = document.getElementById('settings-rounds');
      if (roundsSel) roundsSel.value = settings.totalRounds || 1;
      _settingsInitDots = true;
    }
    if (gridSel) gridSel.disabled = false;
    if (maxSel)  maxSel.disabled  = false;
    document.getElementById('lobby-btn-row').style.display = 'flex';
    document.getElementById('waiting-msg').style.display   = 'none';
    // Show round progress if mid-game (returning between rounds)
    var roundBadge = document.getElementById('dots-round-badge');
    var totalRounds = (settings && settings.totalRounds) || 1;
    var roundsAccum = data.totalRoundsAccum || 0;
    var isBetweenRounds = roundsAccum > 0 && roundsAccum < totalRounds;
    if (roundBadge) {
      if (totalRounds > 1) {
        roundBadge.style.display = 'block';
        roundBadge.textContent = (lang === 'pl' ? 'Runda ' : 'Round ') +
          (roundsAccum + 1) + ' / ' + totalRounds;
      } else {
        roundBadge.style.display = 'none';
      }
    }
    // Between rounds: hide settings, show just "Start Next Round"
    var settingsCard = document.getElementById('lobby-settings-card');
    var startBtn = document.getElementById('lobby-start-btn');
    if (isBetweenRounds) {
      if (settingsCard) settingsCard.style.display = 'none';
      if (startBtn) startBtn.textContent = lang === 'pl'
        ? '▶ Następna runda' : lang === 'de' ? '▶ Nächste Runde' : '▶ Next Round';
    } else {
      if (settingsCard) settingsCard.style.display = 'block';
      if (startBtn) startBtn.textContent = L.startBtn || '▶ Start Game';
    }
  } else {
    // Non-host: always sync settings from server (read-only)
    if (gridSel) { gridSel.value = settings.gridSize || 4; gridSel.disabled = true; }
    if (maxSel)  { maxSel.value  = settings.maxPlayers || 4; maxSel.disabled = true; }
    const roundsSelNH = document.getElementById('settings-rounds');
    if (roundsSelNH) { roundsSelNH.value = settings.totalRounds || 1; roundsSelNH.disabled = true; }
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
  // Show first-move hint on first ever turn
  if (currentPlayer === myId && !localStorage.getItem('dots_played')) {
    showFirstMoveHint();
  } else {
    hideFirstMoveHint();
  }
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
  // Calculate GAP to fit within screen width
  const wrap = document.getElementById('dots-svg-wrap') || document.getElementById('dots-svg');
  const availableWidth = wrap ? (wrap.clientWidth || wrap.offsetWidth || 320) : 320;
  const maxSize = Math.min(availableWidth, window.innerWidth - 32, 480);
  const GAP = Math.floor(Math.min(BASE_GAP, (maxSize - MARGIN * 2) / n));
  const size = MARGIN * 2 + GAP * n;
  const svg  = document.getElementById('dots-svg');
  // My color for hover preview
  const _meP = players.find(p => p.id === myId);
  var myColor = _meP ? _meP.color : null;
  svg.setAttribute('width',  size);
  svg.setAttribute('height', size);
  svg.setAttribute('viewBox', '0 0 ' + size + ' ' + size);
  svg.style.maxWidth = '100%';

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
            prev.setAttribute('stroke', myColor || 'var(--accent)');
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
            prev.setAttribute('stroke', myColor || 'var(--accent)');
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
function rematch() {
  _settingsInitDots = false; // reset so settings re-init on next lobby
  socket.emit('dots_rematch', { code: roomCode });
}

function updateSettings() {
  const gridSize    = parseInt(document.getElementById('settings-grid').value);
  const maxPlayers  = parseInt(document.getElementById('settings-maxplayers').value);
  const roundsSel   = document.getElementById('settings-rounds');
  const totalRounds = roundsSel ? parseInt(roundsSel.value) : 1;
  socket.emit('dots_update_settings', { code: roomCode, settings: { gridSize, maxPlayers, totalRounds, isPublic: getIsPublic() } });
}


function goHome() {
  roomCode = ''; roomState = null; myName = '';
  _demoStarted = false; // allow demo to restart
  sessionStorage.removeItem('dots_code');
  sessionStorage.removeItem('dots_name');
  showScreen('screen-home');
  maybeStartDemo();
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
  if (typeof window._rebuildBurger === 'function') window._rebuildBurger(code);
  if (typeof window._refreshFooter  === 'function') window._refreshFooter();
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
    'lbl-nav-home':         'navHome',
    'lbl-nav-all-games':    'navAllGames',
    'lbl-rule-1':       'rule1',       'lbl-rule-2':       'rule2',
    'lbl-rule-3':       'rule3',       'lbl-rule-4':       'rule4',
    'lbl-lobby-how-to-play':'howToPlay',
    'lbl-lobby-rule-1':'rule1',
    'lbl-lobby-rule-2':'rule2',
    'lbl-lobby-rule-3':'rule3',
    'lbl-lobby-rule-4':'rule4',
    'lbl-rematch':      'rematch',     'lbl-new-game':     'newGame',
    'lbl-game-over':    'gameOver',     'lbl-share-room':   'shareRoom',
    'lbl-rounds-label': 'roundsLabel',
    'lbl-demo-caption': 'demoCaption',  'lbl-home-rejoin-tip': 'homeRejoinTip',
    'lbl-rejoin-tip':   'rejoinTip',
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

// Start demo animation on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', maybeStartDemo);
} else {
  maybeStartDemo();
}
