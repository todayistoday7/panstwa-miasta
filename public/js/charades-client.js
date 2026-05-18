// ═══════════════════════════════════════════════════════
// CHARADES / KALAMBURY — Client (Team-based)
// ═══════════════════════════════════════════════════════
const socket = io();
window._gameSocket = socket;
var _prevPlayerCount = 0;

// ── Emoji hints for kids mode ──
const EMOJI_HINTS = {
  'Cat':'🐱','Kot':'🐱','Katze':'🐱','Katt':'🐱',
  'Dog':'🐶','Pies':'🐶','Hund':'🐶',
  'Fish':'🐟','Ryba':'🐟','Fisk':'🐟','Fisch':'🐟',
  'Bird':'🐦','Ptak':'🐦','Vogel':'🐦','Fågel':'🐦',
  'Horse':'🐴','Koń':'🐴','Pferd':'🐴','Häst':'🐴',
  'Cow':'🐄','Krowa':'🐄','Kuh':'🐄','Ko':'🐄',
  'Pig':'🐷','Świnia':'🐷','Schwein':'🐷','Gris':'🐷',
  'Duck':'🦆','Kaczka':'🦆','Ente':'🦆','Anka':'🦆',
  'Frog':'🐸','Żaba':'🐸','Frosch':'🐸','Groda':'🐸',
  'Rabbit':'🐰','Królik':'🐰','Hase':'🐰','Kanin':'🐰',
  'Bear':'🐻','Miś':'🐻','Bär':'🐻','Björn':'🐻',
  'Butterfly':'🦋','Motyl':'🦋','Schmetterling':'🦋','Fjäril':'🦋',
  'Snail':'🐌','Ślimak':'🐌','Schnecke':'🐌','Snigel':'🐌',
  'Chicken':'🐔','Kurczak':'🐔','Huhn':'🐔','Kyckling':'🐔',
  'Goat':'🐐','Koza':'🐐','Ziege':'🐐','Get':'🐐',
  'Sleeping':'😴','Spanie':'😴','Schlafen':'😴','Sova':'😴',
  'Eating':'🍽️','Jedzenie':'🍽️','Essen':'🍽️','Äta':'🍽️',
  'Drinking':'🥤','Picie':'🥤','Trinken':'🥤','Dricka':'🥤',
  'Jumping':'🦘','Skakanie':'🦘','Springen':'🦘','Hoppa':'🦘',
  'Running':'🏃','Bieganie':'🏃','Laufen':'🏃','Springa':'🏃',
  'Swimming':'🏊','Pływanie':'🏊','Schwimmen':'🏊','Simma':'🏊',
  'Flying':'✈️','Latanie':'✈️','Fliegen':'✈️','Flyga':'✈️',
  'Drawing':'✏️','Rysowanie':'✏️','Malen':'✏️','Rita':'✏️',
  'Dancing':'💃','Taniec':'💃','Tanzen':'💃','Dansa':'💃',
  'Crying':'😢','Płakanie':'😢','Weinen':'😢','Gråta':'😢',
  'Clapping':'👏','Klaskanie':'👏','Klatschen':'👏','Klappa':'👏',
  'Doctor':'👨‍⚕️','Lekarz':'👨‍⚕️','Arzt':'👨‍⚕️','Läkare':'👨‍⚕️',
  'Firefighter':'🧑‍🚒','Strażak':'🧑‍🚒','Feuerwehrmann':'🧑‍🚒','Brandman':'🧑‍🚒',
  'Police':'👮','Policjant':'👮','Polizist':'👮','Polis':'👮',
  'Teacher':'👩‍🏫','Nauczyciel':'👩‍🏫','Lehrer':'👩‍🏫','Lärare':'👩‍🏫',
  'Chef':'👨‍🍳','Kucharz':'👨‍🍳','Koch':'👨‍🍳','Kock':'👨‍🍳',
  'Pirate':'🏴‍☠️','Pirat':'🏴‍☠️',
  'Astronaut':'🧑‍🚀','Astronauta':'🧑‍🚀',
  'Princess':'👸','Księżniczka':'👸','Prinzessin':'👸','Prinsessa':'👸',
  'Knight':'⚔️','Rycerz':'⚔️','Ritter':'⚔️','Riddare':'⚔️',
  'Cowboy':'🤠','Kowboj':'🤠',
  'Magician':'🎩','Magik':'🎩','Zauberer':'🎩','Trollkarl':'🎩',
  'Pizza':'🍕','Ice cream':'🍦','Lody':'🍦','Eis':'🍦','Glass':'🍦',
  'Cake':'🎂','Tort':'🎂','Kuchen':'🎂','Tårta':'🎂',
  'Apple':'🍎','Jabłko':'🍎','Apfel':'🍎','Äpple':'🍎',
  'Banana':'🍌','Banan':'🍌','Banane':'🍌',
  'Milk':'🥛','Mleko':'🥛','Milch':'🥛','Mjölk':'🥛',
  'Cookie':'🍪','Ciastko':'🍪','Keks':'🍪','Kaka':'🍪',
  'Chocolate':'🍫','Czekolada':'🍫','Schokolade':'🍫','Choklad':'🍫',
  'Watermelon':'🍉','Arbuz':'🍉','Wassermelone':'🍉','Vattenmelon':'🍉',
  'Sandwich':'🥪','Kanapka':'🥪','Smörgås':'🥪',
  'Football':'⚽','Piłka nożna':'⚽','Fußball':'⚽','Fotboll':'⚽',
  'Basketball':'🏀','Koszykówka':'🏀','Basket':'🏀',
  'Superman':'🦸','Batman':'🦇','Spider-Man':'🕷️','Elsa':'❄️',
  'Shrek':'🟢','Nemo':'🐠','Pikachu':'⚡','Mickey Mouse':'🐭','Musse Pigg':'🐭',
  'Scooby-Doo':'🐕','SpongeBob':'🧽','Spongebob':'🧽','Svampbob':'🧽',
  'Affe':'🐒',
  'Apa':'🐒',
  'Bagare':'🍞',
  'Baker':'🍞',
  'Bambi':'🦌',
  'Bluey':'🐕',
  'Bread':'🍞',
  'Brevbärare':'📬',
  'Briefträger':'📬',
  'Brot':'🍞',
  'Bröd':'🍞',
  'Buzz Lightyear':'🚀',
  'Bäcker':'🍞',
  'Carrot':'🥕',
  'Cheese':'🧀',
  'Chleb':'🍞',
  'Chodzenie':'🚶',
  'Chowanie się':'🫣',
  'Climbing':'🧗',
  'Clown':'🤡',
  'Corn':'🌽',
  'Crawling':'🐛',
  'Czołganie się':'🐛',
  'Delfin':'🐬',
  'Dinosaur':'🦕',
  'Dinosaurie':'🦕',
  'Dinosaurier':'🦕',
  'Dinozaur':'🦕',
  'Dolphin':'🐬',
  'Donald Duck':'🦆',
  'Dora':'🗺️',
  'Driver':'🚗',
  'Drottning':'👸',
  'Druva':'🍇',
  'Dumbo':'🐘',
  'Egg':'🥚',
  'Ei':'🥚',
  'Elefant':'🐘',
  'Elephant':'🐘',
  'Erdbeere':'🍓',
  'Eule':'🦉',
  'Fahrer':'🚗',
  'Fotograf':'📸',
  'Får':'🐑',
  'Förare':'🚗',
  'Gardener':'🌻',
  'Garfield':'🐱',
  'Gehen':'🚶',
  'Gofr':'🧇',
  'Goldfisch':'🐠',
  'Goldfish':'🐠',
  'Goofy':'🐶',
  'Grape':'🍇',
  'Greta Gris':'🐷',
  'Guldfisk':'🐠',
  'Gähnen':'🥱',
  'Gärtner':'🌻',
  'Gäspa':'🥱',
  'Gå':'🚶',
  'Gömma sig':'🫣',
  'Hai':'🦈',
  'Haj':'🦈',
  'Hiding':'🫣',
  'Hugging':'🤗',
  'Jajko':'🥚',
  'Jordgubbe':'🍓',
  'Juice':'🧃',
  'Kalle Anka':'🦆',
  'Karotte':'🥕',
  'Kichanie':'🤧',
  'Kierowca':'🚗',
  'King':'👑',
  'Klettern':'🧗',
  'Klubba':'🍭',
  'Klättra':'🧗',
  'Krabbeln':'🐛',
  'Krama':'🤗',
  'Krypa':'🐛',
  'Król':'👑',
  'Królowa':'👸',
  'Kukurydza':'🌽',
  'Kung':'👑',
  'Käse':'🧀',
  'König':'👑',
  'Königin':'👸',
  'Lachen':'😂',
  'Laughing':'😂',
  'Lejon':'🦁',
  'Lew':'🦁',
  'Lion':'🦁',
  'Listonosz':'📬',
  'Lizak':'🍭',
  'Lollipop':'🍭',
  'Lutscher':'🍭',
  'Långansen':'🐶',
  'Löwe':'🦁',
  'Machanie':'👋',
  'Mais':'🌽',
  'Majs':'🌽',
  'Makaron':'🍝',
  'Marchewka':'🥕',
  'Maus':'🐭',
  'Małpa':'🐒',
  'Mimmi Pigg':'🎀',
  'Minnie Maus':'🎀',
  'Minnie Mouse':'🎀',
  'Monkey':'🐒',
  'Morot':'🥕',
  'Mouse':'🐭',
  'Mus':'🐭',
  'Mysz':'🐭',
  'Myszka Minnie':'🎀',
  'Naleśnik':'🥞',
  'Niesen':'🤧',
  'Nudeln':'🍝',
  'Nysa':'🤧',
  'Ogrodnik':'🌻',
  'Olaf':'⛄',
  'Ost':'🧀',
  'Owca':'🐑',
  'Owl':'🦉',
  'Pancake':'🥞',
  'Pannkaka':'🥞',
  'Papagei':'🦜',
  'Papegoja':'🦜',
  'Papuga':'🦜',
  'Parrot':'🦜',
  'Pasta':'🍝',
  'Paw Patrol':'🐾',
  'Penguin':'🐧',
  'Peppa Pig':'🐷',
  'Peppa Wutz':'🐷',
  'Pfannkuchen':'🥞',
  'Photographer':'📸',
  'Piekarz':'🍞',
  'Pinguin':'🐧',
  'Pingvin':'🐧',
  'Pingwin':'🐧',
  'Pomidor':'🍅',
  'Popcorn':'🍿',
  'Postman':'📬',
  'Przytulanie':'🤗',
  'Queen':'👸',
  'Rekin':'🦈',
  'Saft':'🧃',
  'Schaf':'🐑',
  'Schildkröte':'🐢',
  'Ser':'🧀',
  'Shark':'🦈',
  'Sheep':'🐑',
  'Simba':'🦁',
  'Skratta':'😂',
  'Sköldpadda':'🐢',
  'Sneezing':'🤧',
  'Sok':'🧃',
  'Sowa':'🦉',
  'Stitch':'👽',
  'Strawberry':'🍓',
  'Superbohater':'🦸',
  'Superheld':'🦸',
  'Superhero':'🦸',
  'Superhjälte':'🦸',
  'Słoń':'🐘',
  'Tierarzt':'🩺',
  'Tom and Jerry':'🐱',
  'Tom i Jerry':'🐱',
  'Tom och Jerry':'🐱',
  'Tom und Jerry':'🐱',
  'Tomat':'🍅',
  'Tomate':'🍅',
  'Tomato':'🍅',
  'Traube':'🍇',
  'Truskawka':'🍓',
  'Trädgårdsmästare':'🌻',
  'Turtle':'🐢',
  'Uggla':'🦉',
  'Umarmen':'🤗',
  'Verstecken':'🫣',
  'Vet':'🩺',
  'Veterinär':'🩺',
  'Vinka':'👋',
  'Våffla':'🧇',
  'Waffel':'🧇',
  'Waffle':'🧇',
  'Walking':'🚶',
  'Waving':'👋',
  'Weterynarz':'🩺',
  'Winken':'👋',
  'Winogrono':'🍇',
  'Wspinanie się':'🧗',
  'Yawning':'🥱',
  'Ziewanie':'🥱',
  'Ägg':'🥚',
  'Śmiech':'😂',
  'Żółw':'🐢',
  'Anziehen':'👔',
  'Bada':'🛁',
  'Baden':'🛁',
  'Badminton':'🏸',
  'Ball fangen':'🤲',
  'Ball kicken':'⚽',
  'Ball werfen':'🤾',
  'Bath':'🛁',
  'Biedronka':'🐞',
  'Blowing':'🌬️',
  'Blumen gießen':'🌻',
  'Blåsa':'🌬️',
  'Boks':'🥊',
  'Boxen':'🥊',
  'Boxing':'🥊',
  'Boxning':'🥊',
  'Brottning':'🤼',
  'Catching ball':'🤲',
  'Chewing gum':'🫧',
  'Combing hair':'💇',
  'Crocodile':'🐊',
  'Cycling':'🚴',
  'Cykling':'🚴',
  'Czesanie':'💇',
  'Dancer':'💃',
  'Dansare':'💃',
  'Dmuchanie':'🌬️',
  'Eislaufen':'⛸️',
  'Feeding':'🍼',
  'Fegen':'🧹',
  'Fånga boll':'🤲',
  'Füttern':'🍼',
  'Getting dressed':'👔',
  'Gimnastyka':'🤸',
  'Guma do żucia':'🫧',
  'Gymnastics':'🤸',
  'Gymnastik':'🤸',
  'Głaskanie':'🐾',
  'Haare kämmen':'💇',
  'Handball':'🤾',
  'Handboll':'🤾',
  'Hockey':'🏒',
  'Hokej':'🏒',
  'Hoppa hopprep':'⏫',
  'Hula hoop':'⭕',
  'Hula-Hoop':'⭕',
  'Hula-hop':'⭕',
  'Hände waschen':'🧼',
  'Ice skating':'⛸️',
  'Jazda na deskorolce':'🛹',
  'Jazda na hulajnodze':'🛴',
  'Jazda na rowerze':'🚴',
  'Jazda na łyżwach':'⛸️',
  'Judo':'🥋',
  'Jump rope':'⏫',
  'Kamma håret':'💇',
  'Karate':'🥋',
  'Karmienie':'🍼',
  'Kasta boll':'🤾',
  'Kaugummi':'🫧',
  'Kicking ball':'⚽',
  'Klä på sig':'👔',
  'Kopanie piłki':'⚽',
  'Krokodil':'🐊',
  'Krokodyl':'🐊',
  'Kąpiel':'🛁',
  'Ladybug':'🐞',
  'Malarz':'🎨',
  'Maler':'🎨',
  'Marienkäfer':'🐞',
  'Mata':'🍼',
  'Mycie rąk':'🧼',
  'Målare':'🎨',
  'Nyckelpiga':'🐞',
  'Painter':'🎨',
  'Pająk':'🕷️',
  'Petting':'🐾',
  'Pilot':'✈️',
  'Ping pong':'🏓',
  'Ping-pong':'🏓',
  'Pingis':'🏓',
  'Piosenkarz':'🎤',
  'Piłka ręczna':'🤾',
  'Podlewanie kwiatów':'🌻',
  'Pusten':'🌬️',
  'Radfahren':'🚴',
  'Ringen':'🤼',
  'Rockring':'⭕',
  'Rollerfahren':'🛴',
  'Rzucanie piłką':'🤾',
  'Scooter riding':'🛴',
  'Seilspringen':'⏫',
  'Siatkówka':'🏐',
  'Singer':'🎤',
  'Skakanie na skakance':'⏫',
  'Skateboard':'🛹',
  'Skateboarden':'🛹',
  'Skateboarding':'🛹',
  'Skridskoåkning':'⛸️',
  'Smeka':'🐾',
  'Sopa':'🧹',
  'Sparka boll':'⚽',
  'Sparkcykel':'🛴',
  'Spider':'🕷️',
  'Spindel':'🕷️',
  'Spinne':'🕷️',
  'Streicheln':'🐾',
  'Surfing':'🏄',
  'Sweeping':'🧹',
  'Sänger':'🎤',
  'Sångare':'🎤',
  'Tancerz':'💃',
  'Throwing ball':'🤾',
  'Tischtennis':'🏓',
  'Tuggummi':'🫧',
  'Turnen':'🤸',
  'Tvätta händerna':'🧼',
  'Tänzer':'💃',
  'Ubieranie się':'👔',
  'Vattna blommor':'🌻',
  'Volleyball':'🏐',
  'Volleyboll':'🏐',
  'Washing hands':'🧼',
  'Watering flowers':'🌻',
  'Wrestling':'🤼',
  'Zamiatanie':'🧹',
  'Łapanie piłki':'🤲',
  'Ameise':'🐜',
  'Ant':'🐜',
  'Bat':'🦇',
  'Bauer':'🧑‍🌾',
  'Bee':'🐝',
  'Bi':'🐝',
  'Biene':'🐝',
  'Bonde':'🧑‍🌾',
  'Chomik':'🐹',
  'Crab':'🦀',
  'Farmer':'🧑‍🌾',
  'Fladdermus':'🦇',
  'Fledermaus':'🦇',
  'Hamster':'🐹',
  'Konik morski':'🐴',
  'Krab':'🦀',
  'Krabba':'🦀',
  'Krabbe':'🦀',
  'Krankenschwester':'👩‍⚕️',
  'Mask':'🪱',
  'Mrówka':'🐜',
  'Myra':'🐜',
  'Nietoperz':'🦇',
  'Nurse':'👩‍⚕️',
  'Pielęgniarka':'👩‍⚕️',
  'Pszczoła':'🐝',
  'Robak':'🪱',
  'Rolnik':'🧑‍🌾',
  'Seahorse':'🐴',
  'Seepferdchen':'🐴',
  'Sjuksköterska':'👩‍⚕️',
  'Sjöhäst':'🐴',
  'Worm':'🪱',
  'Wurm':'🪱',
  'Bläckfisk':'🐙',
  'Blåsfisk':'🐡',
  'Camel':'🐫',
  'Donkey':'🫏',
  'Dzięcioł':'🐦',
  'Eichhörnchen':'🐿️',
  'Ekorre':'🐿️',
  'Esel':'🫏',
  'Fliege':'🪰',
  'Flodhäst':'🦛',
  'Fluga':'🪰',
  'Fly':'🪰',
  'Grasshopper':'🦗',
  'Gräshoppa':'🦗',
  'Hackspett':'🐦',
  'Heuschrecke':'🦗',
  'Hipopotam':'🦛',
  'Hippo':'🦛',
  'Kamel':'🐫',
  'Komar':'🦟',
  'Konik polny':'🦗',
  'Kugelfisch':'🐡',
  'Mosquito':'🦟',
  'Mucha':'🪰',
  'Mygga':'🦟',
  'Mücke':'🦟',
  'Nashorn':'🦏',
  'Nilpferd':'🦛',
  'Noshörning':'🦏',
  'Nosorożec':'🦏',
  'Octopus':'🐙',
  'Oktopus':'🐙',
  'Orm':'🐍',
  'Osioł':'🫏',
  'Ośmiornica':'🐙',
  'Paw':'🦚',
  'Peacock':'🦚',
  'Pfau':'🦚',
  'Piranha':'🐟',
  'Pirania':'🐟',
  'Piraya':'🐟',
  'Puffer fish':'🐡',
  'Påfågel':'🦚',
  'Raccoon':'🦝',
  'Rhinoceros':'🦏',
  'Rozgwiazda':'⭐',
  'Ryba rozdymka':'🐡',
  'Schlange':'🐍',
  'Schwan':'🦢',
  'Scorpion':'🦂',
  'Seestern':'⭐',
  'Sjöstjärna':'⭐',
  'Skorpion':'🦂',
  'Skunk':'🦨',
  'Skunks':'🦨',
  'Snake':'🐍',
  'Specht':'🐦',
  'Squirrel':'🐿️',
  'Starfish':'⭐',
  'Stinktier':'🦨',
  'Svan':'🦢',
  'Swan':'🦢',
  'Szop':'🦝',
  'Tvättbjörn':'🦝',
  'Waschbär':'🦝',
  'Wielbłąd':'🐫',
  'Wiewiórka':'🐿️',
  'Woodpecker':'🐦',
  'Wąż':'🐍',
  'Åsna':'🫏',
  'Łabędź':'🦢',
  'Ananas':'🍍',
  'Apelsin':'🍊',
  'Babeczka':'🧁',
  'Bagietka':'🥖',
  'Baguette':'🥖',
  'Broccoli':'🥦',
  'Brokkoli':'🥦',
  'Brokuł':'🥦',
  'Burger':'🍔',
  'Burrito':'🌯',
  'Cebula':'🧅',
  'Cereal':'🥣',
  'Cherry':'🍒',
  'Chips':'🥔',
  'Chipsy':'🥔',
  'Citron':'🍋',
  'Coconut':'🥥',
  'Corn on the Cob':'🌽',
  'Crisps':'🥔',
  'Cucumber':'🥒',
  'Cupcake':'🧁',
  'Cytryna':'🍋',
  'Czosnek':'🧄',
  'Donut':'🍩',
  'Fleischbällchen':'🧆',
  'Flingor':'🥣',
  'French Fries':'🍟',
  'Frytki':'🍟',
  'Garlic':'🧄',
  'Godis':'🍬',
  'Grapes':'🍇',
  'Gummibärchen':'🍬',
  'Gummies':'🍬',
  'Gurka':'🥒',
  'Gurke':'🥒',
  'Hamburgare':'🍔',
  'Hamburger':'🍔',
  'Joghurt':'🥛',
  'Jogurt':'🥛',
  'Kartoffelpüree':'🥔',
  'Kirsche':'🍒',
  'Klopsiki':'🧆',
  'Knoblauch':'🧄',
  'Kokos':'🥥',
  'Kokosnuss':'🥥',
  'Kokosnöt':'🥥',
  'Kolba kukurydzy':'🌽',
  'Körsbär':'🍒',
  'Köttbullar':'🧆',
  'Lemon':'🍋',
  'Lettuce':'🥬',
  'Lök':'🧅',
  'Maiskolben':'🌽',
  'Majskolv':'🌽',
  'Mashed Potatoes':'🥔',
  'Meatballs':'🧆',
  'Muffin':'🧁',
  'Munk':'🍩',
  'Müsli':'🥣',
  'Ogórek':'🥒',
  'Onion':'🧅',
  'Orange':'🍊',
  'Pineapple':'🍍',
  'Pomarańcza':'🍊',
  'Pommes':'🍟',
  'Pommes frites':'🍟',
  'Potatismos':'🥔',
  'Puree ziemniaczane':'🥔',
  'Pączek':'🍩',
  'Płatki śniadaniowe':'🥣',
  'Reis':'🍚',
  'Rice':'🍚',
  'Ris':'🍚',
  'Rostat bröd':'🍞',
  'Ryż':'🍚',
  'Salat':'🥬',
  'Sallad':'🥬',
  'Sałata':'🥬',
  'Toast':'🍞',
  'Tost':'🍞',
  'Trauben':'🍇',
  'Vatten':'💧',
  'Vindruvor':'🍇',
  'Vitlök':'🧄',
  'Wasser':'💧',
  'Water':'💧',
  'Winogrona':'🍇',
  'Wiśnia':'🍒',
  'Woda':'💧',
  'Yoghurt':'🥛',
  'Zitrone':'🍋',
  'Zwiebel':'🧅',
  'Żelki':'🍬',
  'Auto fahren':'🚗',
  'Blinka':'😉',
  'Blowing a kiss':'😘',
  'Blowing birthday candles':'🎂',
  'Blåsa ut ljus':'🎂',
  'Bowling':'🎳',
  'Chodzenie na palcach':'🤫',
  'Dragkamp':'🪢',
  'Dricka med sugrör':'🥤',
  'Drinking from straw':'🥤',
  'Driving a car':'🚗',
  'Durch Strohhalm trinken':'🥤',
  'Eating ice cream':'🍦',
  'Eating spaghetti':'🍝',
  'Eis essen':'🍦',
  'Geschenk öffnen':'🎁',
  'Gitarre spielen':'🎸',
  'Granie na gitarze':'🎸',
  'Gå på tå':'🤫',
  'Hampelmänner':'🏋️',
  'Hide and seek':'🫣',
  'High five':'🖐️',
  'Jedzenie lodów':'🍦',
  'Jedzenie spaghetti':'🍝',
  'Jumping jacks':'🏋️',
  'Kerzen ausblasen':'🎂',
  'Kręgle':'🎳',
  'Kurragömma':'🫣',
  'Kusshand':'😘',
  'Köra bil':'🚗',
  'Marching':'🪖',
  'Marschera':'🪖',
  'Marschieren':'🪖',
  'Maszerowanie':'🪖',
  'Mruganie':'😉',
  'Opening a present':'🎁',
  'Otwieranie prezentu':'🎁',
  'Pajacyki':'🏋️',
  'Phone call':'📱',
  'Picie przez słomkę':'🥤',
  'Piątka':'🖐️',
  'Playing guitar':'🎸',
  'Posyłanie buziaka':'😘',
  'Prowadzenie auta':'🚗',
  'Przeciąganie liny':'🪢',
  'Putting on shoes':'👟',
  'Ringa':'📱',
  'Rozmowa telefoniczna':'📱',
  'Rutscha':'🛝',
  'Rutschen':'🛝',
  'Schuhe anziehen':'👟',
  'Sliding':'🛝',
  'Slänga slängkyss':'😘',
  'Spaghetti essen':'🍝',
  'Spela gitarr':'🎸',
  'Sätta på skor':'👟',
  'Tauziehen':'🪢',
  'Telefonieren':'📱',
  'Tiptoe walk':'🤫',
  'Tug of war':'🪢',
  'Verstecken spielen':'🫣',
  'Winking':'😉',
  'Zabawa w chowanego':'🫣',
  'Zakładanie butów':'👟',
  'Zdmuchiwanie świeczek':'🎂',
  'Zehenspitzen-Gang':'🤫',
  'Zjeżdżanie':'🛝',
  'Zwinkern':'😉',
  'Äta glass':'🍦',
  'Äta spagetti':'🍝',
  'Öppna present':'🎁',
  'Cashier':'💰',
  'DJ':'🎧',
  'Dziennikarz':'📰',
  'Fischer':'🎣',
  'Fisherman':'🎣',
  'Fiskare':'🎣',
  'Forskare':'🔬',
  'Hausmeister':'🧹',
  'Janitor':'🧹',
  'Journalist':'📰',
  'Kasjer':'💰',
  'Kassierer':'💰',
  'Kassör':'💰',
  'Naukowiec':'🔬',
  'Ochroniarz':'🛡️',
  'Przewodnik':'🗺️',
  'Reiseleiter':'🗺️',
  'Rybak':'🎣',
  'Scientist':'🔬',
  'Security guard':'🛡️',
  'Sicherheitsmann':'🛡️',
  'Sprzątacz':'🧹',
  'Städare':'🧹',
  'Taksówkarz':'🚕',
  'Taxi driver':'🚕',
  'Taxichaufför':'🚕',
  'Taxifahrer':'🚕',
  'Tour guide':'🗺️',
  'Turistguide':'🗺️',
  'Vakt':'🛡️',
  'Wissenschaftler':'🔬',
  'Baseball':'⚾',
  'Cheerleading':'📣',
  'Frisbee':'🥏',
  'Gewichtheben':'🏋️',
  'Hoppa hage':'🔢',
  'Hopscotch':'🔢',
  'Hüpfspiel':'🔢',
  'Jazda na rolkach':'🛼',
  'Kickball':'⚽',
  'Klasy':'🔢',
  'Klippklättring':'🧗',
  'Nurkowanie z rurką':'🤿',
  'Parkour':'🏃',
  'Podnoszenie ciężarów':'🏋️',
  'Pole vault':'🥇',
  'Relay race':'🏃',
  'Rock climbing':'🧗',
  'Roller skating':'🛼',
  'Rollschuhlaufen':'🛼',
  'Rullskridskor':'🛼',
  'Schnorcheln':'🤿',
  'Skok o tyczce':'🥇',
  'Snorkeling':'🤿',
  'Snorkling':'🤿',
  'Stabhochsprung':'🥇',
  'Stafettlopp':'🏃',
  'Staffellauf':'🏃',
  'Stavhopp':'🥇',
  'Sumo':'🤼',
  'Sumo wrestling':'🤼',
  'Sumo-Ringen':'🤼',
  'Sumobrottning':'🤼',
  'Sztafeta':'🏃',
  'Tyngdlyftning':'🏋️',
  'Weightlifting':'🏋️',
  'Wspinaczka skałkowa':'🧗',
};

