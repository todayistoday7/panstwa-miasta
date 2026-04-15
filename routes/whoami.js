'use strict';
// ════════════════════════════════════════════════════════
// WHO AM I — Server Route
// ════════════════════════════════════════════════════════

const { isBotName, isHoneypot } = require('./botfilter');

// ── Character Database ────────────────────────────────────────────
const CHARACTERS = {
  sports: {
    easy: [
    {en:"Messi",pl:"Messi",de:"Messi",sv:"Messi",langs:["en", "pl", "de", "sv"]},
    {en:"Cristiano Ronaldo",pl:"Cristiano Ronaldo",de:"Cristiano Ronaldo",sv:"Cristiano Ronaldo",langs:["en", "pl", "de", "sv"]},
    {en:"Serena Williams",pl:"Serena Williams",de:"Serena Williams",sv:"Serena Williams",langs:["en", "pl", "de", "sv"]},
    {en:"Usain Bolt",pl:"Usain Bolt",de:"Usain Bolt",sv:"Usain Bolt",langs:["en", "pl", "de", "sv"]},
    {en:"Muhammad Ali",pl:"Muhammad Ali",de:"Muhammad Ali",sv:"Muhammad Ali",langs:["en", "pl", "de", "sv"]},
    {en:"Michael Jordan",pl:"Michael Jordan",de:"Michael Jordan",sv:"Michael Jordan",langs:["en", "pl", "de", "sv"]},
    {en:"LeBron James",pl:"LeBron James",de:"LeBron James",sv:"LeBron James",langs:["en", "pl", "de", "sv"]},
    {en:"Roger Federer",pl:"Roger Federer",de:"Roger Federer",sv:"Roger Federer",langs:["en", "pl", "de", "sv"]},
    {en:"Tiger Woods",pl:"Tiger Woods",de:"Tiger Woods",sv:"Tiger Woods",langs:["en", "pl", "de", "sv"]},
    {en:"Pel\u00e9",pl:"Pel\u00e9",de:"Pel\u00e9",sv:"Pel\u00e9",langs:["en", "pl", "de", "sv"]},
    {en:"Lewis Hamilton",pl:"Lewis Hamilton",de:"Lewis Hamilton",sv:"Lewis Hamilton",langs:["en", "pl", "de", "sv"]},
    {en:"Simone Biles",pl:"Simone Biles",de:"Simone Biles",sv:"Simone Biles",langs:["en", "pl", "de", "sv"]},
    {en:"Rafael Nadal",pl:"Rafael Nadal",de:"Rafael Nadal",sv:"Rafael Nadal",langs:["en", "pl", "de", "sv"]},
    {en:"Mike Tyson",pl:"Mike Tyson",de:"Mike Tyson",sv:"Mike Tyson",langs:["en", "pl", "de", "sv"]},
    {en:"Neymar",pl:"Neymar",de:"Neymar",sv:"Neymar",langs:["en", "pl", "de", "sv"]},
    {en:"Kylian Mbapp\u00e9",pl:"Kylian Mbapp\u00e9",de:"Kylian Mbapp\u00e9",sv:"Kylian Mbapp\u00e9",langs:["en", "pl", "de", "sv"]},
    {en:"Conor McGregor",pl:"Conor McGregor",de:"Conor McGregor",sv:"Conor McGregor",langs:["en", "pl", "de", "sv"]},
    {en:"Floyd Mayweather",pl:"Floyd Mayweather",de:"Floyd Mayweather",sv:"Floyd Mayweather",langs:["en", "pl", "de", "sv"]},
    {en:"Wayne Gretzky",pl:"Wayne Gretzky",de:"Wayne Gretzky",sv:"Wayne Gretzky",langs:["en", "pl", "de", "sv"]},
    {en:"Tom Brady",pl:"Tom Brady",de:"Tom Brady",sv:"Tom Brady",langs:["en", "pl", "de", "sv"]},
    {en:"Ronaldinho",pl:"Ronaldinho",de:"Ronaldinho",sv:"Ronaldinho",langs:["en", "pl", "de", "sv"]},
    {en:"Zinedine Zidane",pl:"Zinedine Zidane",de:"Zinedine Zidane",sv:"Zinedine Zidane",langs:["en", "pl", "de", "sv"]},
    {en:"David Beckham",pl:"David Beckham",de:"David Beckham",sv:"David Beckham",langs:["en", "pl", "de", "sv"]},
    {en:"Robert Kubica",pl:"Robert Kubica",de:"Robert Kubica",sv:"Robert Kubica",langs:["pl"]},
    {en:"Adam Ma\u0142ysz",pl:"Adam Ma\u0142ysz",de:"Adam Ma\u0142ysz",sv:"Adam Ma\u0142ysz",langs:["pl"]},
    {en:"Jakub B\u0142aszczykowski",pl:"Jakub B\u0142aszczykowski",de:"Jakub B\u0142aszczykowski",sv:"Jakub B\u0142aszczykowski",langs:["pl"]},
    {en:"Iga \u015awi\u0105tek",pl:"Iga \u015awi\u0105tek",de:"Iga \u015awi\u0105tek",sv:"Iga \u015awi\u0105tek",langs:["pl"]},
    {en:"Mariusz Pudzianowski",pl:"Mariusz Pudzianowski",de:"Mariusz Pudzianowski",sv:"Mariusz Pudzianowski",langs:["pl"]},
    {en:"Kamil Stoch",pl:"Kamil Stoch",de:"Kamil Stoch",sv:"Kamil Stoch",langs:["pl"]},
    {en:"Jan B\u0142achowicz",pl:"Jan B\u0142achowicz",de:"Jan B\u0142achowicz",sv:"Jan B\u0142achowicz",langs:["pl"]},
    {en:"Robert Lewandowski",pl:"Robert Lewandowski",de:"Robert Lewandowski",sv:"Robert Lewandowski",langs:["pl", "de", "sv", "en"]},
    {en:"Zlatan Ibrahimovi\u0107",pl:"Zlatan Ibrahimovi\u0107",de:"Zlatan Ibrahimovi\u0107",sv:"Zlatan Ibrahimovi\u0107",langs:["sv"]},
    {en:"Ingemar Stenmark",pl:"Ingemar Stenmark",de:"Ingemar Stenmark",sv:"Ingemar Stenmark",langs:["sv"]},
    {en:"Bj\u00f6rn Borg",pl:"Bj\u00f6rn Borg",de:"Bj\u00f6rn Borg",sv:"Bj\u00f6rn Borg",langs:["sv"]},
    {en:"Sarah Sj\u00f6str\u00f6m",pl:"Sarah Sj\u00f6str\u00f6m",de:"Sarah Sj\u00f6str\u00f6m",sv:"Sarah Sj\u00f6str\u00f6m",langs:["sv"]},
    {en:"Fredrik Ljungberg",pl:"Fredrik Ljungberg",de:"Fredrik Ljungberg",sv:"Fredrik Ljungberg",langs:["sv"]},
    {en:"Franz Beckenbauer",pl:"Franz Beckenbauer",de:"Franz Beckenbauer",sv:"Franz Beckenbauer",langs:["de"]},
    {en:"Manuel Neuer",pl:"Manuel Neuer",de:"Manuel Neuer",sv:"Manuel Neuer",langs:["de"]},
    {en:"That Olympic breakdancer (Rachael Gunn)",pl:"Breakdancerka z Igrzysk Olimpijskich (Rachel Gunn)",de:"Breakdancerin von den Olympischen Spielen (Rachel Gunn)",sv:"Breakdansaren fr\u00e5n OS (Rachel Gunn)",langs:["en", "pl", "de", "sv"]}
    ],
    medium: [
    {en:"Ayrton Senna",pl:"Ayrton Senna",de:"Ayrton Senna",sv:"Ayrton Senna",langs:["en", "pl", "de", "sv"]},
    {en:"Magic Johnson",pl:"Magic Johnson",de:"Magic Johnson",sv:"Magic Johnson",langs:["en", "pl", "de", "sv"]},
    {en:"Martina Navratilova",pl:"Martina Navratilova",de:"Martina Navratilova",sv:"Martina Navratilova",langs:["en", "pl", "de", "sv"]},
    {en:"Carl Lewis",pl:"Carl Lewis",de:"Carl Lewis",sv:"Carl Lewis",langs:["en", "pl", "de", "sv"]},
    {en:"Roberto Carlos",pl:"Roberto Carlos",de:"Roberto Carlos",sv:"Roberto Carlos",langs:["en", "pl", "de", "sv"]},
    {en:"Thierry Henry",pl:"Thierry Henry",de:"Thierry Henry",sv:"Thierry Henry",langs:["en", "pl", "de", "sv"]},
    {en:"Novak Djokovic",pl:"Novak Djokovic",de:"Novak Djokovic",sv:"Novak Djokovic",langs:["en", "pl", "de", "sv"]},
    {en:"Manny Pacquiao",pl:"Manny Pacquiao",de:"Manny Pacquiao",sv:"Manny Pacquiao",langs:["en", "pl", "de", "sv"]},
    {en:"Lance Armstrong",pl:"Lance Armstrong",de:"Lance Armstrong",sv:"Lance Armstrong",langs:["en", "pl", "de", "sv"]},
    {en:"Diego Maradona",pl:"Diego Maradona",de:"Diego Maradona",sv:"Diego Maradona",langs:["en", "pl", "de", "sv"]},
    {en:"Shaquille ONeal",pl:"Shaquille ONeal",de:"Shaquille ONeal",sv:"Shaquille ONeal",langs:["en", "pl", "de", "sv"]},
    {en:"Valentino Rossi",pl:"Valentino Rossi",de:"Valentino Rossi",sv:"Valentino Rossi",langs:["en", "pl", "de", "sv"]},
    {en:"Sebastian Vettel",pl:"Sebastian Vettel",de:"Sebastian Vettel",sv:"Sebastian Vettel",langs:["en", "pl", "de", "sv"]},
    {en:"Ronda Rousey",pl:"Ronda Rousey",de:"Ronda Rousey",sv:"Ronda Rousey",langs:["en", "pl", "de", "sv"]},
    {en:"Jon Jones",pl:"Jon Jones",de:"Jon Jones",sv:"Jon Jones",langs:["en", "pl", "de", "sv"]},
    {en:"Khabib Nurmagomedov",pl:"Khabib Nurmagomedov",de:"Khabib Nurmagomedov",sv:"Khabib Nurmagomedov",langs:["en", "pl", "de", "sv"]},
    {en:"Alex Pereira",pl:"Alex Pereira",de:"Alex Pereira",sv:"Alex Pereira",langs:["en", "pl", "de", "sv"]},
    {en:"Michael Schumacher",pl:"Michael Schumacher",de:"Michael Schumacher",sv:"Michael Schumacher",langs:["en", "pl", "de", "sv"]},
    {en:"Zbigniew Boniek",pl:"Zbigniew Boniek",de:"Zbigniew Boniek",sv:"Zbigniew Boniek",langs:["pl"]},
    {en:"Andrzej Go\u0142ota",pl:"Andrzej Go\u0142ota",de:"Andrzej Go\u0142ota",sv:"Andrzej Go\u0142ota",langs:["pl"]},
    {en:"Jeremy Sochan",pl:"Jeremy Sochan",de:"Jeremy Sochan",sv:"Jeremy Sochan",langs:["pl"]},
    {en:"Robert Korzeniowski",pl:"Robert Korzeniowski",de:"Robert Korzeniowski",sv:"Robert Korzeniowski",langs:["pl"]},
    {en:"Joanna J\u0119drzejczyk",pl:"Joanna J\u0119drzejczyk",de:"Joanna J\u0119drzejczyk",sv:"Joanna J\u0119drzejczyk",langs:["pl"]},
    {en:"Justyna Kowalczyk",pl:"Justyna Kowalczyk",de:"Justyna Kowalczyk",sv:"Justyna Kowalczyk",langs:["pl"]},
    {en:"Agnieszka Radwa\u0144ska",pl:"Agnieszka Radwa\u0144ska",de:"Agnieszka Radwa\u0144ska",sv:"Agnieszka Radwa\u0144ska",langs:["pl"]},
    {en:"Bartosz Zmarzlik",pl:"Bartosz Zmarzlik",de:"Bartosz Zmarzlik",sv:"Bartosz Zmarzlik",langs:["pl"]},
    {en:"Bartosz Kurek",pl:"Bartosz Kurek",de:"Bartosz Kurek",sv:"Bartosz Kurek",langs:["pl"]},
    {en:"Armand Duplantis",pl:"Armand Duplantis",de:"Armand Duplantis",sv:"Armand Duplantis",langs:["sv"]},
    {en:"Annika S\u00f6renstam",pl:"Annika S\u00f6renstam",de:"Annika S\u00f6renstam",sv:"Annika S\u00f6renstam",langs:["sv"]},
    {en:"Peter Forsberg",pl:"Peter Forsberg",de:"Peter Forsberg",sv:"Peter Forsberg",langs:["sv"]},
    {en:"Henrik Lundqvist",pl:"Henrik Lundqvist",de:"Henrik Lundqvist",sv:"Henrik Lundqvist",langs:["sv"]},
    {en:"Jan-Ove Waldner",pl:"Jan-Ove Waldner",de:"Jan-Ove Waldner",sv:"Jan-Ove Waldner",langs:["sv"]},
    {en:"Ingemar Johansson",pl:"Ingemar Johansson",de:"Ingemar Johansson",sv:"Ingemar Johansson",langs:["sv"]},
    {en:"Carolina Kl\u00fcft",pl:"Carolina Kl\u00fcft",de:"Carolina Kl\u00fcft",sv:"Carolina Kl\u00fcft",langs:["sv"]},
    {en:"Henrik Larsson",pl:"Henrik Larsson",de:"Henrik Larsson",sv:"Henrik Larsson",langs:["sv"]},
    {en:"Ebba\u00c5rsj\u00f6",pl:"Ebba\u00c5rsj\u00f6",de:"Ebba\u00c5rsj\u00f6",sv:"Ebba\u00c5rsj\u00f6",langs:["sv"]},
    {en:"William Nylander",pl:"William Nylander",de:"William Nylander",sv:"William Nylander",langs:["sv"]},
    {en:"Johanna Rytting Karneryd",pl:"Johanna Rytting Karneryd",de:"Johanna Rytting Karneryd",sv:"Johanna Rytting Karneryd",langs:["sv"]},
    {en:"Steffi Graf",pl:"Steffi Graf",de:"Steffi Graf",sv:"Steffi Graf",langs:["de"]},
    {en:"Boris Becker",pl:"Boris Becker",de:"Boris Becker",sv:"Boris Becker",langs:["de"]},
    {en:"Lothar Matth\u00e4us",pl:"Lothar Matth\u00e4us",de:"Lothar Matth\u00e4us",sv:"Lothar Matth\u00e4us",langs:["de"]},
    {en:"Gerd M\u00fcller",pl:"Gerd M\u00fcller",de:"Gerd M\u00fcller",sv:"Gerd M\u00fcller",langs:["de"]},
    {en:"Max Schmeling",pl:"Max Schmeling",de:"Max Schmeling",sv:"Max Schmeling",langs:["de"]},
    {en:"Toni Kroos",pl:"Toni Kroos",de:"Toni Kroos",sv:"Toni Kroos",langs:["de"]},
    {en:"Andy Murray",pl:"Andy Murray",de:"Andy Murray",sv:"Andy Murray",langs:["en"]},
    {en:"Sir Chris Hoy",pl:"Sir Chris Hoy",de:"Sir Chris Hoy",sv:"Sir Chris Hoy",langs:["en"]}
    ],
    hard: [
    {en:"Johan Cruyff",pl:"Johan Cruyff",de:"Johan Cruyff",sv:"Johan Cruyff",langs:["en", "pl", "de", "sv"]},
    {en:"Lev Yashin",pl:"Lev Yashin",de:"Lev Yashin",sv:"Lev Yashin",langs:["en", "pl", "de", "sv"]},
    {en:"Fanny Blankers-Koen",pl:"Fanny Blankers-Koen",de:"Fanny Blankers-Koen",sv:"Fanny Blankers-Koen",langs:["en", "pl", "de", "sv"]},
    {en:"Dick Fosbury",pl:"Dick Fosbury",de:"Dick Fosbury",sv:"Dick Fosbury",langs:["en", "pl", "de", "sv"]},
    {en:"Garrincha",pl:"Garrincha",de:"Garrincha",sv:"Garrincha",langs:["en", "pl", "de", "sv"]},
    {en:"Sonja Henie",pl:"Sonja Henie",de:"Sonja Henie",sv:"Sonja Henie",langs:["en", "pl", "de", "sv"]},
    {en:"Paavo Nurmi",pl:"Paavo Nurmi",de:"Paavo Nurmi",sv:"Paavo Nurmi",langs:["en", "pl", "de", "sv"]},
    {en:"Jesse Owens",pl:"Jesse Owens",de:"Jesse Owens",sv:"Jesse Owens",langs:["en", "pl", "de", "sv"]},
    {en:"Mia Hamm",pl:"Mia Hamm",de:"Mia Hamm",sv:"Mia Hamm",langs:["en", "pl", "de", "sv"]},
    {en:"Haile Gebrselassie",pl:"Haile Gebrselassie",de:"Haile Gebrselassie",sv:"Haile Gebrselassie",langs:["en", "pl", "de", "sv"]},
    {en:"Nadia Comaneci",pl:"Nadia Comaneci",de:"Nadia Comaneci",sv:"Nadia Comaneci",langs:["en", "pl", "de", "sv"]},
    {en:"Bob Beamon",pl:"Bob Beamon",de:"Bob Beamon",sv:"Bob Beamon",langs:["en", "pl", "de", "sv"]},
    {en:"Jim Thorpe",pl:"Jim Thorpe",de:"Jim Thorpe",sv:"Jim Thorpe",langs:["en", "pl", "de", "sv"]},
    {en:"Irena Szewi\u0144ska",pl:"Irena Szewi\u0144ska",de:"Irena Szewi\u0144ska",sv:"Irena Szewi\u0144ska",langs:["pl"]},
    {en:"Otylia J\u0119drzejczak",pl:"Otylia J\u0119drzejczak",de:"Otylia J\u0119drzejczak",sv:"Otylia J\u0119drzejczak",langs:["pl"]},
    {en:"Jerzy Kulej",pl:"Jerzy Kulej",de:"Jerzy Kulej",sv:"Jerzy Kulej",langs:["pl"]},
    {en:"Anita W\u0142odarczyk",pl:"Anita W\u0142odarczyk",de:"Anita W\u0142odarczyk",sv:"Anita W\u0142odarczyk",langs:["pl"]},
    {en:"Zbigniew Br\u00f3dka",pl:"Zbigniew Br\u00f3dka",de:"Zbigniew Br\u00f3dka",sv:"Zbigniew Br\u00f3dka",langs:["pl"]},
    {en:"Micha\u0142 Kwiatkowski",pl:"Micha\u0142 Kwiatkowski",de:"Micha\u0142 Kwiatkowski",sv:"Micha\u0142 Kwiatkowski",langs:["pl"]},
    {en:"Marcin Gortat",pl:"Marcin Gortat",de:"Marcin Gortat",sv:"Marcin Gortat",langs:["pl"]},
    {en:"Lotta Schelin",pl:"Lotta Schelin",de:"Lotta Schelin",sv:"Lotta Schelin",langs:["sv"]},
    {en:"Gunnar Nordahl",pl:"Gunnar Nordahl",de:"Gunnar Nordahl",sv:"Gunnar Nordahl",langs:["sv"]},
    {en:"B\u00f6rje Salming",pl:"B\u00f6rje Salming",de:"B\u00f6rje Salming",sv:"B\u00f6rje Salming",langs:["sv"]},
    {en:"Gunde Svahn",pl:"Gunde Svahn",de:"Gunde Svahn",sv:"Gunde Svahn",langs:["sv"]},
    {en:"Daniel St\u00e5hl",pl:"Daniel St\u00e5hl",de:"Daniel St\u00e5hl",sv:"Daniel St\u00e5hl",langs:["sv"]},
    {en:"Frida Karlsson",pl:"Frida Karlsson",de:"Frida Karlsson",sv:"Frida Karlsson",langs:["sv"]},
    {en:"Dirk Nowitzki",pl:"Dirk Nowitzki",de:"Dirk Nowitzki",sv:"Dirk Nowitzki",langs:["de"]}
    ],
  },
  music: {
    easy: [
    {en:"Michael Jackson",pl:"Michael Jackson",de:"Michael Jackson",sv:"Michael Jackson",langs:["en", "pl", "de", "sv"]},
    {en:"Madonna",pl:"Madonna",de:"Madonna",sv:"Madonna",langs:["en", "pl", "de", "sv"]},
    {en:"Elvis Presley",pl:"Elvis Presley",de:"Elvis Presley",sv:"Elvis Presley",langs:["en", "pl", "de", "sv"]},
    {en:"Beyonc\u00e9",pl:"Beyonc\u00e9",de:"Beyonc\u00e9",sv:"Beyonc\u00e9",langs:["en", "pl", "de", "sv"]},
    {en:"Freddie Mercury",pl:"Freddie Mercury",de:"Freddie Mercury",sv:"Freddie Mercury",langs:["en", "pl", "de", "sv"]},
    {en:"David Bowie",pl:"David Bowie",de:"David Bowie",sv:"David Bowie",langs:["en", "pl", "de", "sv"]},
    {en:"Taylor Swift",pl:"Taylor Swift",de:"Taylor Swift",sv:"Taylor Swift",langs:["en", "pl", "de", "sv"]},
    {en:"Eminem",pl:"Eminem",de:"Eminem",sv:"Eminem",langs:["en", "pl", "de", "sv"]},
    {en:"Rihanna",pl:"Rihanna",de:"Rihanna",sv:"Rihanna",langs:["en", "pl", "de", "sv"]},
    {en:"Lady Gaga",pl:"Lady Gaga",de:"Lady Gaga",sv:"Lady Gaga",langs:["en", "pl", "de", "sv"]},
    {en:"Ed Sheeran",pl:"Ed Sheeran",de:"Ed Sheeran",sv:"Ed Sheeran",langs:["en", "pl", "de", "sv"]},
    {en:"Adele",pl:"Adele",de:"Adele",sv:"Adele",langs:["en", "pl", "de", "sv"]},
    {en:"Justin Bieber",pl:"Justin Bieber",de:"Justin Bieber",sv:"Justin Bieber",langs:["en", "pl", "de", "sv"]},
    {en:"Bob Dylan",pl:"Bob Dylan",de:"Bob Dylan",sv:"Bob Dylan",langs:["en", "pl", "de", "sv"]},
    {en:"The Beatles",pl:"The Beatles",de:"The Beatles",sv:"The Beatles",langs:["en", "pl", "de", "sv"]},
    {en:"Billie Eilish",pl:"Billie Eilish",de:"Billie Eilish",sv:"Billie Eilish",langs:["en", "pl", "de", "sv"]},
    {en:"Drake",pl:"Drake",de:"Drake",sv:"Drake",langs:["en", "pl", "de", "sv"]},
    {en:"Ariana Grande",pl:"Ariana Grande",de:"Ariana Grande",sv:"Ariana Grande",langs:["en", "pl", "de", "sv"]},
    {en:"Bruno Mars",pl:"Bruno Mars",de:"Bruno Mars",sv:"Bruno Mars",langs:["en", "pl", "de", "sv"]},
    {en:"Justin Timberlake",pl:"Justin Timberlake",de:"Justin Timberlake",sv:"Justin Timberlake",langs:["en", "pl", "de", "sv"]},
    {en:"Katy Perry",pl:"Katy Perry",de:"Katy Perry",sv:"Katy Perry",langs:["en", "pl", "de", "sv"]},
    {en:"Coldplay",pl:"Coldplay",de:"Coldplay",sv:"Coldplay",langs:["en", "pl", "de", "sv"]},
    {en:"U2",pl:"U2",de:"U2",sv:"U2",langs:["en", "pl", "de", "sv"]},
    {en:"Metallica",pl:"Metallica",de:"Metallica",sv:"Metallica",langs:["en", "pl", "de", "sv"]},
    {en:"ABBA",pl:"ABBA",de:"ABBA",sv:"ABBA",langs:["en", "pl", "de", "sv"]},
    {en:"Ye (Kanye West)",pl:"Ye (Kanye West)",de:"Ye (Kanye West)",sv:"Ye (Kanye West)",langs:["en", "pl", "de", "sv"]},
    {en:"Roxette",pl:"Roxette",de:"Roxette",sv:"Roxette",langs:["en", "pl", "de", "sv"]},
    {en:"Dawid Podsiad\u0142o",pl:"Dawid Podsiad\u0142o",de:"Dawid Podsiad\u0142o",sv:"Dawid Podsiad\u0142o",langs:["pl"]},
    {en:"Doda",pl:"Doda",de:"Doda",sv:"Doda",langs:["pl"]},
    {en:"Skolim",pl:"Skolim",de:"Skolim",sv:"Skolim",langs:["pl"]},
    {en:"Tribbs",pl:"Tribbs",de:"Tribbs",sv:"Tribbs",langs:["pl"]},
    {en:"Wersow",pl:"Wersow",de:"Wersow",sv:"Wersow",langs:["pl"]},
    {en:"Mata",pl:"Mata",de:"Mata",sv:"Mata",langs:["pl"]},
    {en:"Helene Fischer",pl:"Helene Fischer",de:"Helene Fischer",sv:"Helene Fischer",langs:["de"]},
    {en:"Ayliva",pl:"Ayliva",de:"Ayliva",sv:"Ayliva",langs:["de"]},
    {en:"Apache 207",pl:"Apache 207",de:"Apache 207",sv:"Apache 207",langs:["de"]},
    {en:"Nina Chuba",pl:"Nina Chuba",de:"Nina Chuba",sv:"Nina Chuba",langs:["de"]},
    {en:"Pashanim",pl:"Pashanim",de:"Pashanim",sv:"Pashanim",langs:["de"]},
    {en:"SDP",pl:"SDP",de:"SDP",sv:"SDP",langs:["de"]},
    {en:"Herbert Gr\u00f6nemeyer",pl:"Herbert Gr\u00f6nemeyer",de:"Herbert Gr\u00f6nemeyer",sv:"Herbert Gr\u00f6nemeyer",langs:["de"]},
    {en:"Zara Larsson",pl:"Zara Larsson",de:"Zara Larsson",sv:"Zara Larsson",langs:["sv"]},
    {en:"Avicii",pl:"Avicii",de:"Avicii",sv:"Avicii",langs:["sv"]},
    {en:"Swedish House Mafia",pl:"Swedish House Mafia",de:"Swedish House Mafia",sv:"Swedish House Mafia",langs:["sv"]},
    {en:"Tove Lo",pl:"Tove Lo",de:"Tove Lo",sv:"Tove Lo",langs:["sv"]},
    {en:"Lykke Li",pl:"Lykke Li",de:"Lykke Li",sv:"Lykke Li",langs:["sv"]},
    {en:"Axwell \u039b Ingrosso",pl:"Axwell \u039b Ingrosso",de:"Axwell \u039b Ingrosso",sv:"Axwell \u039b Ingrosso",langs:["sv"]},
    {en:"H\u00e5kan Hellstr\u00f6m",pl:"H\u00e5kan Hellstr\u00f6m",de:"H\u00e5kan Hellstr\u00f6m",sv:"H\u00e5kan Hellstr\u00f6m",langs:["sv"]}
    ],
    medium: [
    {en:"Kurt Cobain",pl:"Kurt Cobain",de:"Kurt Cobain",sv:"Kurt Cobain",langs:["en", "pl", "de", "sv"]},
    {en:"Amy Winehouse",pl:"Amy Winehouse",de:"Amy Winehouse",sv:"Amy Winehouse",langs:["en", "pl", "de", "sv"]},
    {en:"Bob Marley",pl:"Bob Marley",de:"Bob Marley",sv:"Bob Marley",langs:["en", "pl", "de", "sv"]},
    {en:"Jimi Hendrix",pl:"Jimi Hendrix",de:"Jimi Hendrix",sv:"Jimi Hendrix",langs:["en", "pl", "de", "sv"]},
    {en:"Frank Sinatra",pl:"Frank Sinatra",de:"Frank Sinatra",sv:"Frank Sinatra",langs:["en", "pl", "de", "sv"]},
    {en:"Jim Morrison",pl:"Jim Morrison",de:"Jim Morrison",sv:"Jim Morrison",langs:["en", "pl", "de", "sv"]},
    {en:"Janis Joplin",pl:"Janis Joplin",de:"Janis Joplin",sv:"Janis Joplin",langs:["en", "pl", "de", "sv"]},
    {en:"Bruce Springsteen",pl:"Bruce Springsteen",de:"Bruce Springsteen",sv:"Bruce Springsteen",langs:["en", "pl", "de", "sv"]},
    {en:"Prince",pl:"Prince",de:"Prince",sv:"Prince",langs:["en", "pl", "de", "sv"]},
    {en:"Whitney Houston",pl:"Whitney Houston",de:"Whitney Houston",sv:"Whitney Houston",langs:["en", "pl", "de", "sv"]},
    {en:"Tupac Shakur",pl:"Tupac Shakur",de:"Tupac Shakur",sv:"Tupac Shakur",langs:["en", "pl", "de", "sv"]},
    {en:"Notorious BIG",pl:"Notorious BIG",de:"Notorious BIG",sv:"Notorious BIG",langs:["en", "pl", "de", "sv"]},
    {en:"Johnny Cash",pl:"Johnny Cash",de:"Johnny Cash",sv:"Johnny Cash",langs:["en", "pl", "de", "sv"]},
    {en:"Eric Clapton",pl:"Eric Clapton",de:"Eric Clapton",sv:"Eric Clapton",langs:["en", "pl", "de", "sv"]},
    {en:"Led Zeppelin",pl:"Led Zeppelin",de:"Led Zeppelin",sv:"Led Zeppelin",langs:["en", "pl", "de", "sv"]},
    {en:"Pink Floyd",pl:"Pink Floyd",de:"Pink Floyd",sv:"Pink Floyd",langs:["en", "pl", "de", "sv"]},
    {en:"Nirvana",pl:"Nirvana",de:"Nirvana",sv:"Nirvana",langs:["en", "pl", "de", "sv"]},
    {en:"The Rolling Stones",pl:"The Rolling Stones",de:"The Rolling Stones",sv:"The Rolling Stones",langs:["en", "pl", "de", "sv"]},
    {en:"Elton John",pl:"Elton John",de:"Elton John",sv:"Elton John",langs:["en", "pl", "de", "sv"]},
    {en:"David Guetta",pl:"David Guetta",de:"David Guetta",sv:"David Guetta",langs:["en", "pl", "de", "sv"]},
    {en:"AC/DC",pl:"AC/DC",de:"AC/DC",sv:"AC/DC",langs:["en", "pl", "de", "sv"]},
    {en:"Red Hot Chili Peppers",pl:"Red Hot Chili Peppers",de:"Red Hot Chili Peppers",sv:"Red Hot Chili Peppers",langs:["en", "pl", "de", "sv"]},
    {en:"Ti\u00ebsto",pl:"Ti\u00ebsto",de:"Ti\u00ebsto",sv:"Ti\u00ebsto",langs:["en", "pl", "de", "sv"]},
    {en:"Calvin Harris",pl:"Calvin Harris",de:"Calvin Harris",sv:"Calvin Harris",langs:["en", "pl", "de", "sv"]},
    {en:"Rammstein",pl:"Rammstein",de:"Rammstein",sv:"Rammstein",langs:["pl", "de", "sv", "en"]},
    {en:"Scorpions",pl:"Scorpions",de:"Scorpions",sv:"Scorpions",langs:["en", "pl", "de", "sv"]},
    {en:"Fr\u00e9d\u00e9ric Chopin",pl:"Fryderyk Chopin",de:"Fr\u00e9d\u00e9ric Chopin",sv:"Fr\u00e9d\u00e9ric Chopin",langs:["en", "pl", "de", "sv"]},
    {en:"Sanah",pl:"Sanah",de:"Sanah",sv:"Sanah",langs:["pl"]},
    {en:"Taco Hemingway",pl:"Taco Hemingway",de:"Taco Hemingway",sv:"Taco Hemingway",langs:["pl"]},
    {en:"Malik Montana",pl:"Malik Montana",de:"Malik Montana",sv:"Malik Montana",langs:["pl"]},
    {en:"Ogryzek",pl:"Ogryzek",de:"Ogryzek",sv:"Ogryzek",langs:["pl"]},
    {en:"Edyta G\u00f3rniak",pl:"Edyta G\u00f3rniak",de:"Edyta G\u00f3rniak",sv:"Edyta G\u00f3rniak",langs:["pl"]},
    {en:"Agnieszka Chyli\u0144ska",pl:"Agnieszka Chyli\u0144ska",de:"Agnieszka Chyli\u0144ska",sv:"Agnieszka Chyli\u0144ska",langs:["pl"]},
    {en:"Nosowska",pl:"Nosowska",de:"Nosowska",sv:"Nosowska",langs:["pl"]},
    {en:"Daria Zawia\u0142ow",pl:"Daria Zawia\u0142ow",de:"Daria Zawia\u0142ow",sv:"Daria Zawia\u0142ow",langs:["pl"]},
    {en:"S\u0142awomir",pl:"S\u0142awomir",de:"S\u0142awomir",sv:"S\u0142awomir",langs:["pl"]},
    {en:"Roxie W\u0119giel",pl:"Roxie W\u0119giel",de:"Roxie W\u0119giel",sv:"Roxie W\u0119giel",langs:["pl"]},
    {en:"\u017babson",pl:"\u017babson",de:"\u017babson",sv:"\u017babson",langs:["pl"]},
    {en:"Czerwone Gitary",pl:"Czerwone Gitary",de:"Czerwone Gitary",sv:"Czerwone Gitary",langs:["pl"]},
    {en:"Budka Suflera",pl:"Budka Suflera",de:"Budka Suflera",sv:"Budka Suflera",langs:["pl"]},
    {en:"Kult",pl:"Kult",de:"Kult",sv:"Kult",langs:["pl"]},
    {en:"Quebonafide",pl:"Quebonafide",de:"Quebonafide",sv:"Quebonafide",langs:["pl"]},
    {en:"Boney M.",pl:"Boney M.",de:"Boney M.",sv:"Boney M.",langs:["pl", "de", "sv"]},
    {en:"Modern Talking",pl:"Modern Talking",de:"Modern Talking",sv:"Modern Talking",langs:["pl", "de"]},
    {en:"Ikke H\u00fcftgold",pl:"Ikke H\u00fcftgold",de:"Ikke H\u00fcftgold",sv:"Ikke H\u00fcftgold",langs:["de"]},
    {en:"Die Toten Hosen",pl:"Die Toten Hosen",de:"Die Toten Hosen",sv:"Die Toten Hosen",langs:["de"]},
    {en:"Electric Callboy",pl:"Electric Callboy",de:"Electric Callboy",sv:"Electric Callboy",langs:["de"]},
    {en:"Paula Hartmann",pl:"Paula Hartmann",de:"Paula Hartmann",sv:"Paula Hartmann",langs:["de"]},
    {en:"Badmonzjay",pl:"Badmonzjay",de:"Badmonzjay",sv:"Badmonzjay",langs:["de"]},
    {en:"Lucio101",pl:"Lucio101",de:"Lucio101",sv:"Lucio101",langs:["de"]},
    {en:"Ben B\u00f6hmer",pl:"Ben B\u00f6hmer",de:"Ben B\u00f6hmer",sv:"Ben B\u00f6hmer",langs:["de"]},
    {en:"Giant Rooks",pl:"Giant Rooks",de:"Giant Rooks",sv:"Giant Rooks",langs:["de"]},
    {en:"Loreen",pl:"Loreen",de:"Loreen",sv:"Loreen",langs:["sv"]},
    {en:"Icona Pop",pl:"Icona Pop",de:"Icona Pop",sv:"Icona Pop",langs:["sv"]},
    {en:"Ghost",pl:"Ghost",de:"Ghost",sv:"Ghost",langs:["sv"]},
    {en:"Arash",pl:"Arash",de:"Arash",sv:"Arash",langs:["sv"]},
    {en:"Ace of Base",pl:"Ace of Base",de:"Ace of Base",sv:"Ace of Base",langs:["sv"]},
    {en:"Vikingarna",pl:"Vikingarna",de:"Vikingarna",sv:"Vikingarna",langs:["sv"]},
    {en:"Finn Wolfhard",pl:"Finn Wolfhard",de:"Finn Wolfhard",sv:"Finn Wolfhard",langs:["sv"]},
    {en:"The Cardigans",pl:"The Cardigans",de:"The Cardigans",sv:"The Cardigans",langs:["sv"]},
    {en:"Young Leosia",pl:"Young Leosia",de:"Young Leosia",sv:"Young Leosia",langs:["pl"]},
    {en:"Bambi (rapper)",pl:"Bambi",de:"Bambi (rapper)",sv:"Bambi (rapper)",langs:["pl"]},
    {en:"Ski Akku",pl:"Ski Akku",de:"Ski Akku",sv:"Ski Akku",langs:["de"]}
    ],
    hard: [
    {en:"John Coltrane",pl:"John Coltrane",de:"John Coltrane",sv:"John Coltrane",langs:["en", "pl", "de", "sv"]},
    {en:"\u00c9dith Piaf",pl:"\u00c9dith Piaf",de:"\u00c9dith Piaf",sv:"\u00c9dith Piaf",langs:["en", "pl", "de", "sv"]},
    {en:"Charles Mingus",pl:"Charles Mingus",de:"Charles Mingus",sv:"Charles Mingus",langs:["en", "pl", "de", "sv"]},
    {en:"Klaus Nomi",pl:"Klaus Nomi",de:"Klaus Nomi",sv:"Klaus Nomi",langs:["en", "pl", "de", "sv"]},
    {en:"Chet Baker",pl:"Chet Baker",de:"Chet Baker",sv:"Chet Baker",langs:["en", "pl", "de", "sv"]},
    {en:"Thelonious Monk",pl:"Thelonious Monk",de:"Thelonious Monk",sv:"Thelonious Monk",langs:["en", "pl", "de", "sv"]},
    {en:"Nina Simone",pl:"Nina Simone",de:"Nina Simone",sv:"Nina Simone",langs:["en", "pl", "de", "sv"]},
    {en:"Billie Holiday",pl:"Billie Holiday",de:"Billie Holiday",sv:"Billie Holiday",langs:["en", "pl", "de", "sv"]},
    {en:"Miles Davis",pl:"Miles Davis",de:"Miles Davis",sv:"Miles Davis",langs:["en", "pl", "de", "sv"]},
    {en:"Igor Stravinsky",pl:"Igor Stravinsky",de:"Igor Stravinsky",sv:"Igor Stravinsky",langs:["en", "pl", "de", "sv"]},
    {en:"Sergei Rachmaninoff",pl:"Sergei Rachmaninoff",de:"Sergei Rachmaninoff",sv:"Sergei Rachmaninoff",langs:["en", "pl", "de", "sv"]},
    {en:"Scott Joplin",pl:"Scott Joplin",de:"Scott Joplin",sv:"Scott Joplin",langs:["en", "pl", "de", "sv"]},
    {en:"Woody Guthrie",pl:"Woody Guthrie",de:"Woody Guthrie",sv:"Woody Guthrie",langs:["en", "pl", "de", "sv"]},
    {en:"Martin Garrix",pl:"Martin Garrix",de:"Martin Garrix",sv:"Martin Garrix",langs:["en", "pl", "de", "sv"]},
    {en:"Skrillex",pl:"Skrillex",de:"Skrillex",sv:"Skrillex",langs:["en", "pl", "de", "sv"]},
    {en:"Czes\u0142aw Niemen",pl:"Czes\u0142aw Niemen",de:"Czes\u0142aw Niemen",sv:"Czes\u0142aw Niemen",langs:["pl"]},
    {en:"Kazik Staszewski",pl:"Kazik Staszewski",de:"Kazik Staszewski",sv:"Kazik Staszewski",langs:["pl"]},
    {en:"Myslovitz",pl:"Myslovitz",de:"Myslovitz",sv:"Myslovitz",langs:["pl"]},
    {en:"D\u017cem",pl:"D\u017cem",de:"D\u017cem",sv:"D\u017cem",langs:["pl"]},
    {en:"TSA",pl:"TSA",de:"TSA",sv:"TSA",langs:["pl"]},
    {en:"Turbo",pl:"Turbo",de:"Turbo",sv:"Turbo",langs:["pl"]},
    {en:"Perfect",pl:"Perfect",de:"Perfect",sv:"Perfect",langs:["pl"]},
    {en:"Marek Grechuta",pl:"Marek Grechuta",de:"Marek Grechuta",sv:"Marek Grechuta",langs:["pl"]},
    {en:"Grzegorz Turnau",pl:"Grzegorz Turnau",de:"Grzegorz Turnau",sv:"Grzegorz Turnau",langs:["pl"]},
    {en:"Stanis\u0142aw Soyka",pl:"Stanis\u0142aw Soyka",de:"Stanis\u0142aw Soyka",sv:"Stanis\u0142aw Soyka",langs:["pl"]},
    {en:"Mieczys\u0142aw Szcze\u015bniak",pl:"Mieczys\u0142aw Szcze\u015bniak",de:"Mieczys\u0142aw Szcze\u015bniak",sv:"Mieczys\u0142aw Szcze\u015bniak",langs:["pl"]},
    {en:"White 2115",pl:"White 2115",de:"White 2115",sv:"White 2115",langs:["pl"]},
    {en:"Die \u00c4rzte",pl:"Die \u00c4rzte",de:"Die \u00c4rzte",sv:"Die \u00c4rzte",langs:["de"]},
    {en:"Tokio Hotel",pl:"Tokio Hotel",de:"Tokio Hotel",sv:"Tokio Hotel",langs:["de"]},
    {en:"Robin Schulz",pl:"Robin Schulz",de:"Robin Schulz",sv:"Robin Schulz",langs:["de"]},
    {en:"COLORS",pl:"COLORS",de:"COLORS",sv:"COLORS",langs:["de"]},
    {en:"Hans Zimmer",pl:"Hans Zimmer",de:"Hans Zimmer",sv:"Hans Zimmer",langs:["de"]},
    {en:"Felix Jaehn",pl:"Felix Jaehn",de:"Felix Jaehn",sv:"Felix Jaehn",langs:["de"]},
    {en:"Emilio Piano",pl:"Emilio Piano",de:"Emilio Piano",sv:"Emilio Piano",langs:["de"]},
    {en:"Milky Chance",pl:"Milky Chance",de:"Milky Chance",sv:"Milky Chance",langs:["de"]},
    {en:"Scooter",pl:"Scooter",de:"Scooter",sv:"Scooter",langs:["de"]},
    {en:"Monica Zetterlund",pl:"Monica Zetterlund",de:"Monica Zetterlund",sv:"Monica Zetterlund",langs:["sv"]},
    {en:"Maher Zain",pl:"Maher Zain",de:"Maher Zain",sv:"Maher Zain",langs:["sv"]},
    {en:"Sabaton",pl:"Sabaton",de:"Sabaton",sv:"Sabaton",langs:["sv"]},
    {en:"Europe",pl:"Europe",de:"Europe",sv:"Europe",langs:["sv"]},
    {en:"Bladee",pl:"Bladee",de:"Bladee",sv:"Bladee",langs:["sv"]},
    {en:"Dr. Alban",pl:"Dr. Alban",de:"Dr. Alban",sv:"Dr. Alban",langs:["sv"]},
    {en:"AronChupa",pl:"AronChupa",de:"AronChupa",sv:"AronChupa",langs:["sv"]},
    {en:"mikeeysmind",pl:"mikeeysmind",de:"mikeeysmind",sv:"mikeeysmind",langs:["sv"]},
    {en:"Alcazar",pl:"Alcazar",de:"Alcazar",sv:"Alcazar",langs:["sv"]}
    ],
  },
  film: {
    easy: [
    {en:"James Bond",pl:"James Bond",de:"James Bond",sv:"James Bond",langs:["en", "pl", "de", "sv"]},
    {en:"Harry Potter",pl:"Harry Potter",de:"Harry Potter",sv:"Harry Potter",langs:["en", "pl", "de", "sv"]},
    {en:"Batman",pl:"Batman",de:"Batman",sv:"Batman",langs:["en", "pl", "de", "sv"]},
    {en:"Darth Vader",pl:"Darth Vader",de:"Darth Vader",sv:"Darth Vader",langs:["en", "pl", "de", "sv"]},
    {en:"Homer Simpson",pl:"Homer Simpson",de:"Homer Simpson",sv:"Homer Simpson",langs:["en", "pl", "de", "sv"]},
    {en:"Superman",pl:"Superman",de:"Superman",sv:"Superman",langs:["en", "pl", "de", "sv"]},
    {en:"Spider-Man",pl:"Spider-Man",de:"Spider-Man",sv:"Spider-Man",langs:["en", "pl", "de", "sv"]},
    {en:"Iron Man",pl:"Iron Man",de:"Iron Man",sv:"Iron Man",langs:["en", "pl", "de", "sv"]},
    {en:"Sherlock Holmes",pl:"Sherlock Holmes",de:"Sherlock Holmes",sv:"Sherlock Holmes",langs:["en", "pl", "de", "sv"]},
    {en:"Indiana Jones",pl:"Indiana Jones",de:"Indiana Jones",sv:"Indiana Jones",langs:["en", "pl", "de", "sv"]},
    {en:"Gandalf",pl:"Gandalf",de:"Gandalf",sv:"Gandalf",langs:["en", "pl", "de", "sv"]},
    {en:"Gollum",pl:"Gollum",de:"Gollum",sv:"Gollum",langs:["en", "pl", "de", "sv"]},
    {en:"Forrest Gump",pl:"Forrest Gump",de:"Forrest Gump",sv:"Forrest Gump",langs:["en", "pl", "de", "sv"]},
    {en:"Tony Stark",pl:"Tony Stark",de:"Tony Stark",sv:"Tony Stark",langs:["en", "pl", "de", "sv"]},
    {en:"Wonder Woman",pl:"Wonder Woman",de:"Wonder Woman",sv:"Wonder Woman",langs:["en", "pl", "de", "sv"]},
    {en:"Deadpool",pl:"Deadpool",de:"Deadpool",sv:"Deadpool",langs:["en", "pl", "de", "sv"]},
    {en:"Thanos",pl:"Thanos",de:"Thanos",sv:"Thanos",langs:["en", "pl", "de", "sv"]},
    {en:"Venom",pl:"Venom",de:"Venom",sv:"Venom",langs:["en", "pl", "de", "sv"]},
    {en:"Barbie",pl:"Barbie",de:"Barbie",sv:"Barbie",langs:["en", "pl", "de", "sv"]},
    {en:"Rocky Balboa",pl:"Rocky Balboa",de:"Rocky Balboa",sv:"Rocky Balboa",langs:["en", "pl", "de", "sv"]},
    {en:"Super Mario",pl:"Super Mario",de:"Super Mario",sv:"Super Mario",langs:["en", "pl", "de", "sv"]},
    {en:"Optimus Prime",pl:"Optimus Prime",de:"Optimus Prime",sv:"Optimus Prime",langs:["en", "pl", "de", "sv"]},
    {en:"Hermione Granger",pl:"Hermiona Granger",de:"Hermione Granger",sv:"Hermione Granger",langs:["en", "pl", "de", "sv"]},
    {en:"Jack Sparrow",pl:"Kapitan Jack Sparrow",de:"Jack Sparrow",sv:"Jack Sparrow",langs:["en", "pl", "de", "sv"]},
    {en:"The Joker",pl:"Joker",de:"Joker",sv:"Jokern",langs:["en", "pl", "de", "sv"]},
    {en:"Captain America",pl:"Kapitan Ameryka",de:"The First Avenger",sv:"Captain America",langs:["en", "pl", "de", "sv"]},
    {en:"Black Panther",pl:"Czarna Pantera",de:"Black Panther",sv:"Black Panther",langs:["en", "pl", "de", "sv"]},
    {en:"Thor",pl:"Thor",de:"Thor",sv:"Thor",langs:["en", "pl", "de", "sv"]},
    {en:"Mickey Mouse",pl:"Myszka Miki",de:"Micky Maus",sv:"Musse Pigg",langs:["en", "pl", "de", "sv"]},
    {en:"Winnie the Pooh",pl:"Kubu\u015b Puchatek",de:"Pu der B\u00e4r",sv:"Nalle Puh",langs:["en", "pl", "de", "sv"]},
    {en:"Nemo",pl:"Nemo",de:"Nemo",sv:"Nemo",langs:["en", "pl", "de", "sv"]},
    {en:"Simba",pl:"Simba",de:"Simba",sv:"Simba",langs:["en", "pl", "de", "sv"]},
    {en:"Elsa",pl:"Elsa",de:"Elsa",sv:"Elsa",langs:["en", "pl", "de", "sv"]},
    {en:"Woody",pl:"Chudy",de:"Sheriff Woody",sv:"Woody",langs:["en", "pl", "de", "sv"]},
    {en:"Tow Mater",pl:"Z\u0142omek",de:"Hook",sv:"B\u00e4rgarn",langs:["en", "pl", "de", "sv"]},
    {en:"The Terminator",pl:"Terminator",de:"Der Terminator",sv:"The Terminator",langs:["en", "pl", "de", "sv"]},
    {en:"Shrek",pl:"Shrek",de:"Shrek",sv:"Shrek",langs:["en", "pl", "de", "sv"]}
    ],
    medium: [
    {en:"Walter White",pl:"Walter White",de:"Walter White",sv:"Walter White",langs:["en", "pl", "de", "sv"]},
    {en:"Tony Soprano",pl:"Tony Soprano",de:"Tony Soprano",sv:"Tony Soprano",langs:["en", "pl", "de", "sv"]},
    {en:"Hannibal Lecter",pl:"Hannibal Lecter",de:"Hannibal Lecter",sv:"Hannibal Lecter",langs:["en", "pl", "de", "sv"]},
    {en:"Daenerys Targaryen",pl:"Daenerys Targaryen",de:"Daenerys Targaryen",sv:"Daenerys Targaryen",langs:["en", "pl", "de", "sv"]},
    {en:"Tyrion Lannister",pl:"Tyrion Lannister",de:"Tyrion Lannister",sv:"Tyrion Lannister",langs:["en", "pl", "de", "sv"]},
    {en:"Don Corleone",pl:"Don Corleone",de:"Don Corleone",sv:"Don Corleone",langs:["en", "pl", "de", "sv"]},
    {en:"Scarface",pl:"Scarface",de:"Scarface",sv:"Scarface",langs:["en", "pl", "de", "sv"]},
    {en:"Patrick Bateman",pl:"Patrick Bateman",de:"Patrick Bateman",sv:"Patrick Bateman",langs:["en", "pl", "de", "sv"]},
    {en:"Keyser S\u00f6ze",pl:"Keyser S\u00f6ze",de:"Keyser S\u00f6ze",sv:"Keyser S\u00f6ze",langs:["en", "pl", "de", "sv"]},
    {en:"Ellen Ripley",pl:"Ellen Ripley",de:"Ellen Ripley",sv:"Ellen Ripley",langs:["en", "pl", "de", "sv"]},
    {en:"Frank Underwood",pl:"Frank Underwood",de:"Frank Underwood",sv:"Frank Underwood",langs:["en", "pl", "de", "sv"]},
    {en:"Don Draper",pl:"Don Draper",de:"Don Draper",sv:"Don Draper",langs:["en", "pl", "de", "sv"]},
    {en:"Dexter Morgan",pl:"Dexter Morgan",de:"Dexter Morgan",sv:"Dexter Morgan",langs:["en", "pl", "de", "sv"]},
    {en:"Peter Griffin",pl:"Peter Griffin",de:"Peter Griffin",sv:"Peter Griffin",langs:["en", "pl", "de", "sv"]},
    {en:"King Kong",pl:"King Kong",de:"King Kong",sv:"King Kong",langs:["en", "pl", "de", "sv"]},
    {en:"Godzilla",pl:"Godzilla",de:"Godzilla",sv:"Godzilla",langs:["en", "pl", "de", "sv"]},
    {en:"Tarzan",pl:"Tarzan",de:"Tarzan",sv:"Tarzan",langs:["en", "pl", "de", "sv"]},
    {en:"Willy Wonka",pl:"Willy Wonka",de:"Willy Wonka",sv:"Willy Wonka",langs:["en", "pl", "de", "sv"]},
    {en:"Gus Fring",pl:"Gus Fring",de:"Gus Fring",sv:"Gus Fring",langs:["en", "pl", "de", "sv"]},
    {en:"Lord Voldemort",pl:"Lord Voldemort",de:"Lord Voldemort",sv:"Lord Voldemort",langs:["en", "pl", "de", "sv"]},
    {en:"Jon Snow",pl:"Jon Snow",de:"Jon Snow",sv:"Jon Snow",langs:["en", "pl", "de", "sv"]},
    {en:"Thomas Shelby",pl:"Thomas Shelby",de:"Thomas Shelby",sv:"Thomas Shelby",langs:["en", "pl", "de", "sv"]},
    {en:"Jesse Pinkman",pl:"Jesse Pinkman",de:"Jesse Pinkman",sv:"Jesse Pinkman",langs:["en", "pl", "de", "sv"]},
    {en:"Katniss Everdeen",pl:"Katniss Everdeen",de:"Katniss Everdeen",sv:"Katniss Everdeen",langs:["en", "pl", "de", "sv"]},
    {en:"Jason Bourne",pl:"Jason Bourne",de:"Jason Bourne",sv:"Jason Bourne",langs:["en", "pl", "de", "sv"]},
    {en:"Ted Lasso",pl:"Ted Lasso",de:"Ted Lasso",sv:"Ted Lasso",langs:["en", "pl", "de", "sv"]},
    {en:"Rachel Green",pl:"Rachel Green",de:"Rachel Green",sv:"Rachel Green",langs:["en", "pl", "de", "sv"]},
    {en:"Rick Grimes (The Walking Dead)",pl:"Rick Grimes (The Walking Dead)",de:"Rick Grimes (The Walking Dead)",sv:"Rick Grimes (The Walking Dead)",langs:["en", "pl", "de", "sv"]},
    {en:"E.T.",pl:"E.T.",de:"E.T.",sv:"E.T.",langs:["en", "pl", "de", "sv"]},
    {en:"Doctor Who",pl:"Doctor Who",de:"Der Doktor",sv:"Doctor Who",langs:["en", "pl", "de", "sv"]},
    {en:"Eleven / Jane Hopper",pl:"Eleven / Jane Hopper",de:"Eleven / Elfi / Jane Hopper",sv:"Eleven / Jane Hopper",langs:["en", "pl", "de", "sv"]},
    {en:"Luke Skywalker",pl:"Luke Skywalker",de:"Luke Skywalker",sv:"Luke Skywalker",langs:["en", "pl", "de", "sv"]},
    {en:"Kozio\u0142ek Mato\u0142ek",pl:"Kozio\u0142ek Mato\u0142ek",de:"Kozio\u0142ek Mato\u0142ek",sv:"Kozio\u0142ek Mato\u0142ek",langs:["pl"]},
    {en:"Bolek i Lolek",pl:"Bolek i Lolek",de:"Bolek i Lolek",sv:"Bolek i Lolek",langs:["pl"]},
    {en:"Sami Swoi",pl:"Sami Swoi",de:"Sami Swoi",sv:"Sami Swoi",langs:["pl"]},
    {en:"KPop Demon Hunters",pl:"KPop Demon Hunters (Rumi, Zoey lub Mira)",de:"KPop Demon Hunters (Rumi, Zoey, Mira)",sv:"KPop Demon Hunters (Rumi, Zoey, Mira)",langs:["en", "pl", "de", "sv"]},
    {en:"Megatron",pl:"Megatron",de:"Megatron",sv:"Megatron",langs:["en", "pl", "de", "sv"]},
    {en:"Joey Tribbiani",pl:"Joey Tribbiani",de:"Joey Tribbiani",sv:"Joey Tribbiani",langs:["en", "pl", "de", "sv"]},
    {en:"John Wick",pl:"John Wick",de:"John Wick",sv:"John Wick",langs:["en", "pl", "de", "sv"]}
    ],
    hard: [
    {en:"Alex DeLarge",pl:"Alex DeLarge",de:"Alex DeLarge",sv:"Alex DeLarge",langs:["en", "pl", "de", "sv"]},
    {en:"HAL 9000",pl:"HAL 9000",de:"HAL 9000",sv:"HAL 9000",langs:["en", "pl", "de", "sv"]},
    {en:"Am\u00e9lie Poulain",pl:"Am\u00e9lie Poulain",de:"Am\u00e9lie Poulain",sv:"Am\u00e9lie Poulain",langs:["en", "pl", "de", "sv"]},
    {en:"Travis Bickle",pl:"Travis Bickle",de:"Travis Bickle",sv:"Travis Bickle",langs:["en", "pl", "de", "sv"]},
    {en:"Holly Golightly",pl:"Holly Golightly",de:"Holly Golightly",sv:"Holly Golightly",langs:["en", "pl", "de", "sv"]},
    {en:"Atticus Finch",pl:"Atticus Finch",de:"Atticus Finch",sv:"Atticus Finch",langs:["en", "pl", "de", "sv"]},
    {en:"Charles Foster Kane",pl:"Charles Foster Kane",de:"Charles Foster Kane",sv:"Charles Foster Kane",langs:["en", "pl", "de", "sv"]},
    {en:"Antoine Doinel",pl:"Antoine Doinel",de:"Antoine Doinel",sv:"Antoine Doinel",langs:["en", "pl", "de", "sv"]},
    {en:"Zelig",pl:"Zelig",de:"Zelig",sv:"Zelig",langs:["en", "pl", "de", "sv"]},
    {en:"The Dude",pl:"The Dude",de:"The Dude",sv:"The Dude",langs:["en", "pl", "de", "sv"]},
    {en:"Verbal Kint",pl:"Verbal Kint",de:"Verbal Kint",sv:"Verbal Kint",langs:["en", "pl", "de", "sv"]},
    {en:"Nurse Ratched",pl:"Nurse Ratched",de:"Nurse Ratched",sv:"Nurse Ratched",langs:["en", "pl", "de", "sv"]},
    {en:"Kylo Ren",pl:"Kylo Ren",de:"Kylo Ren",sv:"Kylo Ren",langs:["en", "pl", "de", "sv"]},
    {en:"Saul Goodman",pl:"Saul Goodman",de:"Saul Goodman",sv:"Saul Goodman",langs:["en", "pl", "de", "sv"]},
    {en:"Wolverine",pl:"Wolverine",de:"Wolverine",sv:"Wolverine",langs:["en", "pl", "de", "sv"]},
    {en:"Michael Myers",pl:"Michael Myers",de:"Michael Myers",sv:"Michael Myers",langs:["en", "pl", "de", "sv"]},
    {en:"Bridget Jones",pl:"Bridget Jones",de:"Bridget Jones",sv:"Bridget Jones",langs:["en", "pl", "de", "sv"]},
    {en:"C-3PO",pl:"C-3PO",de:"C-3PO",sv:"C-3PO",langs:["en", "pl", "de", "sv"]},
    {en:"Michael Scott",pl:"Michael Scott",de:"Michael Scott",sv:"Michael Scott",langs:["en", "pl", "de", "sv"]},
    {en:"Thomas Shelby",pl:"Thomas Shelby",de:"Thomas Shelby",sv:"Thomas Shelby",langs:["en", "pl", "de", "sv"]},
    {en:"Meredith Grey",pl:"Meredith Grey",de:"Meredith Grey",sv:"Meredith Grey",langs:["en", "pl", "de", "sv"]},
    {en:"Jon Snow (GoT)",pl:"Jon Snow (GoT)",de:"Jon Snow (GoT)",sv:"Jon Snow (GoT)",langs:["en", "pl", "de", "sv"]},
    {en:"Sansa Stark",pl:"Sansa Stark",de:"Sansa Stark",sv:"Sansa Stark",langs:["en", "pl", "de", "sv"]},
    {en:"Daryl Dixon (The Walking Dead)",pl:"Daryl Dixon (The Walking Dead)",de:"Daryl Dixon (The Walking Dead)",sv:"Daryl Dixon (The Walking Dead)",langs:["en", "pl", "de", "sv"]},
    {en:"Clay Jensen",pl:"Clay Jensen",de:"Clay Jensen",sv:"Clay Jensen",langs:["en", "pl", "de", "sv"]},
    {en:"Ragnar Lothbrok",pl:"Ragnar Lothbrok",de:"Ragnar Lothbrok",sv:"Ragnar Lothbrok",langs:["en", "pl", "de", "sv"]},
    {en:"Jesse Pinkman",pl:"Jesse Pinkman",de:"Jesse Pinkman",sv:"Jesse Pinkman",langs:["en", "pl", "de", "sv"]},
    {en:"Severus Snape",pl:"Severus Snape",de:"Severus Snape",sv:"Severus Snape",langs:["en", "pl", "de", "sv"]},
    {en:"The Riddler",pl:"Cz\u0142owiek-Zagadka",de:"The Riddler",sv:"G\u00e5tan (The Riddler)",langs:["en", "pl", "de", "sv"]},
    {en:"John Kramer / Jigsaw",pl:"John Kramer zwany Jigsaw",de:"John Kramer / Jigsaw",sv:"John Kramer / Jigsaw",langs:["en", "pl", "de", "sv"]},
    {en:"Frodo Baggins",pl:"Frodo Baggins",de:"Frodo Beutlin",sv:"Frodo Secker",langs:["en", "pl", "de", "sv"]},
    {en:"Master Yoda",pl:"Yoda",de:"Yoda",sv:"Yoda",langs:["en", "pl", "de", "sv"]},
    {en:"McDreamy (Derek Shepherd)",pl:"McDreamy (Derek Shepherd)",de:"McDreamy (Derek Shepherd)",sv:"McDreamy (Derek Shepherd)",langs:["en", "pl", "de", "sv"]},
    {en:"Harley Quinn",pl:"Harley Quinn",de:"Harley Quinn",sv:"Harley Quinn",langs:["en", "pl", "de", "sv"]},
    {en:"Pan Kleks",pl:"Pan Kleks",de:"Pan Kleks",sv:"Pan Kleks",langs:["pl"]},
    {en:"Smok Wawelski",pl:"Smok Wawelski",de:"Smok Wawelski",sv:"Smok Wawelski",langs:["pl"]},
    {en:"Ada\u015b Miauczy\u0144ski",pl:"Ada\u015b Miauczy\u0144ski",de:"Ada\u015b Miauczy\u0144ski",sv:"Ada\u015b Miauczy\u0144ski",langs:["pl"]},
    {en:"Bazyliszek",pl:"Bazyliszek",de:"Bazyliszek",sv:"Bazyliszek",langs:["pl"]},
    {en:"Wars i Sawa",pl:"Wars i Sawa",de:"Wars i Sawa",sv:"Wars i Sawa",langs:["pl"]}
    ],
  },
  history: {
    easy: [
    {en:"Napoleon Bonaparte",pl:"Napoleon Bonaparte",de:"Napoleon Bonaparte",sv:"Napoleon Bonaparte",langs:["en", "pl", "de", "sv"]},
    {en:"Albert Einstein",pl:"Albert Einstein",de:"Albert Einstein",sv:"Albert Einstein",langs:["en", "pl", "de", "sv"]},
    {en:"Leonardo da Vinci",pl:"Leonardo da Vinci",de:"Leonardo da Vinci",sv:"Leonardo da Vinci",langs:["en", "pl", "de", "sv"]},
    {en:"Abraham Lincoln",pl:"Abraham Lincoln",de:"Abraham Lincoln",sv:"Abraham Lincoln",langs:["en", "pl", "de", "sv"]},
    {en:"Mahatma Gandhi",pl:"Mahatma Gandhi",de:"Mahatma Gandhi",sv:"Mahatma Gandhi",langs:["en", "pl", "de", "sv"]},
    {en:"Nelson Mandela",pl:"Nelson Mandela",de:"Nelson Mandela",sv:"Nelson Mandela",langs:["en", "pl", "de", "sv"]},
    {en:"Winston Churchill",pl:"Winston Churchill",de:"Winston Churchill",sv:"Winston Churchill",langs:["en", "pl", "de", "sv"]},
    {en:"Adolf Hitler",pl:"Adolf Hitler",de:"Adolf Hitler",sv:"Adolf Hitler",langs:["en", "pl", "de", "sv"]},
    {en:"Martin Luther King",pl:"Martin Luther King",de:"Martin Luther King",sv:"Martin Luther King",langs:["en", "pl", "de", "sv"]},
    {en:"Mozart",pl:"Mozart",de:"Mozart",sv:"Mozart",langs:["en", "pl", "de", "sv"]},
    {en:"Beethoven",pl:"Beethoven",de:"Beethoven",sv:"Beethoven",langs:["en", "pl", "de", "sv"]},
    {en:"Nikola Tesla",pl:"Nikola Tesla",de:"Nikola Tesla",sv:"Nikola Tesla",langs:["en", "pl", "de", "sv"]},
    {en:"Cleopatra",pl:"Kleopatra",de:"Kleopatra",sv:"Kleopatra",langs:["en", "pl", "de", "sv"]},
    {en:"Marie Curie",pl:"Maria Sk\u0142odowska-Curie",de:"Marie Curie",sv:"Marie Curie",langs:["en", "pl", "de", "sv"]},
    {en:"Julius Caesar",pl:"Juliusz Cezar",de:"Julius C\u00e4sar",sv:"Julius Caesar",langs:["en", "pl", "de", "sv"]},
    {en:"Christopher Columbus",pl:"Krzysztof Kolumb",de:"Christoph Kolumbus",sv:"Christofer Columbus",langs:["en", "pl", "de", "sv"]},
    {en:"Charles Darwin",pl:"Karol Darwin",de:"Charles Darwin",sv:"Charles Darwin",langs:["en", "pl", "de", "sv"]},
    {en:"Isaac Newton",pl:"Izaak Newton",de:"Isaac Newton",sv:"Isaac Newton",langs:["en", "pl", "de", "sv"]},
    {en:"Galileo Galilei",pl:"Galileusz",de:"Galileo Galilei",sv:"Galileo Galilei",langs:["en", "pl", "de", "sv"]},
    {en:"William Shakespeare",pl:"William Szekspir",de:"William Shakespeare",sv:"William Shakespeare",langs:["en", "pl", "de", "sv"]},
    {en:"Michelangelo",pl:"Micha\u0142 Anio\u0142",de:"Michelangelo",sv:"Michelangelo",langs:["en", "pl", "de", "sv"]},
    {en:"Marco Polo",pl:"Marco Polo",de:"Marco Polo",sv:"Marco Polo",langs:["en", "pl", "de", "sv"]},
    {en:"Vincent van Gogh",pl:"Vincent van Gogh",de:"Vincent van Gogh",sv:"Vincent van Gogh",langs:["en", "pl", "de", "sv"]},
    {en:"Pablo Picasso",pl:"Pablo Picasso",de:"Pablo Picasso",sv:"Pablo Picasso",langs:["en", "pl", "de", "sv"]},
    {en:"Frida Kahlo",pl:"Frida Kahlo",de:"Frida Kahlo",sv:"Frida Kahlo",langs:["en", "pl", "de", "sv"]},
    {en:"Thomas Edison",pl:"Thomas Edison",de:"Thomas Edison",sv:"Thomas Edison",langs:["en", "pl", "de", "sv"]},
    {en:"Benjamin Franklin",pl:"Benjamin Franklin",de:"Benjamin Franklin",sv:"Benjamin Franklin",langs:["en", "pl", "de", "sv"]},
    {en:"Jan Pawe\u0142 II",pl:"Jan Pawe\u0142 II",de:"Jan Pawe\u0142 II",sv:"Jan Pawe\u0142 II",langs:["pl"]},
    {en:"Lech Wa\u0142\u0119sa",pl:"Lech Wa\u0142\u0119sa",de:"Lech Wa\u0142\u0119sa",sv:"Lech Wa\u0142\u0119sa",langs:["pl"]},
    {en:"J\u00f3zef Pi\u0142sudski",pl:"J\u00f3zef Pi\u0142sudski",de:"J\u00f3zef Pi\u0142sudski",sv:"J\u00f3zef Pi\u0142sudski",langs:["pl"]},
    {en:"Alfred Nobel",pl:"Alfred Nobel",de:"Alfred Nobel",sv:"Alfred Nobel",langs:["sv"]},
    {en:"Olof Palme",pl:"Olof Palme",de:"Olof Palme",sv:"Olof Palme",langs:["sv"]}
    ],
    medium: [
    {en:"Genghis Khan",pl:"Czyngis-chan",de:"Dschingis Khan",sv:"Djingis Khan",langs:["en", "pl", "de", "sv"]},
    {en:"Catherine the Great",pl:"Katarzyna Wielka",de:"Katharina die Gro\u00dfe",sv:"Katarina den stora",langs:["en", "pl", "de", "sv"]},
    {en:"Nicolaus Copernicus",pl:"Miko\u0142aj Kopernik",de:"Nikolaus Kopernikus",sv:"Nicolaus Copernicus",langs:["en", "pl", "de", "sv"]},
    {en:"Alexander the Great",pl:"Aleksander Wielki",de:"Alexander der Gro\u00dfe",sv:"Alexander den store",langs:["en", "pl", "de", "sv"]},
    {en:"Joan of Arc",pl:"Joanna d'Arc",de:"Jeanne d'Arc",sv:"Jeanne d'Arc",langs:["en", "pl", "de", "sv"]},
    {en:"Sigmund Freud",pl:"Zygmunt Freud",de:"Sigmund Freud",sv:"Sigmund Freud",langs:["en", "pl", "de", "sv"]},
    {en:"Karl Marx",pl:"Karol Marks",de:"Karl Marx",sv:"Karl Marx",langs:["en", "pl", "de", "sv"]},
    {en:"Charles Dickens",pl:"Karol Dickens",de:"Charles Dickens",sv:"Charles Dickens",langs:["en", "pl", "de", "sv"]},
    {en:"Marco Polo",pl:"Marco Polo",de:"Marco Polo",sv:"Marco Polo",langs:["en", "pl", "de", "sv"]},
    {en:"Adam Mickiewicz",pl:"Adam Mickiewicz",de:"Adam Mickiewicz",sv:"Adam Mickiewicz",langs:["pl"]},
    {en:"Jan Matejko",pl:"Jan Matejko",de:"Jan Matejko",sv:"Jan Matejko",langs:["pl"]},
    {en:"Wis\u0142awa Szymborska",pl:"Wis\u0142awa Szymborska",de:"Wis\u0142awa Szymborska",sv:"Wis\u0142awa Szymborska",langs:["pl"]},
    {en:"Andrzej Wajda",pl:"Andrzej Wajda",de:"Andrzej Wajda",sv:"Andrzej Wajda",langs:["pl"]},
    {en:"Boles\u0142aw Chrobry",pl:"Boles\u0142aw Chrobry",de:"Boles\u0142aw Chrobry",sv:"Boles\u0142aw Chrobry",langs:["pl"]},
    {en:"Kazimierz Wielki",pl:"Kazimierz Wielki",de:"Kazimierz Wielki",sv:"Kazimierz Wielki",langs:["pl"]},
    {en:"Carl Linnaeus",pl:"Carl Linnaeus",de:"Carl Linnaeus",sv:"Carl von Linn\u00e9",langs:["sv"]},
    {en:"Anders Celsius",pl:"Anders Celsius",de:"Anders Celsius",sv:"Anders Celsius",langs:["sv"]},
    {en:"Axel Oxenstierna",pl:"Axel Oxenstierna",de:"Axel Oxenstierna",sv:"Axel Oxenstierna",langs:["sv"]},
    {en:"Gustav II Adolf",pl:"Gustav II Adolf",de:"Gustav II Adolf",sv:"Gustav II Adolf",langs:["sv"]},
    {en:"Otto von Bismarck",pl:"Otto von Bismarck",de:"Otto von Bismarck",sv:"Otto von Bismarck",langs:["de"]},
    {en:"Johannes Gutenberg",pl:"Johannes Gutenberg",de:"Johannes Gutenberg",sv:"Johannes Gutenberg",langs:["de"]},
    {en:"Werner Heisenberg",pl:"Werner Heisenberg",de:"Werner Karl Heisenberg",sv:"Werner Heisenberg",langs:["en", "pl", "de", "sv"]},
    {en:"Friedrich Nietzsche",pl:"Friedrich Nietzsche",de:"Friedrich Nietzsche",sv:"Friedrich Nietzsche",langs:["de"]},
    {en:"Wilhelm R\u00f6ntgen",pl:"Wilhelm R\u00f6ntgen",de:"Wilhelm Conrad R\u00f6ntgen",sv:"Wilhelm R\u00f6ntgen",langs:["de"]},
    {en:"Angela Merkel",pl:"Angela Merkel",de:"Angela Merkel",sv:"Angela Merkel",langs:["de"]}
    ],
    hard: [
    {en:"Hypatia",pl:"Hypatia",de:"Hypatia",sv:"Hypatia",langs:["en", "pl", "de", "sv"]},
    {en:"Ibn Battuta",pl:"Ibn Battuta",de:"Ibn Battuta",sv:"Ibn Battuta",langs:["en", "pl", "de", "sv"]},
    {en:"Suleiman the Magnificent",pl:"Suleiman the Magnificent",de:"Suleiman the Magnificent",sv:"Suleiman the Magnificent",langs:["en", "pl", "de", "sv"]},
    {en:"Avicenna",pl:"Avicenna",de:"Avicenna",sv:"Avicenna",langs:["en", "pl", "de", "sv"]},
    {en:"Gottfried Leibniz",pl:"Gottfried Leibniz",de:"Gottfried Leibniz",sv:"Gottfried Leibniz",langs:["en", "pl", "de", "sv"]},
    {en:"Zenobia",pl:"Zenobia",de:"Zenobia",sv:"Zenobia",langs:["en", "pl", "de", "sv"]},
    {en:"Saladin",pl:"Saladin",de:"Saladin",sv:"Saladin",langs:["en", "pl", "de", "sv"]},
    {en:"Ashoka",pl:"Ashoka",de:"Ashoka",sv:"Ashoka",langs:["en", "pl", "de", "sv"]},
    {en:"Tamerlane",pl:"Tamerlane",de:"Tamerlane",sv:"Tamerlane",langs:["en", "pl", "de", "sv"]},
    {en:"Hatshepsut",pl:"Hatshepsut",de:"Hatshepsut",sv:"Hatshepsut",langs:["en", "pl", "de", "sv"]},
    {en:"Hannibal Barca",pl:"Hannibal Barca",de:"Hannibal Barca",sv:"Hannibal Barca",langs:["en", "pl", "de", "sv"]},
    {en:"Vercingetorix",pl:"Vercingetorix",de:"Vercingetorix",sv:"Vercingetorix",langs:["en", "pl", "de", "sv"]},
    {en:"Boudicca",pl:"Boudicca",de:"Boudicca",sv:"Boudicca",langs:["en", "pl", "de", "sv"]},
    {en:"Ignacy Jan Paderewski",pl:"Ignacy Jan Paderewski",de:"Ignacy Jan Paderewski",sv:"Ignacy Jan Paderewski",langs:["pl"]},
    {en:"Witold Pilecki",pl:"Rotmistrz Witold Pilecki",de:"Witold Pilecki",sv:"Witold Pilecki",langs:["pl"]},
    {en:"Svante Arrhenius",pl:"Svante Arrhenius",de:"Svante Arrhenius",sv:"Svante August Arrhenius",langs:["sv"]},
    {en:"Hannes Alfv\u00e9n",pl:"Hannes Alfv\u00e9n",de:"Hannes Alfv\u00e9n",sv:"Hannes Alfv\u00e9n",langs:["sv"]},
    {en:"Emanuel Swedenborg",pl:"Emanuel Swedenborg",de:"Emanuel Swedenborg",sv:"Emanuel Swedenborg",langs:["sv"]},
    {en:"Max Planck",pl:"Max Planck",de:"Max Planck",sv:"Max Planck",langs:["de"]},
    {en:"Konrad Adenauer",pl:"Konrad Adenauer",de:"Konrad Adenauer",sv:"Konrad Adenauer",langs:["de"]},
    {en:"Hermann von Helmholtz",pl:"Hermann von Helmholtz",de:"Hermann von Helmholtz",sv:"Hermann von Helmholtz",langs:["de"]}
    ],
  },
  animals: {
    easy: [
    {en:"Elephant",pl:"S\u0142o\u0144",de:"Elefant",sv:"Elefant",langs:["en", "pl", "de", "sv"]},
    {en:"Lion",pl:"Lew",de:"L\u00f6we",sv:"Lejon",langs:["en", "pl", "de", "sv"]},
    {en:"Penguin",pl:"Pingwin",de:"Pinguin",sv:"Pingvin",langs:["en", "pl", "de", "sv"]},
    {en:"Giraffe",pl:"\u017byrafa",de:"Giraffe",sv:"Giraff",langs:["en", "pl", "de", "sv"]},
    {en:"Dolphin",pl:"Delfin",de:"Delfin",sv:"Delfin",langs:["en", "pl", "de", "sv"]},
    {en:"Eagle",pl:"Orze\u0142",de:"Adler",sv:"\u00d6rn",langs:["en", "pl", "de", "sv"]},
    {en:"Shark",pl:"Rekin",de:"Hai",sv:"Haj",langs:["en", "pl", "de", "sv"]},
    {en:"Cheetah",pl:"Gepard",de:"Gepard",sv:"Gepard",langs:["en", "pl", "de", "sv"]},
    {en:"Gorilla",pl:"Goryl",de:"Gorilla",sv:"Gorilla",langs:["en", "pl", "de", "sv"]},
    {en:"Flamingo",pl:"Flaming",de:"Flamingo",sv:"Flamingo",langs:["en", "pl", "de", "sv"]},
    {en:"Dog",pl:"Pies",de:"Hund",sv:"Hund",langs:["en","pl","de","sv"]},
    {en:"Cat",pl:"Kot",de:"Katze",sv:"Katt",langs:["en","pl","de","sv"]},
    {en:"Cow",pl:"Krowa",de:"Kuh",sv:"Ko",langs:["en","pl","de","sv"]},
    {en:"Pig",pl:"Świnia",de:"Schwein",sv:"Gris",langs:["en","pl","de","sv"]},
    {en:"Horse",pl:"Koń",de:"Pferd",sv:"Häst",langs:["en","pl","de","sv"]},
    {en:"Chicken",pl:"Kurczak",de:"Huhn",sv:"Höna",langs:["en","pl","de","sv"]},
    {en:"Duck",pl:"Kaczka",de:"Ente",sv:"Anka",langs:["en","pl","de","sv"]},
    {en:"Fish",pl:"Ryba",de:"Fisch",sv:"Fisk",langs:["en","pl","de","sv"]},
    {en:"Rabbit",pl:"Królik",de:"Kaninchen",sv:"Kanin",langs:["en","pl","de","sv"]},
    {en:"Sheep",pl:"Owca",de:"Schaf",sv:"Får",langs:["en","pl","de","sv"]},
    {en:"Goat",pl:"Koza",de:"Ziege",sv:"Get",langs:["en","pl","de","sv"]},
    {en:"Monkey",pl:"Małpa",de:"Affe",sv:"Apa",langs:["en","pl","de","sv"]},
    {en:"Bear",pl:"Niedźwiedź",de:"Bär",sv:"Björn",langs:["en","pl","de","sv"]},
    {en:"Fox",pl:"Lis",de:"Fuchs",sv:"Räv",langs:["en","pl","de","sv"]},
    {en:"Deer",pl:"Jeleń",de:"Hirsch",sv:"Hjort",langs:["en","pl","de","sv"]},
    {en:"Camel",pl:"Wielbłąd",de:"Kamel",sv:"Kamel",langs:["en","pl","de","sv"]},
    {en:"Turtle",pl:"Żółw",de:"Schildkröte",sv:"Sköldpadda",langs:["en","pl","de","sv"]},
    {en:"Owl",pl:"Sowa",de:"Eule",sv:"Uggla",langs:["en","pl","de","sv"]},
    {en:"Swan",pl:"Łabędź",de:"Schwan",sv:"Svan",langs:["en","pl","de","sv"]},
    {en:"Snake",pl:"Wąż",de:"Schlange",sv:"Orm",langs:["en","pl","de","sv"]},
    {en:"Frog",pl:"Żaba",de:"Frosch",sv:"Groda",langs:["en","pl","de","sv"]},
    {en:"Lizard",pl:"Jaszczurka",de:"Eidechse",sv:"Ödla",langs:["en","pl","de","sv"]},
    {en:"Crab",pl:"Krab",de:"Krabbe",sv:"Krabba",langs:["en","pl","de","sv"]},
    {en:"Seal",pl:"Foka",de:"Seehund",sv:"Säl",langs:["en","pl","de","sv"]},
    {en:"Hyena",pl:"Hiena",de:"Hyäne",sv:"Hyena",langs:["en","pl","de","sv"]},
    {en:"Lobster",pl:"Homar",de:"Hummer",sv:"Hummer",langs:["en","pl","de","sv"]},
    {en:"Starfish",pl:"Rozgwiazda",de:"Seestern",sv:"Sjöstjärna",langs:["en","pl","de","sv"]},
    {en:"Stingray",pl:"Płaszczka",de:"Stechrochen",sv:"Rocka",langs:["en","pl","de","sv"]},
    {en:"Squid",pl:"Kałamarnica",de:"Tintenfisch",sv:"Bläckfisk",langs:["en","pl","de","sv"]},
    {en:"Walrus",pl:"Mors",de:"Walross",sv:"Valross",langs:["en","pl","de","sv"]},
    {en:"Crow",pl:"Wrona",de:"Krähe",sv:"Kråka",langs:["en","pl","de","sv"]},
    {en:"Pigeon",pl:"Gołąb",de:"Taube",sv:"Duva",langs:["en","pl","de","sv"]},
    {en:"Sparrow",pl:"Wróbel",de:"Spatz",sv:"Sparv",langs:["en","pl","de","sv"]},
    {en:"Seagull",pl:"Mewa",de:"Möwe",sv:"Mås",langs:["en","pl","de","sv"]},
    {en:"Ostrich",pl:"Struś",de:"Strauß",sv:"Struts",langs:["en","pl","de","sv"]},
    {en:"Chameleon",pl:"Kameleon",de:"Chamäleon",sv:"Kameleont",langs:["en","pl","de","sv"]},
    {en:"Panda",pl:"Panda",de:"Panda",sv:"Panda",langs:["en", "pl", "de", "sv"]},
    {en:"Kangaroo",pl:"Kangur",de:"K\u00e4nguru",sv:"K\u00e4nguru",langs:["en", "pl", "de", "sv"]},
    {en:"Crocodile",pl:"Krokodyl",de:"Krokodil",sv:"Krokodil",langs:["en", "pl", "de", "sv"]},
    {en:"Octopus",pl:"O\u015bmiornica",de:"Oktopus",sv:"Bl\u00e4ckfisk",langs:["en", "pl", "de", "sv"]},
    {en:"Polar Bear",pl:"Nied\u017awied\u017a polarny",de:"Eisb\u00e4r",sv:"Isbj\u00f6rn",langs:["en", "pl", "de", "sv"]},
    {en:"Tiger",pl:"Tygrys",de:"Tiger",sv:"Tiger",langs:["en", "pl", "de", "sv"]},
    {en:"Zebra",pl:"Zebra",de:"Zebra",sv:"Zebra",langs:["en", "pl", "de", "sv"]},
    {en:"Peacock",pl:"Paw",de:"Pfau",sv:"P\u00e5f\u00e5gel",langs:["en", "pl", "de", "sv"]},
    {en:"Koala",pl:"Koala",de:"Koala",sv:"Koala",langs:["en", "pl", "de", "sv"]},
    {en:"Wolf",pl:"Wilk",de:"Wolf",sv:"Varg",langs:["en", "pl", "de", "sv"]},
    {en:"Rhinoceros",pl:"Nosoro\u017cec",de:"Nashorn",sv:"Nosh\u00f6rning",langs:["en", "pl", "de", "sv"]},
    {en:"Hippopotamus",pl:"Hipopotam",de:"Nilpferd",sv:"Flodh\u00e4st",langs:["en", "pl", "de", "sv"]},
    {en:"Chimpanzee",pl:"Szympans",de:"Schimpanse",sv:"Schimpans",langs:["en", "pl", "de", "sv"]},
    {en:"Parrot",pl:"Papuga",de:"Papagei",sv:"Papegoja",langs:["en", "pl", "de", "sv"]},
    {en:"Toucan",pl:"Tukan",de:"Tukan",sv:"Tukan",langs:["en", "pl", "de", "sv"]},
    {en:"Jaguar",pl:"Jaguar",de:"Jaguar",sv:"Jaguar",langs:["en", "pl", "de", "sv"]},
    {en:"Leopard",pl:"Leopard",de:"Leopard",sv:"Leopard",langs:["en", "pl", "de", "sv"]},
    {en:"Grizzly Bear",pl:"Nied\u017awied\u017a grizzly",de:"Grizzlyb\u00e4r",sv:"Grizzlybj\u00f6rn",langs:["en", "pl", "de", "sv"]},
    {en:"Moose",pl:"\u0141o\u015b",de:"Elch",sv:"\u00c4lg",langs:["en", "pl", "de", "sv"]},
    {en:"Bison",pl:"\u017bubr",de:"Bison",sv:"Bison",langs:["en", "pl", "de", "sv"]},
    {en:"Orca",pl:"Orka",de:"Orca",sv:"Sp\u00e4ckhuggare",langs:["en", "pl", "de", "sv"]},
    {en:"Manta Ray",pl:"Manta",de:"Mantarochen",sv:"Mantarocka",langs:["en", "pl", "de", "sv"]},
    {en:"Sea Turtle",pl:"\u017b\u00f3\u0142w morski",de:"Meeresschildkr\u00f6te",sv:"Havssk\u00f6ldpadda",langs:["en", "pl", "de", "sv"]},
    {en:"Clownfish",pl:"B\u0142azenek",de:"Clownfisch",sv:"Clownfisk",langs:["en", "pl", "de", "sv"]},
    {en:"Jellyfish",pl:"Meduza",de:"Qualle",sv:"Manet",langs:["en", "pl", "de", "sv"]}
    ],
    medium: [
    {en:"Platypus",pl:"Dziobak",de:"Schnabeltier",sv:"N\u00e4bbdjur",langs:["en", "pl", "de", "sv"]},
    {en:"Axolotl",pl:"Aksolotl",de:"Axolotl",sv:"Axolotl",langs:["en", "pl", "de", "sv"]},
    {en:"Snow Leopard",pl:"\u015anie\u017cny leopard",de:"Schneeleopard",sv:"Sn\u00f6leopard",langs:["en", "pl", "de", "sv"]},
    {en:"Komodo Dragon",pl:"Smok z Komodo",de:"Komodowaran",sv:"Komodovaran",langs:["en", "pl", "de", "sv"]},
    {en:"Narwhal",pl:"Narwal",de:"Narwal",sv:"Narval",langs:["en", "pl", "de", "sv"]},
    {en:"Capybara",pl:"Kapibara",de:"Capybara",sv:"Kapybara",langs:["en", "pl", "de", "sv"]},
    {en:"Pangolin",pl:"\u0141uskowiec",de:"Schuppentier",sv:"Pangolin",langs:["en", "pl", "de", "sv"]},
    {en:"Tapir",pl:"Tapir",de:"Tapir",sv:"Tapir",langs:["en", "pl", "de", "sv"]},
    {en:"Quokka",pl:"Quokka",de:"Quokka",sv:"Quokka",langs:["en", "pl", "de", "sv"]},
    {en:"Mandrill",pl:"Mandryl",de:"Mandrill",sv:"Mandrill",langs:["en", "pl", "de", "sv"]},
    {en:"Wolverine",pl:"Rosomak",de:"Vielfra\u00df",sv:"J\u00e4rv",langs:["en", "pl", "de", "sv"]},
    {en:"Binturong",pl:"Binturong",de:"Binturong",sv:"Binturong",langs:["en", "pl", "de", "sv"]},
    {en:"Serval",pl:"Serwal",de:"Serval",sv:"Serval",langs:["en", "pl", "de", "sv"]},
    {en:"Meerkat",pl:"Surykatka",de:"Erdm\u00e4nnchen",sv:"Surrikat",langs:["en", "pl", "de", "sv"]},
    {en:"Wombat",pl:"Wombat",de:"Wombat",sv:"Vombat",langs:["en", "pl", "de", "sv"]},
    {en:"Armadillo",pl:"Pancernik",de:"G\u00fcrteltier",sv:"B\u00e4ltdjur",langs:["en", "pl", "de", "sv"]},
    {en:"Sloth",pl:"Leniwiec",de:"Faultier",sv:"Seng\u00e5ngare",langs:["en", "pl", "de", "sv"]},
    {en:"Anteater",pl:"Mr\u00f3wkojad",de:"Ameisenb\u00e4r",sv:"Myrslok",langs:["en", "pl", "de", "sv"]},
    {en:"Echidna",pl:"Kolczatka",de:"Ameisenigel",sv:"Echidna",langs:["en", "pl", "de", "sv"]},
    {en:"Cassowary",pl:"Kazuar",de:"Kasuar",sv:"Kasuar",langs:["en", "pl", "de", "sv"]},
    {en:"Fennec Fox",pl:"Lis fennek",de:"Fennek",sv:"Fennekr\u00e4v",langs:["en", "pl", "de", "sv"]},
    {en:"Gharial",pl:"Gharial",de:"Gangesgavial",sv:"Gangesgavial",langs:["en", "pl", "de", "sv"]},
    {en:"Sun Bear",pl:"Nied\u017awied\u017a malajski",de:"Malaienb\u00e4r",sv:"Malajbj\u00f6rn",langs:["en", "pl", "de", "sv"]},
    {en:"Clouded Leopard",pl:"Lampart mglisty",de:"Nebelparder",sv:"Molnleopard",langs:["en", "pl", "de", "sv"]},
    {en:"Proboscis Monkey",pl:"Nosacz sundajski",de:"Nasenaffe",sv:"Snabeln\u00e4sa",langs:["en", "pl", "de", "sv"]},
    {en:"Honey Badger",pl:"Miodożer",de:"Honigdachs",sv:"Honungsgrävling",langs:["en","pl","de","sv"]},
    {en:"Red Panda",pl:"Panda ruda",de:"Roter Panda",sv:"Röd panda",langs:["en","pl","de","sv"]},
    {en:"Hammerhead Shark",pl:"Rekin młot",de:"Hammerhai",sv:"Hammarhajen",langs:["en","pl","de","sv"]},
    {en:"Seahorse",pl:"Konik morski",de:"Seepferdchen",sv:"Sjöhäst",langs:["en","pl","de","sv"]},
    {en:"Flying Squirrel",pl:"Lotnik wiewiórkowaty",de:"Flughörnchen",sv:"Flygekorr",langs:["en","pl","de","sv"]},
    {en:"Mandrill",pl:"Mandryl",de:"Mandrill",sv:"Mandrill",langs:["en","pl","de","sv"]},
    {en:"Iguana",pl:"Iguana",de:"Leguan",sv:"Iguana",langs:["en","pl","de","sv"]},
    {en:"Gecko",pl:"Gekon",de:"Gecko",sv:"Gecko",langs:["en","pl","de","sv"]},
    {en:"Toad",pl:"Ropucha",de:"Kröte",sv:"Padda",langs:["en","pl","de","sv"]},
    {en:"Butterfly",pl:"Motyl",de:"Schmetterling",sv:"Fjäril",langs:["en","pl","de","sv"]},
    {en:"Bee",pl:"Pszczoła",de:"Biene",sv:"Bi",langs:["en","pl","de","sv"]},
    {en:"Ant",pl:"Mrówka",de:"Ameise",sv:"Myra",langs:["en","pl","de","sv"]},
    {en:"Spider",pl:"Pająk",de:"Spinne",sv:"Spindel",langs:["en","pl","de","sv"]},
    {en:"Mosquito",pl:"Komar",de:"Mücke",sv:"Mygga",langs:["en","pl","de","sv"]},
    {en:"Fly",pl:"Mucha",de:"Fliege",sv:"Fluga",langs:["en","pl","de","sv"]},
    {en:"Grasshopper",pl:"Konik polny",de:"Grashüpfer",sv:"Gräshoppa",langs:["en","pl","de","sv"]},
    {en:"Beetle",pl:"Żuk",de:"Käfer",sv:"Skalbagge",langs:["en","pl","de","sv"]},
    {en:"Dragonfly",pl:"Ważka",de:"Libelle",sv:"Trollslända",langs:["en","pl","de","sv"]},
    {en:"Hedgehog",pl:"Jeż",de:"Igel",sv:"Igelkott",langs:["en","pl","de","sv"]},
    {en:"Bat",pl:"Nietoperz",de:"Fledermaus",sv:"Fladdermus",langs:["en","pl","de","sv"]},
    {en:"Raccoon",pl:"Szop pracz",de:"Waschbär",sv:"Tvättbjörn",langs:["en","pl","de","sv"]},
    {en:"Skunk",pl:"Skunks",de:"Stinktier",sv:"Skunk",langs:["en","pl","de","sv"]},
    {en:"Otter",pl:"Wydra",de:"Otter",sv:"Utter",langs:["en","pl","de","sv"]},
    {en:"Beaver",pl:"Bóbr",de:"Biber",sv:"Bäver",langs:["en","pl","de","sv"]},
    ],
    hard: [
    {en:"Okapi",pl:"Okapi",de:"Okapi",sv:"Okapi",langs:["en", "pl", "de", "sv"]},
    {en:"Shoebill",pl:"Czapla obuwnik",de:"Schuhschnabel",sv:"Skoskon\u00e4bb",langs:["en", "pl", "de", "sv"]},
    {en:"Blobfish",pl:"Ryba-kropla",de:"Tropfenfisch",sv:"Droppfisk",langs:["en", "pl", "de", "sv"]},
    {en:"Aye-aye",pl:"Aye-aye",de:"Fingertier",sv:"Fingertamarin",langs:["en", "pl", "de", "sv"]},
    {en:"Fossa",pl:"Fossa",de:"Fossa",sv:"Fossa",langs:["en", "pl", "de", "sv"]},
    {en:"Saiga Antelope",pl:"Antylopa sajga",de:"Saiga-Antilope",sv:"Saiga-antilop",langs:["en", "pl", "de", "sv"]},
    {en:"Irrawaddy Dolphin",pl:"Delfin Irrawaddy",de:"Irawadidelfin",sv:"Irawaddidelfin",langs:["en", "pl", "de", "sv"]},
    {en:"Kakapo",pl:"Kakapo",de:"Kakapo",sv:"Kakapo",langs:["en", "pl", "de", "sv"]},
    {en:"Tarsier",pl:"Wyrak",de:"Koboldmaki",sv:"Sp\u00f6kdjur",langs:["en", "pl", "de", "sv"]},
    {en:"Dugong",pl:"Diugon",de:"Dugong",sv:"Dugong",langs:["en", "pl", "de", "sv"]},
    {en:"Kinkajou",pl:"Kinka\u017cu",de:"Wickelb\u00e4r",sv:"Kinkajou",langs:["en", "pl", "de", "sv"]},
    {en:"Gerenuk",pl:"Gerenuk",de:"Giraffengazelle",sv:"Gerenuk",langs:["en", "pl", "de", "sv"]},
    {en:"Patagonian Mara",pl:"Mara patago\u0144ska",de:"Patagonisches Meerschweinchen",sv:"Patagonsk mara",langs:["en", "pl", "de", "sv"]},
    {en:"Lowland Streaked Tenrec",pl:"Tenrek paskowany",de:"Streifentenrek",sv:"R\u00e4ndrad tenrek",langs:["en", "pl", "de", "sv"]},
    {en:"Babirusa",pl:"Babirussa",de:"Hirscheber",sv:"Hjortgalt",langs:["en", "pl", "de", "sv"]},
    {en:"Mantis Shrimp",pl:"Rozkolec",de:"Fangschreckenkrebs",sv:"Bönsyrseräka",langs:["en","pl","de","sv"]},
    {en:"Glass Frog",pl:"Szklana żaba",de:"Glasfrosch",sv:"Glasgroda",langs:["en","pl","de","sv"]},
    {en:"Mimic Octopus",pl:"Ośmiornica naśladowcza",de:"Mimik-Oktopus",sv:"Mimikbläckfisk",langs:["en","pl","de","sv"]},
    {en:"Mantis",pl:"Modliszka",de:"Gottesanbeterin",sv:"Bönsyrsa",langs:["en","pl","de","sv"]},
    {en:"Leafy Sea Dragon",pl:"Smok liściasty",de:"Blattmeerdrache",sv:"Lövhavsdrake",langs:["en","pl","de","sv"]},
    {en:"Axolotl",pl:"Aksolotl",de:"Axolotl",sv:"Axolotl",langs:["en","pl","de","sv"]},
    {en:"Reindeer",pl:"Renifer",de:"Rentier",sv:"Ren",langs:["en","pl","de","sv"]},
    {en:"Pelican",pl:"Pelikan",de:"Pelikan",sv:"Pelikan",langs:["en","pl","de","sv"]},
    {en:"Canary",pl:"Kanarek",de:"Kanarienvogel",sv:"Kanariefågel",langs:["en","pl","de","sv"]},
    {en:"Hawk",pl:"Jastrząb",de:"Habicht",sv:"Hök",langs:["en","pl","de","sv"]},
    {en:"Woodpecker",pl:"Dzięcioł",de:"Specht",sv:"Hackspett",langs:["en","pl","de","sv"]},
    {en:"Alligator",pl:"Aligator",de:"Alligator",sv:"Alligator",langs:["en","pl","de","sv"]},
    {en:"Donkey",pl:"Osioł",de:"Esel",sv:"Åsna",langs:["en","pl","de","sv"]},
    {en:"Turkey",pl:"Indyk",de:"Truthahn",sv:"Kalkon",langs:["en","pl","de","sv"]},
    {en:"Goose",pl:"Gęś",de:"Gans",sv:"Gås",langs:["en","pl","de","sv"]},
    {en:"Rooster",pl:"Kogut",de:"Hahn",sv:"Tupp",langs:["en","pl","de","sv"]},
    {en:"Llama",pl:"Lama",de:"Lama",sv:"Lama",langs:["en","pl","de","sv"]},
    {en:"Yak",pl:"Jak",de:"Yak",sv:"Jak",langs:["en","pl","de","sv"]},
    {en:"Buffalo",pl:"Bawół",de:"Büffel",sv:"Buffel",langs:["en","pl","de","sv"]},
    {en:"Ferret",pl:"Fretka",de:"Frettchen",sv:"Iller",langs:["en","pl","de","sv"]},
    ],
  },
  cartoons: {
    easy: [
    {en:"Mickey Mouse",pl:"Myszka Miki",de:"Micky Maus",sv:"Musse Pigg",langs:["en", "pl", "de", "sv"]},
    {en:"Pikachu",pl:"Pikachu",de:"Pikachu",sv:"Pikachu",langs:["en", "pl", "de", "sv"]},
    {en:"Simba",pl:"Simba",de:"Simba",sv:"Simba",langs:["en", "pl", "de", "sv"]},
    {en:"Shrek",pl:"Shrek",de:"Shrek",sv:"Shrek",langs:["en", "pl", "de", "sv"]},
    {en:"Peppa Pig",pl:"\u015awinka Peppa",de:"Peppa Wutz",sv:"Greta Gris",langs:["en", "pl", "de", "sv"]},
    {en:"Buzz Lightyear",pl:"Buzz Astral",de:"Buzz Lightyear",sv:"Buzz Lightyear",langs:["en", "pl", "de", "sv"]},
    {en:"Nemo",pl:"Nemo",de:"Nemo",sv:"Nemo",langs:["en", "pl", "de", "sv"]},
    {en:"Dumbo",pl:"Dumbo",de:"Dumbo",sv:"Dumbo",langs:["en", "pl", "de", "sv"]},
    {en:"Winnie the Pooh",pl:"Kubu\u015b Puchatek",de:"Winnie Puuh",sv:"Nalle Puh",langs:["en", "pl", "de", "sv"]},
    {en:"Cinderella",pl:"Kopciuszek",de:"Cinderella",sv:"Askungen",langs:["en", "pl", "de", "sv"]},
    {en:"Snow White",pl:"Kr\u00f3lewna \u015anie\u017cka",de:"Schneewittchen",sv:"Sn\u00f6vit",langs:["en", "pl", "de", "sv"]},
    {en:"Bambi",pl:"Bambi",de:"Bambi",sv:"Bambi",langs:["en", "pl", "de", "sv"]},
    {en:"Woody",pl:"Chudy",de:"Woody",sv:"Woody",langs:["en", "pl", "de", "sv"]},
    {en:"Olaf",pl:"Olaf",de:"Olaf",sv:"Olaf",langs:["en", "pl", "de", "sv"]},
    {en:"Moana",pl:"Vaiana",de:"Vaiana",sv:"Vaiana",langs:["en", "pl", "de", "sv"]},
    {en:"Puss in Boots",pl:"Kot w butach",de:"Der gestiefelte Kater",sv:"M\u00e4sterkatten",langs:["en", "pl", "de", "sv"]},
    {en:"Stitch",pl:"Stitch",de:"Stitch",sv:"Stitch",langs:["en", "pl", "de", "sv"]},
    {en:"Totoro",pl:"Totoro",de:"Totoro",sv:"Totoro",langs:["en", "pl", "de", "sv"]},
    {en:"Dory",pl:"Dory",de:"Dorie",sv:"Dory",langs:["en", "pl", "de", "sv"]},
    {en:"Wall-E",pl:"Wall-E",de:"Wall-E",sv:"Wall-E",langs:["en", "pl", "de", "sv"]},
    {en:"Lightning McQueen",pl:"Zygzak McQueen",de:"Lightning McQueen",sv:"Blixten McQueen",langs:["en", "pl", "de", "sv"]},
    {en:"Minion",pl:"Minionek",de:"Minion",sv:"Minion",langs:["en", "pl", "de", "sv"]},
    {en:"Aladdin",pl:"Aladyn",de:"Aladdin",sv:"Aladdin",langs:["en", "pl", "de", "sv"]},
    {en:"Rapunzel",pl:"Roszpunka",de:"Rapunzel",sv:"Rapunzel",langs:["en", "pl", "de", "sv"]},
    {en:"Merida",pl:"Merida",de:"Merida",sv:"Merida",langs:["en", "pl", "de", "sv"]},
    {en:"Ariel",pl:"Ariel",de:"Arielle",sv:"Ariel",langs:["en", "pl", "de", "sv"]},
    {en:"Scooby-Doo",pl:"Scooby-Doo",de:"Scooby-Doo",sv:"Scooby-Doo",langs:["en", "pl", "de", "sv"]},
    {en:"Tom Cat",pl:"Kot Tom",de:"Tom",sv:"Tom",langs:["en", "pl", "de", "sv"]},
    {en:"Jerry Mouse",pl:"Mysz Jerry",de:"Jerry",sv:"Jerry",langs:["en", "pl", "de", "sv"]},
    {en:"Bugs Bunny",pl:"Kr\u00f3lik Bugs",de:"Bugs Bunny",sv:"Snurre Spr\u00e4tt",langs:["en", "pl", "de", "sv"]},
    {en:"Daffy Duck",pl:"Kaczor Daffy",de:"Daffy Duck",sv:"Daffy Duck",langs:["en", "pl", "de", "sv"]},
    {en:"Tweety",pl:"Tweety",de:"Tweety",sv:"Pip",langs:["en", "pl", "de", "sv"]},
    {en:"Yogi Bear",pl:"Mi\u015b Yogi",de:"Yogi B\u00e4r",sv:"Yogi Bj\u00f6rn",langs:["en", "pl", "de", "sv"]},
    {en:"Fred Flintstone",pl:"Fred Flinston",de:"Fred Feuerstein",sv:"Fred Flinta",langs:["en", "pl", "de", "sv"]},
    {en:"Popeye",pl:"Popeye Marynarz",de:"Popeye",sv:"Karl-Alfred",langs:["en", "pl", "de", "sv"]},
    {en:"Asterix",pl:"Asteriks",de:"Asterix",sv:"Asterix",langs:["en", "pl", "de", "sv"]},
    {en:"Elsa",pl:"Elsa",de:"Elsa",sv:"Elsa",langs:["en", "pl", "de", "sv"]},
    {en:"SpongeBob SquarePants",pl:"SpongeBob Kanciastoporty",de:"SpongeBob Schwammkopf",sv:"SvampBob Fyrkant",langs:["en", "pl", "de", "sv"]},
    {en:"Garfield",pl:"Garfield",de:"Garfield",sv:"Garfield",langs:["en", "pl", "de", "sv"]},
    {en:"Bluey",pl:"Bluey",de:"Bluey",sv:"Bluey",langs:["en", "pl", "de", "sv"]},
    {en:"Dora the Explorer",pl:"Dora",de:"Dora",sv:"Dora",langs:["en", "pl", "de", "sv"]},
    {en:"Kung Fu Panda",pl:"Kung Fu Panda",de:"Kung Fu Panda",sv:"Kung Fu Panda",langs:["en", "pl", "de", "sv"]},
    {en:"Bolek i Lolek",pl:"Bolek i Lolek",de:"Bolek i Lolek",sv:"Bolek i Lolek",langs:["pl"]},
    {en:"Reksio",pl:"Reksio",de:"Reksio",sv:"Reksio",langs:["pl"]},
    {en:"Mi\u015b Uszatek",pl:"Mi\u015b Uszatek",de:"Mi\u015b Uszatek",sv:"Mi\u015b Uszatek",langs:["pl"]},
    {en:"Kozio\u0142ek Mato\u0142ek",pl:"Kozio\u0142ek Mato\u0142ek",de:"Kozio\u0142ek Mato\u0142ek",sv:"Kozio\u0142ek Mato\u0142ek",langs:["pl"]},
    {en:"Pippi Po\u0144czoszanka",pl:"Pippi Po\u0144czoszanka",de:"Pippi Po\u0144czoszanka",sv:"Pippi Po\u0144czoszanka",langs:["pl"]},
    {en:"Pippi Longstocking",pl:"Pippi Longstocking",de:"Pippi Longstocking",sv:"Pippi L\u00e5ngstrump",langs:["sv"]},
    {en:"Bamse",pl:"Bamse",de:"Bamse",sv:"Bamse",langs:["sv"]},
    {en:"Alfons \u00c5berg",pl:"Alfons \u00c5berg",de:"Alfons \u00c5berg",sv:"Alfons \u00c5berg",langs:["sv"]},
    {en:"Mamma Mu",pl:"Mamma Mu",de:"Mamma Mu",sv:"Mamma Mu",langs:["sv"]},
    {en:"Little My",pl:"Little My",de:"Little My",sv:"Lilla My",langs:["sv"]},
    {en:"Pettson och Findus",pl:"Pettson och Findus",de:"Pettson och Findus",sv:"Pettson och Findus",langs:["sv"]},
    {en:"Moominpappa",pl:"Moominpappa",de:"Moominpappa",sv:"Moominpappa",langs:["sv"]},
    {en:"LasseMajas detektivbyr\u00e5",pl:"LasseMajas detektivbyr\u00e5",de:"LasseMajas detektivbyr\u00e5",sv:"LasseMajas detektivbyr\u00e5",langs:["sv"]}
    ],
    medium: [
      {en:"Paddington Bear",pl:"Paddington",de:"Paddington Bär",sv:"Paddington",langs:["en","pl","de","sv"]},
      {en:"Dexter (Lab)",pl:"Dexter",de:"Dexter",sv:"Dexter",langs:["en","pl","de","sv"]},
      {en:"Johnny Bravo",pl:"Johnny Bravo",de:"Johnny Bravo",sv:"Johnny Bravo",langs:["en","pl","de","sv"]},
      {en:"Courage the Cowardly Dog",pl:"Tchórzliwy Pies Kurak",de:"Courage der feige Hund",sv:"Den fege hunden Courage",langs:["en","pl","de","sv"]},
      {en:"The Powerpuff Girls",pl:"Atomówki",de:"Powerpuff Girls",sv:"Powerpuff Girls",langs:["en","pl","de","sv"]},
      {en:"Hey Arnold",pl:"Hej Arnold",de:"Hey Arnold",sv:"Hej Arnold",langs:["en","pl","de","sv"]},
      {en:"Beavis and Butt-Head",pl:"Beavis i Butt-Head",de:"Beavis und Butt-Head",sv:"Beavis och Butt-Head",langs:["en","pl","de","sv"]},
      {en:"Zuko (Avatar)",pl:"Zuko",de:"Zuko",sv:"Zuko",langs:["en","pl","de","sv"]},
      {en:"Uncle Iroh (Avatar)",pl:"Wuj Iroh",de:"Onkel Iroh",sv:"Farbror Iroh",langs:["en","pl","de","sv"]},
      {en:"Baymax",pl:"Baymax",de:"Baymax",sv:"Baymax",langs:["en","pl","de","sv"]},
      {en:"Cheshire Cat",pl:"Kot z Cheshire",de:"Grinsekatze",sv:"Cheshire-katten",langs:["en","pl","de","sv"]},
      {en:"Mad Hatter",pl:"Szalony Kapelusznik",de:"Hutmacher",sv:"Galenpannan",langs:["en","pl","de","sv"]},
      {en:"Sleeping Beauty",pl:"Śpiąca Królewna",de:"Dornröschen",sv:"Törnrosa",langs:["en","pl","de","sv"]},
      {en:"Baloo (Jungle Book)",pl:"Baloo",de:"Balu",sv:"Baloo",langs:["en","pl","de","sv"]},
      {en:"Scar (Lion King)",pl:"Skaza",de:"Scar",sv:"Scar",langs:["en","pl","de","sv"]},
      {en:"Mike Wazowski",pl:"Mike Wazowski",de:"Mike Wazowski",sv:"Mike Wazowski",langs:["en","pl","de","sv"]},
      {en:"Sulley (Monsters Inc)",pl:"Sulley",de:"Sulley",sv:"Sulley",langs:["en","pl","de","sv"]},
      {en:"Remy (Ratatouille)",pl:"Remy",de:"Remy",sv:"Remy",langs:["en","pl","de","sv"]},
      {en:"Carl Fredricksen (Up)",pl:"Carl",de:"Carl",sv:"Carl",langs:["en","pl","de","sv"]},
      {en:"Yzma (Emperor's New Groove)",pl:"Yzma",de:"Yzma",sv:"Yzma",langs:["en","pl","de","sv"]},
      {en:"Mulan",pl:"Mulan",de:"Mulan",sv:"Mulan",langs:["en","de","sv"]},
      {en:"Lilo (Lilo & Stitch)",pl:"Lilo",de:"Lilo",sv:"Lilo",langs:["en","pl","de","sv"]},
      {en:"Hiro Hamada (Big Hero 6)",pl:"Hiro Hamada",de:"Hiro Hamada",sv:"Hiro Hamada",langs:["en","pl","de","sv"]},
      {en:"Bamse",pl:"",de:"",sv:"Bamse",langs:["sv"]},
      {en:"Pippi Longstocking",pl:"Pippi Pończoszanka",de:"Pippi Langstrumpf",sv:"Pippi Långstrump",langs:["en","pl","de","sv"]},
    ],
    hard: [
      {en:"Tintin",pl:"Tintin",de:"Tim",sv:"Tintin",langs:["en","pl","de","sv"]},
      {en:"Asterix",pl:"Asteriks",de:"Asterix",sv:"Asterix",langs:["en","pl","de","sv"]},
      {en:"Obelix",pl:"Obeliks",de:"Obelix",sv:"Obelix",langs:["en","pl","de","sv"]},
      {en:"Lucky Luke",pl:"Lucky Luke",de:"Lucky Luke",sv:"Lucky Luke",langs:["en","pl","de","sv"]},
      {en:"Marsupilami",pl:"Marsupilami",de:"Marsupilami",sv:"Marsupilami",langs:["en","pl","de","sv"]},
      {en:"Naruto",pl:"Naruto",de:"Naruto",sv:"Naruto",langs:["en","pl","de","sv"]},
      {en:"Goku (Dragon Ball)",pl:"Goku",de:"Goku",sv:"Goku",langs:["en","pl","de","sv"]},
      {en:"Sailor Moon",pl:"Sailor Moon",de:"Sailor Moon",sv:"Sailor Moon",langs:["en","pl","de","sv"]},
      {en:"Luffy (One Piece)",pl:"Luffy",de:"Luffy",sv:"Luffy",langs:["en","pl","de","sv"]},
      {en:"Boo (Monsters Inc)",pl:"Boo",de:"Buh",sv:"Boo",langs:["en","pl","de","sv"]},
      {en:"Flik (A Bug's Life)",pl:"Flik",de:"Flik",sv:"Flik",langs:["en","pl","de","sv"]},
      {en:"Russell (Up)",pl:"Russel",de:"Russell",sv:"Russell",langs:["en","pl","de","sv"]},
      {en:"Kronk (Emperor's New Groove)",pl:"Kronk",de:"Kronk",sv:"Kronk",langs:["en","pl","de","sv"]},
      {en:"King Louie (Jungle Book)",pl:"Król Louie",de:"König Louie",sv:"Kung Louie",langs:["en","pl","de","sv"]},
      {en:"Ren and Stimpy",pl:"Ren i Stimpy",de:"Ren und Stimpy",sv:"Ren och Stimpy",langs:["en","pl","de","sv"]},
      {en:"Samurai Jack",pl:"Samuraj Jack",de:"Samurai Jack",sv:"Samurai Jack",langs:["en","pl","de","sv"]},
      {en:"Bolek i Lolek",pl:"Bolek i Lolek",de:"",sv:"",langs:["pl"]},
      {en:"Reksio",pl:"Reksio",de:"",sv:"",langs:["pl"]},
      {en:"Alfons Åberg",pl:"",de:"",sv:"Alfons Åberg",langs:["sv"]},
      {en:"Mamma Mu",pl:"",de:"",sv:"Mamma Mu",langs:["sv"]},
    ],
  },
};

