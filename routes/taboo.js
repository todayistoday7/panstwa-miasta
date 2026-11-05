// ════════════════════════════════════════════════════════
// TABOO — Game Logic (Team Mode)
// ════════════════════════════════════════════════════════
'use strict';
const __rekey = require('./rekey');
const lobby = require('./lobby');
const { isBotName, isHoneypot } = require('./botfilter');

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
    _createdAt: Date.now(),
    isPublic: settings.isPublic || false,
    settings: {
      rounds:     settings.rounds   || 0, // 0 = auto from gameLength
      turnTime:   settings.turnTime || 60,
      lang:       settings.lang     || 'en',
      isPublic:   settings.isPublic || false,
      gameLength: settings.gameLength || 'standard',
    },
    players: [],
    state: {
      phase:              'lobby',
      round:              0,
      roundJustPlayed:    -1,
      teams:              { red: [], blue: [] },
      describerTeam:      'red',
      redRefereeIndex:    0,
      blueRefereeIndex:   0,
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
      solo:               false, // 2-3 players: no teams, everyone describes in turn
      indiv:              {},    // solo points by player name
      soloIdx:            0,
      turnPoints:         0,
      lastDescriberName:  '',
    }
  };
  return tabooRooms[code];
}

function getTabooRoom(code)  { return tabooRooms[code]; }
function getTabooRoomCount() { return Object.keys(tabooRooms).length; }

function assignTeams(room) {
  // Calculate rounds based on gameLength and player count
  const connected = room.players.filter(p => p.connected !== false);
  const multiplier = room.settings.gameLength === 'quick' ? 1 : room.settings.gameLength === 'marathon' ? 3 : 2;
  room.settings.rounds = Math.max(2, connected.length * multiplier);
  
  const players = connected.map(p => p.id);
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
  // everyone keeps their place in the order, also while offline (the host can skip them)
  const members = room.state.teams[team].filter(id => room.players.some(pl => pl.id === id));
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
  if (!members.length) return null;
  const key = teamName === 'red' ? 'redRefereeIndex' : 'blueRefereeIndex';
  const idx = (room.state[key] || 0) % members.length;
  room.state[key] = (room.state[key] || 0) + 1;
  return members[idx];
}

// Why the next turn can't start: the describer is offline, or nobody online can guess
function tabooTurnBlock(room) {
  try {
    if (room.state.phase !== 'preparing') return null;
    const d = room.players.find(p => p.id === room.state.turnDescriber);
    if (!d) return null;
    if (d.connected === false) return { type: 'offline', name: d.name };
    const o = room.state.order;
    const pool = room.state.solo ? room.players.filter(p => p.id !== d.id && (!o || !o.length || o.includes(p.id)))
      : room.players.filter(p => p.id !== d.id && (room.state.teams[room.state.describerTeam] || []).includes(p.id));
    if (!pool.length || pool.some(p => p.connected !== false)) return null;
    const off = pool.filter(p => p.connected === false).map(p => p.name);
    return { type: 'noguess', name: off[0] || '', names: off };
  } catch (e) { return null; }
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
    solo:              !!room.state.solo,
    soloScores:        room.state.solo ? room.players
                         // offline players stay on the score row (greyed, 📴) - they keep their place and points
                         .map(pl => ({ id: pl.id, name: pl.name, score: (room.state.indiv && room.state.indiv[pl.name]) || 0, off: pl.connected === false })) : null,
    groupTotal:        room.state.solo ? (room.state.groupTotal || 0) : null,
    turnPoints:        room.state.turnPoints || 0,
    lastDescriberName: room.state.lastDescriberName || '',
    turnBlock:         tabooTurnBlock(room),
  });
}

function soloDescriber(room) {
  const o = room.state.order;
  const list = (o && o.length) ? room.players.filter(p => o.includes(p.id)) : room.players; // offline players keep their place too
  if (!list.length) return null;
  const p = list[(room.state.soloIdx || 0) % list.length];
  room.state.soloIdx = (room.state.soloIdx || 0) + 1;
  return p.id;
}

function prepareTabooTurn(io, room) {
  if (room.state.solo) {
    room.state.turnDescriber = soloDescriber(room);
    room.state.turnReferee   = null;
    room.state.turnPoints    = 0;
    room.state.phase         = 'preparing';
    room.state.currentWord   = null;
    emitTabooState(io, room);
    return;
  }
  const describingTeam = room.state.describerTeam;
  const opponentTeam   = opposingTeam(describingTeam);

  room.state.turnDescriber = nextDescriber(room, describingTeam);
  room.state.turnReferee   = pickReferee(room, opponentTeam);
  room.state.phase         = 'preparing';
  room.state.currentWord   = null;
  emitTabooState(io, room);
}

