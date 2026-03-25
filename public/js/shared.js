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
