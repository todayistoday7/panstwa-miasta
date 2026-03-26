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
  if (typeof roomCode === 'undefined' || !roomCode) return;
  _copyText(roomCode);
  showToast('📋 ' + roomCode);
}

// ─── SHARE ROOM (native sheet on mobile, copy on desktop) ─────────
// gameSlug: 'taboo', 'dots', 'twotruth', or '' for PM
function shareRoom(gameSlug, titleText) {
  if (typeof roomCode === 'undefined' || !roomCode) return;
  const path = gameSlug ? '/' + gameSlug : '/';
  const url  = 'https://panstwamiastagra.com' + path + '?join=' + roomCode;
  const text = (titleText || 'Join my game!') + '\n\n' +
               'Room code: ' + roomCode + '\n' + url;

  if (navigator.share) {
    navigator.share({ title: titleText || 'Join my game!', text, url })
      .catch(() => { _copyText(url); showToast('🔗 Link copied!'); });
  } else {
    _copyText(url);
    showToast('🔗 Link copied!');
  }
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
    pl: { home:'Strona główna', games:'Wszystkie gry', rules:'Zasady gier',
          cats:'Kategorie', words:'Słowa na literę',
          sg:'Gry', sr:'Zasady', sm:'Więcej' },
    en: { home:'Home', games:'All Games', rules:'Game Rules',
          cats:'Categories', words:'Words by Letter',
          sg:'Games', sr:'Rules', sm:'More' },
    de: { home:'Startseite', games:'Alle Spiele', rules:'Spielregeln',
          cats:'Kategorien', words:'Wörter nach Buchstabe',
          sg:'Spiele', sr:'Regeln', sm:'Mehr' },
    fr: { home:'Accueil', games:'Tous les jeux', rules:'Règles',
          cats:'Catégories', words:'Mots par lettre',
          sg:'Jeux', sr:'Règles', sm:'Plus' },
    es: { home:'Inicio', games:'Todos los juegos', rules:'Reglas',
          cats:'Categorías', words:'Palabras por letra',
          sg:'Juegos', sr:'Reglas', sm:'Más' },
  };

  function getLang() {
    return (new URLSearchParams(window.location.search).get('lang')) ||
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
    var ruleBase = (lang === 'pl') ? '/jak-grac' : '/how-to-play';

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
      '<a href="/' + ql + '"><span class="gb-ico">🌍</span>Państwa-Miasta</a>' +
      '<a href="/taboo' + ql + '"><span class="gb-ico">🎭</span>Tabu / Taboo</a>' +
      '<a href="/hangman' + ql + '"><span class="gb-ico">🪢</span>Wisielec / Hangman</a>' +
      '<a href="/dots' + ql + '"><span class="gb-ico">🔵</span>Kropki i Kreski</a>' +
      '<a href="/twotruth' + ql + '"><span class="gb-ico">🤥</span>Dwie Prawdy / 2 Truths</a>' +
      '<div class="gb-div"></div>' +
      '<div class="gb-sec">' + t.sr + '</div>' +
      '<a href="' + ruleBase + '"><span class="gb-ico">📖</span>' + t.rules + '</a>' +
      '<div class="gb-div"></div>' +
      '<div class="gb-sec">' + t.sm + '</div>' +
      '<a href="/kategorie"><span class="gb-ico">📋</span>' + t.cats + '</a>' +
      '<a href="/slowa"><span class="gb-ico">🔤</span>' + t.words + '</a>';

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
  }
};
// Keep old name as alias so nothing breaks
window._footerSetLang = window._switchLang;

