# ResumeRoast Project Documentation

## 1. Ringkasan
ResumeRoast adalah aplikasi web yang memberikan analisis resume secara tegas namun konstruktif, lalu menawarkan rewrite bagian resume agar lebih jelas, berdampak, dan ramah ATS. Pengguna mengunggah resume PDF, sistem mengekstrak teks, mengirimkan teks tersebut ke model AI melalui OpenRouter untuk analisis terstruktur, kemudian menampilkan skor per section beserta feedback. Setiap section bisa di-rewrite secara streaming sehingga pengguna langsung melihat hasil perbaikan tanpa menunggu respons penuh.

## 2. Target Pengguna dan Masalah yang Diselesaikan
- Fresh graduate dan career switcher yang tidak tahu cara menonjolkan impact.
- Profesional mid-level yang resume-nya stagnan.
- Kandidat yang butuh feedback langsung dan nyata, bukan saran generik.

## 3. Fitur Utama
1) Upload Resume PDF
- Drag-and-drop atau klik upload.
- Validasi tipe file PDF dan batas 5MB.

2) Parsing Resume
- Backend mengekstrak teks dari PDF menggunakan pdf-parse.
- Penanganan error bila teks kosong atau file invalid.

3) AI Resume Roast (Scoring + Feedback)
- AI mengembalikan JSON terstruktur berisi skor dan feedback per section.
- Tampilan scorecard dan feedback di UI.

4) Section Rewrite (Streaming)
- Pengguna memilih section untuk di-rewrite.
- Hasil rewrite dikirim secara streaming dan tampil realtime.
- Tersedia tombol copy untuk hasil rewrite.

## 4. Arsitektur dan Alur Data
Alur utama:
1. Client mengunggah PDF ke endpoint /api/upload.
2. Server mengekstrak teks menggunakan pdf-parse.
3. Teks dikirim ke /api/analyze.
4. Server memanggil OpenRouter Chat Completion untuk analisis.
5. Hasil JSON diparse dan dikirim ke client.
6. UI menampilkan skor dan feedback.
7. Saat rewrite, client memanggil /api/rewrite dan menerima stream teks.

## 5. Tech Stack
- Frontend: Next.js 16.2.4 (App Router), React 19.2.4, Tailwind CSS v4.
- Backend: Next.js API Routes (Route Handlers).
- AI: OpenRouter Chat Completion API.
- PDF Parsing: pdf-parse.
- Tooling: TypeScript, ESLint.

## 6. Integrasi AI
- Analisis resume menggunakan prompt sistem dan prompt user yang mengharuskan output JSON valid.
- Parsing JSON dilakukan dengan extractor khusus agar robust terhadap output model.
- Rewrite section menggunakan streaming sehingga UI terasa realtime.
- Model default saat ini: nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free.
- Model analisis bisa diubah lewat env var OPENROUTER_ANALYSIS_MODEL.

## 7. Endpoint API
1) POST /api/upload
- Input: multipart/form-data dengan field file (PDF).
- Output: { success, file, extractedText }.

2) POST /api/analyze
- Input: JSON { resumeText }.
- Output: JSON analysis terstruktur berisi skor dan feedback.

3) POST /api/rewrite
- Input: JSON { sectionName, sectionText, userContext? }.
- Output: stream text (plain text) hasil rewrite.

4) GET /api/upload
- Output: pesan status endpoint.

## 8. Komponen UI Utama
- UploadZone: handle upload, validasi, loading state, dan call ke API.
- AnalysisResults: menampilkan skor, feedback, dan UI rewrite streaming.
- Home Page: menyatukan upload dan hasil analisis.

## 9. Konfigurasi dan Environment Variables
- OPENROUTER_API_KEY (wajib) untuk akses OpenRouter.
- OPENROUTER_ANALYSIS_MODEL (opsional) untuk override model analisis.

## 10. Branding dan UI
- Layout berbasis hero section + upload panel.
- Palet warna netral dengan aksen hangat (orange/rose/amber).
- Tipografi menggunakan Geist (next/font).
- UI menonjolkan scorecard, chip, dan panel feedback.

## 11. Cara Menjalankan Lokal
1) Install dependencies: npm install
2) Jalankan dev server: npm run dev
3) Buka http://localhost:3000

## 12. Deployment
- Disarankan ke Vercel.
- Pastikan env var OPENROUTER_API_KEY diset di Vercel.

## 13. Limitasi dan Catatan
- PDF berbentuk scan bisa gagal diekstrak.
- Belum ada penyimpanan data; semua berjalan secara stateless.
- Branding logo/mascot belum tersedia di repo (perlu disiapkan jika dibutuhkan).
