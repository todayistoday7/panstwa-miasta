// ════════════════════════════════════════════════════════
// TABOO — Game Logic (Team Mode)
// ════════════════════════════════════════════════════════
'use strict';
const lobby = require('./lobby');

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
    isPublic: settings.isPublic || false,
    settings: {
      rounds:   settings.rounds   || 5,
      turnTime: settings.turnTime || 60,
      lang:     settings.lang     || 'en',
      isPublic: settings.isPublic || false,
    },
    players: [],
    state: {
      phase:              'lobby',
      round:              0,
      roundJustPlayed:    -1,
      teams:              { red: [], blue: [] },
      describerTeam:      'red',
      turnDescriber:      null,
      turnReferee:        null,
      redDescriberIndex:  0,
      blueDescriberIndex: 0,
      currentWord:        null,
      scores:             [],
      teamTotals:         { red: 0, blue: 0 },
      usedWords:          [],
      turnTimer:          null,
      turnTimeRemaining:  0,
    }
  };
  return tabooRooms[code];
}

function getTabooRoom(code)  { return tabooRooms[code]; }
function getTabooRoomCount() { return Object.keys(tabooRooms).length; }

function assignTeams(room) {
  const players = room.players.filter(p => p.connected !== false).map(p => p.id);
  for (let i = players.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [players[i], players[j]] = [players[j], players[i]];
  }
  const mid = Math.ceil(players.length / 2);
  room.state.teams.red  = players.slice(0, mid);
  room.state.teams.blue = players.slice(mid);
}

function opposingTeam(team) { return team === 'red' ? 'blue' : 'red'; }

function nextDescriber(room, team) {
  const members = room.state.teams[team].filter(id => {
    const p = room.players.find(pl => pl.id === id);
    return p && p.connected !== false;
  });
  if (!members.length) return null;
  const key = team === 'red' ? 'redDescriberIndex' : 'blueDescriberIndex';
  const idx = room.state[key] % members.length;
  room.state[key]++;
  return members[idx];
}

function pickReferee(room, teamName) {
  const members = room.state.teams[teamName].filter(id => {
    const p = room.players.find(pl => pl.id === id);
    return p && p.connected !== false;
  });
  return members.length ? members[0] : null;
}

function emitTabooState(io, room) {
  io.to(room.code).emit('taboo_state', {
    phase:             room.state.phase,
    round:             room.state.round,
    roundJustPlayed:   room.state.roundJustPlayed,
    totalRounds:       room.settings.rounds,
    hostId:            room.hostId,
    players:           room.players.map(p => ({ id: p.id, name: p.name, connected: p.connected })),
    settings:          { ...room.settings, isPublic: room.isPublic },
    teams:             room.state.teams,
    describerTeam:     room.state.describerTeam,
    turnDescriber:     room.state.turnDescriber,
    turnReferee:       room.state.turnReferee,
    currentWord:       room.state.currentWord,
    scores:            room.state.scores,
    teamTotals:        room.state.teamTotals,
    turnTimeRemaining: room.state.turnTimeRemaining,
  });
}

function startTabooTurn(io, room) {
  const code         = room.code;
  const describingTeam = room.state.describerTeam;
  const opponentTeam   = opposingTeam(describingTeam);

  room.state.turnDescriber = nextDescriber(room, describingTeam);
  room.state.turnReferee   = pickReferee(room, opponentTeam);
  room.state.phase         = 'playing';
  room.state.currentWord   = null;
  emitTabooState(io, room);

  let remaining = room.settings.turnTime || 60;
  room.state.turnTimeRemaining = remaining;
  if (room.state.turnTimer) clearInterval(room.state.turnTimer);
  room.state.turnTimer = setInterval(() => {
    remaining--;
    room.state.turnTimeRemaining = remaining;
    io.to(code).emit('taboo_timer_tick', { remaining });
    if (remaining <= 0) {
      clearInterval(room.state.turnTimer);
      endTabooTurn(io, room);
    }
  }, 1000);
}

function endTabooTurn(io, room) {
  if (room.state.turnTimer) { clearInterval(room.state.turnTimer); room.state.turnTimer = null; }
  room.state.roundJustPlayed = room.state.round;
  room.state.phase           = 'roundend';
  room.state.round++;
  room.state.describerTeam   = opposingTeam(room.state.describerTeam);
  emitTabooState(io, room);
}

