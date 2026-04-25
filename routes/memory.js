// ════════════════════════════════════════════════════════
// MEMORY — Multiplayer Card-Matching Game
// ════════════════════════════════════════════════════════
'use strict';
const lobby = require('./lobby');
const { isBotName } = require('./botfilter');

const memRooms = {};

const PLAYER_COLORS = ['#ff6b35', '#06d6a0', '#ffd166', '#ef476f', '#a78bfa', '#38bdf8'];

const THEMES = {
  animals: ['🐶','🐱','🦁','🐘','🦋','🐸','🐼','🦊','🐧','🦄','🐝','🐢','🦩','🐨','🐬','🐙','🦜','🐰','🦒','🐻'],
  food:    ['🍕','🍦','🍎','🍪','🍩','🧁','🍓','🍌','🍉','🌮','🍔','🍟','🍿','🧀','🥕','🍇','🥑','🍋','🍫','🥐'],
  nature:  ['🌸','🌊','🌈','⭐','🌙','☀️','🍄','🌻','🍀','❄️','🔥','🌴','🌵','🪸','🦋','🌺','🍁','🌿','💎','🪻'],
  travel:  ['✈️','🚀','🏰','🗼','🎡','⛵','🚂','🚗','🏔️','🗽','🎪','🛸','🚁','🏖️','🎢','🚲','⛩️','🏛️','🌋','🎠'],
  sports:  ['⚽','🏀','🎾','🏈','⚾','🏐','🎱','🏓','🥊','⛷️','🏄','🚴','🎯','🏆','🥇','🏸','⛳','🤿','🛹','🎳'],
  flags:   ['🇵🇱','🇬🇧','🇩🇪','🇸🇪','🇫🇷','🇪🇸','🇮🇹','🇯🇵','🇧🇷','🇺🇸','🇨🇦','🇦🇺','🇲🇽','🇰🇷','🇮🇳','🇳🇱','🇵🇹','🇨🇭','🇳🇴','🇦🇷'],
};

function generateMemCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code;
  do { code = 'M' + Array.from({length:4}, () => chars[Math.floor(Math.random()*chars.length)]).join(''); }
  while (memRooms[code]);
  return code;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeBoard(theme, size) {
  const emojis = THEMES[theme] || THEMES.animals;
  const pairCount = Math.floor(size / 2);
  const picked = shuffle(emojis).slice(0, pairCount);
  const cards = shuffle([...picked, ...picked]);
  return cards.map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false, matchedBy: null }));
}

function makeMemRoom(hostId, settings) {
  const code = generateMemCode();
  const size = settings.boardSize || 16;
  const theme = settings.theme || 'animals';
  memRooms[code] = {
    code, hostId,
    isPublic: settings.isPublic || false,
    settings: { boardSize: size, theme, maxPlayers: settings.maxPlayers || 6 },
    players: [],
    state: {
      phase: 'lobby',
      board: [],
      currentPlayer: null,
      flippedCards: [],     // indices of currently flipped cards (0, 1, or 2)
      totalPairs: Math.floor(size / 2),
      foundPairs: 0,
      turnTimer: null,
    }
  };
  return memRooms[code];
}

function getMemRoom(code) { return memRooms[code]; }
function getMemRoomCount() { return Object.keys(memRooms).length; }
function getMemRooms() { return Object.values(memRooms); }

function emitMemState(io, room) {
  // Send board state — hide emoji of unflipped/unmatched cards
  const safeBoard = room.state.board.map(c => ({
    id: c.id,
    flipped: c.flipped,
    matched: c.matched,
    matchedBy: c.matchedBy,
    emoji: (c.flipped || c.matched) ? c.emoji : null,
  }));

  io.to(room.code).emit('mem_state', {
    phase: room.state.phase,
    hostId: room.hostId,
    players: room.players.map(p => ({
      id: p.id, name: p.name, color: p.color,
      connected: p.connected, score: p.score,
    })),
    settings: { ...room.settings, isPublic: room.isPublic },
    currentPlayer: room.state.currentPlayer,
    board: safeBoard,
    totalPairs: room.state.totalPairs,
    foundPairs: room.state.foundPairs,
  });
}

