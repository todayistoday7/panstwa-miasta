// ═══════════════════════════════════════════════════════
// WAVELENGTH CLIENT
// ═══════════════════════════════════════════════════════
'use strict';

const socket = io();
let lang      = 'en';
let myId      = null;
let myName    = '';
let roomCode  = '';
let roomState = null;
let myGuess   = null;   // current dial position (0–100) set by this player
let keepAliveInterval = null;

// Dial geometry
const CX = 200, CY = 200, R = 170;  // centre x, centre y, radius
const ANGLE_START = Math.PI;         // 180° = left end
const ANGLE_END   = 0;               // 0°   = right end
// Score zone boundaries (distance from target, 0–100 scale)
const ZONES = [
  { maxDist:  5, pts: 4, color: '#ffd166' }, // bullseye
  { maxDist: 12, pts: 3, color: '#06d6a0' }, // close
  { maxDist: 22, pts: 2, color: '#4dabf7' }, // near
  { maxDist: 35, pts: 1, color: '#a7a9be' }, // outer
];

// ─── TRANSLATIONS ────────────────────────────────────────────────
const LANGS = {
  pl: {
    name: '🇵🇱 PL',
    gameTitle:      'WAVELENGTH',
    subtitle:       'Gra ze spektrum · 3-10 graczy',
    createRoom:     'Stwórz pokój',   joinRoom:      'Dołącz do pokoju',
    yourName:       'Twoje imię',     joinName:      'Twoje imię',
    roomCode:       'Kod pokoju',     createBtn:     'Stwórz pokój',
    joinBtn:        'Dołącz',         settings:      'Ustawienia',
    roundsTitle:    'Rundy',          langTitle:     'Język',
    playersTitle:   'Gracze',
    startBtn:       '🎮 Rozpocznij',  leaveRoom:     '🚪 Wyjdź',
    shareCode:      'Udostępnij kod', copyCode:      'Skopiuj kod',
    waitingForHost: 'Czekam na hosta...',
    needPlayers:    'Potrzeba min. 3 graczy',
    howToPlay:      'Zasady gry',
    rule1:          'Stwórz pokój, udostępnij kod — 3 do 10 graczy',
    rule2:          'Każda runda jeden gracz jest Psychikiem — widzi cel na spektrum',
    rule3:          'Psychik podaje JEDNO słowo wskazówkę',
    rule4:          'Pozostali ustawiają tarczę na swoje przypuszczenie',
    rule5:          'Bullseye = 4pkt · Blisko = 3pkt · Niedaleko = 2pkt · Outer = 1pkt',
    psychicRole:    '🔮 JESTEŚ PSYCHIKIEM',
    guesserRole:    '🎯 ZGADUJ',
    psychicThinking:'🔮 Psychik myśli...',
    clueHint:       'Wpisz JEDNO słowo wskazówkę:',
    clueWaiting:    'Czekam na wskazówkę Psychika...',
    clueLabel:      'WSKAZÓWKA:',
    submitClue:     'Wyślij',
    revealBtn:      '👁 Odkryj wyniki',
    nextRound:      'Następna runda →',
    waitingNext:    'Czekam na hosta...',
    guessedCount:   (n, t) => `${n} z ${t} graczy zagłosowało`,
    moveYourDial:   'Przesuń wskazówkę na swoje przypuszczenie',
    round:          'RUNDA',
    of:             'Z',
    gameOver:       'Koniec gry!',
    winner:         (n) => `🏆 ${n} wygrywa!`,
    draw:           'Remis! 🤝',
    pts:            'pkt',
    playAgain:      '🔄 Zagraj jeszcze raz',
    goHome:         '🏠 Powrót',
    hostBadge:      'HOST',
    youBadge:       'TY',
    leaveTitle:     'Opuścić grę?',
    leaveMsg:       'Gra jest w toku. Na pewno chcesz wyjść?',
    confirmLeave:   'Na pewno chcesz opuścić pokój?',
    leaveYes:       'Tak, wyjdź',
    leaveNo:        'Anuluj',
    psychicTurn:    (n) => `🔮 ${n} jest Psychikiem`,
    yourTurnPsychic:'🔮 Twoja kolej — jesteś Psychikiem!',
    pointsLabel:    'punktów',
  },
  en: {
    name: '🇬🇧 EN',
    gameTitle:      'WAVELENGTH',
    subtitle:       'Spectrum guessing game · 3-10 players',
    createRoom:     'Create Room',    joinRoom:      'Join Room',
    yourName:       'Your name',      joinName:      'Your name',
    roomCode:       'Room code',      createBtn:     'Create Room',
    joinBtn:        'Join Room',      settings:      'Settings',
    roundsTitle:    'Rounds',         langTitle:     'Language',
    playersTitle:   'Players',
    startBtn:       '🎮 Start Game',  leaveRoom:     '🚪 Leave Room',
    shareCode:      'Share this code with friends',
    copyCode:       'Copy Code',
    waitingForHost: 'Waiting for host...',
    needPlayers:    'Need at least 3 players',
    howToPlay:      'How to play',
    rule1:          'Create a room, share the code — 3 to 10 players',
    rule2:          'Each round one player is the Psychic — they see where the target is',
    rule3:          'The Psychic gives ONE word as a clue',
    rule4:          'Everyone else moves the dial to their best guess',
    rule5:          'Bullseye = 4pts · Close = 3pts · Near = 2pts · Outer = 1pt',
    psychicRole:    '🔮 YOU ARE THE PSYCHIC',
    guesserRole:    '🎯 GUESS THE POSITION',
    psychicThinking:'🔮 Psychic is thinking...',
    clueHint:       'Type ONE word as your clue:',
    clueWaiting:    'Waiting for the Psychic\'s clue...',
    clueLabel:      'CLUE:',
    submitClue:     'Send',
    revealBtn:      '👁 Reveal',
    nextRound:      'Next Round →',
    waitingNext:    'Waiting for host...',
    guessedCount:   (n, t) => `${n} of ${t} players guessed`,
    moveYourDial:   'Move the dial to your best guess',
    round:          'ROUND',
    of:             'OF',
    gameOver:       'Game Over!',
    winner:         (n) => `🏆 ${n} wins!`,
    draw:           "It's a draw! 🤝",
    pts:            'pts',
    playAgain:      '🔄 Play Again',
    goHome:         '🏠 Home',
    hostBadge:      'HOST',
    youBadge:       'YOU',
    leaveTitle:     'Leave Game?',
    leaveMsg:       'A game is in progress. Are you sure?',
    confirmLeave:   'Are you sure you want to leave the room?',
    leaveYes:       'Yes, leave',
    leaveNo:        'Cancel',
    psychicTurn:    (n) => `🔮 ${n} is the Psychic`,
    yourTurnPsychic:'🔮 Your turn — you are the Psychic!',
    pointsLabel:    'points',
  },
};
let L = LANGS[lang];

