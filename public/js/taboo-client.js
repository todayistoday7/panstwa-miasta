// ═══════════════════════════════════════════════════════
// TABOO CLIENT — Team Mode v2 (bug fixes)
// ═══════════════════════════════════════════════════════
const socket = io();
const _urlLang = new URLSearchParams(window.location.search).get('lang');
let lang = (['pl','en','de','sv'].includes(_urlLang) ? _urlLang : 'pl');
let myId = null;
let myName = '';
let roomCode = '';
let roomState = null;
let keepAliveInterval = null;

const TEAM_COLORS = {
  red:  { emoji: '🔴', bg: '#ff6b6b', label: 'RED',  labelPL: 'CZERWONI', cls: 'team-red' },
  blue: { emoji: '🔵', bg: '#4dabf7', label: 'BLUE', labelPL: 'NIEBIESCY', cls: 'team-blue' },
};

const LANGS_TABOO = {
  pl: {
    name: '🇵🇱 PL',
    gameTitle: 'ZAKAZANE SŁOWA',
    subtitle: 'Drużynowa gra imprezowa · min. 4 graczy',
    createRoom: 'Stwórz pokój', joinRoom: 'Dołącz do pokoju',
    yourName: 'Twoje imię', joinName: 'Twoje imię', roomCode: 'Kod pokoju',
    createBtn: 'Stwórz pokój', joinBtn: 'Dołącz',
    settings: 'Ustawienia', roundsTitle: 'Rundy', timerTitle: 'Czas na rundę', langTitle: 'Język',
    startBtn: '🎮 Rozpocznij grę', leaveRoom: '🚪 Wyjdź',
    shareCode: 'Udostępnij ten kod znajomym', copyCode: 'Skopiuj kod',
    shareRoom: 'Udostępnij pokój', homeRejoinTip: 'Jeśli przypadkowo opuścisz grę, wróć z tym samym imieniem i kodem pokoju.',
    createDisclaimer: 'Stwórz pokój otwarty lub prywatny. Zaproś znajomych — otrzymasz kod pokoju, który przekażesz innym graczom.',
    createDisclaimer: 'Stwórz pokój otwarty lub prywatny. Zaproś znajomych — otrzymasz kod pokoju, który przekażesz innym graczom.',
    waitingForHost: 'Czekam na hosta...',
    howToPlay: 'Zasady gry',
    navHome: 'Strona główna',
    navAllGames: 'Wszystkie gry',
    minPlayers: '⚠️ Potrzebujesz minimum 4 graczy (2 na drużynę)',
    playersJoined: function(n) { return n + ' graczy dołączyło'; },
    rule1: 'Minimum 4 graczy — losowy podział na 2 drużyny',
    rule2: 'Opisujący z Drużyny A — jego drużyna zgaduje',
    rule3: 'Sędzia z Drużyny B — łapie zakazane słowa',
    rule4: 'Zgadnięte słowo = +1 dla drużyny · Zakazane słowo = +1 dla drużyny przeciwnej',
    rule5: 'Drużyny zmieniają się rolami co rundę',
    rule6: 'Wygrywa drużyna z największą liczbą punktów!',
    teamRed: '🔴 Drużyna Czerwona', teamBlue: '🔵 Drużyna Niebieska',
    yourTeam: 'Twoja drużyna',
    teammates: 'Twoja drużyna:',
    reshuffle: '🔀 Przetasuj drużyny',
    yourRole: 'Twoja rola:',
    describer: '🎤 OPISUJĄCY', referee: '👁 SĘDZIA', guesser: '🤔 ZGADUJĄCY',
    roleDescriber: function(team) { return '🎤 OPISUJESZ — ' + team + ' zgaduje'; },
    roleReferee: function(team) { return '👁 SĘDZIA — pilnujesz ' + team; },
    roleGuesserOwn: function(name, team) { return '🤔 ZGADUJ! ' + name + ' (' + team + ') opisuje dla Twojej drużyny'; },
    roleGuesserOpp: function(name, team) { return '👀 ' + name + ' (' + team + ') opisuje dla drużyny przeciwnej — czekaj na swoją rundę'; },
    forbidden: 'Nie mów:', forbiddenRef: 'Słowa zakazane:',
    refereeSeesWord: 'Widzisz słowo (pilnuj zakazanych!):',
    waitingForWord: 'Czekam aż opisujący zacznie...',
    gotIt: 'Zgadli! +1', skip: 'Pomiń', penalty: '⚠️ Zakazane słowo! +1 dla nas',
    roundOver: 'Koniec rundy!', gameOver: 'Koniec gry!', newGame: 'Nowa gra', shareResults: 'Udostępnij wyniki',
    correct: '✅ Punkt dla',
    penaltyLabel: function(team) { return '⚠️ +1 dla ' + team; },
    skipLabel: '⏭ Pominięto', timeUp: 'Czas minął!', nextRound: 'Następna runda →',
    waitingNext: 'Czekam na hosta...',
    hostBadge: 'HOST', youBadge: 'TY ·',
    thisRound: 'ta runda', total: 'łącznie',
    winner: function(team) { return '🏆 ' + team + ' wygrywa!'; },
    draw: 'Remis! 🤝',
  },
  en: {
    name: '🇬🇧 EN',
    gameTitle: 'FORBIDDEN WORDS',
    subtitle: 'Team party game · min. 4 players',
    createRoom: 'Create Room', joinRoom: 'Join Room',
    yourName: 'Your name', joinName: 'Your name', roomCode: 'Room code',
    createBtn: 'Create Room', joinBtn: 'Join Room',
    settings: 'Settings', roundsTitle: 'Rounds', timerTitle: 'Time per turn', langTitle: 'Language',
    startBtn: '🎮 Start Game', leaveRoom: '🚪 Leave Room',
    shareCode: 'Share this code with your friends', copyCode: 'Copy Code',
    shareRoom: 'Share Room', homeRejoinTip: 'If you accidentally leave mid-game, rejoin with the same name and room code.',
    createDisclaimer: 'Create a public or private room. Invite friends — you\'ll get a room code to share with other players.',
    createDisclaimer: 'Create a public or private room. Invite friends — you\'ll get a room code to share with other players.',
    waitingForHost: 'Waiting for host...',
    howToPlay: 'How to play',
    navHome: 'Home',
    navAllGames: 'All Games',
    minPlayers: '⚠️ You need at least 4 players (2 per team)',
    playersJoined: function(n) { return n + ' players joined'; },
    rule1: 'Minimum 4 players — randomly split into 2 teams',
    rule2: 'Describer from Team A — their own team guesses',
    rule3: 'Referee from Team B — catches forbidden words',
    rule4: 'Correct guess = +1 for your team · Forbidden word caught = +1 for opposing team',
    rule5: 'Teams swap roles every turn',
    rule6: 'Team with the most points wins!',
    teamRed: '🔴 Red Team', teamBlue: '🔵 Blue Team',
    yourTeam: 'Your team',
    teammates: 'Your teammates',
    reshuffle: '🔀 Reshuffle Teams',
    yourRole: 'Your role:',
    describer: '🎤 DESCRIBER', referee: '👁 REFEREE', guesser: '🤔 GUESSER',
    roleDescriber: function(team) { return '🎤 YOU ARE DESCRIBING — ' + team + ' is guessing'; },
    roleReferee: function(team) { return '👁 YOU ARE REFEREE — watch ' + team + ' for forbidden words'; },
    roleGuesserOwn: function(name, team) { return '🤔 GUESS! ' + name + ' (' + team + ') is describing for your team'; },
    roleGuesserOpp: function(name, team) { return '👀 ' + name + ' (' + team + ') is describing for the opposing team — wait for your turn'; },
    forbidden: "Don't say:", forbiddenRef: 'Forbidden words:',
    refereeSeesWord: 'You can see the word (watch for forbidden words!):',
    waitingForWord: 'Waiting for describer to pick a word...',
    gotIt: 'Got it! +1', skip: 'Skip', penalty: '⚠️ Forbidden word! +1 for us',
    roundOver: 'Turn Over!', gameOver: 'Game Over!', newGame: 'New Game', shareResults: 'Share Results',
    correct: '✅ Point for',
    penaltyLabel: function(team) { return '⚠️ +1 for ' + team; },
    skipLabel: '⏭ Skipped', timeUp: "Time's up!", nextRound: 'Next Turn →',
    waitingNext: 'Waiting for host...',
    hostBadge: 'HOST', youBadge: 'YOU',
    thisRound: 'this turn', total: 'total',
    winner: function(team) { return '🏆 ' + team + ' wins!'; },
    draw: "It's a draw! 🤝",
  },
  de: {
    name: '🇩🇪 DE',
    settings: 'Einstellungen', roundsTitle: 'Runden', timerTitle: 'Zeit pro Runde', langTitle: 'Sprache',
    startBtn: '🎮 Spiel starten', leaveRoom: '🚪 Raum verlassen',
    shareCode: 'Teile diesen Code mit deinen Freunden', copyCode: 'Code kopieren',
    shareRoom: 'Raum teilen', homeRejoinTip: 'Falls du das Spiel verlässt, tritt mit demselben Namen und Code wieder bei.',
    createDisclaimer: 'Erstelle einen öffentlichen oder privaten Raum. Lade Freunde ein — du erhältst einen Code zum Teilen.',
    waitingForHost: 'Warte auf den Host...',
    howToPlay: 'Spielregeln',
    navHome: 'Startseite',
    navAllGames: 'Alle Spiele',
    minPlayers: '⚠️ Du brauchst mindestens 4 Spieler (2 pro Team)',
    playersJoined: function(n) { return n + ' Spieler beigetreten'; },
    rule1: 'Mindestens 4 Spieler — zufällig in 2 Teams aufgeteilt',
    rule2: 'Beschreiber aus Team A — sein eigenes Team rät',
    rule3: 'Schiedsrichter aus Team B — achtet auf verbotene Wörter',
    rule4: 'Richtiges Raten = +1 für dein Team · Verbotenes Wort = +1 für das gegnerische Team',
    rule5: 'Teams tauschen jede Runde die Rollen',
    rule6: 'Das Team mit den meisten Punkten gewinnt!',
    teamRed: '🔴 Rotes Team', teamBlue: '🔵 Blaues Team',
    yourTeam: 'Dein Team',
    teammates: 'Deine Mitspieler',
    reshuffle: '🔀 Teams neu mischen',
    yourRole: 'Deine Rolle:',
    describer: '🎤 BESCHREIBER', referee: '👁 SCHIEDSRICHTER', guesser: '🤔 RATER',
    roleDescriber: function(team) { return '🎤 DU BESCHREIBST — ' + team + ' rät'; },
    roleReferee: function(team) { return '👁 DU BIST SCHIEDSRICHTER — beobachte ' + team + ' auf verbotene Wörter'; },
    roleGuesserOwn: function(name, team) { return '🤔 RATE! ' + name + ' (' + team + ') beschreibt für dein Team'; },
    roleGuesserOpp: function(name, team) { return '👀 ' + name + ' (' + team + ') beschreibt für das gegnerische Team — warte auf deine Runde'; },
    forbidden: 'Nicht sagen:', forbiddenRef: 'Verbotene Wörter:',
    refereeSeesWord: 'Du siehst das Wort (achte auf verbotene Wörter!):',
    waitingForWord: 'Warte auf den Beschreiber...',
    gotIt: 'Richtig! +1', skip: 'Überspringen', penalty: '⚠️ Verbotenes Wort! +1 für uns',
    roundOver: 'Runde vorbei!', gameOver: 'Spiel vorbei!', newGame: 'Neues Spiel', shareResults: 'Ergebnisse teilen',
    correct: '✅ Punkt für',
    penaltyLabel: function(team) { return '⚠️ +1 für ' + team; },
    skipLabel: '⏭ Übersprungen', timeUp: 'Zeit abgelaufen!', nextRound: 'Nächste Runde →',
    waitingNext: 'Warte auf den Host...',
    hostBadge: 'HOST', youBadge: 'DU',
    thisRound: 'diese Runde', total: 'gesamt',
    winner: function(team) { return '🏆 ' + team + ' gewinnt!'; },
    draw: 'Unentschieden! 🤝',
    playAgainGroup: '🔄 Nochmal mit dieser Gruppe',
    shareRoom: 'Raum teilen',
  },
  sv: {
    name: '🇸🇪 SV',
    settings: 'Inställningar', roundsTitle: 'Rundor', timerTitle: 'Tid per runda', langTitle: 'Språk',
    startBtn: '🎮 Starta spelet', leaveRoom: '🚪 Lämna rummet',
    shareCode: 'Dela den här koden med dina vänner', copyCode: 'Kopiera kod',
    shareRoom: 'Dela rum', homeRejoinTip: 'Om du lämnar spelet av misstag, gå tillbaka med samma namn och rumskod.',
    createDisclaimer: 'Skapa ett offentligt eller privat rum. Bjud in vänner — du får en kod att dela.',
    waitingForHost: 'Väntar på värden...',
    howToPlay: 'Spelregler',
    navHome: 'Startsida',
    navAllGames: 'Alla spel',
    minPlayers: '⚠️ Du behöver minst 4 spelare (2 per lag)',
    playersJoined: function(n) { return n + ' spelare gick med'; },
    rule1: 'Minst 4 spelare — slumpmässigt uppdelade i 2 lag',
    rule2: 'Beskrivaren från Lag A — deras eget lag gissar',
    rule3: 'Domaren från Lag B — fångar förbjudna ord',
    rule4: 'Rätt gissning = +1 för ditt lag · Förbjudet ord = +1 för motståndarlaget',
    rule5: 'Lagen byter roller varje runda',
    rule6: 'Laget med flest poäng vinner!',
    teamRed: '🔴 Röda laget', teamBlue: '🔵 Blå laget',
    yourTeam: 'Ditt lag',
    teammates: 'Dina lagkamrater',
    reshuffle: '🔀 Blanda om lagen',
    yourRole: 'Din roll:',
    describer: '🎤 BESKRIVARE', referee: '👁 DOMARE', guesser: '🤔 GISSARE',
    roleDescriber: function(team) { return '🎤 DU BESKRIVER — ' + team + ' gissar'; },
    roleReferee: function(team) { return '👁 DU ÄR DOMARE — bevaka ' + team + ' för förbjudna ord'; },
    roleGuesserOwn: function(name, team) { return '🤔 GISSA! ' + name + ' (' + team + ') beskriver för ditt lag'; },
    roleGuesserOpp: function(name, team) { return '👀 ' + name + ' (' + team + ') beskriver för motståndarlaget — vänta på din runda'; },
    forbidden: 'Säg inte:', forbiddenRef: 'Förbjudna ord:',
    refereeSeesWord: 'Du ser ordet (bevaka förbjudna ord!):',
    waitingForWord: 'Väntar på att beskrivaren väljer ett ord...',
    gotIt: 'Rätt! +1', skip: 'Hoppa över', penalty: '⚠️ Förbjudet ord! +1 för oss',
    roundOver: 'Rundan är slut!', gameOver: 'Spelet är slut!', newGame: 'Nytt spel', shareResults: 'Dela resultat',
    correct: '✅ Poäng för',
    penaltyLabel: function(team) { return '⚠️ +1 för ' + team; },
    skipLabel: '⏭ Hoppade över', timeUp: 'Tiden är ute!', nextRound: 'Nästa runda →',
    waitingNext: 'Väntar på värden...',
    hostBadge: 'VÄRD', youBadge: 'DU',
    thisRound: 'denna runda', total: 'totalt',
    winner: function(team) { return '🏆 ' + team + ' vinner!'; },
    draw: 'Oavgjort! 🤝',
    playAgainGroup: '🔄 Spela igen med samma grupp',
    shareRoom: 'Dela rum',
    createRoom: 'Skapa rum', joinRoom: 'Gå med i rum',
    yourName: 'Ditt namn', joinName: 'Ditt namn',
    roomCode: 'Rumskod', createBtn: '🎮 Skapa rum', joinBtn: '🚪 Gå med',
    rejoinTip: 'Om du lämnar av misstag, gå tillbaka med samma namn och rumskod.',
    offlineBadge: 'offline',
    visPrivate: 'Privat', visPublic: 'Offentlig',
  }
};

