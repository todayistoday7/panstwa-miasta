'use strict';
// ════════════════════════════════════════════════════════
// WHO AM I — Server Route
// ════════════════════════════════════════════════════════

const { isBotName, isHoneypot } = require('./botfilter');

// ── Character Database ────────────────────────────────────────────
const CHARACTERS = {
  sports: {
    easy:   ['Messi', 'Cristiano Ronaldo', 'Serena Williams', 'Usain Bolt', 'Muhammad Ali',
             'Michael Jordan', 'LeBron James', 'Roger Federer', 'Tiger Woods', 'Pelé',
             'Lewis Hamilton', 'Simone Biles', 'Rafael Nadal', 'Mike Tyson', 'Neymar'],
    medium: ['Zinedine Zidane', 'Ayrton Senna', 'Magic Johnson', 'Wayne Gretzky',
             'Martina Navratilova', 'Carl Lewis', 'Lance Armstrong', 'Floyd Mayweather',
             'Ronaldinho', 'Roberto Carlos', 'Thierry Henry', 'Novak Djokovic'],
    hard:   ['Johan Cruyff', 'Lev Yashin', 'Fanny Blankers-Koen', 'Dick Fosbury',
             'Garrincha', 'Sonja Henie', 'Paavo Nurmi', 'Jesse Owens', 'Mia Hamm'],
  },
  music: {
    easy:   ['Michael Jackson', 'Madonna', 'Elvis Presley', 'Beyoncé', 'Freddie Mercury',
             'David Bowie', 'Taylor Swift', 'Eminem', 'Rihanna', 'Lady Gaga',
             'Ed Sheeran', 'Adele', 'Justin Bieber', 'Bob Dylan', 'The Beatles'],
    medium: ['Kurt Cobain', 'Amy Winehouse', 'Bob Marley', 'Jimi Hendrix', 'Frank Sinatra',
             'Jim Morrison', 'Janis Joplin', 'Bruce Springsteen', 'Prince', 'Whitney Houston'],
    hard:   ['John Coltrane', 'Édith Piaf', 'Charles Mingus', 'Klaus Nomi', 'Chet Baker',
             'Thelonious Monk', 'Nina Simone', 'Billie Holiday', 'Miles Davis'],
  },
  film: {
    easy:   ['James Bond', 'Harry Potter', 'Shrek', 'Batman', 'Darth Vader',
             'Homer Simpson', 'Elsa', 'SpongeBob SquarePants', 'Superman', 'Spider-Man',
             'Iron Man', 'Hermione Granger', 'Sherlock Holmes', 'Indiana Jones', 'Winnie the Pooh'],
    medium: ['Walter White', 'Tony Soprano', 'Forrest Gump', 'Hannibal Lecter', 'The Joker',
             'Daenerys Targaryen', 'Tyrion Lannister', 'Jack Sparrow', 'Gollum', 'Gandalf'],
    hard:   ['Alex DeLarge', 'HAL 9000', 'Amélie Poulain', 'Holden Caulfield',
             'Travis Bickle', 'Citizen Kane', 'Holly Golightly', 'Atticus Finch'],
  },
  history: {
    easy:   ['Napoleon Bonaparte', 'Cleopatra', 'Albert Einstein', 'Leonardo da Vinci',
             'Abraham Lincoln', 'Marie Curie', 'Julius Caesar', 'Christopher Columbus',
             'Mahatma Gandhi', 'Nelson Mandela', 'Winston Churchill', 'Adolf Hitler'],
    medium: ['Nikola Tesla', 'Genghis Khan', 'Catherine the Great', 'Galileo Galilei',
             'Nicolaus Copernicus', 'Marco Polo', 'Alexander the Great', 'Joan of Arc',
             'Charles Darwin', 'Isaac Newton', 'Sigmund Freud', 'Karl Marx'],
    hard:   ['Hypatia', 'Ibn Battuta', 'Suleiman the Magnificent', 'Avicenna',
             'Gottfried Leibniz', 'Zenobia', 'Saladin', 'Tamberlaine', 'Ashoka'],
  },
  animals: {
    easy:   ['Elephant', 'Lion', 'Penguin', 'Giraffe', 'Dolphin', 'Eagle', 'Shark',
             'Cheetah', 'Gorilla', 'Flamingo', 'Panda', 'Kangaroo', 'Crocodile',
             'Octopus', 'Polar Bear', 'Tiger', 'Zebra', 'Peacock', 'Koala', 'Wolf'],
    medium: ['Platypus', 'Axolotl', 'Manta Ray', 'Snow Leopard', 'Komodo Dragon',
             'Narwhal', 'Capybara', 'Pangolin', 'Tapir', 'Quokka', 'Mandrill',
             'Wolverine', 'Binturong', 'Kinkajou', 'Serval'],
    hard:   ['Okapi', 'Shoebill', 'Blobfish', 'Aye-aye', 'Fossa', 'Saiga Antelope',
             'Tardigrade', 'Irrawaddy Dolphin', 'Kakapo', 'Tarsier', 'Dugong'],
  },
  kids: {
    easy:   ['Mickey Mouse', 'SpongeBob SquarePants', 'Pikachu', 'Simba', 'Elsa',
             'Shrek', 'Peppa Pig', 'Buzz Lightyear', 'Nemo', 'Dumbo', 'Winnie the Pooh',
             'Cinderella', 'Snow White', 'Bambi', 'Woody', 'Olaf', 'Moana',
             'Puss in Boots', 'Stitch', 'Totoro'],
  },
};

