/* =========================================================
   Jhon Note · JHON338 — v3 dark night
   Aplikasi catatan PWA (localStorage permanen)
   ========================================================= */
'use strict';

const LS_KEY = 'jhonnote_notes_v2';
const LS_OLD = 'jhonnote_notes_v1';
const TRASH_DAYS = 30;
const DAY_MS = 86400000;

/* ---------- Helper DOM ---------- */
const $  = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

/* ---------- Data ---------- */
let notes = load();
let filter = '';
const shownPass = new Set();
let editId = null;
let viewId = null;
let pendingConfirm = null;
let formType = 'akun';

/* ---------- Path ikon (Material) ---------- */
const P = {
  add:    'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z',
  close:  'M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
  back:   'M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z',
  trash:  'M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z',
  del:    'M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM8.46 11.88l1.41-1.41L12 12.59l2.12-2.12 1.41 1.41L13.41 14l2.12 2.12-1.41 1.41L12 15.41l-2.12 2.12-1.41-1.41L10.59 14l-2.13-2.12zM15.5 4l-1-1h-5l-1 1H5v2h14V4z',
  restore:'M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z',
  edit:   'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z',
  pin:    'M16 9V4l1-2V1H9v1l1 2v5l-2 2v1h5.5v6h1v-6H18v-1l-2-2z',
  eye:    'M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z',
  eyeOff: 'M12 7a5 5 0 0 1 5 5c0 .65-.13 1.26-.36 1.83l2.92 2.92C20.07 15.49 21.28 13.4 22 12c-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55a5.037 5.037 0 0 0-.08 1.65c0 2.76 2.24 5 5 5 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z',
  print:  'M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z',
  share:  'M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z',
  menu:   'M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z',
  search: 'M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
  check:  'M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z',
  down:   'M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z',
  link:   'M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z',
  mail:   'M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z',
  phone:  'M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2a1.01 1.01 0 0 1 1.02-.24c1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z',
  user:   'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
  lock:   'M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z',
  note:   'M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z',
  info:   'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z'
};
const svg = d => '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="' + d + '"/></svg>';
const I = {};
for (const k in P) I[k] = svg(P[k]);

/* =========================================================
   UTIL
   ========================================================= */
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 9); }
function esc(s)   { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]); }
function escAttr(s){ return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }
function mask(pw) { const s = String(pw || ''); return '•'.repeat(Math.max(1, Math.min(s.length, 24))); }
function getById(id) { return notes.find(n => n.id === id); }
function fmtShort(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) +
         ' · ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function detectKind(s) {
  const v = String(s || '').trim();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return 'email';
  if (/^(https?:\/\/|www\.)/i.test(v) && /\.[a-z]{2,}/i.test(v)) return 'link';
  const digs = v.replace(/[^0-9+]/g, '');
  if (/^\+?[0-9]{7,15}$/.test(digs)) return 'phone';
  return 'other';
}
function kindOf(s) { const k = detectKind(s); return (k === 'email' || k === 'phone') ? k : 'other'; }

/* =========================================================
   STORAGE & MIGRASI
   ========================================================= */
function normalizeNote(n) {
  if (!n || typeof n !== 'object') return null;
  const isNew = Array.isArray(n.contacts);
  let title = '', user = '', pass = '', contacts = [], links = [], caption = '';

  if (isNew) {
    title   = String(n.title || '').trim();
    user    = String(n.user || '').trim();
    pass    = String(n.pass == null ? '' : n.pass);
    contacts = n.contacts.map(x => String(x).trim()).filter(Boolean);
    links    = n.links.map(x => String(x).trim()).filter(Boolean);
    caption  = String(n.caption || '');
  } else {
    user = String(n.username || n.user || '').trim();
    pass = String(n.password || n.pass || '');
    const f3 = String(n.field3 || '').trim();
    if (f3) { if (detectKind(f3) === 'link') links.push(f3); else contacts.push(f3); }
    title = user || contacts[0] || links[0] || 'Catatan';
  }
  if (!title) title = 'Catatan';

  return {
    id: n.id || uid(),
    title,
    type: n.type === 'full' ? 'full' : 'akun',
    user, pass, contacts, links, caption,
    pin: !!n.pin,
    time: Number(n.time || n.createdAt || Date.now()),
    trash: n.trash || n.deletedAt || null
  };
}

