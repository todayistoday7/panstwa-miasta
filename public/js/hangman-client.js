// ═══════════════════════════════════════════════════════
// HANGMAN CLIENT
// ═══════════════════════════════════════════════════════
'use strict';

const socket = io();
const _urlLang = new URLSearchParams(window.location.search).get('lang');
let lang      = (['pl','en','de'].includes(_urlLang) ? _urlLang : 'en');
let myId      = null;
let myName    = '';
let roomCode  = '';
let roomState = null;
let keepAliveInterval = null;

// ─── TRANSLATIONS ────────────────────────────────────────────────
const LANGS = {
  pl: {
    name: '🇵🇱 PL',
    gameTitle:         'WISIELEC',
    subtitle:          'Gra słowna · 2-10 graczy',
    createRoom:        'Stwórz pokój',      joinRoom:       'Dołącz do pokoju',
    yourName:          'Twoje imię',        joinName:       'Twoje imię',
    roomCode:          'Kod pokoju',        createBtn:      'Stwórz pokój',
    joinBtn:           'Dołącz',            settings:       'Ustawienia',
    langTitle:         'Język słów',        playersTitle:   'Gracze',
    startBtn:          '🎮 Rozpocznij',     leaveRoom:      '🚪 Wyjdź',
    shareCode:         'Udostępnij kod znajomym',
    shareRoom:         'Udostępnij pokój',
    waitingForHost:    'Czekam na hosta...',
    needPlayers:       'Potrzeba min. 2 graczy',
    howToPlay:         'Zasady gry',
    rule1:             'Stwórz pokój — 2 do 10 graczy',
    rule2:             'Każda runda jeden gracz wymyśla tajne słowo — reszta zgaduje',
    rule3:             'Klikaj litery — 7 błędów i wisielec gotowy!',
    rule4:             'Możesz zgadnąć całe słowo — błąd to natychmiastowa przegrana!',
    rule5:             'Każdy kolejno wymyśla słowo. Gracz z największą liczbą wygranych wygrywa.',
    createDisclaimer:  'Stwórz pokój otwarty lub prywatny. Zaproś znajomych — otrzymasz kod pokoju, który przekażesz innym graczom.',
    hostBadge:         'HOST',
    youBadge:          'TY',
    leaveTitle:        'Opuścić grę?',
    leaveMsg:          'Gra jest w toku. Na pewno chcesz wyjść?',
    confirmLeave:      'Na pewno chcesz opuścić pokój?',
    leaveYes:          'Tak, wyjdź',
    leaveNo:           'Anuluj',
    visPrivate:        'Prywatny',
    visPublic:         'Publiczny',
    roundOf:           (r, t) => `RUNDA ${r} Z ${t}`,
    youArePicker:      '🤫 TWOJA KOLEJ — WYMYŚL SŁOWO',
    theirTurnPick:     (n) => `🤔 ${n} wymyśla słowo...`,
    youAreGuesser:     '🔤 ZGADUJ LITERY!',
    pickerWatching:    '👁 Obserwujesz — to Twoje słowo',
    pickInstruction:   'Wpisz słowo do odgadnięcia:',
    hintPlaceholder:   'Podpowiedź / kategoria (opcjonalnie)',
    confirmWord:       '✓ Zatwierdź słowo',
    pickTip:           'Wskazówka: możesz wylosować losowe słowo 👇',
    randomWord:        '🎲 Losowe słowo',
    guessWordBtn:      'Zgadnij!',
    fullGuessPlaceholder: 'Wpisz całe słowo...',
    pickerWatchingText:'👁 Czekasz — to Twoje słowo. Patrz jak inni zgadują!',
    wrongCount:        (n, m) => `${n}/${m} błędów`,
    wordWas:           'Słowo to było:',
    youWonRound:       '🎉 Zgadłeś! +1 punkt',
    pickerWonRound:    (n) => `💀 ${n} wygrał tę rundę!`,
    youPickerWon:      '🎭 Nikt nie zgadł! +1 punkt dla Ciebie',
    nextRound:         'Następna runda →',
    waitingHost:       'Czekam na hosta...',
    gameOver:          'Koniec gry!',
    winner:            (n) => `🏆 ${n} wygrywa!`,
    draw:              'Remis! 🤝',
    wins:              'wygranych',
    playAgain:         '🔄 Zagraj jeszcze raz z tą grupą',
    goHome:            '🏠 Powrót',
    roomVis:           'Widoczność pokoju',
  },
  en: {
    name: '🇬🇧 EN',
    gameTitle:         'HANGMAN',
    subtitle:          'Word guessing game · 2-10 players',
    createRoom:        'Create Room',       joinRoom:       'Join Room',
    yourName:          'Your name',         joinName:       'Your name',
    roomCode:          'Room code',         createBtn:      'Create Room',
    joinBtn:           'Join Room',         settings:       'Settings',
    langTitle:         'Word language',     playersTitle:   'Players',
    startBtn:          '🎮 Start Game',     leaveRoom:      '🚪 Leave Room',
    shareCode:         'Share this code with friends',
    shareRoom:         'Share Room',
    waitingForHost:    'Waiting for host...',
    needPlayers:       'Need at least 2 players',
    howToPlay:         'How to play',
    rule1:             'Create a room — 2 to 10 players',
    rule2:             'Each round one player picks a secret word — everyone else guesses',
    rule3:             'Tap letters to guess — 7 wrong guesses and the hangman is complete!',
    rule4:             'You can also guess the full word — but wrong = instant loss!',
    rule5:             'Everyone takes a turn picking. Most wins at the end takes the game.',
    createDisclaimer:  "Create a public or private room. Invite friends — you'll get a room code to share with other players.",
    hostBadge:         'HOST',
    youBadge:          'YOU',
    leaveTitle:        'Leave Game?',
    leaveMsg:          'A game is in progress. Are you sure?',
    confirmLeave:      'Are you sure you want to leave the room?',
    leaveYes:          'Yes, leave',
    leaveNo:           'Cancel',
    visPrivate:        'Private',
    visPublic:         'Public',
    roundOf:           (r, t) => `ROUND ${r} OF ${t}`,
    youArePicker:      '🤫 YOUR TURN — PICK A WORD',
    theirTurnPick:     (n) => `🤔 ${n} is picking a word...`,
    youAreGuesser:     '🔤 GUESS THE LETTERS!',
    pickerWatching:    '👁 You\'re watching — it\'s your word',
    pickInstruction:   'Type the word for others to guess:',
    hintPlaceholder:   'Hint / category (optional)',
    confirmWord:       '✓ Set Word',
    pickTip:           'Tip: use a random word from the word bank 👇',
    randomWord:        '🎲 Random Word',
    guessWordBtn:      'Guess!',
    fullGuessPlaceholder: 'Type the full word...',
    pickerWatchingText:'👁 You\'re watching — it\'s your word. See if they get it!',
    wrongCount:        (n, m) => `${n}/${m} wrong`,
    wordWas:           'The word was:',
    youWonRound:       '🎉 You got it! +1 point',
    pickerWonRound:    (n) => `💀 ${n} wins this round!`,
    youPickerWon:      '🎭 Nobody guessed it! +1 point for you',
    nextRound:         'Next Round →',
    waitingHost:       'Waiting for host...',
    gameOver:          'Game Over!',
    winner:            (n) => `🏆 ${n} wins!`,
    draw:              "It's a draw! 🤝",
    wins:              'wins',
    playAgain:         '🔄 Play Again With This Group',
    goHome:            '🏠 Home',
    roomVis:           'Room visibility',
  },
  de: {
    name: '🇩🇪 DE',
    gameTitle:         'GALGENMÄNNCHEN',
    subtitle:          'Wortratespiel · 2-10 Spieler',
    createRoom:        'Raum erstellen',    joinRoom:       'Raum beitreten',
    yourName:          'Dein Name',         joinName:       'Dein Name',
    roomCode:          'Raumcode',          createBtn:      'Raum erstellen',
    joinBtn:           'Beitreten',         settings:       'Einstellungen',
    langTitle:         'Wortsprache',       playersTitle:   'Spieler',
    startBtn:          '🎮 Spiel starten',  leaveRoom:      '🚪 Verlassen',
    shareCode:         'Code mit Freunden teilen',
    shareRoom:         'Raum teilen',
    waitingForHost:    'Warten auf Host...',
    needPlayers:       'Mindestens 2 Spieler benötigt',
    howToPlay:         'Spielregeln',
    rule1:             'Raum erstellen — 2 bis 10 Spieler',
    rule2:             'Jede Runde wählt ein Spieler ein geheimes Wort — alle anderen raten',
    rule3:             'Buchstaben antippen — 7 Fehler und das Galgenmännchen ist fertig!',
    rule4:             'Du kannst auch das ganze Wort raten — falsch = sofortige Niederlage!',
    rule5:             'Jeder ist einmal dran. Wer am Ende die meisten Siege hat, gewinnt.',
    createDisclaimer:  'Erstelle einen öffentlichen oder privaten Raum. Lade Freunde ein — du bekommst einen Code zum Teilen.',
    hostBadge:         'HOST',
    youBadge:          'DU',
    leaveTitle:        'Spiel verlassen?',
    leaveMsg:          'Das Spiel läuft. Bist du sicher?',
    confirmLeave:      'Möchtest du den Raum wirklich verlassen?',
    leaveYes:          'Ja, verlassen',
    leaveNo:           'Abbrechen',
    visPrivate:        'Privat',
    visPublic:         'Öffentlich',
    roundOf:           (r, t) => `RUNDE ${r} VON ${t}`,
    youArePicker:      '🤫 DEINE RUNDE — WÄHLE EIN WORT',
    theirTurnPick:     (n) => `🤔 ${n} wählt ein Wort...`,
    youAreGuesser:     '🔤 RATE DIE BUCHSTABEN!',
    pickerWatching:    '👁 Du schaust zu — es ist dein Wort',
    pickInstruction:   'Gib das Wort zum Raten ein:',
    hintPlaceholder:   'Hinweis / Kategorie (optional)',
    confirmWord:       '✓ Wort festlegen',
    pickTip:           'Tipp: Nutze ein zufälliges Wort aus der Wortliste 👇',
    randomWord:        '🎲 Zufälliges Wort',
    guessWordBtn:      'Raten!',
    fullGuessPlaceholder: 'Ganzes Wort eingeben...',
    pickerWatchingText:'👁 Du schaust zu — sieh, ob sie es erraten!',
    wrongCount:        (n, m) => `${n}/${m} Fehler`,
    wordWas:           'Das Wort war:',
    youWonRound:       '🎉 Erraten! +1 Punkt',
    pickerWonRound:    (n) => `💀 ${n} gewinnt diese Runde!`,
    youPickerWon:      '🎭 Niemand hat es erraten! +1 Punkt für dich',
    nextRound:         'Nächste Runde →',
    waitingHost:       'Warten auf Host...',
    gameOver:          'Spiel vorbei!',
    winner:            (n) => `🏆 ${n} gewinnt!`,
    draw:              'Unentschieden! 🤝',
    wins:              'Siege',
    playAgain:         '🔄 Nochmal mit dieser Gruppe spielen',
    goHome:            '🏠 Startseite',
    roomVis:           'Raumsichtbarkeit',
  },
};
let L = LANGS[lang];

