/* =========================================================
   Jhon Note · JHON338
   Aplikasi catatan PWA — storage permanen di localStorage
   ========================================================= */
'use strict';

/* ---------- Konstanta ---------- */
const LS_KEY = 'jhonnote_notes_v1';
const TRASH_DAYS = 30;
const DAY_MS = 86400000;

/* ---------- Helper DOM ---------- */
const $  = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

/* ---------- Data ---------- */
let notes = load();
let filter = '';
const shownPass = new Set();   // id catatan yang passwordnya sedang terlihat
let editId = null;
let pendingConfirm = null;
let deferredPrompt = null;

/* ---------- SVG icons ---------- */
const SVG = {
  copy: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 9V4l1-2V1h-10v1l1 2v5l-2 2v1h5.5v6h1v-6H18v-1l-2-2z"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>',
  del: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM8.46 11.88l1.41-1.41L12 12.59l2.12-2.12 1.41 1.41L13.41 14l2.12 2.12-1.41 1.41L12 15.41l-2.12 2.12-1.41-1.41L10.59 14l-2.13-2.12zM15.5 4l-1-1h-5l-1 1H5v2h14V4z"/></svg>',
  restore: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>',
  eyeOn: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>',
  eyeOff: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/></svg>',
  calendar: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg>'
};

/* =========================================================
   UTIL
   ========================================================= */
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

function load() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; }
  catch (e) { return []; }
}

function save() {
  try { localStorage.setItem(LS_KEY, JSON.stringify(notes)); }
  catch (e) { toast('Gagal menyimpan: penyimpanan penuh'); }
}

function getById(id) { return notes.find(n => n.id === id); }

function fmtDateTime(ts) {
  const d = new Date(ts);
  const datePart = d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const timePart = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  return { datePart, timePart, full: datePart + ', ' + timePart };
}

function detectType(s) {
  if (!s) return { type: 'text', label: 'Umum' };
  const v = String(s).trim();
  if (v.includes('@') && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return { type: 'email', label: 'Email' };
  if (/^(https?:\/\/|www\.)/i.test(v) && /\.[a-z]{2,}/i.test(v)) return { type: 'link', label: 'Link' };
  const digits = v.replace(/[^0-9+]/g, '');
  if (/^\+?[0-9]{7,15}$/.test(digits)) return { type: 'phone', label: 'Telepon' };
  return { type: 'text', label: 'Umum' };
}

function leadBadge(type) {
  if (type === 'email') return 'b-email';
  if (type === 'phone') return 'b-phone';
  if (type === 'link')  return 'b-link';
  return 'b-text';
}

function maskPass(pw) { return '•'.repeat(Math.max(1, Math.min(pw.length, 24))); }

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* =========================================================
   NAVIGASI & SCREENS
   ========================================================= */
function showScreen(id) {
  $$('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(id);
  el && el.classList.add('active');
  window.scrollTo({ top: 0 });
}

function goMain()   { render(); showScreen('screen-main'); }
function goTrash()  { renderTrash(); showScreen('screen-trash'); }
function goForm()   { openForm(null); }

/* =========================================================
   COPY TO CLIPBOARD
   ========================================================= */
function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text);
  }
  return new Promise((resolve, reject) => {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); resolve(); }
    catch (e) { reject(e); }
    document.body.removeChild(ta);
  });
}

/* =========================================================
   TOAST
   ========================================================= */