// ─── SOCKET EVENTS ───────────────────────────────────────────────
socket.on('connect', () => {
  myId = socket.id;
  clearInterval(keepAliveInterval);
  keepAliveInterval = setInterval(() => {
    if (roomCode) socket.emit('wave_keep_alive');
  }, 20000);
  const sc = sessionStorage.getItem('wave_code');
  const sn = sessionStorage.getItem('wave_name');
  if (sc && sn && !roomCode) {
    roomCode = sc; myName = sn;
    socket.emit('wave_rejoin', { code: sc, name: sn });
  }
});

socket.on('wave_room_created', ({ code }) => {
  roomCode = code; roomState = null; myGuess = null;
  sessionStorage.setItem('wave_code', code);
  sessionStorage.setItem('wave_name', myName);
  document.getElementById('room-code-display').textContent = code;
  showScreen('screen-lobby');
});

socket.on('wave_room_joined', ({ code }) => {
  roomCode = code; roomState = null; myGuess = null;
  sessionStorage.setItem('wave_code', code);
  sessionStorage.setItem('wave_name', myName);
  document.getElementById('room-code-display').textContent = code;
  showScreen('screen-lobby');
});

socket.on('wave_error', ({ msg }) => { showError(msg); });

socket.on('wave_state', (data) => {
  const prevPhase = roomState ? roomState.phase : null;
  roomState = data;
  // Reset guess when new round starts
  if (data.phase === 'psychic' && prevPhase !== 'psychic') myGuess = null;
  applyState(data);
});

socket.on('wave_your_guess', ({ value }) => {
  myGuess = value;
  // Re-render dial to show own marker
  if (roomState) renderDial(roomState);
});

socket.on('wave_guess_count', ({ count, hasGuessed }) => {
  renderGuessPips(count, hasGuessed);
  // Auto-reveal check is done server-side if host enables it
});