let L = LANGS_TABOO[lang];

// ─── SOCKET EVENTS ───────────────────────────────────────────────
socket.on('connect', () => {
  const prevId = myId;
  myId = socket.id;
  clearInterval(keepAliveInterval);
  keepAliveInterval = setInterval(() => {
    if (roomCode) socket.emit('taboo_keep_alive', { code: roomCode });
  }, 20000);

  // Bug 5 fix: auto-rejoin on reconnect if we were in a room
  const savedCode = sessionStorage.getItem('taboo_code');
  const savedName = sessionStorage.getItem('taboo_name');
  if (prevId && prevId !== socket.id) {
    const savedCode = sessionStorage.getItem('taboo_code');
    const savedName = sessionStorage.getItem('taboo_name');
    if (savedCode && savedName) {
      myName = savedName;
      socket.emit('taboo_rejoin', { code: savedCode, name: savedName });
    }
  }});

socket.on('taboo_room_created', ({ code }) => {
  _settingsInitTaboo = false;
  var rt=document.getElementById('rejoin-tip'); if(rt) rt.style.display='block';
  _ga('room_created', { game:'taboo', language:lang });
  roomCode = code; roomState = null;
  sessionStorage.setItem('taboo_code', code);
  sessionStorage.setItem('taboo_name', myName);
  document.getElementById('room-code-display').textContent = code;
  clearScoreTicker();
  showScreen('screen-lobby');
});

