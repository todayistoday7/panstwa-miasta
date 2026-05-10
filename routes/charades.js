// ═══════════════════════════════════════════════════════
// CHARADES / KALAMBURY — Server Route (Team-based)
// ═══════════════════════════════════════════════════════

const rooms = {};

// ── Word lists: category → difficulty → lang → words ──
const WORDS = {
  animals: {
    kids: {
      pl: ['Kot','Pies','Ryba','Ptak','Koń','Krowa','Świnia','Kaczka','Żaba','Królik','Miś','Motyl','Ślimak','Kurczak','Koza','Małpa','Lew','Słoń','Żółw','Pingwin','Mysz','Owca','Pająk','Biedronka','Papuga','Krokodyl','Dinozaur','Rekin','Delfin','Sowa'],
      en: ['Cat','Dog','Fish','Bird','Horse','Cow','Pig','Duck','Frog','Rabbit','Bear','Butterfly','Snail','Chicken','Goat','Monkey','Lion','Elephant','Turtle','Penguin','Mouse','Sheep','Spider','Ladybug','Parrot','Crocodile','Dinosaur','Shark','Dolphin','Owl'],
      de: ['Katze','Hund','Fisch','Vogel','Pferd','Kuh','Schwein','Ente','Frosch','Hase','Bär','Schmetterling','Schnecke','Huhn','Ziege','Affe','Löwe','Elefant','Schildkröte','Pinguin','Maus','Schaf','Spinne','Marienkäfer','Papagei','Krokodil','Dinosaurier','Hai','Delfin','Eule'],
      sv: ['Katt','Hund','Fisk','Fågel','Häst','Ko','Gris','Anka','Groda','Kanin','Björn','Fjäril','Snigel','Kyckling','Get','Apa','Lejon','Elefant','Sköldpadda','Pingvin','Mus','Får','Spindel','Nyckelpiga','Papegoja','Krokodil','Dinosaurie','Haj','Delfin','Uggla'],
    },
    family: {
      pl: ['Słoń','Żyrafa','Małpa','Kangur','Pingwin','Krokodyl','Delfin','Papuga','Pająk','Żółw','Lew','Tygrys','Orzeł','Rekin','Wieloryb','Sowa','Biedronka','Jeleń','Lis','Wilk','Goryl','Zebra','Flaming','Niedźwiedź','Koala','Kameleon'],
      en: ['Elephant','Giraffe','Monkey','Kangaroo','Penguin','Crocodile','Dolphin','Parrot','Spider','Turtle','Lion','Tiger','Eagle','Shark','Whale','Owl','Ladybug','Deer','Fox','Wolf','Gorilla','Zebra','Flamingo','Bear','Koala','Chameleon'],
      de: ['Elefant','Giraffe','Affe','Känguru','Pinguin','Krokodil','Delfin','Papagei','Spinne','Schildkröte','Löwe','Tiger','Adler','Hai','Wal','Eule','Marienkäfer','Hirsch','Fuchs','Wolf','Gorilla','Zebra','Flamingo','Bär','Koala','Chamäleon'],
      sv: ['Elefant','Giraff','Apa','Känguru','Pingvin','Krokodil','Delfin','Papegoja','Spindel','Sköldpadda','Lejon','Tiger','Örn','Haj','Val','Uggla','Nyckelpiga','Hjort','Räv','Varg','Gorilla','Zebra','Flamingo','Björn','Koala','Kameleont'],
    },
    adults: {
      pl: ['Mrówkojad','Szakal','Kapibara','Narwal','Okapi','Lemur','Pelikan','Albatros','Fretka','Gazela','Homar','Meduza','Termit','Leniwiec','Wombat'],
      en: ['Anteater','Jackal','Capybara','Narwhal','Okapi','Lemur','Pelican','Albatross','Ferret','Gazelle','Lobster','Jellyfish','Termite','Sloth','Wombat'],
      de: ['Ameisenbär','Schakal','Capybara','Narwal','Okapi','Lemur','Pelikan','Albatros','Frettchen','Gazelle','Hummer','Qualle','Termite','Faultier','Wombat'],
      sv: ['Myrslok','Schakal','Kapybara','Narval','Okapi','Lemur','Pelikan','Albatross','Iller','Gasell','Hummer','Manet','Termit','Sengångare','Vombat'],
    },
  },
  actions: {
    kids: {
      pl: ['Spanie','Jedzenie','Picie','Skakanie','Bieganie','Pływanie','Latanie','Czesanie','Mycie rąk','Kąpiel','Rysowanie','Kopanie piłki','Klaskanie','Taniec','Płakanie','Śmiech','Chodzenie','Czołganie się','Wspinanie się','Chowanie się','Machanie','Dmuchanie','Kichanie','Ziewanie','Ubieranie się','Zamiatanie','Podlewanie kwiatów','Karmienie','Przytulanie','Głaskanie'],
      en: ['Sleeping','Eating','Drinking','Jumping','Running','Swimming','Flying','Combing hair','Washing hands','Bath','Drawing','Kicking ball','Clapping','Dancing','Crying','Laughing','Walking','Crawling','Climbing','Hiding','Waving','Blowing','Sneezing','Yawning','Getting dressed','Sweeping','Watering flowers','Feeding','Hugging','Petting'],
      de: ['Schlafen','Essen','Trinken','Springen','Laufen','Schwimmen','Fliegen','Haare kämmen','Hände waschen','Baden','Malen','Ball kicken','Klatschen','Tanzen','Weinen','Lachen','Gehen','Krabbeln','Klettern','Verstecken','Winken','Pusten','Niesen','Gähnen','Anziehen','Fegen','Blumen gießen','Füttern','Umarmen','Streicheln'],
      sv: ['Sova','Äta','Dricka','Hoppa','Springa','Simma','Flyga','Kamma håret','Tvätta händerna','Bada','Rita','Sparka boll','Klappa','Dansa','Gråta','Skratta','Gå','Krypa','Klättra','Gömma sig','Vinka','Blåsa','Nysa','Gäspa','Klä på sig','Sopa','Vattna blommor','Mata','Krama','Smeka'],
    },
    family: {
      pl: ['Gotowanie','Malowanie','Granie na gitarze','Czytanie','Pisanie','Śpiewanie','Jazda na rowerze','Mycie zębów','Robienie zdjęcia','Granie w piłkę','Wspinaczka','Jazda na nartach','Dmuchanie balonów','Rzucanie piłką','Jazda samochodem','Odkurzanie','Wędkowanie','Suszenie włosów','Granie w tenisa','Skakanie na skakance','Oglądanie TV','Latanie samolotem','Przewracanie naleśników','Słuchanie muzyki','Pisanie listu','Strzyżenie','Pisanie na klawiaturze','Bitwa na śnieżki','Granie w golfa','Modlenie się','Wchodzenie pod górę','Branie prysznica','Karmienie psa'],
      en: ['Cooking','Painting','Playing guitar','Reading','Writing','Singing','Riding bicycle','Brushing teeth','Taking photo','Playing football','Climbing','Skiing','Blowing balloons','Throwing ball','Driving car','Vacuuming','Fishing','Drying hair','Playing tennis','Jump rope','Watching TV','Flying in a plane','Flipping pancakes','Listening to music','Writing a letter','Giving a haircut','Typing','Having a snowball fight','Playing golf','Praying','Going uphill','Taking a shower','Feeding a dog'],
      de: ['Kochen','Malen','Gitarre spielen','Lesen','Schreiben','Singen','Fahrrad fahren','Zähne putzen','Foto machen','Fußball spielen','Klettern','Skifahren','Luftballons aufblasen','Ball werfen','Auto fahren','Staubsaugen','Angeln','Haare föhnen','Tennis spielen','Seilspringen','Fernsehen','Fliegen im Flugzeug','Pfannkuchen wenden','Musik hören','Brief schreiben','Haare schneiden','Tippen','Schneeballschlacht','Golf spielen','Beten','Bergauf gehen','Duschen','Hund füttern'],
      sv: ['Laga mat','Måla','Spela gitarr','Läsa','Skriva','Sjunga','Cykla','Borsta tänderna','Ta foto','Spela fotboll','Klättra','Åka skidor','Blåsa ballonger','Kasta boll','Köra bil','Dammsuga','Fiska','Föna håret','Spela tennis','Hoppa hopprep','Titta på TV','Flyga med flygplan','Vända pannkakor','Lyssna på musik','Skriva ett brev','Klippa hår','Skriva på tangentbord','Snöbollskrig','Spela golf','Be','Gå uppför','Duscha','Mata hunden'],
    },
    adults: {
      pl: ['Prasowanie','Negocjowanie','Medytowanie','Szydełkowanie','Żonglowanie','Surfowanie','Dyrygowanie orkiestrą','Naprawianie samochodu','Prowadzenie wykładu','Robienie na drutach'],
      en: ['Ironing','Negotiating','Meditating','Crocheting','Juggling','Surfing','Conducting orchestra','Fixing a car','Giving a lecture','Knitting'],
      de: ['Bügeln','Verhandeln','Meditieren','Häkeln','Jonglieren','Surfen','Orchester dirigieren','Auto reparieren','Vortrag halten','Stricken'],
      sv: ['Stryka','Förhandla','Meditera','Virka','Jonglera','Surfa','Dirigera orkester','Laga bil','Hålla föreläsning','Sticka'],
    },
  },
  professions: {
    kids: {
      pl: ['Lekarz','Strażak','Policjant','Nauczyciel','Kucharz','Pilot','Pirat','Astronauta','Księżniczka','Rycerz','Kowboj','Magik','Malarz','Tancerz','Piosenkarz','Kierowca','Piekarz','Ogrodnik','Clown','Superbohater','Król','Królowa','Listonosz','Weterynarz','Fotograf'],
      en: ['Doctor','Firefighter','Police','Teacher','Chef','Pilot','Pirate','Astronaut','Princess','Knight','Cowboy','Magician','Painter','Dancer','Singer','Driver','Baker','Gardener','Clown','Superhero','King','Queen','Postman','Vet','Photographer'],
      de: ['Arzt','Feuerwehrmann','Polizist','Lehrer','Koch','Pilot','Pirat','Astronaut','Prinzessin','Ritter','Cowboy','Zauberer','Maler','Tänzer','Sänger','Fahrer','Bäcker','Gärtner','Clown','Superheld','König','Königin','Briefträger','Tierarzt','Fotograf'],
      sv: ['Läkare','Brandman','Polis','Lärare','Kock','Pilot','Pirat','Astronaut','Prinsessa','Riddare','Cowboy','Trollkarl','Målare','Dansare','Sångare','Förare','Bagare','Trädgårdsmästare','Clown','Superhjälte','Kung','Drottning','Brevbärare','Veterinär','Fotograf'],
    },
    family: {
      pl: ['Dentysta','Fryzjer','Kierowca','Fotograf','Ogrodnik','Listonosz','Mechanik','Aktor','Sędzia','Weterynarz','Ratownik','Stolarz','Piekarz','Kelner','Detektyw'],
      en: ['Dentist','Hairdresser','Driver','Photographer','Gardener','Postman','Mechanic','Actor','Referee','Vet','Lifeguard','Carpenter','Baker','Waiter','Detective'],
      de: ['Zahnarzt','Friseur','Fahrer','Fotograf','Gärtner','Briefträger','Mechaniker','Schauspieler','Schiedsrichter','Tierarzt','Rettungsschwimmer','Tischler','Bäcker','Kellner','Detektiv'],
      sv: ['Tandläkare','Frisör','Förare','Fotograf','Trädgårdsmästare','Brevbärare','Mekaniker','Skådespelare','Domare','Veterinär','Livräddare','Snickare','Bagare','Servitör','Detektiv'],
    },
    adults: {
      pl: ['Archeolog','Chirurg','Dyplomata','Farmaceuta','Geolog','Prawnik','Psycholog','Architekt','Księgowy','Tłumacz'],
      en: ['Archaeologist','Surgeon','Diplomat','Pharmacist','Geologist','Lawyer','Psychologist','Architect','Accountant','Translator'],
      de: ['Archäologe','Chirurg','Diplomat','Apotheker','Geologe','Anwalt','Psychologe','Architekt','Buchhalter','Übersetzer'],
      sv: ['Arkeolog','Kirurg','Diplomat','Farmaceut','Geolog','Advokat','Psykolog','Arkitekt','Revisor','Översättare'],
    },
  },
  movies: {
    kids: {
      pl: ['Superman','Batman','Spider-Man','Elsa','Shrek','Nemo','Pikachu','Mickey Mouse','Scooby-Doo','Spongebob','Buzz Lightyear','Simba','Peppa Pig','Paw Patrol','Olaf','Stitch','Dora','Bluey','Garfield','Tom i Jerry','Bambi','Dumbo','Myszka Minnie','Goofy','Donald Duck'],
      en: ['Superman','Batman','Spider-Man','Elsa','Shrek','Nemo','Pikachu','Mickey Mouse','Scooby-Doo','SpongeBob','Buzz Lightyear','Simba','Peppa Pig','Paw Patrol','Olaf','Stitch','Dora','Bluey','Garfield','Tom and Jerry','Bambi','Dumbo','Minnie Mouse','Goofy','Donald Duck'],
      de: ['Superman','Batman','Spider-Man','Elsa','Shrek','Nemo','Pikachu','Micky Maus','Scooby-Doo','SpongeBob','Buzz Lightyear','Simba','Peppa Wutz','Paw Patrol','Olaf','Stitch','Dora','Bluey','Garfield','Tom und Jerry','Bambi','Dumbo','Minnie Maus','Goofy','Donald Duck'],
      sv: ['Superman','Batman','Spider-Man','Elsa','Shrek','Nemo','Pikachu','Musse Pigg','Scooby-Doo','Svampbob','Buzz Lightyear','Simba','Greta Gris','Paw Patrol','Olaf','Stitch','Dora','Bluey','Garfield','Tom och Jerry','Bambi','Dumbo','Mimmi Pigg','Långansen','Kalle Anka'],
    },
    family: {
      pl: ['Harry Potter','Król Lew','Piraci z Karaibów','Indiana Jones','Robin Hood','Aladyn','Kopciuszek','Tarzan','Peter Pan','Zorro','Rocky','Rambo','Terminator','E.T.','Toy Story'],
      en: ['Harry Potter','The Lion King','Pirates of the Caribbean','Indiana Jones','Robin Hood','Aladdin','Cinderella','Tarzan','Peter Pan','Zorro','Rocky','Rambo','Terminator','E.T.','Toy Story'],
      de: ['Harry Potter','König der Löwen','Fluch der Karibik','Indiana Jones','Robin Hood','Aladdin','Aschenputtel','Tarzan','Peter Pan','Zorro','Rocky','Rambo','Terminator','E.T.','Toy Story'],
      sv: ['Harry Potter','Lejonkungen','Pirates of the Caribbean','Indiana Jones','Robin Hood','Aladdin','Askungen','Tarzan','Peter Pan','Zorro','Rocky','Rambo','Terminator','E.T.','Toy Story'],
    },
    adults: {
      pl: ['James Bond','Star Wars','Titanic','Jurassic Park','Matrix','Gladiator','Forrest Gump','Ojciec Chrzestny','Fight Club','Pulp Fiction'],
      en: ['James Bond','Star Wars','Titanic','Jurassic Park','Matrix','Gladiator','Forrest Gump','The Godfather','Fight Club','Pulp Fiction'],
      de: ['James Bond','Star Wars','Titanic','Jurassic Park','Matrix','Gladiator','Forrest Gump','Der Pate','Fight Club','Pulp Fiction'],
      sv: ['James Bond','Star Wars','Titanic','Jurassic Park','Matrix','Gladiator','Forrest Gump','Gudfadern','Fight Club','Pulp Fiction'],
    },
  },
  food: {
    kids: {
      pl: ['Pizza','Lody','Tort','Jabłko','Banan','Mleko','Ciastko','Czekolada','Arbuz','Kanapka','Jajko','Marchewka','Pomidor','Truskawka','Winogrono','Kukurydza','Ser','Chleb','Makaron','Naleśnik','Gofr','Lizak','Guma do żucia','Popcorn','Sok'],
      en: ['Pizza','Ice cream','Cake','Apple','Banana','Milk','Cookie','Chocolate','Watermelon','Sandwich','Egg','Carrot','Tomato','Strawberry','Grape','Corn','Cheese','Bread','Pasta','Pancake','Waffle','Lollipop','Chewing gum','Popcorn','Juice'],
      de: ['Pizza','Eis','Kuchen','Apfel','Banane','Milch','Keks','Schokolade','Wassermelone','Sandwich','Ei','Karotte','Tomate','Erdbeere','Traube','Mais','Käse','Brot','Nudeln','Pfannkuchen','Waffel','Lutscher','Kaugummi','Popcorn','Saft'],
      sv: ['Pizza','Glass','Tårta','Äpple','Banan','Mjölk','Kaka','Choklad','Vattenmelon','Smörgås','Ägg','Morot','Tomat','Jordgubbe','Druva','Majs','Ost','Bröd','Pasta','Pannkaka','Våffla','Klubba','Tuggummi','Popcorn','Juice'],
    },
    family: {
      pl: ['Spaghetti','Naleśniki','Jajecznica','Sałatka','Zupa','Hamburger','Hot dog','Popcorn','Pierogi','Kiełbasa','Gofr','Smoothie','Sushi','Grillowanie','Szaszłyk'],
      en: ['Spaghetti','Pancakes','Scrambled eggs','Salad','Soup','Hamburger','Hot dog','Popcorn','Dumplings','Sausage','Waffle','Smoothie','Sushi','BBQ','Kebab'],
      de: ['Spaghetti','Pfannkuchen','Rührei','Salat','Suppe','Hamburger','Hot Dog','Popcorn','Maultaschen','Wurst','Waffel','Smoothie','Sushi','Grillen','Kebab'],
      sv: ['Spaghetti','Pannkakor','Äggröra','Sallad','Soppa','Hamburgare','Korv med bröd','Popcorn','Piroger','Korv','Våffla','Smoothie','Sushi','Grilla','Kebab'],
    },
    adults: {
      pl: ['Fondue','Carpaccio','Tiramisu','Creme brulee','Gazpacho','Ratatouille','Paella','Risotto','Guacamole','Tartare'],
      en: ['Fondue','Carpaccio','Tiramisu','Creme brulee','Gazpacho','Ratatouille','Paella','Risotto','Guacamole','Tartare'],
      de: ['Fondue','Carpaccio','Tiramisu','Crème brûlée','Gazpacho','Ratatouille','Paella','Risotto','Guacamole','Tatar'],
      sv: ['Fondue','Carpaccio','Tiramisu','Crème brûlée','Gazpacho','Ratatouille','Paella','Risotto','Guacamole','Tartare'],
    },
  },
  sports: {
    kids: {
      pl: ['Piłka nożna','Koszykówka','Pływanie','Bieganie','Skakanie','Jazda na rowerze','Taniec','Gimnastyka','Karate','Hokej','Jazda na hulajnodze','Rzucanie piłką','Łapanie piłki','Skakanie na skakance','Jazda na łyżwach','Hula-hop','Ping-pong','Badminton','Jazda na deskorolce','Piłka ręczna','Boks','Judo','Wrestling','Siatkówka','Surfing'],
      en: ['Football','Basketball','Swimming','Running','Jumping','Cycling','Dancing','Gymnastics','Karate','Hockey','Scooter riding','Throwing ball','Catching ball','Jump rope','Ice skating','Hula hoop','Ping pong','Badminton','Skateboarding','Handball','Boxing','Judo','Wrestling','Volleyball','Surfing'],
      de: ['Fußball','Basketball','Schwimmen','Laufen','Springen','Radfahren','Tanzen','Turnen','Karate','Hockey','Rollerfahren','Ball werfen','Ball fangen','Seilspringen','Eislaufen','Hula-Hoop','Tischtennis','Badminton','Skateboarden','Handball','Boxen','Judo','Ringen','Volleyball','Surfen'],
      sv: ['Fotboll','Basket','Simning','Löpning','Hopp','Cykling','Dans','Gymnastik','Karate','Hockey','Sparkcykel','Kasta boll','Fånga boll','Hoppa hopprep','Skridskoåkning','Rockring','Pingis','Badminton','Skateboard','Handboll','Boxning','Judo','Brottning','Volleyboll','Surfing'],
    },
    family: {
      pl: ['Tenis','Siatkówka','Golf','Łucznictwo','Szermierka','Surfing','Wspinaczka','Boks','Wrestling','Jazda konna','Narciarstwo','Snowboard','Łyżwiarstwo','Skateboarding','Wiosłowanie'],
      en: ['Tennis','Volleyball','Golf','Archery','Fencing','Surfing','Climbing','Boxing','Wrestling','Horse riding','Skiing','Snowboarding','Ice skating','Skateboarding','Rowing'],
      de: ['Tennis','Volleyball','Golf','Bogenschießen','Fechten','Surfen','Klettern','Boxen','Ringen','Reiten','Skifahren','Snowboarden','Eislaufen','Skateboarden','Rudern'],
      sv: ['Tennis','Volleyboll','Golf','Bågskytte','Fäktning','Surfning','Klättring','Boxning','Brottning','Ridning','Skidåkning','Snowboard','Skridskoåkning','Skateboard','Rodd'],
    },
    adults: {
      pl: ['Polo','Krykiet','Curling','Triathlon','Bobslej','Skeleton','Biathlon','Pentathlon','Kendo','Capoeira'],
      en: ['Polo','Cricket','Curling','Triathlon','Bobsled','Skeleton','Biathlon','Pentathlon','Kendo','Capoeira'],
      de: ['Polo','Cricket','Curling','Triathlon','Bobfahren','Skeleton','Biathlon','Fünfkampf','Kendo','Capoeira'],
      sv: ['Polo','Cricket','Curling','Triathlon','Bobsled','Skeleton','Skidskytte','Femkamp','Kendo','Capoeira'],
    },
  },
};