// ─── REGISTER SOCKET EVENTS ──────────────────────────────────────
function register(io, socket) {

  socket.on('taboo_create', ({ name, settings }) => {
    const room = makeTabooRoom(socket.id, settings || {});
    room.players.push({ id: socket.id, name: name || 'Host', connected: true });
    socket.join(room.code);
    socket.emit('taboo_room_created', { code: room.code });
    lobby.announce('taboo', room);
    room._lobbyTimer = setTimeout(() => {
      if (tabooRooms[room.code] && tabooRooms[room.code].state.phase === 'lobby') delete tabooRooms[room.code];
    }, 24 * 60 * 60 * 1000);
    assignTeams(room);
    emitTabooState(io, room);
  });

  socket.on('taboo_join', ({ code, name }) => {
    const room = getTabooRoom(code.toUpperCase().trim());
    if (!room) { socket.emit('taboo_error', { msg: 'Room not found.' }); return; }
    if (room.state.phase === 'final')  { socket.emit('taboo_error', { msg: 'This game has ended.' }); return; }
    if (room.state.phase !== 'lobby')  { socket.emit('taboo_error', { msg: 'Game already started.' }); return; }
    if (room.players.length >= 12)    { socket.emit('taboo_error', { msg: 'Room is full.' }); return; }

    const existing = room.players.find(p => p.name.toLowerCase() === name.toLowerCase() && !p.connected);
    if (existing) {
      existing.id = socket.id; existing.connected = true;
    } else {
      if (room.players.find(p => p.name.toLowerCase() === name.toLowerCase() && p.connected)) {
        socket.emit('taboo_error', { msg: 'Name already taken.' }); return;
      }
      room.players.push({ id: socket.id, name: name || 'Player', connected: true });
    }
    socket.join(room.code);
    socket.emit('taboo_room_joined', { code: room.code });
    assignTeams(room);
    lobby.announce('taboo', room);
    emitTabooState(io, room);
  });

  socket.on('taboo_update_settings', ({ code, settings }) => {
    const room = getTabooRoom(code);
    if (!room || socket.id !== room.hostId) return;
    room.settings = { ...room.settings, ...settings };
    if (settings.isPublic !== undefined) { room.isPublic = settings.isPublic; room.settings.isPublic = settings.isPublic; }
    lobby.announce('taboo', room);
    emitTabooState(io, room);
  });

  socket.on('taboo_reshuffle', ({ code }) => {
    const room = getTabooRoom(code);
    if (!room || socket.id !== room.hostId || room.state.phase !== 'lobby') return;
    assignTeams(room);
    emitTabooState(io, room);
  });

  socket.on('taboo_start', ({ code }) => {
    const room = getTabooRoom(code);
    if (!room || socket.id !== room.hostId) return;
    if (room.players.filter(p => p.connected).length < 4) {
      socket.emit('taboo_error', { msg: 'Need at least 4 players (2 per team).' }); return;
    }
    if (room._lobbyTimer) { clearTimeout(room._lobbyTimer); room._lobbyTimer = null; }
    room.state.round              = 0;
    room.state.roundJustPlayed    = -1;
    room.state.scores             = [];
    room.state.usedWords          = [];
    room.state.teamTotals         = { red: 0, blue: 0 };
    room.state.redDescriberIndex  = 0;
    room.state.blueDescriberIndex = 0;
    room.state.describerTeam      = 'red';
    assignTeams(room);
    lobby.remove(room.code);
    startTabooTurn(io, room);
  });

  socket.on('taboo_word_request', ({ code, word, forbidden }) => {
    const room = getTabooRoom(code);
    if (!room || room.state.phase !== 'playing') return;
    if (socket.id !== room.state.turnDescriber) return;
    room.state.currentWord = { word, forbidden };
    if (!room.state.scores[room.state.round]) room.state.scores[room.state.round] = { red: 0, blue: 0 };
    emitTabooState(io, room);
  });

  socket.on('taboo_got_it', ({ code }) => {
    const room = getTabooRoom(code);
    if (!room || room.state.phase !== 'playing') return;
    if (socket.id !== room.state.turnDescriber) return;
    const team = room.state.describerTeam;
    const rIdx = room.state.round;
    if (!room.state.scores[rIdx]) room.state.scores[rIdx] = { red: 0, blue: 0 };
    room.state.scores[rIdx][team]++;
    room.state.teamTotals[team]++;
    const word = room.state.currentWord ? room.state.currentWord.word : '';
    io.to(room.code).emit('taboo_score_event', { type: 'correct', word, team });
    room.state.currentWord = null;
    emitTabooState(io, room);
  });

  socket.on('taboo_skip', ({ code }) => {
    const room = getTabooRoom(code);
    if (!room || room.state.phase !== 'playing') return;
    if (socket.id !== room.state.turnDescriber) return;
    const word = room.state.currentWord ? room.state.currentWord.word : '';
    io.to(room.code).emit('taboo_score_event', { type: 'skip', word });
    room.state.currentWord = null;
    emitTabooState(io, room);
  });

  socket.on('taboo_penalty', ({ code }) => {
    const room = getTabooRoom(code);
    if (!room || room.state.phase !== 'playing') return;
    if (socket.id !== room.state.turnReferee) return;
    const penaltyTeam = opposingTeam(room.state.describerTeam);
    const rIdx        = room.state.round;
    if (!room.state.scores[rIdx]) room.state.scores[rIdx] = { red: 0, blue: 0 };
    room.state.scores[rIdx][penaltyTeam]++;
    room.state.teamTotals[penaltyTeam]++;
    io.to(room.code).emit('taboo_score_event', { type: 'penalty', word: '', team: penaltyTeam });
    room.state.currentWord = null;
    emitTabooState(io, room);
  });

  socket.on('taboo_next_round', ({ code }) => {
    const room = getTabooRoom(code);
    if (!room || socket.id !== room.hostId) return;
    if (room.state.round >= room.settings.rounds) {
      if (room.state.turnTimer) clearInterval(room.state.turnTimer);
      room.state.phase = 'final';
      emitTabooState(io, room);
      lobby.remove(room.code);
      setTimeout(() => { if (tabooRooms[room.code]) delete tabooRooms[room.code]; }, 60 * 60 * 1000);
    } else {
      startTabooTurn(io, room);
    }
  });

  socket.on('taboo_keep_alive', ({ code }) => {
    // keeps socket warm — no-op
  });

  socket.on('taboo_rejoin', ({ code, name }) => {
    const room = getTabooRoom(code);
    if (!room) { socket.emit('taboo_error', { msg: 'Room expired.' }); return; }
    const existing = room.players.find(p => p.name === name);
    if (existing) {
      const oldId = existing.id;
      ['red','blue'].forEach(team => {
        room.state.teams[team] = room.state.teams[team].map(id => id === oldId ? socket.id : id);
      });
      if (room.state.turnDescriber === oldId) room.state.turnDescriber = socket.id;
      if (room.state.turnReferee   === oldId) room.state.turnReferee   = socket.id;
      if (room.hostId              === oldId) room.hostId              = socket.id;
      existing.id        = socket.id;
      existing.connected = true;
    } else {
      if (room.state.phase !== 'lobby') {
        socket.emit('taboo_error', { msg: 'Room already started — player not found.' }); return;
      }
      room.players.push({ id: socket.id, name, connected: true });
      assignTeams(room);
    }
    socket.join(room.code);
    socket.emit('taboo_room_joined', { code: room.code });
    if (room.state.phase === 'playing') {
      socket.emit('taboo_timer_tick', { remaining: room.state.turnTimeRemaining });
    }
    lobby.announce('taboo', room);
    emitTabooState(io, room);
  });

  // Disconnect: mark player offline, promote new host if needed, clean up empty rooms
  socket.on('disconnect', () => {
    for (const code of Object.keys(tabooRooms)) {
      const room = tabooRooms[code];
      const p    = room.players.find(p => p.id === socket.id);
      if (!p) continue;
      p.connected = false;

      // Promote next connected player to host (covers lobby + in-game)
      if (socket.id === room.hostId) {
        const next = room.players.find(pl => pl.connected && pl.id !== socket.id);
        if (next) room.hostId = next.id;
      }

      emitTabooState(io, room);

      // Clean up room if everyone left
      const allGone = room.players.every(pl => !pl.connected);
      if (allGone) {
        if (room.state.turnTimer) clearInterval(room.state.turnTimer);
        setTimeout(() => { if (tabooRooms[code]) delete tabooRooms[code]; }, 30 * 60 * 1000);
      }
      break;
    }
  });
}

module.exports = { register, getTabooRoomCount };
// Note: disconnect handler appended below register()
