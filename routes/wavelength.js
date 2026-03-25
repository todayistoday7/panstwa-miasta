// ════════════════════════════════════════════════════════
// WAVELENGTH — Game Logic
// Free-for-all: everyone guesses, closest scores
// Scoring: 4pt bullseye, 3pt close, 2pt near, 1pt outer
// ════════════════════════════════════════════════════════
'use strict';

const waveRooms = {};

// Scoring zones — distance from centre of target (0–50 scale, 50 = max distance)
// Target is stored as 0–100. Score based on |guess - target|.
const ZONES = [
  { maxDist:  5, pts: 4 }, // bullseye  ±5
  { maxDist: 12, pts: 3 }, // close     ±12
  { maxDist: 22, pts: 2 }, // near      ±22
  { maxDist: 35, pts: 1 }, // outer     ±35
  { maxDist: Infinity, pts: 0 }, // miss
];

function scoreGuess(guess, target) {
  const dist = Math.abs(guess - target);
  for (const zone of ZONES) {
    if (dist <= zone.maxDist) return zone.pts;
  }
  return 0;
}

function generateWaveCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code;
  do { code = 'W' + Array.from({length:4}, () => chars[Math.floor(Math.random()*chars.length)]).join(''); }
  while (waveRooms[code]);
  return code;
}

function makeWaveRoom(hostId, settings) {
  const code = generateWaveCode();
  waveRooms[code] = {
    code, hostId,
    settings: {
      totalRounds: settings.totalRounds || 8,
      lang:        settings.lang        || 'en',
    },
    players: [],
    state: {
      phase:          'lobby',   // lobby | psychic | guessing | reveal | final
      round:          0,
      psychicIndex:   0,         // index into connected players array
      currentCard:    null,      // { left, right } — spectrum card
      target:         null,      // 0–100, only sent to psychic
      clue:           null,      // string typed by psychic
      guesses:        {},        // { playerId: 0–100 }
      roundScores:    {},        // { playerId: pts } for current round
      totalScores:    {},        // { playerId: cumulative }
      usedCards:      [],        // indices of already-used cards
    }
  };
  return waveRooms[code];
}

function getWaveRoom(code)  { return waveRooms[code]; }
function getWaveRoomCount() { return Object.keys(waveRooms).length; }

function getConnected(room) {
  return room.players.filter(p => p.connected !== false);
}

function getPsychic(room) {
  const connected = getConnected(room);
  if (!connected.length) return null;
  return connected[room.state.psychicIndex % connected.length];
}

// Emit different state to psychic (with target) vs everyone else (without)
function emitWaveState(io, room) {
  const base = {
    phase:        room.state.phase,
    round:        room.state.round,
    totalRounds:  room.settings.totalRounds,
    hostId:       room.hostId,
    settings:     room.settings,
    players:      room.players.map(p => ({
      id: p.id, name: p.name, connected: p.connected,
    })),
    psychicId:    getPsychic(room) ? getPsychic(room).id : null,
    currentCard:  room.state.currentCard,
    clue:         room.state.clue,
    guesses:      room.state.phase === 'reveal' || room.state.phase === 'final'
                    ? room.state.guesses    // show all guesses after reveal
                    : {},                  // hide during guessing
    roundScores:  room.state.roundScores,
    totalScores:  room.state.totalScores,
    hasGuessed:   Object.keys(room.state.guesses), // list of who has guessed
  };

  // Send to each socket individually so psychic gets target, others don't
  room.players.forEach(p => {
    if (!p.connected) return;
    const payload = { ...base };
    if (p.id === base.psychicId) {
      payload.target = room.state.target; // only psychic sees this
    } else {
      payload.target = null;
      // During guessing, send this player's own guess back (so they see their marker)
      if (room.state.phase === 'guessing' && room.state.guesses[p.id] !== undefined) {
        payload.myGuess = room.state.guesses[p.id];
      }
    }
    io.to(p.id).emit('wave_state', payload);
  });
}

