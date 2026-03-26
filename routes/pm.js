// ════════════════════════════════════════════════════════
// PAŃSTWA-MIASTA — Game Logic
// ════════════════════════════════════════════════════════
'use strict';
const lobby = require('./lobby');

const rooms   = {};
const ALPHABET = 'ABCDEFGHIJKLMNOPRSTUWZ'.split('');

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code;
  do { code = Array.from({length:5}, () => chars[Math.floor(Math.random()*chars.length)]).join(''); }
  while (rooms[code]);
  return code;
}

function makeRoom(hostId, settings) {
  const code = generateCode();
  rooms[code] = {
    code, hostId,
    isPublic: settings.isPublic || false,
    settings: {
      totalRounds: settings.totalRounds || 5,
      gracePeriod: settings.gracePeriod || 20,
      categories:  settings.categories  || ['Country','City','Animal','Plant','Thing','Name','Color','Job'],
      lang:        settings.lang        || 'en',
      isPublic:    settings.isPublic    || false,
    },
    players: [],
    state: {
      phase: 'lobby',
      round: 0,
      letter: '',
      usedLetters: [],
      stopCalledBy: null,
      timerStart: null,
      drawingPlayerIndex: 0,
      answers: {},
      scores: [],
      totalScores: {},
      challenged: {},
      votes: {},
      activeChallenge: null,
      readyPlayers: {},
    }
  };
  return rooms[code];
}

function getRoom(code)       { return rooms[code]; }
function getRoomCount()      { return Object.keys(rooms).length; }
function getRoomByCode(code) { return rooms[code.toUpperCase()]; }

function getRoomPlayers(room) {
  return room.players.map(p => ({
    id: p.id,
    name: p.name,
    isHost: p.id === room.hostId,
    connected: p.connected,
    totalScore: room.state.totalScores[p.id] || 0,
  }));
}

function emitRoomState(io, room) {
  io.to(room.code).emit('room_state', {
    code: room.code,
    settings: { ...room.settings, isPublic: room.isPublic },
    players: getRoomPlayers(room),
    state: room.state,
  });
}

function promoteNewHost(io, room) {
  const next = room.players.find(p => p.connected && p.id !== room.hostId);
  if (next) {
    room.hostId = next.id;
    io.to(room.code).emit('new_host', { playerId: next.id, name: next.name });
  }
}

function getDrawingPlayer(room) {
  const connected = room.players.filter(p => p.connected);
  if (!connected.length) return null;
  return connected[room.state.drawingPlayerIndex % connected.length];
}

function startsWithLetter(word, letter) {
  return word.charAt(0).toUpperCase() === letter.toUpperCase();
}

function computeRoundScores(room) {
  const { state, settings } = room;
  const rIdx      = state.round - 1;
  const playerIds = room.players.map(p => p.id);

  if (!state.scores[rIdx]) state.scores[rIdx] = {};
  playerIds.forEach(pid => { if (!state.scores[rIdx][pid]) state.scores[rIdx][pid] = {}; });

  settings.categories.forEach((cat, ci) => {
    const answers = {};
    playerIds.forEach(pid => {
      answers[pid] = ((state.answers[pid] || {})[ci] || '').trim().toLowerCase();
    });
    const validAnswers    = Object.values(answers).filter(a => a && startsWithLetter(a, state.letter));
    const counts          = {};
    validAnswers.forEach(a => counts[a] = (counts[a] || 0) + 1);
    const totalValidPlayers = validAnswers.length;

    playerIds.forEach(pid => {
      const key = `${rIdx}_${pid}_${ci}`;
      if (state.challenged[key]) {
        state.scores[rIdx][pid][ci] = 0;
      } else {
        const ans = answers[pid];
        if (!ans || !startsWithLetter(ans, state.letter)) {
          state.scores[rIdx][pid][ci] = 0;
        } else if (counts[ans] > 1) {
          state.scores[rIdx][pid][ci] = 5;
        } else if (totalValidPlayers === 1) {
          state.scores[rIdx][pid][ci] = 15;
        } else {
          state.scores[rIdx][pid][ci] = 10;
        }
      }
    });
  });
}