function nextPlayerIndex(room, currentId) {
  const connected = room.players.filter(p => p.connected);
  if (!connected.length) return null;
  const idx = connected.findIndex(p => p.id === currentId);
  return connected[(idx + 1) % connected.length].id;
}

function promoteMemHost(room) {
  const next = room.players.find(p => p.connected && p.id !== room.hostId);
  if (next) room.hostId = next.id;
}

// ─── REGISTER SOCKET EVENTS ──────────────────────────────────────
function register(io, socket) {

  socket.on('mem_create', ({ name, settings }) => {
    if (isBotName(name)) { socket.emit('mem_error', { msg: 'Invalid name.' }); return; }
    const room = makeMemRoom(socket.id, settings || {});
    const color = PLAYER_COLORS[0];
    room.players.push({ id: socket.id, name: name || 'Host', color, connected: true, score: 0 });
    socket.join(room.code);
    socket.emit('mem_room_created', { code: room.code });
    lobby.announce('memory', room);
    room._lobbyTimer = setTimeout(() => {
      if (memRooms[room.code] && memRooms[room.code].state.phase === 'lobby') delete memRooms[room.code];
    }, 24 * 60 * 60 * 1000);
    emitMemState(io, room);
  });

  socket.on('mem_join', ({ code, name }) => {
    const room = getMemRoom((code || '').toUpperCase().trim());
    if (!room) { socket.emit('mem_error', { msg: 'Room not found.' }); return; }
    if (room.state.phase === 'final') { socket.emit('mem_error', { msg: 'This game has ended.' }); return; }
    if (isBotName(name)) { socket.emit('mem_error', { msg: 'Invalid name.' }); return; }

    // Rejoin check
    const existing = room.players.find(p => p.name === name && !p.connected);
    if (existing) {
      existing.id = socket.id;
      existing.connected = true;
      socket.join(room.code);
      socket.emit('mem_room_created', { code: room.code });
      emitMemState(io, room);
      return;
    }

    if (room.players.length >= room.settings.maxPlayers) {
      socket.emit('mem_error', { msg: 'Room is full.' }); return;
    }

    const color = PLAYER_COLORS[room.players.length % PLAYER_COLORS.length];
    room.players.push({ id: socket.id, name: name || 'Player', color, connected: true, score: 0 });
    socket.join(room.code);
    socket.emit('mem_room_created', { code: room.code });
    lobby.announce('memory', room);
    emitMemState(io, room);
  });

  socket.on('mem_update_settings', ({ code, settings }) => {
    const room = getMemRoom(code);
    if (!room || socket.id !== room.hostId || room.state.phase !== 'lobby') return;
    if (settings.boardSize) room.settings.boardSize = settings.boardSize;
    if (settings.theme) room.settings.theme = settings.theme;
    if (settings.maxPlayers && [2,3,4,5,6].includes(settings.maxPlayers)) room.settings.maxPlayers = settings.maxPlayers;
    if (typeof settings.isPublic === 'boolean') room.isPublic = settings.isPublic;
    lobby.announce('memory', room);
    emitMemState(io, room);
  });

  socket.on('mem_start', ({ code }) => {
    const room = getMemRoom(code);
    if (!room || socket.id !== room.hostId) return;
    if (room.players.filter(p => p.connected).length < 2) {
      socket.emit('mem_error', { msg: 'Need at least 2 players.' }); return;
    }

    // Build the board
    room.state.board = makeBoard(room.settings.theme, room.settings.boardSize);
    room.state.totalPairs = Math.floor(room.settings.boardSize / 2);
    room.state.foundPairs = 0;
    room.state.flippedCards = [];
    room.state.phase = 'playing';
    room.state.currentPlayer = room.players[0].id;

    // Reset scores
    room.players.forEach(p => p.score = 0);

    emitMemState(io, room);
  });

  socket.on('mem_flip', ({ code, cardIndex }) => {
    const room = getMemRoom(code);
    if (!room || room.state.phase !== 'playing') return;
    if (socket.id !== room.state.currentPlayer) return;

    const card = room.state.board[cardIndex];
    if (!card || card.flipped || card.matched) return;
    if (room.state.flippedCards.length >= 2) return;

    // Flip the card
    card.flipped = true;
    room.state.flippedCards.push(cardIndex);

    if (room.state.flippedCards.length === 2) {
      const [i, j] = room.state.flippedCards;
      const a = room.state.board[i];
      const b = room.state.board[j];

      if (a.emoji === b.emoji) {
        // Match found!
        a.matched = true; a.matchedBy = socket.id;
        b.matched = true; b.matchedBy = socket.id;
        room.state.foundPairs++;

        const player = room.players.find(p => p.id === socket.id);
        if (player) player.score++;

        room.state.flippedCards = [];

        // Emit match event with both cards visible
        emitMemState(io, room);

        // Check if game is over
        if (room.state.foundPairs >= room.state.totalPairs) {
          room.state.phase = 'final';
          io.to(room.code).emit('mem_game_over', {
            players: room.players.map(p => ({ name: p.name, score: p.score, color: p.color })),
          });
          emitMemState(io, room);
        }
        // Player gets another turn — don't change currentPlayer
      } else {
        // No match — reveal both cards briefly, then flip back
        emitMemState(io, room);

        setTimeout(() => {
          a.flipped = false;
          b.flipped = false;
          room.state.flippedCards = [];
          room.state.currentPlayer = nextPlayerIndex(room, socket.id);
          emitMemState(io, room);
        }, 1200);
      }
    } else {
      // First card flipped — just show it
      emitMemState(io, room);
    }
  });

  socket.on('mem_play_again', ({ code }) => {
    const room = getMemRoom(code);
    if (!room || socket.id !== room.hostId) return;

    room.state.board = makeBoard(room.settings.theme, room.settings.boardSize);
    room.state.totalPairs = Math.floor(room.settings.boardSize / 2);
    room.state.foundPairs = 0;
    room.state.flippedCards = [];
    room.state.phase = 'playing';
    room.state.currentPlayer = room.players[0].id;
    room.players.forEach(p => p.score = 0);

    emitMemState(io, room);
  });

  // ─── DISCONNECT ──────────────────────────────────────
  socket.on('disconnect', () => {
    for (const code of Object.keys(memRooms)) {
      const room = memRooms[code];
      const player = room.players.find(p => p.id === socket.id);
      if (!player) continue;

      player.connected = false;

      if (room.state.phase === 'lobby') {
        room.players = room.players.filter(p => p.id !== socket.id);
        if (room.players.length === 0) { delete memRooms[code]; continue; }
        if (socket.id === room.hostId) promoteMemHost(room);
      } else {
        if (room.players.every(p => !p.connected)) { delete memRooms[code]; continue; }
        if (socket.id === room.hostId) promoteMemHost(room);
        if (room.state.currentPlayer === socket.id) {
          room.state.currentPlayer = nextPlayerIndex(room, socket.id);
          // Clear any pending flipped cards
          room.state.flippedCards.forEach(idx => { room.state.board[idx].flipped = false; });
          room.state.flippedCards = [];
        }
      }
      lobby.announce('memory', room);
      emitMemState(io, room);
    }
  });

  socket.on('mem_leave', ({ code }) => {
    const room = getMemRoom(code);
    if (!room) return;
    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;
    socket.leave(code);
    player.connected = false;

    if (room.state.phase === 'lobby') {
      room.players = room.players.filter(p => p.id !== socket.id);
      if (room.players.length === 0) { delete memRooms[code]; return; }
    }
    if (socket.id === room.hostId) promoteMemHost(room);
    if (room.state.currentPlayer === socket.id) {
      room.state.currentPlayer = nextPlayerIndex(room, socket.id);
      room.state.flippedCards.forEach(idx => { room.state.board[idx].flipped = false; });
      room.state.flippedCards = [];
    }
    lobby.announce('memory', room);
    emitMemState(io, room);
  });
}

module.exports = { register, getMemRoom, getMemRoomCount, getMemRooms, memRooms };