// ─── GALLOWS SVG ─────────────────────────────────────────────────
// 7 parts: gallows frame, head, body, left arm, right arm, left leg, right leg
function drawGallows(svgEl, wrongCount, isComplete) {
  svgEl.innerHTML = '';
  const s = (tag, attrs, parent) => {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    (parent || svgEl).appendChild(el);
    return el;
  };

  // Gallows frame — always visible
  s('line', { x1:20,  y1:190, x2:180, y2:190, stroke:'var(--muted)', 'stroke-width':4, 'stroke-linecap':'round' }); // base
  s('line', { x1:60,  y1:190, x2:60,  y2:20,  stroke:'var(--muted)', 'stroke-width':4, 'stroke-linecap':'round' }); // pole
  s('line', { x1:60,  y1:20,  x2:130, y2:20,  stroke:'var(--muted)', 'stroke-width':4, 'stroke-linecap':'round' }); // top bar
  s('line', { x1:130, y1:20,  x2:130, y2:42,  stroke:'var(--muted)', 'stroke-width':3, 'stroke-linecap':'round' }); // noose rope — part 0 (always shown as part of frame)

  const color = isComplete ? 'var(--red)' : 'var(--text)';

  // Part 1: head
  if (wrongCount >= 1) {
    s('circle', { cx:130, cy:54, r:12, fill:'none', stroke:color, 'stroke-width':3 });
  }
  // Part 2: body
  if (wrongCount >= 2) {
    s('line', { x1:130, y1:66, x2:130, y2:120, stroke:color, 'stroke-width':3, 'stroke-linecap':'round' });
  }
  // Part 3: left arm
  if (wrongCount >= 3) {
    s('line', { x1:130, y1:80, x2:108, y2:100, stroke:color, 'stroke-width':3, 'stroke-linecap':'round' });
  }
  // Part 4: right arm
  if (wrongCount >= 4) {
    s('line', { x1:130, y1:80, x2:152, y2:100, stroke:color, 'stroke-width':3, 'stroke-linecap':'round' });
  }
  // Part 5: left leg
  if (wrongCount >= 5) {
    s('line', { x1:130, y1:120, x2:108, y2:148, stroke:color, 'stroke-width':3, 'stroke-linecap':'round' });
  }
  // Part 6: right leg
  if (wrongCount >= 6) {
    s('line', { x1:130, y1:120, x2:152, y2:148, stroke:color, 'stroke-width':3, 'stroke-linecap':'round' });
  }
  // Part 7: face (X eyes when complete)
  if (wrongCount >= 7) {
    s('line', { x1:124, y1:48, x2:128, y2:52, stroke:'var(--red)', 'stroke-width':2, 'stroke-linecap':'round' });
    s('line', { x1:128, y1:48, x2:124, y2:52, stroke:'var(--red)', 'stroke-width':2, 'stroke-linecap':'round' });
    s('line', { x1:132, y1:48, x2:136, y2:52, stroke:'var(--red)', 'stroke-width':2, 'stroke-linecap':'round' });
    s('line', { x1:136, y1:48, x2:132, y2:52, stroke:'var(--red)', 'stroke-width':2, 'stroke-linecap':'round' });
  }
}