// ─── SITE FOOTER ─────────────────────────────────────────────────
// Injected into every game page automatically on DOMContentLoaded
(function() {
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

    var lang = (new URLSearchParams(window.location.search).get('lang')) ||
               (navigator.language || '').slice(0,2) || 'pl';

    var L = {
      pl: {
        games: 'Gry',       rules: 'Zasady gry',   about: 'O grze',
        faq: 'FAQ',         privacy: 'Prywatność', contact: 'Kontakt',
        cats: 'Kategorie',  tagline: 'Darmowe gry online dla znajomych i rodziny',
        howto_pm: 'Jak grać — Państwa-Miasta',
        howto_tabu: 'Jak grać — Tabu',
        howto_hang: 'Jak grać — Wisielec',
        howto_dots: 'Jak grać — Kropki i Kreski',
        howto_tt:   'Jak grać — Dwie Prawdy',
      },
      en: {
        games: 'Games',     rules: 'Rules',        about: 'About',
        faq: 'FAQ',         privacy: 'Privacy',    contact: 'Contact',
        cats: 'Categories', tagline: 'Free online multiplayer games for friends and family',
        howto_pm: 'How to play — Countries & Cities',
        howto_tabu: 'How to play — Taboo',
        howto_hang: 'How to play — Hangman',
        howto_dots: 'How to play — Dots & Boxes',
        howto_tt:   'How to play — 2 Truths 1 Lie',
      },
    };
    var t = L[lang] || L['en'];
    var lp = lang === 'pl' ? 'pl' : 'en';
    var ruleBase = lp === 'pl' ? '/jak-grac' : '/how-to-play';

    footer.innerHTML =
      '<div style="max-width:980px;margin:0 auto;">' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:28px;margin-bottom:28px;">' +
          '<div>' +
            '<div style="font-family:Bebas Neue,sans-serif;font-size:18px;letter-spacing:2px;color:var(--accent);margin-bottom:12px;">' + t.games + '</div>' +
            '<div style="display:flex;flex-direction:column;gap:6px;">' +
              '<a href="/?lang=' + lang + '" style="color:var(--muted);font-size:13px;font-weight:600;text-decoration:none;">🌍 Państwa-Miasta</a>' +
              '<a href="/taboo?lang=' + lang + '" style="color:var(--muted);font-size:13px;font-weight:600;text-decoration:none;">🎭 Tabu / Taboo</a>' +
              '<a href="/hangman?lang=' + lang + '" style="color:var(--muted);font-size:13px;font-weight:600;text-decoration:none;">🪢 Wisielec / Hangman</a>' +
              '<a href="/dots?lang=' + lang + '" style="color:var(--muted);font-size:13px;font-weight:600;text-decoration:none;">🔵 Kropki i Kreski</a>' +
              '<a href="/twotruth?lang=' + lang + '" style="color:var(--muted);font-size:13px;font-weight:600;text-decoration:none;">🤥 Dwie Prawdy / 2 Truths</a>' +
              '<a href="/games?lang=' + lang + '" style="color:var(--accent);font-size:13px;font-weight:700;text-decoration:none;">→ ' + t.games + '</a>' +
            '</div>' +
          '</div>' +
          '<div>' +
            '<div style="font-family:Bebas Neue,sans-serif;font-size:18px;letter-spacing:2px;color:var(--accent);margin-bottom:12px;">' + t.rules + '</div>' +
            '<div style="display:flex;flex-direction:column;gap:6px;">' +
              '<a href="' + ruleBase + '" style="color:var(--muted);font-size:13px;font-weight:600;text-decoration:none;">' + t.howto_pm + '</a>' +
              '<a href="' + (lp==='pl' ? '/jak-grac/tabu' : '/how-to-play/taboo') + '" style="color:var(--muted);font-size:13px;font-weight:600;text-decoration:none;">' + t.howto_tabu + '</a>' +
              '<a href="' + (lp==='pl' ? '/jak-grac/wisielec' : '/how-to-play/hangman') + '" style="color:var(--muted);font-size:13px;font-weight:600;text-decoration:none;">' + t.howto_hang + '</a>' +
              '<a href="' + (lp==='pl' ? '/jak-grac/kropki-i-kreski' : '/how-to-play/dots-and-boxes') + '" style="color:var(--muted);font-size:13px;font-weight:600;text-decoration:none;">' + t.howto_dots + '</a>' +
              '<a href="' + (lp==='pl' ? '/jak-grac/dwie-prawdy-jedno-klamstwo' : '/how-to-play/two-truths-one-lie') + '" style="color:var(--muted);font-size:13px;font-weight:600;text-decoration:none;">' + t.howto_tt + '</a>' +
            '</div>' +
          '</div>' +
          '<div>' +
            '<div style="font-family:Bebas Neue,sans-serif;font-size:18px;letter-spacing:2px;color:var(--accent);margin-bottom:12px;">' + t.about + '</div>' +
            '<div style="display:flex;flex-direction:column;gap:6px;">' +
              '<a href="/kategorie" style="color:var(--muted);font-size:13px;font-weight:600;text-decoration:none;">📋 ' + t.cats + '</a>' +
              '<a href="/privacy" style="color:var(--muted);font-size:13px;font-weight:600;text-decoration:none;">🔒 ' + t.privacy + '</a>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div style="border-top:1px solid var(--border);padding-top:16px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">' +
          '<span style="color:var(--muted);font-size:12px;font-weight:600;">© 2025 panstwamiastagra.com · ' + t.tagline + '</span>' +
          '<div style="display:flex;gap:8px;">' +
            (function() {
              var flagBtns = '';
              var footerLangs = (typeof LANGS !== 'undefined')
                ? Object.keys(LANGS).map(function(code) { return { code: code, label: LANGS[code].name }; })
                : [{code:'pl',label:'🇵🇱 PL'},{code:'en',label:'🇬🇧 EN'}];
              footerLangs.forEach(function(l) {
                flagBtns += '<button onclick="window._switchLang(\'' + l.code + '\')" style="background:none;border:none;color:var(--muted);font-size:12px;cursor:pointer;font-family:Nunito,sans-serif;font-weight:700;padding:0;">' + l.label + '</button>';
              });
              return flagBtns;
            }()) +
          '</div>' +
        '</div>' +
      '</div>';

    document.body.appendChild(footer);
  }

  // ─── GDPR COOKIE BANNER ────────────────────────────────────────
  function injectGDPR() {
    if (localStorage.getItem('gdpr_consent')) return;
    if (document.getElementById('gdpr-banner')) return;

    var lang = (new URLSearchParams(window.location.search).get('lang')) ||
               (navigator.language || '').slice(0,2) || 'pl';

    var texts = {
      pl: {
        msg: 'Ta strona używa plików cookie do analizy ruchu (Google Analytics). Nie sprzedajemy danych. Możesz zaakceptować lub odrzucić analitykę.',
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
