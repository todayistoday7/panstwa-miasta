// ═══════════════════════════════════════════════════════
// TABOO CLIENT — Team Mode
// ═══════════════════════════════════════════════════════
const socket = io();
let lang = 'en';
let myId = null;
let myName = '';
let roomCode = '';
let roomState = null;
let keepAliveInterval = null;

const TEAM_COLORS = {
  red:  { label: '🔴', name: 'Red',  cls: 'team-red'  },
  blue: { label: '🔵', name: 'Blue', cls: 'team-blue' },
};

const LANGS_TABOO = {
  pl: {
    name: '🇵🇱 PL',
    subtitle: 'Drużynowa gra imprezowa · min. 4 graczy',
    createRoom: 'Stwórz pokój', joinRoom: 'Dołącz do pokoju',
    yourName: 'Twoje imię', joinName: 'Twoje imię', roomCode: 'Kod pokoju',
    createBtn: 'Stwórz pokój', joinBtn: 'Dołącz',
    settings: 'Ustawienia', roundsTitle: 'Rundy', timerTitle: 'Czas na turę', langTitle: 'Język',
    startBtn: '🎮 Rozpocznij grę', leaveRoom: '🚪 Wyjdź',
    shareCode: 'Udostępnij ten kod znajomym', copyCode: 'Skopiuj kod',
    waitingForHost: 'Czekam na hosta...',
    howToPlay: 'Zasady gry',
    minPlayers: '⚠️ Potrzebujesz minimum 4 graczy (2 na drużynę)',
    rule1: 'Minimum 4 graczy — losowy podział na 2 drużyny',
    rule2: 'Opisujący z Drużyny A — jego drużyna zgaduje',
    rule3: 'Sędzia z Drużyny B — łapie zakazane słowa',
    rule4: 'Zgadnięte słowo = +1 dla drużyny · Zakazane słowo = +1 dla drużyny przeciwnej',
    rule5: 'Drużyny zmieniają się rolami co turę',
    rule6: 'Wygrywa drużyna z największą liczbą punktów!',
    teamRed: '🔴 Drużyna Czerwona', teamBlue: '🔵 Drużyna Niebieska',
    reshuffle: '🔀 Przetasuj drużyny',
    yourRole: 'Twoja rola:',
    describer: '🎤 OPISUJĄCY', referee: '👁 SĘDZIA', guesser: '🤔 ZGADUJĄCY',
    forbidden: 'Nie mów:', forbiddenRef: 'Słowa zakazane:',
    refereeSeesWord: 'Jesteś sędzią drużyny przeciwnej — widzisz słowo:',
    gotIt: 'Zgadli!', skip: 'Pomiń', penalty: 'Zakazane słowo! +1 dla nas',
    guesserInstruction: function(name, team) { return name + ' opisuje dla ' + team + ' — słuchaj i zgaduj!'; },
    roundOver: 'Koniec tury!', gameOver: 'Koniec gry!', newGame: 'Nowa gra', shareResults: 'Udostępnij wyniki',
    correct: '✅ Punkt dla drużyny!',
    penaltyLabel: function(team) { return '⚠️ +1 pkt dla Drużyny ' + team + '!'; },
    skipLabel: '⏭ Pominięto', timeUp: 'Czas minął!', nextRound: 'Następna tura →',
    waitingNext: 'Czekam na hosta...',
    hostBadge: 'HOST',
    nowDescribing: function(name, team) { return name + ' (' + team + ') opisuje'; },
    winner: function(team) { return '🏆 Drużyna ' + team + ' wygrywa!'; },
    draw: 'Remis! 🤝',
  },
  en: {
    name: '🇬🇧 EN',
    subtitle: 'Team party game · min. 4 players',
    createRoom: 'Create Room', joinRoom: 'Join Room',
    yourName: 'Your name', joinName: 'Your name', roomCode: 'Room code',
    createBtn: 'Create Room', joinBtn: 'Join Room',
    settings: 'Settings', roundsTitle: 'Rounds', timerTitle: 'Time per turn', langTitle: 'Language',
    startBtn: '🎮 Start Game', leaveRoom: '🚪 Leave Room',
    shareCode: 'Share this code with your friends', copyCode: 'Copy Code',
    waitingForHost: 'Waiting for host...',
    howToPlay: 'How to play',
    minPlayers: '⚠️ You need at least 4 players (2 per team)',
    rule1: 'Minimum 4 players — randomly split into 2 teams',
    rule2: 'Describer from Team A — their own team guesses',
    rule3: 'Referee from Team B — catches forbidden words',
    rule4: 'Correct guess = +1 for your team · Forbidden word caught = +1 for opposing team',
    rule5: 'Teams swap roles every turn',
    rule6: 'Team with the most points wins!',
    teamRed: '🔴 Team Red', teamBlue: '🔵 Team Blue',
    reshuffle: '🔀 Reshuffle Teams',
    yourRole: 'Your role:',
    describer: '🎤 DESCRIBER', referee: '👁 REFEREE', guesser: '🤔 GUESSER',
    forbidden: "Don't say:", forbiddenRef: 'Forbidden words:',
    refereeSeesWord: 'You are the opposing referee — you can see the word:',
    gotIt: 'Got it!', skip: 'Skip', penalty: 'Forbidden word! +1 for us',
    guesserInstruction: function(name, team) { return name + ' is describing for ' + team + ' — listen and guess!'; },
    roundOver: 'Turn Over!', gameOver: 'Game Over!', newGame: 'New Game', shareResults: 'Share Results',
    correct: '✅ Point for the team!',
    penaltyLabel: function(team) { return '⚠️ +1 pt for Team ' + team + '!'; },
    skipLabel: '⏭ Skipped', timeUp: "Time's up!", nextRound: 'Next Turn →',
    waitingNext: 'Waiting for host...',
    hostBadge: 'HOST',
    nowDescribing: function(name, team) { return name + ' (' + team + ') is describing'; },
    winner: function(team) { return '🏆 Team ' + team + ' wins!'; },
    draw: "It's a draw! 🤝",
  }
};

