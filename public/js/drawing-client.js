
window._gameSlug = 'drawing';

// ── Translations ──────────────────────────────────────────────────
const LANGS = {
  pl: {
    name:'🇵🇱 PL',
    gameTitle:'SZKICUJ I ZGADUJ', gameSubtitle:'Gra rysunkowa · 3-10 graczy',
    createRoom:'Stwórz pokój', joinRoom:'Dołącz do pokoju',
    createDisclaimer:'Stwórz publiczny lub prywatny pokój. Zaproś znajomych — otrzymasz kod pokoju do przekazania innym graczom.',
    joinDisclaimer:'Masz kod od znajomego lub z listy otwartych pokoi? Wpisz go tutaj i graj razem!',
    yourName:'Twoje imię', roomCode:'Kod pokoju',
    visHint:'Prywatny — tylko zaproszeni. Publiczny — widoczny na liście pokoi.',
    visHintPrivate:'🔒 Prywatny — tylko zaproszeni',
    visHintPublic:'🌐 Publiczny — widoczny na liście pokoi',
    wordPlaceholder:'np. słoń, pizza, czarna dziura...',
    guessPlaceholder:'Twoja odpowiedź...',
    noPoints:'🎉 Bez punktów — czysta zabawa i śmiech!',
    createBtn:'🎮 Stwórz pokój', joinBtn:'🚪 Dołącz',
    shareCode:'Udostępnij kod znajomym', copyCode:'📤 Udostępnij pokój',
    playersTitle:'Gracze', settings:'Ustawienia',
    drawTime:'Czas rysowania', writeTime:'Czas pisania / zgadywania',
    startBtn:'▶ Rozpocznij grę', leaveRoom:'🚪 Wyjdź',
    waitingForHost:'Czekam na hosta...', needPlayers:'Potrzeba minimum 3 graczy',
    howToPlay:'Jak grać',
    rule1:'Każdy gracz wpisuje tajne słowo',
    rule2:'Kartki się mieszają — rysujesz słowo które dostałeś',
    rule3:'Kartki mieszają się ponownie — zgadujesz co przedstawia rysunek',
    rule4:'Przemiana rysowania i zgadywania trwa aż wszyscy wezmą udział',
    rule5:'Wielkie ujawnienie — wszyscy widzą jak Twoje słowo ewoluowało!',
    roomVis:'Widoczność pokoju', visPrivate:'Prywatny', visPublic:'Publiczny',
    writeTitle:'✍️ WPISZ SŁOWO',
    writeHint:'Wpisz dowolne słowo lub krótką frazę. Inni będą je rysować!',
    submitWord:'✓ Zatwierdź słowo',
    drawTitle:'🎨 RYSUJ!',
    drawHint:'Narysuj to słowo jak najlepiej potrafisz — bez liter!',
    submitDraw:'✓ Wyślij rysunek',
    guessTitle:'🤔 ZGADNIJ SŁOWO',
    guessHint:'Co widzisz na rysunku? Wpisz swoje najlepsze przypuszczenie!',
    submitGuess:'✓ Zatwierdź odpowiedź',
    waitingOthers:'CZEKAM NA INNYCH', waitingDesc:'Pozostałe osoby jeszcze pracują...',
    erase:'Gumka', clear:'Wyczyść',
    stepWrite:(n,t)=>`Runda ${n}/${t} — Pisanie`,
    stepDraw:(n,t)=>`Runda ${n}/${t} — Rysowanie`,
    stepGuess:(n,t)=>`Runda ${n}/${t} — Zgadywanie`,
    revealTitle:'WIELKIE UJAWNIENIE!', revealDesc:'Zobaczcie jak słowa ewoluowały!',
    endReveal:'🏁 Zakończ grę',
    chainWord:'Oryginalne słowo', chainDraw:'Rysunek', chainGuess:'Zgadywanie',
    chainBy:(name)=>`przez ${name}`,
    gameOver:'KONIEC GRY!', finalDesc:'Sprawdź wszystkie łańcuchy ewolucji!',
    playAgain:'🔄 Zagraj jeszcze raz', goHome:'🏠 Wróć do menu',
    confirmTitle:'Opuścić grę?', confirmMsg:'Gra jest w toku. Na pewno chcesz wyjść?',
    confirmYes:'Wyjdź', confirmNo:'Anuluj',
    navHome:'Strona główna', navAllGames:'Wszystkie gry',
    hostBadge:'HOST', youBadge:'TY',
    rejoinTip:'Jeśli przypadkowo opuścisz, wróć z tym samym imieniem i kodem.',
    waitingAllReveal:'Czekaj na hosta aby przejść do następnego łańcucha...',
  },
  en: {
    name:'🇬🇧 EN',
    gameTitle:'SKETCH & GUESS', gameSubtitle:'Drawing party game · 3-10 players',
    createRoom:'Create Room', joinRoom:'Join Room',
    createDisclaimer:"Create a public or private room. Invite friends — you'll get a room code to share with other players.",
    joinDisclaimer:'Have a code from a friend or from the Live Rooms page? Enter it here and join the game!',
    yourName:'Your name', roomCode:'Room code',
    visHint:'Private — invite only. Public — visible on the rooms list.',
    visHintPrivate:'🔒 Private — invite only',
    visHintPublic:'🌐 Public — visible on the rooms list',
    wordPlaceholder:'e.g. elephant, pizza, black hole...',
    guessPlaceholder:'Your answer...',
    noPoints:'🎉 No points — pure fun and laughs!',
    createBtn:'🎮 Create Room', joinBtn:'🚪 Join',
    shareCode:'Share this code with friends', copyCode:'📤 Share Room',
    playersTitle:'Players', settings:'Settings',
    drawTime:'Drawing time', writeTime:'Writing / guessing time',
    startBtn:'▶ Start Game', leaveRoom:'🚪 Leave',
    waitingForHost:'Waiting for host...', needPlayers:'Need at least 3 players',
    howToPlay:'How to play',
    rule1:'Each player writes a secret word',
    rule2:'Papers shuffle — you draw the word you received',
    rule3:'Papers shuffle again — you guess what the drawing shows',
    rule4:'Drawing and guessing alternate until everyone has taken part',
    rule5:'The big reveal — everyone sees how their word evolved!',
    roomVis:'Room visibility', visPrivate:'Private', visPublic:'Public',
    writeTitle:'✍️ WRITE A WORD',
    writeHint:'Write any word or short phrase. Others will draw it!',
    submitWord:'✓ Submit word',
    drawTitle:'🎨 DRAW IT!',
    drawHint:'Draw this word as best you can — no letters allowed!',
    submitDraw:'✓ Submit drawing',
    guessTitle:'🤔 GUESS THE WORD',
    guessHint:"What do you see in the drawing? Type your best guess!",
    submitGuess:'✓ Submit guess',
    waitingOthers:'WAITING FOR OTHERS', waitingDesc:'Other players are still working...',
    erase:'Eraser', clear:'Clear',
    stepWrite:(n,t)=>`Round ${n}/${t} — Writing`,
    stepDraw:(n,t)=>`Round ${n}/${t} — Drawing`,
    stepGuess:(n,t)=>`Round ${n}/${t} — Guessing`,
    revealTitle:'THE BIG REVEAL!', revealDesc:'See how the words evolved!',
    endReveal:'🏁 End game',
    chainWord:'Original word', chainDraw:'Drawing', chainGuess:'Guess',
    chainBy:(name)=>`by ${name}`,
    gameOver:'GAME OVER!', finalDesc:'Check all the evolution chains!',
    playAgain:'🔄 Play Again', goHome:'🏠 Home',
    confirmTitle:'Leave Game?', confirmMsg:'A game is in progress. Are you sure?',
    confirmYes:'Leave', confirmNo:'Cancel',
    navHome:'Home', navAllGames:'All Games',
    hostBadge:'HOST', youBadge:'YOU',
    rejoinTip:'If you accidentally leave, rejoin with the same name and code.',
    waitingAllReveal:'Wait for the host to move to the next chain...',
  },
  de: {
    name:'🇩🇪 DE',
    gameTitle:'ZEICHNEN & RATEN', gameSubtitle:'Zeichenspiel für Parties · 3-10 Spieler',
    createRoom:'Raum erstellen', joinRoom:'Raum beitreten',
    createDisclaimer:'Erstelle einen öffentlichen oder privaten Raum. Lade Freunde ein — du erhältst einen Code zum Teilen.',
    joinDisclaimer:'Hast du einen Code von einem Freund oder von der Seite mit offenen Räumen? Gib ihn hier ein und spiel mit!',
    yourName:'Dein Name', roomCode:'Raumcode',
    visHint:'Privat — nur Eingeladene. Öffentlich — auf der Raumliste sichtbar.',
    visHintPrivate:'🔒 Privat — nur Eingeladene',
    visHintPublic:'🌐 Öffentlich — auf der Raumliste sichtbar',
    wordPlaceholder:'z.B. Elefant, Pizza, schwarzes Loch...',
    guessPlaceholder:'Deine Antwort...',
    noPoints:'🎉 Keine Punkte — reiner Spaß und Lachen!',
    createBtn:'🎮 Raum erstellen', joinBtn:'🚪 Beitreten',
    shareCode:'Teile diesen Code mit Freunden', copyCode:'📤 Raum teilen',
    playersTitle:'Spieler', settings:'Einstellungen',
    drawTime:'Zeichenzeit', writeTime:'Schreib- / Ratezeit',
    startBtn:'▶ Spiel starten', leaveRoom:'🚪 Verlassen',
    waitingForHost:'Warte auf den Host...', needPlayers:'Mindestens 3 Spieler erforderlich',
    howToPlay:'Spielregeln',
    rule1:'Jeder Spieler schreibt ein geheimes Wort',
    rule2:'Zettel mischen — du zeichnest das Wort das du bekommen hast',
    rule3:'Zettel mischen erneut — du errätst was die Zeichnung zeigt',
    rule4:'Zeichnen und Raten wechseln sich ab bis alle teilgenommen haben',
    rule5:'Die große Enthüllung — alle sehen wie ihr Wort sich entwickelt hat!',
    roomVis:'Raumsichtbarkeit', visPrivate:'Privat', visPublic:'Öffentlich',
    writeTitle:'✍️ WORT EINGEBEN',
    writeHint:'Gib ein beliebiges Wort oder eine kurze Phrase ein. Andere werden es zeichnen!',
    submitWord:'✓ Wort bestätigen',
    drawTitle:'🎨 ZEICHNE ES!',
    drawHint:'Zeichne dieses Wort so gut du kannst — keine Buchstaben erlaubt!',
    submitDraw:'✓ Zeichnung einsenden',
    guessTitle:'🤔 RATE DAS WORT',
    guessHint:'Was siehst du in der Zeichnung? Gib deinen besten Tipp ein!',
    submitGuess:'✓ Antwort bestätigen',
    waitingOthers:'WARTE AUF ANDERE', waitingDesc:'Andere Spieler arbeiten noch...',
    erase:'Radierer', clear:'Löschen',
    stepWrite:(n,t)=>`Runde ${n}/${t} — Schreiben`,
    stepDraw:(n,t)=>`Runde ${n}/${t} — Zeichnen`,
    stepGuess:(n,t)=>`Runde ${n}/${t} — Raten`,
    revealTitle:'DIE GROSSE ENTHÜLLUNG!', revealDesc:'Seht wie die Wörter sich entwickelt haben!',
    endReveal:'🏁 Spiel beenden',
    chainWord:'Ursprüngliches Wort', chainDraw:'Zeichnung', chainGuess:'Raten',
    chainBy:(name)=>`von ${name}`,
    gameOver:'SPIEL VORBEI!', finalDesc:'Schaut euch alle Evolutionsketten an!',
    playAgain:'🔄 Nochmal spielen', goHome:'🏠 Startseite',
    confirmTitle:'Spiel verlassen?', confirmMsg:'Ein Spiel läuft. Bist du sicher?',
    confirmYes:'Verlassen', confirmNo:'Abbrechen',
    navHome:'Startseite', navAllGames:'Alle Spiele',
    hostBadge:'HOST', youBadge:'DU',
    rejoinTip:'Falls du das Spiel verlässt, tritt mit demselben Namen und Code wieder bei.',
    waitingAllReveal:'Warte auf den Host für die nächste Kette...',
  },
  sv: {
    name:'🇸🇪 SV',
    gameTitle:'SKISSA & GISSA', gameSubtitle:'Ritspel · 3-10 spelare',
    createRoom:'Skapa rum', joinRoom:'Gå med i rum',
    createDisclaimer:'Skapa ett offentligt eller privat rum. Bjud in vänner — du får en rumskod att dela.',
    joinDisclaimer:'Har du en kod från en vän eller från sidan med aktiva rum? Skriv in den här och gå med i spelet!',
    yourName:'Ditt namn', roomCode:'Rumskod',
    visHint:'Privat — endast inbjudna. Offentligt — synligt på rumslistan.',
    visHintPrivate:'🔒 Privat — endast inbjudna',
    visHintPublic:'🌐 Offentligt — synligt på rumslistan',
    wordPlaceholder:'t.ex. elefant, pizza, svart hål...',
    guessPlaceholder:'Ditt svar...',
    noPoints:'🎉 Inga poäng — ren kul och skratt!',
    createBtn:'🎮 Skapa rum', joinBtn:'🚪 Gå med',
    shareCode:'Dela koden med vänner', copyCode:'📤 Dela rummet',
    playersTitle:'Spelare', settings:'Inställningar',
    drawTime:'Rittid', writeTime:'Skriv- / gissingstid',
    startBtn:'▶ Starta spelet', leaveRoom:'🚪 Lämna',
    waitingForHost:'Väntar på värden...', needPlayers:'Minst 3 spelare krävs',
    howToPlay:'Spelregler',
    rule1:'Varje spelare skriver ett hemligt ord',
    rule2:'Lappar blandas — du ritar ordet du fick',
    rule3:'Lappar blandas igen — du gissar vad teckningen visar',
    rule4:'Ritning och gissning omväxlas tills alla har deltagit',
    rule5:'Den stora avslöjningen — alla ser hur deras ord utvecklades!',
    roomVis:'Rumssynlighet', visPrivate:'Privat', visPublic:'Offentlig',
    writeTitle:'✍️ SKRIV ETT ORD',
    writeHint:'Skriv valfritt ord eller kort fras. Andra kommer att rita det!',
    submitWord:'✓ Bekräfta ord',
    drawTitle:'🎨 RITA DET!',
    drawHint:'Rita detta ord så bra du kan — inga bokstäver tillåtna!',
    submitDraw:'✓ Skicka teckning',
    guessTitle:'🤔 GISSA ORDET',
    guessHint:'Vad ser du i teckningen? Skriv din bästa gissning!',
    submitGuess:'✓ Bekräfta svar',
    waitingOthers:'VÄNTAR PÅ ANDRA', waitingDesc:'Andra spelare arbetar fortfarande...',
    erase:'Suddgummi', clear:'Rensa',
    stepWrite:(n,t)=>`Runda ${n}/${t} — Skrivning`,
    stepDraw:(n,t)=>`Runda ${n}/${t} — Ritning`,
    stepGuess:(n,t)=>`Runda ${n}/${t} — Gissning`,
    revealTitle:'DEN STORA AVSLÖJNINGEN!', revealDesc:'Se hur orden utvecklades!',
    endReveal:'🏁 Avsluta spel',
    chainWord:'Ursprungligt ord', chainDraw:'Teckning', chainGuess:'Gissning',
    chainBy:(name)=>`av ${name}`,
    gameOver:'SPELET ÄR SLUT!', finalDesc:'Kolla alla evolutionskedjor!',
    playAgain:'🔄 Spela igen', goHome:'🏠 Hem',
    confirmTitle:'Lämna spelet?', confirmMsg:'Ett spel pågår. Är du säker?',
    confirmYes:'Lämna', confirmNo:'Avbryt',
    navHome:'Startsida', navAllGames:'Alla spel',
    hostBadge:'VÄRD', youBadge:'DU',
    rejoinTip:'Om du lämnar av misstag, gå tillbaka med samma namn och rumskod.',
    waitingAllReveal:'Vänta på värden för nästa kedja...',
  },
};