socket.on('taboo_room_joined', ({ code }) => {
  _settingsInitTaboo = false;
  var rt=document.getElementById('rejoin-tip'); if(rt) rt.style.display='block';
  _ga('room_joined', { game:'taboo', language:lang });
  roomCode = code; roomState = null;
  sessionStorage.setItem('taboo_code', code);
  sessionStorage.setItem('taboo_name', myName);
  document.getElementById('room-code-display').textContent = code;
  clearScoreTicker();
  showScreen('screen-lobby');
});

socket.on('taboo_error',       ({ msg })             => { showError(msg); });
socket.on('taboo_state',       (data)                => { roomState = data; applyState(data); });
socket.on('taboo_score_event', ({ type, word, team }) => { addScoreTicker(type, word, team); });
socket.on('taboo_timer_tick',  ({ remaining })        => { updateTimerDisplay(remaining); });

// ─── STATE HANDLER ───────────────────────────────────────────────
function applyState(data) {
  switch (data.phase) {
    case 'lobby':    showScreen('screen-lobby');    renderLobby(data);    break;
    case 'playing':  showScreen('screen-playing');  renderPlaying(data);  if(!window._gaGameStarted){_ga('game_started',{game:'taboo',language:lang});window._gaGameStarted=true;} break;
    case 'roundend': showScreen('screen-roundend'); renderRoundEnd(data); break;
    case 'final':    showScreen('screen-final');    renderFinal(data);    _ga('game_completed',{game:'taboo',language:lang}); window._gaGameStarted=false; break;
  }
}

