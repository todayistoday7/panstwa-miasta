// ═══════════════════════════════════════════════════════
// TWO TRUTHS ONE LIE — Client
// ═══════════════════════════════════════════════════════
'use strict';

const socket = io();
const _urlLang = new URLSearchParams(window.location.search).get('lang');
let lang      = (['pl','en'].includes(_urlLang) ? _urlLang : 'en');
let myId      = null;
var _settingsInitTT = false;
let myName    = '';
let roomCode  = '';
let roomState = null;
let myVote    = null;    // which statement I voted as the lie
let myLieIdx  = null;    // which statement I chose as my lie (writing phase)
let keepAliveInterval = null;

const LANGS = {
  pl: {
    name: '🇵🇱 PL',
    gameTitle:      'DWIE PRAWDY JEDNO KŁAMSTWO',
    subtitle:       'Gra imprezowa · 3-20 graczy',
    createRoom:     'Stwórz pokój',    joinRoom:      'Dołącz do pokoju',
    yourName:       'Twoje imię',      joinName:      'Twoje imię',
    roomCode:       'Kod pokoju',      createBtn:     'Stwórz pokój',
    joinBtn:        'Dołącz',          settings:      'Ustawienia',
    langTitle:      'Język',           playersTitle:  'Gracze',
    startBtn:       '🎮 Rozpocznij',   leaveRoom:     '🚪 Wyjdź',
    shareCode:      'Udostępnij kod znajomym',
    copyCode:       'Skopiuj kod',     shareRoom:     'Udostępnij pokój',
    homeRejoinTip: 'Jeśli przypadkowo opuścisz grę, wróć z tym samym imieniem i kodem pokoju.',
    createDisclaimer: 'Stwórz pokój otwarty lub prywatny. Zaproś znajomych — otrzymasz kod pokoju, który przekażesz innym graczom.',
    waitingForHost: 'Czekam na hosta...',
    needPlayers:    'Potrzeba min. 3 graczy',
    howToPlay:      'Zasady gry',
    rule1:          'Stwórz pokój — 3 do 20 graczy',
    rule2:          'Każda runda jeden gracz pisze 3 zdania o sobie',
    rule3:          '2 są prawdziwe, 1 jest kłamstwem — Ty decydujesz które!',
    rule4:          'Wszyscy głosują które zdanie to kłamstwo',
    rule5:          'Trafne odgadnięcie = 1pkt · Każda oszukana osoba = 1pkt dla Ciebie',
    yourTurnWrite:  '✍️ TWOJA KOLEJ — napisz swoje zdania!',
    theirTurnWrite: (n) => `✍️ ${n} pisze swoje zdania...`,
    writingInstruction: 'Napisz 3 zdania o sobie. Dwa muszą być prawdziwe, jedno fałszywe.',
    statement1:     'Zdanie 1',
    statement2:     'Zdanie 2',
    statement3:     'Zdanie 3',
    chooseLie:      'Które zdanie to kłamstwo?',
    lieIs1:         'Kłamstwo to: Zdanie 1',
    lieIs2:         'Kłamstwo to: Zdanie 2',
    lieIs3:         'Kłamstwo to: Zdanie 3',
    submitBtn:      '✓ Gotowe!',
    votingInstruction: 'Które zdanie to kłamstwo? Kliknij, żeby zagłosować.',
    waitingInstruction: 'Czekam aż wszyscy zagłosują...',
    youVoted:       'Zagłosowałeś!',
    revealBtn:      '👁 Odkryj odpowiedź',
    revealTitle:    (n) => `🎭 Kłamstwo ${n}:`,
    lieWas:         'To było kłamstwo! 🎭',
    truthWas:       'To była prawda! ✓',
    correct:        '✅ Trafiłeś! +1',
    wrong:          '❌ Nie trafiłeś',
    fooled:         (n) => `🎭 Oszukałeś ${n} ${n === 1 ? 'osobę' : 'osoby/osób'}! +${n}`,
    roundScore:     'Punkty w tej rundzie:',
    nextPlayer:     'Następny gracz →',
    finalRound:     '🏆 Zobacz wyniki',
    waitingNext:    'Czekam na hosta...',
    roundOf:        (n, t) => `Runda ${n} z ${t}`,
    gameOver:       'Koniec gry!',
    winner:         (n) => `🏆 ${n} wygrywa!`,
    draw:           'Remis! 🤝',
    pts:            'pkt',
    navHome:        'Strona główna',
    navAllGames:    'Wszystkie gry',
    playAgain:      '🔄 Zagraj jeszcze raz z tą grupą',
    goHome:         '🏠 Powrót',
    hostBadge:      'HOST',
    youBadge:       'TY',
    leaveTitle:     'Opuścić grę?',
    leaveMsg:       'Gra jest w toku. Na pewno chcesz wyjść?',
    confirmLeave:   'Na pewno chcesz opuścić pokój?',
    leaveYes:       'Tak, wyjdź',
    leaveNo:        'Anuluj',
  },
  en: {
    name: '🇬🇧 EN',
    gameTitle:      '2 TRUTHS 1 LIE',
    subtitle:       'Party icebreaker · 3-20 players',
    createRoom:     'Create Room',     joinRoom:      'Join Room',
    yourName:       'Your name',       joinName:      'Your name',
    roomCode:       'Room code',       createBtn:     'Create Room',
    joinBtn:        'Join Room',       settings:      'Settings',
    langTitle:      'Language',        playersTitle:  'Players',
    startBtn:       '🎮 Start Game',   leaveRoom:     '🚪 Leave Room',
    shareCode:      'Share this code with friends',
    copyCode:       'Copy Code',       shareRoom:     'Share Room',
    homeRejoinTip: 'If you accidentally leave mid-game, rejoin with the same name and room code.',
    rejoinTip: 'If you accidentally leave, rejoin with the same name and room code.',
    createDisclaimer: 'Create a public or private room. Invite friends — you\'ll get a room code to share with other players.',
    waitingForHost: 'Waiting for host...',
    needPlayers:    'Need at least 3 players',
    howToPlay:      'How to play',
    rule1:          'Create a room — 3 to 20 players',
    rule2:          'Each round one player writes 3 statements about themselves',
    rule3:          '2 are true, 1 is a lie — you choose which!',
    rule4:          'Everyone votes which statement they think is the lie',
    rule5:          'Correct guess = 1pt · Each person you fool = 1pt for you',
    yourTurnWrite:  '✍️ YOUR TURN — write your statements!',
    theirTurnWrite: (n) => `✍️ ${n} is writing their statements...`,
    writingInstruction: 'Write 3 statements about yourself. Two must be true, one must be a lie.',
    statement1:     'Statement 1',
    statement2:     'Statement 2',
    statement3:     'Statement 3',
    chooseLie:      'Which statement is the lie?',
    lieIs1:         'Lie is: Statement 1',
    lieIs2:         'Lie is: Statement 2',
    lieIs3:         'Lie is: Statement 3',
    submitBtn:      '✓ Submit!',
    votingInstruction: 'Which statement is the lie? Tap to vote.',
    waitingInstruction: 'Waiting for everyone to vote...',
    youVoted:       'Vote submitted!',
    revealBtn:      '👁 Reveal',
    revealTitle:    (n) => `🎭 ${n}'s lie was:`,
    lieWas:         'This was the LIE! 🎭',
    truthWas:       'This was true ✓',
    correct:        '✅ You got it! +1',
    wrong:          '❌ Wrong guess',
    fooled:         (n) => `🎭 You fooled ${n} ${n === 1 ? 'person' : 'people'}! +${n}`,
    roundScore:     'This round:',
    nextPlayer:     'Next Player →',
    finalRound:     '🏆 See Final Results',
    waitingNext:    'Waiting for host...',
    roundOf:        (n, t) => `Round ${n} of ${t}`,
    gameOver:       'Game Over!',
    winner:         (n) => `🏆 ${n} wins!`,
    draw:           "It's a draw! 🤝",
    pts:            'pts',
    navHome:        'Home',
    navAllGames:    'All Games',
    playAgain:      '🔄 Play Again With This Group',
    goHome:         '🏠 Home',
    hostBadge:      'HOST',
    youBadge:       'YOU',
    leaveTitle:     'Leave Game?',
    leaveMsg:       'A game is in progress. Are you sure?',
    confirmLeave:   'Are you sure you want to leave the room?',
    leaveYes:       'Yes, leave',
    leaveNo:        'Cancel',
  },
  de: {
    name: '🇩🇪 DE',
    gameTitle:      '2 WAHRHEITEN 1 LÜGE',
    subtitle:       'Partyspiel · 3-20 Spieler',
    createRoom:     'Raum erstellen',   joinRoom:      'Raum beitreten',
    yourName:       'Dein Name',        joinName:      'Dein Name',
    roomCode:       'Raumcode',         createBtn:     'Raum erstellen',
    joinBtn:        'Beitreten',        settings:      'Einstellungen',
    langTitle:      'Sprache',          playersTitle:  'Spieler',
    startBtn:       '🎮 Spiel starten', leaveRoom:     '🚪 Raum verlassen',
    shareCode:      'Teile diesen Code mit Freunden',
    copyCode:       'Code kopieren',    shareRoom:     'Raum teilen',
    homeRejoinTip:  'Falls du das Spiel verlässt, tritt mit demselben Namen und Code wieder bei.',
    rejoinTip:      'Falls du das Spiel verlässt, tritt mit demselben Namen und Code wieder bei.',
    createDisclaimer: 'Erstelle einen öffentlichen oder privaten Raum. Lade Freunde ein — du erhältst einen Code zum Teilen.',
    waitingForHost: 'Warte auf den Host...',
    needPlayers:    'Mindestens 3 Spieler erforderlich',
    howToPlay:      'Spielregeln',
    rule1:          'Erstelle einen Raum — 3 bis 20 Spieler',
    rule2:          'Jede Runde schreibt ein Spieler 3 Aussagen über sich',
    rule3:          '2 sind wahr, 1 ist eine Lüge — du entscheidest welche!',
    rule4:          'Alle stimmen ab, welche Aussage die Lüge ist',
    rule5:          'Richtig geraten = 1 Pkt · Jede getäuschte Person = 1 Pkt für dich',
    yourTurnWrite:  '✍️ DU BIST DRAN — schreibe deine Aussagen!',
    theirTurnWrite: (n) => `✍️ ${n} schreibt ihre Aussagen...`,
    writingInstruction: 'Schreibe 3 Aussagen über dich. Zwei müssen wahr sein, eine muss gelogen sein.',
    statement1:     'Aussage 1',
    statement2:     'Aussage 2',
    statement3:     'Aussage 3',
    chooseLie:      'Welche Aussage ist die Lüge?',
    lieIs1:         'Lüge ist: Aussage 1',
    lieIs2:         'Lüge ist: Aussage 2',
    lieIs3:         'Lüge ist: Aussage 3',
    submitBtn:      '✓ Abschicken!',
    votingInstruction: 'Welche Aussage ist die Lüge? Tippe zum Abstimmen.',
    waitingInstruction: 'Warte bis alle abgestimmt haben...',
    youVoted:       'Abstimmung eingereicht!',
    revealBtn:      '👁 Aufdecken',
    revealTitle:    (n) => `🎭 ${n}s Lüge war:`,
    lieWas:         'Das war die LÜGE! 🎭',
    truthWas:       'Das war wahr ✓',
    correct:        '✅ Richtig geraten! +1',
    wrong:          '❌ Falsch geraten',
    fooled:         (n) => `🎭 Du hast ${n} ${n === 1 ? 'Person' : 'Personen'} getäuscht! +${n}`,
    roundScore:     'Diese Runde:',
    nextPlayer:     'Nächster Spieler →',
    finalRound:     '🏆 Endstand anzeigen',
    waitingNext:    'Warte auf den Host...',
    roundOf:        (n, t) => `Runde ${n} von ${t}`,
    gameOver:       'Spiel vorbei!',
    winner:         (n) => `🏆 ${n} gewinnt!`,
    draw:           'Unentschieden! 🤝',
    pts:            'Pkt',
    playAgain:      '🔄 Nochmal mit dieser Gruppe',
    goHome:         '🏠 Startseite',
    hostBadge:      'HOST',
    youBadge:       'DU',
    leaveTitle:     'Spiel verlassen?',
    leaveMsg:       'Ein Spiel läuft. Bist du sicher?',
    confirmLeave:   'Möchtest du den Raum wirklich verlassen?',
    leaveYes:       'Ja, verlassen',
    leaveNo:        'Abbrechen',
    navHome:        'Startseite',
    navAllGames:    'Alle Spiele',
  },
  sv: {
    name: '🇸🇪 SV',
    gameTitle:      '2 SANNINGAR 1 LÖGN',
    subtitle:       'Sällskapsspel · 3-20 spelare',
    createRoom:     'Skapa rum',        joinRoom:      'Gå med i rum',
    yourName:       'Ditt namn',        joinName:      'Ditt namn',
    roomCode:       'Rumskod',          createBtn:     'Skapa rum',
    joinBtn:        'Gå med',           settings:      'Inställningar',
    langTitle:      'Språk',            playersTitle:  'Spelare',
    startBtn:       '🎮 Starta spelet', leaveRoom:     '🚪 Lämna rummet',
    shareCode:      'Dela den här koden med vänner',
    copyCode:       'Kopiera kod',      shareRoom:     'Dela rum',
    homeRejoinTip:  'Om du lämnar spelet av misstag, gå tillbaka med samma namn och rumskod.',
    rejoinTip:      'Om du lämnar spelet av misstag, gå tillbaka med samma namn och rumskod.',
    createDisclaimer: 'Skapa ett offentligt eller privat rum. Bjud in vänner — du får en kod att dela.',
    waitingForHost: 'Väntar på värden...',
    needPlayers:    'Minst 3 spelare krävs',
    howToPlay:      'Spelregler',
    rule1:          'Skapa ett rum — 3 till 20 spelare',
    rule2:          'Varje runda skriver en spelare 3 påståenden om sig själv',
    rule3:          '2 är sanna, 1 är en lögn — du väljer vilken!',
    rule4:          'Alla röstar om vilket påstående som är lögnen',
    rule5:          'Rätt gissning = 1 poäng · Varje person du lurar = 1 poäng för dig',
    yourTurnWrite:  '✍️ DIN TUR — skriv dina påståenden!',
    theirTurnWrite: (n) => `✍️ ${n} skriver sina påståenden...`,
    writingInstruction: 'Skriv 3 påståenden om dig själv. Två måste vara sanna, ett måste vara en lögn.',
    statement1:     'Påstående 1',
    statement2:     'Påstående 2',
    statement3:     'Påstående 3',
    chooseLie:      'Vilket påstående är lögnen?',
    lieIs1:         'Lögnen är: Påstående 1',
    lieIs2:         'Lögnen är: Påstående 2',
    lieIs3:         'Lögnen är: Påstående 3',
    submitBtn:      '✓ Skicka in!',
    votingInstruction: 'Vilket påstående är lögnen? Tryck för att rösta.',
    waitingInstruction: 'Väntar på att alla röstar...',
    youVoted:       'Röst inlämnad!',
    revealBtn:      '👁 Avslöja',
    revealTitle:    (n) => `🎭 ${n}s lögn var:`,
    lieWas:         'Det här var LÖGNEN! 🎭',
    truthWas:       'Det här var sant ✓',
    correct:        '✅ Rätt gissat! +1',
    wrong:          '❌ Fel gissning',
    fooled:         (n) => `🎭 Du lurade ${n} ${n === 1 ? 'person' : 'personer'}! +${n}`,
    roundScore:     'Denna runda:',
    nextPlayer:     'Nästa spelare →',
    finalRound:     '🏆 Visa slutresultat',
    waitingNext:    'Väntar på värden...',
    roundOf:        (n, t) => `Runda ${n} av ${t}`,
    gameOver:       'Spelet är slut!',
    winner:         (n) => `🏆 ${n} vinner!`,
    draw:           'Oavgjort! 🤝',
    pts:            'poäng',
    playAgain:      '🔄 Spela igen med samma grupp',
    goHome:         '🏠 Hem',
    hostBadge:      'VÄRD',
    youBadge:       'DU',
    leaveTitle:     'Lämna spelet?',
    leaveMsg:       'Ett spel pågår. Är du säker?',
    confirmLeave:   'Är du säker på att du vill lämna rummet?',
    leaveYes:       'Ja, lämna',
    leaveNo:        'Avbryt',
    navHome:        'Startsida',
    navAllGames:    'Alla spel',
  },
};
let L = LANGS[lang];

