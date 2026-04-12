// ════════════════════════════════════════════════════════
// WHO AM I — Client
// ════════════════════════════════════════════════════════
'use strict';

const socket = io();
const _urlLang = new URLSearchParams(window.location.search).get('lang');
let lang = (window._forceLang && ['pl','en','de','sv'].includes(window._forceLang))
           ? window._forceLang
           : (['pl','en','de','sv'].includes(_urlLang) ? _urlLang : 'pl');

let myId       = null;
let myName     = '';
let roomCode   = '';
let roomState  = null;
let isHost     = false;
let gameMode   = 'voice';
let selCats    = [];
let selDiff    = 'easy';
let _timerInt  = null;
let _votedThisTurn = false;
window._gameSlug = 'who-am-i';


// ── Pre-arranged helper questions per category ───────────────────
const HELPER_QUESTIONS = {
  pl: {
    sports:   ['Czy jestem mężczyzną?','Czy jestem żyjącym sportowcem?','Czy jestem z Europy?','Czy gram w drużynie?','Czy używam piłki?','Czy wygrałem/am mistrzostwo świata?','Czy jestem z XXI wieku?','Czy jestem bokserem/wrestlerem?'],
    music:    ['Czy jestem mężczyzną?','Czy jestem żyjącym artystą?','Czy jestem solistą/ką?','Czy jestem z XX wieku?','Czy grasz/gram muzykę rockową?','Czy wygrałem/am Grammy?','Czy jestem raperem/ką?','Czy jestem z lat 80-tych lub wcześniej?'],
    film:     ['Czy jestem postacią fikcyjną?','Czy jestem bohaterem czy złoczyńcą?','Czy jestem z serialu (nie z filmu)?','Czy jestem animowany/a?','Czy mam nadludzkie moce?','Czy jestem z Marvel lub DC?','Czy jestem z lat 90-tych lub wcześniej?','Czy jestem z komedii?'],
    history:  ['Czy jestem mężczyzną?','Czy żyłem/am przed 1900 rokiem?','Czy jestem przywódcą politycznym?','Czy jestem naukowcem?','Czy jestem z Europy?','Czy jestem artystą/ką?','Czy jestem z XX wieku?','Czy zmieniłem/am bieg historii?'],
    animals:  ['Czy mam 4 nogi?','Czy żyję w wodzie?','Czy jestem drapieżnikiem?','Czy mieszkam w Afryce?','Czy mogę latać?','Czy jestem większy/a od psa?','Czy jestem ssakiem?','Czy jestem na liście zagrożonych gatunków?','Czy żyję w stadzie?','Czy jestem nocnym zwierzęciem?'],
    cartoons: ['Czy jestem postacią z bajki dla dzieci?','Czy jestem zwierzęciem?','Czy jestem z Disneya?','Czy jestem superbohaterem?','Czy jestem z gry komputerowej?','Czy jestem nadal produkowany/a?','Czy jestem z lat 90-tych lub wcześniej?','Czy jestem ludzką postacią?'],
    mixed:    ['Czy jestem prawdziwą osobą?','Czy żyję/żyłem nadal?','Czy jestem mężczyzną?','Czy jestem ze świata rozrywki?','Czy jestem ze sportu?','Czy jestem postacią fikcyjną?','Czy jestem znany/a na całym świecie?','Czy jestem z XX wieku lub później?'],
  },
  en: {
    sports:   ['Am I male?','Am I still active?','Am I from Europe?','Do I play in a team?','Do I use a ball?','Have I won a world championship?','Am I from the 21st century?','Am I a boxer or wrestler?'],
    music:    ['Am I male?','Am I still alive?','Am I a solo artist?','Am I from the 20th century?','Do I play rock music?','Have I won a Grammy?','Am I a rapper?','Am I from the 80s or earlier?'],
    film:     ['Am I a fictional character?','Am I a hero or villain?','Am I from a TV show (not movie)?','Am I animated?','Do I have superpowers?','Am I from Marvel or DC?','Am I from the 90s or earlier?','Am I from a comedy?'],
    history:  ['Am I male?','Did I live before 1900?','Am I a political leader?','Am I a scientist?','Am I from Europe?','Am I an artist?','Am I from the 20th century?','Did I change the course of history?'],
    animals:  ['Do I have 4 legs?','Do I live in water?','Am I a predator?','Do I live in Africa?','Can I fly?','Am I bigger than a dog?','Am I a mammal?','Am I endangered?','Do I live in groups?','Am I nocturnal?'],
    cartoons: ['Am I from a children\'s cartoon?','Am I an animal?','Am I a Disney character?','Am I a superhero?','Am I from a video game?','Am I still being made?','Am I from the 90s or earlier?','Am I a human character?'],
    mixed:    ['Am I a real person?','Am I still alive?','Am I male?','Am I from entertainment?','Am I a sports person?','Am I fictional?','Am I internationally famous?','Am I from the 20th century or later?'],
  },
  de: {
    sports:   ['Bin ich männlich?','Bin ich noch aktiv?','Komme ich aus Europa?','Spiele ich in einem Team?','Benutze ich einen Ball?','Habe ich eine Weltmeisterschaft gewonnen?','Bin ich aus dem 21. Jahrhundert?','Bin ich Boxer oder Wrestler?'],
    music:    ['Bin ich männlich?','Lebe ich noch?','Bin ich Solist/in?','Komme ich aus dem 20. Jahrhundert?','Spiele ich Rockmusik?','Habe ich einen Grammy gewonnen?','Bin ich Rapper/in?','Bin ich aus den 80ern oder früher?'],
    film:     ['Bin ich eine fiktive Figur?','Bin ich Held oder Bösewicht?','Komme ich aus einer Serie?','Bin ich animiert?','Habe ich Superkräfte?','Komme ich von Marvel oder DC?','Bin ich aus den 90ern oder früher?','Komme ich aus einer Komödie?'],
    history:  ['Bin ich männlich?','Lebte ich vor 1900?','Bin ich ein politischer Führer?','Bin ich Wissenschaftler/in?','Komme ich aus Europa?','Bin ich Künstler/in?','Bin ich aus dem 20. Jahrhundert?','Habe ich den Lauf der Geschichte verändert?'],
    animals:  ['Habe ich 4 Beine?','Lebe ich im Wasser?','Bin ich ein Raubtier?','Lebe ich in Afrika?','Kann ich fliegen?','Bin ich größer als ein Hund?','Bin ich ein Säugetier?','Bin ich vom Aussterben bedroht?','Lebe ich in Gruppen?','Bin ich nachtaktiv?'],
    cartoons: ['Komme ich aus einem Kinderfilm?','Bin ich ein Tier?','Bin ich eine Disney-Figur?','Bin ich ein Superheld?','Komme ich aus einem Videospiel?','Werde ich noch produziert?','Bin ich aus den 90ern oder früher?','Bin ich eine menschliche Figur?'],
    mixed:    ['Bin ich eine echte Person?','Lebe ich noch?','Bin ich männlich?','Komme ich aus der Unterhaltung?','Bin ich Sportler/in?','Bin ich fiktiv?','Bin ich international bekannt?','Bin ich aus dem 20. Jahrhundert oder später?'],
  },
  sv: {
    sports:   ['Är jag man?','Är jag fortfarande aktiv?','Kommer jag från Europa?','Spelar jag i ett lag?','Använder jag en boll?','Har jag vunnit ett VM?','Är jag från 2000-talet?','Är jag boxare eller brottare?'],
    music:    ['Är jag man?','Lever jag fortfarande?','Är jag soloartist?','Är jag från 1900-talet?','Spelar jag rockmusik?','Har jag vunnit en Grammy?','Är jag rappare?','Är jag från 80-talet eller tidigare?'],
    film:     ['Är jag en fiktiv karaktär?','Är jag hjälte eller skurk?','Är jag från en TV-serie?','Är jag animerad?','Har jag superkrafter?','Är jag från Marvel eller DC?','Är jag från 90-talet eller tidigare?','Är jag från en komedi?'],
    history:  ['Är jag man?','Levde jag före 1900?','Är jag en politisk ledare?','Är jag vetenskapsman?','Kommer jag från Europa?','Är jag konstnär?','Är jag från 1900-talet?','Förändrade jag historiens gång?'],
    animals:  ['Har jag 4 ben?','Lever jag i vatten?','Är jag ett rovdjur?','Lever jag i Afrika?','Kan jag flyga?','Är jag större än en hund?','Är jag ett däggdjur?','Är jag utrotningshotad?','Lever jag i flock?','Är jag nattaktiv?'],
    cartoons: ['Är jag från en tecknad barnfilm?','Är jag ett djur?','Är jag en Disney-karaktär?','Är jag en superhjälte?','Är jag från ett videospel?','Produceras jag fortfarande?','Är jag från 90-talet eller tidigare?','Är jag en mänsklig karaktär?'],
    mixed:    ['Är jag en riktig person?','Lever jag fortfarande?','Är jag man?','Kommer jag från underhållning?','Är jag idrottare?','Är jag fiktiv?','Är jag internationellt känd?','Är jag från 1900-talet eller senare?'],
  },
};