// ─── STATE HANDLER ───────────────────────────────────────────────
function applyState(data) {
  switch (data.phase) {
    case 'lobby':    showScreen('screen-lobby');   renderLobby(data);   break;
    case 'psychic':  showScreen('screen-playing'); renderGame(data);    break;
    case 'guessing': showScreen('screen-playing'); renderGame(data);    break;
    case 'reveal':   showScreen('screen-playing'); renderGame(data);    break;
    case 'final':    showScreen('screen-final');   renderFinal(data);   break;
  }
}

// ─── LOBBY ───────────────────────────────────────────────────────
function renderLobby(data) {
  const { players, settings, hostId } = data;
  const isHost    = myId === hostId;
  const connected = players.filter(p => p.connected !== false);

  const el = document.getElementById('lobby-players');
  el.innerHTML = '';
  connected.forEach(p => {
    el.innerHTML +=
      '<div class="lobby-player">' +
        '<div class="avatar av-' + (connected.indexOf(p) % 8) + '">' + p.name.charAt(0).toUpperCase() + '</div>' +
        '<span class="pname">' + p.name +
          (p.id === myId   ? ' <span style="font-size:11px;background:rgba(6,214,160,0.15);border:1px solid rgba(6,214,160,0.4);color:var(--green);border-radius:20px;padding:2px 8px;">' + L.youBadge + '</span>' : '') +
          (p.id === hostId ? ' <span class="host-badge">' + L.hostBadge + '</span>' : '') +
        '</span>' +
      '</div>';
  });

  const warn = document.getElementById('player-warning');
  if (warn) { warn.style.display = connected.length < 3 ? 'block' : 'none'; warn.textContent = L.needPlayers; }

  const roundsSel = document.getElementById('settings-rounds');
  if (roundsSel) roundsSel.value = settings.totalRounds || 8;

  const pillsEl = document.getElementById('lobby-lang-pills');
  if (pillsEl) {
    pillsEl.innerHTML = '';
    Object.keys(LANGS).forEach(code => {
      pillsEl.innerHTML += '<div class="lang-pill' + (code === settings.lang ? ' active' : '') + '"' +
        (isHost ? ' onclick="setGameLang(\'' + code + '\')"' : '') + '>' + LANGS[code].name + '</div>';
    });
  }

  if (isHost) {
    document.getElementById('lobby-btn-row').style.display = 'flex';
    document.getElementById('waiting-msg').style.display   = 'none';
  } else {
    document.getElementById('lobby-btn-row').style.display = 'none';
    document.getElementById('waiting-msg').style.display   = 'block';
    document.getElementById('waiting-msg').textContent     = L.waitingForHost;
  }
}

