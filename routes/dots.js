// ════════════════════════════════════════════════════════
// DOTS AND BOXES — Game Logic
// ════════════════════════════════════════════════════════
'use strict';
const lobby = require('./lobby');

const dotsRooms = {};

// Player colours assigned in join order
const PLAYER_COLORS = ['#ff6b35', '#06d6a0', '#ffd166', '#ef476f'];

function generateDotsCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code;
  do { code = 'D' + Array.from({length:4}, () => chars[Math.floor(Math.random()*chars.length)]).join(''); }
  while (dotsRooms[code]);
  return code;
}

// Build a fresh grid state for an N×N box grid
// hLines[r][c] = owner id or null  — (N+1) rows × N cols
// vLines[r][c] = owner id or null  — N rows × (N+1) cols
// boxes[r][c]  = owner id or null  — N rows × N cols
function makeGrid(n) {
  const hLines = Array.from({length: n + 1}, () => Array(n).fill(null));
  const vLines = Array.from({length: n},     () => Array(n + 1).fill(null));
  const boxes  = Array.from({length: n},     () => Array(n).fill(null));
  return { hLines, vLines, boxes };
}

function makeDotsRoom(hostId, settings) {
  const code = generateDotsCode();
  const n    = settings.gridSize || 4;
  dotsRooms[code] = {
    code, hostId,
    isPublic: settings.isPublic || false,
    settings: { gridSize: n, maxPlayers: settings.maxPlayers || 4, totalRounds: settings.totalRounds || 1 },
    players: [],     // { id, name, color, connected, score }
    state: {
      phase:         'lobby',
      currentPlayer: null,   // socket id whose turn it is
      grid:          makeGrid(n),
      totalBoxes:    n * n,
      claimedBoxes:  0,
    }
  };
  return dotsRooms[code];
}

function getDotsRoom(code)  { return dotsRooms[code]; }
function getDotsRoomCount() { return Object.keys(dotsRooms).length; }

function emitDotsState(io, room) {
  io.to(room.code).emit('dots_state', {
    phase:         room.state.phase,
    hostId:        room.hostId,
    players:       room.players.map(p => ({
      id: p.id, name: p.name, color: p.color,
      connected: p.connected, score: p.score,
    })),
    settings:      { ...room.settings, isPublic: room.isPublic,
                   totalRounds: room.settings.totalRounds || 1 },
    totalRounds:   room.settings.totalRounds || 1,
    roundsPlayed:  room.state.roundsPlayed || 0,
    totalRoundsAccum: room.state.totalRoundsAccum || 0,
    currentPlayer: room.state.currentPlayer,
    grid:          room.state.grid,
    claimedBoxes:  room.state.claimedBoxes,
    totalBoxes:    room.state.totalBoxes,
  });
}

// Try to claim a line. Returns array of box coords completed (0, 1 or 2).
function claimLine(grid, type, row, col, playerId) {
  const n = grid.boxes.length;

  // Validate bounds
  if (type === 'h') {
    if (row < 0 || row > n || col < 0 || col >= n) return [];
    if (grid.hLines[row][col] !== null) return [];  // already taken
    grid.hLines[row][col] = playerId;
  } else {
    if (row < 0 || row >= n || col < 0 || col > n) return [];
    if (grid.vLines[row][col] !== null) return [];  // already taken
    grid.vLines[row][col] = playerId;
  }

  // Check which adjacent boxes (up to 2) are now completed
  const completed = [];
  const checkBox = (r, c) => {
    if (r < 0 || r >= n || c < 0 || c >= n) return;
    if (grid.boxes[r][c] !== null) return;
    // A box r,c is complete when all 4 sides are claimed:
    // top=hLines[r][c], bottom=hLines[r+1][c], left=vLines[r][c], right=vLines[r][c+1]
    if (
      grid.hLines[r][c]   !== null &&
      grid.hLines[r+1][c] !== null &&
      grid.vLines[r][c]   !== null &&
      grid.vLines[r][c+1] !== null
    ) {
      grid.boxes[r][c] = playerId;
      completed.push({ r, c });
    }
  };

  if (type === 'h') {
    checkBox(row - 1, col);  // box above
    checkBox(row,     col);  // box below
  } else {
    checkBox(row, col - 1);  // box to the left
    checkBox(row, col);      // box to the right
  }

  return completed;
}

function nextPlayerIndex(room, currentId) {
  const connected = room.players.filter(p => p.connected);
  if (!connected.length) return null;
  const idx = connected.findIndex(p => p.id === currentId);
  return connected[(idx + 1) % connected.length].id;
}

function promoteDotsHost(room) {
  const next = room.players.find(p => p.connected && p.id !== room.hostId);
  if (next) room.hostId = next.id;
}

