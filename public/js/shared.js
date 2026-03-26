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
              '<a href="' + ruleBase + '/tabu" style="color:var(--muted);font-size:13px;font-weight:600;text-decoration:none;">' + t.howto_tabu + '</a>' +
              '<a href="' + ruleBase + '/wisielec" style="color:var(--muted);font-size:13px;font-weight:600;text-decoration:none;">' + t.howto_hang + '</a>' +
              '<a href="' + ruleBase + '/kropki-i-kreski" style="color:var(--muted);font-size:13px;font-weight:600;text-decoration:none;">' + t.howto_dots + '</a>' +
              '<a href="' + ruleBase + '/dwie-prawdy-jedno-klamstwo" style="color:var(--muted);font-size:13px;font-weight:600;text-decoration:none;">' + t.howto_tt + '</a>' +
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
            '<a href="/?lang=pl" style="color:var(--muted);font-size:12px;text-decoration:none;">🇵🇱 PL</a>' +
            '<a href="/?lang=en" style="color:var(--muted);font-size:12px;text-decoration:none;">🇬🇧 EN</a>' +
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