const LANGS = {
  pl: {
    name: '🇵🇱 PL',
    gameTitle: 'Kalambury',
    gameSubtitle: 'Gra drużynowa · 4–40 graczy',
    createRoom: 'Stwórz pokój', joinRoom: 'Dołącz do pokoju',
    enterName: 'Twoje imię', enterCode: 'Kod pokoju',
    startGame: '🎬 Start', leaveRoom: '🚪 Wyjdź',
    teamRed: '🔴 Drużyna Czerwona', teamBlue: '🔵 Drużyna Niebieska',
    moveToRed: '→ 🔴', moveToBlue: '→ 🔵',
    settings: 'Ustawienia', category: 'Kategoria', difficulty: 'Poziom', timer: 'Czas', rounds: 'Rundy',
    catMixed: '🎲 Losowe', catAnimals: '🐾 Zwierzęta', catActions: '🏃 Czynności',
    catProfessions: '👷 Zawody', catMovies: '🎬 Postacie z filmów', catFood: '🍕 Jedzenie', catSports: '⚽ Sport',
    diffKids: '🧒 Dzieci', diffFamily: '👨‍👩‍👧 Rodzina', diffAdults: '🎓 Dorośli',
    yourTurnAct: '🎭 Twoja kolej! Pokaż:',
    teamIsActing: 'pokazuje:',
    correct: '✅ Dobrze!', pass: '⏭️ Pas', passesLeft: 'Pasy:',
    wordsGuessed: 'Odgadnięte:', timeUp: '⏰ Czas minął!',
    theWordWas: 'Hasło było:', guessedWord: '✅ Zgadli!', passedWord: '⏭️ Pominięte',
    round: 'Runda', of: 'z',
    finalTitle: '🏆 Koniec gry!', playAgain: '🔄 Zagraj ponownie', goHome: '🏠 Start',
    hostBadge: 'HOST', youBadge: 'TY',
    needTeams: 'Każda drużyna potrzebuje min. 1 gracza',
    players: 'Gracze',
    nudge: '👋 Szturchnij', nudgeSent: '✓ Wysłano!',
    shareText: 'Zagraj ze mną w Kalambury! 🎭\nKod: {code}\n{url}',
    nextRound: '➡️ Następna runda',
    lengthQuick: '⚡ Szybka (każdy pokazuje raz)', lengthStandard: '🎮 Standardowa (każdy pokazuje 2x)', lengthMarathon: '🏆 Maraton (każdy pokazuje 3x)', gameLength: 'Długość gry',
    waitForTeam: 'Drużyna przeciwna pokazuje...',
  },
  en: {
    name: '🇬🇧 EN',
    gameTitle: 'Charades',
    gameSubtitle: 'Team game · 4–40 players',
    createRoom: 'Create room', joinRoom: 'Join room',
    enterName: 'Your name', enterCode: 'Room code',
    startGame: '🎬 Start', leaveRoom: '🚪 Leave',
    teamRed: '🔴 Red Team', teamBlue: '🔵 Blue Team',
    moveToRed: '→ 🔴', moveToBlue: '→ 🔵',
    settings: 'Settings', category: 'Category', difficulty: 'Difficulty', timer: 'Timer', rounds: 'Rounds',
    catMixed: '🎲 Mixed', catAnimals: '🐾 Animals', catActions: '🏃 Actions',
    catProfessions: '👷 Jobs', catMovies: '🎬 Characters', catFood: '🍕 Food', catSports: '⚽ Sports',
    diffKids: '🧒 Kids', diffFamily: '👨‍👩‍👧 Family', diffAdults: '🎓 Adults',
    yourTurnAct: '🎭 Your turn! Act out:',
    teamIsActing: 'is acting:',
    correct: '✅ Correct!', pass: '⏭️ Pass', passesLeft: 'Passes:',
    wordsGuessed: 'Guessed:', timeUp: '⏰ Time\'s up!',
    theWordWas: 'The word was:', guessedWord: '✅ Guessed!', passedWord: '⏭️ Passed',
    round: 'Round', of: 'of',
    finalTitle: '🏆 Game Over!', playAgain: '🔄 Play again', goHome: '🏠 Home',
    hostBadge: 'HOST', youBadge: 'YOU',
    needTeams: 'Each team needs at least 1 player',
    players: 'Players',
    nudge: '👋 Nudge', nudgeSent: '✓ Sent!',
    shareText: 'Join my Charades game! 🎭\nCode: {code}\n{url}',
    nextRound: '➡️ Next Round',
    lengthQuick: '⚡ Quick (everyone acts once)', lengthStandard: '🎮 Standard (everyone acts twice)', lengthMarathon: '🏆 Marathon (everyone acts 3x)', gameLength: 'Game length',
    waitForTeam: 'Other team is acting...',
  },
  de: {
    name: '🇩🇪 DE',
    gameTitle: 'Scharade',
    gameSubtitle: 'Teamspiel · 4–40 Spieler',
    createRoom: 'Raum erstellen', joinRoom: 'Beitreten',
    enterName: 'Dein Name', enterCode: 'Raumcode',
    startGame: '🎬 Start', leaveRoom: '🚪 Verlassen',
    teamRed: '🔴 Team Rot', teamBlue: '🔵 Team Blau',
    moveToRed: '→ 🔴', moveToBlue: '→ 🔵',
    settings: 'Einstellungen', category: 'Kategorie', difficulty: 'Schwierigkeit', timer: 'Zeit', rounds: 'Runden',
    catMixed: '🎲 Gemischt', catAnimals: '🐾 Tiere', catActions: '🏃 Aktionen',
    catProfessions: '👷 Berufe', catMovies: '🎬 Figuren', catFood: '🍕 Essen', catSports: '⚽ Sport',
    diffKids: '🧒 Kinder', diffFamily: '👨‍👩‍👧 Familie', diffAdults: '🎓 Erwachsene',
    yourTurnAct: '🎭 Du bist dran! Zeige:',
    teamIsActing: 'zeigt:',
    correct: '✅ Richtig!', pass: '⏭️ Passen', passesLeft: 'Pässe:',
    wordsGuessed: 'Erraten:', timeUp: '⏰ Zeit ist um!',
    theWordWas: 'Das Wort war:', guessedWord: '✅ Erraten!', passedWord: '⏭️ Übersprungen',
    round: 'Runde', of: 'von',
    finalTitle: '🏆 Spielende!', playAgain: '🔄 Nochmal', goHome: '🏠 Start',
    hostBadge: 'HOST', youBadge: 'DU',
    needTeams: 'Jedes Team braucht min. 1 Spieler',
    players: 'Spieler',
    nudge: '👋 Anstupsen', nudgeSent: '✓ Gesendet!',
    shareText: 'Spiel Scharade mit! 🎭\nCode: {code}\n{url}',
    nextRound: '➡️ Nächste Runde',
    lengthQuick: '⚡ Kurz (jeder einmal)', lengthStandard: '🎮 Standard (jeder 2x)', lengthMarathon: '🏆 Marathon (jeder 3x)', gameLength: 'Spiellänge',
    waitForTeam: 'Das andere Team zeigt...',
  },
  sv: {
    name: '🇸🇪 SV',
    gameTitle: 'Charader',
    gameSubtitle: 'Lagspel · 4–40 spelare',
    createRoom: 'Skapa rum', joinRoom: 'Gå med',
    enterName: 'Ditt namn', enterCode: 'Rumskod',
    startGame: '🎬 Starta', leaveRoom: '🚪 Lämna',
    teamRed: '🔴 Röda laget', teamBlue: '🔵 Blå laget',
    moveToRed: '→ 🔴', moveToBlue: '→ 🔵',
    settings: 'Inställningar', category: 'Kategori', difficulty: 'Svårighet', timer: 'Tid', rounds: 'Rundor',
    catMixed: '🎲 Blandat', catAnimals: '🐾 Djur', catActions: '🏃 Handlingar',
    catProfessions: '👷 Yrken', catMovies: '🎬 Karaktärer', catFood: '🍕 Mat', catSports: '⚽ Sport',
    diffKids: '🧒 Barn', diffFamily: '👨‍👩‍👧 Familj', diffAdults: '🎓 Vuxna',
    yourTurnAct: '🎭 Din tur! Visa:',
    teamIsActing: 'visar:',
    correct: '✅ Rätt!', pass: '⏭️ Passa', passesLeft: 'Pass:',
    wordsGuessed: 'Gissade:', timeUp: '⏰ Tiden är slut!',
    theWordWas: 'Ordet var:', guessedWord: '✅ Gissad!', passedWord: '⏭️ Hoppade över',
    round: 'Runda', of: 'av',
    finalTitle: '🏆 Spelet slut!', playAgain: '🔄 Spela igen', goHome: '🏠 Hem',
    hostBadge: 'VÄRD', youBadge: 'DU',
    needTeams: 'Varje lag behöver minst 1 spelare',
    players: 'Spelare',
    nudge: '👋 Puffa', nudgeSent: '✓ Skickat!',
    shareText: 'Spela Charader med oss! 🎭\nKod: {code}\n{url}',
    nextRound: '➡️ Nästa runda',
    lengthQuick: '⚡ Snabb (alla visar en gång)', lengthStandard: '🎮 Standard (alla visar 2 ggr)', lengthMarathon: '🏆 Maraton (alla visar 3 ggr)', gameLength: 'Spellängd',
    waitForTeam: 'Andra laget visar...',
  },
};