// ── State ─────────────────────────────────────────────────────────
const _urlLang = new URLSearchParams(window.location.search).get('lang');
let lang = (window._forceLang && ['pl','en','de','sv'].includes(window._forceLang))
           ? window._forceLang
           : (['pl','en','de','sv'].includes(_urlLang) ? _urlLang : 'pl');
let L = LANGS[lang];
let myId = null, myName = '', roomCode = '', roomState = null, isHost = false;
let timerInterval = null;
let currentRevealIdx = 0;
let revealChainOrder = [];

// ── Socket ────────────────────────────────────────────────────────
const socket = io({ transports:['websocket','polling'] });

socket.on('connect', () => {
  myId = socket.id;
  window.lang = lang;
  // Try rejoin if we have a saved session
  const sc = sessionStorage.getItem('drawing_code');
  const sn = sessionStorage.getItem('drawing_name');
  if (sc && sn && !roomCode) {
    myName = sn;
    socket.emit('drawing_join', { name: sn, code: sc });
  }
});

socket.on('drawing_created', ({ code }) => {
  roomCode = code; isHost = true;
  sessionStorage.setItem('drawing_code', code);
  sessionStorage.setItem('drawing_name', myName);
  document.getElementById('room-code-display').textContent = code;
  const _lcd = document.getElementById('lobby-code-display'); if (_lcd) _lcd.textContent = code;
  document.getElementById('nav-room-code').textContent = code;
  showScreen('screen-lobby');
});

