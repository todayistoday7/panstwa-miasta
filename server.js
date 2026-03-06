const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
  transports: ["websocket", "polling"],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000
});

app.use(express.static(path.join(__dirname, 'public')));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', rooms: Object.keys(rooms).length }));

// Debug: confirm a room code exists
app.get('/room/:code', (req, res) => {
  const room = rooms[req.params.code.toUpperCase()];
  if (!room) return res.json({ exists: false });
  res.json({ exists: true, players: room.players.length, phase: room.state.phase });
});

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
    code, hostId,
    settings: {
      totalRounds: settings.totalRounds || 5,
      categories: settings.categories || ['Country','City','Animal','Plant','Thing','Name','Color','Job'],
      lang: settings.lang || 'en',
    },
    players: [],
    state: {
      phase: 'lobby',
      round: 0,
      letter: '',
      usedLetters: [],
      stopCalledBy: null,
      timerStart: null,
      drawingPlayerIndex: 0, // whose turn it is to draw the letter
      answers: {},
      scores: [],
      totalScores: {},
      challenged: {},
      votes: {},
      activeChallenge: null, // { rIdx, playerId, catIndex, challengerId }
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

// Promote next connected player to host
function promoteNewHost(room) {
  const next = room.players.find(p => p.connected && p.id !== room.hostId);
  if (next) {
    room.hostId = next.id;
    io.to(room.code).emit('new_host', { playerId: next.id, name: next.name });
  }
}

function getDrawingPlayer(room) {
  const connected = room.players.filter(p => p.connected);
  if (!connected.length) return null;
  const idx = room.state.drawingPlayerIndex % connected.length;
  return connected[idx];
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
    validAnswers.forEach(a => counts[a] = (counts[a]||0)+1);

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

  // REJOIN
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
    // If there was no host, promote this player
    if (!room.players.find(p => p.id === room.hostId && p.connected)) {
      room.hostId = socket.id;
    }
    socket.join(room.code);
    socket.emit('room_joined', { code: room.code, isHost: socket.id === room.hostId });
    emitRoomState(room);
  });

  // UPDATE SETTINGS — any connected player in lobby can change settings
  socket.on('update_settings', ({ code, settings }) => {
    const room = getRoom(code);
    if (!room || room.state.phase !== 'lobby') return;
    room.settings = { ...room.settings, ...settings };
    emitRoomState(room);
  });

  // START GAME — any player can start (no host restriction)
  socket.on('start_game', ({ code }) => {
    const room = getRoom(code);
    if (!room) return;
    if (room.players.filter(p => p.connected).length < 2) {
      socket.emit('error', { msg: 'Need at least 2 players.' }); return;
    }
    room.state.phase = 'drawing';
    room.state.round = 0;
    room.state.usedLetters = [];
    room.state.scores = [];
    room.state.challenged = {};
    room.state.votes = {};
    room.state.drawingPlayerIndex = 0;
    room.players.forEach(p => room.state.totalScores[p.id] = 0);
    startNextRound(room);
  });

  // DRAW LETTER — only the designated drawing player for this round
  socket.on('draw_letter', ({ code }) => {
    const room = getRoom(code);
    if (!room || room.state.phase !== 'drawing') return;
    const drawer = getDrawingPlayer(room);
    if (!drawer || drawer.id !== socket.id) return; // not your turn
    const available = ALPHABET.filter(l => !room.state.usedLetters.includes(l));
    if (!available.length) { endGame(room); return; }
    const letter = available[Math.floor(Math.random() * available.length)];
    room.state.letter = letter;
    room.state.usedLetters.push(letter);
    io.to(room.code).emit('letter_drawn', { letter });
  });

  // CONFIRM LETTER & START — only the drawing player
  socket.on('start_round', ({ code }) => {
    const room = getRoom(code);
    if (!room) return;
    const drawer = getDrawingPlayer(room);
    if (!drawer || drawer.id !== socket.id) return;
    room.state.phase = 'playing';
    room.state.stopCalledBy = null;
    room.state.answers = {};
    room.state.timerStart = Date.now();
    room.players.forEach(p => { room.state.answers[p.id] = {}; });
    emitRoomState(room);
  });

  // SUBMIT ANSWER
  socket.on('submit_answer', ({ code, catIndex, value }) => {
    const room = getRoom(code);
    if (!room || room.state.phase !== 'playing') return;
    if (!room.state.answers[socket.id]) room.state.answers[socket.id] = {};
    room.state.answers[socket.id][catIndex] = value;
    io.to(room.code).emit('answer_updated', { playerId: socket.id, catIndex, value });
  });

  // CALL STOP
  socket.on('call_stop', ({ code }) => {
    const room = getRoom(code);
    if (!room || room.state.phase !== 'playing') return;
    room.state.phase = 'stopped';
    room.state.stopCalledBy = socket.id;
    const stopper = room.players.find(p => p.id === socket.id);
    io.to(room.code).emit('stop_called', { playerName: stopper ? stopper.name : 'Someone', playerId: socket.id });
    setTimeout(() => {
      const r = getRoom(code);
      if (r && r.state.phase === 'stopped') moveToScoring(r);
    }, 10000);
  });

  // FORCE SCORING — any player (host or not)
  socket.on('force_scoring', ({ code }) => {
    const room = getRoom(code);
    if (!room) return;
    moveToScoring(room);
  });

  // OVERRIDE SCORE — host only (trust issue with scoring)
  socket.on('set_score', ({ code, playerId, rIdx, catIndex, pts }) => {
    const room = getRoom(code);
    if (!room || socket.id !== room.hostId) return;
    if (!room.state.scores[rIdx]) return;
    if (!room.state.scores[rIdx][playerId]) room.state.scores[rIdx][playerId] = {};
    room.state.scores[rIdx][playerId][catIndex] = pts;
    if (pts > 0) delete room.state.challenged[`${rIdx}_${playerId}_${catIndex}`];
    emitRoomState(room);
  });

  // OPEN CHALLENGE — ANY player can challenge ANY other player's answer
  socket.on('open_challenge', ({ code, rIdx, playerId, catIndex }) => {
    const room = getRoom(code);
    if (!room) return;
    if (socket.id === playerId) return; // can't challenge yourself
    // Only one challenge at a time
    if (room.state.activeChallenge) return;
    const key = `${rIdx}_${playerId}_${catIndex}`;
    room.state.votes[key] = {};
    room.state.activeChallenge = { rIdx, playerId, catIndex, challengerId: socket.id };
    io.to(room.code).emit('challenge_opened', {
      rIdx, playerId, catIndex,
      word: (room.state.answers[playerId] || {})[catIndex] || '',
      category: room.settings.categories[catIndex],
      playerName: (room.players.find(p => p.id === playerId) || {}).name || '?',
      challengerName: (room.players.find(p => p.id === socket.id) || {}).name || '?',
    });
  });

  // CAST VOTE — any player except the one being challenged
  socket.on('cast_vote', ({ code, rIdx, playerId, catIndex, isValid }) => {
    const room = getRoom(code);
    if (!room || socket.id === playerId) return;
    const key = `${rIdx}_${playerId}_${catIndex}`;
    if (!room.state.votes[key]) room.state.votes[key] = {};
    room.state.votes[key][socket.id] = isValid;

    const voters = room.players.map(p => p.id).filter(id => id !== playerId);
    const allVoted = voters.every(vid => room.state.votes[key][vid] !== undefined);
    const votesCast = Object.values(room.state.votes[key]);
    const validCount = votesCast.filter(v => v).length;
    const invalidCount = votesCast.filter(v => !v).length;

    io.to(room.code).emit('vote_updated', { rIdx, playerId, catIndex, votes: room.state.votes[key], allVoted, validCount, invalidCount });

    if (allVoted) {
      if (invalidCount > validCount) {
        room.state.challenged[key] = true;
        room.state.scores[rIdx][playerId][catIndex] = 0;
      } else {
        delete room.state.challenged[key];
      }
      computeRoundScores(room);
      room.state.activeChallenge = null;
      io.to(room.code).emit('challenge_closed', { rIdx, playerId, catIndex });
      emitRoomState(room);
    }
  });

  // CLOSE CHALLENGE — challenger or host can close
  socket.on('close_challenge', ({ code, rIdx, playerId, catIndex }) => {
    const room = getRoom(code);
    if (!room) return;
    const ac = room.state.activeChallenge;
    if (!ac) return;
    // Only challenger or host can close
    if (socket.id !== ac.challengerId && socket.id !== room.hostId) return;

    const key = `${rIdx}_${playerId}_${catIndex}`;
    const votes = room.state.votes[key] || {};
    const voters = room.players.map(p => p.id).filter(id => id !== playerId);
    const invalidCount = voters.filter(id => votes[id] === false).length;
    const validCount   = voters.filter(id => votes[id] === true).length;

    if (Object.keys(votes).length > 0) {
      if (invalidCount > validCount) {
        room.state.challenged[key] = true;
        room.state.scores[rIdx][playerId][catIndex] = 0;
      } else {
        delete room.state.challenged[key];
      }
      computeRoundScores(room);
    }

    room.state.activeChallenge = null;
    io.to(room.code).emit('challenge_closed', { rIdx, playerId, catIndex });
    emitRoomState(room);
  });

  // NEXT ROUND — host only (prevents double-trigger)
  socket.on('next_round', ({ code }) => {
    const room = getRoom(code);
    if (!room || socket.id !== room.hostId) return;
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

  // KEEP ALIVE ping — client sends this every 20s to prevent browser throttling
  socket.on('keep_alive', ({ code }) => {
    // just acknowledge so the connection stays warm
    socket.emit('keep_alive_ack');
  });

  // DISCONNECT
  socket.on('disconnect', () => {
    for (const code of Object.keys(rooms)) {
      const room = rooms[code];
      const p = room.players.find(p => p.id === socket.id);
      if (p) {
        p.connected = false;
        // If host disconnected, promote someone else
        if (socket.id === room.hostId) {
          promoteNewHost(room);
        }
        io.to(room.code).emit('player_disconnected', { playerId: socket.id, name: p.name });
        emitRoomState(room);
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
  room.state.activeChallenge = null;
  room.state.answers = {};
  room.players.forEach(p => room.state.answers[p.id] = {});
  // Rotate drawing player each round
  room.state.drawingPlayerIndex = (room.state.round - 1) % room.players.filter(p => p.connected).length;
  emitRoomState(room);
}

function moveToScoring(room) {
  room.state.phase = 'scoring';
  computeRoundScores(room);
  emitRoomState(room);
}

function endGame(room) {
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