// Track used words per room to avoid repeats
function pickWord(room) {
  const cat = room.settings.category;
  const diff = room.settings.difficulty;
  const lang = room.settings.lang || 'en';
  
  // Get all valid categories
  const categories = cat === 'mixed' ? Object.keys(WORDS) : [cat];
  
  // Try to find an unused word
  for (let attempt = 0; attempt < 50; attempt++) {
    const chosenCat = categories[Math.floor(Math.random() * categories.length)];
    const pool = WORDS[chosenCat] && WORDS[chosenCat][diff] && WORDS[chosenCat][diff][lang]
               ? WORDS[chosenCat][diff][lang]
               : (WORDS[chosenCat] && WORDS[chosenCat][diff] && WORDS[chosenCat][diff]['en']
                  ? WORDS[chosenCat][diff]['en'] : []);
    if (pool.length === 0) continue;
    const word = pool[Math.floor(Math.random() * pool.length)];
    if (!room.state.usedWords.has(word)) {
      room.state.usedWords.add(word);
      return word;
    }
  }
  // Fallback: allow repeats
  const chosenCat = categories[Math.floor(Math.random() * categories.length)];
  const pool = WORDS[chosenCat][diff][lang] || WORDS[chosenCat][diff]['en'] || ['???'];
  return pool[Math.floor(Math.random() * pool.length)];
}