// ─── KEYBOARD ────────────────────────────────────────────────────
// Language-appropriate alphabet
const ALPHABETS = {
  pl: 'AĄBCĆDEĘFGHIJKLŁMNŃOÓPQRSŚTUVWXYZŹŻ',
  en: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  de: 'ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜß',
};

function buildKeyboard(guessedLetters, word) {
  const el  = document.getElementById('hang-keyboard');
  el.innerHTML = '';
  const alpha = ALPHABETS[L === LANGS.pl ? 'pl' : L === LANGS.de ? 'de' : 'en'] ||
                ALPHABETS['en'];
  // Determine which letters are wrong vs correct
  const wordLetters = word ? word.toUpperCase().split('') : [];

  alpha.split('').forEach(ch => {
    const btn = document.createElement('button');
    btn.className = 'hang-key';
    btn.textContent = ch;
    if (guessedLetters.includes(ch)) {
      btn.classList.add('used');
      btn.classList.add(wordLetters.includes(ch) ? 'correct' : 'wrong');
    } else {
      btn.addEventListener('click', () => guessLetter(ch));
    }
    el.appendChild(btn);
  });
}

// ─── SOCKET EVENTS ───────────────────────────────────────────────
socket.on('connect', () => {
  myId = socket.id;
  clearInterval(keepAliveInterval);
  keepAliveInterval = setInterval(() => {
    if (roomCode) socket.emit('hang_keep_alive');
  }, 20000);
  const sc = sessionStorage.getItem('hang_code');
  const sn = sessionStorage.getItem('hang_name');
  if (sc && sn && !roomCode) {
    roomCode = sc; myName = sn;
    socket.emit('hang_rejoin', { code: sc, name: sn });
  }
});