// ─── SOCKET EVENTS ───────────────────────────────────────────────
socket.on('connect', () => {
  const prevId = myId;
  myId = socket.id;
  clearInterval(keepAliveInterval);
  keepAliveInterval = setInterval(() => {
    if (roomCode) socket.emit('tt_keep_alive');
  }, 20000);
  if (prevId && prevId !== socket.id) {
    const sc = sessionStorage.getItem('tt_code');
    const sn = sessionStorage.getItem('tt_name');
    if (sc && sn) { myName = sn; socket.emit('tt_rejoin', { code: sc, name: sn }); }
  }
});

socket.on('tt_room_created', ({ code }) => {
  _settingsInitTT = false;
  var rt=document.getElementById('rejoin-tip'); if(rt) rt.style.display='block';
  _ga('room_created', { game:'two_truths', language:lang });
  roomCode = code; roomState = null; myVote = null; myLieIdx = null;
  sessionStorage.setItem('tt_code', code);
  sessionStorage.setItem('tt_name', myName);
  document.getElementById('room-code-display').textContent = code;
  showScreen('screen-lobby');
});

socket.on('tt_room_joined', ({ code }) => {
  _settingsInitTT = false;
  var rt=document.getElementById('rejoin-tip'); if(rt) rt.style.display='block';
  _ga('room_joined', { game:'two_truths', language:lang });
  roomCode = code; roomState = null; myVote = null; myLieIdx = null;
  sessionStorage.setItem('tt_code', code);
  sessionStorage.setItem('tt_name', myName);
  document.getElementById('room-code-display').textContent = code;
  showScreen('screen-lobby');
});

