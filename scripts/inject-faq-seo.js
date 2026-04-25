#!/usr/bin/env node
/**
 * inject-faq-seo.js
 * Adds FAQPage structured data to DE and SV game SEO pages.
 * Run: node scripts/inject-faq-seo.js
 *
 * Safe to run multiple times — skips pages that already have FAQPage.
 */

const fs   = require('fs');
const path = require('path');
const SEO  = path.join(__dirname, '..', 'public', 'seo');

const FAQ_DATA = {
  // ── GERMAN ───────────────────────────────────────────
  'stadt-land-fluss-online.html': {
    lang: 'de', game: 'Stadt Land Fluss',
    faqs: [
      { q: 'Wie spielt man Stadt Land Fluss online?', a: 'Erstelle einen Raum auf panstwamiastagra.com, teile den Code mit Freunden und spielt kostenlos auf jedem Gerät — ohne Download oder Anmeldung.' },
      { q: 'Ist Stadt Land Fluss kostenlos?', a: 'Ja, komplett kostenlos. Keine versteckten Kosten, keine Werbung, keine Registrierung erforderlich.' },
      { q: 'Wie viele Spieler können mitspielen?', a: '2 bis 12 Spieler können gleichzeitig in einem Raum spielen. Perfekt für Familienabende, Schulklassen oder Team-Events.' },
      { q: 'Funktioniert es auf dem Handy?', a: 'Ja, das Spiel funktioniert auf Smartphones, Tablets und Computern — direkt im Browser, ohne App.' },
    ]
  },
  'verbotene-woerter.html': {
    lang: 'de', game: 'Verbotene Wörter',
    faqs: [
      { q: 'Was ist Verbotene Wörter?', a: 'Ein Teamspiel, bei dem du Begriffe beschreibst, ohne bestimmte verbotene Wörter zu benutzen. Ideal als Partyspiel für Gruppen ab 4 Personen.' },
      { q: 'Ist Verbotene Wörter kostenlos online spielbar?', a: 'Ja, auf panstwamiastagra.com kannst du kostenlos spielen — ohne Anmeldung, ohne Download, auf jedem Gerät.' },
      { q: 'Ab welchem Alter kann man spielen?', a: 'Ab etwa 11 Jahren. Das Spiel fördert Wortschatz und kreatives Denken — perfekt für Familien und Schulen.' },
      { q: 'Wie viele Spieler braucht man?', a: 'Mindestens 4 Spieler (2 Teams). Bis zu 12 Spieler können in einem Raum spielen.' },
    ]
  },
  'galgenmaennchen-online.html': {
    lang: 'de', game: 'Galgenmännchen',
    faqs: [
      { q: 'Kann man Galgenmännchen online mit Freunden spielen?', a: 'Ja! Auf panstwamiastagra.com kannst du kostenlos Galgenmännchen online spielen — erstelle einen Raum und teile den Code.' },
      { q: 'Ist Galgenmännchen ein gutes Spiel für Kinder?', a: 'Ja, Galgenmännchen ist ein beliebtes Lernspiel für Kinder ab 8 Jahren. Es fördert Rechtschreibung und Wortschatz auf spielerische Weise.' },
      { q: 'Wie viele Spieler können mitspielen?', a: '2 bis 10 Spieler. Ein Spieler wählt das Wort, die anderen raten Buchstabe für Buchstabe.' },
      { q: 'Braucht man eine App?', a: 'Nein, das Spiel läuft direkt im Browser auf jedem Gerät — Handy, Tablet oder Computer. Kostenlos und ohne Registrierung.' },
    ]
  },
  'punkte-und-linien-online.html': {
    lang: 'de', game: 'Punkte und Linien',
    faqs: [
      { q: 'Was ist Punkte und Linien?', a: 'Ein klassisches Strategiespiel für 2-4 Spieler. Verbinde abwechselnd Punkte mit Linien — wer ein Feld schließt, bekommt einen Punkt und ist nochmal dran.' },
      { q: 'Ist es kostenlos?', a: 'Ja, komplett kostenlos auf panstwamiastagra.com. Keine Anmeldung, kein Download, keine Werbung.' },
      { q: 'Ab welchem Alter kann man spielen?', a: 'Ab 5 Jahren. Die Regeln sind sehr einfach — perfekt als Familienspiel für Kinder und Erwachsene.' },
      { q: 'Funktioniert es auf dem Smartphone?', a: 'Ja, das Spiel ist für alle Geräte optimiert — Handy, Tablet und Computer.' },
    ]
  },
  'zwei-wahrheiten-eine-luege.html': {
    lang: 'de', game: '2 Wahrheiten 1 Lüge',
    faqs: [
      { q: 'Wie spielt man 2 Wahrheiten 1 Lüge?', a: 'Jeder Spieler erzählt drei Aussagen über sich — zwei sind wahr, eine ist gelogen. Die anderen müssen erraten, welche die Lüge ist.' },
      { q: 'Ist es als Kennenlernspiel geeignet?', a: 'Perfekt! Es ist eines der besten Eisbrecher-Spiele für neue Gruppen, Teambuilding-Events und Partys.' },
      { q: 'Ist es kostenlos?', a: 'Ja, komplett kostenlos auf panstwamiastagra.com — ohne Anmeldung und auf jedem Gerät spielbar.' },
      { q: 'Wie viele Spieler braucht man?', a: 'Mindestens 3 Spieler, bis zu 20. Je mehr Spieler, desto lustiger wird es.' },
    ]
  },
  'unternehmens-bingo.html': {
    lang: 'de', game: 'Unternehmens-Bingo',
    faqs: [
      { q: 'Was ist Unternehmens-Bingo?', a: 'Ein lustiges Spiel für Meetings — markiere typische Bürofloskeln auf deiner Bingo-Karte, wenn du sie hörst. Wer zuerst eine Reihe hat, gewinnt!' },
      { q: 'Ist es kostenlos?', a: 'Ja, kostenlos auf panstwamiastagra.com. Perfekt für Firmenmeetings, Konferenzen und Team-Events.' },
      { q: 'Wie viele Spieler können mitspielen?', a: '2 bis 50 Spieler — ideal für große Gruppen und Firmenmeetings.' },
    ]
  },
  'zeichnen-und-raten.html': {
    lang: 'de', game: 'Zeichnen und Raten',
    faqs: [
      { q: 'Wie funktioniert Zeichnen und Raten?', a: 'Ein Spieler zeichnet einen Begriff, die anderen raten. Nach jeder Runde wird das Bild weitergegeben und verändert sich — wie Stille Post mit Zeichnungen!' },
      { q: 'Ist es kostenlos spielbar?', a: 'Ja, komplett kostenlos auf panstwamiastagra.com — ohne App, ohne Anmeldung.' },
      { q: 'Ab welchem Alter geeignet?', a: 'Ab 8 Jahren. Zeichentalent ist nicht nötig — im Gegenteil, schlechte Zeichnungen machen mehr Spaß!' },
    ]
  },
  'wer-bin-ich.html': {
    lang: 'de', game: 'Wer bin ich?',
    faqs: [
      { q: 'Wie spielt man Wer bin ich online?', a: 'Jeder Spieler bekommt eine geheime Figur zugewiesen und muss durch Ja/Nein-Fragen herausfinden, wer er ist.' },
      { q: 'Ist es kostenlos?', a: 'Ja, kostenlos auf panstwamiastagra.com — ohne Download, ohne Anmeldung, auf jedem Gerät.' },
      { q: 'Für welches Alter geeignet?', a: 'Ab 8 Jahren. Mit über 900 Charakteren aus Film, Sport, Geschichte und mehr — für Kinder und Erwachsene.' },
      { q: 'Wie viele Spieler braucht man?', a: '2 bis 16 Spieler. Perfekt für Familienabende, Partys und Teambuilding.' },
    ]
  },
  'memo-spiel-online.html': {
    lang: 'de', game: 'Memo-Spiel',
    faqs: [
      { q: 'Was ist Paare finden?', a: 'Ein klassisches Kartenspiel für Kinder und Familien. Decke abwechselnd zwei Karten auf und finde passende Paare — wer die meisten Paare sammelt, gewinnt.' },
      { q: 'Ist es kostenlos?', a: 'Ja, komplett kostenlos auf panstwamiastagra.com — ohne Anmeldung, ohne Download.' },
      { q: 'Ab welchem Alter kann man spielen?', a: 'Ab 4 Jahren! Einfache Regeln, die jedes Kind versteht. Perfekt als Familienspiel.' },
      { q: 'Welche Themen gibt es?', a: '6 Emoji-Themen: Tiere, Essen, Natur, Reise, Sport und Flaggen. Dazu 3 Spielfeldgrößen (3×4, 4×4, 4×5).' },
      { q: 'Funktioniert es auf dem Handy?', a: 'Ja, auf allen Geräten — Smartphone, Tablet und Computer. Direkt im Browser, ohne App.' },
    ]
  },

  // ── SWEDISH ──────────────────────────────────────────
  'laender-och-staeder.html': {
    lang: 'sv', game: 'Länder och Städer',
    faqs: [
      { q: 'Hur spelar man Länder och Städer online?', a: 'Skapa ett rum på panstwamiastagra.com, dela koden med vänner och spela gratis på vilken enhet som helst — utan nedladdning eller registrering.' },
      { q: 'Är det gratis?', a: 'Ja, helt gratis. Inga dolda kostnader, ingen reklam, ingen registrering krävs.' },
      { q: 'Hur många spelare kan delta?', a: '2 till 12 spelare kan spela samtidigt. Perfekt för familjekväll, skolklasser eller teambuilding.' },
      { q: 'Fungerar det på mobilen?', a: 'Ja, spelet fungerar på smartphones, surfplattor och datorer — direkt i webbläsaren, utan app.' },
    ]
  },
  'forbjudna-ord.html': {
    lang: 'sv', game: 'Förbjudna ord',
    faqs: [
      { q: 'Vad är Förbjudna ord?', a: 'Ett lagspel där du beskriver ord utan att använda vissa förbjudna ledtrådar. Perfekt som sällskapsspel för grupper med minst 4 spelare.' },
      { q: 'Är det gratis att spela online?', a: 'Ja, på panstwamiastagra.com kan du spela gratis — utan registrering, utan nedladdning, på vilken enhet som helst.' },
      { q: 'Från vilken ålder kan man spela?', a: 'Från cirka 11 år. Spelet tränar ordförråd och kreativt tänkande — perfekt för familjer och skolor.' },
      { q: 'Hur många spelare behövs?', a: 'Minst 4 spelare (2 lag). Upp till 12 spelare kan spela i ett rum.' },
    ]
  },
  'hanga-gubbe-online.html': {
    lang: 'sv', game: 'Hänga gubbe',
    faqs: [
      { q: 'Kan man spela Hänga gubbe online med vänner?', a: 'Ja! På panstwamiastagra.com kan du spela Hänga gubbe online gratis — skapa ett rum och dela koden.' },
      { q: 'Är Hänga gubbe bra för barn?', a: 'Ja, det är ett populärt lärospel för barn från 8 år. Det tränar stavning och ordförråd på ett lekfullt sätt.' },
      { q: 'Hur många spelare kan delta?', a: '2 till 10 spelare. En spelare väljer ordet, de andra gissar bokstav för bokstav.' },
      { q: 'Behöver man en app?', a: 'Nej, spelet körs direkt i webbläsaren på vilken enhet som helst — mobil, surfplatta eller dator. Gratis och utan registrering.' },
    ]
  },
  'punkter-och-linjer-online.html': {
    lang: 'sv', game: 'Punkter och Linjer',
    faqs: [
      { q: 'Vad är Punkter och Linjer?', a: 'Ett klassiskt strategispel för 2-4 spelare. Dra linjer mellan punkter i tur och ordning — den som stänger en ruta får en poäng och spelar igen.' },
      { q: 'Är det gratis?', a: 'Ja, helt gratis på panstwamiastagra.com. Ingen registrering, ingen nedladdning, ingen reklam.' },
      { q: 'Från vilken ålder kan man spela?', a: 'Från 5 år. Reglerna är mycket enkla — perfekt som familjespel för barn och vuxna.' },
      { q: 'Fungerar det på mobilen?', a: 'Ja, spelet är optimerat för alla enheter — mobil, surfplatta och dator.' },
    ]
  },
  'tva-sanningar-en-logn.html': {
    lang: 'sv', game: '2 Sanningar 1 Lögn',
    faqs: [
      { q: 'Hur spelar man 2 Sanningar 1 Lögn?', a: 'Varje spelare berättar tre påståenden om sig själv — två är sanna, ett är en lögn. De andra ska gissa vilken som är lögnen.' },
      { q: 'Passar det som isbrytare?', a: 'Perfekt! Det är ett av de bästa isbrytarspelen för nya grupper, teambuilding och fester.' },
      { q: 'Är det gratis?', a: 'Ja, helt gratis på panstwamiastagra.com — utan registrering och på vilken enhet som helst.' },
      { q: 'Hur många spelare behövs?', a: 'Minst 3 spelare, upp till 20. Ju fler spelare, desto roligare blir det.' },
    ]
  },
  'foretagsbingo.html': {
    lang: 'sv', game: 'Företagsbingo',
    faqs: [
      { q: 'Vad är Företagsbingo?', a: 'Ett roligt spel för möten — markera typiska kontorsfraser på ditt bingokort när du hör dem. Den som fyller en rad först vinner!' },
      { q: 'Är det gratis?', a: 'Ja, gratis på panstwamiastagra.com. Perfekt för företagsmöten, konferenser och teamevents.' },
      { q: 'Hur många spelare kan delta?', a: '2 till 50 spelare — perfekt för stora grupper och företagsmöten.' },
    ]
  },
  'skissa-och-gissa.html': {
    lang: 'sv', game: 'Skissa och Gissa',
    faqs: [
      { q: 'Hur fungerar Skissa och Gissa?', a: 'En spelare ritar ett ord, de andra gissar. Efter varje runda skickas bilden vidare och förändras — som viskleken men med teckningar!' },
      { q: 'Är det gratis?', a: 'Ja, helt gratis på panstwamiastagra.com — utan app, utan registrering.' },
      { q: 'Från vilken ålder passar det?', a: 'Från 8 år. Ingen rittalang krävs — tvärtom, dåliga teckningar gör det roligare!' },
    ]
  },
  'vem-ar-jag.html': {
    lang: 'sv', game: 'Vem är jag?',
    faqs: [
      { q: 'Hur spelar man Vem är jag online?', a: 'Varje spelare får en hemlig karaktär och måste lista ut vem det är genom att ställa ja/nej-frågor.' },
      { q: 'Är det gratis?', a: 'Ja, gratis på panstwamiastagra.com — utan nedladdning, utan registrering, på vilken enhet som helst.' },
      { q: 'Vilken ålder passar det för?', a: 'Från 8 år. Med över 900 karaktärer från film, sport, historia och mer — för barn och vuxna.' },
      { q: 'Hur många spelare behövs?', a: '2 till 16 spelare. Perfekt för familjekvällar, fester och teambuilding.' },
    ]
  },
  'memo-spel-online.html': {
    lang: 'sv', game: 'Memo-spel',
    faqs: [
      { q: 'Vad är Hitta Par?', a: 'Ett klassiskt kortspel för barn och familjer. Vänd två kort i taget och hitta matchande par — den som samlar flest par vinner.' },
      { q: 'Är det gratis?', a: 'Ja, helt gratis på panstwamiastagra.com — utan registrering, utan nedladdning.' },
      { q: 'Från vilken ålder kan man spela?', a: 'Från 4 år! Enkla regler som alla barn förstår. Perfekt som familjespel.' },
      { q: 'Vilka teman finns det?', a: '6 emoji-teman: Djur, Mat, Natur, Resor, Sport och Flaggor. Plus 3 spelplansstorlekar (3×4, 4×4, 4×5).' },
      { q: 'Fungerar det på mobilen?', a: 'Ja, på alla enheter — mobil, surfplatta och dator. Direkt i webbläsaren, utan app.' },
    ]
  },
};

// ── Inject FAQPage JSON-LD ─────────────────────────────
let injected = 0;
let skipped = 0;

for (const [file, data] of Object.entries(FAQ_DATA)) {
  const filePath = path.join(SEO, file);
  if (!fs.existsSync(filePath)) {
    console.log(`⚠ ${file} not found — skipping`);
    continue;
  }

  let html = fs.readFileSync(filePath, 'utf8');

  if (html.includes('FAQPage')) {
    console.log(`⏭ ${file} already has FAQPage — skipping`);
    skipped++;
    continue;
  }

  const faqJson = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": data.faqs.map(f => ({
      "@type": "Question",
      "name": f.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": f.a
      }
    }))
  }, null, 2);

  const script = `\n<script type="application/ld+json">\n${faqJson}\n</script>`;

  // Inject before </head>
  html = html.replace('</head>', script + '\n</head>');

  fs.writeFileSync(filePath, html, 'utf8');
  console.log(`✓ ${file} (${data.lang}) — ${data.faqs.length} FAQs added`);
  injected++;
}

console.log(`\nDone: ${injected} pages updated, ${skipped} skipped.`);