const _urlLang = new URLSearchParams(window.location.search).get('lang') || window._forceLang;
let lang = LANGS[_urlLang] ? _urlLang : 'pl';
let L = LANGS[lang];
let roomCode = '', myName = '', myId = null;

// ── Socket events ──
socket.on('connect', () => {
  myId = socket.id;
  // Auto-join from URL parameter (shared link)
  const params = new URLSearchParams(window.location.search);
  const joinCode = params.get('join');
  if (joinCode && !roomCode) {
    // Pre-fill the join code and show join section
    var codeInput = document.getElementById('join-code');
    if (codeInput) codeInput.value = joinCode;
    return; // Don't auto-rejoin if we have a join code
  }
  // Auto-rejoin from session (only if no join code)
  const sc = sessionStorage.getItem('charades_code');
  const sn = sessionStorage.getItem('charades_name');
  if (sc && sn && !roomCode) {
    myName = sn;
    socket.emit('charades_rejoin', { code: sc, name: sn });
  }
});

socket.on('charades_room_created', ({ code }) => {
  console.log('[CHARADES] Room created:', code);
  window._amHost = true;
  roomCode = code;
  sessionStorage.setItem('charades_code', code);
  sessionStorage.setItem('charades_name', myName);
  document.getElementById('room-code-display').textContent = code;
  showScreen('screen-lobby');
  // Scroll to top so lobby is visible above burger nav
  window.scrollTo(0, 0);
});

