const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const compression = require('compression');

const app = express();
app.use(compression()); // gzip all responses

// Game routes
app.get('/taboo', (req, res) => res.sendFile(path.join(__dirname, 'public/taboo.html')));
app.get('/games', (req, res) => res.sendFile(path.join(__dirname, 'public/games.html')));
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
      gracePeriod: settings.gracePeriod || 20,
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
      readyPlayers: {}, // { playerId: true } — players who marked ready on scoring screen
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

    // All valid answers submitted by any player in this category
    const validAnswers = Object.values(answers).filter(a => a && startsWithLetter(a, state.letter));

    // How many times each answer appears
    const counts = {};
    validAnswers.forEach(a => counts[a] = (counts[a]||0)+1);

    // How many players submitted ANY valid answer in this category
    const totalValidPlayers = validAnswers.length;

    playerIds.forEach(pid => {
      const key = `${rIdx}_${pid}_${ci}`;
      if (state.challenged[key]) {
        // Voted out by challenge
        state.scores[rIdx][pid][ci] = 0;
      } else {
        const ans = answers[pid];
        if (!ans || !startsWithLetter(ans, state.letter)) {
          // Blank or wrong letter
          state.scores[rIdx][pid][ci] = 0;
        } else if (counts[ans] > 1) {
          // Duplicate — same word as at least one other player
          state.scores[rIdx][pid][ci] = 5;
        } else if (totalValidPlayers === 1) {
          // Unique AND everyone else left this category blank → 15pts
          state.scores[rIdx][pid][ci] = 15;
        } else {
          // Unique BUT at least one other player also filled in something → 10pts
          state.scores[rIdx][pid][ci] = 10;
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
    const trimmedName = (name || '').trim();
    if (!trimmedName) { socket.emit('error', { msg: 'Please enter your name before creating a room.' }); return; }
    const room = makeRoom(socket.id, settings || {});
    room.players.push({ id: socket.id, name: trimmedName, connected: true });
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

    const trimmedName = (name || 'Player').trim();

    // Check for duplicate name — allow if it is the same socket reconnecting
    const nameTaken = room.players.find(p =>
      p.name.toLowerCase() === trimmedName.toLowerCase() && p.id !== socket.id
    );
    if (nameTaken) {
      // If that player is disconnected, let this socket reclaim the name (reconnect)
      if (!nameTaken.connected) {
        nameTaken.id = socket.id;
        nameTaken.connected = true;
        socket.join(room.code);
        socket.emit('room_joined', { code: room.code, isHost: socket.id === room.hostId });
        emitRoomState(room);
        return;
      }
      socket.emit('error', { msg: `The name ${trimmedName} is already taken in this room. Please choose a different name.` });
      return;
    }

    const existing = room.players.find(p => p.id === socket.id);
    if (!existing) {
      room.players.push({ id: socket.id, name: trimmedName, connected: true });
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
    const gracePeriod = (room.settings.gracePeriod || 20) * 1000;
    io.to(room.code).emit('stop_called', { playerName: stopper ? stopper.name : 'Someone', playerId: socket.id, gracePeriod: room.settings.gracePeriod || 20 });
    setTimeout(() => {
      const r = getRoom(code);
      if (r && r.state.phase === 'stopped') moveToScoring(r);
    }, gracePeriod);
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
    if (!room) return;
    const key = `${rIdx}_${playerId}_${catIndex}`;
    if (!room.state.votes[key]) room.state.votes[key] = {};
    room.state.votes[key][socket.id] = isValid;

    // ALL players vote including the challenged player (who defends with "valid")
    const voters = room.players.map(p => p.id);
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

  // MARK READY — any player signals they have reviewed the scores
  socket.on('mark_ready', ({ code }) => {
    const room = getRoom(code);
    if (!room || room.state.phase !== 'scoring') return;
    room.state.readyPlayers[socket.id] = true;
    const connectedPlayers = room.players.filter(p => p.connected);
    const allReady = connectedPlayers.every(p => room.state.readyPlayers[p.id]);
    emitRoomState(room);
    // If all players ready and this is the host, auto-advance
    if (allReady && socket.id === room.hostId) {
      // Small delay so everyone sees the "all ready" state
      setTimeout(() => {
        const r = getRoom(code);
        if (r && r.state.phase === 'scoring') {
          advanceFromScoring(r);
        }
      }, 1000);
    }
  });

  // NEXT ROUND — host only (prevents double-trigger)
  socket.on('next_round', ({ code }) => {
    const room = getRoom(code);
    if (!room || socket.id !== room.hostId) return;
    advanceFromScoring(room);
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

function advanceFromScoring(room) {
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
}

function startNextRound(room) {
  room.state.round++;
  room.state.phase = 'drawing';
  room.state.letter = '';
  room.state.stopCalledBy = null;
  room.state.activeChallenge = null;
  room.state.readyPlayers = {};
  room.state.answers = {};
  room.players.forEach(p => room.state.answers[p.id] = {});
  // Rotate drawing player each round
  room.state.drawingPlayerIndex = (room.state.round - 1) % room.players.filter(p => p.connected).length;
  emitRoomState(room);
}

function moveToScoring(room) {
  // Compute scores immediately, then show calculating briefly before scoring
  computeRoundScores(room);
  room.state.phase = 'calculating';
  emitRoomState(room);
  setTimeout(() => {
    room.state.phase = 'scoring';
    emitRoomState(room);
  }, 800);
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

// ════════════════════════════════════════════════════════
// TABOO GAME SERVER
// ════════════════════════════════════════════════════════
const tabooRooms = {};

function generateTabooCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code;
  do { code = 'T' + Array.from({length:4}, () => chars[Math.floor(Math.random()*chars.length)]).join(''); }
  while (tabooRooms[code]);
  return code;
}

function makeTabooRoom(hostId, settings) {
  const code = generateTabooCode();
  tabooRooms[code] = {
    code, hostId,
    settings: {
      rounds: settings.rounds || 5,
      turnTime: settings.turnTime || 60,
      lang: settings.lang || 'en',
    },
    players: [],
    state: {
      phase: 'lobby',
      round: 0,
      describerIndex: 0,
      refereeIndex: 1,
      currentWord: null,
      scores: [],
      totalScores: {},
      usedWords: [],
      turnTimer: null,
    }
  };
  return tabooRooms[code];
}

function getTabooRoom(code) { return tabooRooms[code]; }

function emitTabooState(room) {
  const state = {
    phase: room.state.phase,
    round: room.state.round,
    totalRounds: room.settings.rounds,
    hostId: room.hostId,
    players: room.players.map(p => ({ id: p.id, name: p.name, connected: p.connected })),
    settings: room.settings,
    describerIndex: room.state.describerIndex,
    refereeIndex: room.state.refereeIndex,
    currentWord: room.state.currentWord,
    scores: room.state.scores,
    totalScores: room.state.totalScores,
  };
  io.to(room.code).emit('taboo_state', state);
}

function getNextTabooWord(room) {
  const lang = room.settings.lang || 'en';
  // Server doesn't have TABOO_WORDS — words are picked client-side
  // Server just tracks state and scoring
  return null;
}

function startTabooTurn(room) {
  const code = room.code;
  room.state.phase = 'playing';
  room.state.currentWord = null; // client will request a word
  emitTabooState(room);

  // Start countdown timer on server
  let remaining = room.settings.turnTime || 60;
  if (room.state.turnTimer) clearInterval(room.state.turnTimer);
  room.state.turnTimer = setInterval(() => {
    remaining--;
    io.to(code).emit('taboo_timer_tick', { remaining });
    if (remaining <= 0) {
      clearInterval(room.state.turnTimer);
      endTabooTurn(room);
    }
  }, 1000);
}

function endTabooTurn(room) {
  if (room.state.turnTimer) { clearInterval(room.state.turnTimer); room.state.turnTimer = null; }
  room.state.phase = 'roundend';
  room.state.round++;

  // Rotate describer and referee for next round
  const playerCount = room.players.filter(p => p.connected !== false).length;
  room.state.describerIndex = (room.state.describerIndex + 2) % Math.max(playerCount, 1);
  room.state.refereeIndex = (room.state.describerIndex + 1) % Math.max(playerCount, 1);

  emitTabooState(room);
}

// Taboo socket events
io.on('connection', (socket) => {
  socket.on('taboo_create', ({ name, settings }) => {
    const room = makeTabooRoom(socket.id, settings || {});
    room.players.push({ id: socket.id, name: name || 'Host', connected: true });
    room.state.totalScores[socket.id] = 0;
    socket.join(room.code);
    socket.emit('taboo_room_created', { code: room.code });
    emitTabooState(room);
  });

  socket.on('taboo_join', ({ code, name }) => {
    const room = getTabooRoom(code.toUpperCase().trim());
    if (!room) { socket.emit('taboo_error', { msg: 'Room not found.' }); return; }
    if (room.state.phase !== 'lobby') { socket.emit('taboo_error', { msg: 'Game already started.' }); return; }
    if (room.players.length >= 12) { socket.emit('taboo_error', { msg: 'Room is full.' }); return; }
    const existing = room.players.find(p => p.name.toLowerCase() === name.toLowerCase() && !p.connected);
    if (existing) {
      existing.id = socket.id; existing.connected = true;
    } else {
      if (room.players.find(p => p.name.toLowerCase() === name.toLowerCase() && p.connected)) {
        socket.emit('taboo_error', { msg: 'Name already taken.' }); return;
      }
      room.players.push({ id: socket.id, name: name || 'Player', connected: true });
      room.state.totalScores[socket.id] = 0;
    }
    socket.join(room.code);
    socket.emit('taboo_room_joined', { code: room.code });
    emitTabooState(room);
  });

  socket.on('taboo_update_settings', ({ code, settings }) => {
    const room = getTabooRoom(code);
    if (!room || socket.id !== room.hostId) return;
    room.settings = { ...room.settings, ...settings };
    emitTabooState(room);
  });

  socket.on('taboo_start', ({ code }) => {
    const room = getTabooRoom(code);
    if (!room || socket.id !== room.hostId) return;
    if (room.players.length < 2) { socket.emit('taboo_error', { msg: 'Need at least 2 players.' }); return; }
    room.state.round = 0;
    room.state.scores = [];
    room.state.usedWords = [];
    room.players.forEach(p => room.state.totalScores[p.id] = 0);
    room.state.describerIndex = 0;
    room.state.refereeIndex = 1;
    startTabooTurn(room);
  });

  socket.on('taboo_word_request', ({ code, word, forbidden }) => {
    // Describer requests the current word to be set (word chosen client-side)
    const room = getTabooRoom(code);
    if (!room || room.state.phase !== 'playing') return;
    const connected = room.players.filter(p => p.connected !== false);
    const describer = connected[room.state.describerIndex % connected.length];
    if (!describer || socket.id !== describer.id) return;
    room.state.currentWord = { word, forbidden };
    if (!room.state.scores[room.state.round]) room.state.scores[room.state.round] = {};
    emitTabooState(room);
  });

  socket.on('taboo_got_it', ({ code }) => {
    const room = getTabooRoom(code);
    if (!room || room.state.phase !== 'playing') return;
    const connected = room.players.filter(p => p.connected !== false);
    const describer = connected[room.state.describerIndex % connected.length];
    if (!describer || socket.id !== describer.id) return;
    // Award point to describer's team (simplified: award to describer)
    const rIdx = room.state.round;
    if (!room.state.scores[rIdx]) room.state.scores[rIdx] = {};
    room.state.scores[rIdx][socket.id] = (room.state.scores[rIdx][socket.id] || 0) + 1;
    room.state.totalScores[socket.id] = (room.state.totalScores[socket.id] || 0) + 1;
    const word = room.state.currentWord ? room.state.currentWord.word : '';
    io.to(room.code).emit('taboo_score_event', { type: 'correct', word });
    room.state.currentWord = null; // Trigger new word request
    emitTabooState(room);
  });

  socket.on('taboo_skip', ({ code }) => {
    const room = getTabooRoom(code);
    if (!room || room.state.phase !== 'playing') return;
    const word = room.state.currentWord ? room.state.currentWord.word : '';
    io.to(room.code).emit('taboo_score_event', { type: 'skip', word });
    room.state.currentWord = null;
    emitTabooState(room);
  });

  socket.on('taboo_penalty', ({ code }) => {
    const room = getTabooRoom(code);
    if (!room || room.state.phase !== 'playing') return;
    const connected = room.players.filter(p => p.connected !== false);
    const describer = connected[room.state.describerIndex % connected.length];
    if (describer) {
      const rIdx = room.state.round;
      if (!room.state.scores[rIdx]) room.state.scores[rIdx] = {};
      room.state.scores[rIdx][describer.id] = Math.max(0, (room.state.scores[rIdx][describer.id] || 0) - 1);
      room.state.totalScores[describer.id] = Math.max(0, (room.state.totalScores[describer.id] || 0) - 1);
    }
    io.to(room.code).emit('taboo_score_event', { type: 'penalty', word: '' });
    room.state.currentWord = null;
    emitTabooState(room);
  });

  socket.on('taboo_next_round', ({ code }) => {
    const room = getTabooRoom(code);
    if (!room || socket.id !== room.hostId) return;
    if (room.state.round >= room.settings.rounds) {
      if (room.state.turnTimer) clearInterval(room.state.turnTimer);
      room.state.phase = 'final';
      emitTabooState(room);
    } else {
      startTabooTurn(room);
    }
  });

  socket.on('taboo_keep_alive', ({ code }) => {
    const room = getTabooRoom(code);
    if (room) { /* keep alive */ }
  });
});