socket.on('drawing_joined', ({ code, isHost:h }) => {
  roomCode = code; isHost = h;
  sessionStorage.setItem('drawing_code', code);
  sessionStorage.setItem('drawing_name', myName);
  document.getElementById('room-code-display').textContent = code;
  const _lcd = document.getElementById('lobby-code-display'); if (_lcd) _lcd.textContent = code;
  document.getElementById('nav-room-code').textContent = code;
  showScreen('screen-lobby');
});

socket.on('drawing_state', (data) => {
  roomState = data;
  applyState(data);
});

socket.on('drawing_error', ({ msg }) => {
  // Clear stale session if room not found
  if (msg.includes('not found') || msg.includes('expired')) {
    sessionStorage.removeItem('drawing_code');
    sessionStorage.removeItem('drawing_name');
    roomCode = ''; roomState = null;
    showScreen('screen-home');
  }
  showError(msg, 'join');
});

socket.on('drawing_rematch', ({ code }) => {
  roomCode = code;
  sessionStorage.setItem('drawing_code', code);
  sessionStorage.setItem('drawing_name', myName);
  socket.emit('drawing_join', { name: myName, code: code });
  showToast(L.rematchJoining || '🔄 Host started a new game — joining automatically!', 4000);
});

// Rejoin handled in connect handler above

