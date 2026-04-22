#!/usr/bin/env node
/**
 * sync-pm.js
 * Syncs the Państwa-Miasta game engine from public/index.html into SEO pages.
 * Run with: node scripts/sync-pm.js
 *
 * Each SEO page keeps its unique <head> (title, canonical, hreflang, _forceLang)
 * and its unique footer script (_seoSetUiLang language lock + script tags).
 * Everything between <body> and the footer script block is replaced with
 * the index.html body content.
 *
 * NOTE: PM is special — the master file (index.html) is also the live Polish page
 * on the root domain. SEO pages are EN / DE / SV only.
 */

const fs   = require('fs');
const path = require('path');

const ROOT    = path.join(__dirname, '..');
const MASTER  = path.join(ROOT, 'public/index.html');
const SEO_DIR = path.join(ROOT, 'public/seo');

// Only non-PL languages — Polish stays on root /
const SEO_PAGES = [
  { file: 'countries-cities-game.html', lang: 'en' },
  { file: 'laender-und-staedte.html', lang: 'de' },
  { file: 'laender-och-staeder.html', lang: 'sv' },
];

// ── Extract game engine from master ──────────────────────────────
const master = fs.readFileSync(MASTER, 'utf8');

const bodyStart = master.indexOf('<body>');
const bodyEnd   = master.lastIndexOf('</body>');
if (bodyStart < 0 || bodyEnd < 0) {
  console.error('ERROR: Could not find <body> markers in index.html');
  process.exit(1);
}

// Game engine = everything between <body> and </body>,
// but we need to STRIP the script tags at the bottom because
// each SEO page has its own script block (with _forceLang + _seoSetUiLang).
let gameEngine = master.slice(bodyStart + '<body>'.length, bodyEnd);

// Remove the script tags from the game engine
// PM's scripts: socket.io, langs.js, shared.js, client.js
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

  // Keep: the _forceLang script + game scripts + _seoSetLang footer
  // Find the first <script> after body that sets _forceLang
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