// ─── GAME SCREEN ─────────────────────────────────────────────────
function renderGame(data) {
  const { phase, round, totalRounds, players, psychicId, currentCard, cardIndex,
          clue, guesses, roundScores, totalScores, hasGuessed, target } = data;

  const isPsychic = myId === psychicId;
  const isHost    = myId === data.hostId;
  const connected = players.filter(p => p.connected !== false);

  // Round badge
  document.getElementById('wave-round-badge').textContent =
    L.round + ' ' + round + ' ' + L.of + ' ' + totalRounds;

  // Scoreboard
  renderScoreboard(players, totalScores, psychicId);

  // Role banner
  const banner = document.getElementById('wave-role-banner');
  if (isPsychic) {
    banner.textContent  = L.yourTurnPsychic;
    banner.className    = 'wave-role-banner psychic';
  } else if (phase === 'psychic') {
    const pName = (players.find(p => p.id === psychicId) || {}).name || '?';
    banner.textContent = L.psychicTurn(pName);
    banner.className   = 'wave-role-banner';
  } else {
    banner.textContent = L.guesserRole;
    banner.className   = 'wave-role-banner guesser';
  }

  // Spectrum card — resolved from WAVE_CARDS using cardIndex + settings lang
  const cardLang = (data.settings && data.settings.lang) || lang;
  const cards    = WAVE_CARDS[cardLang] || WAVE_CARDS['en'];
  const card     = (cardIndex !== undefined && cards[cardIndex]) ? cards[cardIndex] : { left: '?', right: '?' };
  document.getElementById('wave-left').textContent  = card.left;
  document.getElementById('wave-right').textContent = card.right;

  // Clue area
  const clueHintEl   = document.getElementById('wave-clue-hint');
  const clueDisplay  = document.getElementById('wave-clue-display');
  const clueInputWrap= document.getElementById('wave-clue-input-wrap');

  if (phase === 'psychic') {
    if (isPsychic) {
      clueHintEl.textContent    = L.clueHint;
      clueDisplay.textContent   = '';
      clueInputWrap.style.display = 'flex';
    } else {
      clueHintEl.textContent    = L.clueWaiting;
      clueDisplay.textContent   = '';
      clueInputWrap.style.display = 'none';
    }
  } else {
    clueHintEl.textContent    = L.clueLabel;
    clueDisplay.textContent   = clue || '';
    clueInputWrap.style.display = 'none';
  }

  // Dial
  renderDial(data);

  // Guess pips
  const guessers = connected.filter(p => p.id !== psychicId);
  renderGuessPips(hasGuessed ? hasGuessed.length : 0, hasGuessed || [], guessers.length);

  // Guess instruction (for guessers during guessing phase)
  // Already shown via role banner

  // Host reveal button
  const revealWrap = document.getElementById('wave-reveal-wrap');
  revealWrap.style.display = (isHost && phase === 'guessing') ? 'block' : 'none';

  // Next round / waiting
  const nextWrap   = document.getElementById('wave-next-wrap');
  const nextBtn    = document.getElementById('lbl-next-round');
  const waitNext   = document.getElementById('wave-waiting-next');
  if (phase === 'reveal') {
    nextWrap.style.display = 'block';
    if (isHost) {
      nextBtn.style.display   = 'inline-flex';
      nextBtn.textContent     = round >= totalRounds ? '🏆 ' + L.gameOver : L.nextRound;
      waitNext.style.display  = 'none';
    } else {
      nextBtn.style.display   = 'none';
      waitNext.style.display  = 'block';
      waitNext.textContent    = L.waitingNext;
    }
  } else {
    nextWrap.style.display = 'none';
  }
}

function renderScoreboard(players, totalScores, psychicId) {
  const el = document.getElementById('wave-scoreboard');
  el.innerHTML = '';
  players.filter(p => p.connected !== false).forEach(p => {
    const chip = document.createElement('div');
    chip.className = 'wave-score-chip' + (p.id === psychicId ? ' psychic-turn' : '');
    chip.innerHTML =
      '<span>' + p.name + (p.id === myId ? ' (' + L.youBadge + ')' : '') +
      (p.id === psychicId ? ' 🔮' : '') + '</span>' +
      '<span class="wave-score-pts">' + (totalScores[p.id] || 0) + '</span>';
    el.appendChild(chip);
  });
}

