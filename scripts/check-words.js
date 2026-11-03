// ═══════════════════════════════════════════════════════
// WORD LIST CHECK — runs in the GitHub test (smoke-test.js) and on its own:
//   node scripts/check-words.js
// Catches mistakes nobody can see by eye:
//   - letters from another alphabet (e.g. a Russian "а" that looks like "a"),
//     invisible characters, odd symbols
//   - the same word twice in one list
//   - a forbidden word that is the word itself (Zakazane Słowa)
// Returns a list of problems; exit code 1 when run directly and something is wrong.
// ═══════════════════════════════════════════════════════
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

// Letters we use: Latin + Polish, German, Swedish (and a few borrowed ones like é, ñ), digits, normal punctuation
const OK = /^[A-Za-z0-9ĄĆĘŁŃÓŚŹŻąćęłńóśźżÄÖÜäöüßÅåÉéÈèÊêËëÍíÎîÏïÑñÓóÔôÕõÚúÛûÇçÆæØø '’\-.,!?&()/:+"…%]+$/;

// Read an object literal like `const NAME = { ... };` from a file without running the file
function literal(file, name) {
  const s = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const i = s.indexOf(name);
  if (i < 0) throw new Error(name + ' not found in ' + file);
  const st = s.indexOf('{', i);
  let d = 0, j = st, q = null;
  for (; j < s.length; j++) {
    const c = s[j];
    if (q) { if (c === '\\') { j++; continue; } if (c === q) q = null; continue; }
    if (c === "'" || c === '"' || c === '`') { q = c; continue; }
    if (c === '/' && s[j + 1] === '/') { j = s.indexOf('\n', j); continue; }
    if (c === '{') d++;
    else if (c === '}') { d--; if (!d) break; }
  }
  return Function('"use strict"; return (' + s.slice(st, j + 1) + ');')();
}

// Real names that use a special character on purpose
const EXCEPTIONS = ['Axwell Λ Ingrosso'];

function checkList(where, list, problems, opts) {
  opts = opts || {};
  const seen = new Map();
  list.forEach(w => {
    if (typeof w !== 'string' || !w.trim()) { problems.push(where + ': empty entry'); return; }
    if (!OK.test(w) && EXCEPTIONS.indexOf(w) === -1) {
      const bad = [...w].filter(ch => !OK.test(ch)).map(ch => '"' + ch + '" (U+' + ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0') + ')').join(', ');
      problems.push(where + ': "' + w + '" has an unexpected character ' + bad);
    }
    if (w !== w.trim() || /\s{2}/.test(w)) problems.push(where + ': "' + w + '" has extra spaces');
    const k = w.toLowerCase();
    if (!opts.allowDup && seen.has(k)) problems.push(where + ': "' + w + '" appears twice');
    seen.set(k, true);
  });
}

function run() {
  const problems = [];
  const counts = {};

  // Zakazane Słowa / Forbidden Words
  const TB = literal('public/js/taboo-words.js', 'TABOO_WORDS');
  for (const l in TB) {
    checkList('Zakazane Słowa ' + l, TB[l].map(x => x.word), problems);
    TB[l].forEach(x => {
      checkList('Zakazane Słowa ' + l + ' "' + x.word + '" forbidden', x.forbidden, problems);
      x.forbidden.forEach(f => { if (f.toLowerCase() === x.word.toLowerCase()) problems.push('Zakazane Słowa ' + l + ': "' + x.word + '" has itself as a forbidden word'); });
    });
    counts['Zakazane Słowa ' + l] = TB[l].length;
  }

  // Kalambury / Charades: no repeats inside one category + language (all levels together - they add up in the game)
  const CH = literal('routes/charades.js', 'const WORDS');
  for (const cat in CH) {
    const langs = new Set(); Object.values(CH[cat]).forEach(lv => Object.keys(lv).forEach(l => langs.add(l)));
    langs.forEach(l => {
      const all = [];
      ['kids', 'family', 'adults'].forEach(lv => { if (CH[cat][lv] && CH[cat][lv][l]) all.push(...CH[cat][lv][l]); });
      checkList('Kalambury ' + cat + ' ' + l, all, problems);
    });
  }

  // Wisielec / Hangman
  const HG = literal('public/js/hangman-words.js', 'HANG_WORDS');
  for (const l in HG) { checkList('Wisielec ' + l, HG[l], problems); counts['Wisielec ' + l] = HG[l].length; }

  // Korporacyjne Bingo
  const BG = literal('routes/bingo.js', 'const PHRASES');
  for (const l in BG) checkList('Bingo ' + l, BG[l], problems);

  // Kim Jestem? / Who Am I?
  const WA = literal('routes/whoami.js', 'const CHARACTERS');
  for (const cat in WA) for (const lv in WA[cat]) {
    const list = WA[cat][lv];
    // a character only counts in the languages listed in its "langs"
    ['pl', 'en', 'de', 'sv'].forEach(l => checkList('Kim Jestem ' + cat + ' ' + lv + ' ' + l, list.filter(x => !x.langs || x.langs.indexOf(l) > -1).map(x => x[l]), problems));
  }

  return { problems, counts };
}

module.exports = run;

if (require.main === module) {
  const { problems } = run();
  if (!problems.length) { console.log('✓ Word lists OK'); process.exit(0); }
  console.log('✗ ' + problems.length + ' word list problem(s):'); problems.forEach(p => console.log('  - ' + p));
  process.exit(1);
}
