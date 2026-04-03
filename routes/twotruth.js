// ════════════════════════════════════════════════════════
// TWO TRUTHS ONE LIE — Game Logic
// Each round: active player submits 3 statements (2 true, 1 lie)
// Everyone else votes which is the lie
// Scoring: correct vote = 1pt · fooling others = 1pt per person fooled
// ════════════════════════════════════════════════════════
'use strict';
const lobby = require('./lobby');

const ttRooms = {};

function generateTTCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code;
  do { code = 'L' + Array.from({length:4}, () => chars[Math.floor(Math.random()*chars.length)]).join(''); }
  while (ttRooms[code]);
  return code;
}

function makeTTRoom(hostId, settings) {
  const code = generateTTCode();
  ttRooms[code] = {
    code, hostId,
    isPublic: settings.isPublic || false,
    settings: {
      lang:     settings.lang     || 'en',
      isPublic: settings.isPublic || false,
    },
    players: [],
    state: {
      phase:          'lobby',    // lobby | writing | voting | reveal | final
      activeIndex:    0,          // index into connected players array
      statements:     null,       // [s1, s2, s3] submitted by active player
      lieIndex:       null,       // 0, 1, or 2 — which statement is the lie
      votes:          {},         // { playerId: 0|1|2 }
      roundScores:    {},         // { playerId: pts } for this round
      totalScores:    {},         // { playerId: cumulative }
      roundsPlayed:   0,
    }
  };
  return ttRooms[code];
}

function getTTRoom(code)  { return ttRooms[code]; }
function getTTRoomCount() { return Object.keys(ttRooms).length; }

function getConnected(room) {
  return room.players.filter(p => p.connected !== false);
}

function getActivePlayer(room) {
  const connected = getConnected(room);
  if (!connected.length) return null;
  return connected[room.state.activeIndex % connected.length];
}

function emitTTState(io, room) {
  const active = getActivePlayer(room);
  const base = {
    phase:        room.state.phase,
    hostId:       room.hostId,
    settings:     { ...room.settings, isPublic: room.isPublic },
    players:      room.players.map(p => ({ id: p.id, name: p.name, connected: p.connected })),
    activeId:     active ? active.id : null,
    // Statements shown to voters but NOT which is the lie
    statements:   room.state.phase === 'voting' || room.state.phase === 'reveal'
                    ? room.state.statements
                    : null,
    lieIndex:     room.state.phase === 'reveal' ? room.state.lieIndex : null,
    votes:        room.state.phase === 'reveal' ? room.state.votes : {},
    hasVoted:     Object.keys(room.state.votes),
    roundScores:  room.state.roundScores,
    totalScores:  room.state.totalScores,
    roundsPlayed: room.state.roundsPlayed,
    totalRounds:  getConnected(room).length, // one round per player
  };

  // Active player sees lieIndex during writing phase
  room.players.forEach(p => {
    if (!p.connected) return;
    const payload = { ...base };
    if (p.id === base.activeId && room.state.phase === 'writing') {
      payload.lieIndex = room.state.lieIndex; // remind them which they picked
    }
    io.to(p.id).emit('tt_state', payload);
  });
}

function promoteTTHost(room) {
  const next = room.players.find(p => p.connected && p.id !== room.hostId);
  if (next) room.hostId = next.id;
}

function scoreRound(room) {
  const { votes, lieIndex } = room.state;
  const active   = getActivePlayer(room);
  const scores   = {};
  let   fooled   = 0;

  room.players.forEach(p => {
    if (!p.connected || p.id === (active && active.id)) return;
    const vote = votes[p.id];
    if (vote === lieIndex) {
      scores[p.id] = 1; // guessed correctly
    } else {
      scores[p.id] = 0;
      fooled++;
    }
  });

  // Active player scores 1 per person they fooled
  if (active) scores[active.id] = fooled;

  room.state.roundScores = scores;
  Object.entries(scores).forEach(([pid, pts]) => {
    room.state.totalScores[pid] = (room.state.totalScores[pid] || 0) + pts;
  });
}