// ─── DIAL RENDERING ──────────────────────────────────────────────
function renderDial(data) {
  const { phase, target, psychicId, guesses } = data;
  const isPsychic = myId === psychicId;
  const svg = document.getElementById('wave-dial');
  svg.innerHTML = '';

  const W = 400, H = 220;

  // ── Score zone arcs ──────────────────────────────────────────
  // Draw from outside in so inner zones paint over outer ones
  const zoneData = [
    { from: 0,  to: 100, color: 'rgba(167,169,190,0.08)' },  // full bg
    { from: 15, to: 85,  color: 'rgba(167,169,190,0.15)' },  // outer ring
    { from: 28, to: 72,  color: 'rgba(77,171,247,0.18)'  },  // near
    { from: 38, to: 62,  color: 'rgba(6,214,160,0.22)'   },  // close
    { from: 45, to: 55,  color: 'rgba(255,209,102,0.30)' },  // bullseye
  ];

  zoneData.forEach(z => {
    const pathD = arcPath(z.from, z.to, R - 2);
    const zone  = svgEl('path', { d: pathD, fill: z.color });
    svg.appendChild(zone);
  });

  // ── Arc outline ──────────────────────────────────────────────
  svg.appendChild(svgEl('path', {
    d: arcPath(0, 100, R),
    fill: 'none',
    stroke: 'var(--border)',
    'stroke-width': '2',
  }));

  // ── Zone tick marks ──────────────────────────────────────────
  [15, 28, 38, 45, 55, 62, 72, 85].forEach(pos => {
    const a = posToAngle(pos);
    const x1 = CX + (R - 8)  * Math.cos(a);
    const y1 = CY - (R - 8)  * Math.sin(a);
    const x2 = CX + (R + 4)  * Math.cos(a);
    const y2 = CY - (R + 4)  * Math.sin(a);
    svg.appendChild(svgEl('line', {
      x1, y1, x2, y2,
      stroke: 'var(--border)',
      'stroke-width': '1.5',
    }));
  });

  // ── LEFT / RIGHT end labels ───────────────────────────────────
  svg.appendChild(makeText('◄', CX - R - 16, CY + 5, 'var(--accent)', '14', 'middle'));
  svg.appendChild(makeText('►', CX + R + 16, CY + 5, 'var(--accent2)', '14', 'middle'));

  // ── Target (psychic only, or revealed) ───────────────────────
  if (target !== null && target !== undefined) {
    const a  = posToAngle(target);
    const tx = CX + R * Math.cos(a);
    const ty = CY - R * Math.sin(a);

    if (phase === 'reveal') {
      // Show full zone highlight
      drawNeedle(svg, target, '#ffd166', 3, true);
      // Glowing dot on arc
      drawGlowDot(svg, tx, ty, '#ffd166');
      // Target label
      svg.appendChild(makeText('●', tx, ty - 16, '#ffd166', '18', 'middle'));
    } else if (isPsychic) {
      // Psychic sees target as glowing dot only
      drawGlowDot(svg, tx, ty, '#ffd166');
    }
  }

  // ── Other players' guesses (reveal phase) ────────────────────
  if (phase === 'reveal' && guesses) {
    const { players } = data;
    Object.entries(guesses).forEach(([pid, val]) => {
      if (pid === psychicId) return;
      const player = players ? players.find(p => p.id === pid) : null;
      const label  = player ? player.name.charAt(0).toUpperCase() : '?';
      const isMe   = pid === myId;
      drawNeedle(svg, val, isMe ? 'var(--accent)' : 'var(--muted)', isMe ? 2.5 : 1.5);
      const a  = posToAngle(val);
      const gx = CX + (R + 18) * Math.cos(a);
      const gy = CY - (R + 18) * Math.sin(a);
      const dot = svgEl('circle', {
        cx: CX + R * Math.cos(a), cy: CY - R * Math.sin(a),
        r: isMe ? 7 : 5,
        fill: isMe ? 'var(--accent)' : 'var(--muted)',
        stroke: 'var(--bg)', 'stroke-width': '2',
      });
      svg.appendChild(dot);
      svg.appendChild(makeText(label, gx, gy + 4, isMe ? 'var(--accent)' : 'var(--muted)', '12', 'middle'));
    });
  }

  // ── My guess needle (guessing phase) ─────────────────────────
  if ((phase === 'guessing') && myGuess !== null && myId !== psychicId) {
    drawNeedle(svg, myGuess, 'var(--accent)', 3);
    const a  = posToAngle(myGuess);
    const gx = CX + R * Math.cos(a);
    const gy = CY - R * Math.sin(a);
    svg.appendChild(svgEl('circle', {
      cx: gx, cy: gy, r: 7,
      fill: 'var(--accent)', stroke: 'var(--bg)', 'stroke-width': '2',
    }));
  }

  // ── Interactive overlay (guessing + not psychic) ──────────────
  if (phase === 'guessing' && myId !== psychicId) {
    const hitArea = svgEl('path', {
      d: arcPath(0, 100, R + 20),
      fill: 'transparent',
      stroke: 'transparent',
      'stroke-width': '40',
      cursor: 'pointer',
    });
    hitArea.addEventListener('click',     (e) => handleDialClick(e, svg));
    hitArea.addEventListener('mousemove', (e) => handleDialHover(e, svg));
    hitArea.addEventListener('touchmove', (e) => { e.preventDefault(); handleDialTouch(e, svg); }, { passive: false });
    hitArea.addEventListener('touchstart',(e) => { e.preventDefault(); handleDialTouch(e, svg); }, { passive: false });
    svg.appendChild(hitArea);
  }

  // ── Centre hub dot ────────────────────────────────────────────
  svg.appendChild(svgEl('circle', {
    cx: CX, cy: CY, r: 8,
    fill: 'var(--surface)', stroke: 'var(--border)', 'stroke-width': '2',
  }));
}

