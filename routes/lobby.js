// ════════════════════════════════════════════════════════
// LOBBY — Live Public Room Registry
// Tracks public rooms across all games.
// Broadcasts updates to Game Hub watchers via Socket.io.
// ════════════════════════════════════════════════════════
'use strict';

// Game display info
const GAME_INFO = {
  pm:       { name: 'Państwa-Miasta', icon: '🌍', slug: '/' },
  taboo:    { name: 'Zakazane Słowa / Forbidden Words', icon: '🎭', slug: '/taboo' },
  dots:     { name: 'Kropki i Kreski',icon: '🔵', slug: '/dots' },
  twotruth: { name: '2 Truths 1 Lie', icon: '🤥', slug: '/twotruth' },
  hangman:  { name: 'Hangman',         icon: '🪢', slug: '/hangman' },
  bingo:    { name: 'Corporate Bingo',  icon: '🎯', slug: '/bingo' },
  drawing:  { name: 'Sketch & Guess',    icon: '🎨', slug: '/drawing' },
  whoami:   { name: 'Who Am I?',           icon: '❓', slug: '/who-am-i' },
  memory:   { name: 'Find Pairs',            icon: '🧩', slug: '/memory' },
  charades: { name: 'Charades',              icon: '🎬', slug: '/charades' },
};

// Any phase other than 'lobby' and 'final' counts as a game in progress
const IN_PROGRESS_PHASES = { has: (p) => !!p && p !== 'lobby' && p !== 'final' };

// In-memory registry: code → public room entry
// { code, game, hostName, hostMasked, lang, players, maxPlayers,
//   isPublic, phase, inProgress, createdAt, lastActivity }
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

// ─── Room funnel tracking (admin stats only) ─────────────
// Logs once per room: 'room_created' (first time seen) and
// 'room_started' (first time it leaves the lobby). Games don't
// always announce on start, so rooms are also re-checked every
// 15 s (read-only look at room.state.phase). Never throws.
const _funnel = new Map(); // game:code → { game, room, started, t }
function funnelLog(game, room, outcome, details) {
  try {
    require('../db/stats').logGameEvent({
      game, roomCode: room.code,
      lang: (room.settings && room.settings.lang) || room.lang || null,
      outcome, details,
    });
  } catch (e) { /* never affect games */ }
}
function funnelCheckStarted(f) {
  try {
    if (f.started || !f.room || !f.room.state) return;
    const phase = f.room.state.phase;
    if (phase && phase !== 'lobby') {
      f.started = true;
      const st = f.room.settings || {}, extra = {};
      ['gridSize', 'totalRounds', 'boardSize', 'theme', 'gameLength'].forEach(k => { if (st[k] !== undefined) extra[k] = st[k]; });
      funnelLog(f.game, f.room, 'room_started', Object.assign({ players: (f.room.players || []).length }, extra));
      f.room = null; // drop reference once started
    }
  } catch (e) { /* never affect games */ }
}
function trackFunnel(game, room) {
  try {
    if (!room || !room.code || !room.state) return;
    // Ignore automated smoke-test rooms (player names start with "Smoke")
    if ((room.players || []).some(p => p && typeof p.name === 'string' && p.name.indexOf('Smoke') === 0)) return;
    const key = game + ':' + room.code;
    let f = _funnel.get(key);
    if (!f) {
      f = { game, room, started: false, t: Date.now() };
      _funnel.set(key, f);
      funnelLog(game, room, 'room_created', { isPublic: room.isPublic === true });
    }
    funnelCheckStarted(f);
  } catch (e) { /* never affect games */ }
}
const _funnelTimer = setInterval(() => {
  try {
    const old = Date.now() - 12 * 3600 * 1000;
    for (const [k, f] of _funnel) {
      funnelCheckStarted(f);
      if (f.t < old) _funnel.delete(k);
    }
    broadcast();
  } catch (e) { /* never affect games */ }
}, 15000);
if (_funnelTimer.unref) _funnelTimer.unref();