function getHelperQuestions(categories, difficulty) {
  const qs = HELPER_QUESTIONS[lang] || HELPER_QUESTIONS['en'];
  if (!categories || categories.length === 0) return qs.mixed;
  if (categories.includes('mixed')) return qs.mixed;
  if (categories.length === 1) return qs[categories[0]] || qs.mixed;
  // Multiple categories — combine unique questions
  const combined = [];
  categories.forEach(cat => {
    (qs[cat] || []).forEach(q => { if (!combined.includes(q)) combined.push(q); });
  });
  return combined.slice(0, 10);
}

// ── Translations ──────────────────────────────────────────────────
const LANGS = {
  pl: {
    name:'🇵🇱 PL',
    gameTitle:'KIM JESTEM?', gameSubtitle:'Gra towarzyska · 2-16 graczy',
    navHome:'Strona główna', navAllGames:'Wszystkie gry',
    createRoom:'Stwórz pokój', joinRoom:'Dołącz do pokoju',
    createDisclaimer:'Stwórz pokój i zaproś znajomych — wybierz kategorie, trudność i tryb gry.',
    joinDisclaimer:'Masz kod od znajomego? Wpisz go tutaj i dołącz do gry!',
    yourName:'Twoje imię', roomCode:'Kod pokoju',
    createBtn:'Stwórz pokój', joinBtn:'Dołącz',
    shareCode:'Udostępnij kod znajomym', shareRoom:'Udostępnij pokój',
    playersTitle:'Gracze', settings:'Ustawienia',
    startBtn:'🎮 Rozpocznij grę', leaveRoom:'🚪 Wyjdź',
    mode:'Tryb gry', modeVoice:'🎤 Głosowy', modeChat:'💬 Czat',
    modeVoiceDesc:'Na żywo lub przez telefon (Zoom, Teams, FaceTime)', modeChatDesc:'Wszystko w aplikacji',
    categories:'Kategorie', difficulty:'Poziom trudności',
    diffEasy:'🌟 Łatwy', diffMedium:'🎭 Średni', diffHard:'🔥 Trudny',
    catSports:'⚽ Sport', catMusic:'🎵 Muzyka', catFilm:'🎬 Film & TV',
    catHistory:'📚 Historia', catAnimals:'🐘 Zwierzęta', catKids:'🧸 Bajki & Postacie',
    catMixed:'🌍 Wszystkie',
    catLabel:'Kategoria:',
    chatTitle:'💬 Pytania i Odpowiedzi',
    helperTitle:'💡 Szybkie pytania',
    qPlaceholder:'Zadaj pytanie...',
    turnsEach:'Tury na gracza', timer:'Timer', noTimer:'Bez limitu',
    hintsToggle:'Pokaż podpowiedzi pytań',
    howToPlay:'Jak grać?',
    rule1:'Stwórz pokój i zaproś znajomych kodem',
    rule2:'Każdy gracz dostaje tajną postać — ale jej nie widzi!',
    rule3:'Zadawaj pytania by odgadnąć kim jesteś',
    rule4:'Odgadnięcie postaci = 1 punkt. Poddanie się = 0',
    hintsTitle:'💡 Sugerowane pytania',
    hints:[
      'Czy jestem prawdziwą osobą?','Czy żyję / żyłam?','Czy jestem mężczyzną?',
      'Czy jestem ze świata rozrywki?','Czy jestem sportowcem?',
      'Czy jestem postacią fikcyjną?','Czy jestem ze świata nauki lub historii?',
      'Czy żyłem/am w XX wieku lub później?','Czy jestem znany/a na całym świecie?',
      'Czy zdobyłem/am jakąś nagrodę lub tytuł?',
    ],
    itsTurn:'Tura:', mysteryText:'KIM JESTEM?',
    guessLabel:'Zgaduję że jestem...', guessPlaceholder:'WPISZ POSTAĆ...',
    guessBtn:'Zgaduję!', surrenderBtn:'🏳️ Poddaję się', iGotIt:'Zgadłem / Zgadłam!',
    voteYes:'✅ TAK', voteNo:'❌ NIE', voteMaybe:'🤷 MOŻE',
    qPlaceholder:'Zadaj pytanie...',
    qCount:'Liczba pytań:', nextTurn:'Następna tura',
    resultCorrect:'✅ Brawo! Zgadłeś!', resultSurrender:'🏳️ Poddanie się',
    resultTimeout:'⏱️ Czas minął!', itWas:'Postać:',
    gameOver:'Koniec gry!', playAgain:'🔄 Zagraj ponownie',
    leaveTitle:'Opuścić grę?', leaveMsg:'Gra jest w toku. Na pewno chcesz wyjść?',
    confirmLeave:'Na pewno chcesz opuścić pokój?',
    leaveYes:'Tak, wyjdź', leaveNo:'Anuluj',
    needPlayers:'Potrzebujesz minimum 2 graczy',
    selectCat:'Wybierz przynajmniej jedną kategorię',
    modeLabel:'Tryb:', catsLabel:'Kategorie:', diffLabel:'Trudność:', timerLabel:'Timer:',
    voiceModeTip:'🎤 Tryb głosowy — pytajcie się nawzajem na żywo lub przez telefon',
    chatModeTip:'💬 Tryb czat — wszystko w aplikacji',
  },
  en: {
    name:'🇬🇧 EN',
    gameTitle:'WHO AM I?', gameSubtitle:'Party game · 2-16 players',
    navHome:'Home', navAllGames:'All Games',
    createRoom:'Create Room', joinRoom:'Join Room',
    createDisclaimer:'Create a room and invite friends — choose categories, difficulty and game mode.',
    joinDisclaimer:'Have a code from a friend? Enter it here and join the game!',
    yourName:'Your name', roomCode:'Room code',
    createBtn:'Create Room', joinBtn:'Join',
    shareCode:'Share this code with friends', shareRoom:'Share Room',
    playersTitle:'Players', settings:'Settings',
    startBtn:'🎮 Start Game', leaveRoom:'🚪 Leave',
    mode:'Game Mode', modeVoice:'🎤 Voice', modeChat:'💬 Chat',
    modeVoiceDesc:'In person or on a call (Zoom, Teams, FaceTime)', modeChatDesc:'Everything in the app',
    categories:'Categories', difficulty:'Difficulty',
    diffEasy:'🌟 Easy', diffMedium:'🎭 Medium', diffHard:'🔥 Hard',
    catSports:'⚽ Sports', catMusic:'🎵 Music', catFilm:'🎬 Film & TV',
    catHistory:'📚 History', catAnimals:'🐘 Animals', catKids:'🧸 Cartoons & Stories',
    catMixed:'🌍 Mixed',
    catLabel:'Category:',
    chatTitle:'💬 Questions & Answers',
    helperTitle:'💡 Quick questions',
    qPlaceholder:'Ask a question...',
    turnsEach:'Turns per player', timer:'Timer', noTimer:'No limit',
    hintsToggle:'Show question hints',
    howToPlay:'How to play?',
    rule1:'Create a room and invite friends with the code',
    rule2:'Each player gets a secret character — but can\'t see it!',
    rule3:'Ask yes/no questions to figure out who you are',
    rule4:'Guess the character = 1 point. Surrender = 0',
    hintsTitle:'💡 Suggested questions',
    hints:[
      'Am I a real person?','Am I still alive?','Am I male?',
      'Am I from entertainment?','Am I a sportsperson?',
      'Am I a fictional character?','Am I from history or science?',
      'Did I live in the 20th century or later?','Am I internationally famous?',
      'Have I won a major award or title?',
    ],
    itsTurn:'Turn:', mysteryText:'WHO AM I?',
    guessLabel:'I think I am...', guessPlaceholder:'TYPE CHARACTER...',
    guessBtn:'Guess!', surrenderBtn:'🏳️ Surrender', iGotIt:'I guessed it!',
    voteYes:'✅ YES', voteNo:'❌ NO', voteMaybe:'🤷 MAYBE',
    qPlaceholder:'Ask a question...',
    qCount:'Questions asked:', nextTurn:'Next Turn',
    resultCorrect:'✅ Correct!', resultSurrender:'🏳️ Surrendered',
    resultTimeout:'⏱️ Time\'s up!', itWas:'Character:',
    gameOver:'Game Over!', playAgain:'🔄 Play Again',
    leaveTitle:'Leave Game?', leaveMsg:'A game is in progress. Are you sure?',
    confirmLeave:'Are you sure you want to leave?',
    leaveYes:'Yes, leave', leaveNo:'Cancel',
    needPlayers:'You need at least 2 players',
    selectCat:'Select at least one category',
    modeLabel:'Mode:', catsLabel:'Categories:', diffLabel:'Difficulty:', timerLabel:'Timer:',
    voiceModeTip:'🎤 Voice mode — ask questions out loud or on a call',
    chatModeTip:'💬 Chat mode — everything happens in the app',
  },
  de: {
    name:'🇩🇪 DE',
    gameTitle:'WER BIN ICH?', gameSubtitle:'Partyspiel · 2-16 Spieler',
    navHome:'Startseite', navAllGames:'Alle Spiele',
    createRoom:'Raum erstellen', joinRoom:'Raum beitreten',
    createDisclaimer:'Erstelle einen Raum und lade Freunde ein — wähle Kategorien, Schwierigkeit und Spielmodus.',
    joinDisclaimer:'Hast du einen Code von einem Freund? Gib ihn hier ein!',
    yourName:'Dein Name', roomCode:'Raumcode',
    createBtn:'Raum erstellen', joinBtn:'Beitreten',
    shareCode:'Code mit Freunden teilen', shareRoom:'Raum teilen',
    playersTitle:'Spieler', settings:'Einstellungen',
    startBtn:'🎮 Spiel starten', leaveRoom:'🚪 Verlassen',
    mode:'Spielmodus', modeVoice:'🎤 Sprache', modeChat:'💬 Chat',
    modeVoiceDesc:'In Person oder per Anruf (Zoom, Teams, FaceTime)', modeChatDesc:'Alles in der App',
    categories:'Kategorien', difficulty:'Schwierigkeit',
    diffEasy:'🌟 Leicht', diffMedium:'🎭 Mittel', diffHard:'🔥 Schwer',
    catSports:'⚽ Sport', catMusic:'🎵 Musik', catFilm:'🎬 Film & TV',
    catHistory:'📚 Geschichte', catAnimals:'🐘 Tiere', catKids:'🧸 Cartoons & Figuren',
    catMixed:'🌍 Alle',
    catLabel:'Kategorie:',
    chatTitle:'💬 Fragen & Antworten',
    helperTitle:'💡 Schnellfragen',
    qPlaceholder:'Frage stellen...',
    turnsEach:'Züge pro Spieler', timer:'Timer', noTimer:'Kein Limit',
    hintsToggle:'Fragenhinweise anzeigen',
    howToPlay:'Wie spielt man?',
    rule1:'Erstelle einen Raum und lade Freunde mit dem Code ein',
    rule2:'Jeder Spieler bekommt eine geheime Person — sieht sie aber nicht!',
    rule3:'Stelle Ja/Nein-Fragen um herauszufinden wer du bist',
    rule4:'Richtig geraten = 1 Punkt. Aufgeben = 0',
    hintsTitle:'💡 Fragenvorschläge',
    hints:[
      'Bin ich eine echte Person?','Lebe ich noch?','Bin ich männlich?',
      'Komme ich aus der Unterhaltung?','Bin ich Sportler/in?',
      'Bin ich eine fiktive Figur?','Komme ich aus Geschichte oder Wissenschaft?',
      'Lebte ich im 20. Jahrhundert oder später?','Bin ich international bekannt?',
      'Habe ich einen großen Preis oder Titel gewonnen?',
    ],
    itsTurn:'Zug:', mysteryText:'WER BIN ICH?',
    guessLabel:'Ich glaube ich bin...', guessPlaceholder:'FIGUR EINGEBEN...',
    guessBtn:'Raten!', surrenderBtn:'🏳️ Aufgeben', iGotIt:'Ich hab\'s erraten!',
    voteYes:'✅ JA', voteNo:'❌ NEIN', voteMaybe:'🤷 VIELLEICHT',
    qPlaceholder:'Frage stellen...',
    qCount:'Gestellte Fragen:', nextTurn:'Nächste Runde',
    resultCorrect:'✅ Richtig!', resultSurrender:'🏳️ Aufgegeben',
    resultTimeout:'⏱️ Zeit abgelaufen!', itWas:'Figur:',
    gameOver:'Spiel vorbei!', playAgain:'🔄 Nochmal spielen',
    leaveTitle:'Spiel verlassen?', leaveMsg:'Ein Spiel läuft. Bist du sicher?',
    confirmLeave:'Raum wirklich verlassen?',
    leaveYes:'Ja, verlassen', leaveNo:'Abbrechen',
    needPlayers:'Du brauchst mindestens 2 Spieler',
    selectCat:'Wähle mindestens eine Kategorie',
    modeLabel:'Modus:', catsLabel:'Kategorien:', diffLabel:'Schwierigkeit:', timerLabel:'Timer:',
    voiceModeTip:'🎤 Sprachmodus — Fragen laut stellen oder per Anruf',
    chatModeTip:'💬 Chat-Modus — alles passiert in der App',
  },
  sv: {
    name:'🇸🇪 SV',
    gameTitle:'VEM ÄR JAG?', gameSubtitle:'Sällskapsspel · 2-16 spelare',
    navHome:'Startsida', navAllGames:'Alla spel',
    createRoom:'Skapa rum', joinRoom:'Gå med i rum',
    createDisclaimer:'Skapa ett rum och bjud in vänner — välj kategorier, svårighetsgrad och spelläge.',
    joinDisclaimer:'Har du en kod från en vän? Skriv in den här!',
    yourName:'Ditt namn', roomCode:'Rumskod',
    createBtn:'Skapa rum', joinBtn:'Gå med',
    shareCode:'Dela koden med vänner', shareRoom:'Dela rum',
    playersTitle:'Spelare', settings:'Inställningar',
    startBtn:'🎮 Starta spelet', leaveRoom:'🚪 Lämna',
    mode:'Spelläge', modeVoice:'🎤 Röst', modeChat:'💬 Chatt',
    modeVoiceDesc:'Träffas eller ring varandra (Zoom, Teams, FaceTime)', modeChatDesc:'Allt i appen',
    categories:'Kategorier', difficulty:'Svårighetsgrad',
    diffEasy:'🌟 Lätt', diffMedium:'🎭 Medel', diffHard:'🔥 Svår',
    catSports:'⚽ Sport', catMusic:'🎵 Musik', catFilm:'🎬 Film & TV',
    catHistory:'📚 Historia', catAnimals:'🐘 Djur', catKids:'🧸 Tecknat & Berättelser',
    catMixed:'🌍 Alla',
    catLabel:'Kategori:',
    chatTitle:'💬 Frågor & Svar',
    helperTitle:'💡 Snabbfrågor',
    qPlaceholder:'Ställ en fråga...',
    turnsEach:'Omgångar per spelare', timer:'Timer', noTimer:'Ingen gräns',
    hintsToggle:'Visa frågotips',
    howToPlay:'Hur spelar man?',
    rule1:'Skapa ett rum och bjud in vänner med koden',
    rule2:'Varje spelare får en hemlig person — men ser den inte!',
    rule3:'Ställ ja/nej-frågor för att lista ut vem du är',
    rule4:'Rätt gissning = 1 poäng. Ge upp = 0',
    hintsTitle:'💡 Föreslagna frågor',
    hints:[
      'Är jag en riktig person?','Lever jag fortfarande?','Är jag man?',
      'Kommer jag från underhållning?','Är jag idrottare?',
      'Är jag en fiktiv karaktär?','Kommer jag från historia eller vetenskap?',
      'Levde jag på 1900-talet eller senare?','Är jag internationellt känd?',
      'Har jag vunnit ett stort pris eller titel?',
    ],
    itsTurn:'Tur:', mysteryText:'VEM ÄR JAG?',
    guessLabel:'Jag tror att jag är...', guessPlaceholder:'SKRIV KARAKTÄR...',
    guessBtn:'Gissa!', surrenderBtn:'🏳️ Ge upp', iGotIt:'Jag gissade rätt!',
    voteYes:'✅ JA', voteNo:'❌ NEJ', voteMaybe:'🤷 KANSKE',
    qPlaceholder:'Ställ en fråga...',
    qCount:'Ställda frågor:', nextTurn:'Nästa omgång',
    resultCorrect:'✅ Rätt!', resultSurrender:'🏳️ Gav upp',
    resultTimeout:'⏱️ Tiden är slut!', itWas:'Karaktär:',
    gameOver:'Spelet slut!', playAgain:'🔄 Spela igen',
    leaveTitle:'Lämna spelet?', leaveMsg:'Ett spel pågår. Är du säker?',
    confirmLeave:'Vill du verkligen lämna rummet?',
    leaveYes:'Ja, lämna', leaveNo:'Avbryt',
    needPlayers:'Du behöver minst 2 spelare',
    selectCat:'Välj minst en kategori',
    modeLabel:'Läge:', catsLabel:'Kategorier:', diffLabel:'Svårighet:', timerLabel:'Timer:',
    voiceModeTip:'🎤 Röstläge — ställ frågor högt eller via samtal',
    chatModeTip:'💬 Chattläge — allt sker i appen',
  },
};