// ── State handler ─────────────────────────────────────────────────
let _currentScreen = null;

function applyState(data) {
  isHost = myId === data.hostId;
  const screenMap = {
    lobby:   'screen-lobby',
    playing: 'screen-playing',
    reveal:  'screen-reveal',
    final:   'screen-final',
  };
  const targetScreen = screenMap[data.phase];
  if (!targetScreen) return;
  const screenChanged = _currentScreen !== targetScreen;
  if (screenChanged) {
    _currentScreen = targetScreen;
    showScreen(targetScreen);
    _currentTask = null;
    _currentStep = -1;
  }
  switch (data.phase) {
    case 'lobby':   renderLobby(data);   break;
    case 'playing': renderPlaying(data); break;
    case 'reveal':  renderReveal(data);  break;
    case 'final':   renderFinal(data);   break;
  }
}

// ── Lobby ─────────────────────────────────────────────────────────
function renderLobby(data) {
  const { players, hostId } = data;
  const connected = players.filter(p => p.connected !== false);
  const el = document.getElementById('lobby-players');
  const COLORS = ['#ff6b35','#06d6a0','#ffd166','#118ab2','#9b5de5','#f15bb5','#00bbf9','#00f5d4'];

  el.innerHTML = players.map((p,i) => {
    const isMe = p.id === myId;
    const isH  = p.id === hostId;
    const offline = p.connected === false;
    return `<div class="player-row" style="opacity:${offline?'.4':'1'}">
      <div class="player-avatar" style="background:${COLORS[i%8]};color:#000">${p.name.charAt(0).toUpperCase()}</div>
      <span class="player-name">${p.name}</span>
      ${isH  ? `<span class="badge badge-host">${L.hostBadge}</span>` : ''}
      ${isMe ? `<span class="badge badge-you">${L.youBadge}</span>` : ''}
      ${offline ? `<span class="badge badge-offline">offline</span>` : ''}
    </div>`;
  }).join('');

  const warn = document.getElementById('player-warning');
  if (warn) {
    warn.style.display = connected.length < 3 ? 'block' : 'none';
    warn.textContent = L.needPlayers;
  }

  const lobbySettings = document.getElementById('lobby-settings');
  const btnRow = document.getElementById('lobby-btn-row');
  const waitMsg = document.getElementById('waiting-msg');

  if (isHost) {
    if (lobbySettings) lobbySettings.style.display = 'block';
    if (btnRow) btnRow.style.display = 'flex';
    if (waitMsg) waitMsg.style.display = 'none';
    const startBtn = document.getElementById('lbl-start-btn');
    if (startBtn) startBtn.disabled = connected.length < 3;
  } else {
    if (lobbySettings) lobbySettings.style.display = 'none';
    if (btnRow) btnRow.style.display = 'none';
    if (waitMsg) { waitMsg.style.display = 'block'; waitMsg.textContent = L.waitingForHost; }
  }
}

// ── Playing ───────────────────────────────────────────────────────
// Track what the player is currently doing so we don't re-render unnecessarily
let _currentTask = null;
let _currentStep = -1;