socket.on('charades_room_joined', ({ code }) => {
  window._amHost = false;
  roomCode = code;
  sessionStorage.setItem('charades_code', code);
  sessionStorage.setItem('charades_name', myName);
  document.getElementById('room-code-display').textContent = code;
  showScreen('screen-lobby');
  window.scrollTo(0, 0);
});

socket.on('charades_error', ({ message }) => {
  // Clear stale session if room no longer exists
  if (message === 'Room not found') {
    sessionStorage.removeItem('charades_code');
    sessionStorage.removeItem('charades_name');
  }
  var el = document.getElementById('home-error');
  if (el) { el.textContent = message; el.style.display = 'block'; setTimeout(function(){ el.style.display = 'none'; }, 3500); }
});

socket.on('charades_state', function(data) {
  console.log('[CHARADES] State received:', data.phase, 'players:', data.players ? data.players.length : 0);
  if (data.hostId) window._amHost = data.hostId === myId;
  applyState(data);
});

// ── State handler ──
function applyState(data) {
  switch (data.phase) {
    case 'lobby':     showScreen('screen-lobby');   renderLobby(data);   break;
    case 'preparing': showScreen('screen-playing'); renderPreparing(data); break;
    case 'acting':    showScreen('screen-playing'); renderPlaying(data); break;
    case 'turn_end':  showScreen('screen-playing'); renderTurnEnd(data); break;
    case 'final':     showScreen('screen-final');   renderFinal(data);   break;
  }
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(function(s) { s.classList.remove('active'); s.style.display = 'none'; });
  var el = document.getElementById(id);
  if (el) { el.classList.add('active'); el.style.display = 'block'; }
}