function drawNeedle(svg, pos, color, width, dashed) {
  const a  = posToAngle(pos);
  const x2 = CX + (R - 5) * Math.cos(a);
  const y2 = CY - (R - 5) * Math.sin(a);
  const attrs = {
    x1: CX, y1: CY, x2, y2,
    stroke: color, 'stroke-width': width,
    'stroke-linecap': 'round',
  };
  if (dashed) attrs['stroke-dasharray'] = '6 4';
  svg.appendChild(svgEl('line', attrs));
}

function drawGlowDot(svg, x, y, color) {
  // Outer glow
  svg.appendChild(svgEl('circle', { cx: x, cy: y, r: 14, fill: color, opacity: '0.2' }));
  svg.appendChild(svgEl('circle', { cx: x, cy: y, r: 9,  fill: color, opacity: '0.35' }));
  svg.appendChild(svgEl('circle', { cx: x, cy: y, r: 5,  fill: color }));
}

function makeText(txt, x, y, fill, size, anchor) {
  const el = svgEl('text', {
    x, y, fill,
    'font-size': size,
    'font-family': 'Nunito, sans-serif',
    'font-weight': '900',
    'text-anchor': anchor || 'middle',
    'dominant-baseline': 'middle',
    'pointer-events': 'none',
  });
  el.textContent = txt;
  return el;
}

// Convert 0–100 position to SVG angle (radians, measured from positive x-axis)
// 0 = left end (angle π), 100 = right end (angle 0), 50 = top (angle π/2)
function posToAngle(pos) {
  return Math.PI - (pos / 100) * Math.PI;  // π → 0
}

// Build an SVG arc path string for a fraction of the semicircle
function arcPath(from, to, radius) {
  const a1 = posToAngle(from);
  const a2 = posToAngle(to);
  const x1 = CX + radius * Math.cos(a1);
  const y1 = CY - radius * Math.sin(a1);
  const x2 = CX + radius * Math.cos(a2);
  const y2 = CY - radius * Math.sin(a2);
  const largeArc = (to - from) > 50 ? 1 : 0;
  return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
}

// Convert mouse/touch event to 0–100 dial position
function eventToPos(e, svg) {
  const rect = svg.getBoundingClientRect();
  const scaleX = 400 / rect.width;
  const scaleY = 220 / rect.height;
  let clientX, clientY;
  if (e.touches && e.touches[0]) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
  }
  const x = (clientX - rect.left) * scaleX - CX;
  const y = CY - (clientY - rect.top) * scaleY;
  const angle = Math.atan2(y, x);
  // angle is in [-π, π]; we want 0=left(π), 100=right(0)
  // clamp to semicircle
  const clamped = Math.max(0, Math.min(Math.PI, angle < 0 ? Math.PI + angle + Math.PI : angle));
  // But atan2 with positive y gives angle in [0, π], which is our semicircle
  if (y < -10) return null; // below the baseline
  const pos = (1 - clamped / Math.PI) * 100;
  return Math.max(0, Math.min(100, Math.round(pos)));
}

function handleDialClick(e, svg) {
  const pos = eventToPos(e, svg);
  if (pos === null) return;
  myGuess = pos;
  socket.emit('wave_guess', { code: roomCode, value: pos });
  if (roomState) renderDial(roomState);
}

function handleDialHover(e, svg) {
  // Show a faint preview needle on hover
  if (roomState && roomState.phase === 'guessing' && myId !== roomState.psychicId) {
    const pos = eventToPos(e, svg);
    if (pos === null) return;
    // Lightweight re-render with hover indicator would be expensive;
    // instead just update cursor style
    svg.style.cursor = 'crosshair';
  }
}

function handleDialTouch(e, svg) {
  const pos = eventToPos(e, svg);
  if (pos === null) return;
  myGuess = pos;
  socket.emit('wave_guess', { code: roomCode, value: pos });
  if (roomState) renderDial(roomState);
}

// ─── GUESS PIPS ──────────────────────────────────────────────────
function renderGuessPips(count, hasGuessed, total) {
  const el = document.getElementById('wave-guess-bar');
  if (!el || !roomState) return;
  const connected = roomState.players.filter(p => p.connected !== false);
  const guessers  = connected.filter(p => p.id !== roomState.psychicId);
  const tot       = total !== undefined ? total : guessers.length;
  el.innerHTML = '';
  for (let i = 0; i < tot; i++) {
    const pip = document.createElement('div');
    pip.className = 'wave-guess-pip' + (i < count ? ' done' : '');
    el.appendChild(pip);
  }
  if (tot > 0) {
    const label = document.createElement('span');
    label.style.cssText = 'font-size:12px;color:var(--muted);font-weight:700;margin-left:6px;';
    label.textContent   = L.guessedCount(count, tot);
    el.appendChild(label);
  }
}