socket.on('hang_room_created', ({ code }) => {
  roomCode = code; roomState = null;
  sessionStorage.setItem('hang_code', code);
  sessionStorage.setItem('hang_name', myName);
  document.getElementById('room-code-display').textContent = code;
  showScreen('screen-lobby');
});

socket.on('hang_room_joined', ({ code }) => {
  roomCode = code; roomState = null;
  sessionStorage.setItem('hang_code', code);
  sessionStorage.setItem('hang_name', myName);
  document.getElementById('room-code-display').textContent = code;
  showScreen('screen-lobby');
});

socket.on('hang_error', ({ msg }) => { showError(msg); });
socket.on('hang_state', (data)    => { roomState = data; applyState(data); });

// ─── STATE HANDLER ───────────────────────────────────────────────
function applyState(data) {
  switch (data.phase) {
    case 'lobby':    showScreen('screen-lobby');     renderLobby(data);    break;
    case 'picking':  showScreen('screen-picking');   renderPicking(data);  break;
    case 'guessing': showScreen('screen-guessing');  renderGuessing(data); break;
    case 'roundEnd': showScreen('screen-round-end'); renderRoundEnd(data); break;
    case 'final':    showScreen('screen-final');     renderFinal(data);    break;
  }
}

// ─── LOBBY ───────────────────────────────────────────────────────
function renderLobby(data) {
  const { players, settings, hostId } = data;
  const isHost    = myId === hostId;
  const connected = players.filter(p => p.connected !== false);

  const el = document.getElementById('lobby-players');
  el.innerHTML = '';
  connected.forEach((p, i) => {
    el.innerHTML +=
      '<div class="lobby-player">' +
        '<div class="avatar av-' + (i % 8) + '">' + p.name.charAt(0).toUpperCase() + '</div>' +
        '<span class="pname">' + p.name +
          (p.id === myId   ? ' <span style="font-size:11px;background:rgba(6,214,160,0.15);border:1px solid rgba(6,214,160,0.4);color:var(--green);border-radius:20px;padding:2px 8px;">' + L.youBadge + '</span>' : '') +
          (p.id === hostId ? ' <span class="host-badge">' + L.hostBadge + '</span>' : '') +
        '</span>' +
      '</div>';
  });

  const warn = document.getElementById('player-warning');
  if (warn) { warn.style.display = connected.length < 2 ? 'block' : 'none'; warn.textContent = L.needPlayers; }

  // Lang pills
  const pillsEl = document.getElementById('lobby-lang-pills');
  if (pillsEl) {
    pillsEl.innerHTML = '';
    ['pl','en','de'].forEach(code => {
      pillsEl.innerHTML += '<div class="lang-pill' + (code === (settings.lang || lang) ? ' active' : '') + '"' +
        (isHost ? ' onclick="setGameLang(\'' + code + '\')"' : '') + ' style="cursor:' + (isHost ? 'pointer' : 'default') + '">' +
        LANGS[code].name + '</div>';
    });
  }

  // Visibility toggle
  const togWrap = document.getElementById('visibility-toggle');
  if (togWrap) { togWrap.style.pointerEvents = isHost ? 'auto' : 'none'; togWrap.style.opacity = isHost ? '1' : '0.4'; }
  if (settings && settings.isPublic !== undefined) setVisibility(settings.isPublic);

  if (isHost) {
    document.getElementById('lobby-btn-row').style.display = 'flex';
    document.getElementById('waiting-msg').style.display   = 'none';
  } else {
    document.getElementById('lobby-btn-row').style.display = 'none';
    document.getElementById('waiting-msg').style.display   = 'block';
    document.getElementById('waiting-msg').textContent     = L.waitingForHost;
  }
}

