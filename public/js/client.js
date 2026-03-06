// ═══════════════════════════════════════════════════════
// CLIENT STATE
// ═══════════════════════════════════════════════════════
const socket = io();
let lang = 'pl';
let L = LANGS[lang];
let myId = null;
let myName = '';
let isHost = false;
let roomCode = '';
let roomState = null;
let timerInterval = null;
let localAnswers = {};
let challengeOpen = null;
let rollingInterval = null;
let keepAliveInterval = null;

// ─── SOCKET EVENTS ───────────────────────────────────────────────
socket.on('connect', () => {
  myId = socket.id;
  // Start keep-alive ping every 20 seconds to prevent browser throttling
  clearInterval(keepAliveInterval);
  keepAliveInterval = setInterval(() => {
    if (roomCode) socket.emit('keep_alive', { code: roomCode });
  }, 20000);
});

socket.on('room_created', ({ code }) => {
  roomCode = code;
  isHost = true;
  document.getElementById('room-code-display').textContent = code;
  showScreen('screen-lobby');
  saveSession();
});

socket.on('room_joined', ({ code, isHost: h }) => {
  roomCode = code;
  isHost = h;
  document.getElementById('room-code-display').textContent = code;
  showScreen('screen-lobby');
  saveSession();
});

socket.on('error', ({ msg }) => {
  const box = document.getElementById('home-error');
  box.textContent = msg;
  box.style.display = 'block';
  setTimeout(() => box.style.display = 'none', 5000);
});

// Handle socket reconnection — rejoin room automatically
socket.on('reconnect', () => {
  if (roomCode && myName) {
    socket.emit('rejoin_room', { code: roomCode, name: myName });
  }
});

socket.on('room_state', (data) => {
  roomState = data;
  const me = data.players.find(p => p.id === myId);
  if (me) isHost = me.isHost;
  applyRoomState(data);
});

socket.on('new_host', ({ playerId, name }) => {
  if (playerId === myId) {
    isHost = true;
    showToast(`👑 You are now the host!`);
  } else {
    showToast(`👑 ${name} is now the host`);
  }
});

socket.on('letter_drawn', ({ letter }) => {
  if (rollingInterval) clearInterval(rollingInterval);
  const el = document.getElementById('drawing-letter');
  el.classList.remove('rolling');
  el.textContent = letter;
  // Show Play button only to the drawing player
  if (roomState && isMyDrawTurn()) {
    document.getElementById('draw-btn').style.display = 'none';
    document.getElementById('play-btn').style.display = 'inline-flex';
  }
});

socket.on('answer_updated', ({ playerId, catIndex, value }) => {
  if (roomState) updateProgressTracker(roomState);
});

socket.on('stop_called', ({ playerName }) => {
  const banner = document.getElementById('stop-banner');
  banner.textContent = L.stopBanner(playerName);
  banner.style.display = 'block';
  document.getElementById('stop-btn').style.display = 'none';
  stopTimer();
});

socket.on('player_disconnected', ({ name }) => {
  showToast(`⚠ ${name} disconnected`);
});

socket.on('challenge_opened', ({ rIdx, playerId, catIndex, word, category, playerName, challengerName }) => {
  challengeOpen = { rIdx, playerId, catIndex };
  showChallengeModal(rIdx, playerId, catIndex, word, category, playerName, challengerName, {});
});

socket.on('vote_updated', ({ rIdx, playerId, catIndex, votes, allVoted, validCount, invalidCount }) => {
  if (!challengeOpen) return;
  const word = (roomState.state.answers[playerId] || {})[catIndex] || '';
  updateVoteDisplay(votes, validCount, invalidCount, allVoted, word, playerId);
});

socket.on('challenge_closed', () => {
  document.getElementById('challenge-modal').style.display = 'none';
  challengeOpen = null;
});