// ─── REVEAL RESULTS ──────────────────────────────────────────────
// renderGame handles reveal — the dial shows all guesses + target
// Round scores shown below dial

// ─── FINAL ───────────────────────────────────────────────────────
function renderFinal(data) {
  const { players, totalScores, hostId } = data;
  const sorted   = [...players].sort((a, b) => (totalScores[b.id] || 0) - (totalScores[a.id] || 0));
  const maxScore = sorted[0] ? (totalScores[sorted[0].id] || 0) : 0;
  const winners  = sorted.filter(p => (totalScores[p.id] || 0) === maxScore);
  const isDraw   = winners.length > 1;

  document.getElementById('lbl-game-over').textContent = L.gameOver;

  const heading = isDraw ? L.draw : L.winner(winners[0].name);
  const el = document.getElementById('final-results');
  el.innerHTML = '<div style="text-align:center;font-size:22px;font-weight:900;color:var(--accent2);margin-bottom:20px;">' + heading + '</div>';

  sorted.forEach((p, i) => {
    const score   = totalScores[p.id] || 0;
    const isWin   = score === maxScore && !isDraw;
    el.innerHTML +=
      '<div class="wave-final-row' + (isWin ? ' winner' : '') + '">' +
        '<span style="font-weight:800;font-size:15px;">' +
          (i===0?'🥇':i===1?'🥈':i===2?'🥉':(i+1)+'.') + ' ' +
          p.name + (p.id === myId ? ' (' + L.youBadge + ')' : '') +
        '</span>' +
        '<span class="wave-final-pts">' + score + ' <span style="font-size:14px;font-family:Nunito">' + L.pointsLabel + '</span></span>' +
      '</div>';
  });

  const playBtn = document.getElementById('lbl-play-again');
  if (playBtn) {
    playBtn.style.display = myId === hostId ? 'inline-flex' : 'none';
    playBtn.textContent   = L.playAgain;
  }
  document.getElementById('lbl-go-home').textContent = L.goHome;
}

// ─── ACTIONS ─────────────────────────────────────────────────────
function submitClue() {
  const val = document.getElementById('wave-clue-input').value.trim();
  if (!val) return;
  socket.emit('wave_clue', { code: roomCode, clue: val });
  document.getElementById('wave-clue-input').value = '';
}

function revealNow()  { socket.emit('wave_reveal',     { code: roomCode }); }
function nextRound()  { socket.emit('wave_next_round', { code: roomCode }); }
function playAgain()  { socket.emit('wave_start',      { code: roomCode }); }

function createRoom() {
  const name = document.getElementById('host-name').value.trim();
  if (!name) { showError(lang === 'pl' ? 'Wpisz swoje imię!' : 'Enter your name!'); return; }
  myName = name;
  socket.emit('wave_create', { name, settings: { totalRounds: 8, lang } });
}

function joinRoom() {
  const name = document.getElementById('join-name').value.trim();
  const code = document.getElementById('join-code').value.trim().toUpperCase();
  if (!name) { showError(lang === 'pl' ? 'Wpisz swoje imię!' : 'Enter your name!'); return; }
  if (!code || code.length < 5) { showError(lang === 'pl' ? 'Wpisz kod pokoju!' : 'Enter the room code!'); return; }
  myName = name;
  socket.emit('wave_join', { name, code });
}

function startGame() { socket.emit('wave_start', { code: roomCode }); }

function updateSettings() {
  const rounds = parseInt(document.getElementById('settings-rounds').value);
  socket.emit('wave_update_settings', { code: roomCode, settings: { totalRounds: rounds, lang } });
}

function setGameLang(code) {
  lang = code; L = LANGS[code] || LANGS['en'];
  applyTranslations();
  socket.emit('wave_update_settings', { code: roomCode, settings: { lang: code } });
}

function copyRoomCode() {
  var ta = document.createElement('textarea');
  ta.value = roomCode; ta.style.position = 'fixed'; ta.style.opacity = '0';
  document.body.appendChild(ta); ta.focus(); ta.select();
  try { document.execCommand('copy'); showToast('📋 ' + roomCode); } catch(e) { prompt('Room code:', roomCode); }
  document.body.removeChild(ta);
}

