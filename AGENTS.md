# Jhon Note — PWA Workflow

## Aturan Wajib
- **SETIAP perubahan code**: langsung commit + `git push` ke `main`. Jangan nanya dulu.
  - `git add -A`
  - `git commit -m "fix: ..."`
  - `git push`
- Vercel otomatis redeploy tiap push ke `main`. URL: https://jhon-note.vercel.app
- Remote: `https://github.com/jhon338-jc/JhonNote.git`

## Update yang bikin pengguna HP (TWA/PWA) harus dapet versi baru
1. Bump versi query asset di `index.html`: `css/style.css?v=N` dan `js/app.js?v=N`
2. Bump `CACHE_NAME` di `sw.js` (mis. `jhon-note-vN`)
3. Update `APP_SHELL` di `sw.js` biar nyamain URL versi asset di atas
4. Commit + push

## Struktur tambahan
- `apk/` = folder buat file `.apk` yang mau di-link di website
  - Link download: `<a id="apk-download" href="./apk/jhon-note.apk" download>` (awal `hidden`, aktif setelah file ada)
- `.opencode/` & `AGENTS.md` = instruksi agent, JANGAN hapus

## Format commit message
`fix:`, `feat:`, `chore:`, `refactor:` dalam Bahasa Indonesia indo santai.