// ═══════════════════════════════════════════════════════
// BLOG STRIP — "From our blog" on the PM and RFG home pages
// Picks 4 posts from each language's blog list
// (public/blog/index.html, public/blog/pl/index.html, ...):
//   1. seasonal posts whose date window is open (SEASONS below)
//   2. new posts (published in the last 14 days)  → "New" badge
//   3. really updated posts (dateModified in the last 14 days,
//      at least 7 days after publishing)           → "Updated" badge
//   4. the rest: a weekly rotation (changes every Monday)
// Dates come from each post's datePublished / dateModified.
// Never throws: on any problem it returns an empty string.
// ═══════════════════════════════════════════════════════
'use strict';
const fs = require('fs');
const path = require('path');

const INDEX = {
  en: 'public/blog/index.html',
  pl: 'public/blog/pl/index.html',
  de: 'public/blog/de/index.html',
  sv: 'public/blog/sv/index.html',
};
const BLOG_URL = { en: '/blog', pl: '/blog/pl', de: '/blog/de', sv: '/blog/sv' };
const T = {
  pl: { title: 'Z naszego bloga', all: 'Wszystkie artykuły →', read: 'Czytaj →', isNew: 'Nowe', upd: 'Zaktualizowane' },
  en: { title: 'From our blog', all: 'All articles →', read: 'Read →', isNew: 'New', upd: 'Updated' },
  de: { title: 'Aus unserem Blog', all: 'Alle Artikel →', read: 'Lesen →', isNew: 'Neu', upd: 'Aktualisiert' },
  sv: { title: 'Från vår blogg', all: 'Alla artiklar →', read: 'Läs →', isNew: 'Ny', upd: 'Uppdaterad' },
};

// Seasonal windows: a word in the post address → [from 'MM-DD', to 'MM-DD'] (to may be in January)
const SEASONS = [
  { match: /halloween/i,                                     from: '10-01', to: '10-31' },
  { match: /andrzejk|andreasnacht|andreasafton/i,            from: '11-01', to: '11-30' },
  { match: /christmas|wigili|weihnacht|julfest/i,            from: '11-15', to: '12-26' },
  { match: /sylwester|new-year|silvester|nyar|nyarsafton/i,  from: '12-01', to: '01-01' },
  { match: /mikolajki|nikolaus|st-nicholas/i,                from: '11-20', to: '12-06' },
];

const DAY = 24 * 60 * 60 * 1000;
const _cache = {}; // lang → { mtime, posts }

