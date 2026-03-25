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
  const isNameError = msg.toLowerCase().includes('name') || msg.toLowerCase().includes('taken');
  const onJoinScreen = document.getElementById('join-name') &&
    document.getElementById('join-name').value.trim();
  if (isNameError && onJoinScreen) {
    const box = document.getElementById('join-name-error');
    const input = document.getElementById('join-name');
    if (box) { box.textContent = msg; box.style.display = 'block'; }
    if (input) input.style.borderColor = 'var(--red)';
  } else {
    showError(msg);
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
    showToast('👑 You are now the host!');
  } else {
    showToast('👑 ' + name + ' is now the host');
  }
});

socket.on('letter_drawn', ({ letter }) => {
  if (rollingInterval) clearInterval(rollingInterval);
  const el = document.getElementById('drawing-letter');
  el.classList.remove('rolling');
  el.textContent = letter;
  if (roomState && isMyDrawTurn()) {
    document.getElementById('draw-btn').style.display = 'none';
    document.getElementById('play-btn').style.display = 'inline-flex';
  }
});

socket.on('answer_updated', ({ playerId, catIndex, value }) => {
  // answers tracked server-side
});

socket.on('stop_called', ({ playerName, gracePeriod }) => {
  const banner = document.getElementById('stop-banner');
  banner.textContent = L.stopBanner(playerName);
  banner.style.display = 'block';
  document.getElementById('stop-btn').style.display = 'none';
  stopTimer();
  // Show grace period countdown
  const secs = gracePeriod || 20;
  window._graceEnd = Date.now() + secs * 1000;
  window._graceInterval = setInterval(() => {
    const remaining = Math.ceil((window._graceEnd - Date.now()) / 1000);
    if (remaining <= 0) {
      clearInterval(window._graceInterval);
      banner.textContent = L.stopBanner(playerName);
    } else {
      banner.textContent = L.stopBanner(playerName) + ' — ' + remaining + 's';
    }
  }, 500);
});

socket.on('player_disconnected', ({ name }) => {
  showToast('⚠ ' + name + ' disconnected');
});