// ─── REGISTER SOCKET EVENTS ──────────────────────────────────────
function register(io, socket) {

  socket.on('dots_create', ({ name, settings }) => {
    const room = makeDotsRoom(socket.id, settings || {});
    const color = PLAYER_COLORS[0];
    room.players.push({ id: socket.id, name: name || 'Host', color, connected: true, score: 0 });
    socket.join(room.code);
    socket.emit('dots_room_created', { code: room.code });
    lobby.announce('dots', room);
    room._lobbyTimer = setTimeout(() => {
      if (dotsRooms[room.code] && dotsRooms[room.code].state.phase === 'lobby') delete dotsRooms[room.code];
    }, 24 * 60 * 60 * 1000);
    emitDotsState(io, room);
  });

  socket.on('dots_join', ({ code, name }) => {
    const room = getDotsRoom(code.toUpperCase().trim());
    if (!room) { socket.emit('dots_error', { msg: 'Room not found.' }); return; }
    if (room.state.phase === 'final') { socket.emit('dots_error', { msg: 'This game has ended.' }); return; }

    // Mid-game rejoin: if a player with this name exists (even connected — tab duplication),
    // let them back in rather than blocking with "Game already started"
    const existing = room.players.find(p => p.name.toLowerCase() === (name||'').toLowerCase());
    if (existing) {
      if (existing._disconnectTimer) { clearTimeout(existing._disconnectTimer); existing._disconnectTimer = null; }
      if (room.hostId === existing.id) room.hostId = socket.id;
      if (room.state.currentPlayer === existing.id) room.state.currentPlayer = socket.id;
      existing.id = socket.id; existing.connected = true;
      socket.join(room.code);
      socket.emit('dots_room_joined', { code: room.code });
      lobby.announce('dots', room);
      emitDotsState(io, room);
      return;
    }

    // New player — only allowed in lobby
    if (room.state.phase !== 'lobby') { socket.emit('dots_error', { msg: 'Game already started.' }); return; }
    if (room.players.length >= (room.settings.maxPlayers || 4)) {
      socket.emit('dots_error', { msg: 'Room is full.' }); return;
    }
    const color = PLAYER_COLORS[room.players.length % PLAYER_COLORS.length];
    room.players.push({ id: socket.id, name: name || 'Player', color, connected: true, score: 0 });
    socket.join(room.code);
    socket.emit('dots_room_joined', { code: room.code });
    lobby.announce('dots', room);
    emitDotsState(io, room);
  });

  socket.on('dots_update_settings', ({ code, settings }) => {
    const room = getDotsRoom(code);
    if (!room || socket.id !== room.hostId || room.state.phase !== 'lobby') return;
    const n = settings.gridSize || room.settings.gridSize;
    room.settings = { ...room.settings, ...settings, gridSize: n };
    if (settings.isPublic !== undefined) { room.isPublic = settings.isPublic; room.settings.isPublic = settings.isPublic; }
    if (settings.totalRounds !== undefined) room.settings.totalRounds = parseInt(settings.totalRounds) || 1;
    room.state.grid       = makeGrid(n);
    room.state.totalBoxes = n * n;
    lobby.announce('dots', room);
    emitDotsState(io, room);
  });

  socket.on('dots_start', ({ code }) => {
    const room = getDotsRoom(code);
    if (!room || socket.id !== room.hostId) return;
    if (room.players.filter(p => p.connected).length < 2) {
      socket.emit('dots_error', { msg: 'Need at least 2 players.' }); return;
    }
    const n = room.settings.gridSize;
    if (room._lobbyTimer) { clearTimeout(room._lobbyTimer); room._lobbyTimer = null; }
    lobby.remove(room.code);
    room.state.phase         = 'playing';
    room.state.grid          = makeGrid(n);
    room.state.totalBoxes    = n * n;
    room.state.claimedBoxes  = 0;
    room.state.currentPlayer = room.players.find(p => p.connected).id;
    room.state.roundsPlayed  = 1; // first round of this game session
    room.state.totalRoundsAccum = 0; // tracks completed rounds
    room.players.forEach(p => p.score = 0);
    emitDotsState(io, room);
  });

  socket.on('dots_move', ({ code, type, row, col }) => {
    const room = getDotsRoom(code);
    if (!room || room.state.phase !== 'playing') return;
    if (socket.id !== room.state.currentPlayer) return;  // not your turn

    const completed = claimLine(room.state.grid, type, row, col, socket.id);

    if (completed.length === 0 && room.state.grid[type === 'h' ? 'hLines' : 'vLines'][row]?.[col] === socket.id) {
      // Line was just set but no box — this path shouldn't occur due to early return above
      // but handle gracefully
    }

    // Check the line was actually claimed (claimLine returns [] if already taken)
    const lineClaimed = type === 'h'
      ? room.state.grid.hLines[row]?.[col] === socket.id
      : room.state.grid.vLines[row]?.[col] === socket.id;

    if (!lineClaimed) return;  // invalid move

    // Award points for completed boxes
    if (completed.length > 0) {
      const player = room.players.find(p => p.id === socket.id);
      if (player) player.score += completed.length;
      room.state.claimedBoxes += completed.length;
    }

    // Broadcast the move to everyone
    io.to(room.code).emit('dots_move_made', {
      type, row, col,
      playerId:  socket.id,
      completed,
      scores:    Object.fromEntries(room.players.map(p => [p.id, p.score])),
    });

    // Check board complete
    if (room.state.claimedBoxes >= room.state.totalBoxes) {
      const totalRounds = room.settings.totalRounds || 1;
      room.state.totalRoundsAccum = (room.state.totalRoundsAccum || 0) + 1;
      if (room.state.totalRoundsAccum >= totalRounds) {
        // All rounds done — go to final
        room.state.phase = 'final';
        emitDotsState(io, room);
        lobby.remove(room.code);
        setTimeout(() => { if (dotsRooms[room.code]) delete dotsRooms[room.code]; }, 60 * 60 * 1000);
      } else {
        // More rounds to play — go back to lobby for next round
        room.state.phase = 'lobby';
        room.state.roundsPlayed = room.state.totalRoundsAccum + 1;
        emitDotsState(io, room);
      }
      return;
    }

    // If boxes completed, same player goes again — otherwise advance turn
    if (completed.length === 0) {
      room.state.currentPlayer = nextPlayerIndex(room, socket.id);
    }

    emitDotsState(io, room);
  });

  socket.on('dots_rematch', ({ code }) => {
    const room = getDotsRoom(code);
    if (!room || socket.id !== room.hostId) return;
    const n = room.settings.gridSize;
    // Reset back to lobby so host can adjust settings before next game
    room.state.phase         = 'lobby';
    room.state.grid          = makeGrid(n);
    room.state.claimedBoxes  = 0;
    room.state.currentPlayer = null;
    room.players.forEach(p => p.score = 0);
    emitDotsState(io, room);
  });

  socket.on('dots_rejoin', ({ code, name }) => {
    const room = getDotsRoom(code);
    if (!room) { socket.emit('dots_error', { msg: 'Room expired.' }); return; }
    const existing = room.players.find(p => p.name === name);
    if (existing) {
      if (room.state.currentPlayer === existing.id) {
        // keep currentPlayer pointing to same logical player
      }
      if (room.hostId === existing.id) room.hostId = socket.id;
      if (room.state.currentPlayer === existing.id) room.state.currentPlayer = socket.id;
      existing.id = socket.id; existing.connected = true;
    } else {
      if (room.state.phase !== 'lobby') {
        socket.emit('dots_error', { msg: 'Room already started.' }); return;
      }
      const color = PLAYER_COLORS[room.players.length % PLAYER_COLORS.length];
      room.players.push({ id: socket.id, name, color, connected: true, score: 0 });
    }
    // Cancel any pending turn-advance timer from their disconnect
    if (existing && existing._turnTimer) {
      clearTimeout(existing._turnTimer);
      existing._turnTimer = null;
    }
    socket.join(room.code);
    socket.emit('dots_room_joined', { code: room.code });
    lobby.announce('dots', room);
    emitDotsState(io, room);
  });

  socket.on('dots_keep_alive', () => { /* keep socket warm */ });

  socket.on('disconnect', () => {
    for (const code of Object.keys(dotsRooms)) {
      const room = dotsRooms[code];
      const p    = room.players.find(p => p.id === socket.id);
      if (!p) continue;
      p.connected = false;

      if (socket.id === room.hostId) promoteDotsHost(room);

      emitDotsState(io, room);

      // Give disconnected player 15 seconds to reconnect before advancing their turn.
      // Store the timeout on the player object so rejoin can cancel it.
      if (room.state.phase === 'playing' && room.state.currentPlayer === socket.id) {
        if (p._turnTimer) clearTimeout(p._turnTimer);
        p._turnTimer = setTimeout(() => {
          // Only advance if they haven't reconnected
          if (!p.connected && room.state.currentPlayer === p.id) {
            room.state.currentPlayer = nextPlayerIndex(room, p.id);
            emitDotsState(io, room);
          }
          p._turnTimer = null;
        }, 45000);
      }

      const allGone = room.players.every(pl => !pl.connected);
      if (allGone) {
        lobby.remove(code);
        setTimeout(() => { if (dotsRooms[code]) delete dotsRooms[code]; }, 30 * 60 * 1000);
      }
      break;
    }
  });
}

module.exports = { register, getDotsRoomCount };
