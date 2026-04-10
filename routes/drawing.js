// ════════════════════════════════════════════════════════
// DRAWING TELEPHONE — Game Logic
// Each player writes a word → chains shuffle → alternate
// draw/guess phases → reveal shows full chain per player
// No scoring — pure party fun
// ════════════════════════════════════════════════════════
'use strict';
const lobby = require('./lobby');
const { isBotName, isHoneypot } = require('./botfilter');

const drawingRooms = {};

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code;
  do {
    code = 'D' + Array.from({length:4}, () => chars[Math.floor(Math.random()*chars.length)]).join('');
  } while (drawingRooms[code]);
  return code;
}

function makeRoom(hostId, settings) {
  const code = generateCode();
  drawingRooms[code] = {
    code, hostId,
    isPublic: settings.isPublic || false,
    settings: {
      lang:     settings.lang     || 'en',
      isPublic: settings.isPublic || false,
      drawTime: settings.drawTime || 80,   // seconds to draw
      writeTime:settings.writeTime|| 30,   // seconds to write/guess
    },
    players: [],
    state: {
      phase:      'lobby',   // lobby | writing | playing | reveal | final
      // playing sub-phase handled by step index
      step:       0,         // which step in the chain we're on
      totalSteps: 0,         // = number of players (each chain has N steps)
      chains:     {},        // { originPlayerId: [ {type:'word'|'draw'|'guess', playerId, content} ] }
      assignments:{},        // { playerId: originPlayerId } — who works on which chain this step
      submissions:{},        // { playerId: content } — submissions for current step
      timer:      null,      // server-side step timer
      stepDeadline: 0,       // epoch ms when current step ends
    }
  };
  return drawingRooms[code];
}

function getRoom(code) { return drawingRooms[code]; }
function getDrawingRooms() { return Object.values(drawingRooms); }

function getConnected(room) {
  return room.players.filter(p => p.connected !== false);
}

function emitState(io, room) {
  const connected = getConnected(room);
  // Send personalised state to each player
  connected.forEach(p => {
    const state = buildStateForPlayer(room, p.id);
    io.to(p.id).emit('drawing_state', state);
  });
}

function buildStateForPlayer(room, playerId) {
  const { state, settings } = room;
  const base = {
    phase:       state.phase,
    step:        state.step,
    totalSteps:  state.totalSteps,
    players:     room.players.map(p => ({ id: p.id, name: p.name, connected: p.connected })),
    hostId:      room.hostId,
    settings,
    code:        room.code,
    stepDeadline:state.stepDeadline,
  };

  if (state.phase === 'playing') {
    const originId = state.assignments[playerId];
    const chain = originId ? (state.chains[originId] || []) : [];
    const lastEntry = chain.length > 0 ? chain[chain.length - 1] : null;
    const stepType = state.step % 2 === 0 ? 'word' : 'draw';
    // step 0 = write original word, step 1 = draw, step 2 = guess, step 3 = draw ...
    const myType = state.step === 0 ? 'word' : (state.step % 2 === 1 ? 'draw' : 'guess');
    base.myTask     = myType;           // 'word' | 'draw' | 'guess'
    base.hasSubmitted = !!state.submissions[playerId];
    base.submittedCount = Object.keys(state.submissions).length;
    base.totalPlayers = getConnected(room).length;
    // What to show as context (the previous step's content)
    if (state.step > 0 && lastEntry) {
      if (myType === 'draw') {
        base.wordToDraw = lastEntry.content; // show the word/guess to draw
      } else if (myType === 'guess') {
        base.imageToDraw = lastEntry.content; // show the drawing to guess
      }
    }
  }

  if (state.phase === 'reveal' || state.phase === 'final') {
    // Send all chains for reveal
    base.chains = state.chains;
    base.chainOrder = room.players.map(p => p.id); // order to show chains
  }

  return base;
}

function buildAssignments(room) {
  // Each step rotates which player works on which chain
  // Step 0: player works on their OWN chain (writes the original word)
  // Step 1: player works on the chain STARTED by next player (draws)
  // Step 2: player works on chain started by player+2 (guesses)
  // etc. — circular rotation
  const connected = getConnected(room);
  const n = connected.length;
  const assignments = {};
  connected.forEach((p, i) => {
    const originIdx = (i + room.state.step) % n;
    assignments[p.id] = connected[originIdx].id;
  });
  return assignments;
}