// ─── LOBBY — Bug 1 fix: correct element IDs, player count display ─
function renderLobby(data) {
  const { players, settings, hostId, teams } = data;
  const isHost = myId === hostId;
  const connected = players.filter(p => p.connected !== false);
  const togWrap = document.getElementById('visibility-toggle');
  if (togWrap) { togWrap.style.pointerEvents = isHost ? 'auto' : 'none'; togWrap.style.opacity = isHost ? '1' : '0.4'; }
  // Only sync visibility on first load — host owns it after that
  // Don't call setVisibility() here as it triggers updateSettings()
  if (!_settingsInitTaboo && settings && settings.isPublic !== undefined) {
    _isPublic = !!settings.isPublic;
    var _vPriv = document.getElementById('vis-private');
    var _vPub  = document.getElementById('vis-public');
    if (_vPriv) _vPriv.classList.toggle('active', !_isPublic);
    if (_vPub)  _vPub.classList.toggle('active',   _isPublic);
  }
  const playerCount = connected.length;

  // Bug 1: was targeting 'lobby-players', now correctly targets 'lobby-teams'
  const teamsEl = document.getElementById('lobby-teams');
  if (teamsEl) {
    teamsEl.innerHTML = '';
    ['red', 'blue'].forEach(team => {
      const tc = TEAM_COLORS[team];
      const memberIds = (teams && teams[team]) || [];
      const members = memberIds.map(id => players.find(p => p.id === id)).filter(Boolean);
      const teamLabel = team === 'red' ? L.teamRed : L.teamBlue;

      let html = '<div class="team-column">' +
        '<div class="team-header" style="color:' + tc.bg + '">' + teamLabel + '</div>';

      if (!members.length) {
        html += '<div class="team-empty">—</div>';
      } else {
        members.forEach((p, i) => {
          html += '<div class="team-player' + (p.id === myId ? ' me' : '') + '">' +
            '<div class="avatar av-' + (i % 8) + '" style="border:2px solid ' + tc.bg + '">' +
            p.name.charAt(0).toUpperCase() + '</div>' +
            '<span>' + p.name +
            (p.id === myId  ? ' <span class="you-badge">' + L.youBadge + '</span>' : '') +
            (p.id === hostId ? ' <span class="host-badge">' + L.hostBadge + '</span>' : '') +
            '</span></div>';
        });
      }
      html += '</div>';
      teamsEl.innerHTML += html;
    });
  }

  // Player count — always visible so host knows who joined
  const warn = document.getElementById('player-warning');
  if (warn) {
    if (playerCount < 4) {
      warn.style.display = 'block';
      warn.textContent = L.minPlayers + ' (' + L.playersJoined(playerCount) + ')';
    } else {
      warn.style.display = 'block';
      warn.style.background = 'rgba(6,214,160,0.1)';
      warn.style.borderColor = 'var(--green)';
      warn.style.color = 'var(--green)';
      warn.textContent = '✓ ' + L.playersJoined(playerCount);
    }
  }

  document.getElementById('settings-rounds').value = settings.rounds || 5;
  document.getElementById('settings-timer').value  = settings.turnTime || 60;

  const pillsEl = document.getElementById('lobby-lang-pills');
  if (pillsEl) {
    pillsEl.innerHTML = '';
    Object.keys(LANGS_TABOO).forEach(code => {
      pillsEl.innerHTML += '<div class="lang-pill' + (code === settings.lang ? ' active' : '') + '"' +
        (isHost ? ' onclick="setLang(\'' + code + '\')"' : '') + '>' + LANGS_TABOO[code].name + '</div>';
    });
  }

  if (isHost) {
    document.getElementById('lobby-btn-row').style.display = 'flex';
    document.getElementById('waiting-msg').style.display   = 'none';
  } else {
    document.getElementById('lobby-btn-row').style.display = 'none';
    document.getElementById('waiting-msg').style.display   = 'block';
    document.getElementById('waiting-msg').textContent     = L.waitingForHost;
  }
}