// ─── PICKING PHASE ───────────────────────────────────────────────
function renderPicking(data) {
  const { players, pickerId, roundsPlayed, totalRounds } = data;
  const isPicker = myId === pickerId;
  const pickerName = (players.find(p => p.id === pickerId) || {}).name || '?';

  document.getElementById('pick-round-badge').textContent =
    L.roundOf(roundsPlayed + 1, totalRounds);

  renderMiniScoreboard('pick-scoreboard', data);

  const banner = document.getElementById('pick-role-banner');
  banner.textContent = isPicker ? L.youArePicker : L.theirTurnPick(pickerName);

  document.getElementById('pick-input-area').style.display   = isPicker ? 'flex' : 'none';
  document.getElementById('pick-waiting-area').style.display = isPicker ? 'none' : 'block';

  if (!isPicker) {
    document.getElementById('pick-waiting-text').textContent = L.theirTurnPick(pickerName);
  } else {
    // Pre-fill hint placeholder
    const hintEl = document.getElementById('hint-input');
    if (hintEl) hintEl.placeholder = L.hintPlaceholder;
    const wordEl = document.getElementById('word-input');
    if (wordEl) wordEl.focus();
  }
}

// ─── GUESSING PHASE ──────────────────────────────────────────────
function renderGuessing(data) {
  const { players, pickerId, display, guessedLetters, wrongCount, maxWrong, hint, word } = data;
  const isPicker   = myId === pickerId;
  const pickerName = (players.find(p => p.id === pickerId) || {}).name || '?';
  const isComplete = wrongCount >= maxWrong;

  document.getElementById('guess-round-badge').textContent =
    L.roundOf(data.roundsPlayed + 1, data.totalRounds);

  renderMiniScoreboard('guess-scoreboard', data);

  const banner = document.getElementById('guess-role-banner');
  if (isPicker) {
    banner.textContent  = L.pickerWatching;
    banner.className    = 'hang-role-banner picker';
  } else {
    banner.textContent  = L.youAreGuesser;
    banner.className    = 'hang-role-banner guesser';
  }

  // Hint
  const hintEl = document.getElementById('guess-hint');
  if (hint) {
    hintEl.style.display = 'block';
    hintEl.innerHTML = '💡 <span>' + hint + '</span>';
  } else {
    hintEl.style.display = 'none';
  }

  // Gallows
  drawGallows(document.getElementById('hang-svg'), wrongCount, isComplete);

  // Word display
  renderWordDisplay('hang-word-display', display, false);

  // Wrong count pips
  renderWrongPips('hang-wrong-bar', wrongCount, maxWrong);

  // Keyboard
  if (!isPicker) {
    document.getElementById('hang-keyboard').style.display     = 'flex';
    document.getElementById('hang-fullguess-wrap').style.display = 'flex';
    document.getElementById('picker-watching').style.display   = 'none';
    buildKeyboard(guessedLetters, word);
    // Placeholder
    const fg = document.getElementById('fullguess-input');
    if (fg) fg.placeholder = L.fullGuessPlaceholder;
  } else {
    document.getElementById('hang-keyboard').style.display     = 'none';
    document.getElementById('hang-fullguess-wrap').style.display = 'none';
    document.getElementById('picker-watching').style.display   = 'block';
    document.getElementById('picker-watching').textContent     = L.pickerWatchingText;
  }
}