let L = LANGS_TABOO[lang];

// ─── SOCKET EVENTS ──────────────────────────────────────────
socket.on('connect', () => {
  myId = socket.id;
  clearInterval(keepAliveInterval);
  keepAliveInterval = setInterval(() => {
    if (roomCode) socket.emit('taboo_keep_alive', { code: roomCode });
  }, 20000);
});

socket.on('taboo_room_created', ({ code }) => {
  roomCode = code;
  document.getElementById('room-code-display').textContent = code;
  showScreen('screen-lobby');
});
socket.on('taboo_room_joined', ({ code }) => {
  roomCode = code;
  document.getElementById('room-code-display').textContent = code;
  showScreen('screen-lobby');
});
socket.on('taboo_error', ({ msg }) => { showError(msg); });
socket.on('taboo_state', (data) => { roomState = data; applyState(data); });
socket.on('taboo_score_event', ({ type, word, team }) => { addScoreTicker(type, word, team); });
socket.on('taboo_timer_tick', ({ remaining }) => { updateTimerDisplay(remaining); });

// ─── STATE HANDLER ──────────────────────────────────────────
function applyState(data) {
  switch (data.phase) {
    case 'lobby':    showScreen('screen-lobby');    renderLobby(data);    break;
    case 'playing':  showScreen('screen-playing');  renderPlaying(data);  break;
    case 'roundend': showScreen('screen-roundend'); renderRoundEnd(data); break;
    case 'final':    showScreen('screen-final');    renderFinal(data);    break;
  }
}