let L = LANGS[lang] || LANGS['pl'];

// ── Socket events ─────────────────────────────────────────────────
socket.on('connect', () => {
  const prevId = myId;
  myId = socket.id;
  if (prevId && prevId !== socket.id) {
    const sc = sessionStorage.getItem('whoami_code');
    const sn = sessionStorage.getItem('whoami_name');
    if (sc && sn) { myName = sn; socket.emit('whoami_rejoin', { code: sc, name: sn }); }
  }
});

socket.on('whoami_created', ({ code }) => {
  roomCode = code; isHost = true;
  window._whoamiMyName = myName;
  sessionStorage.setItem('whoami_code', code);
  sessionStorage.setItem('whoami_name', myName);
  document.getElementById('room-code-display').textContent = code;
  showScreen('screen-lobby');
});

socket.on('whoami_joined', ({ code }) => {
  roomCode = code;
  window._whoamiMyName = myName;
  sessionStorage.setItem('whoami_code', code);
  sessionStorage.setItem('whoami_name', myName);
  document.getElementById('room-code-display').textContent = code;
  showScreen('screen-lobby');
});

socket.on('whoami_error', ({ msg }) => { showError(msg); });

socket.on('whoami_state', (data) => {
  roomState = data;
  isHost = data.hostId === myId;
  applyState(data);
});