// ─── ROUND END ───────────────────────────────────────────────────
function renderRoundEnd(data) {
  const { players, pickerId, roundWinner, word, wrongCount, maxWrong, display, hostId,
          roundsPlayed, totalRounds } = data;
  const pickerName = (players.find(p => p.id === pickerId) || {}).name || '?';
  const isHost     = myId === hostId;

  // Result banner
  const banner = document.getElementById('re-result-banner');
  if (roundWinner === myId) {
    banner.textContent = L.youWonRound;
    banner.className   = 'hang-result-banner win';
  } else if (roundWinner === null && myId === pickerId) {
    banner.textContent = L.youPickerWon;
    banner.className   = 'hang-result-banner win';
  } else if (roundWinner === null) {
    banner.textContent = L.pickerWonRound(pickerName);
    banner.className   = 'hang-result-banner lose';
  } else {
    const winnerName = (players.find(p => p.id === roundWinner) || {}).name || '?';
    banner.textContent = myId === pickerId ? `🎉 ${winnerName} ${L.wins}!` : L.pickerWonRound(pickerName);
    banner.className   = 'hang-result-banner ' + (myId === roundWinner ? 'win' : 'lose');
  }

  // Word reveal
  document.getElementById('lbl-the-word-was').textContent = L.wordWas;
  document.getElementById('re-word').textContent = word || '';

  // Gallows at final state
  drawGallows(document.getElementById('hang-svg-end'), wrongCount, wrongCount >= maxWrong);

  // Scoreboard
  renderMiniScoreboard('re-scoreboard', data);

  // Host button
  const nextBtn  = document.getElementById('lbl-next-round');
  const reWaiting = document.getElementById('re-waiting');
  if (isHost) {
    nextBtn.textContent   = roundsPlayed + 1 >= totalRounds ? '🏆 ' + L.gameOver : L.nextRound;
    nextBtn.style.display = 'inline-flex';
    reWaiting.style.display = 'none';
  } else {
    nextBtn.style.display   = 'none';
    reWaiting.style.display = 'block';
    reWaiting.textContent   = L.waitingHost;
  }
}