socket.on('challenge_opened', ({ rIdx, playerId, catIndex, word, category, playerName, challengerName }) => {
  challengeOpen = { rIdx, playerId, catIndex };
  showChallengeModal(rIdx, playerId, catIndex, word, category, playerName, challengerName || '', {});
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

// ─── ROOM STATE HANDLER ───────────────────────────────────────────────
function applyRoomState(data) {
  const me = data.players.find(p => p.id === myId);
  if (me) isHost = me.isHost;

  switch (data.state.phase) {
    case 'lobby':       showScreen('screen-lobby');       renderLobby(data);       break;
    case 'drawing':     showScreen('screen-drawing');     renderDrawingScreen(data); break;
    case 'playing':     showScreen('screen-playing');     renderPlayingScreen(data); break;
    case 'stopped':     showScreen('screen-stopped');     renderStoppedScreen(data); break;
    case 'calculating': showScreen('screen-calculating'); window.scrollTo(0,0); break;
    case 'scoring':     showScreen('screen-scoring');     renderScoringScreen(data); break;
    case 'final':       showScreen('screen-final');       renderFinalScreen(data);   break;
  }
}

// ─── LOBBY ───────────────────────────────────────────────
function renderLobby(data) {
  const { players, settings } = data;
  const isHost = players.some(p => p.id === roomCode ? false : p.isHost && p.id === socket.id);
  const el = document.getElementById('lobby-players');
  // Sync visibility toggle — only host can toggle
  const _amHost = players.find(p => p.isHost) && players.find(p => p.isHost).id === socket.id;
  const togWrap = document.getElementById('visibility-toggle');
  if (togWrap) { togWrap.style.pointerEvents = _amHost ? 'auto' : 'none'; togWrap.style.opacity = _amHost ? '1' : '0.4'; }
  if (settings && settings.isPublic !== undefined) setVisibility(settings.isPublic);
  el.innerHTML = '';
  players.forEach((p, i) => {
    el.innerHTML += '<div class="lobby-player' + (p.isHost?' host':'') + '">' +
      '<div class="avatar av-' + (i%8) + '">' + p.name.charAt(0).toUpperCase() + '</div>' +
      '<span class="pname">' + p.name + (p.id===myId?' (you)':'') + '</span>' +
      (p.isHost ? '<span class="host-badge">' + L.hostBadge + '</span>' : '') +
      (!p.connected ? '<span class="offline-badge">' + L.offlineBadge + '</span>' : '') +
      '</div>';
  });

  document.getElementById('settings-card').style.opacity = '1';
  document.getElementById('settings-rounds').value = settings.totalRounds;
  const graceEl = document.getElementById('settings-grace');
  if (graceEl) graceEl.value = settings.gracePeriod || 20;
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
    el.innerHTML += '<div class="cat-tag' + (active?' active':'') + (editable?'':' readonly') + '"' +
      (editable ? ' onclick="toggleCat(\'' + cat.replace(/'/g,"\\'") + '\',this)"' : '') +
      '>' + cat + '</div>';
  });
}

function renderLangPills(activeLang, editable) {
  const el = document.getElementById('lobby-lang-pills');
  el.innerHTML = '';
  Object.keys(LANGS).forEach(code => {
    el.innerHTML += '<div class="lang-pill' + (code===activeLang?' active':'') + '"' +
      (editable ? ' onclick="setGameLang(\'' + code + '\')"' : '') +
      '>' + LANGS[code].name + '</div>';
  });
}

function toggleCat(cat, el) {
  const cats = [...(roomState.settings.categories)];
  const idx = cats.indexOf(cat);
  if (idx >= 0) { if (cats.length <= 3) return; cats.splice(idx,1); }
  else cats.push(cat);
  socket.emit('update_settings', { code: roomCode, settings: { categories: cats, isPublic: getIsPublic() } });
}

function setGameLang(code) {
  lang = code; L = LANGS[code];
  applyTranslations();
prefillJoinCode();
  socket.emit('update_settings', { code: roomCode, settings: { lang: code, categories: L.cats.slice(0,8), isPublic: getIsPublic() } });
}

function updateSettings() {
  const rounds = parseInt(document.getElementById('settings-rounds').value);
  const graceEl = document.getElementById('settings-grace');
  const grace = graceEl ? parseInt(graceEl.value) : 20;
  socket.emit('update_settings', { code: roomCode, settings: { totalRounds: rounds, gracePeriod: grace, isPublic: getIsPublic() } });
}

// ─── DRAWING SCREEN ───────────────────────────────────────────────
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
    ind.innerHTML += '<div class="round-dot ' + (i<state.round?'done':i===state.round?'current':'') + '"></div>';
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

// ─── PLAYING SCREEN ───────────────────────────────────────────────
function renderPlayingScreen(data) {
  const { state, settings } = data;
  document.getElementById('play-letter').textContent = state.letter;
  const body = document.getElementById('answer-body');
  if (!body.dataset.letter || body.dataset.letter !== state.letter) {
    body.dataset.letter = state.letter;
    localAnswers = {};
    body.innerHTML = '';
    settings.categories.forEach((cat, ci) => {
      body.innerHTML += '<tr><td class="cat-label">' + cat + '</td>' +
        '<td><input type="text" id="ans-' + ci + '" placeholder="' + state.letter + '..." autocomplete="off"' +
        ' oninput="submitAnswer(' + ci + ', this.value)"' +
        ' onkeydown="if(event.key===\'Enter\')focusNextInput(' + ci + ')"/></td></tr>';
    });
    setTimeout(() => { const f = document.querySelector('#answer-body input'); if(f) f.focus(); }, 100);
  }
  if (state.stopCalledBy) {
    document.getElementById('stop-btn').style.display = 'none';
    const banner = document.getElementById('stop-banner');
    const stopper = data.players.find(p => p.id === state.stopCalledBy);
    if (stopper) { banner.textContent = L.stopBanner(stopper.name); banner.style.display = 'block'; }
    stopTimer();
    clearInterval(window._stopCountdown);
  } else {
    document.getElementById('stop-btn').style.display = 'inline-flex';
    document.getElementById('stop-banner').style.display = 'none';
    if (!window._timerStart || window._timerStart !== state.timerStart) {
      window._timerStart = state.timerStart;
      startClientTimer(state.timerStart);
      startStopCountdown(state.timerStart);
    }
  }
  updateProgressTracker(data);
}



function submitAnswer(ci, value) {
  localAnswers[ci] = value;
  socket.emit('submit_answer', { code: roomCode, catIndex: ci, value });
}

function focusNextInput(ci) {
  const next = document.getElementById('ans-' + (ci+1));
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
    el.textContent = m + ':' + s;
  }, 500);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  window._timerStart = null;
}

