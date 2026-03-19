// ═══════════════════════════════════════════════════════
// TABOO CLIENT
// ═══════════════════════════════════════════════════════
const socket = io();
let lang = 'en';
let myId = null;
let myName = '';
let roomCode = '';
let roomState = null;
let timerInterval = null;
let keepAliveInterval = null;

const LANGS_TABOO = {
  pl: {
    name: '🇵🇱 PL',
    subtitle: 'Gra wieloosobowa',
    createRoom: 'Stwórz pokój', joinRoom: 'Dołącz do pokoju',
    yourName: 'Twoje imię', joinName: 'Twoje imię', roomCode: 'Kod pokoju',
    createBtn: 'Stwórz pokój', joinBtn: 'Dołącz',
    playersInRoom: 'Gracze w pokoju', settings: 'Ustawienia',
    roundsTitle: 'Rundy', timerTitle: 'Czas na turę', langTitle: 'Język',
    startBtn: '🎮 Rozpocznij grę', leaveRoom: '🚪 Wyjdź',
    shareCode: 'Udostępnij ten kod znajomym', copyCode: 'Skopiuj kod',
    waitingForHost: 'Czekam na hosta...',
    howToPlay: 'Zasady gry',
    rule1: 'Stwórz pokój i udostępnij kod znajomym',
    rule2: 'Jeden gracz opisuje, jeden jest sędzią',
    rule3: 'Opisujący mówi — drużyna zgaduje słowo',
    rule4: 'Nie wolno używać 5 zakazanych słów ani samego słowa!',
    rule5: 'Sędzia klika SKIP gdy padnie zakazane słowo',
    rule6: 'Zgadnij jak najwięcej słów w 60 sekund!',
    yourRole: 'Twoja rola:',
    describer: '🎤 OPISUJĄCY',
    referee: '👁 SĘDZIA',
    guesser: '🤔 ZGADUJĄCY',
    forbidden: 'Nie mów:',
    forbiddenRef: 'Słowa zakazane:',
    refereeSeesWord: 'Jesteś sędzią — widzisz słowo:',
    gotIt: 'Zgadli!',
    skip: 'Pomiń',
    penalty: 'Zakazane słowo!',
    guesserInstruction: 'Słuchaj uważnie i zgaduj!',
    roundOver: 'Koniec rundy!',
    gameOver: 'Koniec gry!',
    newGame: 'Nowa gra',
    shareResults: 'Udostępnij wyniki',
    correct: '✅ Punkt!',
    penaltyLabel: '⚠️ Kara',
    skipLabel: '⏭ Pominięto',
    timeUp: 'Czas minął!',
    nextRound: 'Następna runda →',
    waitingNext: 'Czekam na hosta...',
    wordsGuessed: 'słów zgadniętych',
    hostBadge: 'HOST',
  },
  en: {
    name: '🇬🇧 EN',
    subtitle: 'Multiplayer word game',
    createRoom: 'Create Room', joinRoom: 'Join Room',
    yourName: 'Your name', joinName: 'Your name', roomCode: 'Room code',
    createBtn: 'Create Room', joinBtn: 'Join Room',
    playersInRoom: 'Players in room', settings: 'Settings',
    roundsTitle: 'Rounds', timerTitle: 'Time per turn', langTitle: 'Language',
    startBtn: '🎮 Start Game', leaveRoom: '🚪 Leave Room',
    shareCode: 'Share this code with your friends', copyCode: 'Copy Code',
    waitingForHost: 'Waiting for host...',
    howToPlay: 'How to play',
    rule1: 'Create a room and share the code with friends',
    rule2: 'One player is the Describer, one is the Referee',
    rule3: 'Describer speaks — team guesses the secret word',
    rule4: 'Never say the 5 forbidden words or the word itself!',
    rule5: 'Referee taps SKIP if a forbidden word is said',
    rule6: 'Guess as many words as possible in 60 seconds!',
    yourRole: 'Your role:',
    describer: '🎤 DESCRIBER',
    referee: '👁 REFEREE',
    guesser: '🤔 GUESSER',
    forbidden: "Don't say:",
    forbiddenRef: 'Forbidden words:',
    refereeSeesWord: 'You are the referee — you can see the word:',
    gotIt: 'Got it!',
    skip: 'Skip',
    penalty: 'Forbidden word!',
    guesserInstruction: 'Listen carefully and guess!',
    roundOver: 'Round Over!',
    gameOver: 'Game Over!',
    newGame: 'New Game',
    shareResults: 'Share Results',
    correct: '✅ Point!',
    penaltyLabel: '⚠️ Penalty',
    skipLabel: '⏭ Skipped',
    timeUp: "Time's up!",
    nextRound: 'Next Round →',
    waitingNext: 'Waiting for host...',
    wordsGuessed: 'words guessed',
    hostBadge: 'HOST',
  }
};