function startTabooTurn(io, room) {
  const code = room.code;
  room.state.phase         = 'playing';
  room.state.currentWord   = null;
  emitTabooState(io, room);

  room.state.turnTimeRemaining = room.settings.turnTime || 60;
  runTabooTimer(io, room);
}

// Ticks the turn clock down from room.state.turnTimeRemaining (also used to resume after a pause)
function runTabooTimer(io, room) {
  const code = room.code;
  if (room.state.turnTimer) clearInterval(room.state.turnTimer);
  room.state.turnTimer = setInterval(() => {
    room.state.turnTimeRemaining--;
    const remaining = room.state.turnTimeRemaining;
    io.to(code).emit('taboo_timer_tick', { remaining });
    if (remaining <= 0) {
      clearInterval(room.state.turnTimer);
      room.state.turnTimer = null;
      endTabooTurn(io, room);
    }
  }, 1000);
}
// Everyone left mid-turn: the clock was paused - start it again when someone comes back
function resumeTabooTimer(io, room) {
  if (room.state.phase !== 'playing' || room.state.turnTimer) return;
  if (room.state.turnTimeRemaining > 0) runTabooTimer(io, room);
  else endTabooTurn(io, room); // clock at 0 but the turn never ended - end it now
}

function endTabooTurn(io, room) {
  if (room.state.turnTimer) { clearInterval(room.state.turnTimer); room.state.turnTimer = null; }
  room.state.roundJustPlayed = room.state.round;
  const _d = room.players.find(p => p.id === room.state.turnDescriber);
  room.state.lastDescriberName = _d ? _d.name : '';
  room.state.phase           = 'roundend';
  room.state.round++;
  room.state.describerTeam   = opposingTeam(room.state.describerTeam);
  emitTabooState(io, room);
}