function getRounds(room) {
  const playerCount = room.players.filter(p => p.connected).length;
  const multiplier = room.settings.gameLength === 'quick' ? 1 : room.settings.gameLength === 'marathon' ? 3 : 2;
  return Math.max(2, playerCount * multiplier);
}

function getConnected(room) {
  return room.players.filter(p => p.connected);
}

function getTeamPlayers(room, team) {
  return room.players.filter(p => p.connected && p.team === team);
}

function broadcastState(io, room) {
  const actor = room.state.actorId ? room.players.find(p => p.id === room.state.actorId) : null;
  
  const baseState = {
    phase: room.state.phase,
    players: room.players.filter(pl => pl.connected).map(pl => ({
      id: pl.id, name: pl.name, team: pl.team, connected: pl.connected,
      isHost: pl.id === room.hostId,
    })),
    hostId: room.hostId,
    teams: {
      red: { score: room.state.scores.red, players: getTeamPlayers(room, 'red').map(pl => pl.name) },
      blue: { score: room.state.scores.blue, players: getTeamPlayers(room, 'blue').map(pl => pl.name) },
    },
    actorId: room.state.actorId,
    actorName: actor ? actor.name : '',
    actorTeam: actor ? actor.team : null,
    word: null,
    round: room.state.round,
    totalRounds: getRounds(room),
    timerEnd: room.state.timerEnd,
    timerSecs: room.settings.timerSecs,
    wordsThisTurn: room.state.wordsThisTurn || 0,
    passesLeft: room.state.passesLeft,
    lastWord: room.state.lastWord,
    lastResult: room.state.lastResult,
    settings: room.settings,
    isPublic: room.isPublic,
  };

  // Broadcast to everyone in the room (like Forbidden Words does)
  io.to(room.code).emit('charades_state', baseState);

  // Send the word privately to the actor only
  if (room.state.actorId && room.state.word) {
    io.to(room.state.actorId).emit('charades_state', { ...baseState, word: room.state.word });
  }
}