function load() {
  let arr = [];
  try { arr = JSON.parse(localStorage.getItem(LS_KEY)) || []; } catch (e) { arr = []; }
  if (!arr.length) { try { arr = JSON.parse(localStorage.getItem(LS_OLD)) || []; } catch (e) {} }
  return arr.map(normalizeNote).filter(Boolean);
}
function save() {
  try { localStorage.setItem(LS_KEY, JSON.stringify(notes)); }
  catch (e) { toast('Penyimpanan penuh'); }
}

/* =========================================================
   TOOLTIP (hover & tekan lama)
   ========================================================= */
const tipEl = $('#tip');
let lpTimer = null;

function placeTip(el) {
  const r = el.getBoundingClientRect();
  const w = tipEl.offsetWidth, h = tipEl.offsetHeight;
  let x = r.left + r.width / 2 - w / 2;
  let y = r.top - h - 9;
  x = Math.max(8, Math.min(x, innerWidth - w - 8));
  if (y < 8) y = r.bottom + 9;
  tipEl.style.left = x + 'px';
  tipEl.style.top = y + 'px';
}
function showTipText(t, el) {
  tipEl.textContent = t;
  tipEl.classList.add('show');
  placeTip(el);
}
document.addEventListener('pointerover', e => {
  const t = e.target.closest('[data-tip]');
  if (t) showTipText(t.dataset.tip, t);
});
document.addEventListener('pointerout', e => {
  if (e.target.closest('[data-tip]')) tipEl.classList.remove('show');
});
document.addEventListener('touchstart', e => {
  const t = e.target.closest('[data-tip]');
  if (!t) return;
  const p = e.touches[0];
  lpTimer = setTimeout(() => {
    tipEl.textContent = t.dataset.tip;
    tipEl.classList.add('show');
    let x = p.clientX - tipEl.offsetWidth / 2, y = p.clientY - tipEl.offsetHeight - 14;
    x = Math.max(8, Math.min(x, innerWidth - tipEl.offsetWidth - 8));
    tipEl.style.left = x + 'px';
    tipEl.style.top = (y < 8 ? p.clientY + 14 : y) + 'px';
  }, 500);
}, { passive: true });
document.addEventListener('touchend', () => { clearTimeout(lpTimer); tipEl.classList.remove('show'); });
document.addEventListener('touchmove', () => { clearTimeout(lpTimer); tipEl.classList.remove('show'); });

/* =========================================================
   ANTI COPY / SELECT
   ========================================================= */
['contextmenu', 'copy', 'cut', 'dragstart', 'selectstart'].forEach(ev =>
  document.addEventListener(ev, e => e.preventDefault())
);

/* =========================================================
   TOAST
   ========================================================= */
let toastTimer = null;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

/* =========================================================
   MODAL KONFIRMASI
   ========================================================= */
function confirmModal(title, msg, okLabel, onOk) {
  $('#modal-title').textContent = title;
  $('#modal-msg').innerHTML = msg;
  const ok = $('#modal-ok');
  ok.textContent = okLabel || 'Ya';
  ok.className = 'btn btn-danger';
  pendingConfirm = onOk;
  $('#modal').hidden = false;
  document.body.classList.add('no-scroll');
}
$('#modal-cancel').addEventListener('click', closeModal);
$('#modal-ok').addEventListener('click', () => { const fn = pendingConfirm; closeModal(); if (fn) fn(); });
$('#modal').addEventListener('click', e => { if (e.target === $('#modal')) closeModal(); });
function closeModal() { pendingConfirm = null; $('#modal').hidden = true; document.body.classList.remove('no-scroll'); }

/* =========================================================
   NAVIGASI
   ========================================================= */