// Wikipedia article name overrides (when display name ≠ Wikipedia article title)
const WIKI_OVERRIDES = {
  'Messi': 'Lionel Messi',
  'Cristiano Ronaldo': 'Cristiano Ronaldo',
  'The Beatles': 'The Beatles',
  'SpongeBob SquarePants': 'SpongeBob SquarePants',
  'Napoleon Bonaparte': 'Napoleon',
  'Galileo Galilei': 'Galileo Galilei',
  'Nicolaus Copernicus': 'Copernicus',
};

// ── Room Management ───────────────────────────────────────────────
const whoamiRooms = {};

function makeCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function getCharacters(categories, difficulty) {
  let pool = [];
  const cats = categories.includes('mixed')
    ? ['sports', 'music', 'film', 'history', 'animals', 'kids']
    : categories;

  cats.forEach(cat => {
    const catData = CHARACTERS[cat];
    if (!catData) return;
    if (cat === 'kids') {
      pool = pool.concat(catData.easy || []);
    } else {
      const levels = difficulty === 'easy'   ? ['easy'] :
                     difficulty === 'medium' ? ['easy', 'medium'] :
                                               ['easy', 'medium', 'hard'];
      levels.forEach(lvl => { if (catData[lvl]) pool = pool.concat(catData[lvl]); });
    }
  });
  return [...new Set(pool)]; // deduplicate
}

function pickCharacter(pool, usedInSession) {
  const available = pool.filter(c => !usedInSession.includes(c));
  if (available.length === 0) return pool[Math.floor(Math.random() * pool.length)];
  return available[Math.floor(Math.random() * available.length)];
}

function makeWhoamiRoom(hostId, settings) {
  const code = makeCode();
  return {
    code,
    hostId,
    isPublic: settings.isPublic || false,
    mode: settings.mode || 'voice',           // 'voice' | 'chat'
    settings: {
      categories:  settings.categories  || ['mixed'],
      difficulty:  settings.difficulty  || 'easy',
      turnsEach:   settings.turnsEach   || 1,
      timerSecs:   settings.timerSecs   || 120,  // 0 = no timer
      hintsOn:     settings.hintsOn     !== false,
      lang:        settings.lang        || 'pl',
    },
    players: [],
    state: {
      phase:          'lobby',   // lobby | playing | turn_result | final
      currentIdx:     0,         // index in players array
      turnCount:      0,         // total turns completed
      activeChar:     null,      // current character
      wikiSlug:       null,      // wikipedia article slug
      chat:           [],        // chat messages [{type,from,text,ts}]
      questionCount:  0,
      usedChars:      [],        // prevents repeats
      timerEnd:       null,
    },
  };
}