// ─── REGISTER SOCKET EVENTS ──────────────────────────────────────
function register(io, socket) {

  socket.on('tt_create', ({ name, settings }) => {
    const room = makeTTRoom(socket.id, settings || {});
    room.players.push({ id: socket.id, name: name || 'Host', connected: true });
    room.state.totalScores[socket.id] = 0;
    // keepGroup — move all connected players from old room to new one
    if (settings && settings.keepGroup) {
      for (const [code, r] of Object.entries(ttRooms)) {
        if (r.players.find(p => p.id === socket.id)) {
          const oldPlayers = r.players.filter(p => p.connected && p.id !== socket.id);
          if (r._lobbyTimer) clearTimeout(r._lobbyTimer);
          lobby.remove(code);
          io.to(code).emit('room_disbanded', { reason: 'rematch' });
          delete ttRooms[code];
          oldPlayers.forEach(p => {
            room.players.push({ id: p.id, name: p.name, connected: false });
            io.to(p.id).emit('tt_group_rematch', { code: room.code });
          });
          break;
        }
      }
    }

    socket.join(room.code);
    socket.emit('tt_room_created', { code: room.code });
    lobby.announce('twotruth', room);
    room._lobbyTimer = setTimeout(() => {
      if (ttRooms[room.code] && ttRooms[room.code].state.phase === 'lobby')
        delete ttRooms[room.code];
    }, 24 * 60 * 60 * 1000);
    emitTTState(io, room);
  });

  socket.on('tt_join', ({ code, name }) => {
    const room = getTTRoom(code.toUpperCase().trim());
    if (!room) { socket.emit('tt_error', { msg: 'Room not found.' }); return; }
    if (room.state.phase === 'final')  { socket.emit('tt_error', { msg: 'This game has ended.' }); return; }

    // Mid-game rejoin by name
    const existing = room.players.find(p => p.name.toLowerCase() === (name||'').toLowerCase());
    if (existing && room.state.phase !== 'lobby') {
      if (existing._disconnectTimer) { clearTimeout(existing._disconnectTimer); existing._disconnectTimer = null; }
      if (room.hostId === existing.id) room.hostId = socket.id;
      existing.id = socket.id; existing.connected = true;
      // Restore score tracking
      if (room.state.totalScores[existing.id] === undefined) room.state.totalScores[socket.id] = 0;
      socket.join(room.code);
      socket.emit('tt_room_joined', { code: room.code });
      emitTTState(io, room);
      return;
    }

    if (room.state.phase !== 'lobby')  { socket.emit('tt_error', { msg: 'Game already started.' }); return; }
    if (room.players.length >= 20)     { socket.emit('tt_error', { msg: 'Room is full.' }); return; }

    if (existing && !existing.connected) {
      existing.id = socket.id; existing.connected = true;
    } else {
      if (room.players.find(p => p.name.toLowerCase() === (name||'').toLowerCase() && p.connected)) {
        socket.emit('tt_error', { msg: 'Name already taken.' }); return;
      }
      room.players.push({ id: socket.id, name: name || 'Player', connected: true });
      room.state.totalScores[socket.id] = 0;
    }
    socket.join(room.code);
    socket.emit('tt_room_joined', { code: room.code });
    lobby.announce('twotruth', room);
    emitTTState(io, room);
  });

  socket.on('tt_update_settings', ({ code, settings }) => {
    const room = getTTRoom(code);
    if (!room || socket.id !== room.hostId) return;
    room.settings = { ...room.settings, ...settings };
    if (settings.isPublic !== undefined) { room.isPublic = settings.isPublic; room.settings.isPublic = settings.isPublic; }
    lobby.announce('twotruth', room);
    emitTTState(io, room);
  });

  socket.on('tt_start', ({ code }) => {
    const room = getTTRoom(code);
    if (!room || socket.id !== room.hostId) return;
    if (getConnected(room).length < 3) {
      socket.emit('tt_error', { msg: 'Need at least 3 players.' }); return;
    }
    if (room._lobbyTimer) { clearTimeout(room._lobbyTimer); room._lobbyTimer = null; }
    lobby.remove(room.code);
    room.state.phase        = 'writing';
    room.state.activeIndex  = 0;
    room.state.roundsPlayed = 0;
    room.state.totalScores  = {};
    room.players.forEach(p => room.state.totalScores[p.id] = 0);
    room.state.statements   = null;
    room.state.lieIndex     = null;
    room.state.votes        = {};
    room.state.roundScores  = {};
    emitTTState(io, room);
  });

  // Active player submits their 3 statements and which is the lie
  socket.on('tt_submit', ({ code, statements, lieIndex }) => {
    const room = getTTRoom(code);
    if (!room || room.state.phase !== 'writing') return;
    const active = getActivePlayer(room);
    if (!active || socket.id !== active.id) return;
    if (!Array.isArray(statements) || statements.length !== 3) return;
    if (typeof lieIndex !== 'number' || lieIndex < 0 || lieIndex > 2) return;
    if (statements.some(s => !s || !s.trim())) return;

    room.state.statements = statements.map(s => s.trim());
    room.state.lieIndex   = lieIndex;
    room.state.votes      = {};
    room.state.phase      = 'voting';
    emitTTState(io, room);
  });

  // Other players vote
  socket.on('tt_vote', ({ code, voteIndex }) => {
    const room = getTTRoom(code);
    if (!room || room.state.phase !== 'voting') return;
    const active = getActivePlayer(room);
    if (active && socket.id === active.id) return; // active player can't vote
    if (typeof voteIndex !== 'number' || voteIndex < 0 || voteIndex > 2) return;

    room.state.votes[socket.id] = voteIndex;

    // Broadcast vote count (not values)
    io.to(room.code).emit('tt_vote_count', {
      count: Object.keys(room.state.votes).length,
      hasVoted: Object.keys(room.state.votes),
    });

    // Auto-reveal when everyone has voted
    const voters = getConnected(room).filter(p => p.id !== (active && active.id));
    if (voters.every(p => room.state.votes[p.id] !== undefined)) {
      scoreRound(room);
      room.state.phase = 'reveal';
      emitTTState(io, room);
    }
  });

  // Host can force reveal early
  socket.on('tt_reveal', ({ code }) => {
    const room = getTTRoom(code);
    if (!room || room.state.phase !== 'voting') return;
    if (socket.id !== room.hostId) return;
    scoreRound(room);
    room.state.phase = 'reveal';
    emitTTState(io, room);
  });

  // Host advances to next player
  socket.on('tt_next', ({ code }) => {
    const room = getTTRoom(code);
    if (!room || room.state.phase !== 'reveal') return;
    if (socket.id !== room.hostId) return;

    room.state.roundsPlayed++;
    const connected = getConnected(room);

    // Check if everyone has had a turn
    if (room.state.roundsPlayed >= connected.length) {
      room.state.phase = 'final';
      lobby.remove(room.code);
      emitTTState(io, room);
      return;
    }

    room.state.activeIndex = (room.state.activeIndex + 1) % connected.length;
    room.state.phase       = 'writing';
    room.state.statements  = null;
    room.state.lieIndex    = null;
    room.state.votes       = {};
    room.state.roundScores = {};
    emitTTState(io, room);
  });

  socket.on('tt_rejoin', ({ code, name }) => {
    const room = getTTRoom(code);
    if (!room) { socket.emit('tt_error', { msg: 'Room expired.' }); return; }
    if (room.state.phase === 'final') { socket.emit('tt_error', { msg: 'This game has ended.' }); return; }
    const existing = room.players.find(p => p.name === name);
    if (existing) {
      if (room.hostId === existing.id) room.hostId = socket.id;
      existing.id = socket.id; existing.connected = true;
    } else {
      if (room.state.phase !== 'lobby') {
        socket.emit('tt_error', { msg: 'Room already started.' }); return;
      }
      room.players.push({ id: socket.id, name, connected: true });
      room.state.totalScores[socket.id] = 0;
    }
    socket.join(room.code);
    socket.emit('tt_room_joined', { code: room.code });
    lobby.announce('twotruth', room);
    emitTTState(io, room);
  });

  socket.on('tt_keep_alive', () => { /* keep warm */ });

  socket.on('tt_rejoin', ({ code, name }) => {
    const room = ttRooms[code];
    if (!room) { socket.emit('tt_error', { msg: 'Room expired.' }); return; }
    const existing = room.players.find(p => p.name === name);
    if (!existing) { socket.emit('tt_error', { msg: 'Player not found.' }); return; }
    if (existing._disconnectTimer) { clearTimeout(existing._disconnectTimer); existing._disconnectTimer = null; }
    if (room.hostId === existing.id) room.hostId = socket.id;
    existing.id = socket.id; existing.connected = true;
    socket.join(code);
    socket.emit('tt_room_joined', { code });
    emitTTState(io, room);
  });

  socket.on('disconnect', () => {
    for (const code of Object.keys(ttRooms)) {
      const room = ttRooms[code];
      const p    = room.players.find(p => p.id === socket.id);
      if (!p) continue;
      p.connected = false;
      if (p._disconnectTimer) clearTimeout(p._disconnectTimer);
      p._disconnectTimer = setTimeout(() => {
        if (!p.connected) {
          if (room.hostId === p.id) {
            const next = room.players.find(pl => pl.connected && pl.id !== p.id);
            if (next) room.hostId = next.id;
          }
          emitTTState(io, room);
        }
        p._disconnectTimer = null;
      }, 45000);
      emitTTState(io, room);
      const allGone = room.players.every(pl => !pl.connected);
      if (allGone) {
        if (room._lobbyTimer) clearTimeout(room._lobbyTimer);
        setTimeout(() => { if (ttRooms[code]) delete ttRooms[code]; }, 30 * 60 * 1000);
      }
      break;
    }
  });
}

function getTTRooms() { return Object.values(ttRooms); }

module.exports = { getTTRooms, register, getTTRoomCount };