let toastTimer = null;
function toast(msg, icon) {
  const el = $('#toast');
  el.innerHTML = (icon ? '<span class="t">' + icon + ' </span>' : '') + escapeHtml(msg);
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

/* =========================================================
   KONFIRMASI MODAL
   ========================================================= */
function confirmModal(title, msg, okLabel, onOk, danger) {
  $('#modal-title').textContent = title;
  $('#modal-msg').innerHTML = msg;
  const ok = $('#modal-ok');
  ok.textContent = okLabel || 'Ya';
  ok.className = 'btn ' + (danger === false ? 'btn-primary' : 'btn-danger');
  pendingConfirm = onOk;
  $('#modal').hidden = false;
  document.body.classList.add('no-scroll');
}

$('#modal-cancel').addEventListener('click', closeModal);
$('#modal-ok').addEventListener('click', () => {
  const fn = pendingConfirm;
  closeModal();
  if (fn) fn();
});
$('#modal').addEventListener('click', e => { if (e.target === $('#modal')) closeModal(); });
function closeModal() {
  pendingConfirm = null;
  $('#modal').hidden = true;
  document.body.classList.remove('no-scroll');
}

/* =========================================================
   RENDER — LIST UTAMA
   ========================================================= */
function render() {
  purgeExpired();

  let list = notes.filter(n => !n.deletedAt);
  const q = filter.trim().toLowerCase();
  if (q) {
    list = list.filter(n =>
      (n.username || '').toLowerCase().includes(q) ||
      (n.password || '').includes(q) ||
      (n.field3 || '').toLowerCase().includes(q)
    );
  }
  list.sort((a, b) => (b.pinned - a.pinned) || (b.createdAt - a.createdAt));

  const wrap = $('#note-list');
  const empty = $('#empty-state');

  $('#count-chip').textContent = list.length + (list.length === 1 ? ' catatan' : ' catatan');

  if (!list.length) {
    wrap.innerHTML = '';
    empty.hidden = false;
    $('#empty-title').textContent = q ? 'Tidak Ditemukan' : 'Belum Ada Catatan';
    $('#empty-desc').innerHTML = q
      ? 'Tidak ada catatan yang cocok dengan pencarian "<b>' + escapeHtml(filter) + '</b>".'
      : 'Klik tombol <b>+</b> untuk membuat catatan pertama kamu.';
    $('#empty-add').hidden = !!q;
    return;
  }

  empty.hidden = true;
  wrap.innerHTML = list.map(cardHTML).join('');
}

function cardHTML(n) {
  const meta = fmtDateTime(n.createdAt);
  const masked = !shownPass.has(n.id);
  const d3 = detectType(n.field3);

  const fSec3 =
    n.field3 !== '' ?
      `<div class="field">
         <span class="lead ${leadBadge(d3.type)}">
           <svg viewBox="0 0 24 24" fill="currentColor"><path d="${d3.type==='email'?'M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z':d3.type==='phone'?'M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z':d3.type==='link'?'M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z':'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'}"/></svg>
         </span>
         <div class="fval wrap">
           <div class="field-label">${d3.label}</div>
           <div class="field-sub mono">${escapeHtml(n.field3)}</div>
         </div>
         <button class="copy-btn" type="button" data-act="copy" data-id="${n.id}" data-copy="field3" title="Salin ${d3.label}" aria-label="Salin">${SVG.copy}</button>
       </div>` : '';

  const fSecP =
    n.password !== '' ?
      `<div class="field">
         <span class="lead b-key"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/></svg></span>
         <div class="fval wrap">
           <div class="field-label">Password</div>
           <div class="field-sub mono mask">${masked ? maskPass(n.password) : escapeHtml(n.password)}</div>
         </div>
         <button class="eye-btn ${masked ? '' : 'on'}" type="button" data-act="eye" data-id="${n.id}" title="${masked ? 'Lihat' : 'Sembunyikan'}" aria-label="Tampil/sembunyikan">${masked ? SVG.eyeOn : SVG.eyeOff}</button>
         <button class="copy-btn" type="button" data-act="copy" data-id="${n.id}" data-copy="password" title="Salin password" aria-label="Salin password">${SVG.copy}</button>
       </div>` : '';

  const fSecU =
    n.username !== '' ?
      `<div class="field">
         <span class="lead b-user"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg></span>
         <div class="fval wrap">
           <div class="field-label">Username / Akun</div>
           <div class="field-sub">${escapeHtml(n.username)}</div>
         </div>
         <button class="copy-btn" type="button" data-act="copy" data-id="${n.id}" data-copy="username" title="Salin username" aria-label="Salin">${SVG.copy}</button>
       </div>` : '';

  const metaRow =
    `<div class="note-meta">
       ${SVG.calendar}
       <time datetime="${new Date(n.createdAt).toISOString()}">${escapeHtml(meta.datePart)}</time>
       <span>·</span>
       ${SVG.clock}
       <time>${escapeHtml(meta.timePart)}</time>
     </div>`;

  const pinned = n.pinned ? 'pinned' : '';

  return `
  <article class="note-card ${pinned}" data-id="${n.id}">
    <div class="note-pin-ribbon">
      <button class="act-btn act-pin ${n.pinned ? 'on' : ''}" type="button" data-act="pin" title="${n.pinned ? 'Unpin' : 'Pin'}">
        ${SVG.pin} <span>${n.pinned ? 'Dipin' : 'Pin'}</span>
      </button>
    </div>
    ${fSecU || fSecP || fSec3 || '<div class="field-sub" style="color:var(--muted)">Catatan kosong akan dihapus otomatis</div>'}
    ${metaRow}
    <div class="note-actions">
      <button class="act-btn act-edit" type="button" data-act="edit">${SVG.edit} <span>Edit</span></button>
      <button class="act-btn act-trash" type="button" data-act="trash">${SVG.trash} <span>Hapus</span></button>
      <button class="act-btn act-del" type="button" data-act="del">${SVG.del} <span>Hapus Permanen</span></button>
    </div>
  </article>`;
}

/* =========================================================
   RENDER — SAMPAH
   ========================================================= */
function renderTrash() {
  purgeExpired();
  const list = notes.filter(n => n.deletedAt).sort((a, b) => a.deletedAt - b.deletedAt);
  const wrap = $('#trash-list');
  const empty = $('#trash-empty');

  if (!list.length) {
    wrap.innerHTML = '';
    empty.hidden = false;
    return;
  }
  empty.hidden = true;
  wrap.innerHTML = list.map(tcardHTML).join('');
}

function remainDays(n) {
  const left = TRASH_DAYS - Math.floor((Date.now() - n.deletedAt) / DAY_MS);
  return Math.max(0, Math.min(TRASH_DAYS, left));
}

function tcardHTML(n) {
  const meta = fmtDateTime(n.deletedAt);
  const d3 = detectType(n.field3);
  const days = remainDays(n);
  const label = days <= 0
    ? 'Menghapus sebentar lagi...'
    : (days === 1 ? 'Sisa 1 hari' : 'Sisa ' + days + ' hari');

  const preview = [n.username, n.password ? '••••••' : '', n.field3].filter(Boolean).join(' · ') || 'Catatan kosong';

  return `
  <article class="note-card" data-id="${n.id}" style="border-color:rgba(255,209,102,.25)">
    <div class="field">
      <span class="lead b-${d3.type}">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
      </span>
      <div class="fval wrap">
        <div class="field-label">${escapeHtml(d3.label)}</div>
        <div class="field-sub">${escapeHtml(preview)}</div>
      </div>
      <span class="remain-badge ${days <= 3 ? 'danger' : ''}">⏳ ${label}</span>
    </div>
    <div class="note-meta">
      ${SVG.trash}<span>Dihapus</span>
      ${SVG.calendar}<time>${escapeHtml(meta.datePart)}</time>
      <span>·</span>
      ${SVG.clock}<time>${escapeHtml(meta.timePart)}</time>
    </div>
    <div class="note-actions">
      <button class="act-btn act-restore" type="button" data-act="restore">${SVG.restore} <span>Restore</span></button>
      <button class="act-btn act-del" type="button" data-act="pdel">${SVG.del} <span>Hapus Permanen</span></button>
    </div>
  </article>`;
}

/* =========================================================
   AKSI CATATAN
   ========================================================= */
function togglePin(id) {
  const n = getById(id);
  if (!n) return;
  n.pinned = !n.pinned;
  save();
  render();
  toast(n.pinned ? 'Catatan di-pin' : 'Catatan di-unpin');
}

function toTrash(id) {
  const n = getById(id);
  if (!n) return;
  n.deletedAt = Date.now();
  n.pinned = false;
  shownPass.delete(id);
  save();
  render();
  toast('Dipindah ke Folder Sampah');
}

function permanentDelete(id) {
  notes = notes.filter(x => x.id !== id);
  shownPass.delete(id);
  save();
  render();
  renderTrash();
  toast('Dihapus permanen');
}

function restore(id) {
  const n = getById(id);
  if (!n) return;
  n.deletedAt = null;
  save();
  render();
  renderTrash();
  toast('Catatan dipulihkan');
}

function purgeExpired() {
  const now = Date.now();
  let changed = false;
  notes = notes.filter(n => {
    if (n.deletedAt && (now - n.deletedAt) > TRASH_DAYS * DAY_MS) { changed = true; return false; }
    return true;
  });
  if (changed) { save(); toast('Beberapa catatan sampah terhapus otomatis (30 hari)'); }
}

function clearTrash() {
  confirmModal('Kosongkan Sampah?', 'Semua catatan di Folder Sampah akan <b>dihapus permanen</b>. Tindakan ini tidak bisa dibatalkan.', 'Kosongkan', () => {
    notes = notes.filter(n => !n.deletedAt);
    save();
    renderTrash();
    toast('Sampah dikosongkan');
  });
}

/* =========================================================
   FORM
   ========================================================= */
const fUsername = $('#in-username');
const fPassword = $('#in-password');
const fField3   = $('#in-field3');

fUsername.addEventListener('input', updateChips);
fPassword.addEventListener('input', updateChips);
fField3.addEventListener('input', updateChips);

function openForm(n) {
  editId = n ? n.id : null;
  $('#form-title').textContent = n ? 'Edit Catatan' : 'Catatan Baru';
  fUsername.value = n ? (n.username || '') : '';
  fPassword.value = n ? (n.password || '') : '';
  fField3.value   = n ? (n.field3 || '') : '';
  fPassword.type = 'password';
  updateChips();
  showScreen('screen-form');
  setTimeout(() => fUsername.focus(), 120);
}

function updateChips() {
  // Username
  const cu = $('#chip-u');
  cu.textContent = 'Akun';

  // Field3 live detect
  const d3 = detectType(fField3.value);
  const chip3 = $('#chip3');
  chip3.textContent = d3.label === 'Umum' ? 'Umum' : d3.label;
  chip3.className = 'chip ' + d3.type;

  const lead3 = $('#lead3');
  const path = d3.type === 'email'
    ? 'M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z'
    : d3.type === 'phone'
    ? 'M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z'
    : d3.type === 'link'
    ? 'M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z'
    : 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z';
  lead3.className = 'lead ' + leadBadge(d3.type);
  lead3.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="' + path + '"/></svg>';
}

function submitForm(e) {
  e.preventDefault();
  const u = fUsername.value.trim();
  const p = fPassword.value;
  const t = fField3.value.trim();

  if (!u && !p && !t) { toast('Isi minimal satu kolom dulu!'); return; }

  if (editId) {
    const n = getById(editId);
    if (n) Object.assign(n, { username: u, password: p, field3: t });
  } else {
    notes.unshift({
      id: uid(),
      username: u,
      password: p,
      field3: t,
      pinned: false,
      createdAt: Date.now(),
      deletedAt: null
    });
  }
  save();
  goMain();
  toast('Catatan tersimpan', '✓');
}

/* =========================================================
   EVENT BINDING — LIST UTAMA (delegated)
   ========================================================= */
$('#note-list').addEventListener('click', e => {
  const btn = e.target.closest('[data-act]');
  if (!btn) return;
  const card = btn.closest('.note-card');
  const id = card && card.dataset.id;

  const act = btn.dataset.act;

  if (act === 'copy') {
    const src = getById(btn.dataset.id);
    const val = src ? src[btn.dataset.copy] : '';
    copyText(val == null ? '' : val)
      .then(() => toast('Tersalin ke clipboard', '✓'))
      .catch(() => toast('Gagal menyalin'));
    return;
  }

  if (act === 'eye' && id) {
    if (shownPass.has(id)) shownPass.delete(id); else shownPass.add(id);
    render();
    return;
  }

  if (!id) return;
  switch (act) {
    case 'pin':  togglePin(id); break;
    case 'edit': openForm(getById(id)); break;
    case 'trash':
      toTrash(id);
      break;
    case 'del':
      confirmModal('Hapus Permanen?', 'Catatan ini akan <b>langsung terhapus selamanya</b> dan tidak bisa dipulihkan dari Sampah.', 'Hapus', () => permanentDelete(id));
      break;
  }
});

/* =========================================================
   EVENT BINDING — SAMPAH (delegated)
   ========================================================= */
$('#trash-list').addEventListener('click', e => {
  const btn = e.target.closest('[data-act]');
  if (!btn) return;
  const card = btn.closest('.note-card');
  if (!card) return;
  const id = card.dataset.id;
  switch (btn.dataset.act) {
    case 'restore': restore(id); break;
    case 'pdel':
      confirmModal('Hapus Permanen?', 'Catatan akan <b>langsung terhapus selamanya</b> dan tidak bisa dipulihkan lagi.', 'Hapus', () => permanentDelete(id));
      break;
  }
});

/* =========================================================
   HEADER & FAB & NAV
   ========================================================= */
$('#btn-add').addEventListener('click', goForm);
$('#btn-trash').addEventListener('click', goTrash);
$('#btn-trash-back').addEventListener('click', goMain);
$('#btn-trash-clear').addEventListener('click', clearTrash);
$('#btn-form-back').addEventListener('click', goMain);
$('#btn-cancel').addEventListener('click', goMain);
$('#empty-add').addEventListener('click', goForm);
$('#note-form').addEventListener('submit', submitForm);

$('#search').addEventListener('input', e => {
  filter = e.target.value;
  $('#search-clear').hidden = filter.length === 0;
  render();
});
$('#search-clear').addEventListener('click', () => {
  $('#search').value = '';
  filter = '';
  $('#search-clear').hidden = true;
  render();
  $('#search').focus();
});

$('#tgl-pass').addEventListener('click', () => {
  fPassword.type = fPassword.type === 'password' ? 'text' : 'password';
});

/* =========================================================
   PWA INSTALL
   ========================================================= */
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPrompt = e;
  const btn = $('#btn-install');
  btn.hidden = false;
});