function emitState(io, room) {
  // Each player gets a slightly different state — active player doesn't see their character
  const activePId = room.players[room.state.currentIdx]
    ? room.players[room.state.currentIdx].id : null;

  room.players.forEach(p => {
    const isActive = p.id === activePId;
    const state = {
      phase:         room.state.phase,
      hostId:        room.hostId,
      mode:          room.mode,
      settings:      room.settings,
      players:       room.players.map(pl => ({
        id: pl.id, name: pl.name, score: pl.score, connected: pl.connected,
      })),
      currentIdx:    room.state.currentIdx,
      activePlayerId: activePId,
      // Active player sees no character, others see it
      activeChar:    isActive ? null : room.state.activeChar,
      wikiSlug:      isActive ? null : room.state.wikiSlug,
      questionCount: room.state.questionCount,
      chat:          room.state.chat,
      timerEnd:      room.state.timerEnd,
      turnsLeft:     (room.settings.turnsEach * room.players.filter(p=>p.connected).length)
                     - room.state.turnCount,
    };
    io.to(p.id).emit('whoami_state', state);
  });
}

function startNextTurn(io, room) {
  const pool = getCharacters(room.settings.categories, room.settings.difficulty);
  const char = pickCharacter(pool, room.state.usedChars);
  room.state.usedChars.push(char);
  room.state.activeChar    = char;
  room.state.wikiSlug      = WIKI_OVERRIDES[char] || char;
  room.state.questionCount = 0;
  room.state.chat          = [];
  room.state.phase         = 'playing';
  room.state.timerEnd      = room.settings.timerSecs > 0
    ? Date.now() + room.settings.timerSecs * 1000 : null;

  // Timer auto-advance
  if (room._turnTimer) clearTimeout(room._turnTimer);
  if (room.settings.timerSecs > 0) {
    room._turnTimer = setTimeout(() => {
      if (room.state.phase === 'playing') {
        room.state.phase = 'turn_result';
        room.state.chat.push({ type:'system', text:'⏱️ Time is up!', ts: Date.now() });
        emitState(io, room);
      }
    }, room.settings.timerSecs * 1000 + 500);
  }

  emitState(io, room);
}