// ── LOBBY ──
function renderLobby(data) {
  var isHost = data.hostId === myId;
  window._amHost = isHost;
  
  // Player count notification
  var connectedCount = data.players.filter(function(p) { return p.connected; }).length;
  if (connectedCount > _prevPlayerCount && _prevPlayerCount > 0 && typeof window._onPlayerJoined === 'function') {
    var newest = data.players[data.players.length - 1];
    window._onPlayerJoined(newest ? newest.name : '?');
  }
  _prevPlayerCount = connectedCount;
  
  // Team columns
  var redEl = document.getElementById('team-red-players');
  var blueEl = document.getElementById('team-blue-players');
  if (redEl) redEl.innerHTML = '';
  if (blueEl) blueEl.innerHTML = '';
  
  data.players.filter(function(p) { return p.connected; }).forEach(function(p) {
    var html = '<div class="lobby-player">' +
      '<span class="pname">' + p.name +
        (p.id === myId ? ' <span class="you-badge">' + L.youBadge + '</span>' : '') +
        (p.isHost ? ' <span class="host-badge">' + L.hostBadge + '</span>' : '') +
      '</span>' +
      (isHost && p.id !== myId ? '<button class="move-btn" onclick="movePlayer(\'' + p.id + '\',\'' + (p.team === 'red' ? 'blue' : 'red') + '\')">' + (p.team === 'red' ? L.moveToBlue : L.moveToRed) + '</button>' : '') +
      (p.id === myId ? '<button class="move-btn" onclick="movePlayer(\'' + p.id + '\',\'' + (p.team === 'red' ? 'blue' : 'red') + '\')">' + (p.team === 'red' ? L.moveToBlue : L.moveToRed) + '</button>' : '') +
    '</div>';
    if (p.team === 'red' && redEl) redEl.innerHTML += html;
    else if (blueEl) blueEl.innerHTML += html;
  });
  
  // Team labels with counts
  var redLabel = document.getElementById('team-red-label');
  var blueLabel = document.getElementById('team-blue-label');
  var redCount = data.teams.red.players.length;
  var blueCount = data.teams.blue.players.length;
  if (redLabel) redLabel.textContent = L.teamRed + ' (' + redCount + ')';
  if (blueLabel) blueLabel.textContent = L.teamBlue + ' (' + blueCount + ')';
  
  // Nudge
  var nudgeContainer = document.getElementById('nudge-container');
  if (nudgeContainer && typeof window._buildNudgeButton === 'function') {
    window._buildNudgeButton(nudgeContainer, roomCode, myName || '', { nudge: L.nudge, nudgeSent: L.nudgeSent });
  }
  
  // Warning
  var warn = document.getElementById('player-warning');
  if (warn) {
    warn.style.display = 'block';
    if (redCount >= 1 && blueCount >= 1) {
      warn.classList.add('ready');
      warn.textContent = '✅ ' + connectedCount + ' ' + L.players;
    } else {
      warn.classList.remove('ready');
      warn.textContent = L.needTeams;
    }
  }
  
  // Settings — host only
  var settingsCard = document.getElementById('settings-card');
  if (settingsCard) settingsCard.style.display = isHost ? '' : 'none';
  
  // Category pills
  if (isHost) {
    renderPills('cat-pills', [
      {key:'mixed',label:L.catMixed},{key:'animals',label:L.catAnimals},{key:'actions',label:L.catActions},
      {key:'professions',label:L.catProfessions},{key:'movies',label:L.catMovies},{key:'food',label:L.catFood},{key:'sports',label:L.catSports},
    ], data.settings.category, function(v) { socket.emit('charades_update_settings', {code:roomCode,settings:{category:v}}); });
    
    renderPills('diff-pills', [
      {key:'kids',label:L.diffKids},{key:'family',label:L.diffFamily},{key:'adults',label:L.diffAdults},
    ], data.settings.difficulty, function(v) { socket.emit('charades_update_settings', {code:roomCode,settings:{difficulty:v}}); });

    renderPills('length-pills', [
      {key:'quick',label:L.lengthQuick},{key:'standard',label:L.lengthStandard},{key:'marathon',label:L.lengthMarathon},
    ], data.settings.gameLength, function(v) { socket.emit('charades_update_settings', {code:roomCode,settings:{gameLength:v}}); });

    renderPills('timer-pills', [
      {key:30,label:'30s'},{key:60,label:'60s'},{key:90,label:'90s'},
    ], data.settings.timerSecs, function(v) { socket.emit('charades_update_settings', {code:roomCode,settings:{timerSecs:parseInt(v)}}); });
  }
  
  // Lobby rules translation
  var rulesTitle = document.getElementById('lbl-lobby-rules');
  if (rulesTitle) rulesTitle.textContent = lang === 'pl' ? 'Jak grać' : lang === 'de' ? 'Spielanleitung' : lang === 'sv' ? 'Hur man spelar' : 'How to play';
  var lobbySteps = document.querySelectorAll('#lobby-rules-steps .rule-step p');
  var lobbyStepTexts = {
    pl: ['Podzielcie się na 2 drużyny','Każdą rundę jeden gracz widzi tajne hasło','Pokaż je gestem — bez słów, bez wskazywania!','Twoja drużyna krzyczy odpowiedzi — kliknij ✅ gdy zgadną','Każde prawidłowe hasło = 1 punkt dla drużyny'],
    en: ['Split into 2 teams','Each round, one player sees a secret word','Act it out — no sounds, no pointing!','Your team shouts guesses — tap ✅ when they get it','Each correct guess = 1 point for your team'],
    de: ['Teilt euch in 2 Teams auf','Jede Runde sieht ein Spieler ein geheimes Wort','Stelle es dar — keine Geräusche, kein Zeigen!','Dein Team ruft Antworten — tippe ✅ wenn sie es haben','Jede richtige Antwort = 1 Punkt fürs Team'],
    sv: ['Dela upp i 2 lag','Varje runda ser en spelare ett hemligt ord','Visa det — inga ljud, inget pekande!','Ditt lag ropar gissningar — tryck ✅ när de gissar rätt','Varje rätt gissning = 1 poäng för laget'],
  };
  if (lobbySteps.length === 5 && lobbyStepTexts[lang]) {
    lobbySteps.forEach(function(el, i) { el.textContent = lobbyStepTexts[lang][i]; });
  }
  
  // Word count info
  var wcEl = document.getElementById('word-count-info');
  if (wcEl && data.wordCount) {
    wcEl.style.display = 'block';
    wcEl.textContent = '📚 ' + data.wordCount + ' ' + (lang === 'pl' ? 'słów dostępnych' : lang === 'de' ? 'Wörter verfügbar' : lang === 'sv' ? 'ord tillgängliga' : 'words available');
  }
  
  // Start button
  var startBtn = document.getElementById('start-btn');
  if (startBtn) {
    startBtn.style.display = isHost ? '' : 'none';
    var canStart = redCount >= 2 && blueCount >= 2;
    startBtn.disabled = !canStart;
    startBtn.style.opacity = canStart ? '1' : '0.4';
  }
}