function renderPlaying(data) {
  const { step, totalSteps, myTask, hasSubmitted, submittedCount, totalPlayers,
          wordToDraw, imageToDraw, stepDeadline } = data;

  // Always update timer and submitted count — these are safe
  startTimer(stepDeadline);
  const countEl = document.getElementById('submitted-count');
  if (countEl) countEl.textContent = submittedCount + '/' + totalPlayers;

  // Step label
  const stepEl = document.getElementById('play-step-label');
  if (stepEl) {
    const n = step + 1;
    const t = totalSteps;
    if (myTask === 'word')       stepEl.textContent = L.stepWrite(n,t);
    else if (myTask === 'draw')  stepEl.textContent = L.stepDraw(n,t);
    else                         stepEl.textContent = L.stepGuess(n,t);
  }

  // If player just submitted — show waiting screen
  if (hasSubmitted) {
    if (_currentTask !== 'waiting') {
      _currentTask = 'waiting';
      hideAllTasks();
      document.getElementById('task-waiting').style.display = 'block';
      document.getElementById('lbl-waiting-others').textContent = L.waitingOthers;
      document.getElementById('lbl-waiting-desc').textContent = L.waitingDesc;
    }
    // Just update count, nothing else
    return;
  }

  // If same task and same step — DO NOT re-render, just update count
  if (_currentTask === myTask && _currentStep === step) {
    return;
  }

  // New task or new step — full render
  _currentTask = myTask;
  _currentStep = step;

  hideAllTasks();

  if (myTask === 'word') {
    document.getElementById('task-write-word').style.display = 'block';
    document.getElementById('lbl-write-title').textContent = L.writeTitle;
    document.getElementById('lbl-write-hint').textContent = L.writeHint;
    document.getElementById('lbl-submit-word-btn').textContent = L.submitWord;
    document.getElementById('word-input').value = '';
    document.getElementById('lbl-submit-word-btn').disabled = true;

  } else if (myTask === 'draw') {
    _canvasSnapshot = null;
    const _cv = document.getElementById('drawing-canvas');
    if (_cv) { _cv._drawingReady = false; _cv._drawingStep = step; }
    document.getElementById('task-draw').style.display = 'block';
    document.getElementById('lbl-draw-title').textContent = L.drawTitle;
    document.getElementById('lbl-draw-hint').textContent = L.drawHint;
    document.getElementById('lbl-submit-draw-btn').textContent = L.submitDraw;
    document.getElementById('word-to-draw').textContent = wordToDraw || '???';
    document.getElementById('lbl-erase').textContent = L.erase;
    document.getElementById('lbl-clear').textContent = L.clear;
    initCanvasIfNeeded();

  } else {
    document.getElementById('task-guess').style.display = 'block';
    document.getElementById('lbl-guess-title').textContent = L.guessTitle;
    document.getElementById('lbl-guess-hint').textContent = L.guessHint;
    document.getElementById('lbl-submit-guess-btn').textContent = L.submitGuess;
    document.getElementById('guess-input').value = '';
    document.getElementById('lbl-submit-guess-btn').disabled = true;
    if (imageToDraw) {
      document.getElementById('guess-image').src = imageToDraw;
      document.getElementById('guess-image-wrap').style.display = 'block';
    } else {
      document.getElementById('guess-image-wrap').style.display = 'none';
    }
  }
}

function hideAllTasks() {
  ['task-write-word','task-guess','task-draw','task-waiting'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
}

// ── Timer ─────────────────────────────────────────────────────────
function startTimer(deadline) {
  if (timerInterval) clearInterval(timerInterval);
  const totalMs = deadline - Date.now();
  if (totalMs <= 0) return;
  const totalSec = totalMs / 1000;
  const circumference = 125.6;
  const circle = document.getElementById('timer-circle');
  const progress = document.getElementById('timer-progress');
  const numEl = document.getElementById('timer-num');

  function tick() {
    const remaining = Math.max(0, (deadline - Date.now()) / 1000);
    const pct = remaining / totalSec;
    if (progress) progress.style.strokeDashoffset = circumference * (1 - pct);
    if (numEl) numEl.textContent = Math.ceil(remaining);
    if (circle) circle.classList.toggle('urgent', remaining < 10);
    if (remaining <= 0) {
      clearInterval(timerInterval);
      autoSubmitOnTimeout();
    }
  }
  tick();
  timerInterval = setInterval(tick, 500);
}

// ── Canvas ────────────────────────────────────────────────────────
let canvas, ctx, drawing = false, erasing = false, brushSize = 4, brushColor = '#000000';
const COLORS_PALETTE = ['#000000','#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#8b5cf6','#ec4899','#ffffff','#6b7280'];

function initCanvas() {
  canvas = document.getElementById('drawing-canvas');
  if (!canvas) return;
  // Detach old listeners by cloning
  const fresh = canvas.cloneNode(false);
  canvas.parentNode.replaceChild(fresh, canvas);
  canvas = fresh;

  ctx = canvas.getContext('2d');
  const wrap = document.getElementById('canvas-wrap');
  const w = wrap.clientWidth || 320;
  const h = Math.min(Math.round(w * 0.65), 320);
  canvas.width  = w;
  canvas.height = h;
  canvas.style.height = h + 'px';
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = brushColor;
  ctx.lineWidth   = brushSize;
  ctx.lineCap = ctx.lineJoin = 'round';
  _canvasSnapshot = null;

  // Rebuild color palette
  const palette = document.getElementById('color-palette');
  if (palette) {
    palette.innerHTML = COLORS_PALETTE.map(col =>
      `<div class="color-btn${col===brushColor?' active':''}" style="background:${col};${col==='#ffffff'?'border:2px solid #666;':''}"
       onclick="setColor('${col}',this)"></div>`
    ).join('');
  }

  // Save snapshot after every stroke ends
  function saveAndStop() { stopDraw(); saveCanvasState(); }

  canvas.addEventListener('mousedown', startDraw);
  canvas.addEventListener('mousemove', doDraw);
  canvas.addEventListener('mouseup',   saveAndStop);
  canvas.addEventListener('mouseleave',saveAndStop);
  canvas.addEventListener('touchstart',  (e)=>{ e.preventDefault(); startDraw(e.touches[0]); }, {passive:false});
  canvas.addEventListener('touchmove',   (e)=>{ e.preventDefault(); doDraw(e.touches[0]); },   {passive:false});
  canvas.addEventListener('touchend',    (e)=>{ e.preventDefault(); saveAndStop(); },           {passive:false});
  canvas.addEventListener('touchcancel', (e)=>{ e.preventDefault(); saveAndStop(); },           {passive:false});

  // Restore on visibility change (tab switch)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') restoreCanvasState();
  });
}