// ─── LOBBY ──────────────────────────────────────────────────
function renderLobby(data) {
  const { players, settings, hostId, teams } = data;
  const isHost = myId === hostId;
  const playerCount = players.filter(function(p) { return p.connected !== false; }).length;

  const el = document.getElementById('lobby-players');
  el.innerHTML = '';

  ['red','blue'].forEach(function(team) {
    const tc = TEAM_COLORS[team];
    const memberIds = teams[team] || [];
    const members = memberIds.map(function(id) { return players.find(function(p) { return p.id === id; }); }).filter(Boolean);
    const div = document.createElement('div');
    div.className = 'team-column ' + tc.cls;
    const teamLabel = team === 'red' ? L.teamRed : L.teamBlue;
    div.innerHTML = '<div class="team-col-header">' + teamLabel + '</div>' +
      members.map(function(p, i) {
        return '<div class="lobby-player' + (p.id === hostId ? ' host' : '') + '">' +
          '<div class="avatar av-' + (i % 8) + '">' + p.name.charAt(0).toUpperCase() + '</div>' +
          '<span class="pname">' + p.name + (p.id === myId ? ' (you)' : '') + '</span>' +
          (p.id === hostId ? '<span class="host-badge">' + L.hostBadge + '</span>' : '') +
          '</div>';
      }).join('');
    el.appendChild(div);
  });

  const warn = document.getElementById('player-count-warning');
  if (warn) warn.style.display = playerCount < 4 ? 'block' : 'none';

  document.getElementById('settings-rounds').value = settings.rounds || 5;
  document.getElementById('settings-timer').value = settings.turnTime || 60;

  const pillsEl = document.getElementById('lobby-lang-pills');
  pillsEl.innerHTML = '';
  Object.keys(LANGS_TABOO).forEach(function(code) {
    pillsEl.innerHTML += '<div class="lang-pill' + (code === settings.lang ? ' active' : '') + '"' +
      (isHost ? ' onclick="setLang(\'' + code + '\')"' : '') + '>' + LANGS_TABOO[code].name + '</div>';
  });

  if (isHost) {
    document.getElementById('lobby-btn-row').style.display = 'flex';
    document.getElementById('waiting-msg').style.display = 'none';
  } else {
    document.getElementById('lobby-btn-row').style.display = 'none';
    document.getElementById('waiting-msg').style.display = 'block';
    document.getElementById('waiting-msg').textContent = L.waitingForHost;
  }
}

// ─── PLAYING ─────────────────────────────────────────────────
function renderPlaying(data) {
  const { players, currentWord, turnDescriber, turnReferee, describerTeam, teams, teamTotals } = data;

  const isDescriber = myId === turnDescriber;
  const isReferee   = !isDescriber && myId === turnReferee;
  const isGuesser   = !isDescriber && !isReferee;

  const describerPlayer = players.find(function(p) { return p.id === turnDescriber; });
  const describerName = describerPlayer ? describerPlayer.name : '?';
  const teamNameClean = describerTeam === 'red' ? 'Red' : 'Blue';
  const teamNameFull  = describerTeam === 'red' ? L.teamRed : L.teamBlue;

  const banner = document.getElementById('role-banner');
  banner.className = 'taboo-role-banner role-' + (isDescriber ? describerTeam : isReferee ? 'referee' : 'guesser');
  if (isDescriber)     banner.textContent = L.yourRole + ' ' + L.describer;
  else if (isReferee)  banner.textContent = L.yourRole + ' ' + L.referee;
  else                 banner.textContent = L.nowDescribing(describerName, teamNameFull);

  document.getElementById('describer-view').style.display = isDescriber ? 'block' : 'none';
  document.getElementById('referee-view').style.display   = isReferee   ? 'block' : 'none';
  document.getElementById('guesser-view').style.display   = isGuesser   ? 'block' : 'none';

  if (!currentWord && isDescriber) pickNextWord();

  if (currentWord && (isDescriber || isReferee)) {
    const { word, forbidden } = currentWord;
    if (isDescriber) {
      document.getElementById('target-word').textContent = word;
      document.getElementById('forbidden-words').innerHTML =
        forbidden.map(function(f) { return '<div class="forbidden-word">' + f + '</div>'; }).join('');
      document.getElementById('lbl-forbidden').textContent = L.forbidden;
      document.getElementById('lbl-got-it').textContent = L.gotIt;
      document.getElementById('lbl-skip-btn').textContent = L.skip;
    }
    if (isReferee) {
      document.getElementById('referee-target-word').textContent = word;
      document.getElementById('referee-forbidden-words').innerHTML =
        forbidden.map(function(f) { return '<div class="forbidden-word">' + f + '</div>'; }).join('');
      document.getElementById('lbl-forbidden-ref').textContent = L.forbiddenRef;
      document.getElementById('lbl-referee-sees').textContent = L.refereeSeesWord;
      document.getElementById('lbl-penalty').textContent = L.penalty;
    }
  }

  if (isGuesser) {
    document.getElementById('lbl-guesser-instruction').textContent =
      L.guesserInstruction(describerName, teamNameFull);
  }

  // Live scores visible to everyone
  const sc = document.getElementById('playing-scores');
  if (sc) sc.innerHTML =
    '<div class="playing-score team-red-score">🔴 ' + (teamTotals.red || 0) + '</div>' +
    '<div class="playing-score team-blue-score">🔵 ' + (teamTotals.blue || 0) + '</div>';
}