// ─── ROOM STATE HANDLER ──────────────────────────────────────────
function applyRoomState(data) {
  const me = data.players.find(p => p.id === myId);
  if (me) isHost = me.isHost;

  switch (data.state.phase) {
    case 'lobby':    showScreen('screen-lobby');   renderLobby(data);    break;
    case 'drawing':  showScreen('screen-drawing'); renderDrawingScreen(data); break;
    case 'playing':  showScreen('screen-playing'); renderPlayingScreen(data); break;
    case 'stopped':  showScreen('screen-stopped'); renderStoppedScreen(data); break;
    case 'scoring':  showScreen('screen-scoring'); renderScoringScreen(data); break;
    case 'final':    showScreen('screen-final');   renderFinalScreen(data);   break;
  }
}

// ─── LOBBY ───────────────────────────────────────────────────────
function renderLobby(data) {
  const { players, settings } = data;
  const el = document.getElementById('lobby-players');
  el.innerHTML = '';
  players.forEach((p, i) => {
    el.innerHTML += `<div class="lobby-player${p.isHost?' host':''}">
      <div class="avatar av-${i%8}">${p.name.charAt(0).toUpperCase()}</div>
      <span class="pname">${p.name}${p.id===myId?' (you)':''}</span>
      ${p.isHost?`<span class="host-badge">${L.hostBadge}</span>`:''}
      ${!p.connected?`<span class="offline-badge">${L.offlineBadge}</span>`:''}
    </div>`;
  });

  // ALL players can edit settings and start in lobby
  document.getElementById('settings-card').style.opacity = '1';
  document.getElementById('settings-rounds').value = settings.totalRounds;
  renderCatGrid(settings.categories, true);
  renderLangPills(settings.lang, true);
  document.getElementById('lobby-btn-row').style.display = 'flex';
  document.getElementById('waiting-msg').style.display = 'none';
}