// ─── PLAYING — Bug 2: clear role banners; Bug 4: referee always visible ──
function renderPlaying(data) {
  const { players, currentWord, turnDescriber, turnReferee, describerTeam, teams, teamTotals, scores, round } = data;

  const isDescriber  = myId === turnDescriber;
  const isReferee    = !isDescriber && myId === turnReferee;
  const isGuesser    = !isDescriber && !isReferee;

  const myTeam       = (teams && teams.red  && teams.red.includes(myId))  ? 'red'  :
                       (teams && teams.blue && teams.blue.includes(myId)) ? 'blue' : null;
  const myTeamLabel  = myTeam === 'red' ? L.teamRed : L.teamBlue;
  const myTeamColor  = myTeam ? TEAM_COLORS[myTeam].bg : 'var(--accent)';
  const opponentTeam = describerTeam === 'red' ? 'blue' : 'red';

  const describerPlayer = players.find(p => p.id === turnDescriber);
  const describerName   = describerPlayer ? describerPlayer.name : '?';
  const describerTeamLabel = describerTeam === 'red' ? L.teamRed : L.teamBlue;
  const opponentTeamLabel  = opponentTeam  === 'red' ? L.teamRed : L.teamBlue;

  // Bug 2 fix: crystal-clear role banners
  const banner = document.getElementById('role-banner');
  banner.style.borderLeft = '4px solid ' + myTeamColor;
  if (isDescriber) {
    banner.innerHTML = L.roleDescriber(opponentTeamLabel);
  } else if (isReferee) {
    banner.innerHTML = L.roleReferee(describerTeamLabel);
  } else {
    // Guesser — distinguish own team vs opposing team describing
    const describingOwnTeam = describerTeam === myTeam;
    banner.innerHTML = describingOwnTeam
      ? L.roleGuesserOwn(describerName, describerTeamLabel)
      : L.roleGuesserOpp(describerName, describerTeamLabel);
  }

  // Bug 2 fix: show "your teammates" strip below banner
  const teammatesEl = document.getElementById('my-teammates');
  if (teammatesEl && myTeam && teams) {
    const mates = (teams[myTeam] || [])
      .map(id => players.find(p => p.id === id))
      .filter(Boolean)
      .map(p => p.id === myId
        ? '<span class="teammate-you">' + p.name + ' (' + L.youBadge + ')</span>'
        : '<span class="teammate-name">' + p.name + '</span>')
      .join('');
    teammatesEl.innerHTML = '<span class="teammates-label">' + L.teammates + ':</span> ' + mates;
    teammatesEl.style.borderColor = myTeamColor;
  }

  document.getElementById('describer-view').style.display = isDescriber ? 'block' : 'none';
  document.getElementById('guesser-view').style.display   = isGuesser   ? 'block' : 'none';

  // Bug 4 fix: referee view ALWAYS shown to referee, not just when word exists
  document.getElementById('referee-view').style.display = isReferee ? 'block' : 'none';

  if (!currentWord && isDescriber) pickNextWord();

  if (isDescriber && currentWord) {
    const { word, forbidden } = currentWord;
    document.getElementById('target-word').textContent = word;
    document.getElementById('forbidden-words').innerHTML =
      forbidden.map(f => '<div class="forbidden-word">' + f + '</div>').join('');
    document.getElementById('lbl-forbidden').textContent = L.forbidden;
    document.getElementById('lbl-got-it').textContent    = L.gotIt;
    document.getElementById('lbl-skip-btn').textContent  = L.skip;
  }

  // Bug 4 fix: referee sees word if available, otherwise waiting message
  // but penalty button is ALWAYS shown
  if (isReferee) {
    document.getElementById('lbl-forbidden-ref').textContent = L.forbiddenRef;
    document.getElementById('lbl-referee-sees').textContent  = currentWord ? L.refereeSeesWord : L.waitingForWord;
    document.getElementById('lbl-penalty').textContent       = L.penalty;
    if (currentWord) {
      document.getElementById('referee-target-word').textContent = currentWord.word;
      document.getElementById('referee-forbidden-words').innerHTML =
        currentWord.forbidden.map(f => '<div class="forbidden-word">' + f + '</div>').join('');
    } else {
      document.getElementById('referee-target-word').textContent     = '—';
      document.getElementById('referee-forbidden-words').innerHTML   = '';
    }
  }



  // Live scores for everyone
  const liveEl = document.getElementById('live-scores');
  if (liveEl) {
    const rs = (scores && scores[round]) || { red: 0, blue: 0 };
    liveEl.innerHTML =
      '<span style="color:' + TEAM_COLORS.red.bg  + '">' + TEAM_COLORS.red.emoji  + ' ' + (rs.red  || 0) +
      ' <small style="color:var(--muted)">(' + (teamTotals.red  || 0) + ' ' + L.total + ')</small></span>' +
      '<span style="color:var(--muted);padding:0 8px">vs</span>' +
      '<span style="color:' + TEAM_COLORS.blue.bg + '">' + TEAM_COLORS.blue.emoji + ' ' + (rs.blue || 0) +
      ' <small style="color:var(--muted)">(' + (teamTotals.blue || 0) + ' ' + L.total + ')</small></span>';
  }
}

