const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

app.use(express.static(path.join(__dirname, 'public')));

// ─── ROOM STATE ──────────────────────────────────────────────────
// rooms[code] = { code, hostId, players, state, settings }
const rooms = {};

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
    code,
    hostId,
    settings: {
      totalRounds: settings.totalRounds || 5,
      categories: settings.categories || ['Country','City','Animal','Plant','Thing','Name','Color','Job'],
      lang: settings.lang || 'en',
    },
    players: [],      // { id, name, isHost, connected }
    state: {
      phase: 'lobby', // lobby | drawing | playing | stopped | scoring | final
      round: 0,
      letter: '',
      usedLetters: [],
      stopCalledBy: null,
      timerStart: null,
      answers: {},    // { playerId: { catIndex: string } }
      scores: [],     // scores[round][playerId][catIndex] = pts
      totalScores: {},// { playerId: pts }
      challenged: {}, // { `r_pid_ci`: true }
      votes: {},      // { `r_pid_ci`: { voterId: bool } }
    }
  };
  return rooms[code];
}

function getRoom(code) { return rooms[code]; }

function getRoomPlayers(room) {
  return room.players.map(p => ({
    id: p.id,
    name: p.name,
    isHost: p.id === room.hostId,
    connected: p.connected,
    totalScore: room.state.totalScores[p.id] || 0,
  }));
}

function emitRoomState(room) {
  io.to(room.code).emit('room_state', {
    code: room.code,
    settings: room.settings,
    players: getRoomPlayers(room),
    state: room.state,
  });
}

function computeRoundScores(room) {
  const { state, settings } = room;
  const rIdx = state.round - 1;
  const playerIds = room.players.map(p => p.id);

  if (!state.scores[rIdx]) state.scores[rIdx] = {};
  playerIds.forEach(pid => { if (!state.scores[rIdx][pid]) state.scores[rIdx][pid] = {}; });

  settings.categories.forEach((cat, ci) => {
    const answers = {};
    playerIds.forEach(pid => {
      answers[pid] = ((state.answers[pid] || {})[ci] || '').trim().toLowerCase();
    });
    const validAnswers = Object.values(answers).filter(a => a && startsWithLetter(a, state.letter));
    const counts = {};
    validAnswers.forEach(a => counts[a] = (counts[a] || 0) + 1);

    playerIds.forEach(pid => {
      const key = `${rIdx}_${pid}_${ci}`;
      if (state.challenged[key]) {
        state.scores[rIdx][pid][ci] = 0;
      } else {
        const ans = answers[pid];
        if (!ans || !startsWithLetter(ans, state.letter)) {
          state.scores[rIdx][pid][ci] = 0;
        } else if (counts[ans] === 1) {
          state.scores[rIdx][pid][ci] = pid === state.stopCalledBy ? 15 : 10;
        } else {
          state.scores[rIdx][pid][ci] = 5;
        }
      }
    });
  });
}

function startsWithLetter(word, letter) {
  return word.charAt(0).toUpperCase() === letter.toUpperCase();
}

