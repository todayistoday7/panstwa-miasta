// ════════════════════════════════════════════════════════
// LOBBY — Live Public Room Registry
// Tracks public rooms across all games.
// Broadcasts updates to Game Hub watchers via Socket.io.
// ════════════════════════════════════════════════════════
'use strict';

// Game display info
const GAME_INFO = {
  pm:       { name: 'Państwa-Miasta', icon: '🌍', slug: '/' },
  taboo:    { name: 'Tabu',           icon: '🎭', slug: '/taboo' },
  dots:     { name: 'Kropki i Kreski',icon: '🔵', slug: '/dots' },
  twotruth: { name: '2 Truths 1 Lie', icon: '🤥', slug: '/twotruth' },
  hangman:  { name: 'Hangman',         icon: '🪢', slug: '/hangman' },
};

// In-memory registry: code → public room entry
// { code, game, hostName, hostMasked, lang, players, maxPlayers,
//   isPublic, phase, createdAt, lastActivity }
const publicRooms = {};

let _io = null;  // set by init()

function init(io) {
  _io = io;

  // Hub watchers join 'hub' room to receive broadcasts
  io.on('connection', (socket) => {
    socket.on('hub_watch', () => {
      socket.join('hub');
      // Send current list immediately
      socket.emit('hub_rooms', buildList());
    });
    socket.on('hub_unwatch', () => {
      socket.leave('hub');
    });
  });
}

// Called by game routes whenever a room's public state changes
function announce(game, room) {
  const code = room.code;

  // Remove from registry once game ends or room disappears
  if (room.state.phase === 'final') {
    if (publicRooms[code]) { delete publicRooms[code]; broadcast(); }
    return;
  }

  // Only show rooms that are still in lobby phase
  if (room.state.phase !== 'lobby') {
    if (publicRooms[code]) { delete publicRooms[code]; broadcast(); }
    return;
  }

  const info     = GAME_INFO[game] || { name: game, icon: '🎮', slug: '/' + game };
  const players  = (room.players || []).filter(p => p.connected !== false).length;
  const host     = (room.players || []).find(p => p.id === room.hostId);
  const hostName = host ? host.name : '?';

  publicRooms[code] = {
    code,
    game,
    gameName:    info.name,
    gameIcon:    info.icon,
    gameSlug:    info.slug,
    hostName,
    hostMasked:  maskName(hostName),
    lang:        (room.settings && room.settings.lang) || 'en',
    players,
    maxPlayers:  maxPlayersFor(game, room),
    isPublic:    room.isPublic === true,
    createdAt:   publicRooms[code] ? publicRooms[code].createdAt : Date.now(),
    lastActivity: Date.now(),
  };

  broadcast();
}

// Called when a room is deleted (game over, expired, all left)
function remove(code) {
  if (publicRooms[code]) {
    delete publicRooms[code];
    broadcast();
  }
}

function maskName(name) {
  if (!name || name.length === 0) return '***';
  return name.charAt(0).toUpperCase() + '***';
}

function maxPlayersFor(game, room) {
  if (game === 'pm')       return 12;
  if (game === 'taboo')    return 12;
  if (game === 'dots')     return room.settings && room.settings.maxPlayers || 4;
  if (game === 'twotruth') return 20;
  if (game === 'hangman')  return 10;
  return 12;
}

function buildList() {
  const now = Date.now();
  // Drop rooms older than 30 min with no activity
  Object.keys(publicRooms).forEach(code => {
    if (now - publicRooms[code].lastActivity > 30 * 60 * 1000) {
      delete publicRooms[code];
    }
  });

  return Object.values(publicRooms)
    .sort((a, b) => b.createdAt - a.createdAt)  // newest first
    .slice(0, 20);  // cap at 20 rooms shown
}

function broadcast() {
  if (_io) _io.to('hub').emit('hub_rooms', buildList());
}

module.exports = { init, announce, remove };