function startStep(io, room) {
  const { state, settings } = room;
  const connected = getConnected(room);

  state.assignments  = buildAssignments(room);
  state.submissions  = {};

  // Timer
  const duration = state.step === 0
    ? settings.writeTime          // writing phase
    : (state.step % 2 === 1 ? settings.drawTime : settings.writeTime);

  state.stepDeadline = Date.now() + duration * 1000;

  if (state.timer) clearTimeout(state.timer);
  state.timer = setTimeout(() => {
    // Auto-advance: fill missing submissions
    connected.forEach(p => {
      if (!state.submissions[p.id]) {
        const myType = state.step === 0 ? 'word' : (state.step % 2 === 1 ? 'draw' : 'guess');
        if (myType === 'draw') {
          // Emit force-submit signal to player — client sends current canvas
          io.to(p.id).emit('draw_force_submit');
          // Give 2s for client to respond, then use empty canvas
          setTimeout(() => {
            if (!state.submissions[p.id]) {
              state.submissions[p.id] = 'data:image/png;base64,'; // empty
            }
          }, 2000);
        } else {
          state.submissions[p.id] = '???';
        }
      }
    });
    setTimeout(() => advanceStep(io, room), 2500);
  }, duration * 1000 + 1000); // +1s grace

  emitState(io, room);
}

function advanceStep(io, room) {
  const { state } = room;
  const connected = getConnected(room);

  // Record submissions into chains
  connected.forEach(p => {
    const originId = state.assignments[p.id];
    if (!originId) return;
    if (!state.chains[originId]) state.chains[originId] = [];
    const myType = state.step === 0 ? 'word' : (state.step % 2 === 1 ? 'draw' : 'guess');
    const content = state.submissions[p.id] || (myType === 'draw' ? null : '???');
    state.chains[originId].push({
      type:     myType,
      playerId: p.id,
      playerName: p.name,
      content,
    });
  });

  state.step++;

  if (state.step >= state.totalSteps) {
    // All steps done — go to reveal
    if (state.timer) clearTimeout(state.timer);
    state.phase = 'reveal';
    emitState(io, room);
  } else {
    startStep(io, room);
  }
}

