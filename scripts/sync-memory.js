#!/usr/bin/env node
/**
 * sync-memory.js
 * Syncs the Find Pairs game engine from public/memory.html into the 4 SEO pages.
 * Run with: node scripts/sync-memory.js
 *
 * Each SEO page keeps its unique <head> (title, canonical, hreflang, _forceLang)
 * and its unique footer script (_seoSetUiLang language lock + SEO bottom content).
 * Everything between <body> and the footer script block is replaced with
 * the memory.html body content.
 */

const fs   = require('fs');
const path = require('path');

const ROOT    = path.join(__dirname, '..');
const MASTER  = path.join(ROOT, 'public/memory.html');
const SEO_DIR = path.join(ROOT, 'public/seo');

const SEO_PAGES = [
  { file: 'znajdz-pary.html',       lang: 'pl' },
  { file: 'find-pairs-online.html',  lang: 'en' },
  { file: 'paare-finden-online.html',lang: 'de' },
  { file: 'hitta-par-online.html',   lang: 'sv' },
];

// ── Extract game engine from master ──────────────────────────────
const master = fs.readFileSync(MASTER, 'utf8');

const bodyStart = master.indexOf('<body>');
const bodyEnd   = master.lastIndexOf('</body>');
if (bodyStart < 0 || bodyEnd < 0) {
  console.error('ERROR: Could not find <body> markers in memory.html');
  process.exit(1);
}

// Game engine = everything between <body> and </body>,
// but strip the script tags at the bottom because each SEO page has its own.
let gameEngine = master.slice(bodyStart + '<body>'.length, bodyEnd);

// Remove the script tags from the game engine
const scriptCutoff = gameEngine.indexOf('<script src="/socket.io/socket.io.js">');
if (scriptCutoff > 0) {
  gameEngine = gameEngine.slice(0, scriptCutoff);
}

// ── Inject into each SEO page ─────────────────────────────────────
SEO_PAGES.forEach(({ file, lang }) => {
  const filePath = path.join(SEO_DIR, file);
  if (!fs.existsSync(filePath)) {
    console.error(`ERROR: ${file} not found — create the SEO shell first`);
    return;
  }
  const seo = fs.readFileSync(filePath, 'utf8');

  // Keep: everything up to and including <body>
  const seoBodyStart = seo.indexOf('<body>');
  if (seoBodyStart < 0) {
    console.error(`ERROR: No <body> in ${file}`);
    return;
  }
  const head = seo.slice(0, seoBodyStart + '<body>'.length);

  // Keep: the _forceLang script + game scripts + _seoSetUiLang footer + SEO content
  const forceLangMarker = seo.indexOf('window._forceLang');
  if (forceLangMarker < 0) {
    console.error(`ERROR: No _forceLang in ${file}`);
    return;
  }
  // Walk back to the <script> tag before _forceLang
  const scriptOpen = seo.lastIndexOf('<script>', forceLangMarker);
  const footer = '\n' + seo.slice(scriptOpen);

  // Compose new file
  const newContent = head + '\n' + gameEngine + '\n' + footer;

  fs.writeFileSync(filePath, newContent, 'utf8');
  console.log(`✓ ${file} (${lang}) synced — ${(newContent.length / 1024).toFixed(1)} KB`);
});

console.log('\nDone. Run the dev server to test.');