function promoteWaveHost(room) {
  const next = room.players.find(p => p.connected && p.id !== room.hostId);
  if (next) room.hostId = next.id;
}

function startRound(io, room) {
  room.state.phase       = 'psychic';
  room.state.clue        = null;
  room.state.guesses     = {};
  room.state.roundScores = {};
  room.state.target      = Math.floor(Math.random() * 81) + 10; // 10–90 avoids edges

  // Pick a card not yet used
  const total = room.settings.lang === 'pl' ? 30 : 30; // same count both languages
  const available = Array.from({length: total}, (_, i) => i)
    .filter(i => !room.state.usedCards.includes(i));
  if (!available.length) {
    room.state.usedCards = [];
    room.state.usedCards.push(0);
    room.state.currentCardIndex = 0;
  } else {
    const idx = available[Math.floor(Math.random() * available.length)];
    room.state.usedCards.push(idx);
    room.state.currentCardIndex = idx;
  }
  // Card text resolved client-side from WAVE_CARDS[lang][idx]
  // Server just tracks the index
  room.state.cardIndex = room.state.currentCardIndex;

  emitWaveState(io, room);
}

function endRound(io, room) {
  const target  = room.state.target;
  const guesses = room.state.guesses;
  const scores  = {};

  room.players.forEach(p => {
    if (p.id === (getPsychic(room) || {}).id) return; // psychic doesn't score
    const guess = guesses[p.id];
    if (guess === undefined) {
      scores[p.id] = 0;
    } else {
      scores[p.id] = scoreGuess(guess, target);
    }
  });

  room.state.roundScores = scores;
  Object.entries(scores).forEach(([pid, pts]) => {
    room.state.totalScores[pid] = (room.state.totalScores[pid] || 0) + pts;
  });

  room.state.phase = 'reveal';
  emitWaveState(io, room);
}