function renderPills(containerId, items, active, onClick) {
  var el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = items.map(function(item) {
    return '<button class="lang-pill' + (item.key === active ? ' active' : '') + '" onclick="void(0)">' + item.label + '</button>';
  }).join('');
  el.querySelectorAll('.lang-pill').forEach(function(btn, i) {
    btn.onclick = function() { onClick(items[i].key); };
  });
}

// ── PREPARING (Up Next) ──
function renderPreparing(data) {
  var codeEl = document.getElementById('playing-room-code');
  if (codeEl) codeEl.textContent = '🔑 ' + roomCode;
  var isActor = data.actorId === myId;
  var actorName = data.actorName || '?';
  var teamLabel = data.actorTeam === 'red' ? L.teamRed : L.teamBlue;
  
  // Scoreboard
  var scoreEl = document.getElementById('scoreboard');
  if (scoreEl) {
    scoreEl.innerHTML =
      '<div class="score-team' + (data.actorTeam === 'red' ? ' active-team' : '') + '">' +
        '<div class="score-label">' + L.teamRed + '</div>' +
        '<div class="score-value">' + data.teams.red.score + '</div>' +
      '</div>' +
      '<div class="score-vs">VS</div>' +
      '<div class="score-team' + (data.actorTeam === 'blue' ? ' active-team' : '') + '">' +
        '<div class="score-label">' + L.teamBlue + '</div>' +
        '<div class="score-value">' + data.teams.blue.score + '</div>' +
      '</div>';
  }
  
  // Round + category
  var roundEl = document.getElementById('round-indicator');
  if (roundEl) {
    var catLabels = {mixed:L.catMixed, animals:L.catAnimals, actions:L.catActions, professions:L.catProfessions, movies:L.catMovies, food:L.catFood, sports:L.catSports};
    var catLabel = catLabels[data.settings.category] || data.settings.category;
    roundEl.textContent = L.round + ' ' + data.round + ' ' + L.of + ' ' + data.totalRounds + '  ·  ' + catLabel;
  }
  
  // Hide playing elements
  var wordCard = document.getElementById('word-card');
  var actorBtns = document.getElementById('actor-buttons');
  var timerText = document.getElementById('timer-text');
  var timerBar = document.getElementById('timer-bar');
  var flash = document.getElementById('result-flash');
  var nextBtn = document.getElementById('next-round-btn');
  if (wordCard) wordCard.style.display = 'none';
  if (actorBtns) actorBtns.style.display = 'none';
  if (timerText) timerText.textContent = '';
  if (timerBar) timerBar.style.width = '100%';
  if (flash) flash.style.display = 'none';
  if (nextBtn) nextBtn.style.display = 'none';
  clearInterval(window._timerInterval);
  
  // Banner — "Up Next"
  var banner = document.getElementById('turn-banner');
  if (banner) {
    banner.className = 'turn-banner actor-banner';
    banner.textContent = '⏭️ ' + (lang === 'pl' ? 'Następny' : lang === 'de' ? 'Als Nächstes' : lang === 'sv' ? 'Nästa' : 'Up Next') + ': ' + actorName + ' (' + teamLabel + ')';
  }
  
  // Wait message — actor sees "Ready" button, others see "Get ready"
  var waitMsg = document.getElementById('wait-message');
  if (waitMsg) {
    waitMsg.style.display = '';
    if (isActor) {
      waitMsg.innerHTML =
        '<div class="wait-icon">🎭</div>' +
        '<p style="font-size:18px;color:var(--text);font-weight:800;">' + (lang === 'pl' ? 'Twoja kolej!' : lang === 'de' ? 'Du bist dran!' : lang === 'sv' ? 'Din tur!' : 'Your turn!') + '</p>' +
        '<p style="font-size:13px;color:var(--muted);margin-bottom:16px;">' + (lang === 'pl' ? 'Przygotuj się i naciśnij przycisk gdy będziesz gotowy' : lang === 'de' ? 'Mach dich bereit und drücke den Knopf' : lang === 'sv' ? 'Gör dig redo och tryck på knappen' : 'Get ready and press the button when you are prepared') + '</p>' +
        '<button class="btn big-btn correct-btn" onclick="actorReady()" style="width:100%;max-width:300px;margin:0 auto;">▶ ' + (lang === 'pl' ? 'Jestem gotowy!' : lang === 'de' ? 'Ich bin bereit!' : lang === 'sv' ? 'Jag är redo!' : "I'm Ready!") + '</button>';
    } else {
      waitMsg.innerHTML =
        '<div class="wait-icon">⏳</div>' +
        '<p style="font-size:18px;color:var(--text);font-weight:800;">' + actorName + '</p>' +
        '<p style="font-size:13px;color:var(--muted);">' + (lang === 'pl' ? 'przygotowuje się...' : lang === 'de' ? 'bereitet sich vor...' : lang === 'sv' ? 'förbereder sig...' : 'is getting ready...') + '</p>';
    }
  }
}

