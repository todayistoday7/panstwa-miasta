'use strict';
// ════════════════════════════════════════════════════════
// ADMIN ROUTE
// Password-protected back office for:
//  - Translation editor (view + edit → generates updated JS files)
//  - Live room monitor
//  - Announcement banner
// ════════════════════════════════════════════════════════

const express  = require('express');
const fs       = require('fs');
const path     = require('path');
const crypto   = require('crypto');
const router   = express.Router();

const ROOT         = path.join(__dirname, '..');
const DATA_DIR     = path.join(ROOT, 'data');
const TRANS_FILE   = path.join(DATA_DIR, 'translations.json');
const BANNER_FILE  = path.join(DATA_DIR, 'banner.json');

// ─── Auth state ──────────────────────────────────────────
const sessions     = new Map(); // token → { expires }
const failTracker  = new Map(); // ip → { count, lockedUntil }
const SESSION_TTL  = 2 * 60 * 60 * 1000;  // 2 hours
const LOCK_TTL     = 15 * 60 * 1000;       // 15 min lockout
const MAX_FAILS    = 5;

function getPassword() {
  return process.env.ADMIN_PASSWORD || 'admin123';
}

function isLoggedIn(req) {
  const token = req.cookies && req.cookies.admin_token;
  if (!token) return false;
  const sess = sessions.get(token);
  if (!sess) return false;
  if (Date.now() > sess.expires) { sessions.delete(token); return false; }
  // Refresh session on activity
  sess.expires = Date.now() + SESSION_TTL;
  return true;
}

function requireAuth(req, res, next) {
  if (isLoggedIn(req)) return next();
  res.redirect('/admin/login');
}

// ─── Helpers ─────────────────────────────────────────────
function readJSON(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (e) { return fallback; }
}

function writeJSON(file, data) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ─── Game room getters (injected via init) ────────────────
let getRooms = () => ({});

function init(roomGetters) {
  getRooms = roomGetters;
}