function addScoreTicker(type, word, team) {
  const ticker = document.getElementById('score-ticker');
  if (!ticker) return;
  const div = document.createElement('div');
  div.className = 'score-event ' + type;
  if (type === 'correct')
    div.textContent = (TEAM_COLORS[team] ? TEAM_COLORS[team].label + ' ' : '') + L.correct + (word ? ' — ' + word : '');
  else if (type === 'penalty')
    div.textContent = typeof L.penaltyLabel === 'function' ? L.penaltyLabel(team === 'red' ? 'Red' : 'Blue') : L.penaltyLabel;
  else
    div.textContent = L.skipLabel + (word ? ' — ' + word : '');
  ticker.insertBefore(div, ticker.firstChild);
  if (ticker.children.length > 6) ticker.removeChild(ticker.lastChild);
}

function updateTimerDisplay(remaining) {
  ['timer-display','referee-timer','guesser-timer'].forEach(function(id) {
    const el = document.getElementById(id);
    if (el) { el.textContent = remaining; el.classList.toggle('urgent', remaining <= 10); }
  });
}

// ─── ROUND END ───────────────────────────────────────────────
function renderRoundEnd(data) {
  const { scores, round, totalRounds, hostId, teamTotals } = data;
  const isHost = myId === hostId;
  document.getElementById('lbl-round-over').textContent = L.roundOver;

  const roundScore = scores[round - 1] || { red: 0, blue: 0 };
  document.getElementById('round-result').innerHTML =
    '<span class="round-team-score team-red-score">🔴 +' + (roundScore.red || 0) + '</span>' +
    '&nbsp;&nbsp;' +
    '<span class="round-team-score team-blue-score">🔵 +' + (roundScore.blue || 0) + '</span>';

  document.getElementById('round-leaderboard').innerHTML =
    '<div class="team-total-row">' +
      '<div class="team-total-card team-red-card"><div class="team-total-label">' + L.teamRed + '</div><div class="team-total-pts">' + (teamTotals.red || 0) + '</div></div>' +
      '<div class="team-total-card team-blue-card"><div class="team-total-label">' + L.teamBlue + '</div><div class="team-total-pts">' + (teamTotals.blue || 0) + '</div></div>' +
    '</div>';

  const btn = document.getElementById('next-round-btn');
  const waiting = document.getElementById('roundend-waiting');
  if (isHost) {
    btn.style.display = 'flex';
    btn.textContent = round >= totalRounds ? '🏆 ' + L.gameOver : L.nextRound;
    waiting.style.display = 'none';
  } else {
    btn.style.display = 'none';
    waiting.style.display = 'block';
    waiting.textContent = L.waitingNext;
  }
}