// ── State handler ─────────────────────────────────────────────────
function applyState(data) {
  switch (data.phase) {
    case 'lobby':        showScreen('screen-lobby');       renderLobby(data);      break;
    case 'playing':      showScreen('screen-playing');     renderPlaying(data);    break;
    case 'turn_result':  showScreen('screen-turn-result'); renderTurnResult(data); break;
    case 'final':        showScreen('screen-final');       renderFinal(data);      break;
  }
}

// ── Lobby ─────────────────────────────────────────────────────────
function renderLobby(data) {
  const startBtn = document.getElementById('lobby-start-btn');
  if (startBtn) startBtn.style.display = isHost ? '' : 'none';

  const players = document.getElementById('lobby-players');
  if (players) {
    players.innerHTML = data.players.map(p =>
      `<div class="lobby-player">
        <div class="avatar av-${data.players.indexOf(p) % 8}" style="width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Bebas Neue',sans-serif;font-size:16px;color:#fff;">
          ${p.name.charAt(0).toUpperCase()}
        </div>
        <span style="font-weight:700;color:var(--text);">${p.name}</span>
        ${p.id === data.hostId ? '<span style="font-size:11px;font-weight:700;color:var(--accent);margin-left:auto;">HOST</span>' : ''}
        ${!p.connected ? '<span style="font-size:11px;color:var(--muted);">offline</span>' : ''}
      </div>`
    ).join('');
  }

  // Settings display
  const modeD = document.getElementById('lobby-mode-display');
  const catsD = document.getElementById('lobby-cats-display');
  const diffD = document.getElementById('lobby-diff-display');
  const timD  = document.getElementById('lobby-timer-display');
  if (modeD) modeD.textContent = L.modeLabel + ' ' + (data.mode === 'voice' ? L.modeVoice : L.modeChat);
  if (catsD) catsD.textContent = L.catsLabel + ' ' + (data.settings.categories || []).join(', ');
  if (diffD) diffD.textContent = L.diffLabel + ' ' + (data.settings.difficulty || 'easy');
  if (timD)  timD.textContent  = L.timerLabel + ' ' + (data.settings.timerSecs > 0 ? Math.floor(data.settings.timerSecs/60) + ' min' : L.noTimer);
}