// ─── FINAL ───────────────────────────────────────────────────────
function renderFinal(data) {
  const { players, scores, hostId } = data;
  // Build scores from players array (server sends score in players)
  const sorted = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));
  const maxScore = sorted[0] ? (sorted[0].score || 0) : 0;
  const winners  = sorted.filter(p => (p.score || 0) === maxScore);
  const isDraw   = winners.length > 1;

  document.getElementById('lbl-game-over').textContent = L.gameOver;

  const heading = isDraw ? L.draw : L.winner(winners[0].name);
  const el = document.getElementById('final-results');
  el.innerHTML = '<div style="text-align:center;font-size:22px;font-weight:900;color:var(--accent2);margin-bottom:20px;">' + heading + '</div>';

  sorted.forEach((p, i) => {
    const s     = p.score || 0;
    const isWin = s === maxScore && !isDraw;
    el.innerHTML +=
      '<div class="hang-final-row' + (isWin ? ' winner' : '') + '">' +
        '<span style="font-weight:800;font-size:15px;">' +
          (i===0?'🥇':i===1?'🥈':i===2?'🥉':(i+1)+'.') + ' ' +
          p.name + (p.id === myId ? ' (' + L.youBadge + ')' : '') +
        '</span>' +
        '<span class="hang-final-pts">' + s + ' <span style="font-size:14px;font-family:Nunito">' + L.wins + '</span></span>' +
      '</div>';
  });

  const playBtn = document.getElementById('lbl-play-again');
  if (playBtn) { playBtn.style.display = myId === data.hostId ? 'inline-flex' : 'none'; }
}

// ─── SHARED RENDERERS ────────────────────────────────────────────
function renderWordDisplay(elId, display, revealAll) {
  const el = document.getElementById(elId);
  if (!el || !display) return;
  el.innerHTML = '';
  display.forEach(ch => {
    const letter = document.createElement('div');
    if (ch === ' ') {
      letter.className = 'hang-letter space';
      letter.innerHTML = '<div class="hang-letter-char">&nbsp;</div>';
    } else {
      const isRevealed = ch !== '_';
      letter.className = 'hang-letter';
      letter.innerHTML =
        '<div class="hang-letter-char' + (isRevealed ? ' revealed' : '') + '">' +
          (isRevealed ? ch : '&nbsp;') +
        '</div>' +
        (ch !== ' ' ? '<div class="hang-letter-line"></div>' : '');
    }
    el.appendChild(letter);
  });
}

function renderWrongPips(elId, wrongCount, maxWrong) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.innerHTML = '';
  for (let i = 0; i < maxWrong; i++) {
    const pip = document.createElement('div');
    pip.className = 'hang-wrong-pip' + (i < wrongCount ? ' filled' : '');
    el.appendChild(pip);
  }
  const label = document.createElement('span');
  label.textContent = L.wrongCount(wrongCount, maxWrong);
  el.appendChild(label);
}

function renderMiniScoreboard(elId, data) {
  const el = document.getElementById(elId);
  if (!el) return;
  const { players, pickerId } = data;
  el.innerHTML = '';
  players.filter(p => p.connected !== false).forEach(p => {
    const chip = document.createElement('div');
    chip.className = 'hang-score-chip' + (p.id === pickerId ? ' picker-turn' : '');
    chip.innerHTML =
      '<span>' + p.name + (p.id === pickerId ? ' 🤫' : '') +
        (p.id === myId ? ' (' + L.youBadge + ')' : '') + '</span>' +
      '<span class="hang-score-num">' + (p.score || 0) + '</span>';
    el.appendChild(chip);
  });
}

// ─── ACTIONS ─────────────────────────────────────────────────────
function guessLetter(letter) {
  socket.emit('hang_guess_letter', { code: roomCode, letter });
}

function guessFullWord() {
  const el = document.getElementById('fullguess-input');
  if (!el) return;
  const guess = el.value.trim();
  if (!guess) return;
  socket.emit('hang_guess_word', { code: roomCode, guess });
  el.value = '';
}

function submitWord() {
  const wordEl = document.getElementById('word-input');
  const hintEl = document.getElementById('hint-input');
  const word = wordEl ? wordEl.value.trim() : '';
  const hint = hintEl ? hintEl.value.trim() : '';
  socket.emit('hang_set_word', { code: roomCode, word, hint });
}

function pickRandomWord() {
  const gameLang = (roomState && roomState.settings && roomState.settings.lang) || lang;
  const words    = HANG_WORDS[gameLang] || HANG_WORDS['en'];
  const word     = words[Math.floor(Math.random() * words.length)];
  const wordEl   = document.getElementById('word-input');
  if (wordEl) { wordEl.value = word; wordEl.focus(); }
}

