// ─── GA4 EVENT HELPER ────────────────────────────────────────────
// Safe wrapper — fires only if gtag is loaded, never throws
function _ga(event_name, params) {
  try {
    if (typeof gtag === 'function') {
      gtag('event', event_name, params || {});
    }
  } catch(e) {}
}
// ════════════════════════════════════════════════════════
// SHARED CLIENT UTILITIES
// Included in all game HTML files.
// Provides: showScreen, showError, showToast, copyRoomCode,
//           shareRoom, confirmGoHome, buildLangBar
// Each game must define: roomCode, roomState, lang, L,
//           LANGS, doGoHome(), closeConfirm()
// ════════════════════════════════════════════════════════
'use strict';

// ─── SCREEN TRANSITIONS ──────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(id);
  if (target) target.classList.add('active');
  const topNav = document.getElementById('top-nav');
  if (topNav) topNav.style.display = id === 'screen-home' ? 'none' : 'flex';
  const navCode = document.getElementById('nav-room-code');
  if (navCode && typeof roomCode !== 'undefined' && roomCode)
    navCode.textContent = roomCode;
  const navShare = document.getElementById('nav-share-btn');
  if (navShare)
    navShare.style.display =
      (typeof roomCode !== 'undefined' && roomCode && id !== 'screen-home') ? 'flex' : 'none';
}

// ─── ERROR / TOAST ────────────────────────────────────────────────
function showError(msg) {
  const box = document.getElementById('home-error');
  if (!box) return;
  box.textContent = msg; box.style.display = 'block';
  clearTimeout(box._t);
  box._t = setTimeout(() => box.style.display = 'none', 3500);
}

function clearHomeError() {
  const b = document.getElementById('home-error');
  if (b) b.style.display = 'none';
}

function showToast(msg, duration) {
  let t = document.getElementById('shared-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'shared-toast';
    t.style.cssText = [
      'position:fixed','bottom:24px','left:50%','transform:translateX(-50%)',
      'background:var(--card)','border:1px solid var(--border)','color:var(--text)',
      'padding:10px 20px','border-radius:10px','font-weight:700','font-size:14px',
      'z-index:9999','pointer-events:none','transition:opacity 0.3s',
    ].join(';');
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  t.style.display = 'block';
  clearTimeout(t._timeout);
  t._timeout = setTimeout(() => {
    t.style.opacity = '0';
    setTimeout(() => t.style.display = 'none', 300);
  }, duration || 3000);
}

// ─── ROOM CODE COPY ───────────────────────────────────────────────
function copyRoomCode() {
  // Delegates to shareRoom so all games copy the full joinable link
  if (typeof roomCode === 'undefined' || !roomCode) return;
  var gameSlug = window._gameSlug || '';
  shareRoom(gameSlug);
}

// ─── SHARE ROOM ──────────────────────────────────────────────────
// Always copies the full joinable link to clipboard.
// gameSlug: 'taboo', 'dots', 'hangman', 'twotruth', or '' for PM
function shareRoom(gameSlug, titleText) {
  if (typeof roomCode === 'undefined' || !roomCode) return;
  var currentLang = (typeof lang !== 'undefined' && lang) ||
    (new URLSearchParams(window.location.search).get('lang')) ||
    window._forceLang || 'pl';
  // On SEO pages use the current page path instead of the generic slug
  var currentPath = window.location.pathname;
  var seoSlugs = ['/kropki-i-kreski-online','/dots-and-boxes-online',
                  '/punkte-und-linien-online','/punkter-och-linjer-online',
                  '/dwie-prawdy-jedno-klamstwo','/two-truths-one-lie',
                  '/zwei-wahrheiten-eine-luege','/tva-sanningar-en-logn',
                  '/wisielec','/hangman-online',
                  '/galgenmaennchen-online','/hanga-gubbe-online',
                  '/szkicuj-i-zgaduj','/sketch-and-guess',
                  '/zeichnen-und-raten','/skissa-och-gissa',
                  '/zakazane-slowa','/forbidden-words',
                  '/verbotene-woerter','/forbjudna-ord',
                  '/korporacyjne-bingo','/corporate-bingo',
                  '/unternehmens-bingo','/foretagsbingo',
                  '/kim-jestem','/who-am-i',
                  '/wer-bin-ich','/vem-ar-jag'];
  var usePath = seoSlugs.indexOf(currentPath) >= 0
    ? currentPath
    : (gameSlug ? '/' + gameSlug : '/');
  const url  = 'https://panstwamiastagra.com' + usePath + '?join=' + roomCode + '&lang=' + currentLang;
  var copiedLabels = {pl:'🔗 Link skopiowany!', en:'🔗 Link copied!', de:'🔗 Link kopiert!'};
  var toastMsg = copiedLabels[currentLang] || copiedLabels['en'];
  _copyText(url);
  if (typeof showToast === 'function') showToast(toastMsg);
}

function _copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).catch(() => _fallbackCopy(text));
  } else {
    _fallbackCopy(text);
  }
}

function _fallbackCopy(text) {
  var ta = document.createElement('textarea');
  ta.value = text; ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0;';
  document.body.appendChild(ta); ta.focus(); ta.select();
  try { document.execCommand('copy'); } catch(e) {}
  document.body.removeChild(ta);
}

// ─── CONFIRM LEAVE MODAL ─────────────────────────────────────────
// Expects confirm-modal, confirm-title, confirm-msg, confirm-yes, confirm-no in HTML
// Games define their own L.leaveTitle, L.leaveMsg, L.confirmLeave, L.leaveYes, L.leaveNo
function confirmGoHome() {
  if (typeof roomCode === 'undefined' || !roomCode) {
    if (typeof doGoHome === 'function') doGoHome();
    return;
  }
  const inGame = typeof roomState !== 'undefined' && roomState &&
                 roomState.phase !== 'lobby' && roomState.phase !== 'final';
  const titleEl = document.getElementById('confirm-title');
  const msgEl   = document.getElementById('confirm-msg');
  const yesEl   = document.getElementById('confirm-yes');
  const noEl    = document.getElementById('confirm-no');
  if (titleEl && typeof L !== 'undefined') titleEl.textContent = L.leaveTitle  || 'Leave?';
  if (msgEl   && typeof L !== 'undefined') msgEl.textContent   = inGame ? (L.leaveMsg || 'A game is in progress.') : (L.confirmLeave || 'Leave the room?');
  if (yesEl   && typeof L !== 'undefined') yesEl.textContent   = L.leaveYes   || 'Yes, leave';
  if (noEl    && typeof L !== 'undefined') noEl.textContent    = L.leaveNo    || 'Cancel';
  const modal = document.getElementById('confirm-modal');
  if (modal) modal.style.display = 'flex';
}

function closeConfirm() {
  const modal = document.getElementById('confirm-modal');
  if (modal) modal.style.display = 'none';
}