function advanceFromScoring(io, room) {
  const rIdx = room.state.round - 1;
  room.players.forEach(p => {
    const pScores = room.state.scores[rIdx][p.id] || {};
    room.state.totalScores[p.id] = (room.state.totalScores[p.id] || 0) +
      Object.values(pScores).reduce((a, b) => a + b, 0);
  });
  if (room.state.round >= room.settings.totalRounds) {
    endGame(io, room);
  } else {
    startNextRound(io, room);
  }
}

function startNextRound(io, room) {
  room.state.round++;
  room.state.phase            = 'drawing';
  room.state.letter           = '';
  room.state.stopCalledBy     = null;
  room.state.activeChallenge  = null;
  room.state.readyPlayers     = {};
  room.state.answers          = {};
  room.players.forEach(p => room.state.answers[p.id] = {});
  room.state.drawingPlayerIndex =
    (room.state.round - 1) % room.players.filter(p => p.connected).length;
  emitRoomState(io, room);
}

function moveToScoring(io, room) {
  computeRoundScores(room);
  room.state.phase = 'calculating';
  emitRoomState(io, room);
  setTimeout(() => {
    room.state.phase = 'scoring';
    emitRoomState(io, room);
  }, 800);
}

function endGame(io, room) {
  const rIdx = room.state.round - 1;
  if (room.state.scores[rIdx]) {
    room.players.forEach(p => {
      const pScores = room.state.scores[rIdx][p.id] || {};
      room.state.totalScores[p.id] = (room.state.totalScores[p.id] || 0) +
        Object.values(pScores).reduce((a, b) => a + b, 0);
    });
  }
  room.state.phase = 'final';
  emitRoomState(io, room);
  // 1h after game ends, delete room so code can't be reused
  lobby.remove(room.code);
  setTimeout(() => { if (rooms[room.code]) delete rooms[room.code]; }, 60 * 60 * 1000);
}