// ─── CSS / layout ─────────────────────────────────────────
function layout(title, body, activePage) {
  const nav = [
    ['rooms',        '🎮 Rooms',        '/admin/rooms'],
    ['translations', '🌍 Translations',  '/admin/translations'],
    ['banner',       '📢 Banner',        '/admin/banner'],
  ].map(([id, label, href]) =>
    `<a href="${href}" class="${activePage===id?'active':''}">${label}</a>`
  ).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)} — Admin</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:system-ui,sans-serif;background:#0f1117;color:#e2e8f0;min-height:100vh}
  .topbar{background:#1a1d2e;border-bottom:1px solid #2d3152;padding:0 24px;display:flex;align-items:center;gap:24px;height:52px}
  .topbar h1{font-size:15px;font-weight:700;color:#a78bfa;letter-spacing:1px;white-space:nowrap}
  .topbar nav{display:flex;gap:4px}
  .topbar nav a{padding:6px 14px;border-radius:6px;text-decoration:none;color:#94a3b8;font-size:13px;font-weight:600;transition:all .15s}
  .topbar nav a:hover{background:#2d3152;color:#e2e8f0}
  .topbar nav a.active{background:#4c1d95;color:#ddd6fe}
  .topbar .logout{margin-left:auto;font-size:12px;color:#64748b;text-decoration:none}
  .topbar .logout:hover{color:#94a3b8}
  .page{max-width:1200px;margin:0 auto;padding:28px 24px}
  h2{font-size:20px;font-weight:700;margin-bottom:20px;color:#f1f5f9}
  .card{background:#1a1d2e;border:1px solid #2d3152;border-radius:12px;padding:20px;margin-bottom:20px}
  .btn{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:8px;border:none;cursor:pointer;font-size:13px;font-weight:700;transition:all .15s}
  .btn-primary{background:#4c1d95;color:#ddd6fe}.btn-primary:hover{background:#5b21b6}
  .btn-danger{background:#7f1d1d;color:#fca5a5}.btn-danger:hover{background:#991b1b}
  .btn-success{background:#14532d;color:#86efac}.btn-success:hover{background:#166534}
  .btn-sm{padding:4px 10px;font-size:12px}
  input[type=text],input[type=password],textarea,select{background:#0f1117;border:1px solid #2d3152;color:#e2e8f0;border-radius:6px;padding:8px 10px;font-size:13px;width:100%;outline:none}
  input[type=text]:focus,input[type=password]:focus,textarea:focus{border-color:#7c3aed}
  label{display:block;font-size:12px;font-weight:700;color:#94a3b8;margin-bottom:4px;text-transform:uppercase;letter-spacing:.5px}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
  .pill{display:inline-block;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:700}
  .pill-green{background:rgba(134,239,172,.15);color:#86efac}
  .pill-blue{background:rgba(147,197,253,.15);color:#93c5fd}
  .pill-orange{background:rgba(253,186,116,.15);color:#fdba74}
  .pill-purple{background:rgba(221,214,254,.15);color:#ddd6fe}
  .pill-red{background:rgba(252,165,165,.15);color:#fca5a5}
  table{width:100%;border-collapse:collapse;font-size:13px}
  th{text-align:left;padding:8px 12px;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:.5px;border-bottom:1px solid #2d3152}
  td{padding:8px 12px;border-bottom:1px solid #1e2235;vertical-align:top}
  tr:last-child td{border-bottom:none}
  tr:hover td{background:rgba(255,255,255,.02)}
  .alert{padding:12px 16px;border-radius:8px;font-size:13px;font-weight:600;margin-bottom:16px}
  .alert-error{background:rgba(127,29,29,.3);border:1px solid #7f1d1d;color:#fca5a5}
  .alert-success{background:rgba(20,83,45,.3);border:1px solid #14532d;color:#86efac}
  .filter-bar{display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;align-items:center}
  .filter-bar input,.filter-bar select{width:auto;flex:1;min-width:140px}
  .trans-val{font-family:monospace;font-size:12px;color:#a5b4fc}
  .trans-edit{width:100%;min-height:36px;resize:vertical;font-size:12px;padding:4px 6px}
  .editing td{background:rgba(76,29,149,.08)}
  .tag{font-size:10px;padding:1px 5px;border-radius:3px;background:#2d3152;color:#94a3b8;font-weight:700}
  .room-card{background:#0f1117;border:1px solid #2d3152;border-radius:8px;padding:14px;margin-bottom:10px}
  .room-card h3{font-size:14px;font-weight:700;margin-bottom:8px;display:flex;align-items:center;gap:8px}
  .room-meta{font-size:12px;color:#64748b;display:flex;gap:16px;flex-wrap:wrap}
  .player-list{margin-top:8px;display:flex;flex-wrap:wrap;gap:6px}
  .player-chip{font-size:11px;padding:2px 8px;border-radius:12px;background:#1a1d2e;border:1px solid #2d3152;color:#94a3b8}
  .player-chip.connected{border-color:#16a34a;color:#86efac}
  #save-status{font-size:12px;color:#86efac;margin-left:12px;display:none}
</style>
</head>
<body>
<div class="topbar">
  <h1>⚙️ ADMIN</h1>
  <nav>${nav}</nav>
  <a href="/admin/logout" class="logout">Sign out</a>
</div>
<div class="page">${body}</div>
<script>
// Auto-hide alerts
document.querySelectorAll('.alert').forEach(a=>{
  setTimeout(()=>{a.style.transition='opacity .5s';a.style.opacity='0';setTimeout(()=>a.remove(),500)},4000);
});
</script>
</body></html>`;
}

// ═══════════════════════════════════════════════════════
// AUTH ROUTES
// ═══════════════════════════════════════════════════════
router.get('/login', (req, res) => {
  if (isLoggedIn(req)) return res.redirect('/admin/rooms');
  res.send(`<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Admin Login</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#0f1117;color:#e2e8f0;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:system-ui,sans-serif}
  .box{background:#1a1d2e;border:1px solid #2d3152;border-radius:16px;padding:40px;width:100%;max-width:380px}
  h1{font-size:22px;font-weight:700;color:#a78bfa;margin-bottom:8px;text-align:center}
  p{font-size:13px;color:#64748b;text-align:center;margin-bottom:28px}
  label{display:block;font-size:11px;font-weight:700;color:#94a3b8;margin-bottom:6px;text-transform:uppercase;letter-spacing:.5px}
  input{width:100%;background:#0f1117;border:1px solid #2d3152;color:#e2e8f0;border-radius:8px;padding:10px 14px;font-size:14px;outline:none;margin-bottom:16px}
  input:focus{border-color:#7c3aed}
  button{width:100%;background:#4c1d95;color:#ddd6fe;border:none;border-radius:8px;padding:11px;font-size:14px;font-weight:700;cursor:pointer}
  button:hover{background:#5b21b6}
  .err{background:rgba(127,29,29,.3);border:1px solid #7f1d1d;color:#fca5a5;padding:10px 14px;border-radius:8px;font-size:13px;margin-bottom:16px}
</style></head>
<body><div class="box">
  <h1>⚙️ Admin</h1>
  <p>panstwamiastagra.com</p>
  ${req.query.error ? '<div class="err">Wrong password. Try again.</div>' : ''}
  ${req.query.locked ? '<div class="err">Too many failed attempts. Try again in 15 minutes.</div>' : ''}
  <form method="POST" action="/admin/login">
    <label>Password</label>
    <input type="password" name="password" autofocus autocomplete="current-password" placeholder="Enter admin password"/>
    <button type="submit">Sign in →</button>
  </form>
</div></body></html>`);
});

router.post('/login', express.urlencoded({ extended: false }), (req, res) => {
  const ip = req.ip || 'unknown';
  const now = Date.now();

  // Check lockout
  const fail = failTracker.get(ip) || { count: 0, lockedUntil: 0 };
  if (fail.lockedUntil > now) {
    return res.redirect('/admin/login?locked=1');
  }

  const entered  = (req.body.password || '').trim();
  const correct  = getPassword();
  const isValid  = crypto.timingSafeEqual(
    Buffer.from(entered.padEnd(64)),
    Buffer.from(correct.padEnd(64))
  ) && entered === correct;

  if (!isValid) {
    fail.count++;
    if (fail.count >= MAX_FAILS) {
      fail.lockedUntil = now + LOCK_TTL;
      fail.count = 0;
    }
    failTracker.set(ip, fail);
    return res.redirect('/admin/login?error=1');
  }

  // Success — clear fail tracker, create session
  failTracker.delete(ip);
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { expires: now + SESSION_TTL });

  res.cookie('admin_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: SESSION_TTL,
  });
  res.redirect('/admin/rooms');
});

router.get('/logout', (req, res) => {
  const token = req.cookies && req.cookies.admin_token;
  if (token) sessions.delete(token);
  res.clearCookie('admin_token');
  res.redirect('/admin/login');
});

// ═══════════════════════════════════════════════════════
// ROOMS MONITOR
// ═══════════════════════════════════════════════════════
router.get('/rooms', requireAuth, (req, res) => {
  const allRooms = getRooms();
  const phaseColors = {
    lobby: 'blue', playing: 'green', stopped: 'orange',
    scoring: 'purple', final: 'red', drawing: 'orange',
    picking: 'orange', guessing: 'green', roundEnd: 'purple',
    writing: 'orange', voting: 'purple', reveal: 'purple',
    calculating: 'purple',
  };

  let totalRooms = 0;
  let totalPlayers = 0;
  let cards = '';

  for (const [game, rooms] of Object.entries(allRooms)) {
    for (const room of rooms) {
      totalRooms++;
      const connected = room.players.filter(p => p.connected !== false);
      totalPlayers += connected.length;
      const phase = room.state && room.state.phase || 'unknown';
      const color = phaseColors[phase] || 'blue';
      const gameNames = { pm:'Państwa-Miasta', taboo:'Forbidden Words', dots:'Dots & Boxes', hangman:'Hangman', twotruth:'2 Truths 1 Lie' };

      const playerChips = room.players.map(p =>
        `<span class="player-chip ${p.connected!==false?'connected':''}">${escapeHtml(p.name)}</span>`
      ).join('');

      cards += `<div class="room-card">
        <h3>
          <span>${gameNames[game]||game}</span>
          <span class="tag">${escapeHtml(room.code)}</span>
          <span class="pill pill-${color}">${phase}</span>
          <span class="pill pill-blue">${room.players.length} players</span>
          ${room.isPublic ? '<span class="pill pill-green">public</span>' : '<span class="pill pill-orange">private</span>'}
        </h3>
        <div class="player-list">${playerChips}</div>
      </div>`;
    }
  }

  if (!cards) cards = '<p style="color:#64748b;text-align:center;padding:40px">No active rooms right now.</p>';

  const body = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
      <h2>🎮 Live Rooms</h2>
      <div style="display:flex;gap:16px;font-size:13px;color:#94a3b8">
        <span><strong style="color:#e2e8f0">${totalRooms}</strong> rooms</span>
        <span><strong style="color:#e2e8f0">${totalPlayers}</strong> connected players</span>
        <button class="btn btn-sm" onclick="location.reload()" style="background:#1a1d2e;color:#94a3b8;border:1px solid #2d3152">↻ Refresh</button>
      </div>
    </div>
    <div id="rooms">${cards}</div>
    <script>
      // Auto-refresh every 10 seconds
      setTimeout(()=>location.reload(), 10000);
    </script>`;

  res.send(layout('Live Rooms', body, 'rooms'));
});

// ═══════════════════════════════════════════════════════
// BANNER
// ═══════════════════════════════════════════════════════
router.get('/banner', requireAuth, (req, res) => {
  const banner = readJSON(BANNER_FILE, { active: false, text: '', type: 'info' });
  const saved  = req.query.saved;

  const body = `
    <h2>📢 Announcement Banner</h2>
    ${saved ? '<div class="alert alert-success">✓ Banner saved.</div>' : ''}
    <div class="card">
      <p style="font-size:13px;color:#94a3b8;margin-bottom:20px">
        When active, this banner appears at the top of all game pages. Use it for maintenance notices, new features, or anything players should know.
      </p>
      <form method="POST" action="/admin/banner">
        <div style="margin-bottom:16px">
          <label>Banner text</label>
          <input type="text" name="text" value="${escapeHtml(banner.text)}" placeholder="e.g. Maintenance tonight at 10pm CET — save your game codes!"/>
        </div>
        <div class="grid2" style="margin-bottom:16px">
          <div>
            <label>Type</label>
            <select name="type">
              <option value="info" ${banner.type==='info'?'selected':''}>ℹ️ Info (blue)</option>
              <option value="warning" ${banner.type==='warning'?'selected':''}>⚠️ Warning (orange)</option>
              <option value="success" ${banner.type==='success'?'selected':''}>✅ Success (green)</option>
            </select>
          </div>
          <div>
            <label>Status</label>
            <select name="active">
              <option value="1" ${banner.active?'selected':''}>🟢 Active — show on all pages</option>
              <option value="0" ${!banner.active?'selected':''}>⚫ Inactive — hidden</option>
            </select>
          </div>
        </div>
        <button type="submit" class="btn btn-primary">💾 Save Banner</button>
      </form>
    </div>
    <div class="card">
      <h3 style="font-size:14px;font-weight:700;margin-bottom:12px;color:#94a3b8">Preview</h3>
      <div id="preview" style="padding:12px 16px;border-radius:8px;font-size:13px;font-weight:600;
        background:${banner.type==='warning'?'rgba(120,53,15,.3)':banner.type==='success'?'rgba(20,83,45,.3)':'rgba(29,78,216,.2)'};
        border:1px solid ${banner.type==='warning'?'#92400e':banner.type==='success'?'#14532d':'#1d4ed8'};
        color:${banner.type==='warning'?'#fbbf24':banner.type==='success'?'#86efac':'#93c5fd'};
        ${banner.active?'':'opacity:0.4'}">
        ${banner.active ? '' : '(Inactive) '}${escapeHtml(banner.text || 'No text set')}
      </div>
    </div>`;

  res.send(layout('Banner', body, 'banner'));
});

router.post('/banner', requireAuth, express.urlencoded({ extended: false }), (req, res) => {
  const banner = {
    active: req.body.active === '1',
    text:   (req.body.text || '').slice(0, 300),
    type:   ['info','warning','success'].includes(req.body.type) ? req.body.type : 'info',
  };
  writeJSON(BANNER_FILE, banner);
  res.redirect('/admin/banner?saved=1');
});

// ═══════════════════════════════════════════════════════
// TRANSLATIONS
// ═══════════════════════════════════════════════════════
const GAME_LABELS = {
  pm: 'Państwa-Miasta', taboo: 'Forbidden Words',
  dots: 'Dots & Boxes', hangman: 'Hangman', twotruth: '2 Truths 1 Lie',
};
const LANG_LABELS = { pl:'🇵🇱 PL', en:'🇬🇧 EN', de:'🇩🇪 DE', fr:'🇫🇷 FR', es:'🇪🇸 ES' };

router.get('/translations', requireAuth, (req, res) => {
  const trans  = readJSON(TRANS_FILE, {});
  const filter = req.query;
  const saved  = filter.saved;
  const error  = filter.error;

  // Build filter bar
  const games = Object.keys(trans);
  const allLangs = [...new Set(games.flatMap(g => Object.keys(trans[g]||{})))].sort();

  const gameOpts  = games.map(g =>
    `<option value="${g}" ${filter.game===g?'selected':''}>${GAME_LABELS[g]||g}</option>`).join('');
  const langOpts  = allLangs.map(l =>
    `<option value="${l}" ${filter.lang===l?'selected':''}>${LANG_LABELS[l]||l}</option>`).join('');

  // Build table rows
  let rows = '';
  let rowCount = 0;

  for (const game of games) {
    if (filter.game && filter.game !== game) continue;
    const langs = trans[game] || {};
    // Get all keys from EN as reference, fall back to PL
    const refLang = langs['en'] || langs['pl'] || {};
    const keys = Object.keys(refLang);

    for (const key of keys) {
      if (filter.search && !key.toLowerCase().includes(filter.search.toLowerCase()) &&
          !Object.values(langs).some(l => (l[key]||'').toLowerCase().includes((filter.search||'').toLowerCase()))) {
        continue;
      }

      const langCols = allLangs
        .filter(l => !filter.lang || l === filter.lang)
        .map(l => {
          if (!langs[l]) return `<td style="color:#2d3152;font-style:italic">—</td>`;
          const val = langs[l][key] || '';
          return `<td>
            <div class="trans-val" title="${escapeHtml(val)}">${escapeHtml(val.length > 80 ? val.slice(0,80)+'…' : val)}</div>
          </td>`;
        }).join('');

      rows += `<tr>
        <td><span class="tag">${escapeHtml(game)}</span></td>
        <td style="font-family:monospace;font-size:12px;color:#c4b5fd">${escapeHtml(key)}</td>
        ${langCols}
        <td>
          <a href="/admin/translations/edit?game=${encodeURIComponent(game)}&key=${encodeURIComponent(key)}"
             class="btn btn-sm btn-primary">Edit</a>
        </td>
      </tr>`;
      rowCount++;
    }
  }

  const langHeaders = allLangs
    .filter(l => !filter.lang || l === filter.lang)
    .map(l => `<th>${LANG_LABELS[l]||l}</th>`).join('');

  const body = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px">
      <h2>🌍 Translations</h2>
      <div style="display:flex;gap:8px">
        <a href="/admin/translations/export" class="btn btn-sm" style="background:#1a1d2e;color:#94a3b8;border:1px solid #2d3152;text-decoration:none">⬇ Export JSON</a>
        <a href="/admin/translations/generate" class="btn btn-sm btn-success">⚙️ Generate JS Files</a>
      </div>
    </div>
    ${saved ? '<div class="alert alert-success">✓ Translation saved.</div>' : ''}
    ${error ? `<div class="alert alert-error">✗ ${escapeHtml(error)}</div>` : ''}
    <div class="card" style="padding:14px">
      <form method="GET" action="/admin/translations">
        <div class="filter-bar">
          <select name="game" onchange="this.form.submit()">
            <option value="">All games</option>${gameOpts}
          </select>
          <select name="lang" onchange="this.form.submit()">
            <option value="">All languages</option>${langOpts}
          </select>
          <input type="text" name="search" value="${escapeHtml(filter.search||'')}" placeholder="Search key or text…" />
          <button type="submit" class="btn btn-sm btn-primary">Search</button>
          <a href="/admin/translations" class="btn btn-sm" style="background:#1a1d2e;color:#94a3b8;border:1px solid #2d3152;text-decoration:none">Clear</a>
        </div>
      </form>
    </div>
    <div class="card" style="padding:0;overflow:hidden">
      <div style="padding:12px 16px;border-bottom:1px solid #2d3152;font-size:12px;color:#64748b">
        Showing <strong style="color:#e2e8f0">${rowCount}</strong> strings
      </div>
      <div style="overflow-x:auto">
        <table>
          <thead><tr>
            <th>Game</th><th>Key</th>${langHeaders}<th></th>
          </tr></thead>
          <tbody>${rows||'<tr><td colspan="10" style="text-align:center;color:#64748b;padding:40px">No strings match your filter.</td></tr>'}</tbody>
        </table>
      </div>
    </div>`;

  res.send(layout('Translations', body, 'translations'));
});

// Edit a single key
router.get('/translations/edit', requireAuth, (req, res) => {
  const { game, key } = req.query;
  if (!game || !key) return res.redirect('/admin/translations');

  const trans = readJSON(TRANS_FILE, {});
  const langs = trans[game] || {};
  const allLangs = Object.keys(langs);
  const saved = req.query.saved;

  const fields = allLangs.map(l => {
    const val = (langs[l] || {})[key] || '';
    return `<div style="margin-bottom:14px">
      <label>${LANG_LABELS[l]||l}</label>
      <textarea name="${escapeHtml(l)}" class="trans-edit" rows="2">${escapeHtml(val)}</textarea>
    </div>`;
  }).join('');

  const body = `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
      <a href="/admin/translations?game=${encodeURIComponent(game)}" style="color:#94a3b8;text-decoration:none;font-size:20px">←</a>
      <h2>Edit: <span style="color:#a78bfa">${escapeHtml(key)}</span></h2>
      <span class="tag">${escapeHtml(GAME_LABELS[game]||game)}</span>
    </div>
    ${saved ? '<div class="alert alert-success">✓ Saved. <a href="/admin/translations/generate" style="color:#86efac">Generate JS files</a> to apply changes.</div>' : ''}
    <div class="card" style="max-width:700px">
      <form method="POST" action="/admin/translations/edit">
        <input type="hidden" name="game" value="${escapeHtml(game)}"/>
        <input type="hidden" name="key" value="${escapeHtml(key)}"/>
        ${fields}
        <div style="display:flex;gap:10px;margin-top:8px">
          <button type="submit" class="btn btn-primary">💾 Save</button>
          <a href="/admin/translations?game=${encodeURIComponent(game)}" class="btn" style="background:#1a1d2e;color:#94a3b8;border:1px solid #2d3152;text-decoration:none">Cancel</a>
        </div>
      </form>
    </div>`;

  res.send(layout(`Edit: ${key}`, body, 'translations'));
});

router.post('/translations/edit', requireAuth, express.urlencoded({ extended: false, limit: '1mb' }), (req, res) => {
  const { game, key, ...langValues } = req.body;
  if (!game || !key) return res.redirect('/admin/translations');

  try {
    const trans = readJSON(TRANS_FILE, {});
    if (!trans[game]) trans[game] = {};

    for (const [lang, val] of Object.entries(langValues)) {
      if (!trans[game][lang]) trans[game][lang] = {};
      trans[game][lang][key] = val;
    }

    writeJSON(TRANS_FILE, trans);
    res.redirect(`/admin/translations/edit?game=${encodeURIComponent(game)}&key=${encodeURIComponent(key)}&saved=1`);
  } catch (e) {
    res.redirect(`/admin/translations?error=${encodeURIComponent(e.message)}`);
  }
});

// Export JSON
router.get('/translations/export', requireAuth, (req, res) => {
  const trans = readJSON(TRANS_FILE, {});
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="translations.json"');
  res.send(JSON.stringify(trans, null, 2));
});

// Generate JS files from translations.json
router.get('/translations/generate', requireAuth, (req, res) => {
  try {
    const trans = readJSON(TRANS_FILE, {});
    const results = [];

    // For each game, update the corresponding JS file
    const gameFiles = {
      pm:       { file: 'public/js/langs.js',           var: 'LANGS' },
      taboo:    { file: 'public/js/taboo-client.js',    var: 'LANGS_TABOO' },
      dots:     { file: 'public/js/dots-client.js',     var: 'LANGS' },
      hangman:  { file: 'public/js/hangman-client.js',  var: 'LANGS' },
      twotruth: { file: 'public/js/twotruth-client.js', var: 'LANGS' },
    };

    for (const [game, { file, var: varName }] of Object.entries(gameFiles)) {
      if (!trans[game]) continue;
      const filePath = path.join(ROOT, file);
      if (!fs.existsSync(filePath)) { results.push(`✗ ${file}: not found`); continue; }

      let content = fs.readFileSync(filePath, 'utf8');
      const langs = trans[game];

      for (const [langCode, keys] of Object.entries(langs)) {
        for (const [key, val] of Object.entries(keys)) {
          // Replace the string value for this key in this language block
          // Match: key: 'old value' within the language block
          // We use a targeted replacement to avoid touching function keys
          const escaped = val.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
          // Pattern: find  key: 'anything'  and replace value
          const pattern = new RegExp(
            `((?:^|\\n)\\s{4}${key}\\s*:\\s*)'(?:[^'\\\\]|\\\\.)*'`,
            'g'
          );
          content = content.replace(pattern, `$1'${escaped}'`);
        }
      }

      fs.writeFileSync(filePath, content, 'utf8');
      results.push(`✓ ${file}`);
    }

    const body = `
      <h2>⚙️ Generate JS Files</h2>
      <div class="card">
        <p style="font-size:13px;color:#94a3b8;margin-bottom:16px">
          The following JS files were updated with your translations. Push to GitHub to deploy.
        </p>
        ${results.map(r => `<div style="font-family:monospace;font-size:13px;padding:4px 0;color:${r.startsWith('✓')?'#86efac':'#fca5a5'}">${escapeHtml(r)}</div>`).join('')}
        <div style="margin-top:20px;padding:14px;background:#0f1117;border-radius:8px;font-size:13px;color:#94a3b8;border:1px solid #2d3152">
          <strong style="color:#e2e8f0">Next step:</strong> Go to your GitHub repository, the updated JS files are ready. 
          Commit and push to deploy the changes.
        </div>
        <div style="margin-top:16px;display:flex;gap:10px">
          <a href="/admin/translations" class="btn btn-primary" style="text-decoration:none">← Back to Translations</a>
        </div>
      </div>`;

    res.send(layout('Generate JS Files', body, 'translations'));
  } catch (e) {
    res.redirect(`/admin/translations?error=${encodeURIComponent(e.message)}`);
  }
});

// ─── Default redirect ─────────────────────────────────
router.get('/', requireAuth, (req, res) => res.redirect('/admin/rooms'));

module.exports = { router, init };