function pickNextActor(room) {
  // Alternate between teams, cycle through players within each team
  const team = room.state.currentTeam;
  const teamPlayers = getTeamPlayers(room, team);
  if (teamPlayers.length === 0) return null;
  
  const idx = room.state.teamActorIdx[team] % teamPlayers.length;
  room.state.teamActorIdx[team] = idx + 1;
  return teamPlayers[idx];
}

function startTurn(io, room) {
  const actor = pickNextActor(room);
  if (!actor) return;
  
  room.state.actorId = actor.id;
  room.state.word = pickWord(room);
  room.state.wordsThisTurn = 0;
  room.state.passesLeft = 3;
  room.state.lastWord = null;
  room.state.lastResult = null;
  room.state.timerEnd = Date.now() + room.settings.timerSecs * 1000;
  room.state.phase = 'acting';
  
  broadcastState(io, room);
  
  // Timer
  clearTimeout(room.state.timer);
  room.state.timer = setTimeout(() => {
    if (room.state.phase === 'acting') {
      room.state.lastWord = room.state.word;
      room.state.lastResult = 'timeout';
      room.state.phase = 'turn_end';
      broadcastState(io, room);
      // Host clicks "Next Round" to continue
    }
  }, room.settings.timerSecs * 1000);
}

function endRound(io, room) {
  room.state.round++;
  // Switch teams
  room.state.currentTeam = room.state.currentTeam === 'red' ? 'blue' : 'red';
  
  if (room.state.round > getRounds(room)) {
    room.state.phase = 'final';
    clearTimeout(room.state.timer);
    broadcastState(io, room);
  } else {
    startTurn(io, room);
  }
}