function clearScoreTicker() {
  const ticker = document.getElementById('score-ticker');
  if (ticker) ticker.innerHTML = '';
}

function addScoreTicker(type, word, team) {
  const ticker = document.getElementById('score-ticker');
  if (!ticker) return;
  const tc  = team ? TEAM_COLORS[team] : null;
  const div = document.createElement('div');
  div.className = 'score-event ' + type;
  if (type === 'correct')
    div.textContent = L.correct + ' ' + (tc ? tc.emoji + (lang === 'pl' ? tc.labelPL : tc.label) : '') + (word ? ' — ' + word : '');
  else if (type === 'penalty')
    div.textContent = typeof L.penaltyLabel === 'function'
      ? L.penaltyLabel(tc ? (lang === 'pl' ? tc.labelPL : tc.label) : '')
      : L.penaltyLabel;
  else
    div.textContent = L.skipLabel + (word ? ' — ' + word : '');
  ticker.insertBefore(div, ticker.firstChild);
  if (ticker.children.length > 6) ticker.removeChild(ticker.lastChild);
}

function updateTimerDisplay(remaining) {
  ['timer-display', 'referee-timer', 'guesser-timer'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.textContent = remaining; el.classList.toggle('urgent', remaining <= 10); }
  });
}

// ─── ROUND END — Bug 3 fix: use roundJustPlayed index ────────────
function renderRoundEnd(data) {
  const { scores, roundJustPlayed, round, totalRounds, hostId, teamTotals } = data;
  const isHost = myId === hostId;

  document.getElementById('lbl-round-over').textContent = L.roundOver;

  // Bug 3 fix: use roundJustPlayed (set before round counter increments)
  const roundScore = (scores && roundJustPlayed >= 0 && scores[roundJustPlayed])
    ? scores[roundJustPlayed]
    : { red: 0, blue: 0 };

  document.getElementById('round-result').innerHTML =
    '<span style="color:' + TEAM_COLORS.red.bg  + '">🔴 +' + (roundScore.red  || 0) + '</span>' +
    '&nbsp;&nbsp;' +
    '<span style="color:' + TEAM_COLORS.blue.bg + '">🔵 +' + (roundScore.blue || 0) + '</span>';

  document.getElementById('round-leaderboard').innerHTML =
    '<div class="team-scores-display">' +
      ['red','blue'].map(t =>
        '<div class="team-score-block" style="border-color:' + TEAM_COLORS[t].bg + '">' +
          '<div class="team-score-name" style="color:' + TEAM_COLORS[t].bg + '">' +
            (t === 'red' ? L.teamRed : L.teamBlue) + '</div>' +
          '<div class="team-score-big">' + (teamTotals[t] || 0) + '</div>' +
          '<div class="team-score-round">+' + (roundScore[t] || 0) + ' ' + L.thisRound + '</div>' +
        '</div>'
      ).join('') +
    '</div>';

  const btn     = document.getElementById('next-round-btn');
  const waiting = document.getElementById('roundend-waiting');
  if (isHost) {
    btn.style.display     = 'flex';
    btn.textContent       = round >= totalRounds ? '🏆 ' + L.gameOver : L.nextRound;
    waiting.style.display = 'none';
  } else {
    btn.style.display     = 'none';
    waiting.style.display = 'block';
    waiting.textContent   = L.waitingNext;
  }
}

