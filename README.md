# Jhon Note — JHON338

Aplikasi catatan PWA: simpan **username, password, email / nomor HP / link** secara permanen di penyimpanan perangkat (localStorage). Bisa di-install sebagai PWA dan dikonversi ke **APK Android**.

## Cara Menjalankan

**Opsi A — Langsung (tanpa server):**
Buka `index.html` dengan dobel-klik. Semua fitur catatan berfungsi. (PWA + Service Worker hanya aktif saat di-host secara online.)

**Opsi B — Server lokal (disarankan untuk test PWA):**
```bash
npx serve .        # lalu buka http://localhost:3000
# atau
python3 -m http.server 8080
```

## Cara Install Sebagai PWA

1. Host website di hosting online (**wajib HTTPS**) — contoh gratis: [Netlify](https://www.netlify.com), [Vercel](https://vercel.com), atau GitHub Pages.
2. Buka website di Chrome/Edge Android.
3. Muncul tombol **Install** di header (via prompt instalasi otomatis), atau buka menu browser → **"Tambah ke Layar Utama"** / **"Install app"**.

## Cara Generate / Download APK

> Catatan penting: APK **tidak bisa di-generate murni di dalam browser** karena memerlukan Android SDK + signing key. File APK dihasilkan dengan membungkus website ini dalam WebView Android. Gunakan salah satu cara di bawah.

### Cara 1 — PWABuilder (tanpa install apa pun, paling mudah)
1. Host semua file ini ke hosting online (mis. Netlify) sampai bisa diakses via `https://...`.
2. Buka https://www.pwabuilder.com
3. Masukkan URL website → klik **Start**.
4. Pilih platform **Android** → **Generate / Package** → download file **.apk**.
5. Install `.apk` tersebut di HP Android (izinkan "install dari sumber tidak dikenal").

### Cara 2 — Bubblewrap (CLI, butuh Node.js + Android SDK)
```bash
npm install -g @bubblewrap/cli
bubblewrap init --manifest=https://URL-WEBSITE-ANDA/manifest.json
bubblewrap build
# hasil: ~/jhon-note/app-release-signed.apk
```

### Cara 3 — EAS Build (React Native-style wrapper, opsional)
Gunakan https://github.com/pwa-builder/CloudAPK (API) atau template:
```bash
npx degit pwa-builder/pwa-starter
# lalu package via CloudAPK / ekspor ke Android Studio
```

## Struktur File

```
index.html          → Layout semua halaman (loading, utama, form, sampah, modal)
css/style.css       → Tema dark biru/ungu/cyan, responsif, animasi
js/app.js           → Logika aplikasi lengkap
manifest.json       → Manifes PWA (nama: Jhon Note, developer: JHON338)
sw.js               → Service Worker (offline cache)
icons/              → icon-192.png & icon-512.png
```

## Fitur

- Halaman loading animasi (±2,5 detik)
- Tambah/edit catatan (3 kolom, semua opsional, tanpa batas karakter)
- Deteksi otomatis **Gmail / Telepon / Link** dengan ikon per kolom
- Tombol salin sekali klik per kolom (username, password, email/HP/link)
- Pin / Unpin (pin selalu di atas, tanpa durasi)
- Hapus biasa → **Folder Sampah** (otomatis permanen setelah **30 hari**)
- Hapus permanen langsung (dengan konfirmasi)
- Pencarian catatan, tanggal & jam lengkap bahasa Indonesia (detik)
- Data tersimpan permanen di localStorage (tidak hilang saat browser ditutup)
- PWA installable dengan prompt otomatis
- Apostrophe/quote & karakter khusus tersalin sempurna

## Keamanan

Data disimpan **plaintext di localStorage** perangkat — seperti halnya banyak aplikasi catatan sederhana. Jangan simpan password penting yang kritis. Untuk enkripsi penuh, tambahkan lapisan enkripsi (mis. WebCrypto AES-GCM) pada lapisan penyimpanan.

---
**© 2026 Jhon Note · Developer: JHON338**