function goHome() {
  roomCode = ''; roomState = null; myName = ''; myGuess = null;
  sessionStorage.removeItem('wave_code');
  sessionStorage.removeItem('wave_name');
  showScreen('screen-home');
}

function confirmGoHome() {
  if (roomCode) {
    const inGame = roomState && roomState.phase !== 'lobby' && roomState.phase !== 'final';
    document.getElementById('confirm-title').textContent = L.leaveTitle;
    document.getElementById('confirm-msg').textContent   = inGame ? L.leaveMsg : L.confirmLeave;
    document.getElementById('confirm-yes').textContent   = L.leaveYes;
    document.getElementById('confirm-no').textContent    = L.leaveNo;
    document.getElementById('confirm-modal').style.display = 'flex';
  } else { doGoHome(); }
}
function closeConfirm() { document.getElementById('confirm-modal').style.display = 'none'; }
function doGoHome()     { closeConfirm(); goHome(); }

// ─── LANG BAR ────────────────────────────────────────────────────
function buildLangBar() {
  const bar = document.getElementById('lang-bar');
  bar.innerHTML = Object.keys(LANGS).map(code =>
    '<button class="lang-btn' + (code === lang ? ' active' : '') +
    '" onclick="setUiLang(\'' + code + '\')">' + LANGS[code].name + '</button>'
  ).join('');
}

function setUiLang(code) {
  lang = code; L = LANGS[code] || LANGS['en'];
  document.querySelectorAll('.lang-btn').forEach(b =>
    b.classList.toggle('active', b.textContent === LANGS[code].name));
  applyTranslations();
}

function applyTranslations() {
  const map = {
    'game-title':       'gameTitle',   'game-subtitle':    'subtitle',
    'lbl-create-room':  'createRoom',  'lbl-join-room':    'joinRoom',
    'lbl-your-name':    'yourName',    'lbl-join-name':    'joinName',
    'lbl-room-code':    'roomCode',    'lbl-create-btn':   'createBtn',
    'lbl-join-btn':     'joinBtn',     'lbl-settings':     'settings',
    'lbl-rounds-title': 'roundsTitle', 'lbl-lang-title':   'langTitle',
    'lbl-players-title':'playersTitle','lbl-start-btn':    'startBtn',
    'lbl-leave-room':   'leaveRoom',   'lbl-share-code':   'shareCode',
    'lbl-copy-code':    'copyCode',    'lbl-how-to-play':  'howToPlay',
    'lbl-rule-1':       'rule1',       'lbl-rule-2':       'rule2',
    'lbl-rule-3':       'rule3',       'lbl-rule-4':       'rule4',
    'lbl-rule-5':       'rule5',       'lbl-submit-clue':  'submitClue',
    'lbl-reveal-btn':   'revealBtn',   'lbl-next-round':   'nextRound',
    'lbl-game-over':    'gameOver',    'lbl-play-again':   'playAgain',
    'lbl-go-home':      'goHome',
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

// ─── UTILS ───────────────────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  const topNav = document.getElementById('top-nav');
  if (topNav) topNav.style.display = id === 'screen-home' ? 'none' : 'flex';
  const navCode = document.getElementById('nav-room-code');
  if (navCode && roomCode) navCode.textContent = roomCode;
  const navShare = document.getElementById('nav-share-btn');
  if (navShare) navShare.style.display = (roomCode && id !== 'screen-home') ? 'flex' : 'none';
}

function showError(msg) {
  const box = document.getElementById('home-error');
  box.textContent = msg; box.style.display = 'block';
  setTimeout(() => box.style.display = 'none', 3500);
}
function clearHomeError() { const b = document.getElementById('home-error'); if (b) b.style.display = 'none'; }

function showToast(msg) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div'); t.id = 'toast';
    t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:var(--card);border:1px solid var(--border);color:var(--text);padding:10px 20px;border-radius:10px;font-weight:700;font-size:14px;z-index:999;';
    document.body.appendChild(t);
  }
  t.textContent = msg; t.style.display = 'block';
  clearTimeout(t._timeout);
  t._timeout = setTimeout(() => t.style.display = 'none', 3000);
}

// ─── INIT ────────────────────────────────────────────────────────
buildLangBar();
applyTranslations();