// ── Playing ───────────────────────────────────────────────────────
function renderPlaying(data) {
  const activePlayer = data.players[data.currentIdx];
  const isActive = activePlayer && activePlayer.id === myId;
  _votedThisTurn = false;

  // Turn banner
  const banner = document.getElementById('wa-turn-banner');
  if (banner) banner.textContent = L.itsTurn + ' ' + (activePlayer ? activePlayer.name.toUpperCase() : '');

  // Timer
  renderTimer(data.timerEnd, data.settings.timerSecs);

  // Character card vs mystery card
  const charCard    = document.getElementById('wa-char-card');
  const mysteryCard = document.getElementById('wa-mystery-card');
  const hintsWrap   = document.getElementById('wa-hints');
  const chatWrap    = document.getElementById('wa-chat-wrap');
  const guessWrap   = document.getElementById('wa-guess-wrap');

  if (isActive) {
    if (charCard)    charCard.style.display    = 'none';
    if (mysteryCard) { mysteryCard.style.display = ''; document.getElementById('wa-mystery-text').textContent = L.mysteryText; }
    if (hintsWrap && data.settings.hintsOn) { hintsWrap.style.display = ''; renderHints(data); }
    if (guessWrap) {
      guessWrap.style.display = '';
      const voiceGuess = document.getElementById('wa-voice-guess');
      const chatGuess  = document.getElementById('wa-chat-guess');
      if (voiceGuess) voiceGuess.style.display = (data.mode === 'voice') ? '' : 'none';
      if (chatGuess)  chatGuess.style.display  = (data.mode === 'chat')  ? '' : 'none';
    }
  } else {
    if (mysteryCard) mysteryCard.style.display  = 'none';
    if (hintsWrap)   hintsWrap.style.display    = 'none';
    if (guessWrap)   guessWrap.style.display    = 'none';
    if (charCard) {
      charCard.style.display = '';
      renderCharCard(data.activeChar, data.wikiSlug);
    }
  }

  // FIX 8: Show category label during gameplay
  const catDisplay = document.getElementById('wa-cat-display');
  if (catDisplay) {
    const cats = (data.settings.categories || []);
    const getCatLabel = cat => L['cat' + cat.charAt(0).toUpperCase() + cat.slice(1)] || cat;
    const catName = cats.includes('mixed') ? L.catMixed :
                    cats.length === 1 ? getCatLabel(cats[0]) :
                    cats.map(getCatLabel).join(' · ');
    catDisplay.textContent = (L.catLabel || 'Category:') + ' ' + catName;
    catDisplay.style.display = data.activeChar ? '' : 'none';
  }

  // Render helper questions for chat mode
  const helperArea = document.getElementById('wa-helper-area');
  if (isActive && data.mode === 'chat') {
    if (helperArea) helperArea.style.display = '';
    renderChatHelpers(data);
  } else {
    if (helperArea) helperArea.style.display = 'none';
  }

  // Chat (both modes show it, but input/votes only in chat mode)
  if (chatWrap) {
    chatWrap.style.display = '';
    renderChat(data, isActive);
  }

  // Score mini bar
  const mini = document.getElementById('wa-score-mini');
  if (mini) mini.textContent = data.players.map(p => p.name + ': ' + p.score).join(' · ');
}

