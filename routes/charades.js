// ═══════════════════════════════════════════════════════
// CHARADES / KALAMBURY — Server Route (Team-based)
// ═══════════════════════════════════════════════════════

const rooms = {};

// ── Word lists: category → difficulty → lang → words ──
const WORDS = {
  animals: {
    kids: {
      pl: ['Kot','Pies','Ryba','Koń','Krowa','Świnia','Kaczka','Żaba','Królik','Miś','Motyl','Ślimak','Kurczak','Koza','Małpa','Lew','Słoń','Żółw','Pingwin','Mysz','Owca','Pająk','Biedronka','Papuga','Krokodyl','Dinozaur','Rekin','Delfin','Sowa','Chomik','Pszczoła','Mrówka','Robak','Nietoperz','Krab','Wąż','Ośmiornica','Hipopotam','Skunks','Dzięcioł','Łabędź','Wiewiórka','Wielbłąd','Osioł','Rozgwiazda','Komar','Mucha'],
      en: ['Cat','Dog','Fish','Horse','Cow','Pig','Duck','Frog','Rabbit','Bear','Butterfly','Snail','Chicken','Goat','Monkey','Lion','Elephant','Turtle','Penguin','Mouse','Sheep','Spider','Ladybug','Parrot','Crocodile','Dinosaur','Shark','Dolphin','Owl','Hamster','Bee','Ant','Worm','Bat','Crab','Snake','Octopus','Hippo','Skunk','Woodpecker','Swan','Squirrel','Camel','Donkey','Starfish','Mosquito','Fly'],
      de: ['Katze','Hund','Fisch','Pferd','Kuh','Schwein','Ente','Frosch','Hase','Bär','Schmetterling','Schnecke','Huhn','Ziege','Affe','Löwe','Elefant','Schildkröte','Pinguin','Maus','Schaf','Spinne','Marienkäfer','Papagei','Krokodil','Dinosaurier','Hai','Delfin','Eule','Hamster','Biene','Ameise','Wurm','Fledermaus','Krabbe','Schlange','Oktopus','Nilpferd','Stinktier','Specht','Schwan','Eichhörnchen','Kamel','Esel','Seestern','Mücke','Fliege'],
      sv: ['Katt','Hund','Fisk','Häst','Ko','Gris','Anka','Groda','Kanin','Björn','Fjäril','Snigel','Kyckling','Get','Apa','Lejon','Elefant','Sköldpadda','Pingvin','Mus','Får','Spindel','Nyckelpiga','Papegoja','Krokodil','Dinosaurie','Haj','Delfin','Uggla','Hamster','Bi','Myra','Mask','Fladdermus','Krabba','Orm','Bläckfisk','Flodhäst','Skunk','Hackspett','Svan','Ekorre','Kamel','Åsna','Sjöstjärna','Mygga','Fluga'],
    },
    family: {
      pl: ['Słoń','Żyrafa','Małpa','Kangur','Pingwin','Krokodyl','Delfin','Papuga','Pająk','Żółw','Lew','Tygrys','Orzeł','Rekin','Wieloryb','Sowa','Biedronka','Jeleń','Lis','Wilk','Goryl','Zebra','Flaming','Niedźwiedź','Koala','Kameleon','Nosorożec','Pirania','Ryba rozdymka','Konik polny','Skorpion','Mrówkojad','Borsuk','Bóbr','Bawół','Gepard','Żuraw','Jeleń','Delfin','Orzeł','Sokół','Jeż','Jaguar','Lemur','Lama','Kret','Wydra','Papuga','Pelikan','Gołąb','Puma','Kruk','Foka','Tukan','Łasica','Dzięcioł'],
      en: ['Elephant','Giraffe','Monkey','Kangaroo','Penguin','Crocodile','Dolphin','Parrot','Spider','Turtle','Lion','Tiger','Eagle','Shark','Whale','Owl','Ladybug','Deer','Fox','Wolf','Gorilla','Zebra','Flamingo','Bear','Koala','Chameleon','Rhinoceros','Piranha','Puffer fish','Grasshopper','Scorpion','Hippo','Peacock','Raccoon','Anteater','Badger','Beaver','Buffalo','Cheetah','Crane','Deer','Dolphin','Eagle','Falcon','Hedgehog','Jaguar','Lemur','Llama','Mole','Otter','Parrot','Pelican','Pigeon','Puma','Raven','Seal','Toucan','Weasel','Woodpecker'],
      de: ['Elefant','Giraffe','Affe','Känguru','Pinguin','Krokodil','Delfin','Papagei','Spinne','Schildkröte','Löwe','Tiger','Adler','Hai','Wal','Eule','Marienkäfer','Hirsch','Fuchs','Wolf','Gorilla','Zebra','Flamingo','Bär','Koala','Chamäleon','Nashorn','Piranha','Kugelfisch','Heuschrecke','Skorpion','Nilpferd','Pfau','Waschbär','Ameisenbär','Dachs','Biber','Büffel','Gepard','Kranich','Hirsch','Delfin','Adler','Falke','Igel','Jaguar','Lemur','Lama','Maulwurf','Otter','Papagei','Pelikan','Taube','Puma','Rabe','Robbe','Tukan','Wiesel','Specht'],
      sv: ['Elefant','Giraff','Apa','Känguru','Pingvin','Krokodil','Delfin','Papegoja','Spindel','Sköldpadda','Lejon','Tiger','Örn','Haj','Val','Uggla','Nyckelpiga','Hjort','Räv','Varg','Gorilla','Zebra','Flamingo','Björn','Koala','Kameleont','Noshörning','Piraya','Blåsfisk','Gräshoppa','Skorpion','Flodhäst','Påfågel','Tvättbjörn','Myrslok','Grävling','Bäver','Buffel','Gepard','Trana','Hjort','Delfin','Örn','Falk','Igelkott','Jaguar','Lemur','Lama','Mullvad','Utter','Papegoja','Pelikan','Duva','Puma','Korp','Säl','Tukan','Vessla','Hackspett'],
    },
    adults: {
      pl: ['Mrówkojad','Szakal','Kapibara','Narwal','Okapi','Lemur','Pelikan','Albatros','Fretka','Gazela','Homar','Meduza','Termit','Leniwiec','Wombat','Dziobak','Pancernik','Iguana','Waran z Komodo','Jeżozwierz','Surykatka','Rosomak','Manat','Łuskowiec','Kapibara','Hiena','Salamandra','Kameleon','Sęp','Pelikan','Barrakuda','Płaszczka','Łoś','Bizon','Tarantula','Meduza','Mors','Szynszyla','Fretka','Albatros'],
      en: ['Anteater','Jackal','Capybara','Narwhal','Okapi','Lemur','Pelican','Albatross','Ferret','Gazelle','Lobster','Jellyfish','Termite','Sloth','Wombat','Platypus','Armadillo','Iguana','Komodo dragon','Porcupine','Meerkat','Wolverine','Manatee','Pangolin','Capybara','Hyena','Salamander','Chameleon','Vulture','Pelican','Barracuda','Stingray','Moose','Bison','Tarantula','Jellyfish','Walrus','Chinchilla','Ferret','Albatross'],
      de: ['Ameisenbär','Schakal','Capybara','Narwal','Okapi','Lemur','Pelikan','Albatros','Frettchen','Gazelle','Hummer','Qualle','Termite','Faultier','Wombat','Schnabeltier','Gürteltier','Leguan','Komodowaran','Stachelschwein','Erdmännchen','Vielfraß','Seekuh','Pangolin','Capybara','Hyäne','Salamander','Chamäleon','Geier','Pelikan','Barrakuda','Stachelrochen','Elch','Bison','Vogelspinne','Qualle','Walross','Chinchilla','Frettchen','Albatros'],
      sv: ['Myrslok','Schakal','Kapybara','Narval','Okapi','Lemur','Pelikan','Albatross','Iller','Gasell','Hummer','Manet','Termit','Sengångare','Vombat','Näbbdjur','Bältdjur','Leguan','Komodovaran','Piggsvin','Surikat','Järv','Sjöko','Pangolin','Kapybara','Hyena','Salamander','Kameleont','Gam','Pelikan','Barracuda','Rocka','Älg','Bison','Tarantel','Manet','Valross','Chinchilla','Iller','Albatross'],
    },
  },
  actions: {
    kids: {
      pl: ['Spanie','Jedzenie','Picie','Skakanie','Bieganie','Pływanie','Latanie','Czesanie','Mycie rąk','Kąpiel','Rysowanie','Kopanie piłki','Klaskanie','Taniec','Płakanie','Śmiech','Chodzenie','Czołganie się','Wspinanie się','Chowanie się','Machanie','Dmuchanie','Kichanie','Ziewanie','Ubieranie się','Zamiatanie','Podlewanie kwiatów','Karmienie','Przytulanie','Głaskanie','Piątka','Zjeżdżanie','Posyłanie buziaka','Mruganie','Chodzenie na palcach','Maszerowanie','Jedzenie lodów','Zakładanie butów','Rozmowa telefoniczna','Otwieranie prezentu','Jedzenie spaghetti','Zdmuchiwanie świeczek','Picie przez słomkę','Pajacyki'],
      en: ['Sleeping','Eating','Drinking','Jumping','Running','Swimming','Flying','Combing hair','Washing hands','Bath','Drawing','Kicking ball','Clapping','Dancing','Crying','Laughing','Walking','Crawling','Climbing','Hiding','Waving','Blowing','Sneezing','Yawning','Getting dressed','Sweeping','Watering flowers','Feeding','Hugging','Petting','High five','Sliding','Blowing a kiss','Winking','Tiptoe walk','Marching','Eating ice cream','Putting on shoes','Phone call','Opening a present','Eating spaghetti','Blowing birthday candles','Drinking from straw','Jumping jacks'],
      de: ['Schlafen','Essen','Trinken','Springen','Laufen','Schwimmen','Fliegen','Haare kämmen','Hände waschen','Baden','Malen','Ball kicken','Klatschen','Tanzen','Weinen','Lachen','Gehen','Krabbeln','Klettern','Verstecken','Winken','Pusten','Niesen','Gähnen','Anziehen','Fegen','Blumen gießen','Füttern','Umarmen','Streicheln','High five','Rutschen','Kusshand','Zwinkern','Zehenspitzen-Gang','Marschieren','Eis essen','Schuhe anziehen','Telefonieren','Geschenk öffnen','Spaghetti essen','Kerzen ausblasen','Durch Strohhalm trinken','Hampelmänner'],
      sv: ['Sova','Äta','Dricka','Hoppa','Springa','Simma','Flyga','Kamma håret','Tvätta händerna','Bada','Rita','Sparka boll','Klappa','Dansa','Gråta','Skratta','Gå','Krypa','Klättra','Gömma sig','Vinka','Blåsa','Nysa','Gäspa','Klä på sig','Sopa','Vattna blommor','Mata','Krama','Smeka','High five','Rutscha','Slänga slängkyss','Blinka','Gå på tå','Marschera','Äta glass','Sätta på skor','Ringa','Öppna present','Äta spagetti','Blåsa ut ljus','Dricka med sugrör','Jumping jacks'],
    },
    family: {
      pl: ['Gotowanie','Malowanie','Granie na gitarze','Czytanie','Pisanie','Śpiewanie','Jazda na rowerze','Mycie zębów','Robienie zdjęcia','Granie w piłkę','Wspinaczka','Jazda na nartach','Dmuchanie balonów','Rzucanie piłką','Jazda samochodem','Odkurzanie','Wędkowanie','Suszenie włosów','Granie w tenisa','Skakanie na skakance','Oglądanie TV','Latanie samolotem','Przewracanie naleśników','Słuchanie muzyki','Pisanie listu','Strzyżenie','Pisanie na klawiaturze','Bitwa na śnieżki','Granie w golfa','Modlenie się','Wchodzenie pod górę','Branie prysznica','Karmienie psa','Prowadzenie auta','Granie na gitarze','Kręgle','Zabawa w chowanego','Przeciąganie liny','Malowanie','Łowienie ryb','Sadzenie','Podlewanie kwiatów','Zamiatanie','Odkurzanie','Składanie prania','Nakrywanie stołu','Pakowanie prezentu','Wydmuchiwanie nosa','Czesanie włosów','Wiązanie sznurówek','Obieranie banana','Nalewanie napoju','Mieszanie zupy','Rzucanie monetą','Siłowanie na rękę','Robienie pompek','Rozciąganie','Granie na perkusji'],
      en: ['Cooking','Painting','Guitar playing','Reading','Writing','Singing','Cycling','Brushing teeth','Photographing','Football','Climbing','Skiing','Blowing balloons','Throwing ball','Driving car','Vacuuming','Fishing','Hair drying','Tennis','Jump rope','Watching TV','Flying','Flipping pancakes','Listening to music','Writing letter','Cutting hair','Typing','Snowball fight','Playing golf','Praying','Climbing hill','Showering','Feeding dog','Driving a car','Playing guitar','Bowling','Hide and seek','Tug of war','Painting','Fishing','Planting','Watering flowers','Sweeping','Vacuuming','Folding laundry','Setting table','Wrapping present','Blowing nose','Combing hair','Tying shoelaces','Peeling banana','Pouring drink','Stirring soup','Flipping coin','Arm wrestling','Doing pushups','Stretching','Playing drums'],
      de: ['Kochen','Malen','Gitarre spielen','Lesen','Schreiben','Singen','Fahrrad fahren','Zähne putzen','Foto machen','Fußball spielen','Klettern','Skifahren','Luftballons aufblasen','Ball werfen','Auto fahren','Staubsaugen','Angeln','Haare föhnen','Tennis spielen','Seilspringen','Fernsehen','Fliegen im Flugzeug','Pfannkuchen wenden','Musik hören','Brief schreiben','Haare schneiden','Tippen','Schneeballschlacht','Golf spielen','Beten','Bergauf gehen','Duschen','Hund füttern','Auto fahren','Gitarre spielen','Bowling','Verstecken spielen','Tauziehen','Malen','Angeln','Pflanzen','Blumen gießen','Fegen','Staubsaugen','Wäsche falten','Tisch decken','Geschenk einpacken','Nase putzen','Haare kämmen','Schuhe binden','Banane schälen','Getränk einschenken','Suppe umrühren','Münze werfen','Armdrücken','Liegestütze','Dehnen','Schlagzeug spielen'],
      sv: ['Laga mat','Måla','Spela gitarr','Läsa','Skriva','Sjunga','Cykla','Borsta tänderna','Ta foto','Spela fotboll','Klättra','Åka skidor','Blåsa ballonger','Kasta boll','Köra bil','Dammsuga','Fiska','Föna håret','Spela tennis','Hoppa hopprep','Titta på TV','Flyga med flygplan','Vända pannkakor','Lyssna på musik','Skriva ett brev','Klippa hår','Skriva på tangentbord','Snöbollskrig','Spela golf','Be','Gå uppför','Duscha','Mata hunden','Köra bil','Spela gitarr','Bowling','Kurragömma','Dragkamp','Måla','Fiska','Plantera','Vattna blommor','Sopa','Dammsuga','Vika tvätt','Duka bordet','Slå in present','Snyta sig','Kamma håret','Knyta skor','Skala banan','Hälla dryck','Röra soppa','Singla slant','Armbrytning','Göra armhävningar','Stretcha','Spela trummor'],
    },
    adults: {
      pl: ['Prasowanie','Negocjowanie','Medytowanie','Szydełkowanie','Żonglowanie','Surfowanie','Dyrygowanie orkiestrą','Naprawianie samochodu','Prowadzenie wykładu','Robienie na drutach','Żonglowanie','Siłowanie na rękę','Chodzenie po linie','Bungee','Skoki spadochronowe','Nurkowanie','Szermierka','Pantomima','Lunatykowanie','Autostop','Joga','Prasowanie','Mycie podłogi','Ogrodnictwo','Robienie na drutach','Szycie','Pastowanie butów','Zmiana koła','Parkowanie równoległe','Dyrygowanie orkiestrą','Negocjowanie','Medytacja','Moonwalk','Breakdance','Taniec limbo','Walka na miecze','Kamień papier nożyce','Przeciąganie liny','Resuscytacja','Oświadczyny'],
      en: ['Ironing','Negotiating','Meditating','Crocheting','Juggling','Surfing','Conducting orchestra','Fixing a car','Giving a lecture','Knitting','Juggling','Arm wrestling','Tightrope walking','Bungee jumping','Skydiving','Scuba diving','Fencing','Mime','Sleepwalking','Hitchhiking','Yoga','Ironing','Mopping','Gardening','Knitting','Sewing','Polishing shoes','Changing a tire','Parallel parking','Conducting orchestra','Negotiating','Meditating','Moonwalking','Breakdancing','Limbo dancing','Sword fighting','Rock paper scissors','Tug of war','CPR','Proposing'],
      de: ['Bügeln','Verhandeln','Meditieren','Häkeln','Jonglieren','Surfen','Orchester dirigieren','Auto reparieren','Vortrag halten','Stricken','Jonglieren','Armdrücken','Seiltanzen','Bungee-Jumping','Fallschirmspringen','Tauchen','Fechten','Pantomime','Schlafwandeln','Trampen','Yoga','Bügeln','Wischen','Gärtnern','Stricken','Nähen','Schuhe putzen','Reifen wechseln','Einparken','Dirigieren','Verhandeln','Meditieren','Moonwalk','Breakdance','Limbo tanzen','Schwertkampf','Schere Stein Papier','Tauziehen','Wiederbelebung','Heiratsantrag'],
      sv: ['Stryka','Förhandla','Meditera','Virka','Jonglera','Surfa','Dirigera orkester','Laga bil','Hålla föreläsning','Sticka','Jonglera','Armbrytning','Lindans','Bungyjump','Fallskärmshoppning','Dyka','Fäktning','Pantomim','Sömngång','Lifta','Yoga','Stryka','Moppa','Trädgårdsarbete','Sticka','Sy','Putsa skor','Byta däck','Fickparkering','Dirigera orkester','Förhandla','Meditera','Moonwalk','Breakdance','Limbodans','Svärdsfäktning','Sten sax påse','Dragkamp','HLR','Frieri'],
    },
  },
  professions: {
    kids: {
      pl: ['Lekarz','Strażak','Policjant','Nauczyciel','Kucharz','Pilot','Astronauta','Księżniczka','Rycerz','Kowboj','Magik','Malarz','Tancerz','Piosenkarz','Kierowca','Piekarz','Ogrodnik','Clown','Król','Królowa','Listonosz','Weterynarz','Fotograf','Rolnik','Pielęgniarka','DJ','Rybak','Kasjer','Sprzątacz'],
      en: ['Doctor','Firefighter','Police','Teacher','Chef','Pilot','Astronaut','Princess','Knight','Cowboy','Magician','Painter','Dancer','Singer','Driver','Baker','Gardener','Clown','King','Queen','Postman','Vet','Photographer','Farmer','Nurse','DJ','Fisherman','Cashier','Janitor'],
      de: ['Arzt','Feuerwehrmann','Polizist','Lehrer','Koch','Pilot','Astronaut','Prinzessin','Ritter','Cowboy','Zauberer','Maler','Tänzer','Sänger','Fahrer','Bäcker','Gärtner','Clown','König','Königin','Briefträger','Tierarzt','Fotograf','Bauer','Krankenschwester','DJ','Fischer','Kassierer','Hausmeister'],
      sv: ['Läkare','Brandman','Polis','Lärare','Kock','Pilot','Astronaut','Prinsessa','Riddare','Cowboy','Trollkarl','Målare','Dansare','Sångare','Förare','Bagare','Trädgårdsmästare','Clown','Kung','Drottning','Brevbärare','Veterinär','Fotograf','Bonde','Sjuksköterska','DJ','Fiskare','Kassör','Städare'],
    },
    family: {
      pl: ['Dentysta','Fryzjer','Kierowca','Fotograf','Ogrodnik','Listonosz','Mechanik','Aktor','Sędzia','Weterynarz','Ratownik','Stolarz','Piekarz','Kelner','Detektyw','Dziennikarz','Ochroniarz','Przewodnik','Taksówkarz','Naukowiec','Hydraulik','Elektryk','Stolarz','Architekt','Bibliotekarz','Kelner','Barman','Recepcjonista','Chirurg','Ratownik medyczny','Prawnik','Sędzia','Marynarz','Żołnierz','Profesor','Florystka','Fryzjer','Krawiec','Trener','Sędzia sportowy'],
      en: ['Dentist','Hairdresser','Driver','Photographer','Gardener','Postman','Mechanic','Actor','Referee','Vet','Lifeguard','Carpenter','Baker','Waiter','Detective','Journalist','Security guard','Tour guide','Taxi driver','Scientist','Plumber','Electrician','Carpenter','Architect','Librarian','Waiter','Bartender','Receptionist','Surgeon','Paramedic','Lawyer','Judge','Sailor','Soldier','Professor','Florist','Barber','Tailor','Coach','Referee'],
      de: ['Zahnarzt','Friseur','Fahrer','Fotograf','Gärtner','Briefträger','Mechaniker','Schauspieler','Schiedsrichter','Tierarzt','Rettungsschwimmer','Tischler','Bäcker','Kellner','Detektiv','Journalist','Sicherheitsmann','Reiseleiter','Taxifahrer','Wissenschaftler','Klempner','Elektriker','Schreiner','Architekt','Bibliothekar','Kellner','Barkeeper','Rezeptionist','Chirurg','Sanitäter','Anwalt','Richter','Matrose','Soldat','Professor','Florist','Friseur','Schneider','Trainer','Schiedsrichter'],
      sv: ['Tandläkare','Frisör','Förare','Fotograf','Trädgårdsmästare','Brevbärare','Mekaniker','Skådespelare','Domare','Veterinär','Livräddare','Snickare','Bagare','Servitör','Detektiv','Journalist','Vakt','Turistguide','Taxichaufför','Forskare','Rörmokare','Elektriker','Snickare','Arkitekt','Bibliotekarie','Servitör','Bartender','Receptionist','Kirurg','Ambulanssjukvårdare','Advokat','Domare','Sjöman','Soldat','Professor','Florist','Frisör','Skräddare','Tränare','Domare'],
    },
    adults: {
      pl: ['Archeolog','Chirurg','Dyplomata','Farmaceuta','Geolog','Prawnik','Psycholog','Architekt','Księgowy','Tłumacz','Chirurg','Prawnik','Architekt','Elektryk','Hydraulik','Sommelier','Archeolog','Licytator','Kowal','Bibliotekarz','Terapeuta','Kręgarz','Barista','Tatuażysta','Florystka','Rzeźnik','Ślusarz','Krawiec','Optyk','Farmaceuta','Księgowy','Trener personalny','Kaskader','Opiekun zoo','Dyplomata','Tłumacz','Lalkarz','Grabarz','Sędzia','Kontroler lotów'],
      en: ['Archaeologist','Surgeon','Diplomat','Pharmacist','Geologist','Lawyer','Psychologist','Architect','Accountant','Translator','Surgeon','Lawyer','Architect','Electrician','Plumber','Sommelier','Archaeologist','Auctioneer','Blacksmith','Librarian','Therapist','Chiropractor','Barista','Tattoo artist','Florist','Butcher','Locksmith','Tailor','Optician','Pharmacist','Accountant','Personal trainer','Stuntman','Zookeeper','Diplomat','Interpreter','Puppeteer','Undertaker','Referee','Air traffic controller'],
      de: ['Archäologe','Chirurg','Diplomat','Apotheker','Geologe','Anwalt','Psychologe','Architekt','Buchhalter','Übersetzer','Chirurg','Anwalt','Architekt','Elektriker','Klempner','Sommelier','Archäologe','Auktionator','Schmied','Bibliothekar','Therapeut','Chiropraktiker','Barista','Tätowierer','Florist','Metzger','Schlosser','Schneider','Optiker','Apotheker','Buchhalter','Personal Trainer','Stuntman','Zoowärter','Diplomat','Dolmetscher','Puppenspieler','Bestatter','Schiedsrichter','Fluglotse'],
      sv: ['Arkeolog','Kirurg','Diplomat','Farmaceut','Geolog','Advokat','Psykolog','Arkitekt','Revisor','Översättare','Kirurg','Advokat','Arkitekt','Elektriker','Rörmokare','Sommelier','Arkeolog','Auktionist','Smed','Bibliotekarie','Terapeut','Kiropraktor','Barista','Tatuerare','Florist','Slaktare','Låssmed','Skräddare','Optiker','Apotekare','Revisor','Personlig tränare','Stuntman','Djurskötare','Diplomat','Tolk','Dockspelare','Begravningsentreprenör','Domare','Flygledare'],
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
      pl: ['Harry Potter','Król Lew','Piraci z Karaibów','Indiana Jones','Robin Hood','Aladyn','Kopciuszek','Tarzan','Peter Pan','Zorro','Rocky','Rambo','Terminator','E.T.','Toy Story','Simba','Chudy','Dory','Zygzak McQueen','Olaf','Roszpunka','Aladyn','Mulan','Vaiana','Kot w butach','Minionki','Grinch','Willy Wonka','Katniss','Neo','John Wick','Rambo','Leia','Chewbacca','Thanos'],
      en: ['Harry Potter','The Lion King','Pirates of the Caribbean','Indiana Jones','Robin Hood','Aladdin','Cinderella','Tarzan','Peter Pan','Zorro','Rocky','Rambo','Terminator','E.T.','Toy Story','Simba','Woody','Dory','Lightning McQueen','Olaf','Rapunzel','Aladdin','Mulan','Moana','Puss in Boots','Minions','Grinch','Willy Wonka','Katniss','Neo','John Wick','Rambo','Leia','Chewbacca','Thanos'],
      de: ['Harry Potter','König der Löwen','Fluch der Karibik','Indiana Jones','Robin Hood','Aladdin','Aschenputtel','Tarzan','Peter Pan','Zorro','Rocky','Rambo','Terminator','E.T.','Toy Story','Simba','Woody','Dory','Lightning McQueen','Olaf','Rapunzel','Aladdin','Mulan','Vaiana','Gestiefelter Kater','Minions','Grinch','Willy Wonka','Katniss','Neo','John Wick','Rambo','Leia','Chewbacca','Thanos'],
      sv: ['Harry Potter','Lejonkungen','Pirates of the Caribbean','Indiana Jones','Robin Hood','Aladdin','Askungen','Tarzan','Peter Pan','Zorro','Rocky','Rambo','Terminator','E.T.','Toy Story','Simba','Woody','Dory','Blixten McQueen','Olaf','Rapunzel','Aladdin','Mulan','Vaiana','Mästerkatten','Minions','Grinch','Willy Wonka','Katniss','Neo','John Wick','Rambo','Leia','Chewbacca','Thanos'],
    },
    adults: {
      pl: ['James Bond','Star Wars','Titanic','Jurassic Park','Matrix','Gladiator','Forrest Gump','Ojciec Chrzestny','Fight Club','Pulp Fiction','Gandalf','Darth Vader','James Bond','Indiana Jones','Jack Sparrow','Hermiona','Gollum','Yoda','Rocky','Terminator','Joker','Forrest Gump','Hannibal Lecter','E.T.','King Kong','Tarzan','Zorro','Drakula','Frankenstein','Wolverine','Deadpool','Sherlock Holmes','Robin Hood','Piotruś Pan','Mary Poppins','Lara Croft','Homer Simpson','Scooby-Doo','Tom i Jerry','Buzz Astral'],
      en: ['James Bond','Star Wars','Titanic','Jurassic Park','Matrix','Gladiator','Forrest Gump','The Godfather','Fight Club','Pulp Fiction','Gandalf','Darth Vader','James Bond','Indiana Jones','Jack Sparrow','Hermione','Gollum','Yoda','Rocky','Terminator','Joker','Forrest Gump','Hannibal Lecter','E.T.','King Kong','Tarzan','Zorro','Dracula','Frankenstein','Wolverine','Deadpool','Sherlock Holmes','Robin Hood','Peter Pan','Mary Poppins','Lara Croft','Homer Simpson','Scooby-Doo','Tom and Jerry','Buzz Lightyear'],
      de: ['James Bond','Star Wars','Titanic','Jurassic Park','Matrix','Gladiator','Forrest Gump','Der Pate','Fight Club','Pulp Fiction','Gandalf','Darth Vader','James Bond','Indiana Jones','Jack Sparrow','Hermine','Gollum','Yoda','Rocky','Terminator','Joker','Forrest Gump','Hannibal Lecter','E.T.','King Kong','Tarzan','Zorro','Dracula','Frankenstein','Wolverine','Deadpool','Sherlock Holmes','Robin Hood','Peter Pan','Mary Poppins','Lara Croft','Homer Simpson','Scooby-Doo','Tom und Jerry','Buzz Lightyear'],
      sv: ['James Bond','Star Wars','Titanic','Jurassic Park','Matrix','Gladiator','Forrest Gump','Gudfadern','Fight Club','Pulp Fiction','Gandalf','Darth Vader','James Bond','Indiana Jones','Jack Sparrow','Hermione','Gollum','Yoda','Rocky','Terminator','Joker','Forrest Gump','Hannibal Lecter','E.T.','King Kong','Tarzan','Zorro','Dracula','Frankenstein','Wolverine','Deadpool','Sherlock Holmes','Robin Hood','Peter Pan','Mary Poppins','Lara Croft','Homer Simpson','Scooby-Doo','Tom och Jerry','Buzz Lightyear'],
    },
  },
  food: {
    kids: {
      pl: ['Pizza','Lody','Tort','Jabłko','Banan','Mleko','Ciastko','Czekolada','Arbuz','Kanapka','Jajko','Marchewka','Pomidor','Truskawka','Winogrono','Kukurydza','Ser','Chleb','Makaron','Naleśnik','Gofr','Lizak','Guma do żucia','Popcorn','Sok','Hamburger','Klopsiki','Frytki','Ryż','Pączek','Pomarańcza','Winogrona','Ananas','Cytryna','Wiśnia','Kokos','Brokuł','Ogórek','Cebula','Woda','Babeczka','Chipsy','Jogurt','Tost','Płatki śniadaniowe'],
      en: ['Pizza','Ice cream','Cake','Apple','Banana','Milk','Cookie','Chocolate','Watermelon','Sandwich','Egg','Carrot','Tomato','Strawberry','Grape','Corn','Cheese','Bread','Pasta','Pancake','Waffle','Lollipop','Chewing gum','Popcorn','Juice','Burger','Meatballs','French Fries','Rice','Donut','Orange','Grapes','Pineapple','Lemon','Cherry','Coconut','Broccoli','Cucumber','Onion','Water','Cupcake','Crisps','Yoghurt','Toast','Cereal'],
      de: ['Pizza','Eis','Kuchen','Apfel','Banane','Milch','Keks','Schokolade','Wassermelone','Sandwich','Ei','Karotte','Tomate','Erdbeere','Traube','Mais','Käse','Brot','Nudeln','Pfannkuchen','Waffel','Lutscher','Kaugummi','Popcorn','Saft','Burger','Fleischbällchen','Pommes','Reis','Donut','Orange','Trauben','Ananas','Zitrone','Kirsche','Kokosnuss','Brokkoli','Gurke','Zwiebel','Wasser','Muffin','Chips','Joghurt','Toast','Müsli'],
      sv: ['Pizza','Glass','Tårta','Äpple','Banan','Mjölk','Kaka','Choklad','Vattenmelon','Smörgås','Ägg','Morot','Tomat','Jordgubbe','Druva','Majs','Ost','Bröd','Pasta','Pannkaka','Våffla','Klubba','Tuggummi','Popcorn','Juice','Hamburgare','Köttbullar','Pommes frites','Ris','Munk','Apelsin','Vindruvor','Ananas','Citron','Körsbär','Kokosnöt','Broccoli','Gurka','Lök','Vatten','Muffin','Chips','Yoghurt','Rostat bröd','Flingor'],
    },
    family: {
      pl: ['Spaghetti','Naleśniki','Jajecznica','Sałatka','Zupa','Hamburger','Hot dog','Popcorn','Pierogi','Kiełbasa','Gofr','Smoothie','Sushi','Grillowanie','Szaszłyk','Burrito','Puree ziemniaczane','Kolba kukurydzy','Sałata','Czosnek','Żelki','Bagietka','Taco','Nachos','Gofry','Bajgiel','Precel','Koktajl mleczny','Lasagne','Ravioli','Risotto','Stek','Omlet','Suflet','Sernik','Brownie','Bułka cynamonowa','Chleb czosnkowy','Krążki cebulowe','Nuggetsy','Ryba z frytkami','Sajgonka'],
      en: ['Spaghetti','Pancakes','Scrambled eggs','Salad','Soup','Hamburger','Hot dog','Popcorn','Dumplings','Sausage','Waffle','Smoothie','Sushi','BBQ','Kebab','Burrito','Mashed Potatoes','Corn on the Cob','Lettuce','Garlic','Gummies','Baguette','Taco','Nachos','Waffles','Bagel','Pretzel','Milkshake','Lasagna','Ravioli','Risotto','Steak','Omelette','Souffle','Cheesecake','Brownie','Cinnamon roll','Garlic bread','Onion rings','Chicken nuggets','Fish and chips','Spring roll'],
      de: ['Spaghetti','Pfannkuchen','Rührei','Salat','Suppe','Hamburger','Hot Dog','Popcorn','Maultaschen','Wurst','Waffel','Smoothie','Sushi','Grillen','Kebab','Burrito','Kartoffelpüree','Maiskolben','Salat','Knoblauch','Gummibärchen','Baguette','Taco','Nachos','Waffeln','Bagel','Brezel','Milchshake','Lasagne','Ravioli','Risotto','Steak','Omelett','Soufflé','Käsekuchen','Brownie','Zimtschnecke','Knoblauchbrot','Zwiebelringe','Chicken Nuggets','Fish and Chips','Frühlingsrolle'],
      sv: ['Spaghetti','Pannkakor','Äggröra','Sallad','Soppa','Hamburgare','Korv med bröd','Popcorn','Piroger','Korv','Våffla','Smoothie','Sushi','Grilla','Kebab','Burrito','Potatismos','Majskolv','Sallad','Vitlök','Godis','Baguette','Taco','Nachos','Våfflor','Bagel','Kringla','Milkshake','Lasagne','Ravioli','Risotto','Biff','Omelett','Sufflé','Cheesecake','Brownie','Kanelbulle','Vitlöksbröd','Lökringar','Kycklingnuggets','Fish and chips','Vårrullar'],
    },
    adults: {
      pl: ['Fondue','Carpaccio','Tiramisu','Creme brulee','Gazpacho','Ratatouille','Paella','Risotto','Guacamole','Tartare','Sushi','Ramen','Homar','Ostryga','Kawior','Fondue','Paella','Gulasz','Dim sum','Croissant','Precel','Tiramisu','Crème brûlée','Suflet','Gazpacho','Carpaccio','Tatar','Ślimaki','Pad Thai','Falafel','Hummus','Kimchi','Wasabi','Trufla','Risotto','Gnocchi','Ceviche','Bruschetta','Churros','Baklawa'],
      en: ['Fondue','Carpaccio','Tiramisu','Creme brulee','Gazpacho','Ratatouille','Paella','Risotto','Guacamole','Tartare','Sushi','Ramen','Lobster','Oyster','Caviar','Fondue','Paella','Goulash','Dim sum','Croissant','Pretzel','Tiramisu','Crème brûlée','Soufflé','Gazpacho','Carpaccio','Beef tartare','Escargot','Pad Thai','Falafel','Hummus','Kimchi','Wasabi','Truffle','Risotto','Gnocchi','Ceviche','Bruschetta','Churros','Baklava'],
      de: ['Fondue','Carpaccio','Tiramisu','Crème brûlée','Gazpacho','Ratatouille','Paella','Risotto','Guacamole','Tatar','Sushi','Ramen','Hummer','Auster','Kaviar','Fondue','Paella','Gulasch','Dim Sum','Croissant','Brezel','Tiramisu','Crème brûlée','Soufflé','Gazpacho','Carpaccio','Rindertatar','Schnecken','Pad Thai','Falafel','Hummus','Kimchi','Wasabi','Trüffel','Risotto','Gnocchi','Ceviche','Bruschetta','Churros','Baklava'],
      sv: ['Fondue','Carpaccio','Tiramisu','Crème brûlée','Gazpacho','Ratatouille','Paella','Risotto','Guacamole','Tartare','Sushi','Ramen','Hummer','Ostron','Kaviar','Fondue','Paella','Gulasch','Dim sum','Croissant','Kringla','Tiramisu','Crème brûlée','Sufflé','Gazpacho','Carpaccio','Råbiff','Sniglar','Pad Thai','Falafel','Hummus','Kimchi','Wasabi','Tryffel','Risotto','Gnocchi','Ceviche','Bruschetta','Churros','Baklava'],
    },
  },
  sports: {
    kids: {
      pl: ['Piłka nożna','Koszykówka','Pływanie','Bieganie','Skakanie','Jazda na rowerze','Taniec','Gimnastyka','Karate','Hokej','Jazda na hulajnodze','Rzucanie piłką','Łapanie piłki','Skakanie na skakance','Jazda na łyżwach','Hula-hop','Ping-pong','Badminton','Jazda na deskorolce','Piłka ręczna','Boks','Judo','Wrestling','Siatkówka','Surfing','Baseball','Jazda na rolkach','Frisbee','Klasy','Cheerleading','Sztafeta','Kickball'],
      en: ['Football','Basketball','Swimming','Running','Jumping','Cycling','Dancing','Gymnastics','Karate','Hockey','Scooter riding','Throwing ball','Catching ball','Jump rope','Ice skating','Hula hoop','Ping pong','Badminton','Skateboarding','Handball','Boxing','Judo','Wrestling','Volleyball','Surfing','Baseball','Roller skating','Frisbee','Hopscotch','Cheerleading','Relay race','Kickball'],
      de: ['Fußball','Basketball','Schwimmen','Laufen','Springen','Radfahren','Tanzen','Turnen','Karate','Hockey','Rollerfahren','Ball werfen','Ball fangen','Seilspringen','Eislaufen','Hula-Hoop','Tischtennis','Badminton','Skateboarden','Handball','Boxen','Judo','Ringen','Volleyball','Surfen','Baseball','Rollschuhlaufen','Frisbee','Hüpfspiel','Cheerleading','Staffellauf','Kickball'],
      sv: ['Fotboll','Basket','Simning','Löpning','Hopp','Cykling','Dans','Gymnastik','Karate','Hockey','Sparkcykel','Kasta boll','Fånga boll','Hoppa hopprep','Skridskoåkning','Rockring','Pingis','Badminton','Skateboard','Handboll','Boxning','Judo','Brottning','Volleyboll','Surfing','Baseball','Rullskridskor','Frisbee','Hoppa hage','Cheerleading','Stafettlopp','Kickball'],
    },
    family: {
      pl: ['Tenis','Siatkówka','Golf','Łucznictwo','Szermierka','Surfing','Wspinaczka','Boks','Wrestling','Jazda konna','Narciarstwo','Snowboard','Łyżwiarstwo','Skateboarding','Wiosłowanie','Wspinaczka skałkowa','Podnoszenie ciężarów','Nurkowanie z rurką','Parkour','Skok o tyczce','Sumo','Kajakarstwo','Żeglarstwo','Narty wodne','Paralotniarstwo','Kolarstwo górskie','Biegi narciarskie','Łyżwiarstwo szybkie','Skoki na trampolinie','Rzut oszczepem','Rzut dyskiem','Pięciobój','Dwa ognie','Krykiet','Rugby','Squash','Rzutki','Bilard','Piłka ręczna','Lacrosse','Wioślarstwo'],
      en: ['Tennis','Volleyball','Golf','Archery','Fencing','Surfing','Climbing','Boxing','Wrestling','Horse riding','Skiing','Snowboarding','Ice skating','Skateboarding','Rowing','Rock climbing','Weightlifting','Snorkeling','Parkour','Pole vault','Sumo wrestling','Canoeing','Sailing','Water skiing','Paragliding','Mountain biking','Cross-country skiing','Speed skating','Trampolining','Javelin throw','Discus throw','Pentathlon','Dodgeball','Cricket','Rugby','Squash','Darts','Billiards','Handball','Lacrosse','Rowing'],
      de: ['Tennis','Volleyball','Golf','Bogenschießen','Fechten','Surfen','Klettern','Boxen','Ringen','Reiten','Skifahren','Snowboarden','Eislaufen','Skateboarden','Rudern','Klettern','Gewichtheben','Schnorcheln','Parkour','Stabhochsprung','Sumo-Ringen','Kanufahren','Segeln','Wasserski','Paragliding','Mountainbiken','Langlauf','Eisschnelllauf','Trampolinturnen','Speerwerfen','Diskuswerfen','Fünfkampf','Völkerball','Cricket','Rugby','Squash','Darts','Billard','Handball','Lacrosse','Rudern'],
      sv: ['Tennis','Volleyboll','Golf','Bågskytte','Fäktning','Surfning','Klättring','Boxning','Brottning','Ridning','Skidåkning','Snowboard','Skridskoåkning','Skateboard','Rodd','Klippklättring','Tyngdlyftning','Snorkling','Parkour','Stavhopp','Sumobrottning','Kanot','Segling','Vattenskidåkning','Paragliding','Mountainbike','Längdskidåkning','Skridskoåkning','Trampolin','Spjutkast','Diskuskast','Femkamp','Brännboll','Cricket','Rugby','Squash','Dart','Biljard','Handboll','Lacrosse','Rodd'],
    },
    adults: {
      pl: ['Polo','Krykiet','Curling','Triathlon','Bobslej','Skeleton','Biathlon','Pentathlon','Kendo','Capoeira','Szermierka','Polo','Piłka wodna','Pływanie synchroniczne','Łyżwiarstwo figurowe','Curling','Pchnięcie kulą','Rzut dyskiem','Rzut oszczepem','Skok wzwyż','Skok w dal','Płotki','Triathlon','Dziesięciobój','Pięciobój','Bobslej','Saneczkarstwo','Krykiet','Rugby','Lacrosse','Squash','Piłka ręczna','Tenis stołowy','Rzutki','Bilard','Motocross','Formuła 1','Żeglarstwo','Kajakarstwo','Windsurfing'],
      en: ['Polo','Cricket','Curling','Triathlon','Bobsled','Skeleton','Biathlon','Pentathlon','Kendo','Capoeira','Fencing','Polo','Water polo','Synchronized swimming','Figure skating','Curling','Shot put','Discus throw','Javelin throw','High jump','Long jump','Hurdles','Triathlon','Decathlon','Pentathlon','Bobsled','Luge','Cricket','Rugby','Lacrosse','Squash','Handball','Table tennis','Darts','Billiards','Motocross','Formula 1','Sailing','Kayaking','Windsurfing'],
      de: ['Polo','Cricket','Curling','Triathlon','Bobfahren','Skeleton','Biathlon','Fünfkampf','Kendo','Capoeira','Fechten','Polo','Wasserball','Synchronschwimmen','Eiskunstlauf','Curling','Kugelstoßen','Diskuswerfen','Speerwerfen','Hochsprung','Weitsprung','Hürdenlauf','Triathlon','Zehnkampf','Fünfkampf','Bobfahren','Rodeln','Cricket','Rugby','Lacrosse','Squash','Handball','Tischtennis','Darts','Billard','Motocross','Formel 1','Segeln','Kajakfahren','Windsurfen'],
      sv: ['Polo','Cricket','Curling','Triathlon','Bobsled','Skeleton','Skidskytte','Femkamp','Kendo','Capoeira','Fäktning','Polo','Vattenpolo','Konstsim','Konståkning','Curling','Kulstötning','Diskuskast','Spjutkast','Höjdhopp','Längdhopp','Häcklöpning','Triathlon','Tiokamp','Femkamp','Bob','Rodel','Cricket','Rugby','Lacrosse','Squash','Handboll','Bordtennis','Dart','Biljard','Motocross','Formel 1','Segling','Kajakpaddling','Windsurfing'],
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
    // Cascade: adults get adults+family+kids, family gets family+kids
    let pool = [];
    const catWords = WORDS[chosenCat];
    if (!catWords) continue;
    const getLang = (d) => (catWords[d] && catWords[d][lang]) || (catWords[d] && catWords[d]['en']) || [];
    if (diff === 'adults') {
      pool = [...getLang('adults'), ...getLang('family'), ...getLang('kids')];
    } else if (diff === 'family') {
      pool = [...getLang('family'), ...getLang('kids')];
    } else {
      pool = getLang('kids');
    }
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

function getWordCount(room) {
  const cat = room.settings.category;
  const diff = room.settings.difficulty;
  const lang = room.settings.lang || 'en';
  const categories = cat === 'mixed' ? Object.keys(WORDS) : [cat];
  let total = 0;
  const getLang = (catWords, d) => (catWords[d] && catWords[d][lang]) || (catWords[d] && catWords[d]['en']) || [];
  categories.forEach(c => {
    const catWords = WORDS[c];
    if (!catWords) return;
    if (diff === 'adults') {
      total += getLang(catWords, 'adults').length + getLang(catWords, 'family').length + getLang(catWords, 'kids').length;
    } else if (diff === 'family') {
      total += getLang(catWords, 'family').length + getLang(catWords, 'kids').length;
    } else {
      total += getLang(catWords, 'kids').length;
    }
  });
  return total;
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
    wordCount: getWordCount(room),
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

function prepareTurn(io, room) {
  const actor = pickNextActor(room);
  if (!actor) return;
  
  room.state.actorId = actor.id;
  room.state.word = null; // Don't pick word yet — wait for Ready
  room.state.wordsThisTurn = 0;
  room.state.passesLeft = 3;
  room.state.lastWord = null;
  room.state.lastResult = null;
  room.state.phase = 'preparing';
  
  broadcastState(io, room);
}

function startTurn(io, room) {
  room.state.word = pickWord(room);
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
    prepareTurn(io, room);
  }
}

function register(io, socket) {
  
  socket.on('charades_create', ({ name, settings }) => {
    const code = Math.random().toString(36).substring(2, 7).toUpperCase();
    const player = { id: socket.id, name: name || 'Player', team: 'red', connected: true };
    rooms[code] = {
      code,
      hostId: socket.id,
      _createdAt: Date.now(),
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
    code = (code || '').toUpperCase().trim();
    const room = rooms[code];
    if (!room) return socket.emit('charades_error', { message: 'Room not found' });
    
    // Check if this is a returning player (same name)
    const existing = room.players.find(p => p.name === (name || '').trim());
    if (existing) {
      // Returning player — update socket and rejoin
      if (room.hostId === existing.id) room.hostId = socket.id;
      if (room.state.actorId === existing.id) room.state.actorId = socket.id;
      existing.id = socket.id;
      existing.connected = true;
      socket.join(code);
      socket.emit('charades_room_joined', { code });
      broadcastState(io, room);
      return;
    }
    
    // New player — only allowed during lobby
    if (room.state.phase !== 'lobby') return socket.emit('charades_error', { message: 'Game already started' });
    if (room.players.length >= 40) return socket.emit('charades_error', { message: 'Room is full (max 40)' });
    
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
    if (!room) return;
    // Host can move anyone, players can move themselves
    if (socket.id !== room.hostId && socket.id !== playerId) return;
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
    if (redTeam.length < 2 || blueTeam.length < 2) { socket.emit("charades_error", { message: "Need at least 2 players per team (4 total)" }); return; }
    
    room.state.round = 1;
    room.state.scores = { red: 0, blue: 0 };
    room.state.currentTeam = 'red';
    room.state.teamActorIdx = { red: 0, blue: 0 };
    room.state.usedWords = new Set();
    prepareTurn(io, room);
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
  
  // Actor presses "I'm Ready!" to start their turn
  socket.on('charades_ready', ({ code }) => {
    const room = rooms[code];
    if (!room || room.state.phase !== 'preparing') return;
    if (socket.id !== room.state.actorId) return;
    startTurn(io, room);
  });
  
  socket.on('charades_leave', ({ code }) => {
    code = (code || '').toUpperCase().trim();
    const room = rooms[code];
    if (!room) return;
    const player = room.players.find(p => p.id === socket.id);
    if (player) {
      player.connected = false;
      socket.leave(code);
      const connected = getConnected(room);
      if (connected.length === 0) {
        clearTimeout(room.state.timer);
        room._deleteTimer = setTimeout(() => {
          const still = room.players.filter(p => p.connected);
          if (still.length === 0) delete rooms[code];
        }, 30 * 60 * 1000);
      } else {
        if (socket.id === room.hostId) room.hostId = connected[0].id;
        broadcastState(io, room);
      }
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
          // Grace period — keep room alive for 2 minutes in case everyone comes back
          room._deleteTimer = setTimeout(() => {
            const stillConnected = room.players.filter(p => p.connected);
            if (stillConnected.length === 0) delete rooms[code];
          }, 30 * 60 * 1000);
        } else {
          // Cancel delete timer if someone is still here
          if (room._deleteTimer) { clearTimeout(room._deleteTimer); room._deleteTimer = null; }
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
    code = (code || '').toUpperCase().trim();
    const room = rooms[code];
    if (!room) return socket.emit('charades_error', { message: 'Room not found' });
    const existing = room.players.find(p => p.name === name);
    if (existing) {
      // Update socket ID and rejoin room
      if (room.hostId === existing.id) room.hostId = socket.id;
      if (room.state.actorId === existing.id) room.state.actorId = socket.id;
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
      maxPlayers: 40,
      isPublic: r.isPublic,
      createdAt: r.createdAt,
    }));
}

module.exports = { getRooms: () => rooms, register, getCharadesRooms };