// ── Socket Registration ───────────────────────────────────────────
function register(io, socket) {

  // CREATE
  socket.on('whoami_create', ({ name, settings, website }) => {
    if (isHoneypot(website)) return;
    const trimmed = (name || '').trim();
    if (!trimmed) { socket.emit('whoami_error', { msg: 'Enter your name.' }); return; }
    if (isBotName(trimmed)) { socket.emit('whoami_error', { msg: 'Invalid name.' }); return; }

    const room = makeWhoamiRoom(socket.id, settings || {});
    room.players.push({ id: socket.id, name: trimmed, score: 0, connected: true });
    whoamiRooms[room.code] = room;
    socket.join(room.code);
    socket.emit('whoami_created', { code: room.code });
    emitState(io, room);
  });

  // JOIN
  socket.on('whoami_join', ({ name, code, website }) => {
    if (isHoneypot(website)) return;
    const trimmed = (name || '').trim();
    const roomCode = (code || '').trim().toUpperCase();
    if (!trimmed) { socket.emit('whoami_error', { msg: 'Enter your name.' }); return; }
    if (isBotName(trimmed)) { socket.emit('whoami_error', { msg: 'Invalid name.' }); return; }

    const room = whoamiRooms[roomCode];
    if (!room) { socket.emit('whoami_error', { msg: 'Room not found.' }); return; }
    if (room.state.phase !== 'lobby') { socket.emit('whoami_error', { msg: 'Game already started.' }); return; }
    if (room.players.length >= 16) { socket.emit('whoami_error', { msg: 'Room is full.' }); return; }

    const nameTaken = room.players.find(p => p.name.toLowerCase() === trimmed.toLowerCase() && p.connected);
    if (nameTaken) { socket.emit('whoami_error', { msg: 'Name already taken.' }); return; }

    room.players.push({ id: socket.id, name: trimmed, score: 0, connected: true });
    socket.join(roomCode);
    socket.emit('whoami_joined', { code: roomCode });
    emitState(io, room);
  });

  // REJOIN
  socket.on('whoami_rejoin', ({ name, code }) => {
    const room = whoamiRooms[(code||'').toUpperCase()];
    if (!room) { socket.emit('whoami_error', { msg: 'Room expired.' }); return; }
    const existing = room.players.find(p => p.name === name);
    if (existing) {
      if (room.hostId === existing.id) room.hostId = socket.id;
      if (room.state.currentIdx < room.players.length &&
          room.players[room.state.currentIdx].id === existing.id) {
        // keep turn
      }
      existing.id = socket.id;
      existing.connected = true;
    } else {
      if (room.state.phase !== 'lobby') { socket.emit('whoami_error', { msg: 'Room already started.' }); return; }
      room.players.push({ id: socket.id, name, score: 0, connected: true });
    }
    socket.join(room.code);
    socket.emit('whoami_joined', { code: room.code });
    emitState(io, room);
  });

  // START
  socket.on('whoami_start', ({ code }) => {
    const room = whoamiRooms[code];
    if (!room || socket.id !== room.hostId) return;
    if (room.players.length < 2) { socket.emit('whoami_error', { msg: 'Need at least 2 players.' }); return; }
    room.state.currentIdx = 0;
    room.state.turnCount  = 0;
    room.state.usedChars  = [];
    startNextTurn(io, room);
  });

  // CHAT — question (chat mode only)
  socket.on('whoami_question', ({ code, text }) => {
    const room = whoamiRooms[code];
    if (!room || room.state.phase !== 'playing') return;
    if (room.mode !== 'chat') return;
    const activePlayer = room.players[room.state.currentIdx];
    if (!activePlayer || activePlayer.id !== socket.id) return;
    const msg = (text || '').trim().slice(0, 120);
    if (!msg) return;

    room.state.questionCount++;
    room.state.chat.push({ type:'question', from: activePlayer.name, text: msg, ts: Date.now() });
    emitState(io, room);
  });

  // ANSWER — Yes/No/Maybe (chat mode)
  socket.on('whoami_answer', ({ code, answer }) => {
    const room = whoamiRooms[code];
    if (!room || room.state.phase !== 'playing') return;
    if (room.mode !== 'chat') return;
    const activePlayer = room.players[room.state.currentIdx];
    if (!activePlayer || activePlayer.id === socket.id) return; // active player can't answer
    if (!['yes','no','maybe'].includes(answer)) return;

    // Count votes
    const lastQ = [...room.state.chat].reverse().find(m => m.type === 'question');
    if (!lastQ || lastQ.answered) return;

    if (!lastQ.votes) lastQ.votes = {};
    const voter = room.players.find(p => p.id === socket.id);
    if (!voter) return;
    lastQ.votes[voter.name] = answer;

    // Check if all non-active connected players have voted
    const voters = room.players.filter(p => p.connected && p.id !== activePlayer.id);
    if (Object.keys(lastQ.votes).length >= voters.length) {
      // Tally majority
      const counts = { yes:0, no:0, maybe:0 };
      Object.values(lastQ.votes).forEach(v => counts[v]++);
      const majority = Object.entries(counts).sort((a,b)=>b[1]-a[1])[0][0];
      lastQ.answered = true;
      lastQ.majority = majority;
      room.state.chat.push({
        type: 'answer',
        text: majority === 'yes' ? '✅ YES' : majority === 'no' ? '❌ NO' : '🤷 MAYBE',
        ts: Date.now(),
      });
    }
    emitState(io, room);
  });

  // GUESS — active player guesses their character
  socket.on('whoami_guess', ({ code, guess }) => {
    const room = whoamiRooms[code];
    if (!room || room.state.phase !== 'playing') return;
    const activePlayer = room.players[room.state.currentIdx];
    if (!activePlayer || activePlayer.id !== socket.id) return;

    const guessClean = (guess || '').trim().toLowerCase();
    const charClean  = (room.state.activeChar || '').toLowerCase();
    const correct    = guessClean === charClean ||
                       charClean.includes(guessClean) ||
                       guessClean.includes(charClean.split(' ')[0].toLowerCase());

    if (correct) {
      activePlayer.score++;
      if (room._turnTimer) clearTimeout(room._turnTimer);
      room.state.phase = 'turn_result';
      room.state.chat.push({ type:'system', text:`✅ Correct! It was ${room.state.activeChar}!`, ts: Date.now() });
    } else {
      room.state.chat.push({ type:'system', text:`❌ Wrong guess: "${guess}"`, ts: Date.now() });
    }
    emitState(io, room);
  });

  // SURRENDER
  socket.on('whoami_surrender', ({ code }) => {
    const room = whoamiRooms[code];
    if (!room || room.state.phase !== 'playing') return;
    const activePlayer = room.players[room.state.currentIdx];
    if (!activePlayer || activePlayer.id !== socket.id) return;

    if (room._turnTimer) clearTimeout(room._turnTimer);
    room.state.phase = 'turn_result';
    room.state.chat.push({ type:'system', text:`🏳️ Surrendered. It was ${room.state.activeChar}.`, ts: Date.now() });
    emitState(io, room);
  });

  // NEXT TURN (host advances)
  socket.on('whoami_next', ({ code }) => {
    const room = whoamiRooms[code];
    if (!room || socket.id !== room.hostId) return;
    if (room.state.phase !== 'turn_result') return;

    room.state.turnCount++;
    const totalTurns = room.settings.turnsEach * room.players.filter(p=>p.connected).length;

    if (room.state.turnCount >= totalTurns) {
      room.state.phase = 'final';
      emitState(io, room);
      return;
    }

    // Advance to next connected player
    let next = (room.state.currentIdx + 1) % room.players.length;
    let safety = 0;
    while (!room.players[next].connected && safety++ < room.players.length) {
      next = (next + 1) % room.players.length;
    }
    room.state.currentIdx = next;
    startNextTurn(io, room);
  });

  // PLAY AGAIN
  socket.on('whoami_rematch', ({ code }) => {
    const room = whoamiRooms[code];
    if (!room || socket.id !== room.hostId) return;
    room.state.phase        = 'lobby';
    room.state.currentIdx   = 0;
    room.state.turnCount    = 0;
    room.state.usedChars    = [];
    room.state.chat         = [];
    room.state.activeChar   = null;
    room.state.wikiSlug     = null;
    room.players.forEach(p => p.score = 0);
    emitState(io, room);
  });

  // UPDATE SETTINGS (host only, lobby phase)
  socket.on('whoami_settings', ({ code, settings }) => {
    const room = whoamiRooms[code];
    if (!room || socket.id !== room.hostId || room.state.phase !== 'lobby') return;
    Object.assign(room.settings, settings);
    if (settings.isPublic !== undefined) room.isPublic = settings.isPublic;
    emitState(io, room);
  });

  // DISCONNECT
  socket.on('disconnect', () => {
    for (const code of Object.keys(whoamiRooms)) {
      const room = whoamiRooms[code];
      const p = room.players.find(p => p.id === socket.id);
      if (!p) continue;
      p.connected = false;
      if (socket.id === room.hostId) {
        const next = room.players.find(pl => pl.connected && pl.id !== socket.id);
        if (next) room.hostId = next.id;
      }
      emitState(io, room);
      const allGone = room.players.every(pl => !pl.connected);
      if (allGone) {
        setTimeout(() => { if (whoamiRooms[code]) delete whoamiRooms[code]; }, 60 * 60 * 1000);
      }
      break;
    }
  });
}

function getWhoamiRooms() { return Object.values(whoamiRooms); }

module.exports = { register, getWhoamiRooms };