// ─── REGISTER SOCKET EVENTS ──────────────────────────────────────
function register(io, socket) {

  socket.on('taboo_create', ({ name, settings }) => {
    // "Play again" with the group: only the host of the old room can do it
    if (settings && settings.keepGroup) {
      const _old = Object.values(tabooRooms).find(r => r.players.some(p => p.id === socket.id));
      if (_old && _old.hostId !== socket.id) return;
    }
    const room = makeTabooRoom(socket.id, settings || {});
    if (isBotName(name)) { socket.emit('taboo_error', { msg: 'Invalid name.' }); return; }
    room.players.push({ id: socket.id, name: name || 'Host', connected: true });
    // keepGroup — move all connected players from old room to new one
    if (settings && settings.keepGroup) {
      for (const [code, r] of Object.entries(tabooRooms)) {
        if (r.players.find(p => p.id === socket.id)) {
          lobby.playAgain('taboo', r);
          const oldPlayers = r.players.filter(p => p.id !== socket.id);
          if (r._lobbyTimer) clearTimeout(r._lobbyTimer);
          lobby.remove(code);
          // Add all old players to new room before emitting rematch
          oldPlayers.forEach(p => {
            room.players.push({ id: p.id, name: p.name, connected: false });
          });
          // Broadcast rematch to everyone still in the old socket.io room
          io.to(code).emit('taboo_group_rematch', { code: room.code });
          delete tabooRooms[code];
          break;
        }
      }
    }

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
    if (!room) { socket.emit('taboo_error', { msg: require('./roomhint').notFound(socket, code, 'taboo') }); return; }
    if (room.state.phase === 'final')  { socket.emit('taboo_error', { msg: 'This game has ended.' }); return; }

    // Mid-game rejoin by name
    const existing = room.players.find(p => p.name.toLowerCase() === (name||'').toLowerCase());
    if (existing && room.state.phase !== 'lobby') {
      if (existing._disconnectTimer) { clearTimeout(existing._disconnectTimer); existing._disconnectTimer = null; }
      if (room.hostId === existing.id) room.hostId = socket.id;
      __rekey(room, existing.id, socket.id); existing.id = socket.id; existing.connected = true;
      socket.join(room.code);
      socket.emit('taboo_room_joined', { code: room.code });
      resumeTabooTimer(io, room);
      emitTabooState(io, room);
      return;
    }

    // Check if returning player
    const _ret = room.players.find(p => p.name === (name || '').trim());
    if (_ret) {
      if (room.hostId === _ret.id) room.hostId = socket.id;
      __rekey(room, _ret.id, socket.id); _ret.id = socket.id; _ret.connected = true;
      socket.join(room.code); socket.emit('taboo_room_joined', { code: room.code });
      resumeTabooTimer(io, room);
      emitTabooState(io, room); return;
    }
    if (room.state.phase !== 'lobby')  { socket.emit('taboo_error', { msg: 'Game already started.' }); return; }
    if (room.players.length >= 12)    { socket.emit('taboo_error', { msg: 'Room is full.' }); return; }

    if (existing && !existing.connected) {
      __rekey(room, existing.id, socket.id); existing.id = socket.id; existing.connected = true;
    } else {
      if (room.players.find(p => p.name.toLowerCase() === (name||'').toLowerCase() && p.connected)) {
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

  socket.on('taboo_reset_words', ({ code }) => {
    const room = getTabooRoom(code);
    if (!room || room.state.phase !== 'playing') return;
    if (socket.id !== room.state.turnDescriber) return;
    room.state.usedWords = [];
    // No need to emit state — client picks immediately after reset
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
    const _n = room.players.filter(p => p.connected).length;
    if (_n < 2) {
      socket.emit('taboo_error', { msg: 'Need at least 2 players.' }); return;
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
    room.state.solo               = _n <= 3;
    room.state.order              = room.players.filter(p => p.connected !== false).map(p => p.id);
    room.state.indiv              = {};
    room.state.groupTotal         = 0;
    room.state.soloIdx            = 0;
    room.state.turnPoints         = 0;
    assignTeams(room);
    lobby.remove(room.code);
    prepareTabooTurn(io, room);
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
    const word = room.state.currentWord ? room.state.currentWord.word : '';
    if (room.state.solo) {
      const me = room.players.find(p => p.id === socket.id);
      const nm = me ? me.name : '?';
      room.state.indiv[nm] = (room.state.indiv[nm] || 0) + 1;
      room.state.groupTotal = (room.state.groupTotal || 0) + 1;
      room.state.turnPoints = (room.state.turnPoints || 0) + 1;
      io.to(room.code).emit('taboo_score_event', { type: 'correct', word, name: nm });
      room.state.currentWord = null;
      emitTabooState(io, room);
      return;
    }
    if (!room.state.scores[rIdx]) room.state.scores[rIdx] = { red: 0, blue: 0 };
    room.state.scores[rIdx][team]++;
    room.state.teamTotals[team]++;
    io.to(room.code).emit('taboo_score_event', { type: 'correct', word, team });
    room.state.currentWord = null;
    emitTabooState(io, room);
  });

  socket.on('taboo_skip', ({ code }) => {
    const room = getTabooRoom(code);
    if (!room || room.state.phase !== 'playing') return;
    if (socket.id !== room.state.turnDescriber) return;
    const word = room.state.currentWord ? room.state.currentWord.word : '';
    // Only notify the describer — other players should not see skipped words
    socket.emit('taboo_score_event', { type: 'skip', word });
    room.state.currentWord = null;
    emitTabooState(io, room);
  });

  socket.on('taboo_penalty', ({ code }) => {
    const room = getTabooRoom(code);
    if (!room || room.state.phase !== 'playing') return;
    if (room.state.solo) {
      // No referee with 2-3 players: the describer owns up ("Oops")
      if (socket.id !== room.state.turnDescriber) return;
      const me = room.players.find(p => p.id === socket.id);
      const nm = me ? me.name : '?';
      const had = room.state.indiv[nm] || 0;
      room.state.indiv[nm] = Math.max(0, had - 1);
      room.state.turnPoints = (room.state.turnPoints || 0) - (had > 0 ? 1 : 0);
      io.to(room.code).emit('taboo_score_event', { type: 'penalty', word: '', name: nm });
      room.state.currentWord = null;
      emitTabooState(io, room);
      return;
    }
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

  // Describer presses "I'm Ready!" to start their turn
  socket.on('taboo_ready', ({ code }) => {
    const room = getTabooRoom(code);
    if (!room || room.state.phase !== 'preparing') return;
    if (socket.id !== room.state.turnDescriber) return;
    if (tabooTurnBlock(room)) return; // nobody online to guess - wait
    startTabooTurn(io, room);
  });

  // Host: "Pomiń i grajmy dalej" - the describer is offline, the next person goes (the offline one keeps their place for later)
  socket.on('taboo_skip_offline', ({ code }) => {
    const room = getTabooRoom(code);
    if (!room || socket.id !== room.hostId || room.state.phase !== 'preparing') return;
    const b = tabooTurnBlock(room);
    if (!b || b.type !== 'offline') return;
    prepareTabooTurn(io, room);
  });

  // Player switches their own team
  socket.on('taboo_switch_team', ({ code }) => {
    const room = getTabooRoom(code);
    if (!room || room.state.phase !== 'lobby') return;
    const currentTeam = room.state.teams.red.includes(socket.id) ? 'red' : 'blue';
    const newTeam = currentTeam === 'red' ? 'blue' : 'red';
    room.state.teams[currentTeam] = room.state.teams[currentTeam].filter(id => id !== socket.id);
    room.state.teams[newTeam].push(socket.id);
    emitTabooState(io, room);
  });

  socket.on('taboo_next_round', ({ code }) => {
    const room = getTabooRoom(code);
    if (!room || socket.id !== room.hostId) return;
    if (room.state.round >= room.settings.rounds) {
      if (room.state.turnTimer) clearInterval(room.state.turnTimer);
      // Stats: count finished game (never breaks the game; skips if already finished)
      if (room.state.phase !== 'final') { try { require('../db/stats').logGameEvent({ game: 'taboo', roomCode: room.code, lang: (room.settings && room.settings.lang) || room.lang || null, outcome: 'game_complete', details: { players: (room.players || []).length, solo: !!room.state.solo } }); } catch (e) {} }
      room.state.phase = 'final';
      emitTabooState(io, room);
      lobby.remove(room.code);
      setTimeout(() => { if (tabooRooms[room.code]) delete tabooRooms[room.code]; }, 60 * 60 * 1000);
    } else {
      prepareTabooTurn(io, room);
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
      __rekey(room, oldId, socket.id); // turn order, scores, teams… everything that still holds the old id
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
    resumeTabooTimer(io, room);
    lobby.announce('taboo', room);
    emitTabooState(io, room);
  });

  // Disconnect: mark player offline, promote new host if needed, clean up empty rooms
  socket.on('taboo_rejoin', ({ code, name }) => {
    const room = tabooRooms[code];
    if (!room) { socket.emit('taboo_error', { msg: 'Room expired.' }); return; }
    const existing = room.players.find(p => p.name === name);
    if (!existing) { socket.emit('taboo_error', { msg: 'Player not found.' }); return; }
    if (existing._disconnectTimer) { clearTimeout(existing._disconnectTimer); existing._disconnectTimer = null; }
    if (room.hostId === existing.id) room.hostId = socket.id;
    __rekey(room, existing.id, socket.id); existing.id = socket.id; existing.connected = true;
    socket.join(code);
    socket.emit('taboo_room_joined', { code });
    resumeTabooTimer(io, room);
    emitTabooState(io, room);
  });

  socket.on('disconnect', () => {
    for (const code of Object.keys(tabooRooms)) {
      const room = tabooRooms[code];
      const p    = room.players.find(p => p.id === socket.id);
      if (!p) continue;
      p.connected = false;
      // Host's phone offline: everyone sees "waiting for the host"; after 1 minute someone online takes over
      if (room.hostId === p.id) {
        const _hid = p.id;
        setTimeout(() => {
          if (!p.connected && room.hostId === _hid) {
            const nx = room.players.find(pl => pl.connected && pl.id !== _hid);
            if (nx) { room.hostId = nx.id; emitTabooState(io, room); }
          }
        }, 60 * 1000);
      }

      // Promote next connected player to host after grace period
      if (p._disconnectTimer) clearTimeout(p._disconnectTimer);
      p._disconnectTimer = setTimeout(() => {
        if (!p.connected) {
          if (room.hostId === p.id) {
            const next = room.players.find(pl => pl.connected && pl.id !== p.id);
            if (next) room.hostId = next.id;
          }
          emitTabooState(io, room);
        }
        p._disconnectTimer = null;
      }, 30 * 60 * 1000);

      emitTabooState(io, room);

      const allGone = room.players.every(pl => !pl.connected);
      if (allGone) {
        if (room.state.turnTimer) { clearInterval(room.state.turnTimer); room.state.turnTimer = null; } // paused - resumes when someone returns
        room._goneAt = Date.now();
        setTimeout(() => { if (tabooRooms[code] === room && room.players.every(pl => !pl.connected) && Date.now() - room._goneAt >= 30 * 60 * 1000 - 1000) delete tabooRooms[code]; }, 30 * 60 * 1000); // only if nobody came back
      }
      break;
    }
  });
}

function getTabooRooms() { return Object.values(tabooRooms); }

module.exports = { getRooms: () => tabooRooms, getTabooRooms, register, getTabooRoomCount };
// Note: disconnect handler appended below register()