function showScreen(id) {
  $$('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(id);
  el && el.classList.add('active');
  window.scrollTo({ top: 0 });
}
function goMain()  { render(); showScreen('screen-main'); }
function goTrash() { renderTrash(); showScreen('screen-trash'); }
function goForm()  { openForm(null); }

/* =========================================================
   RENDER — LIST UTAMA
   ========================================================= */
function searchStr(n) {
  return [n.title, n.user, n.pass, n.contacts.join(' '), n.links.join(' '), n.caption].join(' ').toLowerCase();
}
function summary(n) {
  if (n.user) return 'Akun: ' + n.user;
  if (n.contacts.length) return n.contacts[0];
  if (n.links.length) return n.links[0];
  if (n.caption) return n.caption;
  if (n.pass !== '') return 'Password: ••••••';
  return '—';
}

function render() {
  purgeExpired();
  let list = notes.filter(n => !n.trash);
  const q = filter.trim().toLowerCase();
  if (q) list = list.filter(n => searchStr(n).includes(q));
  list.sort((a, b) => (b.pin - a.pin) || (b.time - a.time));

  const wrap = $('#note-list'), empty = $('#empty-state');
  $('#count-chip').textContent = list.length + ' catatan';

  if (!list.length) {
    wrap.innerHTML = '';
    empty.hidden = false;
    $('#empty-title').textContent = q ? 'Tidak Ditemukan' : 'Belum Ada Catatan';
    $('#empty-desc').innerHTML = q
      ? 'Tidak ada catatan cocok dengan "<b>' + esc(filter) + '</b>".'
      : 'Klik tanda <b>+</b> di kanan bawah untuk buat catatan.';
    return;
  }
  empty.hidden = true;
  wrap.innerHTML = list.map(cardHTML).join('');
}

function cardHTML(n) {
  const extra = n.type === 'full'
    ? `<button class="act-btn act-share" data-act="share" data-id="${n.id}" data-tip="Bagikan">${I.share}</button>
       <button class="act-btn act-print" data-act="print" data-id="${n.id}" data-tip="Print A4">${I.print}</button>`
    : '';
  return `
  <article class="note-card ${n.pin ? 'pinned' : ''}" data-id="${n.id}">
    <div class="card-top">
      <h3 class="card-title">${esc(n.title)}</h3>
      <span class="type-chip ${n.type}">${n.type === 'full' ? 'Lengkap' : 'Akun'}</span>
    </div>
    <p class="card-sum">${esc(summary(n))}</p>
    <div class="card-actions">
      ${extra}
      <button class="act-btn act-pin ${n.pin ? 'on' : ''}" data-act="pin" data-id="${n.id}" data-tip="Pin">${I.pin}</button>
      <button class="act-btn act-edit" data-act="edit" data-id="${n.id}" data-tip="Edit">${I.edit}</button>
      <button class="act-btn act-del" data-act="del" data-id="${n.id}" data-tip="Hapus">${I.trash}</button>
    </div>
  </article>`;
}

$('#note-list').addEventListener('click', e => {
  const btn = e.target.closest('[data-act]');
  const card = e.target.closest('.note-card');
  if (!card) return;
  const id = card.dataset.id;
  if (!btn) { openView(id); return; }
  switch (btn.dataset.act) {
    case 'share': shareNote(getById(id)); break;
    case 'print': printNote(getById(id)); break;
    case 'pin': togglePin(id); break;
    case 'edit': openForm(getById(id)); break;
    case 'del': askDelete(id); break;
  }
});

/* =========================================================
   AKSI CATATAN
   ========================================================= */
function togglePin(id) {
  const n = getById(id); if (!n) return;
  n.pin = !n.pin; save(); render();
  if (viewId) openView(id);
  toast(n.pin ? 'Catatan di-pin' : 'Pin dicabut');
}
function toTrash(id) {
  const n = getById(id); if (!n) return;
  n.trash = Date.now(); n.pin = false; shownPass.delete(id);
  save(); render();
  toast('Dipindah ke Sampah');
}
function askDelete(id) {
  confirmModal('Hapus catatan?', 'Dipindah ke <b>Folder Sampah</b>. Bisa dipulihkan dalam 30 hari.', 'Hapus', () => toTrash(id));
}
function permanentDelete(id) {
  notes = notes.filter(x => x.id !== id);
  shownPass.delete(id); save(); render(); renderTrash();
  toast('Dihapus permanen');
}
function restore(id) {
  const n = getById(id); if (!n) return;
  n.trash = null; save(); render(); renderTrash();
  toast('Catatan dipulihkan');
}
function remainDays(n) {
  return Math.max(0, Math.min(TRASH_DAYS, TRASH_DAYS - Math.floor((Date.now() - n.trash) / DAY_MS)));
}
function purgeExpired() {
  const now = Date.now();
  let changed = false;
  notes = notes.filter(n => {
    if (n.trash && (now - n.trash) > TRASH_DAYS * DAY_MS) { changed = true; return false; }
    return true;
  });
  if (changed) { save(); toast('Catatan sampah terhapus otomatis (30 hari)'); }
}
function clearTrash() {
  confirmModal('Kosongkan Sampah?', 'Semua catatan di sampah akan <b>terhapus permanen</b>.', 'Kosongkan', () => {
    notes = notes.filter(n => !n.trash);
    save(); renderTrash();
    toast('Sampah dikosongkan');
  });
}

/* =========================================================
   RENDER — SAMPAH
   ========================================================= */
function renderTrash() {
  purgeExpired();
  const list = notes.filter(n => n.trash).sort((a, b) => a.trash - b.trash);
  const wrap = $('#trash-list'), empty = $('#trash-empty');
  if (!list.length) { wrap.innerHTML = ''; empty.hidden = false; return; }
  empty.hidden = true;
  wrap.innerHTML = list.map(tcardHTML).join('');
}
function tcardHTML(n) {
  const days = remainDays(n);
  const label = days <= 0 ? 'Hapus otomatis...' : (days === 1 ? 'Sisa 1 hari' : 'Sisa ' + days + ' hari');
  return `
  <article class="note-card" data-id="${n.id}">
    <div class="card-top">
      <h3 class="card-title">${esc(n.title)}</h3>
      <span class="remain-badge ${days <= 3 ? 'danger' : ''}">${label}</span>
    </div>
    <div class="card-actions">
      <span class="t-preview">Dihapus: ${esc(fmtShort(n.trash))}</span>
      <button class="act-btn act-restore" data-act="restore" data-id="${n.id}" data-tip="Pulihkan">${I.restore}</button>
      <button class="act-btn act-del" data-act="pdel" data-id="${n.id}" data-tip="Hapus permanen">${I.del}</button>
    </div>
  </article>`;
}
$('#trash-list').addEventListener('click', e => {
  const btn = e.target.closest('[data-act]');
  const card = e.target.closest('.note-card');
  if (!btn || !card) return;
  const id = card.dataset.id;
  if (btn.dataset.act === 'restore') restore(id);
  else if (btn.dataset.act === 'pdel')
    confirmModal('Hapus Permanen?', 'Catatan akan <b>terhapus selamanya</b>.', 'Hapus', () => permanentDelete(id));
});

/* =========================================================
   MODAL LIHAT CATATAN
   ========================================================= */
function vIco(cls, ic) { return `<span class="v-ico ${cls}">${ic}</span>`; }
function viewBody(n) {
  let h = '';
  if (n.user) h += `<div class="v-row">${vIco('b-user', I.user)}<div class="v-val"><div class="v-lbl">Akun</div>${esc(n.user)}</div></div>`;
  if (n.pass !== '') {
    const shown = shownPass.has(n.id);
    h += `<div class="v-row">${vIco('b-key', I.lock)}<div class="v-val"><div class="v-lbl">Password</div><span class="${shown ? '' : 'v-mask'}">${shown ? esc(n.pass) : mask(n.pass)}</span></div>
          <button class="eye-toggle ${shown ? 'on' : ''}" data-act="eye" data-id="${n.id}" data-tip="${shown ? 'Sembunyikan' : 'Lihat'}">${shown ? I.eyeOff : I.eye}</button></div>`;
  }
  n.contacts.forEach(c => {
    const k = kindOf(c);
    h += `<div class="v-row">${vIco(k === 'phone' ? 'b-phone' : k === 'email' ? 'b-mail' : 'b-other', k === 'phone' ? I.phone : k === 'email' ? I.mail : I.user)}
          <div class="v-val"><div class="v-lbl">Kontak</div>${esc(c)}</div></div>`;
  });
  n.links.forEach(l => h += `<div class="v-row">${vIco('b-link', I.link)}<div class="v-val"><div class="v-lbl">Link</div>${esc(l)}</div></div>`);
  if (n.caption) h += `<div class="v-cap">${esc(n.caption)}</div>`;
  return h || '<p class="v-empty">Catatan kosong.</p>';
}
function openView(id) {
  const n = getById(id); if (!n) return;
  viewId = id;
  $('#v-title').textContent = n.title;
  const tc = $('#v-type');
  tc.textContent = n.type === 'full' ? 'Lengkap' : 'Akun';
  tc.className = 'type-chip ' + n.type;
  $('#v-time').textContent = fmtShort(n.time);
  $('#v-body').innerHTML = viewBody(n);
  $('#v-share').hidden = n.type !== 'full';
  $('#v-print').hidden = n.type !== 'full';
  $('#v-pin').classList.toggle('on', !!n.pin);
  $('#modal-view').hidden = false;
  document.body.classList.add('no-scroll');
}
function closeView() { viewId = null; $('#modal-view').hidden = true; document.body.classList.remove('no-scroll'); }
$('#v-close').addEventListener('click', closeView);
$('#modal-view').addEventListener('click', e => { if (e.target === $('#modal-view')) closeView(); });
$('#v-body').addEventListener('click', e => {
  const b = e.target.closest('[data-act="eye"]');
  if (!b) return;
  togglePass(b.dataset.id);
  openView(b.dataset.id);
});
function togglePass(id) {
  if (shownPass.has(id)) shownPass.delete(id); else shownPass.add(id);
}
$('#v-pin').addEventListener('click', () => { if (viewId !== null && viewId) togglePin(viewId); });
$('#v-edit').addEventListener('click', () => { const id = viewId; closeView(); openForm(getById(id)); });
$('#v-del').addEventListener('click', () => { const id = viewId; closeView(); if (id) askDelete(id); });
$('#v-share').addEventListener('click', () => { if (viewId) shareNote(getById(viewId)); });
$('#v-print').addEventListener('click', () => { if (viewId) printNote(getById(viewId)); });

/* =========================================================
   BAGIKAN & PRINT
   ========================================================= */
function buildShareText(n) {
  const lines = ['Jhon Note: ' + n.title];
  if (n.user) lines.push('Akun: ' + n.user);
  if (n.pass !== '') lines.push('Password: ' + n.pass);
  n.contacts.forEach(c => lines.push('Kontak: ' + c));
  n.links.forEach(l => lines.push('Link: ' + l));
  if (n.caption) lines.push('- ' + n.caption);
  return lines.join('\n');
}
function shareNote(n) {
  if (!n) return;
  const txt = buildShareText(n);
  if (navigator.share) {
    navigator.share({ title: 'Jhon Note', text: txt }).catch(() => {});
  } else if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(txt)
      .then(() => toast('Teks siap dibagikan (di clipboard)'))
      .catch(() => toast('Gagal membagikan'));
  } else {
    toast('Perangkat tidak mendukung share');
  }
}
function printHTML(n) {
  const d = new Date(n.time);
  const date = d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  let rows = '';
  if (n.user) rows += '<div class="p-sec"><div class="p-lbl">Akun</div><div class="p-val">' + esc(n.user) + '</div></div>';
  if (n.pass !== '') rows += '<div class="p-sec"><div class="p-lbl">Password</div><div class="p-val">' + esc(n.pass) + '</div></div>';
  n.contacts.forEach(c => rows += '<div class="p-sec"><div class="p-lbl">Kontak</div><div class="p-val">' + esc(c) + '</div></div>');
  n.links.forEach(l => rows += '<div class="p-sec"><div class="p-lbl">Link</div><div class="p-val">' + esc(l) + '</div></div>');
  if (n.caption) rows += '<div class="p-para">' + esc(n.caption) + '</div>';
  return '<div class="p-brand">JHON NOTE</div>' +
    '<h1 class="p-title">' + esc(n.title) + '</h1>' +
    '<div class="p-meta">' + date + '</div>' + rows +
    '<div class="p-colof">Dicetak dari Jhon Note — jhon-note.vercel.app</div>';
}
function printNote(n) {
  if (!n) return;
  $('#print-area').innerHTML = printHTML(n);
  setTimeout(() => window.print(), 60);
}