function register(io, socket) {
  
  socket.on('charades_create', ({ name, settings }) => {
    const code = Math.random().toString(36).substring(2, 7).toUpperCase();
    const player = { id: socket.id, name: name || 'Player', team: 'red', connected: true };
    rooms[code] = {
      code,
      hostId: socket.id,
      players: [player],
      isPublic: false,
      settings: {
        lang: (settings && settings.lang) || 'pl',
        category: (settings && settings.category) || 'mixed',
        difficulty: (settings && settings.difficulty) || 'family',
        gameLength: (settings && settings.gameLength) || 'standard', // quick, standard, marathon
        timerSecs: (settings && settings.timerSecs) || 60,
      },
      state: {
        phase: 'lobby',
        scores: { red: 0, blue: 0 },
        currentTeam: 'red',
        teamActorIdx: { red: 0, blue: 0 },
        actorId: null,
        word: null,
        wordsThisTurn: 0,
        passesLeft: 3,
        lastWord: null,
        lastResult: null,
        round: 1,
        timerEnd: null,
        timer: null,
        usedWords: new Set(),
      },
      createdAt: Date.now(),
    };
    socket.join(code);
    socket.emit('charades_room_created', { code });
    // Small delay to ensure client processes room_created before state arrives
    setTimeout(() => broadcastState(io, rooms[code]), 50);
  });
  
  socket.on('charades_join', ({ code, name }) => {
    const room = rooms[code];
    if (!room) return socket.emit('charades_error', { message: 'Room not found' });
    if (room.state.phase !== 'lobby') return socket.emit('charades_error', { message: 'Game already started' });
    if (room.players.length >= 12) return socket.emit('charades_error', { message: 'Room is full (max 12)' });
    
    // Auto-assign to team with fewer players
    const redCount = room.players.filter(p => p.team === 'red' && p.connected).length;
    const blueCount = room.players.filter(p => p.team === 'blue' && p.connected).length;
    const team = blueCount < redCount ? 'blue' : 'red';
    
    const player = { id: socket.id, name: name || 'Player', team, connected: true };
    room.players.push(player);
    socket.join(code);
    socket.emit('charades_room_joined', { code });
    setTimeout(() => broadcastState(io, room), 50);
  });
  
  socket.on('charades_move_team', ({ code, playerId, team }) => {
    const room = rooms[code];
    if (!room || socket.id !== room.hostId) return;
    const player = room.players.find(p => p.id === playerId);
    if (player && (team === 'red' || team === 'blue')) {
      player.team = team;
      broadcastState(io, room);
    }
  });
  
  socket.on('charades_update_settings', ({ code, settings }) => {
    const room = rooms[code];
    if (!room || socket.id !== room.hostId) return;
    if (settings.lang) room.settings.lang = settings.lang;
    if (settings.category) room.settings.category = settings.category;
    if (settings.difficulty) room.settings.difficulty = settings.difficulty;
    if (settings.timerSecs) room.settings.timerSecs = Math.min(90, Math.max(30, settings.timerSecs));
    if (settings.gameLength) room.settings.gameLength = settings.gameLength;
    if (settings.isPublic !== undefined) room.isPublic = settings.isPublic;
    broadcastState(io, room);
  });
  
  socket.on('charades_start', ({ code }) => {
    const room = rooms[code];
    if (!room || socket.id !== room.hostId) return;
    const redTeam = getTeamPlayers(room, 'red');
    const blueTeam = getTeamPlayers(room, 'blue');
    if (redTeam.length < 1 || blueTeam.length < 1) return;
    
    room.state.round = 1;
    room.state.scores = { red: 0, blue: 0 };
    room.state.currentTeam = 'red';
    room.state.teamActorIdx = { red: 0, blue: 0 };
    room.state.usedWords = new Set();
    startTurn(io, room);
  });
  
  // Actor presses "Correct" — their team guessed it
  socket.on('charades_correct', ({ code }) => {
    const room = rooms[code];
    if (!room || room.state.phase !== 'acting') return;
    if (socket.id !== room.state.actorId) return;
    
    const actor = room.players.find(p => p.id === room.state.actorId);
    if (!actor) return;
    
    room.state.scores[actor.team]++;
    room.state.wordsThisTurn++;
    room.state.lastWord = room.state.word;
    room.state.lastResult = 'correct';
    
    // Give next word (same turn continues)
    room.state.word = pickWord(room);
    broadcastState(io, room);
  });
  
  // Actor presses "Pass"
  socket.on('charades_pass', ({ code }) => {
    const room = rooms[code];
    if (!room || room.state.phase !== 'acting') return;
    if (socket.id !== room.state.actorId) return;
    if (room.state.passesLeft <= 0) return;
    
    room.state.passesLeft--;
    room.state.lastWord = room.state.word;
    room.state.lastResult = 'passed';
    room.state.word = pickWord(room);
    broadcastState(io, room);
  });
  
  // Host clicks "Next Round" to advance
  socket.on('charades_next_round', ({ code }) => {
    const room = rooms[code];
    if (!room || socket.id !== room.hostId) return;
    if (room.state.phase === 'turn_end') {
      endRound(io, room);
    }
  });
  
  socket.on('charades_play_again', ({ code }) => {
    const room = rooms[code];
    if (!room || socket.id !== room.hostId) return;
    room.state = {
      phase: 'lobby',
      scores: { red: 0, blue: 0 },
      currentTeam: 'red',
      teamActorIdx: { red: 0, blue: 0 },
      actorId: null,
      word: null,
      wordsThisTurn: 0,
      passesLeft: 3,
      lastWord: null,
      lastResult: null,
      round: 1,
      timerEnd: null,
      timer: null,
      usedWords: new Set(),
    };
    broadcastState(io, room);
  });
  
  // Disconnect handling
  socket.on('disconnect', () => {
    for (const [code, room] of Object.entries(rooms)) {
      const player = room.players.find(p => p.id === socket.id);
      if (player) {
        player.connected = false;
        const connected = getConnected(room);
        if (connected.length === 0) {
          clearTimeout(room.state.timer);
          delete rooms[code];
        } else {
          if (socket.id === room.hostId) {
            room.hostId = connected[0].id;
          }
          // If current actor disconnected, end the turn
          if (socket.id === room.state.actorId && room.state.phase === 'acting') {
            clearTimeout(room.state.timer);
            room.state.phase = 'turn_end';
            room.state.lastResult = 'timeout';
            broadcastState(io, room);
            // Host clicks Next Round to continue
          } else {
            broadcastState(io, room);
          }
        }
      }
    }
  });
  
  socket.on('charades_rejoin', ({ code, name }) => {
    const room = rooms[code];
    if (!room) return socket.emit('charades_error', { message: 'Room not found' });
    const existing = room.players.find(p => p.name === name && !p.connected);
    if (existing) {
      existing.id = socket.id;
      existing.connected = true;
      socket.join(code);
      socket.emit('charades_room_joined', { code });
      broadcastState(io, room);
    } else if (room.state.phase === 'lobby') {
      const redCount = room.players.filter(p => p.team === 'red' && p.connected).length;
      const blueCount = room.players.filter(p => p.team === 'blue' && p.connected).length;
      const team = blueCount < redCount ? 'blue' : 'red';
      const player = { id: socket.id, name, team, connected: true };
      room.players.push(player);
      socket.join(code);
      socket.emit('charades_room_joined', { code });
      broadcastState(io, room);
    }
  });
  
  socket.on('charades_keep_alive', () => {});
}

function getCharadesRooms() {
  return Object.values(rooms)
    .filter(r => r.state.phase === 'lobby')
    .map(r => ({
      code: r.code,
      game: 'charades',
      hostName: r.players.find(p => p.id === r.hostId)?.name || '?',
      lang: r.settings.lang,
      players: r.players.filter(p => p.connected).length,
      maxPlayers: 12,
      isPublic: r.isPublic,
      createdAt: r.createdAt,
    }));
}

module.exports = { register, getCharadesRooms };