// ─── FINAL ───────────────────────────────────────────────────
function renderFinal(data) {
  const { teamTotals, players, teams } = data;
  const red = teamTotals.red || 0, blue = teamTotals.blue || 0;

  let winnerHtml;
  if (red > blue)       winnerHtml = '<div class="winner-team team-red-score">'  + L.winner('Red 🔴')  + '</div>';
  else if (blue > red)  winnerHtml = '<div class="winner-team team-blue-score">' + L.winner('Blue 🔵') + '</div>';
  else                  winnerHtml = '<div class="winner-team">' + L.draw + '</div>';

  function memberList(ids) {
    return '<div class="team-members">' +
      (ids || []).map(function(id) {
        const p = players.find(function(pl) { return pl.id === id; });
        return p ? '<span class="team-member">' + p.name + (id === myId ? ' (you)' : '') + '</span>' : '';
      }).join('') + '</div>';
  }

  document.getElementById('final-leaderboard').innerHTML = winnerHtml +
    '<div class="team-total-row">' +
      '<div class="team-total-card team-red-card' + (red >= blue ? ' winner-card' : '') + '"><div class="team-total-label">' + L.teamRed + '</div><div class="team-total-pts">' + red + '</div>' + memberList(teams.red) + '</div>' +
      '<div class="team-total-card team-blue-card' + (blue >= red ? ' winner-card' : '') + '"><div class="team-total-label">' + L.teamBlue + '</div><div class="team-total-pts">' + blue + '</div>' + memberList(teams.blue) + '</div>' +
    '</div>';

  document.getElementById('lbl-game-over').textContent  = L.gameOver;
  document.getElementById('lbl-new-game').textContent    = L.newGame;
  document.getElementById('lbl-share').textContent       = L.shareResults;
}

// ─── ACTIONS ─────────────────────────────────────────────────
function pickNextWord() {
  const words = TABOO_WORDS[lang] || TABOO_WORDS['en'];
  const used = roomState ? (roomState.usedWords || []) : [];
  const available = words.filter(function(w) { return !used.includes(w.word); });
  if (!available.length) { skipWord(); return; }
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
  socket.emit('taboo_create', { name, settings: { rounds: 5, turnTime: 60, lang } });
}

function joinRoom() {
  const name = document.getElementById('join-name').value.trim();
  const code = document.getElementById('join-code').value.trim().toUpperCase();
  if (!name) { showError(lang === 'pl' ? 'Wpisz swoje imię!' : 'Enter your name!'); return; }
  if (!code || code.length < 3) { showError(lang === 'pl' ? 'Wpisz kod pokoju!' : 'Enter the room code!'); return; }
  myName = name;
  socket.emit('taboo_join', { name, code });
}

function startGame() { socket.emit('taboo_start', { code: roomCode }); }

function updateSettings() {
  const rounds   = parseInt(document.getElementById('settings-rounds').value);
  const turnTime = parseInt(document.getElementById('settings-timer').value);
  socket.emit('taboo_update_settings', { code: roomCode, settings: { rounds, turnTime, lang } });
}

function setLang(code) {
  lang = code; L = LANGS_TABOO[code] || LANGS_TABOO['en'];
  applyTranslations();
  socket.emit('taboo_update_settings', { code: roomCode, settings: { lang: code } });
}

function copyRoomCode() {
  var ta = document.createElement('textarea');
  ta.value = roomCode; ta.style.position = 'fixed'; ta.style.opacity = '0';
  document.body.appendChild(ta); ta.focus(); ta.select();
  try { document.execCommand('copy'); showToast('📋 ' + roomCode); }
  catch(e) { prompt('Room code:', roomCode); }
  document.body.removeChild(ta);
}

function shareResults() {
  var url = 'https://panstwamiastagra.com/taboo';
  var text = (lang === 'pl'
    ? 'Właśnie zagraliśmy w Tabu online! 🎭\n\nZagraj za darmo: '
    : 'We just played Taboo online! 🎭\n\nPlay for free: ') + url;
  if (navigator.share) { navigator.share({ title: 'Taboo Online', text: text, url: url }).catch(function(){}); }
  else {
    var ta = document.createElement('textarea');
    ta.value = text; ta.style.position='fixed'; ta.style.opacity='0';
    document.body.appendChild(ta); ta.focus(); ta.select();
    try { document.execCommand('copy'); showToast('📋 Copied!'); } catch(e) {}
    document.body.removeChild(ta);
  }
}