$('#btn-install').addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  try { await deferredPrompt.userChoice; } catch (err) {}
  deferredPrompt = null;
  $('#btn-install').hidden = true;
});

window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
  $('#btn-install').hidden = true;
  toast('Aplikasi berhasil di-install!', '🎉');
});

/* =========================================================
   MODAL APK
   ========================================================= */
function openApkModal() {
  const alertEl = $('#apk-alert');
  const online = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';

  const btnInstall = $('#apk-install');
  btnInstall.style.display = deferredPrompt ? '' : 'none';
  btnInstall.onclick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    try { await deferredPrompt.userChoice; } catch (err) {}
    deferredPrompt = null;
    btnInstall.style.display = 'none';
  };

  if (!online) {
    alertEl.className = 'apk-alert warn';
    alertEl.innerHTML = '⚠️ Website dibuka dari <b>file lokal</b> atau belum di-hosting.<br>Upload semua file ke hosting online (Netlify/Vercel/GitHub Pages) terlebih dahulu agar bisa dibuat APK & PWA.';
  } else {
    alertEl.className = 'apk-alert ok';
    alertEl.innerHTML = '✅ Website aktif. Buka PWABuilder, masukkan URL <code>' + escapeHtml(location.href) + '</code> lalu pilih Android → Package.';
  }
  $('#modal-apk').hidden = false;
  document.body.classList.add('no-scroll');
}