// ── PLAYING ──
function renderPlaying(data) {
  var codeEl = document.getElementById('playing-room-code');
  if (codeEl) codeEl.textContent = '🔑 ' + roomCode;
  var isActor = data.actorId === myId;
  // Hide next round button during acting
  var nextBtn = document.getElementById('next-round-btn');
  if (nextBtn) nextBtn.style.display = 'none';
  var myPlayer = data.players.find(function(p) { return p.id === myId; });
  var myTeam = myPlayer ? myPlayer.team : null;
  var isMyTeamActing = data.actorTeam === myTeam;
  
  // Scoreboard
  var scoreEl = document.getElementById('scoreboard');
  if (scoreEl) {
    scoreEl.innerHTML =
      '<div class="score-team' + (data.actorTeam === 'red' ? ' active-team' : '') + '">' +
        '<div class="score-label">' + L.teamRed + '</div>' +
        '<div class="score-value">' + data.teams.red.score + '</div>' +
      '</div>' +
      '<div class="score-vs">VS</div>' +
      '<div class="score-team' + (data.actorTeam === 'blue' ? ' active-team' : '') + '">' +
        '<div class="score-label">' + L.teamBlue + '</div>' +
        '<div class="score-value">' + data.teams.blue.score + '</div>' +
      '</div>';
  }
  
  // Round + category
  var roundEl = document.getElementById('round-indicator');
  if (roundEl) {
    var catLabels = {mixed:L.catMixed, animals:L.catAnimals, actions:L.catActions, professions:L.catProfessions, movies:L.catMovies, food:L.catFood, sports:L.catSports};
    var catLabel = catLabels[data.settings.category] || data.settings.category;
    roundEl.textContent = L.round + ' ' + data.round + ' ' + L.of + ' ' + data.totalRounds + '  ·  ' + catLabel;
  }
  
  // Banner
  var banner = document.getElementById('turn-banner');
  if (banner) {
    if (isActor) {
      banner.textContent = L.yourTurnAct;
      banner.className = 'turn-banner actor-banner';
    } else {
      var teamLabel = data.actorTeam === 'red' ? L.teamRed : L.teamBlue;
      banner.textContent = data.actorName + ' (' + teamLabel + ') ' + L.teamIsActing;
      banner.className = 'turn-banner';
    }
  }
  
  // Timer
  renderTimer(data.timerEnd, data.timerSecs);
  
  // Word card (actor only)
  var wordCard = document.getElementById('word-card');
  var actorBtns = document.getElementById('actor-buttons');
  var waitMsg = document.getElementById('wait-message');
  
  if (isActor) {
    if (wordCard) {
      wordCard.style.display = '';
      var emoji = EMOJI_HINTS[data.word] || '';
      var emojiHtml = emoji ? '<div class="word-emoji">' + emoji + '</div>' : '';
      wordCard.innerHTML =
        emojiHtml +
        '<div class="word-text">' + (data.word || '') + '</div>';
    }
    if (actorBtns) {
      actorBtns.style.display = '';
      actorBtns.innerHTML =
        '<button class="btn big-btn correct-btn" onclick="actorCorrect()" style="font-size:22px;">' + L.correct + '</button>' +
        '<button class="btn big-btn pass-btn" onclick="actorPass()" style="font-size:22px;"' + (data.passesLeft <= 0 ? ' disabled style="font-size:22px;opacity:0.3;"' : '') + '>' + L.pass + ' (' + data.passesLeft + ')</button>';
    }
    if (waitMsg) waitMsg.style.display = 'none';
  } else {
    if (wordCard) wordCard.style.display = 'none';
    if (actorBtns) actorBtns.style.display = 'none';
    if (waitMsg) {
      waitMsg.style.display = '';
      if (isMyTeamActing) {
        waitMsg.innerHTML = '<div class="wait-icon">🎭</div><p>' + data.actorName + ' ' + L.teamIsActing + '</p><p style="font-size:12px;color:var(--muted);">💡 ' + L.wordsGuessed + ' ' + data.wordsThisTurn + '</p>';
      } else {
        waitMsg.innerHTML = '<div class="wait-icon">👀</div><p>' + L.waitForTeam + '</p><p style="font-size:12px;color:var(--muted);">' + L.wordsGuessed + ' ' + data.wordsThisTurn + '</p>';
      }
    }
  }
  
  // Last result flash
  var flash = document.getElementById('result-flash');
  if (flash && data.lastResult) {
    if (data.lastResult === 'correct') {
      flash.textContent = L.guessedWord + ' ' + (data.lastWord || '');
      flash.className = 'result-flash flash-correct';
    } else if (data.lastResult === 'passed') {
      flash.textContent = L.passedWord + ' ' + (data.lastWord || '');
      flash.className = 'result-flash flash-passed';
    }
    flash.style.display = '';
    setTimeout(function() { flash.style.display = 'none'; }, 2500);
  }
  
  // Skip turn — host only
  if (skipBtn) skipBtn.style.display = window._amHost ? '' : 'none';
}

// ── TURN END ──
function renderTurnEnd(data) {
  var scoreEl = document.getElementById('scoreboard');
  if (scoreEl) {
    scoreEl.innerHTML =
      '<div class="score-team"><div class="score-label">' + L.teamRed + '</div><div class="score-value">' + data.teams.red.score + '</div></div>' +
      '<div class="score-vs">VS</div>' +
      '<div class="score-team"><div class="score-label">' + L.teamBlue + '</div><div class="score-value">' + data.teams.blue.score + '</div></div>';
  }
  
  var roundEl = document.getElementById('round-indicator');
  if (roundEl) roundEl.textContent = L.round + ' ' + data.round + ' ' + L.of + ' ' + data.totalRounds;
  
  var banner = document.getElementById('turn-banner');
  if (banner) {
    banner.textContent = L.timeUp + ' ' + L.wordsGuessed + ' ' + data.wordsThisTurn;
    banner.className = 'turn-banner timeout-banner';
  }
  
  // Show last word
  var wordCard = document.getElementById('word-card');
  if (wordCard) {
    wordCard.style.display = '';
    wordCard.innerHTML = '<div class="word-label">' + L.theWordWas + '</div><div class="word-text">' + (data.lastWord || '?') + '</div>';
  }
  
  var actorBtns = document.getElementById('actor-buttons');
  if (actorBtns) actorBtns.style.display = 'none';
  var waitMsg = document.getElementById('wait-message');
  if (waitMsg) waitMsg.style.display = 'none';
  
  // Show Next Round button for host
  var nextBtn = document.getElementById('next-round-btn');
  if (nextBtn) {
    nextBtn.style.display = window._amHost ? '' : 'none';
    var nextLabel = document.getElementById('lbl-next-round');
    if (nextLabel) nextLabel.textContent = lang === 'pl' ? 'Następna runda' : lang === 'de' ? 'Nächste Runde' : lang === 'sv' ? 'Nästa runda' : 'Next Round';
  }
  
  clearInterval(window._timerInterval);
  var timerText = document.getElementById('timer-text');
  if (timerText) timerText.textContent = '';
}

// ── FINAL ──
function renderFinal(data) {
  var el = document.getElementById('final-scores');
  if (!el) return;
  
  var redScore = data.teams.red.score;
  var blueScore = data.teams.blue.score;
  var winner = redScore > blueScore ? 'red' : (blueScore > redScore ? 'blue' : 'tie');
  
  el.innerHTML =
    '<div class="final-team-score' + (winner === 'red' ? ' winner' : '') + '">' +
      '<div class="final-team-label">' + L.teamRed + '</div>' +
      '<div class="final-team-pts">' + redScore + '</div>' +
      (winner === 'red' ? '<div class="winner-badge">🏆</div>' : '') +
    '</div>' +
    '<div class="final-vs">VS</div>' +
    '<div class="final-team-score' + (winner === 'blue' ? ' winner' : '') + '">' +
      '<div class="final-team-label">' + L.teamBlue + '</div>' +
      '<div class="final-team-pts">' + blueScore + '</div>' +
      (winner === 'blue' ? '<div class="winner-badge">🏆</div>' : '') +
    '</div>' +
    (winner === 'tie' ? '<div class="tie-label">🤝 Tie!</div>' : '');
  
  var playAgainBtn = document.getElementById('play-again-btn');
  if (playAgainBtn) playAgainBtn.style.display = window._amHost ? '' : 'none';
  
  var reactionEl = document.getElementById('reaction-container');
  if (reactionEl && typeof window._buildReactionBar === 'function') {
    window._buildReactionBar(reactionEl, roomCode, myName || '');
  }
}