// Keep alias so any other calls work
function initCanvasIfNeeded() { initCanvas(); }

let _canvasSnapshot = null;
function saveCanvasState() {
  if (canvas && ctx) {
    _canvasSnapshot = canvas.toDataURL('image/jpeg', 0.7);
  }
}
function restoreCanvasState() {
  if (!canvas || !ctx) return;
  if (!_canvasSnapshot) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return;
  }
  const img = new Image();
  img.onload = () => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  };
  img.src = _canvasSnapshot;
}

function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width  / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top)  * scaleY,
  };
}

function startDraw(e) {
  drawing = true;
  const {x,y} = getPos(e);
  ctx.beginPath();
  ctx.moveTo(x,y);
}

function doDraw(e) {
  if (!drawing) return;
  const {x,y} = getPos(e);
  ctx.globalCompositeOperation = erasing ? 'destination-out' : 'source-over';
  ctx.strokeStyle = erasing ? 'rgba(0,0,0,1)' : brushColor;
  ctx.lineWidth   = erasing ? brushSize * 3 : brushSize;
  ctx.lineTo(x,y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x,y);
}

function stopDraw() { drawing = false; ctx && ctx.beginPath(); }

function autoSubmitOnTimeout() {
  if (!roomState || roomState.phase !== 'playing') return;
  // Don't auto-submit if already submitted
  const submitBtn = document.getElementById('lbl-submit-draw-btn');
  const wordBtn   = document.getElementById('lbl-submit-word-btn');
  const guessBtn  = document.getElementById('lbl-submit-guess-btn');
  const myTask = roomState.myTask;
  if (roomState.hasSubmitted) return;
  if (myTask === 'draw' && canvas && ctx) {
    // Submit whatever is on the canvas
    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
    socket.emit('drawing_submit', { code: roomCode, content: dataUrl });
  } else if (myTask === 'word') {
    const v = document.getElementById('word-input');
    const val = v ? v.value.trim() : '';
    if (val) socket.emit('drawing_submit', { code: roomCode, content: val });
  } else if (myTask === 'guess') {
    const v = document.getElementById('guess-input');
    const val = v ? v.value.trim() : '';
    if (val) socket.emit('drawing_submit', { code: roomCode, content: val });
  }
}