function renderCharCard(charName, wikiSlug) {
  const nameEl = document.getElementById('wa-char-name');
  const imgEl  = document.getElementById('wa-char-img');
  const phEl   = document.getElementById('wa-char-placeholder');
  if (nameEl) nameEl.textContent = charName || '';
  if (!charName) return;

  // Load Wikipedia image
  if (imgEl && phEl) {
    imgEl.style.display = 'none';
    phEl.style.display  = 'flex';
    const slug = encodeURIComponent(wikiSlug || charName);
    fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${slug}`)
      .then(r => r.json())
      .then(d => {
        if (d.thumbnail && d.thumbnail.source) {
          imgEl.src = d.thumbnail.source;
          imgEl.onload = () => { imgEl.style.display = 'block'; phEl.style.display = 'none'; };
          imgEl.onerror = () => { imgEl.style.display = 'none'; phEl.style.display = 'flex'; };
        }
      })
      .catch(() => {});
  }
}

function renderHints(data) {
  // Voice mode: show suggested questions as hints
  const list = document.getElementById('wa-hints-list');
  const titleEl = document.getElementById('lbl-hints-title');
  if (titleEl) titleEl.textContent = L.hintsTitle;
  if (!list) return;
  const hints = data.settings ? getHelperQuestions(data.settings.categories, data.settings.difficulty) : L.hints;
  list.innerHTML = hints.map((h, i) =>
    `<div class="wa-hint-item" id="hint-${i}" onclick="markHintUsed(${i})">${h}</div>`
  ).join('');
}

function renderChatHelpers(data) {
  // Chat mode: show clickable helper questions that post to chat instantly
  const wrap = document.getElementById('wa-helper-btns');
  if (!wrap) return;
  const questions = data.settings ? getHelperQuestions(data.settings.categories, data.settings.difficulty) : [];
  if (!questions.length) { wrap.style.display = 'none'; return; }
  wrap.style.display = '';
  wrap.innerHTML = questions.map(q =>
    `<button class="wa-helper-btn" onclick="sendHelperQuestion(${JSON.stringify(q)})">${q}</button>`
  ).join('');
}

function sendHelperQuestion(text) {
  socket.emit('whoami_question', { code: roomCode, text });
}

function markHintUsed(i) {
  const el = document.getElementById('hint-' + i);
  if (el) el.classList.toggle('used');
}

function renderChat(data, isActive) {
  const chatEl   = document.getElementById('wa-chat');
  const qInput   = document.getElementById('wa-q-input-wrap');
  const qCount   = document.getElementById('wa-q-count');

  // Hide old vote row — replaced by per-question inline votes
  const oldVoteWrap = document.getElementById('wa-vote-wrap');
  if (oldVoteWrap) oldVoteWrap.style.display = 'none';

  if (qCount) qCount.textContent = data.mode === 'chat' ? L.qCount + ' ' + (data.questionCount || 0) : '';

  if (chatEl && data.mode === 'chat') {
    const myName = window._whoamiMyName || '';
    const activePlayer = data.players[data.currentIdx];
    const activeId = activePlayer ? activePlayer.id : null;
    const nonActivePlayers = data.players.filter(p => p.connected && p.id !== activeId);
    const totalVoters = nonActivePlayers.length;

    chatEl.innerHTML = (data.chat || []).map(m => {
      if (m.type === 'system') return `<div class="wa-msg system">${m.text}</div>`;

      if (m.type === 'question') {
        const votes = m.votes || {};
        const yesVoters   = Object.entries(votes).filter(([,v]) => v === 'yes').map(([n]) => n);
        const noVoters    = Object.entries(votes).filter(([,v]) => v === 'no').map(([n]) => n);
        const maybeVoters = Object.entries(votes).filter(([,v]) => v === 'maybe').map(([n]) => n);
        const totalVoted  = Object.keys(votes).length;
        const myVote      = votes[myName];

        // Compact emoji pill display
        let votePills = '';
        if (yesVoters.length)   votePills += `<span class="wa-vote-pill yes" title="${yesVoters.join(', ')}">✅ ${yesVoters.length}</span>`;
        if (noVoters.length)    votePills += `<span class="wa-vote-pill no"  title="${noVoters.join(', ')}">❌ ${noVoters.length}</span>`;
        if (maybeVoters.length) votePills += `<span class="wa-vote-pill maybe" title="${maybeVoters.join(', ')}">🤷 ${maybeVoters.length}</span>`;
        const waiting = totalVoted < totalVoters ? `<span class="wa-vote-waiting">${totalVoted}/${totalVoters}</span>` : '';

        // Answer buttons for non-active players — shown per question, can change vote
        let answerBtns = '';
        if (!isActive && data.phase === 'playing') {
          const yA = myVote === 'yes'   ? ' voted' : '';
          const nA = myVote === 'no'    ? ' voted' : '';
          const mA = myVote === 'maybe' ? ' voted' : '';
          answerBtns = `<div class="wa-inline-votes">
            <button class="wa-inline-btn yes${yA}"  onclick="sendVoteForQ('yes','${m.qId}')">✅</button>
            <button class="wa-inline-btn no${nA}"   onclick="sendVoteForQ('no','${m.qId}')">❌</button>
            <button class="wa-inline-btn maybe${mA}" onclick="sendVoteForQ('maybe','${m.qId}')">🤷</button>
          </div>`;
        }

        return `<div class="wa-msg question" data-qid="${m.qId}">
          <div class="wa-q-header"><strong>${m.from}:</strong> ${m.text}</div>
          <div class="wa-q-footer">${votePills}${waiting}${answerBtns}</div>
        </div>`;
      }
      return '';
    }).join('');

    // Auto-scroll to bottom
    chatEl.scrollTop = chatEl.scrollHeight;
  }

  if (data.mode === 'chat') {
    if (qInput) qInput.style.display = isActive ? '' : 'none';
  } else {
    if (qInput) qInput.style.display = 'none';
  }
}

// Store my name for vote rendering
window._whoamiMyName = '';

function renderTimer(timerEnd, timerSecs) {
  const wrap = document.getElementById('wa-timer-wrap');
  const bar  = document.getElementById('wa-timer-bar');
  const txt  = document.getElementById('wa-timer-text');
  if (_timerInt) clearInterval(_timerInt);

  if (!timerEnd || timerSecs <= 0) { if (wrap) wrap.style.display = 'none'; return; }
  if (wrap) wrap.style.display = '';

  function update() {
    const remaining = Math.max(0, timerEnd - Date.now());
    const pct = (remaining / (timerSecs * 1000)) * 100;
    if (bar) bar.style.width = pct + '%';
    if (bar) bar.style.background = pct > 50 ? 'var(--accent)' : pct > 25 ? 'var(--accent2)' : 'var(--red)';
    const secs = Math.ceil(remaining / 1000);
    const m = Math.floor(secs / 60), s = secs % 60;
    if (txt) txt.textContent = m + ':' + String(s).padStart(2, '0');
    if (remaining <= 0) clearInterval(_timerInt);
  }
  update();
  _timerInt = setInterval(update, 500);
}

// ── Turn Result ───────────────────────────────────────────────────
function renderTurnResult(data) {
  if (_timerInt) clearInterval(_timerInt);
  const banner = document.getElementById('wa-result-banner');
  const revDiv = document.getElementById('wa-char-revealed');
  const nextBtn = document.getElementById('next-turn-btn');

  // Find result from last system message
  const lastMsg = [...(data.chat || [])].reverse().find(m => m.type === 'system');
  const text = lastMsg ? lastMsg.text : '';
  const isCorrect = text.includes('✅');
  const isTimeout = text.includes('⏱️');

  if (banner) {
    banner.className = 'wa-result-banner ' + (isCorrect ? 'correct' : isTimeout ? 'timeout' : 'wrong');
    banner.textContent = isCorrect ? L.resultCorrect : isTimeout ? L.resultTimeout : L.resultSurrender;
  }

  // Show revealed character
  if (revDiv) {
    const charName = data.activeChar || '';
    const wikiSlug = data.wikiSlug  || charName;
    revDiv.innerHTML = `
      <div style="text-align:center;">
        <div id="rev-ph" style="width:100px;height:100px;border-radius:50%;border:3px solid var(--accent2);margin:0 auto 10px;display:flex;align-items:center;justify-content:center;font-size:40px;background:var(--surface);">🕵️</div>
        <img id="rev-img" style="width:100px;height:100px;border-radius:50%;object-fit:cover;border:3px solid var(--accent2);margin:0 auto 10px;display:none;" alt=""/>
        <div style="font-family:'Bebas Neue',sans-serif;font-size:32px;letter-spacing:2px;color:var(--accent2);">${charName}</div>
        <div style="font-size:12px;font-weight:700;color:var(--muted);margin-top:4px;">${L.itWas}</div>
      </div>`;
    // Load image
    const ri = document.getElementById('rev-img');
    const rp = document.getElementById('rev-ph');
    if (ri && rp && charName) {
      fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiSlug)}`)
        .then(r => r.json()).then(d => {
          if (d.thumbnail && d.thumbnail.source) {
            ri.src = d.thumbnail.source;
            ri.onload = () => { ri.style.display = 'block'; rp.style.display = 'none'; };
          }
        }).catch(() => {});
    }
  }

  // Scores
  const scoresEl = document.getElementById('wa-scores');
  if (scoresEl) {
    const activeId = data.activePlayerId;
    scoresEl.innerHTML = data.players.map(p =>
      `<div class="wa-score-row ${p.id === activeId ? 'active-turn' : ''}">
        <span style="font-weight:800;">${p.id === activeId ? '→ ' : ''}${p.name}</span>
        <span class="wa-score-pts">${p.score}</span>
      </div>`
    ).join('');
  }

  if (nextBtn) nextBtn.style.display = isHost ? '' : 'none';
}

