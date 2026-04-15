'use strict';
// ════════════════════════════════════════════════════════
// CORPORATE BINGO — Server Route
// 2-20 players, randomised 5x5 cards, any line wins
// ════════════════════════════════════════════════════════

const crypto = require('crypto');

const bingoRooms = {};

function makeCode() {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeCard(phrases) {
  // Pick 24 random phrases + FREE centre = 25 squares
  const picked = shuffle(phrases).slice(0, 24);
  // Insert FREE in centre (index 12)
  picked.splice(12, 0, '__FREE__');
  return picked; // array of 25
}

function checkBingo(marked) {
  // marked is array of 25 booleans, row-major order
  const lines = [
    // rows
    [0,1,2,3,4],[5,6,7,8,9],[10,11,12,13,14],[15,16,17,18,19],[20,21,22,23,24],
    // cols
    [0,5,10,15,20],[1,6,11,16,21],[2,7,12,17,22],[3,8,13,18,23],[4,9,14,19,24],
    // diagonals
    [0,6,12,18,24],[4,8,12,16,20],
  ];
  return lines.some(line => line.every(i => marked[i]));
}

function emitBingoState(io, room) {
  const state = {
    code:     room.code,
    phase:    room.phase,
    hostId:   room.hostId,
    lang:     room.lang,
    players:  room.players.map(p => ({
      id:        p.id,
      name:      p.name,
      connected: p.connected,
      bingo:     p.bingo,
      markedCount: p.marked ? p.marked.filter(Boolean).length : 0,
      marked:    p.marked || [],
    })),
  };
  // Each player gets their own card — emit individually
  room.players.forEach(p => {
    io.to(p.id).emit('bingo_state', {
      ...state,
      myCard:   p.card,
      myMarked: p.marked,
    });
  });
}

function getBingoRooms() {
  return Object.values(bingoRooms);
}

function register(io, socket) {

    // ── Create room ─────────────────────────────────────
    socket.on('bingo_create', ({ name, lang }) => {
      const trimmed = (name || '').trim();
      if (!trimmed) { socket.emit('bingo_error', { msg: 'Please enter your name.' }); return; }
      if (isBotName(trimmed)) { socket.emit('bingo_error', { msg: 'Invalid name.' }); return; }

      const code = makeCode();
      const room = {
        code,
        hostId:  socket.id,
        phase:   'lobby',
        lang:    lang || 'pl',
        players: [],
        _timer:  null,
      };

      room.players.push({
        id: socket.id, name: trimmed,
        connected: true, bingo: false,
        card: [], marked: Array(25).fill(false),
      });

      bingoRooms[code] = room;
      socket.join(code);
      socket.emit('bingo_created', { code });
      emitBingoState(io, room);

      // 24h expiry in lobby
      room._timer = setTimeout(() => {
        if (bingoRooms[code] && bingoRooms[code].phase === 'lobby') delete bingoRooms[code];
      }, 24 * 60 * 60 * 1000);
    });

    // ── Join room ────────────────────────────────────────
    socket.on('bingo_join', ({ name, code }) => {
      const trimmed = (name || '').trim();
      const room = bingoRooms[(code || '').toUpperCase().trim()];
      if (!room) { socket.emit('bingo_error', { msg: 'Room not found.' }); return; }
      if (room.players.length >= 50) { socket.emit('bingo_error', { msg: 'Room is full (max 50).' }); return; }
      if (!trimmed) { socket.emit('bingo_error', { msg: 'Please enter your name.' }); return; }
      if (isBotName(trimmed)) { socket.emit('bingo_error', { msg: 'Invalid name.' }); return; }

      // Rejoin
      const existing = room.players.find(p => p.name.toLowerCase() === trimmed.toLowerCase());
      if (existing) {
        if (existing._disconnectTimer) { clearTimeout(existing._disconnectTimer); existing._disconnectTimer = null; }
        existing.id = socket.id;
        existing.connected = true;
        socket.join(code);
        socket.emit('bingo_joined', { code, isHost: socket.id === room.hostId });
        emitBingoState(io, room);
        return;
      }

      if (room.phase !== 'lobby') { socket.emit('bingo_error', { msg: 'Game already started.' }); return; }

      room.players.push({
        id: socket.id, name: trimmed,
        connected: true, bingo: false,
        card: [], marked: Array(25).fill(false),
      });
      socket.join(code);
      socket.emit('bingo_joined', { code, isHost: false });
      emitBingoState(io, room);
    });

    // ── Start game ───────────────────────────────────────
    socket.on('bingo_start', ({ code }) => {
      const room = bingoRooms[code];
      if (!room || socket.id !== room.hostId) return;
      if (room.players.filter(p => p.connected).length < 2) {
        socket.emit('bingo_error', { msg: 'Need at least 2 players.' }); return;
      }

      const phrases = PHRASES[room.lang] || PHRASES['en'];
      room.players.forEach(p => {
        p.card   = makeCard(phrases);
        p.marked = p.card.map(sq => sq === '__FREE__'); // FREE always pre-marked
        p.bingo  = false;
      });

      room.phase = 'playing';
      if (room._timer) { clearTimeout(room._timer); room._timer = null; }
      emitBingoState(io, room);
    });

    // ── Mark a square ────────────────────────────────────
    socket.on('bingo_mark', ({ code, index }) => {
      const room = bingoRooms[code];
      if (!room || room.phase !== 'playing') return;
      const player = room.players.find(p => p.id === socket.id);
      if (!player) return;
      if (index < 0 || index > 24) return;
      if (player.card[index] === '__FREE__') return; // can't unmark free

      // Toggle
      player.marked[index] = !player.marked[index];
      emitBingoState(io, room);
    });

    // ── Call BINGO ───────────────────────────────────────
    socket.on('bingo_call', ({ code }) => {
      const room = bingoRooms[code];
      if (!room || room.phase !== 'playing') return;
      const player = room.players.find(p => p.id === socket.id);
      if (!player) return;

      if (checkBingo(player.marked)) {
        player.bingo = true;
        room.phase   = 'final';
        emitBingoState(io, room);
        // Clean up after 2 hours
        setTimeout(() => { if (bingoRooms[code]) delete bingoRooms[code]; }, 2 * 60 * 60 * 1000);
      } else {
        // False bingo — notify caller only
        socket.emit('bingo_false', {});
      }
    });

    // ── Play again ───────────────────────────────────────
    socket.on('bingo_restart', ({ code }) => {
      const room = bingoRooms[code];
      if (!room || socket.id !== room.hostId) return;
      room.phase = 'lobby';
      room.players.forEach(p => {
        p.card   = [];
        p.marked = Array(25).fill(false);
        p.bingo  = false;
      });
      emitBingoState(io, room);
    });

    // ── Disconnect ───────────────────────────────────────
    socket.on('disconnect', () => {
      for (const [code, room] of Object.entries(bingoRooms)) {
        const player = room.players.find(p => p.id === socket.id);
        if (!player) continue;
        player.connected = false;
        player._disconnectTimer = setTimeout(() => {
          if (!player.connected) {
            room.players = room.players.filter(p => p.id !== socket.id);
            if (room.players.length === 0) {
              delete bingoRooms[code];
            } else {
              if (room.hostId === socket.id && room.players.length > 0) {
                room.hostId = room.players.find(p => p.connected)?.id || room.players[0].id;
              }
              emitBingoState(io, room);
            }
          }
        }, room.phase === 'lobby' ? 600000 : 45000); // 10min lobby, 45s game
        emitBingoState(io, room);
        break;
      }
    });

}

// ════════════════════════════════════════════════════════
// PHRASES — 50 per language, naturally translated
// ════════════════════════════════════════════════════════
const PHRASES = {
  en: [
    'Can you hear me?',
    "You're on mute",
    "I'll share my screen",
    "Let's take this offline",
    'Circle back',
    'Touch base',
    'Move the needle',
    'Low-hanging fruit',
    'Deep dive',
    'Bandwidth',
    'Ping me',
    'At the end of the day',
    'Synergy',
    'Going forward',
    'Leverage',
    'Scalable solution',
    'Paradigm shift',
    'Think outside the box',
    "Let's align on this",
    'Action items',
    'Key takeaways',
    'Boil the ocean',
    'Quick win',
    'Best practices',
    'Value add',
    'On my radar',
    'Take it to the next level',
    'Holistic approach',
    'Streamline the process',
    'Core competency',
    'Game changer',
    'Agile',
    'Disruptive',
    'Stakeholder',
    'Deliverables',
    'Ballpark figure',
    'Run it up the flagpole',
    'Peel back the onion',
    'We need to be proactive',
    'ROI',
    'KPI',
    'The ask',
    'Cadence',
    'Visibility',
    'Runway',
    'Ideate',
    'Pain points',
    'Ecosystem',
    'Robust',
    'On the same page',
  ],
  pl: [
    'Słyszysz mnie?',
    'Jesteś wyciszony',
    'Udostępnię ekran',
    'Porozmawiajmy o tym po spotkaniu',
    'Wróćmy do tego',
    'Skontaktujmy się',
    'Ruszyć z miejsca',
    'Najniżej wiszący owoc',
    'Zagłębić się w temat',
    'Odezwij się do mnie',
    'Synergia',
    'Idąc naprzód',
    'Skalowalne rozwiązanie',
    'Zmiana paradygmatu',
    'Myśleć nieszablonowo',
    'Uzgodnijmy to',
    'Punkty do działania',
    'Kluczowe wnioski',
    'Szybka wygrana',
    'Najlepsze praktyki',
    'Wartość dodana',
    'Mam to na oku',
    'Przenieść na wyższy poziom',
    'Podejście holistyczne',
    'Usprawnić proces',
    'Kluczowe kompetencje',
    'Interesariusz',
    'Wyniki do dostarczenia',
    'Orientacyjna liczba',
    'Sprawdźmy to u managmentu',
    'Musimy być proaktywni',
    'Zwrot z inwestycji',
    'Wskaźnik KPI',
    'Widoczność',
    'Generować pomysły',
    'Punkty bólu',
    'Solidny',
    'Na tej samej stronie',
    // Added — authentic Polish office phrases
    'Jesteś na mjucie',
    'Widać mój ekran?',
    'Zróbmy burzę mózgów',
    'Słychać mnie?',
    'Wróćmy do tego offline',
    'Folołap (Follow-up)',
    'Zasinkować się (Sync)',
    'Dotknijmy tego tematu',
    'Deep dive',
    'Ten miting się przedłuża',
    'Czy ktoś ma jeszcze pytania?',
    'Mamy bottleneck',
    'To jest win-win',
    'Wyjdźmy poza pudełko',
    'ASAP',
    'Na wczoraj',
    'Value / wartość biznesowa',
    'Ktoś chce coś dodać?',
    'Oddaję głos',
    'To jest draft',
    'Zróbmy rundkę',
    'Coś mi się zawiesiło',
    'Miałem inny call',
  ],
  de: [
    'Können Sie mich hören?',
    'Sie sind stummgeschaltet',
    'Ich teile meinen Bildschirm',
    'Lass uns das offline besprechen',
    'Darauf zurückkommen',
    'Kurz abstimmen',
    'Etwas voranbringen',
    'Tief hängende Früchte',
    'Tief eintauchen',
    'Kapazitäten',
    'Schreib mir kurz',
    'Am Ende des Tages',
    'Synergie',
    'Zukünftig',
    'Nutzen',
    'Skalierbare Lösung',
    'Paradigmenwechsel',
    'Über den Tellerrand denken',
    'Lass uns das abstimmen',
    'Maßnahmen',
    'Wichtigste Erkenntnisse',
    'Das Rad neu erfinden',
    'Schneller Erfolg',
    'Best Practices',
    'Mehrwert',
    'Auf meinem Radar',
    'Auf das nächste Level bringen',
    'Ganzheitlicher Ansatz',
    'Prozess optimieren',
    'Kernkompetenz',
    'Spielveränderer',
    'Agil',
    'Disruptiv',
    'Stakeholder',
    'Ergebnisse',
    'Ungefähre Zahl',
    'Das nach oben eskalieren',
    'Die Zwiebel schälen',
    'Wir müssen proaktiv sein',
    'ROI',
    'KPI',
    'Die Anfrage',
    'Takt',
    'Sichtbarkeit',
    'Runway',
    'Ideen entwickeln',
    'Schmerzpunkte',
    'Ökosystem',
    'Robust',
    'Auf derselben Seite sein',
  ],
  sv: [
    'Kan du höra mig?',
    'Du är på mute',
    'Jag delar min skärm',
    'Vi tar det offline',
    'Återkoppla',
    'Ta en kaffe efteråt',
    'Flytta nålen',
    'Lågt hängande frukt',
    'Deep dive',
    'Bandbredd',
    'Pinga mig',
    'I slutändan',
    'Synergi',
    'Framöver',
    'Utnyttja',
    'Skalbar lösning',
    'Paradigmskifte',
    'Tänk utanför boxen',
    'Vi alignar om det',
    'Action points',
    'Viktiga takeaways',
    'Koka havet',
    'Låt oss ta det i ett separat möte',
    'Rätt personer i rummet',
    'Nästa steg',
    'Skapa värde',
    'Datadrivet',
    'Agilt arbetssätt',
    'Transparens',
    'Proaktivt förhållningssätt',
    'Helhetsperspektiv',
    'Leverera resultat',
    'Stärka varumärket',
    'Hållbar tillväxt',
    'Tvärfunktionellt team',
    'Bästa praxis',
    'Benchmarking',
    'KPI:er',
    'Win-win',
    'Game changer',
    'Disruptivt',
    'Innovationsdrivet',
    'Stå i framkant',
    'Nyttorealisering',
    'Förankra beslut',
    'Spela i samma lag',
    'Ta ägarskap',
    'Vi ligger rätt i tid',
    'Effektivisering',
    'Omvärldsbevakning',
  ],

};

module.exports = { register, getBingoRooms };
const { isBotName, isHoneypot } = require('./botfilter');