function setColor(col, btn) {
  brushColor = col;
  erasing = false;
  document.querySelectorAll('.color-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('erase-btn').classList.remove('active');
}

function setBrushSize(size, btn) {
  brushSize = size;
  document.querySelectorAll('.size-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
}

function toggleErase() {
  erasing = !erasing;
  document.getElementById('erase-btn').classList.toggle('active', erasing);
}

function clearCanvas() {
  if (!ctx) return;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// ── Submissions ───────────────────────────────────────────────────
function onWriteInput() {
  const v = document.getElementById('word-input').value.trim();
  document.getElementById('lbl-submit-word-btn').disabled = !v;
}

function onGuessInput() {
  const v = document.getElementById('guess-input').value.trim();
  document.getElementById('lbl-submit-guess-btn').disabled = !v;
}

function submitWord() {
  const v = document.getElementById('word-input').value.trim();
  if (!v) return;
  socket.emit('drawing_submit', { code: roomCode, content: v });
}

function submitGuess() {
  const v = document.getElementById('guess-input').value.trim();
  if (!v) return;
  socket.emit('drawing_submit', { code: roomCode, content: v });
}

// Force submit when timer expires on server
socket.on('draw_force_submit', () => {
  submitDrawing();
});

function submitDrawing() {
  if (!canvas) return;
  // Compress to JPEG for smaller payload
  const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
  socket.emit('drawing_submit', { code: roomCode, content: dataUrl });
}

// ── Reveal ────────────────────────────────────────────────────────
function renderReveal(data) {
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }

  document.getElementById('lbl-reveal-title').textContent = L.revealTitle;
  document.getElementById('lbl-reveal-desc').textContent  = L.revealDesc;

  const chains = data.chains || {};
  revealChainOrder = (data.chainOrder || Object.keys(chains)).filter(id => chains[id]);
  currentRevealIdx = 0;

  renderRevealChain(data);

  // Show end game button for host
  const hostBtn = document.getElementById('host-reveal-btn-wrap');
  const endBtn  = document.getElementById('lbl-end-reveal');
  if (hostBtn) hostBtn.style.display = isHost ? 'block' : 'none';
  if (endBtn)  endBtn.textContent = L.endReveal;

  // Navigation — player name buttons (much easier to tap than dots)
  const nav = document.getElementById('reveal-nav');
  if (nav && revealChainOrder.length > 1) {
    nav.innerHTML = revealChainOrder.map((id,i) => {
      const p = (data.players || []).find(pl => pl.id === id);
      const name = p ? p.name : ('Chain ' + (i+1));
      return `<button class="btn${i===0?' btn-primary':' btn-secondary'}" id="dot-${i}"
        onclick="switchRevealChain(${i})"
        style="flex:1;min-width:80px;font-size:13px;padding:8px 10px;">${name}</button>`;
    }).join('');
    nav.style.display = 'flex';
    nav.style.flexWrap = 'wrap';
    nav.style.gap = '8px';
  } else if (nav) {
    nav.innerHTML = '';
    nav.style.display = 'none';
  }
  window._revealData = data;
}

function switchRevealChain(idx) {
  currentRevealIdx = idx;
  renderRevealChain(window._revealData);
  // Update button styles
  document.querySelectorAll('#reveal-nav button').forEach((btn, i) => {
    btn.classList.toggle('btn-primary', i === idx);
    btn.classList.toggle('btn-secondary', i !== idx);
  });
  // Scroll chain content to top
  const wrap = document.getElementById('reveal-chains');
  if (wrap) wrap.scrollTop = 0;
}

function renderRevealChain(data) {
  const chains = data.chains || {};
  const chainId = revealChainOrder[currentRevealIdx];
  const chain = chains[chainId] || [];
  const originPlayer = (data.players || []).find(p => p.id === chainId);
  const wrap = document.getElementById('reveal-chains');
  if (!wrap) return;

  wrap.innerHTML = `<div class="chain-header">🔗 ${originPlayer ? originPlayer.name : '?'}</div>` +
    chain.map(entry => {
      const typeLabel = entry.type === 'word' ? L.chainWord
        : entry.type === 'draw' ? L.chainDraw : L.chainGuess;
      const typeClass = `type-${entry.type}`;
      return `<div class="chain-entry ${typeClass}">
        <div class="chain-type ${typeClass}">${typeLabel}</div>
        <div class="chain-player">${L.chainBy(entry.playerName)}</div>
        ${entry.type === 'draw'
          ? (entry.content ? `<img class="chain-img" src="${entry.content}" alt="drawing"/>` : `<p style="color:var(--muted);font-size:12px;font-weight:700;">⏱ (timp expirat)</p>`)
          : `<div class="chain-word">${entry.content || '???'}</div>`
        }
      </div>`;
    }).join('');
}

function endReveal() {
  socket.emit('drawing_next_reveal', { code: roomCode });
}

// ── Final ─────────────────────────────────────────────────────────
function renderFinal(data) {
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }

  document.getElementById('lbl-game-over').textContent   = L.gameOver;
  document.getElementById('lbl-final-desc').textContent  = L.finalDesc;
  document.getElementById('lbl-play-again').textContent  = L.playAgain;
  document.getElementById('lbl-go-home').textContent     = L.goHome;

  const chains = data.chains || {};
  const grid = document.getElementById('final-chains');
  if (!grid) return;

  grid.innerHTML = (data.chainOrder || Object.keys(chains)).map(chainId => {
    const chain = chains[chainId] || [];
    const originPlayer = (data.players || []).find(p => p.id === chainId);
    const orig = chain[0];
    // Find last guess (text) entry
    const lastGuess = [...chain].reverse().find(e => e.type === 'guess');
    // Find last draw entry
    const lastDraw = [...chain].reverse().find(e => e.type === 'draw');
    return `<div class="final-card">
      <h3>🔗 ${originPlayer ? originPlayer.name : '?'}</h3>
      <div style="font-size:11px;color:var(--muted);font-weight:700;margin-bottom:4px;">${L.chainWord}:</div>
      <div style="font-size:18px;font-weight:900;color:var(--accent);margin-bottom:8px;">${orig ? orig.content : '?'}</div>
      ${lastDraw && lastDraw.content ? `<img class="chain-img" src="${lastDraw.content}" alt="drawing" style="max-width:100%;border-radius:8px;margin-bottom:8px;"/>` : ''}
      ${lastGuess ? `
        <div style="font-size:11px;color:var(--muted);font-weight:700;margin-bottom:4px;">${L.chainGuess}:</div>
        <div style="font-size:16px;font-weight:900;color:var(--accent2);">${lastGuess.content || '?'}</div>
      ` : ''}
    </div>`;
  }).join('');
}

function playAgain() {
  socket.emit('drawing_restart', { code: roomCode });
}

// ── Settings ──────────────────────────────────────────────────────
function updateSettings() {
  const drawTime  = parseInt(document.getElementById('settings-draw-time').value);
  const writeTime = parseInt(document.getElementById('settings-write-time').value);
  socket.emit('drawing_settings', { code: roomCode, settings: { drawTime, writeTime, isPublic: _isPublic } });
}

function setLobbyVisibility(pub) {
  _isPublic = pub;
  document.getElementById('lobby-vis-private').classList.toggle('active', !pub);
  document.getElementById('lobby-vis-public').classList.toggle('active',  pub);
  if (roomCode) updateSettings();
}

// ── UI helpers ────────────────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
  const topNav = document.getElementById('top-nav');
  if (topNav) topNav.style.display = (id !== 'screen-home') ? 'flex' : 'none';
}

function createRoom() {
  const name = document.getElementById('host-name').value.trim();
  if (!name) { showError(L.yourName + '?', 'create'); return; }
  myName = name;
  const _hp = document.getElementById('hp-website');
  if (_hp && _hp.value) return;
  socket.emit('drawing_create', { name, settings: { lang, isPublic: _isPublic } });
}

function joinRoom() {
  const name = document.getElementById('join-name').value.trim();
  const code = document.getElementById('join-code').value.trim().toUpperCase();
  if (!name) { showError(L.yourName + '?', 'join'); return; }
  if (!code || code.length < 5) { showError(L.roomCode + '?', 'join'); return; }
  myName = name;
  socket.emit('drawing_join', { name, code });
}

function startGame() {
  socket.emit('drawing_start', { code: roomCode });
}

function copyRoomCode() {
  // Use shared.js shareRoom — respects SEO slug for current page
  if (typeof shareRoom === 'function') {
    shareRoom('drawing');
  } else {
    const fullUrl = `${location.origin}/drawing?join=${roomCode}&lang=${lang}`;
    navigator.clipboard.writeText(fullUrl).then(() => showToast('🔗 Link skopiowany!'));
  }
}

function confirmGoHome() {
  // No room active - go home silently, don't clear name
  if (!roomCode) return;
  if (roomState && roomState.phase !== 'lobby') {
    document.getElementById('confirm-modal').style.display = 'flex';
    document.getElementById('lbl-confirm-title').textContent = L.confirmTitle;
    document.getElementById('lbl-confirm-msg').textContent   = L.confirmMsg;
    document.getElementById('lbl-confirm-yes').textContent   = L.confirmYes;
    document.getElementById('lbl-confirm-no').textContent    = L.confirmNo;
  } else {
    goHome();
  }
}

