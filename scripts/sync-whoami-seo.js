#!/usr/bin/env node
/**
 * sync-whoami-seo.js
 * 
 * Syncs the game engine (body content) from whoami.html into all 4 SEO pages.
 * Only the shared game HTML is replaced — each SEO page keeps its unique:
 *   - <head> (title, meta, canonical, hreflang, _forceLang)
 *   - footer language-redirect script
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const MASTER = path.join(ROOT, 'public', 'whoami.html');
const SEO_DIR = path.join(ROOT, 'public', 'seo');

const SEO_PAGES = [
  { file: 'kim-jestem.html',   lang: 'pl' },
  { file: 'who-am-i.html',     lang: 'en' },
  { file: 'wer-bin-ich.html',  lang: 'de' },
  { file: 'vem-ar-jag.html',   lang: 'sv' },
];

// Markers that define the shared game engine block
const BODY_START_MARKER = '<body>';
const BODY_END_MARKER   = '<script src="/socket.io/socket.io.js">';

function extractGameEngine(html) {
  const start = html.indexOf(BODY_START_MARKER);
  const end   = html.indexOf(BODY_END_MARKER);
  if (start < 0) throw new Error('BODY_START_MARKER not found in master');
  if (end   < 0) throw new Error('BODY_END_MARKER not found in master');
  // Include <body> tag, exclude the scripts line (SEO page has its own)
  return html.slice(start, end);
}

function replaceGameEngine(seoHtml, newEngine) {
  const start = seoHtml.indexOf(BODY_START_MARKER);
  const end   = seoHtml.indexOf(BODY_END_MARKER);
  if (start < 0) throw new Error('BODY_START_MARKER not found in SEO page');
  if (end   < 0) throw new Error('BODY_END_MARKER not found in SEO page');
  return seoHtml.slice(0, start) + newEngine + seoHtml.slice(end);
}

// Run
const master = fs.readFileSync(MASTER, 'utf8');
const engine = extractGameEngine(master);

console.log(`Master: ${MASTER}`);
console.log(`Engine block: ${engine.length} chars\n`);

let allOk = true;
SEO_PAGES.forEach(({ file, lang }) => {
  const filePath = path.join(SEO_DIR, file);
  try {
    const original = fs.readFileSync(filePath, 'utf8');
    const updated  = replaceGameEngine(original, engine);

    // Sanity checks before writing
    if (!updated.includes('id="screen-home"'))   throw new Error('screen-home missing');
    if (!updated.includes('id="screen-lobby"'))  throw new Error('screen-lobby missing');
    if (!updated.includes('id="screen-final"'))  throw new Error('screen-final missing');
    if (!updated.includes('_forceLang'))          throw new Error('_forceLang missing');
    if (!updated.includes(`'${lang}'`))           throw new Error(`lang '${lang}' missing`);
    if (!updated.includes('whoami-client.js'))    throw new Error('whoami-client.js missing');

    fs.writeFileSync(filePath, updated, 'utf8');
    console.log(`✓ ${file} (${lang}) — updated`);
  } catch (err) {
    console.error(`✗ ${file} — ERROR: ${err.message}`);
    allOk = false;
  }
});

if (allOk) {
  console.log('\nAll SEO pages synced successfully.');
} else {
  console.error('\nSome pages failed — check errors above.');
  process.exit(1);
}