// ─── FINAL ───────────────────────────────────────────────────────
function renderFinal(data) {
  const { teamTotals, players, teams } = data;
  const red = teamTotals.red || 0, blue = teamTotals.blue || 0;

  const winnerHtml = red > blue
    ? '<div class="winner-team" style="color:' + TEAM_COLORS.red.bg  + '">' + L.winner(L.teamRed)  + '</div>'
    : blue > red
    ? '<div class="winner-team" style="color:' + TEAM_COLORS.blue.bg + '">' + L.winner(L.teamBlue) + '</div>'
    : '<div class="winner-team">' + L.draw + '</div>';

  function memberList(ids) {
    return '<div class="team-members">' +
      (ids || []).map(id => {
        const p = players.find(pl => pl.id === id);
        return p ? '<span class="team-member">' + p.name + (id === myId ? ' (' + L.youBadge + ')' : '') + '</span>' : '';
      }).join('') + '</div>';
  }

  document.getElementById('final-leaderboard').innerHTML = winnerHtml +
    '<div class="team-scores-display">' +
      ['red','blue'].map(t =>
        '<div class="team-score-block' + ((t==='red'&&red>=blue)||(t==='blue'&&blue>=red) ? ' winner' : '') +
        '" style="border-color:' + TEAM_COLORS[t].bg + '">' +
          '<div class="team-score-name" style="color:' + TEAM_COLORS[t].bg + '">' + (t==='red' ? L.teamRed : L.teamBlue) + '</div>' +
          '<div class="team-score-big">' + (teamTotals[t] || 0) + '</div>' +
          memberList(teams[t]) +
        '</div>'
      ).join('') +
    '</div>';

  document.getElementById('lbl-game-over').textContent = L.gameOver;
  document.getElementById('lbl-new-game').textContent  = L.newGame;
  document.getElementById('lbl-share').textContent     = L.shareResults;
}

// ─── ACTIONS ─────────────────────────────────────────────────────
function pickNextWord() {
  const words     = TABOO_WORDS[lang] || TABOO_WORDS['en'];
  const used      = roomState ? (roomState.usedWords || []) : [];
  let available   = words.filter(w => !used.includes(w.word));
  // Exhausted all words — request server to reset usedWords then pick from full pool
  if (!available.length) {
    socket.emit('taboo_reset_words', { code: roomCode });
    available = words; // use full pool immediately for this pick
  }
  const pick = available[Math.floor(Math.random() * available.length)];
  socket.emit('taboo_word_request', { code: roomCode, word: pick.word, forbidden: pick.forbidden });
}

function gotIt()          { socket.emit('taboo_got_it',      { code: roomCode }); }
function skipWord()       { socket.emit('taboo_skip',        { code: roomCode }); }
function refereePenalty() { socket.emit('taboo_penalty',     { code: roomCode }); }
function nextRound()      { socket.emit('taboo_next_round',  { code: roomCode }); }
function reshuffleTeams() { socket.emit('taboo_reshuffle',   { code: roomCode }); }

function createRoom() {
  const name = document.getElementById('host-name').value.trim();
  if (!name) { showError(lang === 'pl' ? 'Wpisz swoje imię!' : 'Enter your name!'); return; }
  myName = name;
  socket.emit('taboo_create', { name, settings: { rounds: 5, turnTime: 60, lang, isPublic: getIsPublic() } });
}

function joinRoom() {
  const name = document.getElementById('join-name').value.trim();
  const code = document.getElementById('join-code').value.trim().toUpperCase();
  if (!name) { showError(lang === 'pl' ? 'Wpisz swoje imię!' : 'Enter your name!'); return; }
  if (!code || code.length < 3) { showError(lang === 'pl' ? 'Wpisz kod pokoju!' : 'Enter the room code!'); return; }
  myName = name;
  socket.emit('taboo_join', { name, code });
}

function startGame()    { _ga('game_start_pressed',{game:'taboo',language:lang}); socket.emit('taboo_start', { code: roomCode }); }
function updateSettings() {
  const rounds   = parseInt(document.getElementById('settings-rounds').value);
  const turnTime = parseInt(document.getElementById('settings-timer').value);
  socket.emit('taboo_update_settings', { code: roomCode, settings: { rounds, turnTime, lang, isPublic: getIsPublic() } });
}

function setLang(code) {
  lang = code; L = LANGS_TABOO[code] || LANGS_TABOO['en'];
  applyTranslations();
  socket.emit('taboo_update_settings', { code: roomCode, settings: { lang: code } });
}

function copyRoomCode() { shareRoom('taboo'); }

function shareResults() {
  var url  = 'https://panstwamiastagra.com/taboo';
  var text = (lang === 'pl'
    ? 'Właśnie zagraliśmy w Zakazane Słowa online! 🎭\n\nZagraj za darmo: '
    : 'We just played Forbidden Words online! 🎭\n\nPlay for free: ') + url;
  if (navigator.share) { navigator.share({ title: 'Forbidden Words Online', text, url }).catch(() => {}); }
  else {
    var ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.focus(); ta.select();
    try { document.execCommand('copy'); showToast('📋 Copied!'); } catch(e) {}
    document.body.removeChild(ta);
  }
}

function playAgainGroup() {
  socket.emit('taboo_create', { name: myName, settings: {
    rounds: 5, turnTime: 60, lang, isPublic: getIsPublic(),
    keepGroup: true,
  }});
}

socket.on('taboo_group_rematch', ({ code }) => {
  roomCode = code;
  sessionStorage.setItem('taboo_code', code);
  sessionStorage.setItem('taboo_name', myName);
  socket.emit('taboo_join', { name: myName, code: code });
  showToast(lang === 'pl'
    ? '🔄 Host zaczął nową grę — dołączasz automatycznie!'
    : '🔄 Host started a new game — joining automatically!', 5000);
});