let L = LANGS_TABOO[lang];

// ─── SOCKET EVENTS ───────────────────────────────────────────────
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

socket.on('taboo_state', (data) => {
  roomState = data;
  applyState(data);
});

socket.on('taboo_score_event', ({ type, word }) => {
  addScoreTicker(type, word);
});

socket.on('taboo_timer_tick', ({ remaining }) => {
  updateTimerDisplay(remaining);
});

// ─── STATE HANDLER ───────────────────────────────────────────────
function applyState(data) {
  const { phase } = data;
  switch (phase) {
    case 'lobby':   showScreen('screen-lobby');    renderLobby(data);    break;
    case 'playing': showScreen('screen-playing');  renderPlaying(data);  break;
    case 'roundend':showScreen('screen-roundend'); renderRoundEnd(data); break;
    case 'final':   showScreen('screen-final');    renderFinal(data);    break;
  }
}

// ─── LOBBY ───────────────────────────────────────────────
function renderLobby(data) {
  const { players, settings, hostId } = data;
  const isHost = myId === hostId;

  const el = document.getElementById('lobby-players');
  el.innerHTML = '';
  players.forEach((p, i) => {
    el.innerHTML += '<div class="lobby-player' + (p.id===hostId?' host':'') + '">' +
      '<div class="avatar av-' + (i%8) + '">' + p.name.charAt(0).toUpperCase() + '</div>' +
      '<span class="pname">' + p.name + (p.id===myId?' (you)':'') + '</span>' +
      (p.id===hostId ? '<span class="host-badge">' + L.hostBadge + '</span>' : '') +
      '</div>';
  });

  document.getElementById('settings-rounds').value = settings.rounds || 5;
  document.getElementById('settings-timer').value = settings.turnTime || 60;

  // Lang pills
  const pillsEl = document.getElementById('lobby-lang-pills');
  pillsEl.innerHTML = '';
  Object.keys(LANGS_TABOO).forEach(code => {
    pillsEl.innerHTML += '<div class="lang-pill' + (code===settings.lang?' active':'') + '"' +
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

// ─── PLAYING ───────────────────────────────────────────────
function renderPlaying(data) {
  const { describerIndex, refereeIndex, players, currentWord, turnTime } = data;
  const connected = players.filter(p => p.connected !== false);
  const describer = connected[describerIndex % connected.length];
  const referee = connected[refereeIndex % connected.length];

  const isDescriber = myId === (describer && describer.id);
  const isReferee = !isDescriber && myId === (referee && referee.id);
  const isGuesser = !isDescriber && !isReferee;

  // Role banner
  const banner = document.getElementById('role-banner');
  if (isDescriber) banner.textContent = L.yourRole + ' ' + L.describer;
  else if (isReferee) banner.textContent = L.yourRole + ' ' + L.referee;
  else banner.textContent = L.yourRole + ' ' + L.guesser;

  document.getElementById('describer-view').style.display = isDescriber ? 'block' : 'none';
  document.getElementById('referee-view').style.display = isReferee ? 'block' : 'none';
  document.getElementById('guesser-view').style.display = isGuesser ? 'block' : 'none';

  // If no current word and it's our turn to describe, pick one
  if (!currentWord && isDescriber) {
    pickNextWord();
  }

  if (currentWord && (isDescriber || isReferee)) {
    const { word, forbidden } = currentWord;

    if (isDescriber) {
      document.getElementById('target-word').textContent = word;
      const fw = document.getElementById('forbidden-words');
      fw.innerHTML = forbidden.map(f => '<div class="forbidden-word">' + f + '</div>').join('');
      document.getElementById('lbl-forbidden').textContent = L.forbidden;
      document.getElementById('lbl-got-it').textContent = L.gotIt;
      document.getElementById('lbl-skip-btn').textContent = L.skip;
    }

    if (isReferee) {
      document.getElementById('referee-target-word').textContent = word;
      const rfw = document.getElementById('referee-forbidden-words');
      rfw.innerHTML = forbidden.map(f => '<div class="forbidden-word">' + f + '</div>').join('');
      document.getElementById('lbl-forbidden-ref').textContent = L.forbiddenRef;
      document.getElementById('lbl-referee-sees').textContent = L.refereeSeesWord;
      document.getElementById('lbl-penalty').textContent = L.penalty;
    }
  }

  if (isGuesser) {
    const desc = describer ? describer.name : '?';
    document.getElementById('lbl-guesser-instruction').textContent =
      desc + ' is describing... ' + L.guesserInstruction;
  }
}

function addScoreTicker(type, word) {
  const ticker = document.getElementById('score-ticker');
  if (!ticker) return;
  const div = document.createElement('div');
  div.className = 'score-event ' + type;
  if (type === 'correct') div.textContent = L.correct + (word ? ' — ' + word : '');
  else if (type === 'penalty') div.textContent = L.penaltyLabel;
  else div.textContent = L.skipLabel + (word ? ' — ' + word : '');
  ticker.insertBefore(div, ticker.firstChild);
  if (ticker.children.length > 5) ticker.removeChild(ticker.lastChild);
}

function updateTimerDisplay(remaining) {
  ['timer-display','referee-timer','guesser-timer'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = remaining;
      el.classList.toggle('urgent', remaining <= 10);
    }
  });
}

// ─── ROUND END ───────────────────────────────────────────────
function renderRoundEnd(data) {
  const { players, scores, round, totalRounds, hostId } = data;
  const isHost = myId === hostId;

  document.getElementById('lbl-round-over').textContent = L.roundOver;

  const roundScore = scores[round - 1] || {};
  let resultText = '';
  Object.entries(roundScore).forEach(([pid, pts]) => {
    const p = players.find(pl => pl.id === pid);
    if (p && pts > 0) resultText += p.name + ': +' + pts + ' ' + L.wordsGuessed + '  ';
  });
  document.getElementById('round-result').textContent = resultText || '—';

  // Leaderboard
  const lb = document.getElementById('round-leaderboard');
  lb.innerHTML = '';
  const totals = players.map(p => {
    let t = 0;
    Object.values(scores).forEach(rs => { t += rs[p.id] || 0; });
    return { name: p.name, id: p.id, total: t, round: (scores[round-1] || {})[p.id] || 0 };
  }).sort((a,b) => b.total - a.total);

  totals.forEach((p, i) => {
    const medal = i===0?'🥇':i===1?'🥈':i===2?'🥉':'';
    lb.innerHTML += '<div class="taboo-score-row">' +
      '<span class="taboo-score-name">' + (medal||'') + ' ' + p.name + (p.id===myId?' (you)':'') + '</span>' +
      '<div><div class="taboo-score-pts">' + p.total + '</div>' +
      '<div class="taboo-score-round">+' + p.round + ' this round</div></div>' +
      '</div>';
  });

  if (isHost) {
    document.getElementById('next-round-btn').style.display = 'flex';
    document.getElementById('next-round-btn').textContent = round >= totalRounds ? '🏆 See Final Results' : L.nextRound;
    document.getElementById('roundend-waiting').style.display = 'none';
  } else {
    document.getElementById('next-round-btn').style.display = 'none';
    document.getElementById('roundend-waiting').style.display = 'block';
    document.getElementById('roundend-waiting').textContent = L.waitingNext;
  }
}

// ─── FINAL ───────────────────────────────────────────────
function renderFinal(data) {
  const { players, scores } = data;
  const lb = document.getElementById('final-leaderboard');
  lb.innerHTML = '';
  const totals = players.map(p => {
    let t = 0;
    Object.values(scores).forEach(rs => { t += rs[p.id] || 0; });
    return { name: p.name, id: p.id, total: t };
  }).sort((a,b) => b.total - a.total);

  totals.forEach((p, i) => {
    const medal = i===0?'🥇':i===1?'🥈':i===2?'🥉':'';
    lb.innerHTML += '<div class="taboo-score-row">' +
      '<span class="taboo-score-name">' + (medal||i+1+'.') + ' ' + p.name + (p.id===myId?' (you)':'') + '</span>' +
      '<div class="taboo-score-pts">' + p.total + '</div></div>';
  });

  document.getElementById('lbl-game-over').textContent = L.gameOver;
  document.getElementById('lbl-new-game').textContent = L.newGame;
  document.getElementById('lbl-share').textContent = L.shareResults;
}

// ─── ACTIONS ───────────────────────────────────────────────
function pickNextWord() {
  const words = TABOO_WORDS[lang] || TABOO_WORDS['en'];
  const used = roomState ? (roomState.usedWords || []) : [];
  const available = words.filter(w => !used.includes(w.word));
  if (!available.length) { skipWord(); return; }
  const pick = available[Math.floor(Math.random() * available.length)];
  socket.emit('taboo_word_request', { code: roomCode, word: pick.word, forbidden: pick.forbidden });
}

function gotIt() { socket.emit('taboo_got_it', { code: roomCode }); }
function skipWord() { socket.emit('taboo_skip', { code: roomCode }); }
function refereePenalty() { socket.emit('taboo_penalty', { code: roomCode }); }
function nextRound() { socket.emit('taboo_next_round', { code: roomCode }); }

function createRoom() {
  const name = document.getElementById('host-name').value.trim();
  if (!name) { showError('Enter your name!'); return; }
  myName = name;
  socket.emit('taboo_create', { name, settings: { rounds: 5, turnTime: 60, lang } });
}

function joinRoom() {
  const name = document.getElementById('join-name').value.trim();
  const code = document.getElementById('join-code').value.trim().toUpperCase();
  if (!name) { showError('Enter your name!'); return; }
  if (!code || code.length < 3) { showError('Enter the room code!'); return; }
  myName = name;
  socket.emit('taboo_join', { name, code });
}

function startGame() { socket.emit('taboo_start', { code: roomCode }); }

function updateSettings() {
  const rounds = parseInt(document.getElementById('settings-rounds').value);
  const turnTime = parseInt(document.getElementById('settings-timer').value);
  socket.emit('taboo_update_settings', { code: roomCode, settings: { rounds, turnTime, lang } });
}

function setLang(code) {
  lang = code;
  L = LANGS_TABOO[code] || LANGS_TABOO['en'];
  applyTranslations();
  socket.emit('taboo_update_settings', { code: roomCode, settings: { lang: code } });
}

function copyRoomCode() {
  var ta = document.createElement('textarea');
  ta.value = roomCode;
  ta.style.position = 'fixed'; ta.style.opacity = '0';
  document.body.appendChild(ta); ta.focus(); ta.select();
  try { document.execCommand('copy'); showToast('📋 Code copied: ' + roomCode); }
  catch(e) { prompt('Room code:', roomCode); }
  document.body.removeChild(ta);
}

function shareResults() {
  var url = 'https://panstwamiastagra.com/taboo';
  var text = 'We just played Taboo online! 🎭\n\nPlay for free at: ' + url;
  if (navigator.share) {
    navigator.share({ title: 'Taboo Online', text: text, url: url }).catch(() => {});
  } else {
    var ta = document.createElement('textarea');
    ta.value = text; ta.style.position='fixed'; ta.style.opacity='0';
    document.body.appendChild(ta); ta.focus(); ta.select();
    try { document.execCommand('copy'); showToast('📋 Copied!'); } catch(e) {}
    document.body.removeChild(ta);
  }
}

function goHome() {
  roomCode = ''; roomState = null; myName = '';
  showScreen('screen-home');
}

function confirmGoHome() {
  if (roomState && roomState.phase !== 'lobby' && roomState.phase !== 'final') {
    document.getElementById('confirm-msg').textContent = 'A game is in progress. Are you sure?';
    document.getElementById('confirm-modal').style.display = 'flex';
  } else { doGoHome(); }
}
function closeConfirm() { document.getElementById('confirm-modal').style.display = 'none'; }
function doGoHome() { closeConfirm(); goHome(); }

// ─── LANG BAR ───────────────────────────────────────────────
function buildLangBar() {
  const bar = document.getElementById('lang-bar');
  bar.innerHTML = Object.keys(LANGS_TABOO).map(code =>
    '<button class="lang-btn' + (code===lang?' active':'') + '" onclick="setUiLang(\'' + code + '\')">' + LANGS_TABOO[code].name + '</button>'
  ).join('');
}

function setUiLang(code) {
  lang = code; L = LANGS_TABOO[code] || LANGS_TABOO['en'];
  document.querySelectorAll('.lang-btn').forEach(b => b.classList.toggle('active', b.textContent === LANGS_TABOO[code].name));
  applyTranslations();
}

function applyTranslations() {
  const map = {
    'game-subtitle':'subtitle','lbl-create-room':'createRoom','lbl-join-room':'joinRoom',
    'lbl-your-name':'yourName','lbl-join-name':'joinName','lbl-room-code':'roomCode',
    'lbl-create-btn':'createBtn','lbl-join-btn':'joinBtn',
    'lbl-players-in-room':'playersInRoom','lbl-settings':'settings',
    'lbl-rounds-title':'roundsTitle','lbl-timer-title':'timerTitle','lbl-lang-title':'langTitle',
    'lbl-start-btn':'startBtn','lbl-leave-room':'leaveRoom',
    'lbl-share-code':'shareCode','lbl-copy-code':'copyCode',
    'lbl-how-to-play':'howToPlay',
    'lbl-rule-1':'rule1','lbl-rule-2':'rule2','lbl-rule-3':'rule3',
    'lbl-rule-4':'rule4','lbl-rule-5':'rule5','lbl-rule-6':'rule6',
  };
  for (const [id, key] of Object.entries(map)) {
    const el = document.getElementById(id);
    if (el && L[key]) el.textContent = L[key];
  }
}

// ─── UTILS ───────────────────────────────────────────────
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

function clearHomeError() {
  const box = document.getElementById('home-error');
  if (box) box.style.display = 'none';
}

function clearJoinError() {
  const box = document.getElementById('join-name-error');
  if (box) box.style.display = 'none';
}

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

// ─── INIT ───────────────────────────────────────────────
buildLangBar();
applyTranslations();