// ── Final ─────────────────────────────────────────────────────────
function renderFinal(data) {
  if (_timerInt) clearInterval(_timerInt);
  const el = document.getElementById('final-scores');
  if (!el) return;
  const sorted = [...data.players].sort((a,b) => b.score - a.score);
  const max = sorted[0] ? sorted[0].score : 0;
  el.innerHTML = sorted.map((p, i) => `
    <div class="wa-score-row ${p.score === max ? 'winner' : ''}">
      <span style="font-weight:800;">${i===0?'🥇':i===1?'🥈':i===2?'🥉':'  '} ${p.name}</span>
      <span class="wa-score-pts">${p.score}</span>
    </div>`
  ).join('');
}

// ── UI Actions ────────────────────────────────────────────────────
function setMode(mode) {
  gameMode = mode;
  document.getElementById('mode-voice').classList.toggle('active', mode === 'voice');
  document.getElementById('mode-chat').classList.toggle('active', mode === 'chat');
}

function toggleCat(cat) {
  if (cat === 'mixed') {
    selCats = selCats.includes('mixed') ? [] : ['mixed'];
  } else {
    selCats = selCats.filter(c => c !== 'mixed');
    if (selCats.includes(cat)) selCats = selCats.filter(c => c !== cat);
    else selCats.push(cat);
  }
  document.querySelectorAll('.wa-cat-btn').forEach(btn => {
    btn.classList.toggle('active', selCats.includes(btn.dataset.cat));
  });
}

function setDiff(diff) {
  selDiff = diff;
  document.querySelectorAll('.wa-diff-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.diff === diff);
  });
}

function createRoom() {
  const _hp = document.getElementById('hp-website');
  if (_hp && _hp.value) return;
  const name = (document.getElementById('host-name').value || '').trim();
  if (!name) { showError(L.yourName + '?'); return; }
  if (selCats.length === 0) { showError(L.selectCat); return; }
  myName = name;
  socket.emit('whoami_create', {
    name,
    website: (_hp ? _hp.value : ''),
    settings: {
      mode:       gameMode,
      categories: selCats.length ? selCats : ['mixed'],
      difficulty: selDiff,
      turnsEach:  parseInt(document.getElementById('host-turns').value) || 1,
      timerSecs:  parseInt(document.getElementById('host-timer').value) || 120,
      hintsOn:    document.getElementById('host-hints').checked,
      isPublic:   typeof _isPublic !== 'undefined' ? _isPublic : false,
      lang,
    },
  });
}

function joinRoom() {
  const _hp = document.getElementById('hp-website');
  if (_hp && _hp.value) return;
  const name = (document.getElementById('join-name').value || '').trim();
  const code = (document.getElementById('join-code').value || '').trim().toUpperCase();
  if (!name) { showError(L.yourName + '?'); return; }
  if (!code || code.length < 5) { showError(L.roomCode + '?'); return; }
  myName = name;
  socket.emit('whoami_join', { name, code, website: (_hp ? _hp.value : '') });
}

function startGame() {
  socket.emit('whoami_start', { code: roomCode });
}