// ─── REGISTER SOCKET EVENTS ──────────────────────────────────────
function register(io, socket) {

  socket.on('create_room', ({ name, settings }) => {
    const trimmedName = (name || '').trim();
    if (!trimmedName) { socket.emit('error', { msg: 'Please enter your name before creating a room.' }); return; }
    const room = makeRoom(socket.id, settings || {});
    room.players.push({ id: socket.id, name: trimmedName, connected: true });
    room.state.totalScores[socket.id] = 0;
    socket.join(room.code);
    socket.emit('room_created', { code: room.code });
    // 24h lobby expiry — cancelled once game starts
    room._lobbyTimer = setTimeout(() => {
      if (rooms[room.code] && rooms[room.code].state.phase === 'lobby') delete rooms[room.code];
    }, 24 * 60 * 60 * 1000);
    lobby.announce('pm', room);
    emitRoomState(io, room);
  });

  socket.on('join_room', ({ code, name }) => {
    const room = getRoom(code.toUpperCase().trim());
    if (!room) { socket.emit('error', { msg: 'Room not found.' }); return; }
    if (room.state.phase === 'final')  { socket.emit('error', { msg: 'This game has ended.' }); return; }

    const trimmedName = (name || 'Player').trim();

    // Mid-game rejoin: name matches an existing player — let them back in
    const existing_mg = room.players.find(p => p.name.toLowerCase() === trimmedName.toLowerCase());
    if (existing_mg && room.state.phase !== 'lobby') {
      if (existing_mg._disconnectTimer) { clearTimeout(existing_mg._disconnectTimer); existing_mg._disconnectTimer = null; }
      if (room.hostId === existing_mg.id) room.hostId = socket.id;
      existing_mg.id = socket.id; existing_mg.connected = true;
      socket.join(room.code);
      socket.emit('room_joined', { code: room.code, isHost: socket.id === room.hostId });
      emitRoomState(io, room);
      return;
    }

    if (room.state.phase !== 'lobby')  { socket.emit('error', { msg: 'Game already started.' }); return; }
    if (room.players.length >= 12)    { socket.emit('error', { msg: 'Room is full (max 12).' }); return; }

    const nameTaken   = room.players.find(p =>
      p.name.toLowerCase() === trimmedName.toLowerCase() && p.id !== socket.id
    );
    if (nameTaken) {
      if (!nameTaken.connected) {
        nameTaken.id = socket.id;
        nameTaken.connected = true;
        socket.join(room.code);
        socket.emit('room_joined', { code: room.code, isHost: socket.id === room.hostId });
        emitRoomState(io, room);
        return;
      }
      socket.emit('error', { msg: `The name ${trimmedName} is already taken in this room.` });
      return;
    }

    const existing = room.players.find(p => p.id === socket.id);
    if (!existing) {
      room.players.push({ id: socket.id, name: trimmedName, connected: true });
      room.state.totalScores[socket.id] = 0;
    }
    socket.join(room.code);
    socket.emit('room_joined', { code: room.code, isHost: socket.id === room.hostId });
    lobby.announce('pm', room);
    emitRoomState(io, room);
  });

  socket.on('rejoin_room', ({ code, name }) => {
    const room = getRoom(code);
    if (!room) { socket.emit('error', { msg: 'Room expired.' }); return; }
    const existing = room.players.find(p => p.name === name);
    if (existing) {
      existing.id = socket.id;
      existing.connected = true;
    } else {
      room.players.push({ id: socket.id, name, connected: true });
      room.state.totalScores[socket.id] = 0;
    }
    if (!room.players.find(p => p.id === room.hostId && p.connected)) {
      room.hostId = socket.id;
    }
    socket.join(room.code);
    socket.emit('room_joined', { code: room.code, isHost: socket.id === room.hostId });
    emitRoomState(io, room);
  });

  socket.on('update_settings', ({ code, settings }) => {
    const room = getRoom(code);
    if (!room || room.state.phase !== 'lobby') return;
    room.settings = { ...room.settings, ...settings };
    if (settings.isPublic !== undefined) { room.isPublic = settings.isPublic; room.settings.isPublic = settings.isPublic; }
    lobby.announce('pm', room);
    emitRoomState(io, room);
  });

  socket.on('start_game', ({ code }) => {
    const room = getRoom(code);
    if (!room) return;
    if (room.players.filter(p => p.connected).length < 2) {
      socket.emit('error', { msg: 'Need at least 2 players.' }); return;
    }
    if (room._lobbyTimer) { clearTimeout(room._lobbyTimer); room._lobbyTimer = null; }
    if (room._lobbyTimer) { clearTimeout(room._lobbyTimer); room._lobbyTimer = null; }
    lobby.remove(room.code);
    room.state.phase            = 'drawing';
    room.state.round            = 0;
    room.state.usedLetters      = [];
    room.state.scores           = [];
    room.state.challenged       = {};
    room.state.votes            = {};
    room.state.drawingPlayerIndex = 0;
    room.players.forEach(p => room.state.totalScores[p.id] = 0);
    startNextRound(io, room);
  });

  socket.on('draw_letter', ({ code }) => {
    const room = getRoom(code);
    if (!room || room.state.phase !== 'drawing') return;
    const drawer = getDrawingPlayer(room);
    if (!drawer || drawer.id !== socket.id) return;
    const available = ALPHABET.filter(l => !room.state.usedLetters.includes(l));
    if (!available.length) { endGame(io, room); return; }
    const letter = available[Math.floor(Math.random() * available.length)];
    room.state.letter = letter;
    room.state.usedLetters.push(letter);
    io.to(room.code).emit('letter_drawn', { letter });
  });

  socket.on('start_round', ({ code }) => {
    const room = getRoom(code);
    if (!room) return;
    const drawer = getDrawingPlayer(room);
    if (!drawer || drawer.id !== socket.id) return;
    room.state.phase        = 'playing';
    room.state.stopCalledBy = null;
    room.state.answers      = {};
    room.state.timerStart   = Date.now();
    room.players.forEach(p => { room.state.answers[p.id] = {}; });
    emitRoomState(io, room);
  });

  socket.on('submit_answer', ({ code, catIndex, value }) => {
    const room = getRoom(code);
    if (!room || room.state.phase !== 'playing') return;
    if (!room.state.answers[socket.id]) room.state.answers[socket.id] = {};
    room.state.answers[socket.id][catIndex] = value;
    io.to(room.code).emit('answer_updated', { playerId: socket.id, catIndex, value });
  });

  socket.on('call_stop', ({ code }) => {
    const room = getRoom(code);
    if (!room || room.state.phase !== 'playing') return;
    room.state.phase        = 'stopped';
    room.state.stopCalledBy = socket.id;
    const stopper     = room.players.find(p => p.id === socket.id);
    const gracePeriod = (room.settings.gracePeriod || 20) * 1000;
    io.to(room.code).emit('stop_called', {
      playerName: stopper ? stopper.name : 'Someone',
      playerId:   socket.id,
      gracePeriod: room.settings.gracePeriod || 20,
    });
    setTimeout(() => {
      const r = getRoom(code);
      if (r && r.state.phase === 'stopped') moveToScoring(io, r);
    }, gracePeriod);
  });

  socket.on('force_scoring', ({ code }) => {
    const room = getRoom(code);
    if (!room) return;
    moveToScoring(io, room);
  });

  socket.on('set_score', ({ code, playerId, rIdx, catIndex, pts }) => {
    const room = getRoom(code);
    if (!room || socket.id !== room.hostId) return;
    if (!room.state.scores[rIdx]) return;
    if (!room.state.scores[rIdx][playerId]) room.state.scores[rIdx][playerId] = {};
    room.state.scores[rIdx][playerId][catIndex] = pts;
    if (pts > 0) delete room.state.challenged[`${rIdx}_${playerId}_${catIndex}`];
    emitRoomState(io, room);
  });

  socket.on('open_challenge', ({ code, rIdx, playerId, catIndex }) => {
    const room = getRoom(code);
    if (!room) return;
    if (socket.id === playerId)       return;
    if (room.state.activeChallenge)   return;
    const key = `${rIdx}_${playerId}_${catIndex}`;
    room.state.votes[key]         = {};
    room.state.activeChallenge    = { rIdx, playerId, catIndex, challengerId: socket.id };
    io.to(room.code).emit('challenge_opened', {
      rIdx, playerId, catIndex,
      word:          (room.state.answers[playerId] || {})[catIndex] || '',
      category:      room.settings.categories[catIndex],
      playerName:    (room.players.find(p => p.id === playerId)    || {}).name || '?',
      challengerName:(room.players.find(p => p.id === socket.id)   || {}).name || '?',
    });
  });

  socket.on('cast_vote', ({ code, rIdx, playerId, catIndex, isValid }) => {
    const room = getRoom(code);
    if (!room) return;
    const key = `${rIdx}_${playerId}_${catIndex}`;
    if (!room.state.votes[key]) room.state.votes[key] = {};
    room.state.votes[key][socket.id] = isValid;

    const voters       = room.players.map(p => p.id);
    const allVoted     = voters.every(vid => room.state.votes[key][vid] !== undefined);
    const votesCast    = Object.values(room.state.votes[key]);
    const validCount   = votesCast.filter(v =>  v).length;
    const invalidCount = votesCast.filter(v => !v).length;

    io.to(room.code).emit('vote_updated', { rIdx, playerId, catIndex, votes: room.state.votes[key], allVoted, validCount, invalidCount });

    if (allVoted) {
      if (invalidCount > validCount) {
        room.state.challenged[key]                    = true;
        room.state.scores[rIdx][playerId][catIndex]   = 0;
      } else {
        delete room.state.challenged[key];
      }
      computeRoundScores(room);
      room.state.activeChallenge = null;
      io.to(room.code).emit('challenge_closed', { rIdx, playerId, catIndex });
      emitRoomState(io, room);
    }
  });

  socket.on('close_challenge', ({ code, rIdx, playerId, catIndex }) => {
    const room = getRoom(code);
    if (!room) return;
    const ac = room.state.activeChallenge;
    if (!ac) return;
    if (socket.id !== ac.challengerId && socket.id !== room.hostId) return;

    const key          = `${rIdx}_${playerId}_${catIndex}`;
    const votes        = room.state.votes[key] || {};
    const voters       = room.players.map(p => p.id).filter(id => id !== playerId);
    const invalidCount = voters.filter(id => votes[id] === false).length;
    const validCount   = voters.filter(id => votes[id] === true).length;

    if (Object.keys(votes).length > 0) {
      if (invalidCount > validCount) {
        room.state.challenged[key]                  = true;
        room.state.scores[rIdx][playerId][catIndex] = 0;
      } else {
        delete room.state.challenged[key];
      }
      computeRoundScores(room);
    }

    room.state.activeChallenge = null;
    io.to(room.code).emit('challenge_closed', { rIdx, playerId, catIndex });
    emitRoomState(io, room);
  });

  socket.on('mark_ready', ({ code }) => {
    const room = getRoom(code);
    if (!room || room.state.phase !== 'scoring') return;
    room.state.readyPlayers[socket.id] = true;
    const connectedPlayers = room.players.filter(p => p.connected);
    const allReady         = connectedPlayers.every(p => room.state.readyPlayers[p.id]);
    emitRoomState(io, room);
    if (allReady && socket.id === room.hostId) {
      setTimeout(() => {
        const r = getRoom(code);
        if (r && r.state.phase === 'scoring') advanceFromScoring(io, r);
      }, 1000);
    }
  });

  socket.on('next_round', ({ code }) => {
    const room = getRoom(code);
    if (!room || socket.id !== room.hostId) return;
    advanceFromScoring(io, room);
  });

  socket.on('keep_alive', () => {
    socket.emit('keep_alive_ack');
  });

  socket.on('rejoin', ({ code, name }) => {
    const room = rooms[code];
    if (!room) { socket.emit('error', { msg: 'Room expired.' }); return; }
    const existing = room.players.find(p => p.name === name);
    if (!existing) { socket.emit('error', { msg: 'Player not found.' }); return; }
    if (existing._disconnectTimer) { clearTimeout(existing._disconnectTimer); existing._disconnectTimer = null; }
    if (room.hostId === existing.id) room.hostId = socket.id;
    existing.id = socket.id; existing.connected = true;
    socket.join(code);
    emitRoomState(io, room);
  });

  socket.on('disconnect', () => {
    for (const code of Object.keys(rooms)) {
      const room = rooms[code];
      const p    = room.players.find(p => p.id === socket.id);
      if (p) {
        p.connected = false;
        if (socket.id === room.hostId) promoteNewHost(io, room);
        // Give 15s grace before announcing disconnect to other players
        if (p._disconnectTimer) clearTimeout(p._disconnectTimer);
        p._disconnectTimer = setTimeout(() => {
          if (!p.connected) {
            io.to(room.code).emit('player_disconnected', { playerId: p.id, name: p.name });
            emitRoomState(io, room);
          }
          p._disconnectTimer = null;
        }, 15000);
        emitRoomState(io, room);
        const allGone = room.players.every(p => !p.connected);
        if (allGone) { lobby.remove(code); setTimeout(() => { if (rooms[code]) delete rooms[code]; }, 30 * 60 * 1000); }
        break;
      }
    }
  });
}

module.exports = { register, getRoomCount, getRoomByCode };
