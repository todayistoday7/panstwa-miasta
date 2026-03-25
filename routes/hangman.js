// ════════════════════════════════════════════════════════
// HANGMAN — Game Logic
// Rotating word-picker: each player takes a turn picking
// the word while everyone else guesses.
// 7 wrong guesses before hangman is complete.
// Full word guess allowed — wrong = instant loss.
// ════════════════════════════════════════════════════════
'use strict';

const lobby = require('./lobby');

const hangmanRooms = {};

const MAX_WRONG = 7;

function generateHangCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code;
  do { code = 'H' + Array.from({length:4}, () => chars[Math.floor(Math.random()*chars.length)]).join(''); }
  while (hangmanRooms[code]);
  return code;
}

function makeHangRoom(hostId, settings) {
  const code = generateHangCode();
  hangmanRooms[code] = {
    code, hostId,
    isPublic: settings.isPublic || false,
    settings: {
      lang:     settings.lang     || 'en',
      isPublic: settings.isPublic || false,
    },
    players: [],
    state: {
      phase:        'lobby',   // lobby | picking | guessing | roundEnd | final
      pickerIndex:  0,         // index into connected players
      word:         null,      // set by picker, hidden from guessers
      hint:         null,      // optional category hint
      guessedLetters: [],      // array of uppercase letters guessed
      wrongCount:   0,
      roundWinner:  null,      // playerId or null (null = picker wins)
      roundsPlayed: 0,
      scores:       {},        // { playerId: wins }
    }
  };
  return hangmanRooms[code];
}

function getHangRoom(code)  { return hangmanRooms[code]; }
function getHangRoomCount() { return Object.keys(hangmanRooms).length; }

function getConnected(room) {
  return room.players.filter(p => p.connected !== false);
}

function getPicker(room) {
  const connected = getConnected(room);
  if (!connected.length) return null;
  return connected[room.state.pickerIndex % connected.length];
}

// What guessers see: dashes for unguessed letters, revealed for guessed
function buildDisplay(word, guessedLetters) {
  return word.toUpperCase().split('').map(ch => {
    if (ch === ' ') return ' ';
    return guessedLetters.includes(ch) ? ch : '_';
  });
}

function isWordComplete(word, guessedLetters) {
  return word.toUpperCase().split('').every(ch => ch === ' ' || guessedLetters.includes(ch));
}

// Emit different state to picker (knows the word) vs guessers (see only display)
function emitHangState(io, room) {
  const picker  = getPicker(room);
  const display = room.state.word
    ? buildDisplay(room.state.word, room.state.guessedLetters)
    : null;

  const base = {
    phase:          room.state.phase,
    hostId:         room.hostId,
    settings:       room.settings,
    players:        room.players.map(p => ({
      id: p.id, name: p.name, connected: p.connected,
      score: room.state.scores[p.id] || 0,
    })),
    pickerId:       picker ? picker.id : null,
    display,                             // array of ch | '_' | ' '
    guessedLetters: room.state.guessedLetters,
    wrongCount:     room.state.wrongCount,
    maxWrong:       MAX_WRONG,
    hint:           room.state.hint,
    roundWinner:    room.state.roundWinner,
    roundsPlayed:   room.state.roundsPlayed,
    totalRounds:    getConnected(room).length,
    wordLength:     room.state.word ? room.state.word.length : null,
  };

  room.players.forEach(p => {
    if (!p.connected) return;
    const payload = { ...base };
    // Only the picker knows the actual word (during picking/guessing phases)
    if (p.id === (picker && picker.id) || room.state.phase === 'roundEnd' || room.state.phase === 'final') {
      payload.word = room.state.word;
    } else {
      payload.word = null;
    }
    io.to(p.id).emit('hang_state', payload);
  });
}

function promoteHangHost(room) {
  const next = room.players.find(p => p.connected && p.id !== room.hostId);
  if (next) room.hostId = next.id;
}

function startNextRound(io, room) {
  room.state.phase          = 'picking';
  room.state.word           = null;
  room.state.hint           = null;
  room.state.guessedLetters = [];
  room.state.wrongCount     = 0;
  room.state.roundWinner    = null;
  emitHangState(io, room);
}