// Called by game routes whenever a room's public state changes
function announce(game, room) {
  trackFunnel(game, room);
  const code  = room.code;
  const phase = room.state.phase;

  // Remove from registry once game ends
  if (phase === 'final') {
    if (publicRooms[code]) { delete publicRooms[code]; broadcast(); }
    return;
  }

  // Show lobby rooms (joinable) and in-progress rooms (spectate/info)
  const isLobby      = phase === 'lobby';
  const isInProgress = IN_PROGRESS_PHASES.has(phase);
  if (!isLobby && !isInProgress) {
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
    gameName:     info.name,
    gameIcon:     info.icon,
    gameSlug:     info.slug,
    hostName,
    hostMasked:   maskName(hostName),
    lang:         (room.settings && room.settings.lang) || 'en',
    players,
    maxPlayers:   maxPlayersFor(game, room),
    isPublic:     room.isPublic === true,
    phase,
    inProgress:   isInProgress,
    createdAt:    publicRooms[code] ? publicRooms[code].createdAt : Date.now(),
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
  if (game === 'whoami')   return 16;
  if (game === 'memory')   return 6;
  if (game === 'charades') return 40;
  return 12;
}

// Live view of every room: reads each game's own room list, so the phase
// is always current ("lobby" = joinable, anything else = game in progress).
// Rooms where everyone has left are not shown. Never throws.
const _firstSeen = {};
function liveEntry(game, code, room) {
  const phase = (room.state && room.state.phase) || room.phase || 'lobby';
  if (phase === 'final') return null;
  const players = (room.players || []).filter(p => p && p.connected !== false);
  if (!players.length) return null;
  const info = GAME_INFO[game] || { name: game, icon: '🎮', slug: '/' + game };
  const host = (room.players || []).find(p => p.id === room.hostId);
  const hostName = host ? host.name : '?';
  const key = game + ':' + code;
  if (!_firstSeen[key]) _firstSeen[key] = (publicRooms[code] && publicRooms[code].createdAt) || room._createdAt || room.createdAt || Date.now();
  return {
    code, game,
    gameName: info.name, gameIcon: info.icon, gameSlug: info.slug,
    hostName, hostMasked: maskName(hostName),
    lang: (room.settings && room.settings.lang) || room.lang || 'en',
    players: players.length,
    maxPlayers: maxPlayersFor(game, room),
    isPublic: room.isPublic === true,
    phase,
    inProgress: phase !== 'lobby',
    createdAt: _firstSeen[key],
    lastActivity: Date.now(),
  };
}

function buildList() {
  const out = [];
  const seen = {};
  Object.keys(GAME_INFO).forEach(game => {
    let map = null;
    try { map = require('./' + game).getRooms(); } catch (e) { map = null; }
    if (!map) return;
    Object.keys(map).forEach(code => {
      try {
        const room = map[code];
        if (!room) return;
        // skip automated smoke-test rooms
        if ((room.players || []).some(p => p && typeof p.name === 'string' && p.name.indexOf('Smoke') === 0)) return;
        const e = liveEntry(game, code, room);
        if (e) { out.push(e); seen[game + ':' + code] = 1; }
      } catch (e) { /* never affect games */ }
    });
  });
  Object.keys(_firstSeen).forEach(k => { if (!seen[k]) delete _firstSeen[k]; });
  return out
    .sort((a, b) => {
      // Lobby (joinable) rooms first, then in-progress; newest first within each group
      if (a.inProgress !== b.inProgress) return a.inProgress ? 1 : -1;
      return b.createdAt - a.createdAt;
    })
    .slice(0, 20);  // cap at 20 rooms shown
}

function broadcast() {
  if (_io) _io.to('hub').emit('hub_rooms', buildList());
}

module.exports = { init, announce, remove };