function register(io, socket) {

  // ── Create room ─────────────────────────────────────
  socket.on('drawing_create', ({ name, settings }) => {
    const trimmed = (name || '').trim();
    if (!trimmed) { socket.emit('drawing_error', { msg: 'Enter your name.' }); return; }
    if (isBotName(trimmed)) { socket.emit('drawing_error', { msg: 'Invalid name.' }); return; }
    const room = makeRoom(socket.id, settings || {});
    room.players.push({ id: socket.id, name: trimmed, connected: true });
    socket.join(room.code);
    socket.emit('drawing_created', { code: room.code });
    lobby.announce('drawing', room);
    room._lobbyTimer = setTimeout(() => {
      if (drawingRooms[room.code] && drawingRooms[room.code].state.phase === 'lobby')
        delete drawingRooms[room.code];
    }, 24 * 60 * 60 * 1000);
    emitState(io, room);
  });

  // ── Join room ────────────────────────────────────────
  socket.on('drawing_join', ({ name, code }) => {
    const trimmed = (name || '').trim();
    const room = getRoom((code || '').toUpperCase().trim());
    if (!room)    { socket.emit('drawing_error', { msg: 'Room not found.' }); return; }
    if (!trimmed) { socket.emit('drawing_error', { msg: 'Enter your name.' }); return; }
    if (isBotName(trimmed)) { socket.emit('drawing_error', { msg: 'Invalid name.' }); return; }

    const existing = room.players.find(p => p.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      if (existing._disconnectTimer) { clearTimeout(existing._disconnectTimer); existing._disconnectTimer = null; }
      // If this player was the host, update hostId to their new socket
      if (room.hostId === existing.id) room.hostId = socket.id;
      existing.id = socket.id; existing.connected = true;
      socket.join(room.code);
      socket.emit('drawing_joined', { code: room.code, isHost: socket.id === room.hostId });
      emitState(io, room);
      return;
    }

    if (room.state.phase !== 'lobby') { socket.emit('drawing_error', { msg: 'Game already started.' }); return; }
    if (room.players.length >= 10)    { socket.emit('drawing_error', { msg: 'Room full (max 10).' }); return; }

    room.players.push({ id: socket.id, name: trimmed, connected: true });
    socket.join(room.code);
    socket.emit('drawing_joined', { code: room.code, isHost: false });
    lobby.announce('drawing', room);
    emitState(io, room);
  });

  // ── Start game ───────────────────────────────────────
  socket.on('drawing_start', ({ code }) => {
    const room = getRoom(code);
    if (!room || socket.id !== room.hostId) return;
    const connected = getConnected(room);
    if (connected.length < 3) {
      socket.emit('drawing_error', { msg: 'Need at least 3 players.' }); return;
    }

    room.state.phase      = 'playing';
    room.state.step       = 0;
    room.state.totalSteps = connected.length; // N players = N steps
    room.state.chains     = {};
    room.state.submissions= {};

    // Initialise empty chains for each player
    connected.forEach(p => { room.state.chains[p.id] = []; });

    if (room._lobbyTimer) { clearTimeout(room._lobbyTimer); room._lobbyTimer = null; }
    lobby.remove(room.code);

    startStep(io, room);
  });

  // ── Submit (word, drawing, or guess) ────────────────
  socket.on('drawing_submit', ({ code, content }) => {
    const room = getRoom(code);
    if (!room || room.state.phase !== 'playing') return;
    if (room.state.submissions[socket.id]) return; // already submitted

    const myType = room.state.step === 0 ? 'word'
      : (room.state.step % 2 === 1 ? 'draw' : 'guess');

    // Validate
    if (myType !== 'draw' && (!content || !content.trim())) return;

    room.state.submissions[socket.id] = myType === 'draw'
      ? (content || null)   // base64 image or null
      : content.trim();

    // Broadcast updated submitted count to all
    emitState(io, room);

    // Auto-advance if everyone has submitted
    const connected = getConnected(room);
    if (Object.keys(room.state.submissions).length >= connected.length) {
      if (room.state.timer) clearTimeout(room.state.timer);
      setTimeout(() => advanceStep(io, room), 800); // small delay for UX
    }
  });

  // ── Advance reveal (host clicks through chains) ──────
  socket.on('drawing_next_reveal', ({ code }) => {
    const room = getRoom(code);
    if (!room || socket.id !== room.hostId) return;
    if (room.state.phase !== 'reveal') return;
    room.state.phase = 'final';
    emitState(io, room);
  });

  // ── Play again ───────────────────────────────────────
  socket.on('drawing_restart', ({ code }) => {
    const room = getRoom(code);
    if (!room || socket.id !== room.hostId) return;
    // Create a new room and move all players into it
    const newRoom = makeRoom(socket.id, room.settings);
    // Add all connected players to new room
    const allPlayers = room.players.filter(p => p.id !== socket.id);
    newRoom.players.push({ id: socket.id, name: room.players.find(p=>p.id===socket.id)?.name || 'Host', connected: true });
    allPlayers.forEach(p => {
      newRoom.players.push({ id: p.id, name: p.name, connected: false });
    });
    // Clean up old room
    if (room.state.timer) clearTimeout(room.state.timer);
    lobby.remove(code);
    delete drawingRooms[code];
    // Notify all players to rejoin new room
    socket.join(newRoom.code);
    socket.emit('drawing_joined', { code: newRoom.code, isHost: true });
    emitState(io, newRoom);
    // Send rematch event to all other players
    allPlayers.forEach(p => {
      io.to(p.id).emit('drawing_rematch', { code: newRoom.code });
    });
    lobby.announce('drawing', newRoom);
  });

  // ── Settings update ──────────────────────────────────
  socket.on('drawing_settings', ({ code, settings }) => {
    const room = getRoom(code);
    if (!room || socket.id !== room.hostId) return;
    if (room.state.phase !== 'lobby') return;
    if (settings.drawTime)  room.settings.drawTime  = settings.drawTime;
    if (settings.writeTime) room.settings.writeTime = settings.writeTime;
    if (settings.lang)      room.settings.lang      = settings.lang;
    if (settings.isPublic !== undefined) room.isPublic = settings.isPublic;
    emitState(io, room);
  });

  // ── Disconnect ───────────────────────────────────────
  socket.on('disconnect', () => {
    for (const [code, room] of Object.entries(drawingRooms)) {
      const p = room.players.find(pl => pl.id === socket.id);
      if (!p) continue;
      p.connected = false;
      if (p._disconnectTimer) clearTimeout(p._disconnectTimer);
      // Grace period: longer in lobby (host may be sharing link via another app)
      // shorter during gameplay to keep chains moving
      const gracePeriod = room.state.phase === 'lobby' ? 300000 : 45000; // 5min lobby, 45s game
      p._disconnectTimer = setTimeout(() => {
        if (!p.connected) {
          room.players = room.players.filter(pl => pl.id !== socket.id);
          if (room.players.length === 0) {
            // In lobby: don't delete immediately, the 24hr _lobbyTimer will clean up
            // In game: clean up now
            if (room.state.phase !== 'lobby') {
              if (room.state.timer) clearTimeout(room.state.timer);
              delete drawingRooms[code];
            }
          } else {
            if (room.hostId === socket.id) {
              const next = room.players.find(pl => pl.connected);
              if (next) room.hostId = next.id;
            }
            emitState(io, room);
          }
        }
      }, gracePeriod);
      emitState(io, room);
      break;
    }
  });
}

module.exports = { register, getDrawingRooms };