/* =========================================================
   FORM
   ========================================================= */
const fTitle = $('#in-title'), fUser = $('#in-user'), fPass = $('#in-pass'), fCaption = $('#in-caption');
const contactsBox = $('#contact-list'), linksBox = $('#link-list');

function setType(t) {
  formType = t;
  $$('#type-seg .seg').forEach(b => b.classList.toggle('active', b.dataset.type === t));
  $('#block-akun').hidden = (t === 'full');
  $('#block-caption').hidden = (t !== 'full');
}
$('#type-seg').addEventListener('click', e => {
  const b = e.target.closest('.seg');
  if (b) setType(b.dataset.type);
});
$('#tgl-pass').addEventListener('click', () => {
  fPass.type = fPass.type === 'password' ? 'text' : 'password';
  $('#tgl-pass').innerHTML = fPass.type === 'password' ? I.eye : I.eyeOff;
});

function refreshLead(row) {
  const lead = row.querySelector('.lead');
  const isLink = !!row.closest('#link-list');
  if (isLink) { lead.className = 'lead b-link'; lead.innerHTML = I.link; return; }
  const inp = row.querySelector('.row-in');
  const k = kindOf(inp.value);
  const map = { email: { cls: 'b-mail', ic: I.mail }, phone: { cls: 'b-phone', ic: I.phone }, other: { cls: 'b-other', ic: I.user } };
  lead.className = 'lead ' + map[k].cls;
  lead.innerHTML = map[k].ic;
}
function newRow(kind, val) {
  const row = document.createElement('div');
  row.className = 'list-row';
  if (kind === 'link') {
    row.innerHTML = `<span class="lead b-link">${I.link}</span>
      <input class="row-in" type="text" placeholder="https://contoh.com" value="${escAttr(val)}" spellcheck="false">
      <button class="row-del" type="button" data-tip="Hapus">${I.close}</button>`;
  } else {
    row.innerHTML = `<span class="lead b-other">${I.user}</span>
      <input class="row-in" type="text" placeholder="email@contoh.com / +62812..." value="${escAttr(val)}" spellcheck="false">
      <button class="row-del" type="button" data-tip="Hapus">${I.close}</button>`;
  }
  return row;
}
function addContactRow(v) { const r = newRow('contact', v); contactsBox.appendChild(r); r.querySelector('.row-in').focus(); }
function addLinkRow(v)    { const r = newRow('link', v);    linksBox.appendChild(r);    r.querySelector('.row-in').focus(); }
$('#btn-add-contact').addEventListener('click', () => addContactRow(''));
$('#btn-add-link').addEventListener('click', () => addLinkRow(''));