// ─── REGISTER ────────────────────────────────────────────────────
function register(io, socket) {

  socket.on('hang_create', ({ name, settings }) => {
    const room = makeHangRoom(socket.id, settings || {});
    room.players.push({ id: socket.id, name: name || 'Host', connected: true });
    room.state.scores[socket.id] = 0;
    socket.join(room.code);
    socket.emit('hang_room_created', { code: room.code });
    // 24h lobby expiry
    room._lobbyTimer = setTimeout(() => {
      if (hangmanRooms[room.code] && hangmanRooms[room.code].state.phase === 'lobby')
        delete hangmanRooms[room.code];
    }, 24 * 60 * 60 * 1000);
    lobby.announce('hangman', room);
    emitHangState(io, room);
  });

  socket.on('hang_join', ({ code, name }) => {
    const room = getHangRoom(code.toUpperCase().trim());
    if (!room) { socket.emit('hang_error', { msg: 'Room not found.' }); return; }
    if (room.state.phase === 'final') { socket.emit('hang_error', { msg: 'This game has already ended.' }); return; }
    if (room.state.phase !== 'lobby') { socket.emit('hang_error', { msg: 'Game already started.' }); return; }
    if (room.players.length >= 10)    { socket.emit('hang_error', { msg: 'Room is full.' }); return; }

    const nameTaken = room.players.find(p => p.name.toLowerCase() === (name||'').toLowerCase() && p.connected);
    if (nameTaken) { socket.emit('hang_error', { msg: 'Name already taken.' }); return; }

    const disconnected = room.players.find(p => p.name.toLowerCase() === (name||'').toLowerCase() && !p.connected);
    if (disconnected) {
      disconnected.id = socket.id; disconnected.connected = true;
    } else {
      room.players.push({ id: socket.id, name: name || 'Player', connected: true });
      room.state.scores[socket.id] = 0;
    }
    socket.join(room.code);
    socket.emit('hang_room_joined', { code: room.code });
    lobby.announce('hangman', room);
    emitHangState(io, room);
  });

  socket.on('hang_update_settings', ({ code, settings }) => {
    const room = getHangRoom(code);
    if (!room || socket.id !== room.hostId) return;
    if (settings.isPublic !== undefined) room.isPublic = settings.isPublic;
    room.settings = { ...room.settings, ...settings };
    lobby.announce('hangman', room);
    emitHangState(io, room);
  });

  socket.on('hang_start', ({ code }) => {
    const room = getHangRoom(code);
    if (!room || socket.id !== room.hostId) return;
    if (getConnected(room).length < 2) {
      socket.emit('hang_error', { msg: 'Need at least 2 players.' }); return;
    }
    if (room._lobbyTimer) { clearTimeout(room._lobbyTimer); room._lobbyTimer = null; }
    room.state.roundsPlayed = 0;
    room.state.pickerIndex  = 0;
    room.state.scores       = {};
    room.players.forEach(p => room.state.scores[p.id] = 0);
    lobby.announce('hangman', room);
    startNextRound(io, room);
  });

  // Picker submits the word (and optional hint)
  socket.on('hang_set_word', ({ code, word, hint }) => {
    const room = getHangRoom(code);
    if (!room || room.state.phase !== 'picking') return;
    const picker = getPicker(room);
    if (!picker || socket.id !== picker.id) return;

    const cleaned = (word || '').trim().toUpperCase();
    if (!cleaned || cleaned.length < 2) { socket.emit('hang_error', { msg: 'Word must be at least 2 letters.' }); return; }
    if (!/^[A-ZĄĆĘŁŃÓŚŹŻ ]+$/.test(cleaned)) { socket.emit('hang_error', { msg: 'Letters only (no numbers or punctuation).' }); return; }

    room.state.word           = cleaned;
    room.state.hint           = (hint || '').trim() || null;
    room.state.guessedLetters = [];
    room.state.wrongCount     = 0;
    room.state.phase          = 'guessing';
    emitHangState(io, room);
  });

  // Guesser guesses a single letter
  socket.on('hang_guess_letter', ({ code, letter }) => {
    const room = getHangRoom(code);
    if (!room || room.state.phase !== 'guessing') return;
    const picker = getPicker(room);
    if (picker && socket.id === picker.id) return; // picker can't guess

    const ch = (letter || '').trim().toUpperCase();
    if (!ch || ch.length !== 1 || !/[A-ZĄĆĘŁŃÓŚŹŻ]/.test(ch)) return;
    if (room.state.guessedLetters.includes(ch)) return; // already guessed

    room.state.guessedLetters.push(ch);

    if (!room.state.word.includes(ch)) {
      // Wrong guess
      room.state.wrongCount++;
      if (room.state.wrongCount >= MAX_WRONG) {
        // Hangman complete — picker wins this round
        room.state.phase       = 'roundEnd';
        room.state.roundWinner = null; // null = picker wins
        room.state.scores[picker.id] = (room.state.scores[picker.id] || 0) + 1;
        emitHangState(io, room);
        return;
      }
    } else {
      // Correct — check if word complete
      if (isWordComplete(room.state.word, room.state.guessedLetters)) {
        room.state.phase       = 'roundEnd';
        room.state.roundWinner = socket.id;
        room.state.scores[socket.id] = (room.state.scores[socket.id] || 0) + 1;
        emitHangState(io, room);
        return;
      }
    }

    emitHangState(io, room);
  });

  // Guesser guesses the full word
  socket.on('hang_guess_word', ({ code, guess }) => {
    const room = getHangRoom(code);
    if (!room || room.state.phase !== 'guessing') return;
    const picker = getPicker(room);
    if (picker && socket.id === picker.id) return;

    const cleaned = (guess || '').trim().toUpperCase();
    if (!cleaned) return;

    if (cleaned === room.state.word) {
      // Correct!
      // Reveal all letters for display
      room.state.guessedLetters = [...new Set(room.state.word.split(''))];
      room.state.phase          = 'roundEnd';
      room.state.roundWinner    = socket.id;
      room.state.scores[socket.id] = (room.state.scores[socket.id] || 0) + 1;
    } else {
      // Wrong full-word guess — instant loss (add remaining wrong count to complete hangman)
      room.state.wrongCount  = MAX_WRONG;
      room.state.phase       = 'roundEnd';
      room.state.roundWinner = null; // picker wins
      room.state.scores[picker.id] = (room.state.scores[picker.id] || 0) + 1;
    }
    emitHangState(io, room);
  });

  // Host advances to next round
  socket.on('hang_next_round', ({ code }) => {
    const room = getHangRoom(code);
    if (!room || room.state.phase !== 'roundEnd') return;
    if (socket.id !== room.hostId) return;

    room.state.roundsPlayed++;
    const connected = getConnected(room);

    if (room.state.roundsPlayed >= connected.length) {
      // Everyone has had a turn — game over
      room.state.phase = 'final';
      lobby.remove(room.code);
      emitHangState(io, room);
      setTimeout(() => { if (hangmanRooms[room.code]) delete hangmanRooms[room.code]; }, 60 * 60 * 1000);
    } else {
      room.state.pickerIndex = (room.state.pickerIndex + 1) % connected.length;
      startNextRound(io, room);
    }
  });

  // Play again — host restarts
  socket.on('hang_play_again', ({ code }) => {
    const room = getHangRoom(code);
    if (!room || socket.id !== room.hostId) return;
    room.state.roundsPlayed = 0;
    room.state.pickerIndex  = 0;
    room.state.scores       = {};
    room.players.forEach(p => room.state.scores[p.id] = 0);
    startNextRound(io, room);
  });

  socket.on('hang_rejoin', ({ code, name }) => {
    const room = getHangRoom(code);
    if (!room) { socket.emit('hang_error', { msg: 'Room expired.' }); return; }
    if (room.state.phase === 'final') { socket.emit('hang_error', { msg: 'This game has already ended.' }); return; }
    const existing = room.players.find(p => p.name === name);
    if (existing) {
      if (room.hostId === existing.id) room.hostId = socket.id;
      existing.id = socket.id; existing.connected = true;
    } else {
      if (room.state.phase !== 'lobby') { socket.emit('hang_error', { msg: 'Room already started.' }); return; }
      room.players.push({ id: socket.id, name, connected: true });
      room.state.scores[socket.id] = 0;
    }
    socket.join(room.code);
    socket.emit('hang_room_joined', { code: room.code });
    lobby.announce('hangman', room);
    emitHangState(io, room);
  });

  socket.on('hang_keep_alive', () => { /* keep warm */ });

  socket.on('disconnect', () => {
    for (const code of Object.keys(hangmanRooms)) {
      const room = hangmanRooms[code];
      const p    = room.players.find(p => p.id === socket.id);
      if (!p) continue;
      p.connected = false;
      if (socket.id === room.hostId) promoteHangHost(room);
      lobby.announce('hangman', room);
      emitHangState(io, room);
      const allGone = room.players.every(pl => !pl.connected);
      if (allGone) {
        lobby.remove(code);
        setTimeout(() => { if (hangmanRooms[code]) delete hangmanRooms[code]; }, 30 * 60 * 1000);
      }
      break;
    }
  });
}

module.exports = { register, getHangRoomCount };
