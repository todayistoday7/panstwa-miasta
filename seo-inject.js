// ═══════════════════════════════════════════════════════
// SEO PAGE INJECTION — Option B proof of concept
// ═══════════════════════════════════════════════════════
// 
// Instead of maintaining separate SEO HTML files for each
// language, this module reads the base game HTML file and
// injects SEO-specific content (meta tags, bottom content)
// from small JSON snippet files.
//
// USAGE:
//   const seoInject = require('./seo-inject');
//   app.get('/kropki-i-kreski-online', seoInject('dots', 'pl'));
//
// SNIPPET FILES:
//   seo-snippets/dots/pl.json
//   seo-snippets/dots/en.json
//   etc.
//
// BASE GAME FILES:
//   public/dots.html  (single source of truth)
//

const fs = require('fs');
const path = require('path');

// Cache for base game HTML and snippets (cleared on restart)
const _cache = {};

function loadFile(filePath) {
  if (_cache[filePath]) return _cache[filePath];
  const content = fs.readFileSync(filePath, 'utf-8');
  _cache[filePath] = content;
  return content;
}

// Map game names to their base HTML files
const GAME_FILES = {
  dots: 'public/dots.html',
  hangman: 'public/hangman.html',
  taboo: 'public/taboo.html',
  twotruth: 'public/twotruth.html',
  whoami: 'public/whoami.html',
  memory: 'public/memory.html',
  bingo: 'public/bingo.html',
  drawing: 'public/drawing.html',
  charades: 'public/charades.html',
};

function buildSeoPage(gameName, langCode) {
  const baseDir = path.join(__dirname);
  
  // Load base game HTML
  const gameFile = path.join(baseDir, GAME_FILES[gameName]);
  if (!fs.existsSync(gameFile)) {
    throw new Error(`Game file not found: ${gameFile}`);
  }
  let html = fs.readFileSync(gameFile, 'utf-8'); // Always read fresh in dev; cache in prod if needed
  
  // Load SEO snippet
  const snippetFile = path.join(baseDir, 'seo-snippets', gameName, `${langCode}.json`);
  if (!fs.existsSync(snippetFile)) {
    throw new Error(`SEO snippet not found: ${snippetFile}`);
  }
  const seo = JSON.parse(fs.readFileSync(snippetFile, 'utf-8'));
  
  // 1. Replace <html lang="...">
  html = html.replace(/<html lang="[^"]*">/, `<html lang="${seo.htmlLang}">`);
  
  // 2. Replace <title>
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${seo.title}</title>`);
  
  // 3. Replace meta description
  html = html.replace(
    /<meta name="description" content="[^"]*">/,
    `<meta name="description" content="${seo.description}">`
  );
  
  // 4. Replace OG tags
  html = html.replace(
    /<meta property="og:title" content="[^"]*">/,
    `<meta property="og:title" content="${seo.title}">`
  );
  html = html.replace(
    /<meta property="og:description" content="[^"]*">/,
    `<meta property="og:description" content="${seo.description}">`
  );
  html = html.replace(
    /<meta property="og:url" content="[^"]*">/,
    `<meta property="og:url" content="${seo.ogUrl}">`
  );
  
  // 5. Add canonical and hreflang (replace existing or insert before </head>)
  // Remove existing canonical and hreflang
  html = html.replace(/<link rel="canonical"[^>]*>\n?/g, '');
  html = html.replace(/<link rel="alternate" hreflang[^>]*>\n?/g, '');
  
  // Build hreflang + canonical tags
  let hreflangTags = `<link rel="canonical" href="${seo.canonical}">\n`;
  for (const [lang, url] of Object.entries(seo.hreflang)) {
    hreflangTags += `<link rel="alternate" hreflang="${lang}" href="${url}">\n`;
  }
  
  // Insert before </head>
  html = html.replace('</head>', hreflangTags + '</head>');
  
  // 6. Inject _forceLang and _seoLangUrls before </body>
  const seoScripts = `
<script>window._forceLang = '${seo.lang}';</script>
<script>
window._seoLangUrls = ${JSON.stringify(seo.seoLangUrls)};
(function() {
  var _origSetUiLang = null;
  function _seoSetUiLang(code) {
    var url = window._seoLangUrls[code];
    if (url) {
      window.location.href = url;
    } else if (_origSetUiLang) {
      _origSetUiLang(code);
    }
  }
  var _attempts = 0;
  function _tryOverride() {
    if (typeof setUiLang === 'function' && setUiLang !== _seoSetUiLang) {
      _origSetUiLang = setUiLang;
      setUiLang = _seoSetUiLang;
      window.setUiLang = _seoSetUiLang;
      if (typeof buildLangBar === 'function') buildLangBar();
    } else if (_attempts++ < 20) {
      setTimeout(_tryOverride, 100);
    }
  }
  _tryOverride();
})();
</script>`;
  
  html = html.replace('</body>', seoScripts + '\n</body>');
  
  // 7. Append bottom content after </html>
  if (seo.bottomContent) {
    html += '\n' + seo.bottomContent + '\n';
  }
  
  return html;
}

// Express middleware factory
function seoInject(gameName, langCode) {
  return (req, res) => {
    try {
      const html = buildSeoPage(gameName, langCode);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
    } catch (err) {
      console.error(`SEO inject error (${gameName}/${langCode}):`, err.message);
      // Fallback: serve the base game file
      res.sendFile(path.join(__dirname, 'public', GAME_FILES[gameName]));
    }
  };
}

module.exports = seoInject;
module.exports.buildSeoPage = buildSeoPage;