function startStopCountdown(serverStart) {
  clearInterval(window._stopCountdown);
  const btn = document.getElementById('stop-btn');
  const LOCK_MS = 30000;

  function update() {
    const elapsed = Date.now() - serverStart;
    const remaining = Math.ceil((LOCK_MS - elapsed) / 1000);
    if (remaining > 0) {
      btn.disabled = true;
      btn.textContent = '🛑 STOP (' + remaining + 's)';
      btn.style.opacity = '0.5';
    } else {
      btn.disabled = false;
      btn.textContent = '🛑 STOP!';
      btn.style.opacity = '1';
      clearInterval(window._stopCountdown);
    }
  }

  update();
  window._stopCountdown = setInterval(update, 500);
}

// ─── STOPPED SCREEN ───────────────────────────────────────────────
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
    body.innerHTML += '<tr><td class="cat-label">' + cat + '</td>' +
      '<td><input type="text" id="st-ans-' + ci + '" value="' + myAns.replace(/"/g,'&quot;') + '"' +
      ' placeholder="' + state.letter + '..." ' + (isStopper ? 'disabled' : '') +
      ' oninput="submitAnswer(' + ci + ', this.value)"' +
      ' onkeydown="if(event.key===\'Enter\')focusStoppedNext(' + ci + ')"/></td></tr>';
  });
  document.getElementById('stopped-host-btns').style.display = 'flex';
}

function focusStoppedNext(ci) {
  const next = document.getElementById('st-ans-' + (ci+1));
  if (next && !next.disabled) next.focus();
}