function closeConfirm() {
  document.getElementById('confirm-modal').style.display = 'none';
}

function goHome() {
  closeConfirm();
  if (timerInterval) clearInterval(timerInterval);
  roomCode = ''; roomState = null; myName = ''; isHost = false;
  sessionStorage.removeItem('drawing_code');
  sessionStorage.removeItem('drawing_name');
  showScreen('screen-home');
}

function showError(msg, type) {
  const id = type === 'join' ? 'home-error-join' : 'home-error-create';
  const el = document.getElementById(id);
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}

function showToast(msg) {
  let t = document.getElementById('drawing-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'drawing-toast';
    t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:var(--card);border:1px solid var(--border);color:var(--text);padding:10px 20px;border-radius:10px;font-weight:700;font-size:14px;z-index:9999;';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.display = 'block';
  clearTimeout(t._t);
  t._t = setTimeout(() => t.style.display='none', 2500);
}

function setVisibility(pub) {
  _isPublic = pub;
  document.getElementById('vis-private').classList.toggle('active', !pub);
  document.getElementById('vis-public').classList.toggle('active',  pub);
  // Update hint text to reflect active state
  const hintEl = document.getElementById('lbl-vis-hint');
  if (hintEl && L) {
    hintEl.textContent = pub
      ? (L.visHintPublic  || L.visHint || '')
      : (L.visHintPrivate || L.visHint || '');
  }
  if (typeof window._refreshFooter === 'function') window._refreshFooter();
}

// ── Language ──────────────────────────────────────────────────────
function buildLangBar() {
  const bars = ['lang-bar','lang-bar-inline'];
  bars.forEach(barId => {
    const bar = document.getElementById(barId);
    if (!bar) return;
    bar.innerHTML = Object.keys(LANGS).map(code =>
      `<button class="lang-btn${code===lang?' active':''}" onclick="setUiLang('${code}')">${LANGS[code].name}</button>`
    ).join('');
  });
}

function setUiLang(code) {
  lang = code; L = LANGS[code];
  window.lang = lang;
  history.replaceState(null,'', window.location.pathname+'?lang='+code);
  buildLangBar();
  applyTranslations();
  if (typeof window._rebuildBurger === 'function') window._rebuildBurger(code);
  if (typeof window._refreshFooter  === 'function') window._refreshFooter();
}

function applyTranslations() {
  const map = {
    'game-title':           'gameTitle',
    'game-subtitle':        'gameSubtitle',
    'lbl-create-room':      'createRoom',
    'lbl-create-disclaimer':'createDisclaimer',
    'lbl-join-room':        'joinRoom',
    'lbl-join-disclaimer':  'joinDisclaimer',
    'lbl-create-btn':       'createBtn',
    'lbl-join-btn':         'joinBtn',
    'lbl-share-code':       'shareCode',
    'lbl-share-room':       'copyCode',
    'lbl-copy-code':        'copyCode',
    'lbl-players-title':    'playersTitle',
    'lbl-settings':         'settings',
    'lbl-draw-time':        'drawTime',
    'lbl-write-time':       'writeTime',
    'lbl-start-btn':        'startBtn',
    'lbl-leave-room':       'leaveRoom',
    'lbl-how-to-play':      'howToPlay',
    'lbl-rule-1':           'rule1',
    'lbl-rule-2':           'rule2',
    'lbl-rule-3':           'rule3',
    'lbl-rule-4':           'rule4',
    'lbl-rule-5':           'rule5',
    'lbl-room-vis':         'roomVis',
    'lbl-vis-private':      'visPrivate',
    'lbl-vis-public':       'visPublic',
    'lbl-lobby-vis-private':'visPrivate',
    'lbl-lobby-vis-public': 'visPublic',
    'lbl-nav-home':         'navHome',
    'lbl-game-over':        'gameOver',
    'lbl-final-desc':       'finalDesc',
    'lbl-play-again':       'playAgain',
    'lbl-go-home':          'goHome',
    'lbl-vis-hint':         'visHint',
    'lbl-no-points':        'noPoints',
  };
  for (const [id, key] of Object.entries(map)) {
    const el = document.getElementById(id);
    if (el && L[key] && typeof L[key] === 'string') el.textContent = L[key];
  }
  // Set input placeholders dynamically
  const hostNameEl = document.getElementById('host-name');
  if (hostNameEl && L.yourName) hostNameEl.placeholder = L.yourName;
  const joinNameEl = document.getElementById('join-name');
  if (joinNameEl && L.yourName) joinNameEl.placeholder = L.yourName;
  const joinCodeEl = document.getElementById('join-code');
  if (joinCodeEl && L.roomCode) joinCodeEl.placeholder = L.roomCode;
  const wordInputEl = document.getElementById('word-input');
  if (wordInputEl && L.wordPlaceholder) wordInputEl.placeholder = L.wordPlaceholder;
  const guessInputEl = document.getElementById('guess-input');
  if (guessInputEl && L.guessPlaceholder) guessInputEl.placeholder = L.guessPlaceholder;
  // Dup elements
  document.querySelectorAll('.lbl-nav-home-dup').forEach(el => { if (L.navHome) el.textContent = L.navHome; });
}

// ── Prefill join code from URL ────────────────────────────────────
(function() {
  const params = new URLSearchParams(window.location.search);
  const join = params.get('join');
  if (join) {
    const el = document.getElementById('join-code');
    if (el) el.value = join.toUpperCase();
  }
})();

// ── Init ──────────────────────────────────────────────────────────
buildLangBar();
applyTranslations();
window.lang = lang;