$('#btn-apk').addEventListener('click', openApkModal);
$('#apk-close').addEventListener('click', () => {
  $('#modal-apk').hidden = true;
  document.body.classList.remove('no-scroll');
});
$('#modal-apk').addEventListener('click', e => {
  if (e.target === $('#modal-apk')) {
    $('#modal-apk').hidden = true;
    document.body.classList.remove('no-scroll');
  }
});

/* =========================================================
   SERVICE WORKER
   ========================================================= */
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
  navigator.serviceWorker.register('./sw.js')
    .then(() => console.log('[PWA] Service worker registered'))
    .catch(err => console.error('[PWA] Service worker registration failed:', err));
}

/* =========================================================
   BOOT — LOADING SCREEN
   ========================================================= */
window.addEventListener('load', () => {
  purgeExpired();
  setTimeout(() => {
    const ld = $('#screen-loading');
    ld.classList.add('hide');
    setTimeout(() => {
      $('#screen-loading').style.display = 'none';
      goMain();
    }, 520);
  }, 2400);
});

/* Purge berkala + saat kembali ke tab */
setInterval(purgeExpired, 60 * 1000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) { purgeExpired(); if ($('#screen-trash').classList.contains('active')) renderTrash(); } });

/* Escape menu & tutup modal */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeModal(); $('#modal-apk').hidden = true; document.body.classList.remove('no-scroll'); }
});