// ─── SCORING SCREEN ───────────────────────────────────────────────
function renderScoringScreen(data) {
  const { state, settings, players } = data;
  const rIdx = state.round - 1;
  document.getElementById('scoring-round-badge').textContent = L.scoringLabel(state.round);

  const grid = document.getElementById('scoring-grid');
  let html = '<table class="scoring-table"><thead><tr><th>' + L.categoryCol + '</th>';
  players.forEach(p => {
    html += '<th style="text-align:center"><div style="font-weight:800">' + p.name + '</div></th>';
  });
  html += '</tr></thead><tbody>';

  settings.categories.forEach((cat, ci) => {
    html += '<tr><td><strong>' + cat + '</strong></td>';
    players.forEach(p => {
      const ans = ((state.answers[p.id] || {})[ci] || '').trim();
      const pts = (state.scores[rIdx] && state.scores[rIdx][p.id] && state.scores[rIdx][p.id][ci] !== undefined)
        ? state.scores[rIdx][p.id][ci] : 0;
      const key = rIdx + '_' + p.id + '_' + ci;
      const isCh = !!state.challenged[key];
      const valid = ans && startsWithLetter(ans, state.letter);
      const wCl = isCh ? 'challenged' : (!ans||!valid ? 'missing' : pts===5 ? 'duplicate' : '');
      const showCh = ans && valid && !isCh && p.id !== myId && !state.activeChallenge;

      html += '<td><div class="answer-cell">' +
        '<span class="answer-word ' + wCl + '">' + (ans||'—') + '</span>' +
        '<div style="display:flex;gap:4px;flex-wrap:wrap;align-items:center;">';

      if (isHost) {
        html += '<div class="pts-toggle">' +
          '<button class="pts-btn' + (pts===15&&!isCh?' selected':'') + '" onclick="setScore(\'' + p.id + '\',' + rIdx + ',' + ci + ',15)">15p</button>' +
          '<button class="pts-btn' + (pts===10&&!isCh?' selected':'') + '" onclick="setScore(\'' + p.id + '\',' + rIdx + ',' + ci + ',10)">10p</button>' +
          '<button class="pts-btn dup' + (pts===5&&!isCh?' selected':'') + '" onclick="setScore(\'' + p.id + '\',' + rIdx + ',' + ci + ',5)">5p</button>' +
          '<button class="pts-btn none' + ((isCh||pts===0)?' selected':'') + '" onclick="setScore(\'' + p.id + '\',' + rIdx + ',' + ci + ',0)">0</button>' +
          '</div>';
      } else {
        html += '<span class="pts-badge">' + (pts > 0 ? '+'+pts : '0') + '</span>';
      }

      if (showCh) html += '<button class="challenge-btn" onclick="openChallenge(\'' + p.id + '\',' + rIdx + ',' + ci + ')">' + (L.challengeBtn||'⚠') + '</button>';
      if (isCh) html += '<span class="voted-out-tag">VOTED OUT</span>';
      html += '</div></div></td>';
    });
    html += '</tr>';
  });

  html += '<tr style="background:var(--surface);"><td><strong>' + L.totalLabel + '</strong></td>';
  players.forEach(p => {
    const rScores = (state.scores[rIdx] && state.scores[rIdx][p.id]) || {};
    const sum = Object.values(rScores).reduce((a,b) => a+b, 0);
    html += '<td style="text-align:center"><strong style="color:var(--accent);font-size:17px;">' + sum + '</strong></td>';
  });
  html += '</tr></tbody></table>';
  grid.innerHTML = html;

  renderLeaderboard('leaderboard-mini', data, rIdx);

  // Ready system
  const connectedPlayers = players.filter(p => p.connected);
  const readyPlayers = state.readyPlayers || {};
  const myReady = !!readyPlayers[myId];
  const allReady = connectedPlayers.every(p => readyPlayers[p.id]);
  const readyCount = connectedPlayers.filter(p => readyPlayers[p.id]).length;
  const totalCount = connectedPlayers.length;
  const isFinalRound = state.round >= settings.totalRounds;

  var readyBar = document.getElementById('ready-bar');
  if (!readyBar) {
    readyBar = document.createElement('div');
    readyBar.id = 'ready-bar';
    document.getElementById('scoring-next-btn').parentNode.insertBefore(readyBar, document.getElementById('scoring-next-btn'));
  }

  var readyHtml = '<div class="ready-bar">';
  connectedPlayers.forEach(function(p, i) {
    var isReady = !!readyPlayers[p.id];
    readyHtml += '<div class="ready-player ' + (isReady?'ready':'') + '">' +
      '<div class="avatar av-' + (i%8) + '" style="width:30px;height:30px;font-size:12px;">' + p.name.charAt(0).toUpperCase() + '</div>' +
      '<span style="font-size:11px;font-weight:800;color:' + (isReady?'var(--green)':'var(--muted)') + '">' + (isReady?'✓':'') + '</span>' +
      '</div>';
  });
  readyHtml += '<span class="ready-count">' + readyCount + '/' + totalCount + ' ' + (L.readyLabel||'ready') + '</span></div>';
  readyBar.innerHTML = readyHtml;

  if (!myReady) {
    document.getElementById('scoring-next-btn').style.display = 'flex';
    document.getElementById('scoring-next-btn').innerHTML =
      '<button class="btn green" onclick="markReady()">' + (L.markReady||'✓ Done reviewing') + '</button>';
    document.getElementById('scoring-waiting').style.display = 'none';
  } else if (allReady && isHost) {
    var btnLabel = isFinalRound ? (L.seeResults||'🏆 See Final Results') : (L.nextRound||'Next Round →');
    document.getElementById('scoring-next-btn').style.display = 'flex';
    document.getElementById('scoring-next-btn').innerHTML =
      '<button class="btn" onclick="nextRound()">' + btnLabel + '</button>';
    document.getElementById('scoring-waiting').style.display = 'none';
  } else if (myReady && !allReady) {
    document.getElementById('scoring-next-btn').style.display = 'none';
    document.getElementById('scoring-waiting').style.display = 'block';
    document.getElementById('scoring-waiting').textContent =
      '✓ ' + (L.waitingOthers||'Waiting for others...') + ' (' + readyCount + '/' + totalCount + ')';
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
    el.innerHTML += '<div class="lb-row' + (rank===0?' first':'') + '">' +
      '<div class="lb-rank' + (rank===0?' gold':'') + '">' + (rank+1) + '</div>' +
      '<div class="lb-name">' + p.name + (p.id===myId?' (you)':'') + '</div>' +
      '<div><div class="lb-pts">' + p.total + '</div><div class="lb-round-pts">+' + rp + '</div></div>' +
      '</div>';
  });
}