function renderCatGrid(activeCats, editable) {
  const el = document.getElementById('lobby-cat-grid');
  el.innerHTML = '';
  L.cats.forEach(cat => {
    const active = activeCats.includes(cat);
    el.innerHTML += `<div class="cat-tag${active?' active':''}${editable?'':' readonly'}"
      ${editable?`onclick="toggleCat('${cat.replace(/'/g,"\\'")}',this)"`:''}>
      ${cat}</div>`;
  });
}

function renderLangPills(activeLang, editable) {
  const el = document.getElementById('lobby-lang-pills');
  el.innerHTML = '';
  Object.keys(LANGS).forEach(code => {
    el.innerHTML += `<div class="lang-pill${code===activeLang?' active':''}"
      ${editable?`onclick="setGameLang('${code}')"`:''}>${LANGS[code].name}</div>`;
  });
}

function toggleCat(cat, el) {
  const cats = [...(roomState.settings.categories)];
  const idx = cats.indexOf(cat);
  if (idx >= 0) { if (cats.length <= 3) return; cats.splice(idx,1); }
  else cats.push(cat);
  socket.emit('update_settings', { code: roomCode, settings: { categories: cats } });
}

function setGameLang(code) {
  lang = code; L = LANGS[code];
  applyTranslations();
  socket.emit('update_settings', { code: roomCode, settings: { lang: code, categories: L.cats.slice(0,8) } });
}

function updateSettings() {
  const rounds = parseInt(document.getElementById('settings-rounds').value);
  socket.emit('update_settings', { code: roomCode, settings: { totalRounds: rounds } });
}

// ─── DRAWING SCREEN ──────────────────────────────────────────────
function isMyDrawTurn() {
  if (!roomState) return false;
  const connected = roomState.players.filter(p => p.connected);
  const idx = roomState.state.drawingPlayerIndex % connected.length;
  return connected[idx] && connected[idx].id === myId;
}

function getDrawerName() {
  if (!roomState) return '';
  const connected = roomState.players.filter(p => p.connected);
  const idx = roomState.state.drawingPlayerIndex % connected.length;
  return connected[idx] ? connected[idx].name : '';
}

function renderDrawingScreen(data) {
  const { state, settings } = data;
  document.getElementById('drawing-round-badge').textContent = L.roundLabel(state.round, settings.totalRounds);

  const ind = document.getElementById('drawing-rounds-ind'); ind.innerHTML = '';
  for (let i = 1; i <= settings.totalRounds; i++) {
    ind.innerHTML += `<div class="round-dot ${i<state.round?'done':i===state.round?'current':''}"></div>`;
  }

  document.getElementById('drawing-letter').textContent = state.letter || '?';

  const myTurn = isMyDrawTurn();
  const drawerName = getDrawerName();

  if (myTurn) {
    document.getElementById('drawing-host-controls').style.display = 'block';
    document.getElementById('drawing-waiting').style.display = 'none';
    if (!state.letter) {
      document.getElementById('draw-btn').style.display = 'inline-flex';
      document.getElementById('draw-btn').disabled = false;
      document.getElementById('play-btn').style.display = 'none';
    } else {
      document.getElementById('draw-btn').style.display = 'none';
      document.getElementById('play-btn').style.display = 'inline-flex';
    }
  } else {
    document.getElementById('drawing-host-controls').style.display = 'none';
    document.getElementById('drawing-waiting').style.display = 'block';
    document.getElementById('drawing-waiting').textContent = state.letter
      ? L.drawerChoseLetter(drawerName, state.letter)
      : L.drawerPicking(drawerName);
  }
}

// ─── PLAYING SCREEN ──────────────────────────────────────────────
function renderPlayingScreen(data) {
  const { state, settings } = data;
  document.getElementById('play-letter').textContent = state.letter;

  const body = document.getElementById('answer-body');
  if (!body.dataset.letter || body.dataset.letter !== state.letter) {
    body.dataset.letter = state.letter;
    localAnswers = {};
    body.innerHTML = '';
    settings.categories.forEach((cat, ci) => {
      body.innerHTML += `<tr>
        <td class="cat-label">${cat}</td>
        <td><input type="text" id="ans-${ci}" placeholder="${state.letter}..." autocomplete="off"
          oninput="submitAnswer(${ci}, this.value)"
          onkeydown="if(event.key==='Enter')focusNextInput(${ci})"/></td>
      </tr>`;
    });
    setTimeout(() => { const f = document.querySelector('#answer-body input'); if(f) f.focus(); }, 100);
  }

  document.getElementById('stop-btn').style.display = 'inline-flex';
  document.getElementById('stop-banner').style.display = 'none';
  updateProgressTracker(data);
  startClientTimer(state.timerStart);
}

function updateProgressTracker(data) {
  const { state, settings, players } = data;
  const list = document.getElementById('progress-list');
  if (!list) return;
  document.getElementById('progress-tracker').style.display = 'block';
  list.innerHTML = '';
  players.forEach(p => {
    const ans = state.answers[p.id] || {};
    const filled = Object.values(ans).filter(v => v && v.trim()).length;
    const total = settings.categories.length;
    const pct = Math.round((filled/total)*100);
    list.innerHTML += `<div class="progress-row">
      <span class="progress-name">${p.name}${p.id===state.stopCalledBy?' 🛑':''}</span>
      <div class="progress-bar-wrap"><div class="progress-bar" style="width:${pct}%"></div></div>
      <span class="progress-count">${filled}/${total}</span>
    </div>`;
  });
}

function submitAnswer(ci, value) {
  localAnswers[ci] = value;
  socket.emit('submit_answer', { code: roomCode, catIndex: ci, value });
}

function focusNextInput(ci) {
  const next = document.getElementById(`ans-${ci+1}`);
  if (next) next.focus();
}

function startClientTimer(serverStart) {
  stopTimer();
  if (!serverStart) return;
  const el = document.getElementById('timer');
  timerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - serverStart) / 1000);
    const m = Math.floor(elapsed/60).toString().padStart(2,'0');
    const s = (elapsed%60).toString().padStart(2,'0');
    el.textContent = `${m}:${s}`;
  }, 500);
}

function stopTimer() { clearInterval(timerInterval); }

// ─── STOPPED SCREEN ──────────────────────────────────────────────
function renderStoppedScreen(data) {
  const { state, settings } = data;
  stopTimer();
  const stopper = data.players.find(p => p.id === state.stopCalledBy);
  document.getElementById('stopped-banner').textContent = L.stopBanner(stopper ? stopper.name : '?');
  document.getElementById('lbl-stopped-hint').textContent = L.stoppedHint;

  const body = document.getElementById('stopped-answer-body');
  body.innerHTML = '';
  settings.categories.forEach((cat, ci) => {
    const myAns = localAnswers[ci] || (state.answers[myId] || {})[ci] || '';
    const isStopper = myId === state.stopCalledBy;
    body.innerHTML += `<tr>
      <td class="cat-label">${cat}</td>
      <td><input type="text" id="st-ans-${ci}" value="${myAns.replace(/"/g,'&quot;')}"
        placeholder="${state.letter}..." ${isStopper ? 'disabled' : ''}
        oninput="submitAnswer(${ci}, this.value)"
        onkeydown="if(event.key==='Enter')focusStoppedNext(${ci})"/></td>
    </tr>`;
  });

  // Any player can force scoring, not just host
  document.getElementById('stopped-host-btns').style.display = 'flex';
}

function focusStoppedNext(ci) {
  const next = document.getElementById(`st-ans-${ci+1}`);
  if (next && !next.disabled) next.focus();
}

// ─── SCORING SCREEN ──────────────────────────────────────────────
function renderScoringScreen(data) {
  const { state, settings, players } = data;
  const rIdx = state.round - 1;
  document.getElementById('scoring-round-badge').textContent = L.scoringLabel(state.round);

  const grid = document.getElementById('scoring-grid');
  let html = `<table class="scoring-table"><thead><tr>
    <th>${L.categoryCol}</th>
    ${players.map(p => `<th style="text-align:center"><div style="font-weight:800">${p.name}${p.id===state.stopCalledBy?' 🛑':''}</div></th>`).join('')}
  </tr></thead><tbody>`;

  settings.categories.forEach((cat, ci) => {
    html += `<tr><td><strong>${cat}</strong></td>`;
    players.forEach(p => {
      const ans = ((state.answers[p.id] || {})[ci] || '').trim();
      const pts = (state.scores[rIdx] && state.scores[rIdx][p.id] && state.scores[rIdx][p.id][ci] !== undefined)
        ? state.scores[rIdx][p.id][ci] : 0;
      const key = `${rIdx}_${p.id}_${ci}`;
      const isCh = !!state.challenged[key];
      const valid = ans && startsWithLetter(ans, state.letter);
      const wCl = isCh ? 'challenged' : (!ans||!valid ? 'missing' : pts===5 ? 'duplicate' : '');
      // Anyone can challenge anyone else (not yourself)
      const showCh = ans && valid && !isCh && p.id !== myId && !state.activeChallenge;

      html += `<td><div class="answer-cell">
        <span class="answer-word ${wCl}">${ans||'—'}</span>
        <div style="display:flex;gap:4px;flex-wrap:wrap;align-items:center;">
          ${isHost ? `<div class="pts-toggle">
            <button class="pts-btn${pts>=10&&!isCh?' selected':''}" onclick="setScore('${p.id}',${rIdx},${ci},${p.id===state.stopCalledBy?15:10})">${p.id===state.stopCalledBy?'15':'10'}p</button>
            <button class="pts-btn dup${pts===5&&!isCh?' selected':''}" onclick="setScore('${p.id}',${rIdx},${ci},5)">5p</button>
            <button class="pts-btn none${(isCh||pts===0)?' selected':''}" onclick="setScore('${p.id}',${rIdx},${ci},0)">0</button>
          </div>` : `<span style="font-size:13px;font-weight:800;color:var(--accent)">${pts>0?'+'+pts:'0'}</span>`}
          ${showCh ? `<button class="challenge-btn" onclick="openChallenge('${p.id}',${rIdx},${ci})">${L.challengeBtn}</button>` : ''}
          ${isCh ? `<span class="voted-out-tag">VOTED OUT</span>` : ''}
          ${state.activeChallenge && state.activeChallenge.playerId===p.id && state.activeChallenge.catIndex===ci
            ? `<span style="font-size:11px;color:var(--accent2);font-weight:800;">⚖ VOTING...</span>` : ''}
        </div>
      </div></td>`;
    });
    html += `</tr>`;
  });

  html += `<tr style="background:var(--surface);">
    <td><strong>${L.totalLabel}</strong></td>
    ${players.map(p => {
      const rScores = (state.scores[rIdx] && state.scores[rIdx][p.id]) || {};
      const sum = Object.values(rScores).reduce((a,b) => a+b, 0);
      return `<td style="text-align:center"><strong style="color:var(--accent);font-size:17px;">${sum}</strong></td>`;
    }).join('')}
  </tr></tbody></table>`;
  grid.innerHTML = html;

  renderLeaderboard('leaderboard-mini', data, rIdx);

  if (isHost) {
    document.getElementById('scoring-next-btn').style.display = 'flex';
    document.getElementById('scoring-waiting').style.display = 'none';
  } else {
    document.getElementById('scoring-next-btn').style.display = 'none';
    document.getElementById('scoring-waiting').style.display = 'block';
    document.getElementById('scoring-waiting').textContent = L.waitingScoring;
  }
}

function renderLeaderboard(elId, data, rIdx) {
  const { state, players } = data;
  const el = document.getElementById(elId);
  if (!el) return;
  const totals = players.map(p => {
    let t = state.totalScores[p.id] || 0;
    if (state.scores[rIdx] && state.scores[rIdx][p.id])
      t += Object.values(state.scores[rIdx][p.id]).reduce((a,b) => a+b, 0);
    return { name: p.name, id: p.id, total: t };
  }).sort((a,b) => b.total - a.total);

  el.innerHTML = '';
  totals.forEach((p, rank) => {
    const rp = (state.scores[rIdx] && state.scores[rIdx][p.id])
      ? Object.values(state.scores[rIdx][p.id]).reduce((a,b)=>a+b,0) : 0;
    el.innerHTML += `<div class="lb-row${rank===0?' first':''}">
      <div class="lb-rank${rank===0?' gold':''}">${rank+1}</div>
      <div class="lb-name">${p.name}${p.id===myId?' (you)':''}</div>
      <div><div class="lb-pts">${p.total}</div><div class="lb-round-pts">+${rp}</div></div>
    </div>`;
  });
}

// ─── FINAL SCREEN ────────────────────────────────────────────────
function renderFinalScreen(data) {
  const { state, players } = data;
  const el = document.getElementById('final-leaderboard');
  el.innerHTML = '';
  players.map(p => ({ name: p.name, id: p.id, total: state.totalScores[p.id]||0 }))
    .sort((a,b) => b.total-a.total)
    .forEach((p, rank) => {
      const medal = rank===0?'🥇':rank===1?'🥈':rank===2?'🥉':'';
      el.innerHTML += `<div class="lb-row${rank===0?' first':''}">
        <div class="lb-rank${rank===0?' gold':''}">${medal||rank+1}</div>
        <div class="lb-name">${p.name}${p.id===myId?' (you)':''}</div>
        <div class="lb-pts">${p.total}</div>
      </div>`;
    });
}

// ─── CHALLENGE / VOTING ──────────────────────────────────────────
function openChallenge(playerId, rIdx, catIndex) {
  socket.emit('open_challenge', { code: roomCode, rIdx, playerId, catIndex });
}

function showChallengeModal(rIdx, playerId, catIndex, word, category, playerName, challengerName, votes) {
  document.getElementById('modal-title').textContent = L.challengeTitle;
  document.getElementById('modal-desc').innerHTML =
    `<strong>${challengerName}</strong> ${L.challengedText} <strong>${playerName}</strong>:<br>${L.challengeDesc('', word, category)}`;
  document.getElementById('modal-word-area').innerHTML = `<div class="word-highlight">${word}</div>`;

  const voters = roomState.players.filter(p => p.id !== playerId);
  const vg = document.getElementById('vote-grid'); vg.innerHTML = '';

  voters.forEach(p => {
    const myVote = votes[p.id];
    const isMe = p.id === myId;
    const isChallenged = p.id === playerId;
    vg.innerHTML += `<div class="vote-row" id="vrow-${p.id}">
      <div class="player-name">${p.name}${isMe?' (you)':''}</div>
      <div class="vote-btns">
        <button class="vote-btn valid${myVote===true?' selected':''}"
          onclick="castVote('${playerId}',${rIdx},${catIndex},true)"
          ${isChallenged?'disabled':''}>${L.voteValid}</button>
        <button class="vote-btn invalid${myVote===false?' selected':''}"
          onclick="castVote('${playerId}',${rIdx},${catIndex},false)"
          ${isChallenged?'disabled':''}>${L.voteInvalid}</button>
      </div>
    </div>`;
  });

  document.getElementById('vote-tally').innerHTML = '';
  document.getElementById('verdict-area').innerHTML = '';
  document.getElementById('lbl-close-challenge').textContent = L.closeChallenge;
  document.getElementById('challenge-modal').style.display = 'flex';
}

function castVote(playerId, rIdx, catIndex, isValid) {
  socket.emit('cast_vote', { code: roomCode, rIdx, playerId, catIndex, isValid });
  const row = document.getElementById(`vrow-${myId}`);
  if (row) {
    row.querySelectorAll('.vote-btn').forEach(b => b.classList.remove('selected'));
    row.querySelector(isValid?'.valid':'.invalid').classList.add('selected');
  }
}

function updateVoteDisplay(votes, validCount, invalidCount, allVoted, word, playerId) {
  document.getElementById('vote-tally').innerHTML = L.voteTally(validCount, invalidCount);
  if (roomState) {
    roomState.players.forEach(p => {
      const row = document.getElementById(`vrow-${p.id}`);
      if (!row) return;
      const v = votes[p.id];
      row.querySelectorAll('.vote-btn').forEach(b => b.classList.remove('selected'));
      if (v === true)  row.querySelector('.valid').classList.add('selected');
      if (v === false) row.querySelector('.invalid').classList.add('selected');
    });
  }
  if (allVoted) {
    const rejected = invalidCount > validCount;
    document.getElementById('verdict-area').innerHTML =
      `<div class="verdict-banner ${rejected?'invalid':'valid'}">${rejected?L.verdictInvalid(word):L.verdictValid(word)}</div>`;
  }
}

function closeChallenge() {
  if (challengeOpen) {
    socket.emit('close_challenge', { code: roomCode, ...challengeOpen });
  } else {
    document.getElementById('challenge-modal').style.display = 'none';
  }
}

// ─── ACTIONS ─────────────────────────────────────────────────────
function setScore(playerId, rIdx, catIndex, pts) {
  socket.emit('set_score', { code: roomCode, playerId, rIdx, catIndex, pts });
}
function forceScoring() { socket.emit('force_scoring', { code: roomCode }); }
function nextRound()     { socket.emit('next_round', { code: roomCode }); }
function callStop()      { socket.emit('call_stop', { code: roomCode }); document.getElementById('stop-btn').style.display='none'; }

function createRoom() {
  const name = document.getElementById('host-name').value.trim();
  if (!name) { showError('Enter your name!'); return; }
  myName = name; isHost = true;
  socket.emit('create_room', { name, settings: { totalRounds: 5, categories: L.cats.slice(0,8), lang } });
}

function joinRoom() {
  const name = document.getElementById('join-name').value.trim();
  const code = document.getElementById('join-code').value.trim().toUpperCase();
  if (!name) { showError('Enter your name!'); return; }
  if (!code || code.length < 3) { showError('Enter the room code!'); return; }
  myName = name; isHost = false;
  socket.emit('join_room', { name, code });
}

function startGame() { socket.emit('start_game', { code: roomCode }); }

function drawLetter() {
  document.getElementById('draw-btn').disabled = true;
  const el = document.getElementById('drawing-letter');
  const ALPHA = 'ABCDEFGHIJKLMNOPRSTUWZ'.split('');
  el.classList.add('rolling');
  let count = 0;
  rollingInterval = setInterval(() => {
    el.textContent = ALPHA[Math.floor(Math.random()*ALPHA.length)];
    if (++count >= 15) {
      clearInterval(rollingInterval);
      el.classList.remove('rolling');
      socket.emit('draw_letter', { code: roomCode });
    }
  }, 80);
}

function startRound() { socket.emit('start_round', { code: roomCode }); }

function goHome() {
  roomCode=''; roomState=null; isHost=false; localAnswers={};
  clearSession(); showScreen('screen-home');
}

// ─── LANG ────────────────────────────────────────────────────────
function setLang(code) {
  lang = code; L = LANGS[code];
  document.querySelectorAll('.lang-btn').forEach(b => b.classList.toggle('active', b.dataset.lang===code));
  applyTranslations();
}

function buildLangBar() {
  const bar = document.getElementById('lang-bar');
  bar.innerHTML = Object.keys(LANGS).map(code =>
    `<button class="lang-btn${code===lang?' active':''}" data-lang="${code}" onclick="setLang('${code}')">${LANGS[code].name}</button>`
  ).join('');
}

function applyTranslations() {
  const map = {
    'game-title':'gameTitle','game-subtitle':'gameSubtitle',
    'lbl-create-room':'createRoom','lbl-join-room':'joinRoom',
    'lbl-your-name':'yourName','lbl-join-name':'joinName','lbl-room-code':'roomCode',
    'lbl-create-btn':'createBtn','lbl-join-btn':'joinBtn',
    'lbl-players-in-room':'playersInRoom','lbl-settings':'settings',
    'lbl-rounds-title':'roundsTitle','lbl-language':'language',
    'lbl-start-btn':'startBtn','lbl-share-code':'shareCode',
    'lbl-draw':'draw','lbl-play':'play','lbl-letter-word':'letterWord',
    'lbl-category-col':'categoryCol','lbl-answer-col':'answerCol',
    'lbl-scoring-hint':'scoringHint','lbl-current-ranking':'currentRanking',
    'lbl-next-round':'nextRound','lbl-game-over':'gameOver',
    'lbl-final-sub':'finalSub','lbl-final-ranking':'finalRanking',
    'lbl-new-game':'newGame','lbl-force-scoring':'forceScoring',
    'lbl-progress':'progress',
  };
  for (const [id, key] of Object.entries(map)) {
    const el = document.getElementById(id);
    if (el && L[key]) el.textContent = L[key];
  }
  const rules = document.getElementById('rules-text');
  if (rules) rules.innerHTML = L.rules;
}

// ─── UTILS ───────────────────────────────────────────────────────
function startsWithLetter(word, letter) {
  return word.charAt(0).toUpperCase() === letter.toUpperCase();
}
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}
function showError(msg) {
  const box = document.getElementById('home-error');
  box.textContent = msg; box.style.display = 'block';
  setTimeout(() => box.style.display = 'none', 3500);
}
function showToast(msg) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:var(--card);border:1px solid var(--border);color:var(--text);padding:10px 20px;border-radius:10px;font-weight:700;font-size:14px;z-index:999;animation:fadeIn 0.3s ease;';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.display = 'block';
  clearTimeout(t._timeout);
  t._timeout = setTimeout(() => t.style.display = 'none', 3000);
}
function saveSession() {
  try { localStorage.setItem('pm_session', JSON.stringify({ roomCode, myName })); } catch(e) {}
}
function clearSession() {
  try { localStorage.removeItem('pm_session'); } catch(e) {}
}

// ─── INIT ────────────────────────────────────────────────────────
buildLangBar();
applyTranslations();