socket.on('tt_error',      ({ msg })  => { showError(msg); });
socket.on('tt_state',      (data)     => { roomState = data; applyState(data); });
socket.on('tt_vote_count', ({ count, hasVoted }) => { renderVotePips(count, hasVoted); });

// ─── STATE HANDLER ───────────────────────────────────────────────
function applyState(data) {
  // Reset per-round client state on new writing phase
  if (data.phase === 'writing') { myVote = null; }
  switch (data.phase) {
    case 'lobby':   showScreen('screen-lobby');   renderLobby(data);   break;
    case 'writing': showScreen('screen-writing'); renderWriting(data); break;
    case 'voting':  showScreen('screen-voting');  renderVoting(data);  break;
    case 'reveal':  showScreen('screen-reveal');  renderReveal(data);  break;
    case 'final':   showScreen('screen-final');   renderFinal(data);   _ga('game_completed',{game:'two_truths',language:lang}); window._gaGameStarted=false; break;
  }
}

// ─── LOBBY ───────────────────────────────────────────────────────
function renderLobby(data) {
  const { players, settings, hostId } = data;
  const isHost    = myId === hostId;
  // Show all players - connected and temporarily disconnected
  const connected = players.filter(p => p.connected !== false);
  const allPlayers = players; // use all for display, grey out disconnected
  // Sync visibility toggle
  const togWrap = document.getElementById('visibility-toggle');
  if (togWrap) togWrap.style.pointerEvents = isHost ? 'auto' : 'none';
  if (togWrap) togWrap.style.opacity = isHost ? '1' : '0.4';
  // Only sync visibility on first load — host owns it after that
  // Don't call setVisibility() here as it triggers updateSettings()
  if (!_settingsInitTT && settings && settings.isPublic !== undefined) {
    _isPublic = !!settings.isPublic;
    var _vPriv = document.getElementById('vis-private');
    var _vPub  = document.getElementById('vis-public');
    if (_vPriv) _vPriv.classList.toggle('active', !_isPublic);
    if (_vPub)  _vPub.classList.toggle('active',   _isPublic);
  }

  const el = document.getElementById('lobby-players');
  el.innerHTML = '';
  allPlayers.forEach((p, i) => {
    var isConnected = p.connected !== false;
    el.innerHTML +=
      '<div class="lobby-player" style="' + (!isConnected ? 'opacity:0.4;' : '') + '">' +
        '<div class="avatar av-' + (i % 8) + '">' + p.name.charAt(0).toUpperCase() + '</div>' +
        '<span class="pname">' + p.name +
          (p.id === myId   ? ' <span style="font-size:11px;background:rgba(6,214,160,0.15);border:1px solid rgba(6,214,160,0.4);color:var(--green);border-radius:20px;padding:2px 8px;">' + L.youBadge + '</span>' : '') +
          (p.id === hostId ? ' <span class="host-badge">' + L.hostBadge + '</span>' : '') +
          (!isConnected ? ' <span class="offline-badge">' + (L.offlineBadge || 'offline') + '</span>' : '') +
        '</span>' +
      '</div>';
  });

  const warn = document.getElementById('player-warning');
  if (warn) {
    warn.style.display = connected.length < 3 ? 'block' : 'none';
    warn.textContent = L.needPlayers || 'Need at least 3 players to start';
  }
  // Enable/disable start button based on connected count
  var startBtn = document.getElementById('lbl-start-btn');
  if (startBtn && isHost) {
    startBtn.disabled = connected.length < 3;
    startBtn.style.opacity = connected.length < 3 ? '0.5' : '1';
  }

  // Lang pills
  const pillsEl = document.getElementById('lobby-lang-pills');
  if (pillsEl) {
    pillsEl.innerHTML = '';
    Object.keys(LANGS).forEach(code => {
      pillsEl.innerHTML += '<div class="lang-pill' + (code === settings.lang ? ' active' : '') + '"' +
        (isHost ? ' onclick="setGameLang(\'' + code + '\')"' : '') + '>' + LANGS[code].name + '</div>';
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

// ─── WRITING PHASE ───────────────────────────────────────────────
function renderWriting(data) {
  const { activeId, players } = data;
  const isActive = myId === activeId;
  const activeName = (players.find(p => p.id === activeId) || {}).name || '?';

  const banner = document.getElementById('writing-banner');
  banner.textContent = isActive ? L.yourTurnWrite : L.theirTurnWrite(activeName);

  const area = document.getElementById('writing-area');
  if (isActive) {
    area.innerHTML =
      '<p style="color:var(--muted);font-size:13px;font-weight:700;margin-bottom:16px;">' + L.writingInstruction + '</p>' +
      [0,1,2].map(i =>
        '<label class="field-label">' + [L.statement1, L.statement2, L.statement3][i] + '</label>' +
        '<input type="text" class="tt-writing-input' + (myLieIdx === i ? ' lie-input' : '') + '" id="stmt-' + i + '" ' +
          'placeholder="..." maxlength="120" oninput="updateLieHighlight()"/>'
      ).join('') +
      '<p style="color:var(--muted);font-size:13px;font-weight:700;margin:12px 0 6px;">' + L.chooseLie + '</p>' +
      '<div class="tt-lie-selector">' +
        [0,1,2].map(i =>
          '<button class="tt-lie-btn' + (myLieIdx === i ? ' selected' : '') + '" onclick="selectLie(' + i + ')">' +
            [L.lieIs1, L.lieIs2, L.lieIs3][i] +
          '</button>'
        ).join('') +
      '</div>' +
      '<div class="btn-row"><button class="btn" onclick="submitStatements()" id="lbl-submit-btn">' + L.submitBtn + '</button></div>';
  } else {
    area.innerHTML =
      '<div style="text-align:center;padding:40px 0;">' +
        '<div style="font-size:52px;margin-bottom:12px;">✍️</div>' +
        '<p style="color:var(--muted);font-size:16px;font-weight:700;">' + L.theirTurnWrite(activeName) + '</p>' +
      '</div>' +
      renderMiniScoreboard(data);
  }
}

function updateLieHighlight() {
  if (myLieIdx === null) return;
  [0,1,2].forEach(i => {
    const el = document.getElementById('stmt-' + i);
    if (el) el.className = 'tt-writing-input' + (myLieIdx === i ? ' lie-input' : '');
  });
}

function selectLie(i) {
  myLieIdx = i;
  // Re-render lie selector buttons
  document.querySelectorAll('.tt-lie-btn').forEach((btn, idx) => {
    btn.className = 'tt-lie-btn' + (idx === i ? ' selected' : '');
  });
  updateLieHighlight();
}

function submitStatements() {
  const stmts = [0,1,2].map(i => {
    const el = document.getElementById('stmt-' + i);
    return el ? el.value.trim() : '';
  });
  if (stmts.some(s => !s)) { showToast(lang === 'pl' ? 'Wypełnij wszystkie 3 zdania!' : 'Fill in all 3 statements!'); return; }
  if (myLieIdx === null) { showToast(lang === 'pl' ? 'Wybierz które zdanie to kłamstwo!' : 'Choose which statement is the lie!'); return; }
  socket.emit('tt_submit', { code: roomCode, statements: stmts, lieIndex: myLieIdx });
}

// ─── VOTING PHASE ────────────────────────────────────────────────
function renderVoting(data) {
  const { activeId, statements, players, hasVoted, hostId } = data;
  const activeName = (players.find(p => p.id === activeId) || {}).name || '?';
  const isActive   = myId === activeId;
  const isHost     = myId === hostId;
  const connected  = players.filter(p => p.connected !== false);

  document.getElementById('voting-banner').textContent = L.theirTurnWrite(activeName);

  const instrEl = document.getElementById('voting-instruction');
  if (isActive) {
    instrEl.textContent = L.waitingInstruction;
  } else if (myVote !== null) {
    instrEl.textContent = L.youVoted;
  } else {
    instrEl.textContent = L.votingInstruction;
  }

  // Statement cards
  const stmtsEl = document.getElementById('voting-statements');
  stmtsEl.innerHTML = '';
  if (statements) {
    statements.forEach((s, i) => {
      const card = document.createElement('div');
      card.className = 'tt-statement-card' + (!isActive && myVote === i ? ' selected' : '');
      card.innerHTML =
        '<div class="tt-num">' + (i+1) + '</div>' +
        '<div class="tt-statement-text">' + s + '</div>';
      if (!isActive && myVote === null) {
        card.onclick = () => castVote(i);
      }
      stmtsEl.appendChild(card);
    });
  }

  // Vote pips
  const voters = connected.filter(p => p.id !== activeId);
  renderVotePips(hasVoted ? hasVoted.length : 0, hasVoted || [], voters.length);

  // Host reveal button
  const revealWrap = document.getElementById('host-reveal-wrap');
  revealWrap.style.display = isHost ? 'block' : 'none';
}

function renderVotePips(count, hasVoted, total) {
  const el = document.getElementById('voting-pips');
  if (!el || !roomState) return;
  const connected = roomState.players.filter(p => p.connected !== false);
  const active    = roomState.activeId;
  const voters    = connected.filter(p => p.id !== active);
  const tot       = total !== undefined ? total : voters.length;
  el.innerHTML = '';
  for (let i = 0; i < tot; i++) {
    const pip = document.createElement('div');
    pip.className = 'tt-vote-pip' + (i < count ? ' done' : '');
    el.appendChild(pip);
  }
}

function castVote(idx) {
  myVote = idx;
  socket.emit('tt_vote', { code: roomCode, voteIndex: idx });
  // Update UI immediately
  document.querySelectorAll('#voting-statements .tt-statement-card').forEach((c, i) => {
    c.className = 'tt-statement-card' + (i === idx ? ' selected' : '');
    c.onclick = null; // prevent re-voting
  });
  const instrEl = document.getElementById('voting-instruction');
  if (instrEl) instrEl.textContent = L.youVoted;
}

// ─── REVEAL PHASE ────────────────────────────────────────────────
function renderReveal(data) {
  const { activeId, statements, lieIndex, votes, players, roundScores, totalScores, roundsPlayed, totalRounds, hostId } = data;
  const activeName = (players.find(p => p.id === activeId) || {}).name || '?';
  const isHost     = myId === hostId;
  const isActive   = myId === activeId;
  const connected  = players.filter(p => p.connected !== false);

  document.getElementById('reveal-banner').textContent = L.revealTitle(activeName);

  // Statement cards with reveal styling
  const stmtsEl = document.getElementById('reveal-statements');
  stmtsEl.innerHTML = '';
  if (statements) {
    statements.forEach((s, i) => {
      const isLie   = i === lieIndex;
      const myGuess = myVote === i;
      let cls = 'tt-statement-card';
      if (isLie) cls += ' lie-revealed';
      else if (myGuess) cls += ' wrong';
      const card = document.createElement('div');
      card.className = cls;
      card.innerHTML =
        '<div class="tt-num">' + (i+1) + '</div>' +
        '<div>' +
          '<div class="tt-statement-text">' + s + '</div>' +
          '<div class="tt-label" style="margin-top:6px;color:' + (isLie ? 'var(--accent2)' : 'var(--green)') + '">' +
            (isLie ? L.lieWas : L.truthWas) +
          '</div>' +
          // Show who voted for this
          '<div style="margin-top:4px;font-size:12px;color:var(--muted);">' +
            connected
              .filter(p => votes[p.id] === i && p.id !== activeId)
              .map(p => p.name).join(', ') +
          '</div>' +
        '</div>';
      stmtsEl.appendChild(card);
    });
  }

  // Round scores
  const scoresEl = document.getElementById('reveal-scores');
  const header   = document.createElement('p');
  header.style.cssText = 'font-weight:800;font-size:13px;text-transform:uppercase;letter-spacing:1px;color:var(--muted);margin-bottom:10px;';
  header.textContent = L.roundScore;
  scoresEl.innerHTML = '';
  scoresEl.appendChild(header);

  connected.forEach(p => {
    const pts   = roundScores[p.id] || 0;
    const total = totalScores[p.id] || 0;
    let msg;
    if (p.id === activeId) {
      msg = pts > 0 ? L.fooled(pts) : '';
    } else {
      msg = pts > 0 ? L.correct : L.wrong;
    }
    const row = document.createElement('div');
    row.className = 'tt-score-row';
    row.innerHTML =
      '<span style="font-weight:800">' + p.name + (p.id === myId ? ' (' + L.youBadge + ')' : '') + '</span>' +
      '<span>' +
        '<span style="font-size:12px;color:var(--muted);margin-right:6px;">' + (msg || '') + '</span>' +
        '<span class="tt-score-pts">+' + pts + '</span>' +
        '<span style="font-size:12px;color:var(--muted);margin-left:4px;">(' + total + ' ' + L.pts + ')</span>' +
      '</span>';
    scoresEl.appendChild(row);
  });

  // Next / waiting
  const nextBtn   = document.getElementById('lbl-next-btn');
  const waitingEl = document.getElementById('reveal-waiting');
  if (isHost) {
    nextBtn.style.display   = 'inline-flex';
    nextBtn.textContent     = roundsPlayed >= totalRounds - 1 ? L.finalRound : L.nextPlayer;
    waitingEl.style.display = 'none';
  } else {
    nextBtn.style.display   = 'none';
    waitingEl.style.display = 'block';
    waitingEl.textContent   = L.waitingNext;
  }
}

// ─── FINAL ───────────────────────────────────────────────────────
function renderFinal(data) {
  const { players, totalScores } = data;
  const sorted   = [...players].sort((a, b) => (totalScores[b.id] || 0) - (totalScores[a.id] || 0));
  const maxScore = sorted[0] ? (totalScores[sorted[0].id] || 0) : 0;
  const winners  = sorted.filter(p => (totalScores[p.id] || 0) === maxScore);
  const isDraw   = winners.length > 1;

  document.getElementById('lbl-game-over').textContent = L.gameOver;

  const heading = isDraw ? L.draw : L.winner(winners[0].name);
  const el      = document.getElementById('final-results');
  el.innerHTML  = '<div style="text-align:center;font-size:22px;font-weight:900;color:var(--accent2);margin-bottom:20px;">' + heading + '</div>';

  sorted.forEach((p, i) => {
    const score  = totalScores[p.id] || 0;
    const isWin  = score === maxScore && !isDraw;
    el.innerHTML +=
      '<div class="tt-score-row" style="border:2px solid ' + (isWin ? 'var(--accent2)' : 'var(--border)') + ';' + (isWin ? 'background:rgba(255,209,102,0.06)' : '') + '">' +
        '<span style="font-weight:800;font-size:15px;">' +
          (i===0?'🥇':i===1?'🥈':i===2?'🥉':(i+1)+'.') + ' ' +
          p.name + (p.id === myId ? ' (' + L.youBadge + ')' : '') +
        '</span>' +
        '<span class="tt-score-pts">' + score + ' <span style="font-size:14px;font-family:Nunito">' + L.pts + '</span></span>' +
      '</div>';
  });

  document.getElementById('lbl-go-home').textContent = L.goHome;
}

// ─── MINI SCOREBOARD (shown during writing phase for non-active) ──
function renderMiniScoreboard(data) {
  const { players, totalScores } = data;
  const sorted = [...players.filter(p => p.connected !== false)]
    .sort((a, b) => (totalScores[b.id] || 0) - (totalScores[a.id] || 0));
  return '<div style="margin-top:24px;">' +
    sorted.map(p =>
      '<div class="tt-player-row">' +
        '<span style="flex:1">' + p.name + (p.id === myId ? ' (' + L.youBadge + ')' : '') + '</span>' +
        '<span class="tt-score-pts" style="font-size:22px">' + (totalScores[p.id] || 0) + '</span>' +
      '</div>'
    ).join('') +
  '</div>';
}

// ─── ACTIONS ─────────────────────────────────────────────────────
function forceReveal() { socket.emit('tt_reveal', { code: roomCode }); }
function nextRound()   { socket.emit('tt_next',   { code: roomCode }); }

function createRoom() {
  const name = document.getElementById('host-name').value.trim();
  if (!name) { showError(lang === 'pl' ? 'Wpisz swoje imię!' : 'Enter your name!'); return; }
  myName = name;
  socket.emit('tt_create', { name, settings: { lang, isPublic: getIsPublic() } });
}

function joinRoom() {
  const name = document.getElementById('join-name').value.trim();
  const code = document.getElementById('join-code').value.trim().toUpperCase();
  if (!name) { showError(lang === 'pl' ? 'Wpisz swoje imię!' : 'Enter your name!'); return; }
  if (!code || code.length < 5) { showError(lang === 'pl' ? 'Wpisz kod pokoju!' : 'Enter the room code!'); return; }
  myName = name;
  socket.emit('tt_join', { name, code });
}

function startGame() { socket.emit('tt_start', { code: roomCode }); }

function setGameLang(code) {
  lang = code; L = LANGS[code] || LANGS['en'];
  applyTranslations();
  socket.emit('tt_update_settings', { code: roomCode, settings: { lang: code, isPublic: getIsPublic() } });
}

function copyRoomCode() { shareRoom('twotruth'); }

function playAgainGroup() {
  socket.emit('tt_create', { name: myName, settings: { lang, isPublic: getIsPublic(), keepGroup: true }});
}

socket.on('tt_group_rematch', ({ code }) => {
  roomCode = code;
  sessionStorage.setItem('tt_code', code);
  sessionStorage.setItem('tt_name', myName);
  socket.emit('tt_join', { name: myName, code: code });
  showToast(lang === 'pl'
    ? '🔄 Host zaczął nową grę — dołączasz automatycznie!'
    : '🔄 Host started a new game — joining automatically!', 5000);
});

function goHome() {
  roomCode = ''; roomState = null; myName = ''; myVote = null; myLieIdx = null;
  sessionStorage.removeItem('tt_code');
  sessionStorage.removeItem('tt_name');
  showScreen('screen-home');
}

function doGoHome() { closeConfirm(); goHome(); }

// ─── LANG ────────────────────────────────────────────────────────
function setUiLang(code) {
  lang = code; L = LANGS[code] || LANGS['en'];
  document.querySelectorAll('.lang-btn').forEach(b =>
    b.classList.toggle('active', b.textContent === LANGS[code].name));
  applyTranslations();
  history.replaceState(null, '', window.location.pathname + '?lang=' + code);
  window.lang = lang;
  if (typeof window._rebuildBurger === 'function') window._rebuildBurger(code);
  if (typeof window._refreshFooter  === 'function') window._refreshFooter();
}

function applyTranslations() {
  const map = {
    'game-title':       'gameTitle',   'game-subtitle':    'subtitle',
    'lbl-create-room':  'createRoom',  'lbl-create-disclaimer': 'createDisclaimer',  'lbl-join-room':    'joinRoom',
    'lbl-your-name':    'yourName',    'lbl-join-name':    'joinName',
    'lbl-room-code':    'roomCode',    'lbl-create-btn':   'createBtn',
    'lbl-join-btn':     'joinBtn',     'lbl-settings':     'settings',
    'lbl-lang-title':   'langTitle',   'lbl-players-title':'playersTitle',
    'lbl-start-btn':    'startBtn',    'lbl-leave-room':   'leaveRoom',
    'lbl-share-code':   'shareCode',   'lbl-copy-code':    'copyCode',
    'lbl-share-room':   'shareRoom',   'lbl-how-to-play':  'howToPlay',
    'lbl-nav-home':         'navHome',
    'lbl-nav-all-games':    'navAllGames',
    'lbl-home-rejoin-tip': 'homeRejoinTip',
    'lbl-rejoin-tip': 'rejoinTip',
    'lbl-rule-1':       'rule1',       'lbl-rule-2':       'rule2',
    'lbl-rule-3':       'rule3',       'lbl-rule-4':       'rule4',
    'lbl-lobby-how-to-play':'howToPlay',
    'lbl-lobby-rule-1':'rule1',
    'lbl-lobby-rule-2':'rule2',
    'lbl-lobby-rule-3':'rule3',
    'lbl-lobby-rule-4':'rule4',
    'lbl-lobby-rule-5':'rule5',
    'lbl-rule-5':       'rule5',       'lbl-game-over':    'gameOver',
    'lbl-go-home':      'goHome',
  };
  for (const [id, key] of Object.entries(map)) {
    const el = document.getElementById(id);
    if (el && L[key] && typeof L[key] === 'string') el.textContent = L[key];
  }

  document.querySelectorAll('.lbl-nav-home-dup').forEach(function(el) { if (L.navHome) el.textContent = L.navHome; });
  document.querySelectorAll('.lbl-nav-all-games-dup').forEach(function(el) { if (L.navAllGames) el.textContent = L.navAllGames; });
}

// ─── INIT ────────────────────────────────────────────────────────
buildLangBar();
applyTranslations();
window.lang = lang;
prefillJoinCode();
initVisibilityToggle();