// ─── FINAL SCREEN ───────────────────────────────────────────────
function renderFinalScreen(data) {
  const { state, players } = data;
  const el = document.getElementById('final-leaderboard');
  el.innerHTML = '';
  players.map(p => ({ name: p.name, id: p.id, total: state.totalScores[p.id]||0 }))
    .sort((a,b) => b.total-a.total)
    .forEach((p, rank) => {
      const medal = rank===0?'🥇':rank===1?'🥈':rank===2?'🥉':'';
      el.innerHTML += '<div class="lb-row' + (rank===0?' first':'') + '">' +
        '<div class="lb-rank' + (rank===0?' gold':'') + '">' + (medal||rank+1) + '</div>' +
        '<div class="lb-name">' + p.name + (p.id===myId?' (you)':'') + '</div>' +
        '<div class="lb-pts">' + p.total + '</div></div>';
    });
}

// ─── CHALLENGE / VOTING ───────────────────────────────────────────────
function openChallenge(playerId, rIdx, catIndex) {
  socket.emit('open_challenge', { code: roomCode, rIdx, playerId, catIndex });
}

function showChallengeModal(rIdx, playerId, catIndex, word, category, playerName, challengerName, votes) {
  document.getElementById('modal-title').textContent = L.challengeTitle;
  document.getElementById('modal-desc').innerHTML = L.challengeDesc(playerName, word, category);
  document.getElementById('modal-word-area').innerHTML = '<div class="word-highlight">' + word + '</div>';
  const voters = roomState.players;
  const vg = document.getElementById('vote-grid'); vg.innerHTML = '';
  voters.forEach(p => {
    const myVote = votes[p.id];
    const isChallenged = p.id === playerId;
    vg.innerHTML += '<div class="vote-row" id="vrow-' + p.id + '">' +
      '<div class="player-name">' + p.name + (p.id===myId?' (you)':'') + '</div>' +
      '<div class="vote-btns">' +
      '<button class="vote-btn valid' + (myVote===true?' selected':'') + '" onclick="castVote(\'' + playerId + '\',' + rIdx + ',' + catIndex + ',true)">' +
      (isChallenged ? (L.voteDefend||'✓ My word is correct') : L.voteValid) + '</button>' +
      '<button class="vote-btn invalid' + (myVote===false?' selected':'') + '" onclick="castVote(\'' + playerId + '\',' + rIdx + ',' + catIndex + ',false)">' +
      (isChallenged ? (L.voteAccept||'✗ Remove it') : L.voteInvalid) + '</button>' +
      '</div></div>';
  });
  document.getElementById('vote-tally').innerHTML = '';
  document.getElementById('verdict-area').innerHTML = '';
  document.getElementById('lbl-close-challenge').textContent = L.closeChallenge;
  document.getElementById('challenge-modal').style.display = 'flex';
}

function castVote(playerId, rIdx, catIndex, isValid) {
  socket.emit('cast_vote', { code: roomCode, rIdx, playerId, catIndex, isValid });
  const row = document.getElementById('vrow-' + myId);
  if (row) {
    row.querySelectorAll('.vote-btn').forEach(b => b.classList.remove('selected'));
    row.querySelector(isValid?'.valid':'.invalid').classList.add('selected');
  }
}