// ── Timer ──
function renderTimer(timerEnd, timerSecs) {
  clearInterval(window._timerInterval);
  var timerEl = document.getElementById('timer-text');
  var barEl = document.getElementById('timer-bar');
  if (!timerEl || !timerEnd) return;
  function tick() {
    var left = Math.max(0, Math.ceil((timerEnd - Date.now()) / 1000));
    timerEl.textContent = left + 's';
    timerEl.style.color = left <= 10 ? 'var(--red)' : 'var(--accent)';
    if (barEl) barEl.style.width = (left / timerSecs * 100) + '%';
    if (left <= 0) clearInterval(window._timerInterval);
  }
  tick();
  window._timerInterval = setInterval(tick, 200);
}

// ── Actions ──
function createRoom() {
  myName = document.getElementById('create-name').value.trim();
  if (!myName) return;
  socket.emit('charades_create', { name: myName, settings: { lang: lang } });
}
function joinRoom() {
  myName = document.getElementById('join-name').value.trim();
  var code = document.getElementById('join-code').value.trim().toUpperCase();
  if (!myName || !code) return;
  socket.emit('charades_join', { code: code, name: myName });
}
function startGame() { socket.emit('charades_start', { code: roomCode }); }
function actorCorrect() { socket.emit('charades_correct', { code: roomCode }); }
function actorPass() { socket.emit('charades_pass', { code: roomCode }); }
function actorReady() { socket.emit('charades_ready', { code: roomCode }); }
function nextRound() { socket.emit('charades_next_round', { code: roomCode }); }
function playAgain() { socket.emit('charades_play_again', { code: roomCode }); }
function goHome() {
  sessionStorage.removeItem('charades_code');
  sessionStorage.removeItem('charades_name');
  var langUrls = { pl: '/kalambury', en: '/charades-online', de: '/scharade', sv: '/charader' };
  window.location.href = langUrls[lang] || '/kalambury';
}
function leaveRoom() {
  sessionStorage.removeItem('charades_code');
  sessionStorage.removeItem('charades_name');
  if (roomCode) socket.emit('charades_leave', { code: roomCode });
  roomCode = '';
  myName = '';
  showScreen('screen-home');
  window.scrollTo(0, 0);
}
window.movePlayer = function(id, team) { socket.emit('charades_move_team', { code: roomCode, playerId: id, team: team }); };

// ── Language ──
function setUiLang(code) {
  // If we have SEO language URLs (injected by seo-inject), redirect to the correct page
  if (window._seoLangUrls && window._seoLangUrls[code]) {
    window.location.href = window._seoLangUrls[code];
    return;
  }
  // Fallback for non-SEO pages (e.g. /charades?lang=pl)
  var langUrls = { pl: '/kalambury', en: '/charades-online', de: '/scharade', sv: '/charader' };
  if (langUrls[code]) {
    window.location.href = langUrls[code];
    return;
  }
  lang = code; L = LANGS[code];
  document.querySelectorAll('.lang-btn').forEach(function(b) { b.classList.toggle('active', b.dataset.lang === code); });
  applyTranslations();
  if (typeof window._rebuildBurger === 'function') window._rebuildBurger(code);
}
function applyTranslations() {
  var map = {
    'lbl-game-title':'gameTitle','lbl-game-subtitle':'gameSubtitle',
    'lbl-create-room':'createRoom','lbl-join-room':'joinRoom',
    'lbl-create-btn':'createRoom','lbl-join-btn':'joinRoom',
    'lbl-settings':'settings','lbl-category':'category','lbl-difficulty':'difficulty',
    'lbl-timer':'timer','lbl-game-length':'gameLength',
    'lbl-start':'startGame','lbl-final-title':'finalTitle',
    'lbl-leave-room':'leaveRoom',
    'lbl-play-again':'playAgain','lbl-go-home':'goHome',
    'game-title':'gameTitle','game-subtitle':'gameSubtitle',
  };
  for (var id in map) {
    var el = document.getElementById(id);
    if (el && L[map[id]]) el.textContent = L[map[id]];
  }
  // Field labels
  var yourNameLabel = lang === 'pl' ? 'Twoje imię' : lang === 'de' ? 'Dein Name' : lang === 'sv' ? 'Ditt namn' : 'Your name';
  var roomCodeLabel = lang === 'pl' ? 'Kod pokoju' : lang === 'de' ? 'Raumcode' : lang === 'sv' ? 'Rumskod' : 'Room code';
  var yn1 = document.getElementById('lbl-your-name-1'); if (yn1) yn1.textContent = yourNameLabel;
  var yn2 = document.getElementById('lbl-your-name-2'); if (yn2) yn2.textContent = yourNameLabel;
  var rc = document.getElementById('lbl-room-code'); if (rc) rc.textContent = roomCodeLabel;
  // Nav labels
  document.querySelectorAll('.lbl-nav-home-dup').forEach(function(el) { el.textContent = lang === 'pl' ? 'Strona główna' : lang === 'de' ? 'Startseite' : lang === 'sv' ? 'Hem' : 'Home'; });
  var allGames = document.getElementById('lbl-nav-all-games');
  if (allGames) allGames.textContent = lang === 'pl' ? 'Wszystkie gry' : lang === 'de' ? 'Alle Spiele' : lang === 'sv' ? 'Alla spel' : 'All Games';
  // Input placeholders
  var n1 = document.getElementById('create-name'); if (n1) n1.placeholder = L.enterName;
  var n2 = document.getElementById('join-name'); if (n2) n2.placeholder = L.enterName;
  var c1 = document.getElementById('join-code'); if (c1) c1.placeholder = L.enterCode;
  // How to play
  var howToTitle = document.getElementById('lbl-how-to-play');
  if (howToTitle) howToTitle.textContent = lang === 'pl' ? 'Jak grać' : lang === 'de' ? 'Spielanleitung' : lang === 'sv' ? 'Hur man spelar' : 'How to play';
  var stepTexts = {
    pl: ['Podzielcie się na 2 drużyny','Każdą rundę jeden gracz widzi tajne hasło','Pokaż je gestem — bez słów, bez wskazywania!','Twoja drużyna krzyczy odpowiedzi — kliknij ✅ gdy zgadną','Każde prawidłowe hasło = 1 punkt dla drużyny'],
    en: ['Split into 2 teams','Each round, one player sees a secret word','Act it out — no sounds, no pointing!','Your team shouts guesses — tap ✅ when they get it','Each correct guess = 1 point for your team'],
    de: ['Teilt euch in 2 Teams auf','Jede Runde sieht ein Spieler ein geheimes Wort','Stelle es dar — keine Geräusche, kein Zeigen!','Dein Team ruft Antworten — tippe ✅ wenn sie es haben','Jede richtige Antwort = 1 Punkt fürs Team'],
    sv: ['Dela upp i 2 lag','Varje runda ser en spelare ett hemligt ord','Visa det — inga ljud, inget pekande!','Ditt lag ropar gissningar — tryck ✅ när de gissar rätt','Varje rätt gissning = 1 poäng för laget'],
  };
  // Translate home screen rules and lobby rules separately
  ['#screen-home .rule-step p', '#lobby-rules-steps .rule-step p'].forEach(function(selector) {
    var steps = document.querySelectorAll(selector);
    if (steps.length === 5 && stepTexts[lang]) {
      steps.forEach(function(el, i) { el.textContent = stepTexts[lang][i]; });
    }
  });
}

// Share
function charadesShareRoom() {
  var langUrls = { pl: '/kalambury', en: '/charades-online', de: '/scharade', sv: '/charader' };
  var path = (window._seoLangUrls && window._seoLangUrls[lang]) || langUrls[lang] || '/kalambury';
  var url = window.location.origin + path + '?join=' + roomCode;
  var text = L.shareText.replace('{code}', roomCode).replace('{url}', url);
  if (navigator.share) {
    navigator.share({ title: L.gameTitle, text: text }).catch(function(){});
  } else {
    navigator.clipboard.writeText(text).then(function() {
      var btn = document.getElementById('share-btn');
      if (btn) { btn.textContent = '✓'; setTimeout(function(){ btn.textContent = '📤'; }, 2000); }
    });
  }
}

// Lang bar
function buildLangBar() {
  var bar = document.getElementById('lang-bar');
  if (!bar) return;
  bar.innerHTML = Object.keys(LANGS).map(function(code) {
    return '<button class="lang-btn' + (code === lang ? ' active' : '') + '" data-lang="' + code + '" onclick="setUiLang(\'' + code + '\')">' + LANGS[code].name + '</button>';
  }).join('');
}

// Init
buildLangBar();
applyTranslations();