// Wikipedia article name overrides (when display name ≠ Wikipedia article title)
const WIKI_OVERRIDES = {
  'Messi': 'Lionel Messi',
  'Cristiano Ronaldo': 'Cristiano Ronaldo',
  'The Beatles': 'The Beatles',
  'SpongeBob SquarePants': 'SpongeBob SquarePants',
  'Napoleon Bonaparte': 'Napoleon',
  'Galileo Galilei': 'Galileo Galilei',
  'Nicolaus Copernicus': 'Copernicus',
};

// ── Room Management ───────────────────────────────────────────────
const whoamiRooms = {};

function makeCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function getCharacters(categories, difficulty, lang) {
  let pool = [];
  const activeLang = lang || 'en';
  const cats = categories.includes('mixed')
    ? ['sports', 'music', 'film', 'history', 'animals', 'cartoons']
    : categories.map(c => c === 'kids' ? 'cartoons' : c);

  cats.forEach(cat => {
    const catData = CHARACTERS[cat];
    if (!catData) return;
    if (cat === 'cartoons' || cat === 'kids') {
      const cartLevels = difficulty === 'easy'   ? ['easy'] :
                         difficulty === 'medium' ? ['easy', 'medium'] :
                                                   ['easy', 'medium', 'hard'];
      cartLevels.forEach(lvl => {
        if (catData[lvl]) pool = pool.concat(
          catData[lvl].filter(ch => !ch.langs || ch.langs.includes(activeLang))
        );
      });
    } else {
      const levels = difficulty === 'easy'   ? ['easy'] :
                     difficulty === 'medium' ? ['easy', 'medium'] :
                                               ['easy', 'medium', 'hard'];
      levels.forEach(lvl => {
        if (catData[lvl]) pool = pool.concat(
          catData[lvl].filter(ch => !ch.langs || ch.langs.includes(activeLang))
        );
      });
    }
  });
  // Deduplicate by EN name (case-insensitive)
  const seen = new Set();
  return pool.filter(ch => {
    const key = (typeof ch === 'string' ? ch : ch.en).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function pickCharacter(pool, usedInSession) {
  const available = pool.filter(ch => {
    const name = typeof ch === 'string' ? ch : ch.en;
    return !usedInSession.includes(name);
  });
  const src = available.length ? available : pool;
  return src[Math.floor(Math.random() * src.length)];
}

function makeWhoamiRoom(hostId, settings) {
  const code = makeCode();
  return {
    code,
    hostId,
    isPublic: settings.isPublic || false,
    mode: settings.mode || 'voice',           // 'voice' | 'chat'
    settings: {
      categories:  settings.categories  || ['mixed'],
      difficulty:  settings.difficulty  || 'easy',
      turnsEach:   settings.turnsEach   || 1,
      timerSecs:   settings.timerSecs   || 120,  // 0 = no timer
      hintsOn:     settings.hintsOn     !== false,
      lang:        settings.lang        || 'pl',
    },
    players: [],
    state: {
      phase:          'lobby',   // lobby | playing | turn_result | final
      currentIdx:     0,         // index in players array
      turnCount:      0,         // total turns completed
      activeChar:     null,      // current character
      wikiSlug:       null,      // wikipedia article slug
      chat:           [],        // chat messages [{type,from,text,ts}]
      questionCount:  0,
      usedChars:      [],        // prevents repeats
      timerEnd:       null,
    },
  };
}

function emitState(io, room) {
  // Each player gets a slightly different state — active player doesn't see their character
  const activePId = room.players[room.state.currentIdx]
    ? room.players[room.state.currentIdx].id : null;

  room.players.forEach(p => {
    const isActive = p.id === activePId;
    const state = {
      phase:         room.state.phase,
      hostId:        room.hostId,
      mode:          room.mode,
      settings:      room.settings,
      players:       room.players.map(pl => ({
        id: pl.id, name: pl.name, score: pl.score, connected: pl.connected,
      })),
      currentIdx:    room.state.currentIdx,
      activePlayerId: activePId,
      // Active player sees no character during playing; everyone sees it on turn_result
      // Send localised char name if available for this player's language
      activeChar:    (isActive && room.state.phase === 'playing') ? null :
                     (room.state.charByLang && room.state.charByLang[p.lang || 'en'] ?
                      room.state.charByLang[p.lang || 'en'] : room.state.activeChar),
      wikiSlug:      (isActive && room.state.phase === 'playing') ? null : room.state.wikiSlug,
      questionCount: room.state.questionCount,
      chat:          room.state.chat,
      timerEnd:      room.state.timerEnd,
      turnsLeft:     (room.settings.turnsEach * room.players.filter(p=>p.connected).length)
                     - room.state.turnCount,
      turnCount:     room.state.turnCount,
      totalTurns:    room.settings.turnsEach * room.players.filter(p=>p.connected).length,
    };
    io.to(p.id).emit('whoami_state', state);
  });
}

function startNextTurn(io, room) {
  const pool = getCharacters(room.settings.categories, room.settings.difficulty, room.lang);
  const charObj = pickCharacter(pool, room.state.usedChars);
  const charEn  = typeof charObj === 'string' ? charObj : charObj.en;
  // Store localised name per language for display
  room.state.charByLang = typeof charObj === 'object' ? charObj : null;
  room.state.usedChars.push(charEn);
  room.state.activeChar    = charEn;
  room.state.wikiSlug      = WIKI_OVERRIDES[charEn] || charEn;
  room.state.questionCount = 0;
  room.state.chat          = [];
  room.state.phase         = 'playing';
  room.state.timerEnd      = room.settings.timerSecs > 0
    ? Date.now() + room.settings.timerSecs * 1000 : null;

  // Timer auto-advance
  if (room._turnTimer) clearTimeout(room._turnTimer);
  if (room.settings.timerSecs > 0) {
    room._turnTimer = setTimeout(() => {
      if (room.state.phase === 'playing') {
        room.state.phase = 'turn_result';
        room.state.chat.push({ type:'system', text:'⏱️ Time is up!', ts: Date.now() });
        emitState(io, room);
      }
    }, room.settings.timerSecs * 1000 + 500);
  }

  emitState(io, room);
}

// ── Socket Registration ───────────────────────────────────────────
function register(io, socket) {

  // CREATE
  socket.on('whoami_create', ({ name, settings, website }) => {
    if (isHoneypot(website)) return;
    const trimmed = (name || '').trim();
    if (!trimmed) { socket.emit('whoami_error', { msg: 'Enter your name.' }); return; }
    if (isBotName(trimmed)) { socket.emit('whoami_error', { msg: 'Invalid name.' }); return; }

    const room = makeWhoamiRoom(socket.id, settings || {});
    room.lang = (settings && settings.lang) || 'pl';
    room.players.push({ id: socket.id, name: trimmed, score: 0, connected: true, lang: (settings && settings.lang) || 'pl' });
    whoamiRooms[room.code] = room;
    socket.join(room.code);
    socket.emit('whoami_created', { code: room.code });
    emitState(io, room);
  });

  // JOIN
  socket.on('whoami_join', ({ name, code, website }) => {
    if (isHoneypot(website)) return;
    const trimmed = (name || '').trim();
    const roomCode = (code || '').trim().toUpperCase();
    if (!trimmed) { socket.emit('whoami_error', { msg: 'Enter your name.' }); return; }
    if (isBotName(trimmed)) { socket.emit('whoami_error', { msg: 'Invalid name.' }); return; }

    const room = whoamiRooms[roomCode];
    if (!room) { socket.emit('whoami_error', { msg: 'Room not found.' }); return; }
    // If game in progress, try to rejoin as existing disconnected player
    if (room.state.phase !== 'lobby') {
      const existing = room.players.find(p => p.name.toLowerCase() === trimmed.toLowerCase() && !p.connected);
      if (existing) {
        if (room.hostId === existing.id) room.hostId = socket.id;
        existing.id = socket.id;
        existing.connected = true;
        socket.join(roomCode);
        socket.emit('whoami_joined', { code: roomCode });
        emitState(io, room);
        return;
      }
      socket.emit('whoami_error', { msg: 'Game already started.' }); return;
    }
    if (room.players.length >= 16) { socket.emit('whoami_error', { msg: 'Room is full.' }); return; }

    const nameTaken = room.players.find(p => p.name.toLowerCase() === trimmed.toLowerCase() && p.connected);
    if (nameTaken) { socket.emit('whoami_error', { msg: 'Name already taken.' }); return; }

    room.players.push({ id: socket.id, name: trimmed, score: 0, connected: true, lang: (code && room.lang) || 'en' });
    socket.join(roomCode);
    socket.emit('whoami_joined', { code: roomCode });
    emitState(io, room);
  });

  // REJOIN
  socket.on('whoami_rejoin', ({ name, code }) => {
    const room = whoamiRooms[(code||'').toUpperCase()];
    if (!room) { socket.emit('whoami_error', { msg: 'Room expired.' }); return; }
    const existing = room.players.find(p => p.name === name);
    if (existing) {
      if (room.hostId === existing.id) room.hostId = socket.id;
      if (room.state.currentIdx < room.players.length &&
          room.players[room.state.currentIdx].id === existing.id) {
        // keep turn
      }
      existing.id = socket.id;
      existing.connected = true;
    } else {
      if (room.state.phase !== 'lobby') { socket.emit('whoami_error', { msg: 'Room already started.' }); return; }
      room.players.push({ id: socket.id, name, score: 0, connected: true });
    }
    socket.join(room.code);
    socket.emit('whoami_joined', { code: room.code });
    emitState(io, room);
  });

  // START
  socket.on('whoami_start', ({ code }) => {
    const room = whoamiRooms[code];
    if (!room || socket.id !== room.hostId) return;
    if (room.players.length < 2) { socket.emit('whoami_error', { msg: 'Need at least 2 players.' }); return; }
    room.state.currentIdx = 0;
    room.state.turnCount  = 0;
    room.state.usedChars  = [];
    startNextTurn(io, room);
  });

  // CHAT — question (chat mode only)
  socket.on('whoami_question', ({ code, text }) => {
    const room = whoamiRooms[code];
    if (!room || room.state.phase !== 'playing') return;
    if (room.mode !== 'chat') return;
    const activePlayer = room.players[room.state.currentIdx];
    if (!activePlayer || activePlayer.id !== socket.id) return;
    const msg = (text || '').trim().slice(0, 120);
    if (!msg) return;

    room.state.questionCount++;
    // Each question gets a unique ID so votes attach to the right question
    const qId = Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    room.state.chat.push({
      type: 'question', qId, from: activePlayer.name, text: msg,
      votes: {}, // { playerName: 'yes'|'no'|'maybe' }
      ts: Date.now()
    });
    emitState(io, room);
  });

  // ANSWER — Yes/No/Maybe per question ID (chat mode)
  socket.on('whoami_answer', ({ code, answer, qId }) => {
    const room = whoamiRooms[code];
    if (!room || room.state.phase !== 'playing') return;
    if (room.mode !== 'chat') return;
    const activePlayer = room.players[room.state.currentIdx];
    if (!activePlayer || activePlayer.id === socket.id) return;
    if (!['yes','no','maybe'].includes(answer)) return;

    const voter = room.players.find(p => p.id === socket.id);
    if (!voter) return;

    // Find the specific question by qId, or fall back to last unanswered
    const targetQ = qId
      ? room.state.chat.find(m => m.type === 'question' && m.qId === qId)
      : [...room.state.chat].reverse().find(m => m.type === 'question');

    if (!targetQ) return;
    if (!targetQ.votes) targetQ.votes = {};

    // Allow changing vote — just overwrite
    targetQ.votes[voter.name] = answer;

    emitState(io, room);
  });

  // VOICE CORRECT — active player self-reports correct guess (voice mode)
  socket.on('whoami_voice_correct', ({ code }) => {
    const room = whoamiRooms[code];
    if (!room || room.state.phase !== 'playing') return;
    const activePlayer = room.players[room.state.currentIdx];
    if (!activePlayer || activePlayer.id !== socket.id) return;
    activePlayer.score++;
    if (room._turnTimer) clearTimeout(room._turnTimer);
    room.state.phase = 'turn_result';
    room.state.chat.push({ type:'system', text:`✅ ${activePlayer.name} guessed correctly! It was ${room.state.activeChar}!`, ts: Date.now() });
    emitState(io, room);
  });

  // GUESS — active player guesses their character
  socket.on('whoami_guess', ({ code, guess }) => {
    const room = whoamiRooms[code];
    if (!room || room.state.phase !== 'playing') return;
    const activePlayer = room.players[room.state.currentIdx];
    if (!activePlayer || activePlayer.id !== socket.id) return;

    const guessClean = (guess || '').trim().toLowerCase();
    const charClean  = (room.state.activeChar || '').toLowerCase();
    const correct    = guessClean === charClean ||
                       charClean.includes(guessClean) ||
                       guessClean.includes(charClean.split(' ')[0].toLowerCase());

    if (correct) {
      activePlayer.score++;
      if (room._turnTimer) clearTimeout(room._turnTimer);
      room.state.phase = 'turn_result';
      room.state.chat.push({ type:'system', text:`✅ Correct! It was ${room.state.activeChar}!`, ts: Date.now() });
    } else {
      room.state.chat.push({ type:'system', text:`❌ Wrong guess: "${guess}"`, ts: Date.now() });
    }
    emitState(io, room);
  });

  // SURRENDER
  socket.on('whoami_skip', ({ code }) => {
    const room = whoamiRooms[code];
    if (!room || room.state.phase !== 'playing') return;
    if (socket.id !== room.hostId) return; // host only
    // Pick new character, reset timer, keep same active player
    const pool = getCharacters(room.settings.categories, room.settings.difficulty, room.lang);
    const charObj = pickCharacter(pool, room.state.usedChars);
    const charEn  = typeof charObj === 'string' ? charObj : charObj.en;
    room.state.charByLang = typeof charObj === 'object' ? charObj : null;
    room.state.usedChars.push(charEn);
    room.state.activeChar    = charEn;
    room.state.wikiSlug      = WIKI_OVERRIDES[charEn] || charEn;
    room.state.questionCount = 0;
    room.state.chat          = [];
    if (room.settings.timerSecs > 0) {
      room.state.timerEnd = Date.now() + room.settings.timerSecs * 1000;
      if (room._turnTimer) clearTimeout(room._turnTimer);
      room._turnTimer = setTimeout(() => {
        if (room.state.phase === 'playing') {
          room.state.chat.push({ type:'system', text:'⏱️ ' + room.state.activeChar, ts: Date.now() });
          room.state.phase = 'turn_result';
          room.state.turnCount++;
          const total = room.settings.turnsEach * room.players.filter(p=>p.connected).length;
          if (room.state.turnCount >= total) room.state.phase = 'final';
          emitState(io, room);
        }
      }, room.settings.timerSecs * 1000);
    }
    emitState(io, room);
  });

  socket.on('whoami_surrender', ({ code }) => {
    const room = whoamiRooms[code];
    if (!room || room.state.phase !== 'playing') return;
    const activePlayer = room.players[room.state.currentIdx];
    if (!activePlayer || activePlayer.id !== socket.id) return;

    if (room._turnTimer) clearTimeout(room._turnTimer);
    room.state.phase = 'turn_result';
    room.state.chat.push({ type:'system', text:`🏳️ Surrendered. It was ${room.state.activeChar}.`, ts: Date.now() });
    emitState(io, room);
  });

  // NEXT TURN (host advances)
  socket.on('whoami_next', ({ code }) => {
    const room = whoamiRooms[code];
    if (!room || socket.id !== room.hostId) return;
    if (room.state.phase !== 'turn_result') return;

    room.state.turnCount++;
    const totalTurns = room.settings.turnsEach * room.players.filter(p=>p.connected).length;

    if (room.state.turnCount >= totalTurns) {
      room.state.phase = 'final';
      emitState(io, room);
      return;
    }

    // Advance to next connected player
    let next = (room.state.currentIdx + 1) % room.players.length;
    let safety = 0;
    while (!room.players[next].connected && safety++ < room.players.length) {
      next = (next + 1) % room.players.length;
    }
    room.state.currentIdx = next;
    startNextTurn(io, room);
  });

  // PLAY AGAIN
  socket.on('whoami_rematch', ({ code }) => {
    const room = whoamiRooms[code];
    if (!room || socket.id !== room.hostId) return;
    room.state.phase        = 'lobby';
    room.state.currentIdx   = 0;
    room.state.turnCount    = 0;
    room.state.usedChars    = [];
    room.state.chat         = [];
    room.state.activeChar   = null;
    room.state.wikiSlug     = null;
    room.players.forEach(p => p.score = 0);
    emitState(io, room);
  });

  // UPDATE SETTINGS (host only, lobby phase)
  socket.on('whoami_settings', ({ code, settings }) => {
    const room = whoamiRooms[code];
    if (!room || socket.id !== room.hostId || room.state.phase !== 'lobby') return;
    Object.assign(room.settings, settings);
    if (settings.isPublic !== undefined) room.isPublic = settings.isPublic;
    emitState(io, room);
  });

  // DISCONNECT
  socket.on('disconnect', () => {
    for (const code of Object.keys(whoamiRooms)) {
      const room = whoamiRooms[code];
      const p = room.players.find(p => p.id === socket.id);
      if (!p) continue;
      // Grace period — wait 90s before marking disconnected
      // Allows mobile users switching apps to rejoin without losing their spot
      const disconnectedId = socket.id;
      setTimeout(() => {
        const stillSame = p.id === disconnectedId; // hasn't rejoined with new socket
        if (!stillSame) return; // rejoined already
        p.connected = false;
        if (disconnectedId === room.hostId) {
          const next = room.players.find(pl => pl.connected && pl.id !== disconnectedId);
          if (next) room.hostId = next.id;
        }
        emitState(io, room);
        const allGone = room.players.every(pl => !pl.connected);
        if (allGone) {
          setTimeout(() => { if (whoamiRooms[code]) delete whoamiRooms[code]; }, 3 * 60 * 60 * 1000);
        }
      }, 90000); // 90 second grace period
      break;
    }
  });
}

function getWhoamiRooms() { return Object.values(whoamiRooms); }

module.exports = { register, getWhoamiRooms };