// ─── LANG BAR BUILDER ────────────────────────────────────────────
// Expects LANGS object and setUiLang(code) to be defined by game
function buildLangBar() {
  const bar = document.getElementById('lang-bar');
  if (!bar || typeof LANGS === 'undefined') return;
  bar.innerHTML = Object.keys(LANGS).map(code =>
    '<button class="lang-btn' + (code === (typeof lang !== 'undefined' ? lang : 'en') ? ' active' : '') +
    '" onclick="setUiLang(\'' + code + '\')">' + LANGS[code].name + '</button>'
  ).join('');
}

// ─── URL JOIN CODE PRE-FILL ──────────────────────────────────────
// Call on page load — reads ?join=XXXXX and pre-fills the join code input
function prefillJoinCode() {
  const params = new URLSearchParams(window.location.search);
  const join   = params.get('join');
  if (join) {
    const el = document.getElementById('join-code');
    if (el) el.value = join.toUpperCase();
    // Scroll to join card
    const joinCard = document.getElementById('join-name');
    if (joinCard) joinCard.focus();
  }
}

// ─── ROOM VISIBILITY TOGGLE ──────────────────────────────────────
// Shared toggle for private/public rooms.
// Each game's updateSettings() must read getIsPublic() and include it.
var _isPublic = false;

function getIsPublic() { return _isPublic; }

function setVisibility(isPublic) {
  _isPublic = !!isPublic;
  var priv = document.getElementById('vis-private');
  var pub  = document.getElementById('vis-public');
  if (priv) priv.classList.toggle('active', !_isPublic);
  if (pub)  pub.classList.toggle('active',   _isPublic);

  // Show explanation hint
  var hint = document.getElementById('lbl-vis-hint');
  if (hint) {
    var lang = (new URLSearchParams(window.location.search).get('lang')) || window._forceLang || 'pl';
    var hints = {
      pl: {
        priv: '🔒 Prywatny — tylko osoby z Twoim kodem mogą dołączyć.',
        pub:  '🌐 Publiczny — każdy może zobaczyć pokój na stronie /gry i dołączyć. Świetne do poznawania nowych graczy!',
      },
      en: {
        priv: '🔒 Private — only people with your code can join.',
        pub:  '🌐 Public — anyone can see your room on the /games page and join. Great way to meet new players!',
      },
      de: {
        priv: '🔒 Privat — nur Personen mit deinem Code können beitreten.',
        pub:  '🌐 Öffentlich — jeder kann deinen Raum auf der /spiele-Seite sehen. Toll um neue Spieler zu treffen!',
      },
      sv: {
        priv: '🔒 Privat — bara personer med din kod kan gå med.',
        pub:  '🌐 Offentligt — alla kan se ditt rum på /spel-sidan och gå med. Bra sätt att möta nya spelare!',
      },
    };
    var t = hints[lang] || hints['pl'];
    hint.textContent = _isPublic ? t.pub : t.priv;
  }

  if (typeof updateSettings === 'function') updateSettings();
}

// Keep toggleVisibility as alias for backward compat (not used in new HTML)
function toggleVisibility() { setVisibility(!_isPublic); }

function initVisibilityToggle() {
  setVisibility(false); // default: private
}