function sendQuestion() {
  const inp = document.getElementById('wa-q-input');
  const txt = (inp ? inp.value : '').trim();
  if (!txt) return;
  socket.emit('whoami_question', { code: roomCode, text: txt });
  if (inp) inp.value = '';
}

function sendVote(answer) {
  // Legacy — kept for safety, now uses sendVoteForQ
  socket.emit('whoami_answer', { code: roomCode, answer, qId: null });
}

function sendVoteForQ(answer, qId) {
  // Vote for a specific question — can change vote, no blocking
  socket.emit('whoami_answer', { code: roomCode, answer, qId });
}

function submitGuess() {
  const inp = document.getElementById('wa-guess-input');
  const guess = (inp ? inp.value : '').trim();
  if (!guess) return;
  socket.emit('whoami_guess', { code: roomCode, guess });
  if (inp) inp.value = '';
}

function voiceCorrect() {
  // Voice mode: player self-reports correct guess
  socket.emit('whoami_voice_correct', { code: roomCode });
}

function surrender() {
  socket.emit('whoami_surrender', { code: roomCode });
}

function nextTurn() {
  socket.emit('whoami_next', { code: roomCode });
}

function rematch() {
  socket.emit('whoami_rematch', { code: roomCode });
}

function goHome() {
  if (_timerInt) clearInterval(_timerInt);
  roomCode = ''; roomState = null; myName = '';
  sessionStorage.removeItem('whoami_code');
  sessionStorage.removeItem('whoami_name');
  showScreen('screen-home');
}
function doGoHome() { closeConfirm(); goHome(); }

// ── Language ──────────────────────────────────────────────────────
function setUiLang(code) {
  lang = code; L = LANGS[code] || LANGS['pl'];
  document.querySelectorAll('.lang-btn').forEach(b =>
    b.classList.toggle('active', b.textContent === LANGS[code].name));
  applyTranslations();
  if (roomState) applyState(roomState);
  history.replaceState(null, '', window.location.pathname + '?lang=' + code);
  window.lang = lang;
  if (typeof window._rebuildBurger === 'function') window._rebuildBurger(code);
  if (typeof window._refreshFooter  === 'function') window._refreshFooter();
}

function applyTranslations() {
  const set = (id, key) => { const el = document.getElementById(id); if (el && L[key]) el.textContent = L[key]; };
  set('game-title',         'gameTitle');
  set('game-subtitle',      'gameSubtitle');
  set('lbl-create-room',    'createRoom');
  set('lbl-create-disclaimer','createDisclaimer');
  set('lbl-join-room',      'joinRoom');
  set('lbl-join-disclaimer','joinDisclaimer');
  set('lbl-your-name',      'yourName');
  set('lbl-join-name',      'yourName');
  set('lbl-room-code',      'roomCode');
  set('lbl-create-btn',     'createBtn');
  set('lbl-join-btn',       'joinBtn');
  set('lbl-share-code',     'shareCode');
  set('lbl-share-room',     'shareRoom');
  set('lbl-players-title',  'playersTitle');
  set('lbl-settings',       'settings');
  set('lbl-start-btn',      'startBtn');
  set('lbl-leave-room',     'leaveRoom');
  set('lbl-mode',           'mode');
  set('lbl-mode-voice',     'modeVoice');
  set('lbl-mode-voice-desc','modeVoiceDesc');
  set('lbl-mode-chat',      'modeChat');
  set('lbl-mode-chat-desc', 'modeChatDesc');
  set('lbl-categories',     'categories');
  set('lbl-difficulty',     'difficulty');
  set('lbl-diff-easy',      'diffEasy');
  set('lbl-diff-medium',    'diffMedium');
  set('lbl-diff-hard',      'diffHard');
  set('lbl-cat-sports',     'catSports');
  set('lbl-cat-music',      'catMusic');
  set('lbl-cat-film',       'catFilm');
  set('lbl-cat-history',    'catHistory');
  set('lbl-cat-animals',    'catAnimals');
  set('lbl-cat-kids',       'catKids'); // cartoons category
  set('lbl-cat-mixed',      'catMixed');
  set('lbl-turns-each',     'turnsEach');
  set('lbl-timer',          'timer');
  set('lbl-no-timer',       'noTimer');
  set('lbl-hints-toggle',   'hintsToggle');
  set('lbl-how-to-play',    'howToPlay');
  set('lbl-rule-1',         'rule1');
  set('lbl-rule-2',         'rule2');
  set('lbl-rule-3',         'rule3');
  set('lbl-rule-4',         'rule4');
  set('lbl-guess-label',    'guessLabel');
  set('lbl-chat-title',     'chatTitle');
  set('lbl-helper-title',   'helperTitle');
  set('lbl-guess-btn',      'guessBtn');
  set('lbl-i-got-it',       'iGotIt');
  set('lbl-surrender-btn',  'surrenderBtn');
  set('lbl-next-turn',      'nextTurn');
  set('lbl-game-over',      'gameOver');
  set('lbl-play-again',     'playAgain');
  set('lbl-nav-all-games',  'navAllGames');

  const voteYes = document.querySelector('.wa-vote-btn.yes');
  const voteNo  = document.querySelector('.wa-vote-btn.no');
  const voteMaybe = document.querySelector('.wa-vote-btn.maybe');
  if (voteYes) voteYes.textContent = L.voteYes;
  if (voteNo)  voteNo.textContent  = L.voteNo;
  if (voteMaybe) voteMaybe.textContent = L.voteMaybe;

  const qInp = document.getElementById('wa-q-input');
  if (qInp) qInp.placeholder = L.qPlaceholder;
  const gInp = document.getElementById('wa-guess-input');
  if (gInp) gInp.placeholder = L.guessPlaceholder;

  const hostName = document.getElementById('host-name');
  if (hostName) hostName.placeholder = L.yourName;
  const joinName = document.getElementById('join-name');
  if (joinName) joinName.placeholder = L.yourName;
  const joinCode = document.getElementById('join-code');
  if (joinCode) joinCode.placeholder = L.roomCode;

  document.querySelectorAll('.lbl-nav-home-dup').forEach(el => { if (L.navHome) el.textContent = L.navHome; });
}

function clearHomeError() {
  const el = document.getElementById('home-error');
  if (el) el.style.display = 'none';
}

function showError(msg) {
  const el = document.getElementById('home-error');
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}

// Prefill join from URL
(function() {
  const p = new URLSearchParams(window.location.search);
  const j = p.get('join');
  if (j) {
    const jc = document.getElementById('join-code');
    if (jc) jc.value = j.toUpperCase();
  }
})();

// Rejoin handled in connect handler above

// ── Init ──────────────────────────────────────────────────────────
buildLangBar();
applyTranslations();
window.lang = lang;
initVisibilityToggle();