function goHome() { roomCode = ''; roomState = null; myName = ''; showScreen('screen-home'); }
function confirmGoHome() {
  if (roomState && roomState.phase !== 'lobby' && roomState.phase !== 'final') {
    document.getElementById('confirm-msg').textContent = lang === 'pl'
      ? 'Gra jest w toku. Na pewno chcesz wyjść?' : 'A game is in progress. Are you sure?';
    document.getElementById('confirm-modal').style.display = 'flex';
  } else { doGoHome(); }
}
function closeConfirm() { document.getElementById('confirm-modal').style.display = 'none'; }
function doGoHome()     { closeConfirm(); goHome(); }

// ─── LANG BAR ────────────────────────────────────────────────
function buildLangBar() {
  const bar = document.getElementById('lang-bar');
  bar.innerHTML = Object.keys(LANGS_TABOO).map(function(code) {
    return '<button class="lang-btn' + (code === lang ? ' active' : '') + '" onclick="setUiLang(\'' + code + '\')">' + LANGS_TABOO[code].name + '</button>';
  }).join('');
}

function setUiLang(code) {
  lang = code; L = LANGS_TABOO[code] || LANGS_TABOO['en'];
  document.querySelectorAll('.lang-btn').forEach(function(b) {
    b.classList.toggle('active', b.textContent === LANGS_TABOO[code].name);
  });
  applyTranslations();
}

function applyTranslations() {
  var map = {
    'game-subtitle':'subtitle',
    'lbl-create-room':'createRoom','lbl-join-room':'joinRoom',
    'lbl-your-name':'yourName','lbl-join-name':'joinName','lbl-room-code':'roomCode',
    'lbl-create-btn':'createBtn','lbl-join-btn':'joinBtn',
    'lbl-settings':'settings','lbl-rounds-title':'roundsTitle',
    'lbl-timer-title':'timerTitle','lbl-lang-title':'langTitle',
    'lbl-start-btn':'startBtn','lbl-leave-room':'leaveRoom',
    'lbl-share-code':'shareCode','lbl-copy-code':'copyCode',
    'lbl-how-to-play':'howToPlay',
    'lbl-rule-1':'rule1','lbl-rule-2':'rule2','lbl-rule-3':'rule3',
    'lbl-rule-4':'rule4','lbl-rule-5':'rule5','lbl-rule-6':'rule6',
    'lbl-reshuffle':'reshuffle','lbl-min-players':'minPlayers',
  };
  for (var id in map) {
    var el = document.getElementById(id);
    var val = L[map[id]];
    if (el && val && typeof val === 'string') el.textContent = val;
  }
}

// ─── UTILS ───────────────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(function(s) { s.classList.remove('active'); });
  document.getElementById(id).classList.add('active');
  var topNav = document.getElementById('top-nav');
  if (topNav) topNav.style.display = id === 'screen-home' ? 'none' : 'flex';
  var navCode = document.getElementById('nav-room-code');
  if (navCode && roomCode) navCode.textContent = roomCode;
  var navShare = document.getElementById('nav-share-btn');
  if (navShare) navShare.style.display = (roomCode && id !== 'screen-home') ? 'flex' : 'none';
}

function showError(msg) {
  var box = document.getElementById('home-error');
  box.textContent = msg; box.style.display = 'block';
  setTimeout(function() { box.style.display = 'none'; }, 3500);
}
function clearHomeError() { var b = document.getElementById('home-error'); if (b) b.style.display='none'; }
function clearJoinError()  { var b = document.getElementById('join-name-error'); if (b) b.style.display='none'; }

function showToast(msg) {
  var t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div'); t.id = 'toast';
    t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:var(--card);border:1px solid var(--border);color:var(--text);padding:10px 20px;border-radius:10px;font-weight:700;font-size:14px;z-index:999;';
    document.body.appendChild(t);
  }
  t.textContent = msg; t.style.display = 'block';
  clearTimeout(t._timeout);
  t._timeout = setTimeout(function() { t.style.display = 'none'; }, 3000);
}

// ─── INIT ────────────────────────────────────────────────────
buildLangBar();
applyTranslations();