document.addEventListener('input', e => {
  const r = e.target.closest('.list-row');
  if (r) refreshLead(r);
});
document.addEventListener('click', e => {
  const d = e.target.closest('.row-del');
  if (d) d.closest('.list-row').remove();
});

function openForm(n) {
  editId = n ? n.id : null;
  $('#form-title').textContent = n ? 'Edit Catatan' : 'Catatan Baru';
  fTitle.value = n ? n.title : '';
  fUser.value = n ? n.user : '';
  fPass.value = n ? n.pass : '';
  fCaption.value = n ? n.caption : '';
  fPass.type = 'password';
  $('#tgl-pass').innerHTML = I.eye;
  setType(n ? (n.type === 'full' ? 'full' : 'akun') : 'akun');
  contactsBox.innerHTML = ''; linksBox.innerHTML = '';
  const cs = n ? n.contacts : [];
  if (cs.length) cs.forEach(c => addContactRow(c)); else addContactRow('');
  const ls = n ? n.links : [];
  if (ls.length) ls.forEach(l => addLinkRow(l)); else addLinkRow('');
  showScreen('screen-form');
  setTimeout(() => fTitle.focus(), 120);
}

function submitForm(e) {
  e.preventDefault();
  const title = fTitle.value.trim();
  if (!title) { toast('Nama catatan wajib diisi'); fTitle.focus(); return; }
  const contacts = $$('#contact-list .row-in').map(i => i.value.trim()).filter(Boolean);
  const links = $$('#link-list .row-in').map(i => i.value.trim()).filter(Boolean);
  const data = {
    title,
    type: formType,
    user: fUser.value.trim(),
    pass: fPass.value,
    contacts, links,
    caption: fCaption.value.trim()
  };
  if (editId) { const n = getById(editId); if (n) Object.assign(n, data); }
  else notes.unshift(Object.assign({ id: uid(), pin: false, time: Date.now(), trash: null }, data));
  save(); goMain();
  toast('Catatan tersimpan');
}
$('#note-form').addEventListener('submit', submitForm);