// ─── GLOBAL BURGER MENU ──────────────────────────────────────────
// Injected at top of every page that loads shared.js
(function() {

  var GB_CSS =
    '.gb-wrap{margin-bottom:4px;}' +
    '.gb-topbar{display:flex;align-items:center;justify-content:space-between;' +
      'padding:10px 0 8px;border-bottom:1px solid var(--border);}' +
    '.gb-logo{display:flex;align-items:center;gap:9px;text-decoration:none;}' +
    '.gb-logo-text{font-family:Bebas Neue,sans-serif;font-size:20px;letter-spacing:2px;' +
      'background:linear-gradient(135deg,var(--accent),var(--accent2));' +
      '-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}' +
    '.gb-btn{display:flex;flex-direction:column;justify-content:center;gap:5px;' +
      'background:none;border:1px solid var(--border);border-radius:8px;' +
      'padding:7px 9px;cursor:pointer;transition:border-color 0.2s;flex-shrink:0;}' +
    '.gb-btn:hover{border-color:var(--accent);}' +
    '.gb-btn span{display:block;width:18px;height:2px;background:var(--muted);' +
      'border-radius:2px;transition:all 0.22s;}' +
    '.gb-btn.open span:nth-child(1){transform:translateY(7px) rotate(45deg);background:var(--accent);}' +
    '.gb-btn.open span:nth-child(2){opacity:0;transform:scaleX(0);}' +
    '.gb-btn.open span:nth-child(3){transform:translateY(-7px) rotate(-45deg);background:var(--accent);}' +
    '.gb-nav{display:none;flex-direction:column;background:var(--card);' +
      'border:1px solid var(--border);border-radius:14px;padding:10px;' +
      'margin-top:6px;gap:2px;animation:gbSlide 0.18s ease;}' +
    '.gb-nav.open{display:flex;}' +
    '@keyframes gbSlide{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}' +
    '.gb-sec{font-size:10px;font-weight:800;letter-spacing:2px;text-transform:uppercase;' +
      'color:var(--muted);padding:7px 10px 3px;margin-top:2px;}' +
    '.gb-sec:first-child{margin-top:0;}' +
    '.gb-nav a{display:flex;align-items:center;gap:9px;padding:8px 10px;border-radius:8px;' +
      'text-decoration:none;color:var(--text);font-size:13px;font-weight:700;transition:background 0.15s;}' +
    '.gb-nav a:hover{background:var(--surface);color:var(--accent);}' +
    '.gb-ico{font-size:17px;width:22px;text-align:center;flex-shrink:0;}' +
    '.gb-div{height:1px;background:var(--border);margin:4px 6px;}';

  var LABELS = {
    pl: { home:'Strona główna', games:'Wszystkie gry', rooms:'Aktywne pokoje', privacy:'Prywatność', bug:'🐛 Zgłoś błąd', rules:'Zasady gier',
          cats:'Kategorie', howto_drawing:'Jak grać — Szkicuj i Zgaduj', home:'Strona główna', words:'Słowa na literę',
          sg:'Gry', sr:'Zasady', sm:'Więcej',
          gpm:'Państwa-Miasta', gtaboo:'Zakazane Słowa',
          ghang:'Wisielec', gdots:'Kropki i Kreski', gtt:'Dwie Prawdy Jedno Kłamstwo', gbingo:'Korporacyjne Bingo', gdrawing:'Szkicuj i Zgaduj' },
    en: { home:'Home', games:'All Games', rooms:'Live Rooms', privacy:'Privacy', bug:'🐛 Report a Bug', rules:'Game Rules',
          cats:'Categories', words:'Words by Letter',
          sg:'Games', sr:'Rules', sm:'More',
          gpm:'Countries & Cities', gtaboo:'Forbidden Words',
          ghang:'Hangman', gdots:'Dots & Boxes', gtt:'2 Truths 1 Lie', gbingo:'Corporate Bingo', gdrawing:'Sketch & Guess' },
    de: { home:'Startseite', games:'Alle Spiele', rooms:'Aktive Räume', privacy:'Datenschutz', bug:'🐛 Fehler melden', rules:'Spielregeln',
          cats:'Kategorien', howto_drawing:'Spielregeln — Zeichnen & Raten', home:'Startseite', words:'Wörter nach Buchstabe',
          sg:'Spiele', sr:'Regeln', sm:'Mehr',
          gpm:'Länder & Städte', gtaboo:'Verbotene Wörter',
          ghang:'Galgenmännchen', gdots:'Punkte & Linien', gtt:'2 Wahrheiten 1 Lüge', gbingo:'Unternehmens-Bingo', gdrawing:'Zeichnen & Raten' },
    sv: { home:'Startsida', games:'Alla spel', rooms:'Aktiva rum', privacy:'Integritetspolicy', bug:'🐛 Rapportera fel', rules:'Spelregler',
          cats:'Kategorier', howto_drawing:'Spelregler — Skissa & Gissa', home:'Startsida', words:'Ord per bokstav',
          sg:'Spel', sr:'Regler', sm:'Mer',
          gpm:'Länder & Städer', gtaboo:'Förbjudna ord',
          ghang:'Hänga gubbe', gdots:'Punkter & Linjer', gtt:'2 Sanningar 1 Lögn', gbingo:'Företagsbingo', gdrawing:'Skissa & Gissa',
          privacy:'Integritetspolicy' },
  };

  window._gbLabels = LABELS;

  function getLang() {
    return (new URLSearchParams(window.location.search).get('lang')) ||
           (window._forceLang) ||
           (navigator.language || '').slice(0, 2) || 'pl';
  }

  function injectBurger() {
    if (document.getElementById('gb-topbar')) return;

    // Inject CSS
    if (!document.getElementById('gb-style')) {
      var st = document.createElement('style');
      st.id = 'gb-style';
      st.textContent = GB_CSS;
      document.head.appendChild(st);
    }

    var lang     = getLang();
    var t        = LABELS[lang] || LABELS['en'];
    var ql       = '?lang=' + lang;
    var ruleBase = lang === 'pl' ? '/jak-grac' :
                   lang === 'de' ? '/wie-man-spielt' :
                   lang === 'sv' ? '/hur-man-spelar' : '/how-to-play';

    // ── Build topbar ─────────────────────────────────────────────
    var topbar = document.createElement('div');
    topbar.id = 'gb-topbar';
    topbar.className = 'gb-topbar';

    // Logo
    var logo = document.createElement('a');
    logo.className = 'gb-logo';
    logo.href = '/' + ql;
    logo.innerHTML =
      '<svg viewBox="0 0 80 80" width="28" height="28" xmlns="http://www.w3.org/2000/svg">' +
        '<circle cx="40" cy="40" r="34" fill="none" stroke="#ff6b35" stroke-width="3"/>' +
        '<path d="M6 40 Q40 24 74 40" fill="none" stroke="rgba(255,107,53,0.4)" stroke-width="1.5"/>' +
        '<path d="M6 40 Q40 56 74 40" fill="none" stroke="rgba(255,107,53,0.4)" stroke-width="1.5"/>' +
        '<ellipse cx="40" cy="40" rx="17" ry="34" fill="none" stroke="rgba(255,107,53,0.4)" stroke-width="1.5"/>' +
        '<circle cx="32" cy="22" r="4" fill="#06d6a0"/>' +
        '<circle cx="55" cy="32" r="4" fill="#06d6a0"/>' +
        '<circle cx="27" cy="50" r="4" fill="#06d6a0"/>' +
      '</svg>' +
      '<span class="gb-logo-text">panstwamiastagra.com</span>';

    // Hamburger button
    var btn = document.createElement('button');
    btn.id = 'gb-toggle';
    btn.className = 'gb-btn';
    btn.setAttribute('aria-label', 'Menu');
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = '<span></span><span></span><span></span>';
    btn.onclick = function() {
      var nav    = document.getElementById('gb-nav');
      var isOpen = nav.classList.toggle('open');
      btn.classList.toggle('open', isOpen);
      btn.setAttribute('aria-expanded', String(isOpen));
    };

    topbar.appendChild(logo);
    topbar.appendChild(btn);

    // ── Build nav ────────────────────────────────────────────────
    var nav = document.createElement('nav');
    nav.id = 'gb-nav';
    nav.className = 'gb-nav';
    nav.innerHTML =
      '<div class="gb-sec">' + t.sg + '</div>' +
      '<a href="/' + ql + '"><span class="gb-ico">🏠</span>' + t.home + '</a>' +
      '<a href="/games' + ql + '"><span class="gb-ico">🎮</span>' + t.games + '</a>' +
      '<div class="gb-div"></div>' +
      '<a href="/' + ql + '"><span class="gb-ico">🌍</span>' + t.gpm + '</a>' +
      '<a href="' + (lang==='pl'?'/zakazane-slowa':lang==='de'?'/verbotene-woerter':lang==='sv'?'/forbjudna-ord':'/forbidden-words') + '"><span class="gb-ico">🎭</span>' + t.gtaboo + '</a>' +
      '<a href="' + (lang==='pl'?'/wisielec':lang==='de'?'/galgenmaennchen-online':lang==='sv'?'/hanga-gubbe-online':'/hangman-online') + '"><span class="gb-ico">🪢</span>' + t.ghang + '</a>' +
      '<a href="' + (lang==='pl'?'/kropki-i-kreski-online':lang==='de'?'/punkte-und-linien-online':lang==='sv'?'/punkter-och-linjer-online':'/dots-and-boxes-online') + '"><span class="gb-ico">🔵</span>' + t.gdots + '</a>' +
      '<a href="' + (lang==='pl'?'/dwie-prawdy-jedno-klamstwo':lang==='de'?'/zwei-wahrheiten-eine-luege':lang==='sv'?'/tva-sanningar-en-logn':'/two-truths-one-lie') + '"><span class="gb-ico">🤥</span>' + t.gtt + '</a>' +
      '<a href="' + (lang==='pl'?'/korporacyjne-bingo':lang==='de'?'/unternehmens-bingo':lang==='sv'?'/foretagsbingo':'/corporate-bingo') + '"><span class="gb-ico">🎯</span>' + (t.gbingo||'Corporate Bingo') + '</a>' +
      '<a href="' + (lang==='pl'?'/szkicuj-i-zgaduj':lang==='de'?'/zeichnen-und-raten':lang==='sv'?'/skissa-och-gissa':'/sketch-and-guess') + '"><span class="gb-ico">🎨</span>' + (t.gdrawing||'Sketch & Guess') + '</a>' +
      '<a href="/rooms' + ql + '"><span class="gb-ico">🔴</span>' + (t.rooms||'Live Rooms') + '</a>' +
      '<div class="gb-div"></div>' +
      '<div class="gb-sec">' + t.sr + '</div>' +
      '<a href="' + ruleBase + '"><span class="gb-ico">📖</span>' + t.rules + '</a>' +
      '<div class="gb-div"></div>' +
      '<a href="/privacy' + ql + '"><span class="gb-ico">🔒</span>' + t.privacy + '</a>' +
      '<a href="#" onclick="event.preventDefault();openBugModal();" style="cursor:pointer;"><span class="gb-ico">🐛</span>' + (t.bug||'Report a Bug') + '</a>';

    // ── Wrap and insert ──────────────────────────────────────────
    var wrap = document.createElement('div');
    wrap.className = 'gb-wrap';
    wrap.appendChild(topbar);
    wrap.appendChild(nav);

    var container = document.querySelector('.container');
    if (container) {
      container.insertBefore(wrap, container.firstChild);
    } else {
      document.body.insertBefore(wrap, document.body.firstChild);
    }

    // Close on outside click
    document.addEventListener('click', function(e) {
      var n = document.getElementById('gb-nav');
      var b = document.getElementById('gb-toggle');
      if (n && n.classList.contains('open') && b &&
          !n.contains(e.target) && !b.contains(e.target)) {
        n.classList.remove('open');
        b.classList.remove('open');
        b.setAttribute('aria-expanded', 'false');
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectBurger);
  } else {
    injectBurger();
  }

})();

// ─── ANNOUNCEMENT BANNER ─────────────────────────────────────────
(function() {
  function injectBanner(b) {
    if (!b || !b.active || !b.text) return;
    var cols = {
      info:    { bg:'rgba(29,78,216,.15)',  border:'#1d4ed8', text:'#93c5fd' },
      warning: { bg:'rgba(120,53,15,.15)',  border:'#92400e', text:'#fbbf24' },
      success: { bg:'rgba(20,83,45,.15)',   border:'#14532d', text:'#86efac' },
    };
    var col = cols[b.type] || cols.info;
    var el = document.createElement('div');
    el.id = 'site-banner';
    el.style.cssText = [
      'width:100%', 'padding:10px 20px', 'text-align:center',
      'font-size:13px', 'font-weight:700',
      'background:' + col.bg,
      'border-bottom:1px solid ' + col.border,
      'color:' + col.text,
      'position:relative', 'z-index:100',
    ].join(';');
    el.textContent = b.text;
    var wrap = document.querySelector('.gb-wrap') || document.querySelector('.container') || document.body;
    wrap.parentNode ? wrap.parentNode.insertBefore(el, wrap) : document.body.insertBefore(el, document.body.firstChild);
  }

  function loadBanner() {
    fetch('/api/banner')
      .then(function(r) { return r.json(); })
      .then(injectBanner)
      .catch(function() {});
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadBanner);
  } else {
    loadBanner();
  }
})();

// Unified language switcher — same behaviour everywhere.
// On game pages: calls setUiLang (translates in place + updates URL).
// On SEO/static pages: navigates to same page with new lang param.
window._switchLang = function(code) {
  if (typeof setUiLang === 'function') {
    setUiLang(code);
  } else if (typeof setLang === 'function') {
    setLang(code);
  } else {
    var url = new URL(window.location.href);
    url.searchParams.set('lang', code);
    window.location.href = url.toString();
    return;
  }
  // Rebuild burger with new language
  if (typeof window._rebuildBurger === 'function') window._rebuildBurger(code);
  // Refresh footer links and flags to match new language
  if (typeof window._refreshFooter === 'function') window._refreshFooter();
};

// Rebuild burger nav in-place when language changes
window._rebuildBurger = function(newLang) {
  var nav = document.getElementById('gb-nav');
  var logo = document.querySelector('.gb-logo');
  if (!nav) return;
  var t        = (window._gbLabels || {})[newLang] || (window._gbLabels || {})['en'] || {};
  var ql       = '?lang=' + newLang;
  var ruleBase = (newLang === 'pl') ? '/jak-grac' : '/how-to-play';
  if (!t.home) return; // labels not loaded yet
  nav.innerHTML =
    '<div class="gb-sec">' + t.sg + '</div>' +
    '<a href="/' + ql + '"><span class="gb-ico">🏠</span>' + t.home + '</a>' +
    '<a href="/games' + ql + '"><span class="gb-ico">🎮</span>' + t.games + '</a>' +
    '<a href="/' + ql + '"><span class="gb-ico">🌍</span>' + t.gpm + '</a>' +
    '<a href="' + (lang==='pl'?'/zakazane-slowa':lang==='de'?'/verbotene-woerter':lang==='sv'?'/forbjudna-ord':'/forbidden-words') + '"><span class="gb-ico">🎭</span>' + t.gtaboo + '</a>' +
    '<a href="' + (lang==='pl'?'/wisielec':lang==='de'?'/galgenmaennchen-online':lang==='sv'?'/hanga-gubbe-online':'/hangman-online') + '"><span class="gb-ico">🪢</span>' + t.ghang + '</a>' +
    '<a href="' + (lang==='pl'?'/kropki-i-kreski-online':lang==='de'?'/punkte-und-linien-online':lang==='sv'?'/punkter-och-linjer-online':'/dots-and-boxes-online') + '"><span class="gb-ico">🔵</span>' + t.gdots + '</a>' +
    '<a href="' + (lang==='pl'?'/dwie-prawdy-jedno-klamstwo':lang==='de'?'/zwei-wahrheiten-eine-luege':lang==='sv'?'/tva-sanningar-en-logn':'/two-truths-one-lie') + '"><span class="gb-ico">🤥</span>' + t.gtt + '</a>' +
    '<div class="gb-div"></div>' +
    '<div class="gb-sec">' + t.sr + '</div>' +
    '<a href="' + ruleBase + '"><span class="gb-ico">📖</span>' + t.rules + '</a>' +
    '<div class="gb-div"></div>' +
    '<div class="gb-sec">' + t.sm + '</div>' +
    '<a href="/kategorie"><span class="gb-ico">📋</span>' + t.cats + '</a>' +
    '<a href="/slowa"><span class="gb-ico">🔤</span>' + t.words + '</a>';
  // Update logo href
  if (logo) logo.href = '/' + ql;
};
// Keep old name as alias so nothing breaks
window._footerSetLang = window._switchLang;

// Legacy — replaced by _refreshFooter
window._buildFooterLangBtns = function() {
  var el = document.getElementById('footer-lang-btns');
  if (!el) return;
  var langs = (typeof LANGS !== 'undefined')
    ? Object.keys(LANGS).map(function(code) {
        return { code: code, label: LANGS[code].name };
      })
    : [{code:'pl',label:'🇵🇱 PL'},{code:'en',label:'🇬🇧 EN'}];
  el.innerHTML = langs.map(function(l) {
    return '<button onclick="window._switchLang(\'' + l.code + '\')" ' +
      'style="background:none;border:none;color:var(--muted);font-size:12px;' +
      'cursor:pointer;font-family:Nunito,sans-serif;font-weight:700;padding:0 3px;">' +
      l.label + '</button>';
  }).join('');
};
// Run after everything is loaded

// ─── SITE FOOTER ─────────────────────────────────────────────────
// Injected into every game page automatically on DOMContentLoaded
(function() {
  function getFooterLang() {
    // Use the live page lang variable if available, else URL param, else browser lang
    if (typeof lang !== 'undefined' && lang) return lang;
    return (new URLSearchParams(window.location.search).get('lang')) ||
           (navigator.language || '').slice(0,2) || 'pl';
  }

  function buildFooterHTML(footerLang) {
    var lp = (footerLang === 'pl') ? 'pl' : (footerLang === 'de') ? 'de' : (footerLang === 'sv') ? 'sv' : 'en';
    var ruleBase   = lp === 'pl' ? '/jak-grac' :
                     lp === 'de' ? '/wie-man-spielt' :
                     lp === 'sv' ? '/hur-man-spelar' : '/how-to-play';
    var rulesLinks = lp === 'pl'
      ? { pm:      '/jak-grac',
          tabu:    '/jak-grac/tabu',
          hang:    '/jak-grac/wisielec',
          dots:    '/jak-grac/kropki-i-kreski',
          tt:      '/jak-grac/dwie-prawdy-jedno-klamstwo',
          drawing: '/jak-grac/szkicuj-i-zgaduj',
          bingo:   '/jak-grac/korporacyjne-bingo' }
      : lp === 'de'
      ? { pm:      '/wie-man-spielt',
          tabu:    '/wie-man-spielt/verbotene-woerter',
          hang:    '/wie-man-spielt/galgenmaennchen-online',
          dots:    '/wie-man-spielt/punkte-und-linien-online',
          tt:      '/wie-man-spielt/zwei-wahrheiten-eine-luege',
          drawing: '/wie-man-spielt/zeichnen-und-raten',
          bingo:   '/wie-man-spielt/unternehmens-bingo' }
      : lp === 'sv'
      ? { pm:      '/hur-man-spelar',
          tabu:    '/hur-man-spelar/forbjudna-ord',
          hang:    '/hur-man-spelar/hanga-gubbe-online',
          dots:    '/hur-man-spelar/punkter-och-linjer-online',
          tt:      '/hur-man-spelar/tva-sanningar-en-logn',
          drawing: '/hur-man-spelar/skissa-och-gissa',
          bingo:   '/hur-man-spelar/foretagsbingo' }
      : { pm:      '/how-to-play',
          tabu:    '/how-to-play/taboo',
          hang:    '/how-to-play/hangman',
          dots:    '/how-to-play/dots-and-boxes',
          tt:      '/how-to-play/two-truths-one-lie',
          drawing: '/how-to-play/sketch-and-guess',
          bingo:   '/how-to-play/corporate-bingo' };

    var L = {
      pl: { games:'Gry', rules:'Zasady gry', about:'O grze',
            cats:'Kategorie', tagline:'Darmowe gry online dla znajomych i rodziny',
            privacy:'Prywatność',
            gpm:'Państwa-Miasta', gtaboo:'Zakazane Słowa',
            ghang:'Wisielec', gdots:'Kropki i Kreski', gtt:'Dwie Prawdy Jedno Kłamstwo',
            gbingo:'Korporacyjne Bingo',
            gdrawing:'Szkicuj i Zgaduj', rooms:'Aktywne pokoje',
            howto_pm:'Jak grać — Państwa-Miasta',
            howto_tabu:'Jak grać — Zakazane Słowa',
            howto_hang:'Jak grać — Wisielec',
            howto_dots:'Jak grać — Kropki i Kreski',
            howto_tt:'Jak grać — Dwie Prawdy',
            howto_drawing:'Jak grać — Szkicuj i Zgaduj',
            howto_bingo:'Jak grać — Korporacyjne Bingo',
            home:'Strona główna', words:'Słowa na literę', bug:'🐛 Zgłoś błąd' },
      en: { games:'Games', rules:'Rules', about:'About',
            cats:'Categories', tagline:'Free online multiplayer games for friends and family',
            privacy:'Privacy',
            gpm:'Countries & Cities', gtaboo:'Forbidden Words',
            ghang:'Hangman', gdots:'Dots & Boxes', gtt:'2 Truths 1 Lie',
            gbingo:'Corporate Bingo',
            gdrawing:'Sketch & Guess', rooms:'Live Rooms',
            howto_pm:'How to play — Countries & Cities',
            howto_tabu:'How to play — Forbidden Words',
            howto_hang:'How to play — Hangman',
            howto_dots:'How to play — Dots & Boxes',
            howto_tt:'How to play — 2 Truths 1 Lie',
            howto_drawing:'How to play — Sketch & Guess',
            howto_bingo:'How to play — Corporate Bingo', home:'Home', words:'Words by letter', bug:'🐛 Report a Bug' },
      de: { games:'Spiele', rules:'Regeln', about:'Über',
            cats:'Kategorien', tagline:'Kostenlose Multiplayer-Spiele online',
            privacy:'Datenschutz',
            gpm:'Länder & Städte', gtaboo:'Verbotene Wörter',
            ghang:'Galgenmännchen', gdots:'Punkte & Linien', gtt:'2 Wahrheiten 1 Lüge',
            gbingo:'Unternehmens-Bingo',
            gdrawing:'Zeichnen & Raten', rooms:'Aktive Räume',
            howto_pm:'Spielregeln — Länder & Städte',
            howto_tabu:'Spielregeln — Verbotene Wörter',
            howto_hang:'Spielregeln — Galgenmännchen',
            howto_dots:'Spielregeln — Punkte & Linien',
            howto_tt:'Spielregeln — 2 Wahrheiten 1 Lüge',
            howto_drawing:'Spielregeln — Zeichnen & Raten',
            howto_bingo:'Spielregeln — Unternehmens-Bingo',
            words:'Wörter nach Buchstabe', bug:'🐛 Fehler melden' },
      sv: { games:'Spel', rules:'Regler', about:'Om',
            cats:'Kategorier', tagline:'Gratis multiplayer-spel online för vänner och familj',
            privacy:'Integritetspolicy',
            gpm:'Länder & Städer', gtaboo:'Förbjudna ord',
            ghang:'Hänga gubbe', gdots:'Punkter & Linjer', gtt:'2 Sanningar 1 Lögn',
            gbingo:'Företagsbingo',
            gdrawing:'Skissa & Gissa', rooms:'Aktiva rum',
            howto_pm:'Spelregler — Länder & Städer',
            howto_tabu:'Spelregler — Förbjudna ord',
            howto_hang:'Spelregler — Hänga gubbe',
            howto_dots:'Spelregler — Punkter & Linjer',
            howto_tt:'Spelregler — 2 Sanningar 1 Lögn',
            howto_drawing:'Spelregler — Skissa & Gissa',
            howto_bingo:'Spelregler — Företagsbingo',
            words:'Ord per bokstav', bug:'🐛 Rapportera fel' },
    };
    var t = L[lp] || L['en'];

    return '<div style="max-width:980px;margin:0 auto;">' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:28px;margin-bottom:28px;">' +
        '<div>' +
          '<div style="font-family:Bebas Neue,sans-serif;font-size:18px;letter-spacing:2px;color:var(--accent);margin-bottom:12px;">' + t.games + '</div>' +
          '<div style="display:flex;flex-direction:column;gap:6px;">' +
            '<a href="/?lang=' + footerLang + '" style="color:var(--muted);font-size:13px;font-weight:600;text-decoration:none;">🌍 ' + t.gpm + '</a>' +
            '<a href="' + (footerLang==='pl'?'/zakazane-slowa':footerLang==='de'?'/verbotene-woerter':footerLang==='sv'?'/forbjudna-ord':'/forbidden-words') + '" style="color:var(--muted);font-size:13px;font-weight:600;text-decoration:none;">🎭 ' + t.gtaboo + '</a>' +
            '<a href="' + (footerLang==='pl'?'/wisielec':footerLang==='de'?'/galgenmaennchen-online':footerLang==='sv'?'/hanga-gubbe-online':'/hangman-online') + '" style="color:var(--muted);font-size:13px;font-weight:600;text-decoration:none;">🪢 ' + t.ghang + '</a>' +
            '<a href="' + (footerLang==='pl'?'/kropki-i-kreski-online':footerLang==='de'?'/punkte-und-linien-online':footerLang==='sv'?'/punkter-och-linjer-online':'/dots-and-boxes-online') + '" style="color:var(--muted);font-size:13px;font-weight:600;text-decoration:none;">🔵 ' + t.gdots + '</a>' +
            '<a href="' + (footerLang==='pl'?'/dwie-prawdy-jedno-klamstwo':footerLang==='de'?'/zwei-wahrheiten-eine-luege':footerLang==='sv'?'/tva-sanningar-en-logn':'/two-truths-one-lie') + '" style="color:var(--muted);font-size:13px;font-weight:600;text-decoration:none;">🤥 ' + t.gtt + '</a>' +
            '<a href="' + (footerLang==='pl'?'/korporacyjne-bingo':footerLang==='de'?'/unternehmens-bingo':footerLang==='sv'?'/foretagsbingo':'/corporate-bingo') + '" style="color:var(--muted);font-size:13px;font-weight:600;text-decoration:none;">🎯 ' + (t.gbingo||'Corporate Bingo') + '</a>' +
            '<a href="' + (footerLang==='pl'?'/szkicuj-i-zgaduj':footerLang==='de'?'/zeichnen-und-raten':footerLang==='sv'?'/skissa-och-gissa':'/sketch-and-guess') + '" style="color:var(--muted);font-size:13px;font-weight:600;text-decoration:none;">🎨 ' + (t.gdrawing||'Sketch & Guess') + '</a>' +
            '<a href="/games?lang=' + footerLang + '" style="color:var(--accent);font-size:13px;font-weight:700;text-decoration:none;">→ ' + t.games + '</a>' +
            '<a href="/rooms?lang=' + footerLang + '" style="color:var(--muted);font-size:13px;font-weight:600;text-decoration:none;">🔴 ' + (t.rooms||'Live Rooms') + '</a>' +
          '</div>' +
        '</div>' +
        '<div>' +
          '<div style="font-family:Bebas Neue,sans-serif;font-size:18px;letter-spacing:2px;color:var(--accent);margin-bottom:12px;">' + t.rules + '</div>' +
          '<div style="display:flex;flex-direction:column;gap:6px;">' +
            '<a href="' + rulesLinks.pm   + '" style="color:var(--muted);font-size:13px;font-weight:600;text-decoration:none;">' + t.howto_pm   + '</a>' +
            '<a href="' + rulesLinks.tabu + '" style="color:var(--muted);font-size:13px;font-weight:600;text-decoration:none;">' + t.howto_tabu + '</a>' +
            '<a href="' + rulesLinks.hang + '" style="color:var(--muted);font-size:13px;font-weight:600;text-decoration:none;">' + t.howto_hang + '</a>' +
            '<a href="' + rulesLinks.dots + '" style="color:var(--muted);font-size:13px;font-weight:600;text-decoration:none;">' + t.howto_dots + '</a>' +
            '<a href="' + rulesLinks.tt   + '" style="color:var(--muted);font-size:13px;font-weight:600;text-decoration:none;">' + t.howto_tt   + '</a>' +
            '<a href="' + rulesLinks.drawing + '" style="color:var(--muted);font-size:13px;font-weight:600;text-decoration:none;">' + (t.howto_drawing||'How to play — Sketch & Guess') + '</a>' +
            '<a href="' + rulesLinks.bingo + '" style="color:var(--muted);font-size:13px;font-weight:600;text-decoration:none;">' + (t.howto_bingo||'How to play — Corporate Bingo') + '</a>' +
          '</div>' +
        '</div>' +
        '<div>' +
          '<div style="font-family:Bebas Neue,sans-serif;font-size:18px;letter-spacing:2px;color:var(--accent);margin-bottom:12px;">' + t.about + '</div>' +
          '<div style="display:flex;flex-direction:column;gap:6px;">' +
            '<a href="/?lang=' + footerLang + '" style="color:var(--muted);font-size:13px;font-weight:600;text-decoration:none;">🏠 ' + (t.home||'Home') + '</a>' +
            '<a href="/privacy" style="color:var(--muted);font-size:13px;font-weight:600;text-decoration:none;">🔒 ' + t.privacy + '</a>' +
            '<a href="#" onclick="event.preventDefault();if(typeof openBugModal===\'function\')openBugModal();" style="color:var(--muted);font-size:13px;font-weight:600;text-decoration:none;cursor:pointer;">' + (t.bug||'🐛 Report a Bug') + '</a>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div style="border-top:1px solid var(--border);padding-top:16px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">' +
        '<span style="color:var(--muted);font-size:12px;font-weight:600;">© 2025 panstwamiastagra.com · ' + t.tagline + '</span>' +

      '</div>' +
    '</div>';
  }

  // Rebuild footer content whenever language changes
  window._refreshFooter = function() {
    var el = document.getElementById('site-footer');
    if (el) el.innerHTML = buildFooterHTML(getFooterLang());
  };

  function injectFooter() {
    if (document.getElementById('site-footer')) return;
    var footer = document.createElement('div');
    footer.id = 'site-footer';
    footer.style.cssText = [
      'border-top:1px solid var(--border)',
      'margin-top:48px',
      'padding:32px 16px 24px',
      'background:var(--surface)',
    ].join(';');
    footer.innerHTML = buildFooterHTML(getFooterLang());
    document.body.appendChild(footer);
    // Rebuild after all scripts load so LANGS flags are correct
    window.addEventListener('load', window._refreshFooter);
  }
  // ─── GDPR COOKIE BANNER ────────────────────────────────────────
  function injectGDPR() {
    if (localStorage.getItem('gdpr_consent')) return;
    if (document.getElementById('gdpr-banner')) return;

    var lang = (new URLSearchParams(window.location.search).get('lang')) ||
               (navigator.language || '').slice(0,2) || 'pl';

    var texts = {
      pl: {
        msg: 'Ta strona używa plików cookie do analizy ruchu (Google Analytics). Nie sprzedajemy danych. <a href="/privacy" style="color:var(--accent2)">Polityka prywatności</a>. Możesz zaakceptować lub odrzucić analitykę.',
        accept: '✓ Akceptuję',
        reject: 'Odrzucam',
      },
      en: {
        msg: "This site uses cookies for traffic analytics (Google Analytics). We don't sell data. You can accept or decline analytics.",
        accept: '✓ Accept',
        reject: 'Decline',
      },
    };
    var t = texts[lang] || texts['en'];

    var banner = document.createElement('div');
    banner.id = 'gdpr-banner';
    banner.style.cssText = [
      'position:fixed', 'bottom:0', 'left:0', 'right:0',
      'background:var(--card)', 'border-top:2px solid var(--border)',
      'padding:16px 20px', 'z-index:9999',
      'display:flex', 'align-items:center', 'gap:12px', 'flex-wrap:wrap',
      'box-shadow:0 -4px 24px rgba(0,0,0,0.3)',
    ].join(';');

    banner.innerHTML =
      '<span style="flex:1;min-width:200px;font-size:13px;font-weight:600;color:var(--muted);">🍪 ' + t.msg + '</span>' +
      '<button id="gdpr-accept" style="background:linear-gradient(135deg,var(--accent),#ff8c55);color:#fff;border:none;border-radius:8px;padding:9px 20px;font-family:Nunito,sans-serif;font-weight:800;font-size:13px;cursor:pointer;white-space:nowrap;">' + t.accept + '</button>' +
      '<button id="gdpr-reject" style="background:var(--surface);border:1px solid var(--border);color:var(--muted);border-radius:8px;padding:9px 16px;font-family:Nunito,sans-serif;font-weight:700;font-size:13px;cursor:pointer;white-space:nowrap;">' + t.reject + '</button>';

    document.body.appendChild(banner);

    document.getElementById('gdpr-accept').onclick = function() {
      localStorage.setItem('gdpr_consent', 'accepted');
      banner.remove();
    };
    document.getElementById('gdpr-reject').onclick = function() {
      localStorage.setItem('gdpr_consent', 'rejected');
      // Disable GA if rejected
      window['ga-disable-G-BJ79ZM6WPQ'] = true;
      banner.remove();
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { injectFooter(); injectGDPR(); });
  } else {
    injectFooter(); injectGDPR();
  }
})();

// ─── BUG REPORT BUTTON + MODAL ───────────────────────────────────
(function() {
  var GAME_NAMES = {
    '/':          'Państwa-Miasta',
    '/taboo':     'Forbidden Words',
    '/dots':      'Dots & Boxes',
    '/hangman':   'Hangman',
    '/twotruth':  '2 Truths 1 Lie',
    '/bingo':     'Corporate Bingo',
    '/drawing':   'Sketch & Guess',
  };

  var LABELS = {
    pl: {
      btn:         '🐛',
      title:       'Zgłoś błąd',
      game:        'Gra',
      desc:        'Co się wydarzyło?',
      descHint:    'Opisz błąd jak najdokładniej...',
      email:       'Twój email (opcjonalnie)',
      emailHint:   'Jeśli chcesz otrzymać odpowiedź',
      send:        'Wyślij zgłoszenie',
      cancel:      'Anuluj',
      sending:     'Wysyłanie...',
      thanks:      '✓ Dziękujemy! Przyjrzeliśmy się temu.',
      errorShort:  'Opisz błąd bardziej szczegółowo (min. 20 znaków).',
      errorFail:   'Coś poszło nie tak. Spróbuj ponownie.',
      errorLimit:  'Za dużo zgłoszeń. Spróbuj ponownie za godzinę.',
    },
    en: {
      btn:         '🐛',
      title:       'Report a Bug',
      game:        'Game',
      desc:        'What happened?',
      descHint:    'Describe the bug as clearly as possible...',
      email:       'Your email (optional)',
      emailHint:   "If you'd like us to follow up",
      send:        'Send Report',
      cancel:      'Cancel',
      sending:     'Sending...',
      thanks:      "✓ Thanks! We'll look into it.",
      errorShort:  'Please describe the bug in more detail (min 20 characters).',
      errorFail:   'Something went wrong. Please try again.',
      errorLimit:  'Too many reports. Please try again in an hour.',
    },
    de: {
      btn:         '🐛',
      title:       'Fehler melden',
      game:        'Spiel',
      desc:        'Was ist passiert?',
      descHint:    'Beschreibe den Fehler so genau wie möglich...',
      email:       'Deine E-Mail (optional)',
      emailHint:   'Falls wir uns melden sollen',
      send:        'Bericht senden',
      cancel:      'Abbrechen',
      sending:     'Senden...',
      thanks:      '✓ Danke! Wir schauen uns das an.',
      errorShort:  'Bitte beschreibe den Fehler genauer (min. 20 Zeichen).',
      errorFail:   'Etwas ist schiefgelaufen. Bitte versuche es erneut.',
      errorLimit:  'Zu viele Meldungen. Bitte versuche es in einer Stunde erneut.',
    },
  };

  function getLang() {
    var p = new URLSearchParams(window.location.search).get('lang') || window._forceLang;
    return (p && LABELS[p]) ? p : 'pl';
  }

  function getGame() {
    var path = window.location.pathname.replace(/\/+$/, '') || '/';
    return GAME_NAMES[path] || 'Other';
  }

  function injectBugButton() {
    if (document.getElementById('bug-report-btn')) return;

    var lang = getLang();
    var t = LABELS[lang] || LABELS['pl'];

    // Modal overlay only — button is in burger menu and footer
    var overlay = document.createElement('div');
    overlay.id = 'bug-modal-overlay';
    overlay.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:9000',
      'background:rgba(0,0,0,.6)', 'display:none',
      'align-items:center', 'justify-content:center', 'padding:16px',
    ].join(';');
    overlay.onclick = function(e) {
      if (e.target === overlay) closeBugModal();
    };

    overlay.innerHTML =
      '<div style="background:var(--surface);border:1px solid var(--border);border-radius:16px;' +
        'padding:24px;width:100%;max-width:420px;font-family:Nunito,sans-serif;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">' +
          '<h3 style="font-size:16px;font-weight:800;color:var(--text);" id="bug-modal-title">' + t.title + '</h3>' +
          '<button onclick="closeBugModal()" style="background:none;border:none;color:var(--muted);' +
            'font-size:20px;cursor:pointer;padding:0 4px;">×</button>' +
        '</div>' +
        // Honeypot — hidden from humans
        '<input type="text" id="bug-honeypot" name="website" style="display:none;" tabindex="-1" autocomplete="off"/>' +
        '<label style="display:block;font-size:11px;font-weight:700;text-transform:uppercase;' +
          'letter-spacing:.5px;color:var(--muted);margin-bottom:6px;" id="bug-lbl-game">' + t.game + '</label>' +
        '<select id="bug-game" style="width:100%;background:var(--bg);border:1px solid var(--border);' +
          'color:var(--text);border-radius:8px;padding:8px 10px;font-size:13px;' +
          'font-family:Nunito,sans-serif;font-weight:700;outline:none;margin-bottom:12px;">' +
          '<option>Państwa-Miasta</option>' +
          '<option>Forbidden Words</option>' +
          '<option>Dots &amp; Boxes</option>' +
          '<option>Hangman</option>' +
          '<option>2 Truths 1 Lie</option>' +
          '<option>Corporate Bingo</option>' +
          '<option>Other</option>' +
        '</select>' +
        '<label style="display:block;font-size:11px;font-weight:700;text-transform:uppercase;' +
          'letter-spacing:.5px;color:var(--muted);margin-bottom:6px;" id="bug-lbl-desc">' + t.desc + '</label>' +
        '<textarea id="bug-desc" rows="4" placeholder="' + t.descHint + '" ' +
          'style="width:100%;background:var(--bg);border:1px solid var(--border);color:var(--text);' +
          'border-radius:8px;padding:8px 10px;font-size:13px;font-family:Nunito,sans-serif;' +
          'font-weight:600;outline:none;resize:vertical;margin-bottom:12px;"></textarea>' +
        '<label style="display:block;font-size:11px;font-weight:700;text-transform:uppercase;' +
          'letter-spacing:.5px;color:var(--muted);margin-bottom:6px;" id="bug-lbl-email">' + t.email + '</label>' +
        '<input type="email" id="bug-email" placeholder="' + t.emailHint + '" ' +
          'style="width:100%;background:var(--bg);border:1px solid var(--border);color:var(--text);' +
          'border-radius:8px;padding:8px 10px;font-size:13px;font-family:Nunito,sans-serif;' +
          'font-weight:600;outline:none;margin-bottom:16px;"/>' +
        '<div id="bug-error" style="display:none;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);' +
          'border-radius:8px;padding:8px 12px;font-size:12px;font-weight:700;color:#fca5a5;margin-bottom:12px;"></div>' +
        '<div style="display:flex;gap:10px;">' +
          '<button id="bug-submit-btn" onclick="submitBugReport()" ' +
            'style="flex:1;background:linear-gradient(135deg,var(--accent),#ff8c55);color:#fff;border:none;' +
            'border-radius:8px;padding:10px;font-size:13px;font-weight:800;cursor:pointer;' +
            'font-family:Nunito,sans-serif;" id="bug-lbl-send">' + t.send + '</button>' +
          '<button onclick="closeBugModal()" ' +
            'style="background:var(--surface);border:1px solid var(--border);color:var(--muted);' +
            'border-radius:8px;padding:10px 16px;font-size:13px;font-weight:700;cursor:pointer;' +
            'font-family:Nunito,sans-serif;" id="bug-lbl-cancel">' + t.cancel + '</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(overlay);

    // Pre-select current game
    var sel = document.getElementById('bug-game');
    if (sel) {
      var game = getGame();
      for (var i = 0; i < sel.options.length; i++) {
        if (sel.options[i].text === game) { sel.selectedIndex = i; break; }
      }
    }
  }

  window.openBugModal = function() {
    var overlay = document.getElementById('bug-modal-overlay');
    if (overlay) {
      overlay.style.display = 'flex';
      var desc = document.getElementById('bug-desc');
      if (desc) { desc.value = ''; desc.focus(); }
      var err = document.getElementById('bug-error');
      if (err) err.style.display = 'none';
      var btn = document.getElementById('bug-submit-btn');
      var lang = getLang();
      var t = LABELS[lang] || LABELS['pl'];
      if (btn) btn.textContent = t.send;
    }
  };

  window.closeBugModal = function() {
    var overlay = document.getElementById('bug-modal-overlay');
    if (overlay) overlay.style.display = 'none';
  };

  window.submitBugReport = function() {
    var lang = getLang();
    var t = LABELS[lang] || LABELS['pl'];
    var desc  = (document.getElementById('bug-desc')  || {}).value || '';
    var email = (document.getElementById('bug-email') || {}).value || '';
    var game  = (document.getElementById('bug-game')  || {}).value || getGame();
    var honey = (document.getElementById('bug-honeypot') || {}).value || '';
    var btn   = document.getElementById('bug-submit-btn');
    var err   = document.getElementById('bug-error');

    if (desc.trim().length < 20) {
      if (err) { err.textContent = t.errorShort; err.style.display = 'block'; }
      return;
    }
    if (err) err.style.display = 'none';
    if (btn) btn.textContent = t.sending;

    fetch('/api/bug-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ game: game, description: desc, email: email, website: honey }),
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.ok) {
        if (btn) btn.textContent = t.thanks;
        setTimeout(function() { window.closeBugModal(); }, 2000);
      } else {
        var msg = data.error || t.errorFail;
        if (msg.indexOf('Too many') > -1 || msg.indexOf('Za dużo') > -1) msg = t.errorLimit;
        if (err) { err.textContent = msg; err.style.display = 'block'; }
        if (btn) btn.textContent = t.send;
      }
    })
    .catch(function() {
      if (err) { err.textContent = t.errorFail; err.style.display = 'block'; }
      if (btn) btn.textContent = t.send;
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectBugButton);
  } else {
    injectBugButton();
  }
})();