function nextRound()  { socket.emit('hang_next_round',  { code: roomCode }); }
function playAgain()  { socket.emit('hang_play_again',  { code: roomCode }); }
function startGame()  { socket.emit('hang_start',        { code: roomCode }); }
function createRoom() {
  const name = document.getElementById('host-name').value.trim();
  if (!name) { showError(lang === 'pl' ? 'Wpisz swoje imię!' : lang === 'de' ? 'Gib deinen Namen ein!' : 'Enter your name!'); return; }
  myName = name;
  socket.emit('hang_create', { name, settings: { lang, isPublic: getIsPublic() } });
}
function joinRoom() {
  const name = document.getElementById('join-name').value.trim();
  const code = document.getElementById('join-code').value.trim().toUpperCase();
  if (!name) { showError(lang === 'pl' ? 'Wpisz swoje imię!' : lang === 'de' ? 'Gib deinen Namen ein!' : 'Enter your name!'); return; }
  if (!code || code.length < 5) { showError(lang === 'pl' ? 'Wpisz kod pokoju!' : lang === 'de' ? 'Raumcode eingeben!' : 'Enter the room code!'); return; }
  myName = name;
  socket.emit('hang_join', { name, code });
}
function setGameLang(code) {
  lang = code; L = LANGS[code] || LANGS['en'];
  applyTranslations();
  socket.emit('hang_update_settings', { code: roomCode, settings: { lang: code, isPublic: getIsPublic() } });
}
function updateSettings() {
  socket.emit('hang_update_settings', { code: roomCode, settings: { lang, isPublic: getIsPublic() } });
}
function goHome() {
  roomCode = ''; roomState = null; myName = '';
  sessionStorage.removeItem('hang_code');
  sessionStorage.removeItem('hang_name');
  showScreen('screen-home');
}
function doGoHome() { closeConfirm(); goHome(); }

// ─── LANG ────────────────────────────────────────────────────────
function setUiLang(code) {
  lang = code; L = LANGS[code] || LANGS['en'];
  document.querySelectorAll('.lang-btn').forEach(b =>
    b.classList.toggle('active', b.textContent === LANGS[code].name));
  applyTranslations();
  if (roomState) applyState(roomState);
}

function applyTranslations() {
  const map = {
    'game-title':           'gameTitle',   'game-subtitle':        'subtitle',
    'lbl-create-room':      'createRoom',  'lbl-join-room':        'joinRoom',
    'lbl-your-name':        'yourName',    'lbl-join-name':        'joinName',
    'lbl-room-code':        'roomCode',    'lbl-create-btn':       'createBtn',
    'lbl-join-btn':         'joinBtn',     'lbl-settings':         'settings',
    'lbl-lang-title':       'langTitle',   'lbl-players-title':    'playersTitle',
    'lbl-start-btn':        'startBtn',    'lbl-leave-room':       'leaveRoom',
    'lbl-share-code':       'shareCode',   'lbl-share-room':       'shareRoom',
    'lbl-how-to-play':      'howToPlay',
    'lbl-rule-1':           'rule1',       'lbl-rule-2':           'rule2',
    'lbl-rule-3':           'rule3',       'lbl-rule-4':           'rule4',
    'lbl-rule-5':           'rule5',
    'lbl-create-disclaimer':'createDisclaimer',
    'lbl-pick-instruction': 'pickInstruction',
    'lbl-confirm-word':     'confirmWord', 'lbl-pick-tip':         'pickTip',
    'lbl-random-word':      'randomWord',  'lbl-guess-word-btn':   'guessWordBtn',
    'lbl-next-round':       'nextRound',   'lbl-game-over':        'gameOver',
    'lbl-play-again':       'playAgain',   'lbl-go-home':          'goHome',
    'lbl-room-visibility':  'roomVis',
  };
  for (const [id, key] of Object.entries(map)) {
    const el = document.getElementById(id);
    if (el && L[key] && typeof L[key] === 'string') el.textContent = L[key];
  }
  // Vis labels
  const vp = document.getElementById('lbl-vis-private');
  const vu = document.getElementById('lbl-vis-public');
  if (vp) vp.textContent = L.visPrivate;
  if (vu) vu.textContent = L.visPublic;
}

// ─── INIT ────────────────────────────────────────────────────────
buildLangBar();
applyTranslations();
initVisibilityToggle();
prefillJoinCode();