// ─── REGISTER SOCKET EVENTS ──────────────────────────────────────
function register(io, socket) {

  socket.on('wave_create', ({ name, settings }) => {
    const room = makeWaveRoom(socket.id, settings || {});
    room.players.push({ id: socket.id, name: name || 'Host', connected: true });
    room.state.totalScores[socket.id] = 0;
    socket.join(room.code);
    socket.emit('wave_room_created', { code: room.code });
    emitWaveState(io, room);
  });

  socket.on('wave_join', ({ code, name }) => {
    const room = getWaveRoom(code.toUpperCase().trim());
    if (!room) { socket.emit('wave_error', { msg: 'Room not found.' }); return; }
    if (room.state.phase !== 'lobby') { socket.emit('wave_error', { msg: 'Game already started.' }); return; }
    if (room.players.length >= 10) { socket.emit('wave_error', { msg: 'Room is full.' }); return; }

    const existing = room.players.find(p => p.name.toLowerCase() === (name||'').toLowerCase() && !p.connected);
    if (existing) {
      existing.id = socket.id; existing.connected = true;
    } else {
      if (room.players.find(p => p.name.toLowerCase() === (name||'').toLowerCase() && p.connected)) {
        socket.emit('wave_error', { msg: 'Name already taken.' }); return;
      }
      room.players.push({ id: socket.id, name: name || 'Player', connected: true });
      room.state.totalScores[socket.id] = 0;
    }
    socket.join(room.code);
    socket.emit('wave_room_joined', { code: room.code });
    emitWaveState(io, room);
  });

  socket.on('wave_update_settings', ({ code, settings }) => {
    const room = getWaveRoom(code);
    if (!room || socket.id !== room.hostId) return;
    room.settings = { ...room.settings, ...settings };
    emitWaveState(io, room);
  });

  socket.on('wave_start', ({ code }) => {
    const room = getWaveRoom(code);
    if (!room || socket.id !== room.hostId) return;
    if (getConnected(room).length < 2) {
      socket.emit('wave_error', { msg: 'Need at least 2 players.' }); return;
    }
    room.state.round         = 0;
    room.state.usedCards     = [];
    room.state.psychicIndex  = 0;
    room.state.totalScores   = {};
    room.players.forEach(p => room.state.totalScores[p.id] = 0);
    room.state.round++;
    startRound(io, room);
  });

  // Psychic submits their clue
  socket.on('wave_clue', ({ code, clue }) => {
    const room = getWaveRoom(code);
    if (!room || room.state.phase !== 'psychic') return;
    const psychic = getPsychic(room);
    if (!psychic || socket.id !== psychic.id) return;
    if (!clue || !clue.trim()) return;
    room.state.clue  = clue.trim().toUpperCase();
    room.state.phase = 'guessing';
    emitWaveState(io, room);
  });

  // Player submits (or updates) their guess
  socket.on('wave_guess', ({ code, value }) => {
    const room = getWaveRoom(code);
    if (!room || room.state.phase !== 'guessing') return;
    const psychic = getPsychic(room);
    if (psychic && socket.id === psychic.id) return; // psychic can't guess
    const val = Math.max(0, Math.min(100, Number(value)));
    if (isNaN(val)) return;
    room.state.guesses[socket.id] = val;
    // Echo only to guesser so they see their marker
    socket.emit('wave_your_guess', { value: val });
    // Tell everyone who has guessed (not the value)
    io.to(room.code).emit('wave_guess_count', {
      count:    Object.keys(room.state.guesses).length,
      hasGuessed: Object.keys(room.state.guesses),
    });
  });

  // Host triggers reveal (or auto-reveal when all guessed)
  socket.on('wave_reveal', ({ code }) => {
    const room = getWaveRoom(code);
    if (!room || room.state.phase !== 'guessing') return;
    if (socket.id !== room.hostId) return;
    endRound(io, room);
  });

  // Host advances to next round
  socket.on('wave_next_round', ({ code }) => {
    const room = getWaveRoom(code);
    if (!room || socket.id !== room.hostId) return;
    if (room.state.phase !== 'reveal') return;

    if (room.state.round >= room.settings.totalRounds) {
      room.state.phase = 'final';
      emitWaveState(io, room);
    } else {
      room.state.round++;
      // Rotate psychic
      room.state.psychicIndex = (room.state.psychicIndex + 1) % getConnected(room).length;
      startRound(io, room);
    }
  });

  socket.on('wave_rejoin', ({ code, name }) => {
    const room = getWaveRoom(code);
    if (!room) { socket.emit('wave_error', { msg: 'Room expired.' }); return; }
    const existing = room.players.find(p => p.name === name);
    if (existing) {
      if (room.hostId === existing.id) room.hostId = socket.id;
      existing.id = socket.id; existing.connected = true;
    } else {
      if (room.state.phase !== 'lobby') {
        socket.emit('wave_error', { msg: 'Room already started.' }); return;
      }
      room.players.push({ id: socket.id, name, connected: true });
      room.state.totalScores[socket.id] = 0;
    }
    socket.join(room.code);
    socket.emit('wave_room_joined', { code: room.code });
    emitWaveState(io, room);
  });

  socket.on('wave_keep_alive', () => { /* keep warm */ });

  socket.on('disconnect', () => {
    for (const code of Object.keys(waveRooms)) {
      const room = waveRooms[code];
      const p    = room.players.find(p => p.id === socket.id);
      if (!p) continue;
      p.connected = false;
      if (socket.id === room.hostId) promoteWaveHost(room);
      emitWaveState(io, room);
      const allGone = room.players.every(pl => !pl.connected);
      if (allGone) setTimeout(() => { if (waveRooms[code]) delete waveRooms[code]; }, 30 * 60 * 1000);
      break;
    }
  });
}

module.exports = { register, getWaveRoomCount };