function updateVoteDisplay(votes, validCount, invalidCount, allVoted, word, playerId) {
  document.getElementById('vote-tally').innerHTML = L.voteTally(validCount, invalidCount);
  if (roomState) {
    roomState.players.forEach(p => {
      const row = document.getElementById('vrow-' + p.id);
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
      '<div class="verdict-banner ' + (rejected?'invalid':'valid') + '">' +
      (rejected ? L.verdictInvalid(word) : L.verdictValid(word)) + '</div>';
  }
}

function closeChallenge() {
  if (challengeOpen) {
    socket.emit('close_challenge', { code: roomCode, ...challengeOpen });
  } else {
    document.getElementById('challenge-modal').style.display = 'none';
  }
}

// ─── SHARE / COPY FUNCTIONS ───────────────────────────────────────
function copyRoomCode() {
  var ta = document.createElement('textarea');
  ta.value = roomCode;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try {
    document.execCommand('copy');
    showToast('📋 Code copied: ' + roomCode);
  } catch(e) {
    prompt('Room code:', roomCode);
  }
  document.body.removeChild(ta);
}

function shareRoom() { copyRoomCode(); }

function shareGame() {
  var url = 'https://panstwamiastagra.com';
  var L2 = LANGS[lang] || LANGS['pl'];
  var text = (L2.inviteText || 'Come play Panstwa-Miasta with me! Free multiplayer word game.') + ' ' + url;
  copyTextFallback(text);
}

function copyTextFallback(text) {
  var ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try {
    document.execCommand('copy');
    showToast('📋 Results copied to clipboard!');
  } catch(e) {
    prompt('Copy and share these results:', text);
  }
  document.body.removeChild(ta);
}

// ─── ACTIONS ───────────────────────────────────────────────
function setScore(playerId, rIdx, catIndex, pts) {
  socket.emit('set_score', { code: roomCode, playerId, rIdx, catIndex, pts });
}
function forceScoring() { showScreen('screen-calculating'); socket.emit('force_scoring', { code: roomCode }); }
function nextRound()     { socket.emit('next_round', { code: roomCode }); }
function markReady()     { socket.emit('mark_ready', { code: roomCode }); }
function callStop()      { socket.emit('call_stop', { code: roomCode }); document.getElementById('stop-btn').style.display='none'; }

function createRoom() {
  const name = document.getElementById('host-name').value.trim();
  if (!name) { showError('Enter your name!'); return; }
  myName = name; isHost = true;
  socket.emit('create_room', { name, settings: { totalRounds: 5, categories: L.cats.slice(0,8), lang, isPublic: getIsPublic() } });
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

function confirmGoHome() {
  if (roomState && roomState.state && roomState.state.phase !== 'lobby' && roomState.state.phase !== 'final') {
    const L2 = LANGS[lang] || LANGS['pl'];
    document.getElementById('confirm-title').textContent = L2.confirmLeaveTitle || 'Leave Game?';
    document.getElementById('confirm-msg').textContent = L2.confirmLeaveMsg || 'A game is in progress. Are you sure?';
    document.getElementById('confirm-yes').textContent = L2.confirmYes || 'Yes, leave';
    document.getElementById('confirm-no').textContent = L2.confirmNo || 'Cancel';
    document.getElementById('confirm-modal').style.display = 'flex';
  } else {
    doGoHome();
  }
}

function closeConfirm() {
  document.getElementById('confirm-modal').style.display = 'none';
}

function doGoHome() {
  closeConfirm();
  goHome();
}

function goHome() {
  roomCode=''; roomState=null; isHost=false; localAnswers={};
  window._timerStart = null;
  clearSession();
  showScreen('screen-home');
}

// ─── LANG ───────────────────────────────────────────────
function setLang(code) {
  lang = code; L = LANGS[code];
  document.querySelectorAll('.lang-btn').forEach(b => b.classList.toggle('active', b.dataset.lang===code));
  applyTranslations();
}

function buildLangBar() {
  const bar = document.getElementById('lang-bar');
  bar.innerHTML = Object.keys(LANGS).map(code =>
    '<button class="lang-btn' + (code===lang?' active':'') + '" data-lang="' + code + '" onclick="setLang(\'' + code + '\')">' + LANGS[code].name + '</button>'
  ).join('');
}

function applyTranslations() {
  L = LANGS[lang] || LANGS['pl'];
  const map = {
    'game-title':'gameTitle','game-subtitle':'gameSubtitle',
    'lbl-create-room':'createRoom','lbl-create-disclaimer':'createDisclaimer','lbl-join-room':'joinRoom',
    'lbl-your-name':'yourName','lbl-join-name':'joinName','lbl-room-code':'roomCode',
    'lbl-create-btn':'createBtn','lbl-join-btn':'joinBtn',
    'lbl-players-in-room':'playersInRoom','lbl-settings':'settings',
    'lbl-rounds-title':'roundsTitle','lbl-grace-title':'graceTitle','lbl-language':'language',
    'lbl-start-btn':'startBtn','lbl-share-code':'shareCode',
    'lbl-draw':'draw','lbl-play':'play','lbl-letter-word':'letterWord',
    'lbl-category-col':'categoryCol','lbl-answer-col':'answerCol',
    'lbl-scoring-hint':'scoringHint','lbl-current-ranking':'currentRanking',
    'lbl-next-round':'nextRound','lbl-game-over':'gameOver',
    'lbl-final-sub':'finalSub','lbl-final-ranking':'finalRanking',
    'lbl-new-game':'newGame','lbl-force-scoring':'forceScoring',
    'lbl-share-btn':'shareBtn','lbl-share-game':'shareGameBtn','nav-share-btn':'shareInviteBtn',
    'lbl-nav-home':'navHome','lbl-leave-room':'leaveRoom',
    'lbl-other-games':'otherGames',
  };
  for (const [id, key] of Object.entries(map)) {
    const el = document.getElementById(id);
    if (el && L[key]) el.textContent = L[key];
  }
  // Keep the hub link in sync with the current language
  const hubLink = document.getElementById('lbl-other-games');
  if (hubLink) hubLink.href = '/games?lang=' + lang;
  const calcEl = document.getElementById('lbl-calculating');
  if (calcEl && L.calculating) calcEl.textContent = L.calculating;
  const calcSub = document.getElementById('lbl-calculating-sub');
  if (calcSub && L.calculatingSub) calcSub.textContent = L.calculatingSub;
  const rules = document.getElementById('rules-text');
  if (rules) rules.innerHTML = L.rules;
  // About + rules section translations
  const aboutMap = {
    'lbl-about-title':'aboutTitle', 'lbl-about-desc':'aboutDesc',
    'lbl-about-players':'aboutPlayers', 'lbl-about-players-desc':'aboutPlayersDesc',
    'lbl-about-free':'aboutFree', 'lbl-about-free-desc':'aboutFreeDesc',
    'lbl-rules-title':'rulesTitle',
    'lbl-rule-1':'rule1', 'lbl-rule-2':'rule2', 'lbl-rule-3':'rule3',
    'lbl-rule-4':'rule4', 'lbl-rule-5':'rule5',
  };
  for (const [id, key] of Object.entries(aboutMap)) {
    const el = document.getElementById(id);
    if (el && L[key]) el.textContent = L[key];
  }
}

// ─── UTILS ───────────────────────────────────────────────
function startsWithLetter(word, letter) {
  return word.charAt(0).toUpperCase() === letter.toUpperCase();
}

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

function clearJoinError() {
  const box = document.getElementById('join-name-error');
  if (box) box.style.display = 'none';
  const input = document.getElementById('join-name');
  if (input) input.style.borderColor = '';
}

function clearHomeError() {
  const box = document.getElementById('home-error');
  if (box) box.style.display = 'none';
}

function showToast(msg) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:var(--card);border:1px solid var(--border);color:var(--text);padding:10px 20px;border-radius:10px;font-weight:700;font-size:14px;z-index:999;';
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

// ─── INIT ───────────────────────────────────────────────
buildLangBar();
applyTranslations();