function goHome() {
  roomCode = ''; roomState = null; myName = '';
  sessionStorage.removeItem('taboo_code');
  sessionStorage.removeItem('taboo_name');
  clearScoreTicker();
  showScreen('screen-home');
}
function confirmGoHome() {
  if (roomCode) {
    // Warn whenever in a room — lobby or in-game
    const inGame = roomState && roomState.phase !== 'lobby' && roomState.phase !== 'final';
    document.getElementById('confirm-msg').textContent = inGame
      ? (lang === 'pl' ? 'Gra jest w toku. Na pewno chcesz wyjść?' : 'A game is in progress. Are you sure you want to leave?')
      : (lang === 'pl' ? 'Na pewno chcesz opuścić pokój?' : 'Are you sure you want to leave the room?');
    document.getElementById('confirm-modal').style.display = 'flex';
  } else { doGoHome(); }
}
function closeConfirm() { document.getElementById('confirm-modal').style.display = 'none'; }
function doGoHome()     { closeConfirm(); goHome(); }

// ─── LANG BAR ────────────────────────────────────────────────────
function buildLangBar() {
  const bar = document.getElementById('lang-bar');
  bar.innerHTML = Object.keys(LANGS_TABOO).map(code =>
    '<button class="lang-btn' + (code === lang ? ' active' : '') + '" onclick="setUiLang(\'' + code + '\')">' +
    LANGS_TABOO[code].name + '</button>'
  ).join('');
}

function setUiLang(code) {
  lang = code; L = LANGS_TABOO[code] || LANGS_TABOO['en'];
  document.querySelectorAll('.lang-btn').forEach(b =>
    b.classList.toggle('active', b.textContent === LANGS_TABOO[code].name));
  applyTranslations();
  // Also update game lang setting if in a room
  if (roomCode) socket.emit('taboo_update_settings', { code: roomCode, settings: { lang: code, isPublic: getIsPublic() } });
  if (roomState) applyState(roomState);
  _ga('language_switched',{game:'taboo',new_language:code});
  history.replaceState(null, '', window.location.pathname + '?lang=' + code);
  if (typeof window._rebuildBurger === 'function') window._rebuildBurger(code);
  if (typeof window._refreshFooter  === 'function') window._refreshFooter();
}

function applyTranslations() {
  const map = {
    'game-title':   'gameTitle', 'game-subtitle':'subtitle',
    'lbl-create-room':'createRoom','lbl-create-disclaimer':'createDisclaimer','lbl-join-room':'joinRoom',
    'lbl-your-name':'yourName','lbl-join-name':'joinName','lbl-room-code':'roomCode',
    'lbl-create-btn':'createBtn','lbl-join-btn':'joinBtn',
    'lbl-settings':'settings','lbl-rounds-title':'roundsTitle',
    'lbl-timer-title':'timerTitle','lbl-lang-title':'langTitle',
    'lbl-start-btn':'startBtn','lbl-leave-room':'leaveRoom',
    'lbl-share-code':'shareCode','lbl-copy-code':'copyCode',
    'lbl-share-room':'shareRoom','lbl-home-rejoin-tip':'homeRejoinTip',
    'lbl-how-to-play':'howToPlay',
    'lbl-nav-home':         'navHome',
    'lbl-nav-all-games':    'navAllGames',
    'lbl-rule-1':'rule1','lbl-rule-2':'rule2','lbl-rule-3':'rule3',
    'lbl-rule-4':'rule4','lbl-rule-5':'rule5','lbl-rule-6':'rule6',
    'lbl-lobby-how-to-play':'howToPlay',
    'lbl-lobby-rule-1':'rule1',
    'lbl-lobby-rule-2':'rule2',
    'lbl-lobby-rule-3':'rule3',
    'lbl-lobby-rule-4':'rule4',
    'lbl-lobby-rule-5':'rule5',
    'lbl-lobby-rule-6':'rule6',
    'lbl-reshuffle':'reshuffle',
    'lbl-play-again':'playAgainGroup',
  };
  for (const [id, key] of Object.entries(map)) {
    const el = document.getElementById(id);
    if (el && L[key] && typeof L[key] === 'string') el.textContent = L[key];
  }

  document.querySelectorAll('.lbl-nav-home-dup').forEach(function(el) { if (L.navHome) el.textContent = L.navHome; });
  document.querySelectorAll('.lbl-nav-all-games-dup').forEach(function(el) { if (L.navAllGames) el.textContent = L.navAllGames; });
}

// ─── UTILS ───────────────────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  const topNav = document.getElementById('top-nav');
  if (topNav) topNav.style.display = id === 'screen-home' ? 'none' : 'flex';
  const navCode = document.getElementById('nav-room-code');
  if (navCode && roomCode) navCode.textContent = roomCode;
  const navShare = document.getElementById('nav-share-btn');
  if (navShare) navShare.style.display = (roomCode && id !== 'screen-home') ? 'flex' : 'none';
}

function showError(msg) {
  const box = document.getElementById('home-error');
  box.textContent = msg; box.style.display = 'block';
  setTimeout(() => box.style.display = 'none', 3500);
}
function clearHomeError() { const b = document.getElementById('home-error'); if (b) b.style.display = 'none'; }
function clearJoinError()  { const b = document.getElementById('join-name-error'); if (b) b.style.display = 'none'; }

function showToast(msg) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div'); t.id = 'toast';
    t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:var(--card);border:1px solid var(--border);color:var(--text);padding:10px 20px;border-radius:10px;font-weight:700;font-size:14px;z-index:999;';
    document.body.appendChild(t);
  }
  t.textContent = msg; t.style.display = 'block';
  clearTimeout(t._timeout);
  t._timeout = setTimeout(() => t.style.display = 'none', 3000);
}

// ─── INIT ────────────────────────────────────────────────────────
buildLangBar();
applyTranslations();
initVisibilityToggle();
prefillJoinCode();