// ─── SOCKET EVENTS ───────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log('connect', socket.id);

  // CREATE ROOM
  socket.on('create_room', ({ name, settings }) => {
    const room = makeRoom(socket.id, settings || {});
    room.players.push({ id: socket.id, name: name || 'Host', connected: true });
    room.state.totalScores[socket.id] = 0;
    socket.join(room.code);
    socket.emit('room_created', { code: room.code });
    emitRoomState(room);
  });

  // JOIN ROOM
  socket.on('join_room', ({ code, name }) => {
    const room = getRoom(code.toUpperCase().trim());
    if (!room) { socket.emit('error', { msg: 'Room not found.' }); return; }
    if (room.state.phase !== 'lobby') { socket.emit('error', { msg: 'Game already started.' }); return; }
    if (room.players.length >= 12) { socket.emit('error', { msg: 'Room is full (max 12).' }); return; }

    const existing = room.players.find(p => p.id === socket.id);
    if (!existing) {
      room.players.push({ id: socket.id, name: name || 'Player', connected: true });
      room.state.totalScores[socket.id] = 0;
    }
    socket.join(room.code);
    socket.emit('room_joined', { code: room.code, isHost: socket.id === room.hostId });
    emitRoomState(room);
  });

  // REJOIN (reconnect)
  socket.on('rejoin_room', ({ code, name }) => {
    const room = getRoom(code);
    if (!room) { socket.emit('error', { msg: 'Room expired.' }); return; }
    const existing = room.players.find(p => p.name === name);
    if (existing) {
      existing.id = socket.id;
      existing.connected = true;
      if (room.hostId === existing.id) room.hostId = socket.id;
    } else {
      room.players.push({ id: socket.id, name, connected: true });
      room.state.totalScores[socket.id] = 0;
    }
    socket.join(room.code);
    socket.emit('room_joined', { code: room.code, isHost: socket.id === room.hostId });
    emitRoomState(room);
  });

  // UPDATE SETTINGS (host only)
  socket.on('update_settings', ({ code, settings }) => {
    const room = getRoom(code);
    if (!room || socket.id !== room.hostId) return;
    room.settings = { ...room.settings, ...settings };
    emitRoomState(room);
  });

  // START GAME (host only)
  socket.on('start_game', ({ code }) => {
    const room = getRoom(code);
    if (!room || socket.id !== room.hostId) return;
    if (room.players.length < 2) { socket.emit('error', { msg: 'Need at least 2 players.' }); return; }
    room.state.phase = 'drawing';
    room.state.round = 0;
    room.state.usedLetters = [];
    room.state.scores = [];
    room.state.challenged = {};
    room.state.votes = {};
    room.players.forEach(p => room.state.totalScores[p.id] = 0);
    startNextRound(room);
  });

  // DRAW LETTER (host only)
  socket.on('draw_letter', ({ code }) => {
    const room = getRoom(code);
    if (!room || socket.id !== room.hostId || room.state.phase !== 'drawing') return;
    const available = ALPHABET.filter(l => !room.state.usedLetters.includes(l));
    if (!available.length) { endGame(room); return; }
    const letter = available[Math.floor(Math.random() * available.length)];
    room.state.letter = letter;
    room.state.usedLetters.push(letter);
    io.to(room.code).emit('letter_drawn', { letter });
  });

  // CONFIRM LETTER & START PLAYING (host only)
  socket.on('start_round', ({ code }) => {
    const room = getRoom(code);
    if (!room || socket.id !== room.hostId) return;
    room.state.phase = 'playing';
    room.state.stopCalledBy = null;
    room.state.answers = {};
    room.state.timerStart = Date.now();
    room.players.forEach(p => { room.state.answers[p.id] = {}; });
    emitRoomState(room);
  });

  // SUBMIT ANSWER (any player, anytime while playing)
  socket.on('submit_answer', ({ code, catIndex, value }) => {
    const room = getRoom(code);
    if (!room || room.state.phase !== 'playing') return;
    if (!room.state.answers[socket.id]) room.state.answers[socket.id] = {};
    room.state.answers[socket.id][catIndex] = value;
    // Broadcast live to everyone so host can see progress
    io.to(room.code).emit('answer_updated', { playerId: socket.id, catIndex, value });
  });

  // CALL STOP (any player)
  socket.on('call_stop', ({ code }) => {
    const room = getRoom(code);
    if (!room || room.state.phase !== 'playing') return;
    room.state.phase = 'stopped';
    room.state.stopCalledBy = socket.id;
    const stopper = room.players.find(p => p.id === socket.id);
    io.to(room.code).emit('stop_called', { playerName: stopper ? stopper.name : 'Someone', playerId: socket.id });
    // Give 10 seconds for others to finish then auto-score
    setTimeout(() => {
      const r = getRoom(code);
      if (r && r.state.phase === 'stopped') moveToScoring(r);
    }, 10000);
  });

  // FORCE SCORING (host only, skips the 10s wait)
  socket.on('force_scoring', ({ code }) => {
    const room = getRoom(code);
    if (!room || socket.id !== room.hostId) return;
    moveToScoring(room);
  });

  // OVERRIDE SCORE (host only)
  socket.on('set_score', ({ code, playerId, rIdx, catIndex, pts }) => {
    const room = getRoom(code);
    if (!room || socket.id !== room.hostId) return;
    if (!room.state.scores[rIdx]) return;
    if (!room.state.scores[rIdx][playerId]) room.state.scores[rIdx][playerId] = {};
    room.state.scores[rIdx][playerId][catIndex] = pts;
    if (pts > 0) delete room.state.challenged[`${rIdx}_${playerId}_${catIndex}`];
    emitRoomState(room);
  });

  // OPEN CHALLENGE (host only)
  socket.on('open_challenge', ({ code, rIdx, playerId, catIndex }) => {
    const room = getRoom(code);
    if (!room || socket.id !== room.hostId) return;
    room.state.votes[`${rIdx}_${playerId}_${catIndex}`] = {};
    io.to(room.code).emit('challenge_opened', { rIdx, playerId, catIndex,
      word: (room.state.answers[playerId] || {})[catIndex] || '',
      category: room.settings.categories[catIndex],
      playerName: (room.players.find(p=>p.id===playerId)||{}).name || '?',
    });
  });

  // CAST VOTE (any player except the challenged one)
  socket.on('cast_vote', ({ code, rIdx, playerId, catIndex, isValid }) => {
    const room = getRoom(code);
    if (!room || socket.id === playerId) return;
    const key = `${rIdx}_${playerId}_${catIndex}`;
    if (!room.state.votes[key]) room.state.votes[key] = {};
    room.state.votes[key][socket.id] = isValid;

    const voters = room.players.map(p=>p.id).filter(id => id !== playerId);
    const allVoted = voters.every(vid => room.state.votes[key][vid] !== undefined);
    const votesCast = Object.values(room.state.votes[key]);
    const validCount = votesCast.filter(v=>v).length;
    const invalidCount = votesCast.filter(v=>!v).length;

    io.to(room.code).emit('vote_updated', { rIdx, playerId, catIndex, votes: room.state.votes[key], allVoted, validCount, invalidCount });

    if (allVoted) {
      if (invalidCount > validCount) {
        room.state.challenged[key] = true;
        room.state.scores[rIdx][playerId][catIndex] = 0;
      } else {
        delete room.state.challenged[key];
      }
      computeRoundScores(room);
      emitRoomState(room);
    }
  });

  // CLOSE CHALLENGE (host only)
  socket.on('close_challenge', ({ code, rIdx, playerId, catIndex }) => {
    const room = getRoom(code);
    if (!room || socket.id !== room.hostId) return;
    const key = `${rIdx}_${playerId}_${catIndex}`;
    const votes = room.state.votes[key] || {};
    const voters = room.players.map(p=>p.id).filter(id=>id!==playerId);
    const invalidCount = voters.filter(id=>votes[id]===false).length;
    const validCount   = voters.filter(id=>votes[id]===true).length;
    if (invalidCount > validCount) {
      room.state.challenged[key] = true;
      room.state.scores[rIdx][playerId][catIndex] = 0;
    } else {
      delete room.state.challenged[key];
    }
    computeRoundScores(room);
    io.to(room.code).emit('challenge_closed', { rIdx, playerId, catIndex });
    emitRoomState(room);
  });

  // NEXT ROUND (host only)
  socket.on('next_round', ({ code }) => {
    const room = getRoom(code);
    if (!room || socket.id !== room.hostId) return;
    // Bank scores
    const rIdx = room.state.round - 1;
    room.players.forEach(p => {
      const pScores = room.state.scores[rIdx][p.id] || {};
      room.state.totalScores[p.id] = (room.state.totalScores[p.id] || 0) +
        Object.values(pScores).reduce((a,b) => a+b, 0);
    });
    if (room.state.round >= room.settings.totalRounds) {
      endGame(room);
    } else {
      startNextRound(room);
    }
  });

  // DISCONNECT
  socket.on('disconnect', () => {
    for (const code of Object.keys(rooms)) {
      const room = rooms[code];
      const p = room.players.find(p => p.id === socket.id);
      if (p) {
        p.connected = false;
        io.to(room.code).emit('player_disconnected', { playerId: socket.id, name: p.name });
        emitRoomState(room);
        // Clean up empty rooms after 30 min
        const allGone = room.players.every(p => !p.connected);
        if (allGone) setTimeout(() => { if (rooms[code]) delete rooms[code]; }, 30 * 60 * 1000);
        break;
      }
    }
  });
});

function startNextRound(room) {
  room.state.round++;
  room.state.phase = 'drawing';
  room.state.letter = '';
  room.state.stopCalledBy = null;
  room.state.answers = {};
  room.players.forEach(p => room.state.answers[p.id] = {});
  emitRoomState(room);
}

function moveToScoring(room) {
  room.state.phase = 'scoring';
  computeRoundScores(room);
  emitRoomState(room);
}

function endGame(room) {
  // Bank final round if needed
  const rIdx = room.state.round - 1;
  if (room.state.scores[rIdx]) {
    room.players.forEach(p => {
      const pScores = room.state.scores[rIdx][p.id] || {};
      room.state.totalScores[p.id] = (room.state.totalScores[p.id] || 0) +
        Object.values(pScores).reduce((a,b) => a+b, 0);
    });
  }
  room.state.phase = 'final';
  emitRoomState(room);
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🎮 Państwa-Miasta running on http://localhost:${PORT}`));