/* =========================================================
   HEADER, SEARCH, NAV
   ========================================================= */
$('#btn-add').addEventListener('click', goForm);
$('#btn-trash').addEventListener('click', goTrash);
$('#btn-trash-back').addEventListener('click', goMain);
$('#btn-trash-clear').addEventListener('click', clearTrash);
$('#btn-form-back').addEventListener('click', goMain);
$('#btn-cancel').addEventListener('click', goMain);

$('#search').addEventListener('input', e => {
  filter = e.target.value;
  $('#search-clear').hidden = filter.length === 0;
  render();
});
$('#search-clear').addEventListener('click', () => {
  $('#search').value = ''; filter = '';
  $('#search-clear').hidden = true;
  render(); $('#search').focus();
});

/* =========================================================
   MODAL APK
   ========================================================= */
function openApkModal() {
  const alertEl = $('#apk-alert');
  const online = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  if (!online) {
    alertEl.className = 'apk-alert warn';
    alertEl.textContent = 'Website dibuka dari file lokal. Buka https://jhon-note.vercel.app di HP untuk download APK.';
  } else {
    alertEl.className = 'apk-alert ok';
    alertEl.textContent = 'APK Jhon Note siap di-download.';
  }
  $('#modal-apk').hidden = false;
  document.body.classList.add('no-scroll');
}
function closeApk() { $('#modal-apk').hidden = true; document.body.classList.remove('no-scroll'); }
$('#btn-apk').addEventListener('click', openApkModal);
$('#apk-close').addEventListener('click', closeApk);
$('#modal-apk').addEventListener('click', e => { if (e.target === $('#modal-apk')) closeApk(); });

