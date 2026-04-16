#!/usr/bin/env node
/**
 * sync-whoami.js
 * Syncs the Who Am I game engine from public/whoami.html into the 4 SEO pages.
 * Run with: node scripts/sync-whoami.js
 * 
 * Each SEO page keeps its unique <head> (title, canonical, hreflang, _forceLang)
 * and its unique footer script (_seoSetUiLang language lock).
 * Everything between <body> and the footer script is replaced with whoami.html body.
 */

const fs   = require('fs');
const path = require('path');

const ROOT    = path.join(__dirname, '..');
const MASTER  = path.join(ROOT, 'public/whoami.html');
const SEO_DIR = path.join(ROOT, 'public/seo');

const SEO_PAGES = [
  { file: 'kim-jestem.html', lang: 'pl' },
  { file: 'who-am-i.html',   lang: 'en' },
  { file: 'wer-bin-ich.html',lang: 'de' },
  { file: 'vem-ar-jag.html', lang: 'sv' },
];

// ── Extract game engine from master ──────────────────────────────
const master = fs.readFileSync(MASTER, 'utf8');

const bodyStart = master.indexOf('<body>');
const bodyEnd   = master.lastIndexOf('</body>');
if (bodyStart < 0 || bodyEnd < 0) {
  console.error('ERROR: Could not find <body> markers in whoami.html');
  process.exit(1);
}

// Game engine = everything between <body> and </body> (exclusive)
const gameEngine = master.slice(bodyStart + '<body>'.length, bodyEnd);

// ── Inject into each SEO page ─────────────────────────────────────
SEO_PAGES.forEach(({ file, lang }) => {
  const filePath = path.join(SEO_DIR, file);
  const seo = fs.readFileSync(filePath, 'utf8');

  // Keep: everything up to and including <body>
  const seoBodyStart = seo.indexOf('<body>');
  if (seoBodyStart < 0) {
    console.error(`ERROR: No <body> in ${file}`);
    return;
  }
  const head = seo.slice(0, seoBodyStart + '<body>'.length);

  // Keep: the _seoSetUiLang footer script + </body></html>
  // It starts with a blank line then <script> containing _seoSetUiLang
  const footerMarker = seo.indexOf('  function _seoSetUiLang');
  if (footerMarker < 0) {
    console.error(`ERROR: No _seoSetUiLang in ${file}`);
    return;
  }
  // Walk back to find the opening <script> tag before it
  const scriptOpen = seo.lastIndexOf('<script>', footerMarker);
  const footer = '\n' + seo.slice(scriptOpen);

  // Compose new file
  const newContent = head + '\n' + gameEngine + '\n' + footer;

  fs.writeFileSync(filePath, newContent, 'utf8');
  console.log(`✓ ${file} (${lang}) synced`);
});

console.log('\nDone. Verify with: node scripts/sync-whoami.js --check');