function strip(html) { return String(html || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(); }
function esc(s) { return String(s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

function postDates(url) {
  try {
    const html = fs.readFileSync(path.join(__dirname, 'public', url.replace(/[?#].*$/, '') + '.html'), 'utf-8');
    const pub = /"datePublished"\s*:\s*"(\d{4}-\d{2}-\d{2})/.exec(html);
    const mod = /"dateModified"\s*:\s*"(\d{4}-\d{2}-\d{2})/.exec(html);
    return { pub: pub ? Date.parse(pub[1]) : 0, mod: mod ? Date.parse(mod[1]) : 0 };
  } catch (e) { return { pub: 0, mod: 0 }; }
}

function readList(lang) {
  const file = path.join(__dirname, INDEX[lang] || INDEX.en);
  const mtime = fs.statSync(file).mtimeMs;
  const c = _cache[lang];
  if (c && c.mtime === mtime && Date.now() - c.t < 10 * 60 * 1000) return c.posts;
  const html = fs.readFileSync(file, 'utf-8');
  const posts = [];
  const re = /<a\s+href="(\/blog\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
  let m;
  while ((m = re.exec(html))) {
    const body = m[2];
    const h2 = /<h2[^>]*>([\s\S]*?)<\/h2>/.exec(body);
    if (!h2) continue; // nav links etc.
    if (posts.some(p => p.url === m[1])) continue;
    const tag = /<span[^>]*>([\s\S]*?)<\/span>/.exec(body);
    const p = /<p[^>]*>([\s\S]*?)<\/p>/.exec(body);
    posts.push(Object.assign({ url: m[1], tag: tag ? strip(tag[1]) : '', title: strip(h2[1]), desc: p ? strip(p[1]) : '' }, postDates(m[1])));
  }
  _cache[lang] = { mtime, posts, t: Date.now() };
  return posts;
}

// Days left in the season window today, or -1 when closed
function seasonLeft(url, now) {
  const s = SEASONS.find(x => x.match.test(url));
  if (!s) return null;
  const y = now.getUTCFullYear();
  const md = d => { const [mm, dd] = d.split('-').map(Number); return [mm, dd]; };
  const [fm, fd] = md(s.from), [tm, td] = md(s.to);
  for (const fy of [y - 1, y]) {               // windows can cross New Year
    const from = Date.UTC(fy, fm - 1, fd);
    const toY = (tm < fm) ? fy + 1 : fy;
    const to = Date.UTC(toY, tm - 1, td) + DAY - 1;
    if (now.getTime() >= from && now.getTime() <= to) return Math.ceil((to - now.getTime()) / DAY);
  }
  return -1;
}

function isoWeek(d) {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day);
  const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return t.getUTCFullYear() * 100 + Math.ceil(((t - y0) / DAY + 1) / 7);
}

function pickPosts(lang, n, now) {
  try {
    n = n || 4; now = now || new Date();
    const all = readList(lang);
    const t = now.getTime();
    const out = [], used = new Set();
    const add = (p, badge) => { if (out.length < n && !used.has(p.url)) { used.add(p.url); out.push(Object.assign({}, p, { badge })); } };
    // 1. seasonal, window closing soonest first
    all.filter(p => p.pub <= t).map(p => ({ p, left: seasonLeft(p.url, now) })).filter(x => x.left !== null && x.left >= 0)
       .sort((a, b) => a.left - b.left).forEach(x => add(x.p, (t - x.p.pub) < 14 * DAY && x.p.pub <= t ? 'new' : ''));
    // 2. new
    all.filter(p => p.pub && p.pub <= t && t - p.pub < 14 * DAY).sort((a, b) => b.pub - a.pub).forEach(p => add(p, 'new'));
    // 3. really updated
    all.filter(p => p.mod && p.mod <= t && t - p.mod < 14 * DAY && p.mod - p.pub >= 7 * DAY).sort((a, b) => b.mod - a.mod).forEach(p => add(p, 'upd'));
    // 4. weekly rotation of the rest (out-of-season posts are skipped)
    const rest = all.filter(p => !used.has(p.url) && seasonLeft(p.url, now) === null);
    if (rest.length) { const off = isoWeek(now) % rest.length; for (let i = 0; i < rest.length; i++) add(rest[(off + i) % rest.length], ''); }
    return out;
  } catch (e) { return []; }
}

const CSS = `<style id="pm-blog-strip-css">
.pm-blog-strip{margin:40px auto 8px;max-width:960px;padding:26px 0 22px;background:linear-gradient(180deg,rgba(255,209,102,0.06),rgba(255,107,53,0.03));border-top:1px solid rgba(255,209,102,0.18);border-bottom:1px solid rgba(255,209,102,0.18);box-sizing:border-box;}
.pm-blog-head{display:flex;align-items:baseline;justify-content:space-between;gap:12px;padding:0 20px;margin-bottom:14px;}
.pm-blog-title{font-family:'Bebas Neue',sans-serif;font-size:26px;letter-spacing:2px;color:var(--accent2,#ffd166);margin:0;}
.pm-blog-all{font-size:13px;font-weight:800;color:var(--accent,#ff6b35);text-decoration:none;white-space:nowrap;}
.pm-blog-row{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;padding:0 20px;}
.pm-blog-card{display:flex;flex-direction:column;text-decoration:none;background:var(--card,#1c1c2a);border:1px solid var(--border,#2e2e44);border-radius:16px;padding:16px;transition:border-color .2s,transform .2s;min-width:0;}
.pm-blog-card:hover{border-color:var(--accent,#ff6b35);transform:translateY(-2px);}
.pm-blog-tags{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px;}
.pm-blog-badge{font-size:10px;font-weight:900;letter-spacing:1px;text-transform:uppercase;border-radius:20px;padding:3px 10px;color:#0b0b14;}
.pm-blog-new{background:#06d6a0;}
.pm-blog-upd{background:#ffd166;}
.pm-blog-tag{font-size:10px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:var(--accent,#ff6b35);background:rgba(255,107,53,0.1);border:1px solid rgba(255,107,53,0.3);border-radius:20px;padding:3px 10px;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.pm-blog-h{font-size:16px;font-weight:900;line-height:1.3;color:var(--text,#fff);margin:0 0 8px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;}
.pm-blog-p{font-size:13px;font-weight:600;line-height:1.55;color:var(--muted,#9a9ab0);margin:0 0 12px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;}
.pm-blog-read{margin-top:auto;font-size:13px;font-weight:800;color:var(--accent,#ff6b35);}
@media (max-width:820px){
  .pm-blog-row{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;padding:0 16px 6px;scrollbar-width:none;}
  .pm-blog-row::-webkit-scrollbar{display:none;}
  .pm-blog-card{flex:0 0 76%;scroll-snap-align:start;}
  .pm-blog-head{padding:0 16px;}
  .pm-blog-strip{margin-top:32px;}
  .pm-blog-title{font-size:20px;letter-spacing:1px;white-space:nowrap;}
  .pm-blog-all{font-size:12px;}
}
</style>`;

// One strip; attrs lets the RFG home render all 4 languages and show one
function stripHtml(lang, attrs) {
  const posts = pickPosts(lang, 4);
  if (!posts.length) return '';
  const t = T[lang] || T.en;
  return `<section class="pm-blog-strip" data-blog-lang="${lang}"${attrs || ''}>
  <div class="pm-blog-head"><h2 class="pm-blog-title">📝 ${esc(t.title)}</h2><a class="pm-blog-all" href="${BLOG_URL[lang] || '/blog'}">${esc(t.all)}</a></div>
  <div class="pm-blog-row">${posts.map(p => `
    <a class="pm-blog-card" href="${esc(p.url)}"><span class="pm-blog-tags">${p.tag ? `<span class="pm-blog-tag">${esc(p.tag)}</span>` : ''}${p.badge ? `<span class="pm-blog-badge pm-blog-${p.badge}">${esc(p.badge === 'new' ? t.isNew : t.upd)}</span>` : ''}</span><h3 class="pm-blog-h">${esc(p.title)}</h3><p class="pm-blog-p">${esc(p.desc)}</p><span class="pm-blog-read">${esc(t.read)}</span></a>`).join('')}
  </div>
</section>`;
}

// PM home: one Polish strip
function stripForLang(lang) {
  const s = stripHtml(lang);
  return s ? CSS + '\n' + s : '';
}

// RFG home: all 4 languages, the page shows the one in use
function stripAllLangs(current) {
  const parts = ['en', 'pl', 'de', 'sv'].map(l => stripHtml(l, l === current ? '' : ' style="display:none"')).filter(Boolean);
  return parts.length ? CSS + '\n' + parts.join('\n') : '';
}

module.exports = { pickPosts, stripForLang, stripAllLangs };