/* =========================================================
   KEBAB MENU
   ========================================================= */
const btnMenu = $('#btn-menu'), menuEl = $('#menu');
function closeMenu() { menuEl.hidden = true; btnMenu.setAttribute('aria-expanded', 'false'); }
btnMenu.addEventListener('click', e => {
  e.stopPropagation();
  if (menuEl.hidden) { menuEl.hidden = false; btnMenu.setAttribute('aria-expanded', 'true'); }
  else closeMenu();
});
document.addEventListener('click', closeMenu);
$('#menu').addEventListener('click', e => {
  const item = e.target.closest('[data-menu-action]');
  if (!item) return;
  closeMenu();
  if (item.dataset.menuAction === 'trash') goTrash();
  else if (item.dataset.menuAction === 'about') toast('Jhon Note v3 · JHON338');
});

/* =========================================================
   SERVICE WORKER
   ========================================================= */
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
  navigator.serviceWorker.register('./sw.js')
    .then(() => console.log('[SW] registered'))
    .catch(err => console.error('[SW] failed:', err));
}

/* =========================================================
   BOOT
   ========================================================= */
window.addEventListener('load', () => {
  purgeExpired();
  setTimeout(() => {
    const ld = $('#screen-loading');
    ld.classList.add('hide');
    setTimeout(() => { $('#screen-loading').style.display = 'none'; goMain(); }, 520);
  }, 2400);
});

setInterval(purgeExpired, 60 * 1000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) { purgeExpired(); if ($('#screen-trash').classList.contains('active')) renderTrash(); } });

document.addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if ((e.ctrlKey || e.metaKey) && (k === 'a' || k === 'c' || k === 'x')) e.preventDefault();
  if (e.key === 'Escape') { closeModal(); closeView(); closeMenu(); closeApk(); }
});