# PRD — Aplikasi CBT (Computer-Based Test) "Lunar Pinwheel"

**Product Requirements Document (PRD)**

| Field          | Value |
|----------------|-------|
| Nama Produk    | Lunar Pinwheel (Aplikasi CBT) |
| Repositori     | `e:\laragon\www\cbtapp\lunar-pinwheel` (Git remote: `https://github.com/teguhpermadi/lunar-pinwheel.git`) |
| Jenis Aplikasi | Frontend SPA (Single Page Application) berbasis React |
| Status         | Dalam pengembangan (Development) |

---

## 1. Ringkasan / Deskripsi Proyek

Lunar Pinwheel adalah aplikasi web **Computer-Based Test (CBT)** yang digunakan untuk
menyelenggarakan ujian berbasis komputer di lingkungan sekolah/pondok (madrasah). Aplikasi
ini merupakan **frontend** (client) yang berkomunikasi dengan **backend REST API** (Laravel)
melalui protokol JSON. Backend diakses melalui `VITE_API_URL` (default lokal
`http://localhost/api/v1` atau `http://127.0.0.1:8000/api/v1`, produksi
`https://api.cbtmiarridlo.com/api/v1`).

Aplikasi memiliki **tiga peran (role) utama**:

1. **Admin** — mengelola master data (guru, siswa, mata pelajaran, kelas, tahun akademik),
   bank soal, ujian, koreksi, backup, dan pemantauan antrian.
2. **Guru (Teacher)** — mengelola bank soal, menyusun dan menyelenggarakan ujian, serta
   melakukan koreksi jawaban (termasuk koreksi dengan bantuan AI).
3. **Siswa (Student)** — mengikuti ujian secara daring melalui antarmuka pengambilan ujian
   (Exam Taker) yang dilengkapi fitur antifraud, mode offline, dan sinkronisasi waktu nyata.

Aplikasi dibuat dengan React + TypeScript + Vite, dibangun di atas Tailwind CSS, dan
dideploy menggunakan Docker (multi-stage build) + Nginx.

---

## 2. Tujuan Produk

- Menyediakan platform ujian berbasis komputer yang aman, terlacak, dan mudah digunakan.
- Mendukung beragam tipe soal (objektif hingga subjektif, termasuk bahasa Arab, Jawa, dan
  matematika berformat LaTeX).
- Menyediakan workflow koreksi yang lengkap: koreksi otomatis untuk soal objektif, koreksi
  manual, maupun koreksi berbantuan AI untuk jawaban subjektif/essay.
- Memberikan dashboard pemantauan ujian secara langsung (live score) dan analisis butir soal
  (item analysis) kepada pengawas/guru.
- Menjamin integritas ujian melalui mekanisme antifraud (pemblokiran paste, deteksi
  perpindahan tab, pelaporan pelanggaran, mode layar penuh).
- Mendukung ketahanan jaringan dengan sinkronisasi jawaban **offline** ke server.

---

## 3. Target Pengguna / Persona

| Persona | Kebutuhan Utama |
|---------|-----------------|
| **Admin** | Menertibkan data master, memantau antrian job, backup/restore aset, mengelola reviewer bank soal, memonitor keseluruhan sistem. |
| **Guru/Pengawas** | Membuat bank soal, menyusun ujian, menetapkan pengaturan ujian, memantau live score, melakukan koreksi manual & AI. |
| **Siswa** | Mengakses daftar ujian, mengerjakan ujian dengan berbagai tipe soal, melihat riwayat & hasil (jika diizinkan). |
| **Reviewer Bank Soal** | Meninjau, menyetujui/menolak soal dan saran (suggestion) pada bank soal. |

---

## 4. Teknologi & Stack

### 4.1 Frontend Library & Tools

| Kategori           | Teknologi |
|--------------------|-----------|
| Framework          | React 18, TypeScript 5, Vite 7 |
| Routing            | React Router DOM v6 |
| Styling / UI       | Tailwind CSS 3, Tailwind Merge, CVA, Framer Motion, Radix Slot, Lucide React, Material Symbols |
| Form & Validasi    | React Hook Form, Zod, @hookform/resolvers |
| State Management   | Zustand, @tanstack/react-query |
| Rich Text Editor   | TipTap (+ ekstensi Image, Placeholder, Underline, StarterKit) |
| Matematika         | KaTeX, MathQuill, @types/katex |
| Real-time          | Laravel Echo (Pusher-based/Reverb), Pusher JS |
| HTTP Client        | Axios |
| Drag & Drop        | @dnd-kit (core, sortable, utilities) |
| Lainnya            | DOMPurify, date-fns, SweetAlert2 + React content, jQuery (types) |

---

### 4.2 Environment & Deployment

- **Vite config**: host `0.0.0.0`, port `5173`, alias `@` → `src`.
- **Dockerfile**: multi-stage (build di Node 20-alpine, serve di Nginx-alpine port 8080),
  dengan build args `VITE_API_URL`, `VITE_REVERB_APP_KEY`, `VITE_REVERB_HOST`,
  `VITE_REVERB_PORT`, `VITE_REVERB_SCHEME`.
- **docker-compose.yml**: service `frontend`, container `lunar-frontend`, port `8080:8080`,
  network `lunar-network`.
- **nginx.conf**: SPA fallback ke `index.html`, caching asset statis (1 tahun), gzip,
  header keamanan (X-Frame-Options, X-Content-Type-Options, X-XSS-Protection).

### 4.3 Environment Variables

| Variabel                | Deskripsi                                   | Contoh (produksi)            |
|-------------------------|---------------------------------------------|------------------------------|
| `VITE_API_URL`          | Base URL API backend (Laravel)              | `https://api.cbtmiarridlo.com/api/v1` |
| `VITE_REVERB_APP_KEY`   | Kunci aplikasi Reverb/Pusher                | `6rgbvubos9raddjihgqw`       |
| `VITE_REVERB_HOST`      | Host WebSocket (Reverb)                     | `ws.cbtmiarridlo.com`        |
| `VITE_REVERB_PORT`      | Port WebSocket                              | `443`                        |
| `VITE_REVERB_SCHEME`    | Skema WebSocket (`http`/`https`/`wss`)      | `https`                      |
| `VITE_AI_PROVIDER`      | Provider AI default untuk koreksi           | `lmstudio`                   |

---

## 5. Arsitektur & Alur Umum

### 5.1 Struktur Folder Utama (`src/`)

```
src/
├── App.tsx                  # Definisi seluruh routing & guard
├── components/
│   ├── AdminSidebar.tsx, StudentSidebar.tsx
│   ├── layout/Header.tsx
│   ├── admin/               # Modal & tabel CRUD (academic-year, classroom, question-banks, ...)
│   ├── questions/           # Input, display, dan koreksi per tipe soal
│   │   ├── inputs/          # Form input soal (admin)
│   │   ├── student-inputs/  # Komponen jawaban siswa
│   │   ├── displays/        # Tampilan soal
│   │   └── correction/      # Komponen koreksi per tipe soal
│   ├── common/              # AcademicYearSelector, dll
│   ├── ui/                  # Komponen UI reusable (button, card, modal, MathRenderer, RichTextEditor, keyboard Arab/Jawa/Math, dst.)
│   └── Dashboard/StatsCard.tsx
├── pages/
│   ├── auth/                # Login, Register
│   ├── admin/               # Manajemen & halaman admin
│   │   ├── exams/           # ExamManagement, EditExam, ExamLiveScore, ExamCorrection
│   │   ├── question-banks/  # List, Create, Edit, Show, Preview, Reviewer, Suggestion
│   │   ├── questions/       # QuestionForm, math-generator
│   │   └── reading-materials/
│   └── student/             # StudentDashboard, StudentExams, ExamTaker, ExamHistory
├── lib/
│   ├── api.ts               # Seluruh service endpoint REST (API client terpusat)
│   ├── axios.ts             # Axios instance (auth token)
│   ├── echo.ts              # Laravel Echo + Pusher/Reverb (real-time)
│   └── tiptap/              # Ekstensi TipTap (Math, Arabic, Javanese)
├── store/useEditorStore.ts  # Zustand store untuk editor
├── contexts/                # AuthContext, AcademicYearContext
├── layouts/                 # AdminLayout, StudentLayout
└── types/                   # Deklarasi tipe tambahan
```

### 5.2 Alur Autentikasi

- Setiap request API memakai **Bearer Token** yang disimpan di `localStorage`.
- `api.ts` menyisipkan header `Authorization: Bearer <token>` secara otomatis pada setiap
  request (interceptor).
- Guard `RequireAuth` memeriksa `token` dan `user`; jika tidak ada → redirect ke `/login`.
- Guard `RequireRole` membatasi akses berdasarkan `user.role` (`admin` / `teacher` /
  `student`).

Endpoint auth yang disediakan frontend: `login`, `register`, `logout`, `/me` (profil),
`forgot-password`, `reset-password`, verifikasi email (`/email/verify/{id}/{hash}`,
`/email/resend`).

### 5.3 Real-time (Laravel Echo / Reverb)

- Modul `echo.ts` membuat instance Echo dengan broadcaster `reverb` (kompatibel Pusher).
- Digunakan pada **Exam Taker** untuk sinkronisasi timer & penambahan waktu ekstra:
  `echo.channel('exam.{id}.user.{userId}')` mendengarkan event `.TimerSynchronized`.
- Digunakan pada **Live Score** untuk memperbarui skor siswa secara waktu nyata.

---

## 6. Kebutuhan Fungsional per Modul

Berikut daftar lengkap modul dan fungsionalitas yang terimplementasi di repositori.

### 6.1 Autentikasi & Akun
- **Login** — `/login` dengan email/username + password (validasi Zod).
- **Register** — `/register` dengan konfirmasi password (min. 8 karakter).
- **Logout** — memanggil `/logout`.
- **Profil** — mengambil data user melalui `/me`.
- Reset kata sandi & verifikasi email (endpoint tersedia pada `authApi`).

### 6.2 Role & Routing
- **Role-Based Dashboard**: admin/teacher → `AdminLayout`, student → `StudentLayout`.
- Route admin meliputi: subjects, classrooms, academic-years, question-banks, exams,
  queue-monitor, backup, math-generator.
- Route student: `exams`, `exams/history`, `exams/{id}/take`.
- Route `*` → redirect ke `/`.

### 6.3 Manajemen Tahun Akademik (Academic Year)
- Halaman: `AcademicYearManagement` (`admin/academic-years`).
- Komponen: `AcademicYearModal`, `AcademicYearTable`, `AcademicYearSelector`.
- Fungsionalitas: buat, ubah, hapus tahun akademik (tahun + semester), pemilihan tahun
  akademik aktif secara global (context + infinite scroll).

### 6.4 Manajemen Kelas (Classroom)
- Halaman: `ClassroomManagement` (`admin/classrooms`), `ClassroomForm`
  (`admin/classrooms/create`, `admin/classrooms/:id`).
- Fungsionalitas: CRUD kelas (nama, kode, level 1–6 numerik, guru wali `user_id`,
  tahun akademik), penetapan siswa ke kelas (auto-load daftar siswa), tanpa field capacity.

### 6.5 Manajemen Guru (Teacher) & Siswa (Student) — Admin
- Halaman: `TeacherManagement` (`admin/teachers`), `StudentManagement` (`admin/students`).
- Komponen: `TeacherTable`, `TeacherModal`, `StudentTable`, `StudentModal`.
- Fungsionalitas: CRUD, aksi massal (bulk), import/export data, pencarian.

### 6.6 Manajemen Mata Pelajaran (Subject) & Unit
- Halaman: `SubjectManagement` (`admin/subjects`), `SubjectForm`,
  `SubjectUnitManagement` (`admin/subjects/:subjectId/units`).
- Fungsionalitas: CRUD mata pelajaran dengan pemilihan guru & kelas dinamis; pengelolaan
  unit/sub-bab mata pelajaran.

### 6.7 Bank Soal (Question Bank)
- `QuestionBankList` (`admin/question-banks`) — daftar bank soal dengan filter tab
  (termasuk tab "all").
- `CreateQuestionBank` (`admin/question-banks/create`) — buat bank soal baru.
- `EditQuestionBank` (`admin/question-banks/:id`) — edit bank soal; berisi daftar soal.
- `ShowQuestionBank` (`admin/question-banks/:id/show`) — lihat detail bank soal.
- `PreviewQuestionBank` (`admin/question-banks/:id/preview`) — pratinjau soal dengan
  kontrol tampilan jawaban (`showAnswer`) dan pemilihan kolom yang ditampilkan.
- Import soal dari **Microsoft Word** (komponen `WordImportModal`), import/export bank
  soal (`/question-banks/{id}/import`, `/export`).
- Trash/soft delete: `getTrashed`, `restore`, `forceDelete`.
- Mode "suggestion mode" untuk rendering/saran perbaikan soal.

### 6.8 Soal (Question) & Tipe Soal
Halaman: `QuestionFormPage` (`admin/question-banks/:bankId/questions/create`,
`admin/questions/:questionId/edit`).

Tipe soal yang didukung (`question_type` / `type`):
1. `multiple_choice` — pilihan ganda
2. `multiple_selection` — pilihan ganda majemuk
3. `true_false` — benar/salah
4. `short_answer` — jawaban singkat
5. `essay` — uraian (dengan rubrik/keyword)
6. `math_input` — input matematika (MathQuill/KaTeX)
7. `matching` — menjodohkan (pasangan kiri–kanan)
8. `sequence` — urutan
9. `arrange_words` — menyusun kata
10. `categorization` — pengelompokan/kategorisasi
11. `arabic_response` — jawaban bahasa Arab (dengan Arabic Keyboard)
12. `javanese_response` — jawaban bahasa Jawa (dengan Javanese Keyboard)

Fitur editor soal:
- **RichTextEditor (TipTap)** dengan ekstensi Math, Arabic, dan Javanese beserta toolbar
  di header global; render KaTeX untuk matematika.
- Atribut soal: tipe, tingkat kesulitan (difficulty), timer (detik), skor, petunjuk (hint),
  tag, reading material (bahan bacaan).
- Input opsi per tipe (opsi + media per opsi).
- Format jawaban kunci (`key_answer`) sesuai tipe: `answer`/`answers`, `pairs` (matching),
  `order` (sequence), `words` (arrange), `groups` (categorization), `rubric` (essay).
- Validasi: pilihan ganda wajib memilih jawaban benar.
- Bulk delete & select all/deselect all.
- Upload & pengelolaan media (gambar) untuk konten/opsi soal.

### 6.9 Generator Soal Matematika (Math Generator)
Halaman: `MathGeneratorPage` (standalone, `admin/math-generator`, tanpa sidebar).
Komponen: `MathConfigPanel`, `MathPreviewPanel`, `MathQuestionCard`, `MathSaveDialog`,
`MathDifficultyBadge`.
Fungsionalitas: konfigurasi pembuatan soal matematika, pratinjau, dan simpan ke bank soal.

### 6.10 Bahan Bacaan (Reading Materials)
Halaman: `ReadingMaterialFormPage`
(`admin/question-banks/:bankId/reading-materials/create`,
`admin/question-banks/:bankId/reading-materials/:materialId/edit`).
Komponen: `ReadingMaterialPreviewModal`, `ReadingMaterialSelector`,
`ReadingMaterialSlideOver`.
Fungsionalitas: CRUD bahan bacaan yang dapat dilampirkan ke soal; pratinjau konten.

### 6.11 Reviewer Bank Soal (Question Bank Reviewer)
Halaman: `QuestionBankReviewerList` (`admin/question-bank-reviewers`).
Fungsionalitas: mendaftarkan reviewer, memberi rating & catatan, approve/reject, melihat
jumlah saran per reviewer, daftar reviewer milik sendiri / publik.

### 6.12 Saran Soal (Question Suggestion)
Halaman: `QuestionSuggestionList`, `ReviewQuestionSuggestion`,
komponen `QuestionSuggestionModal`.
Fungsionalitas: siswa/reviewer mengajukan saran perbaikan soal; admin meninjau lalu
approve/reject; daftar saran saya (`/question-suggestions/mine`).

### 6.13 Manajemen Ujian (Exam)
Halaman: `ExamManagementPage` (`admin/exams`), `EditExamPage` (`admin/exams/:id/edit`).

Pengaturan ujian (`Exam`):
- `title`, `type`, `duration`, `description`
- `start_time`, `end_time`, `max_attempts`
- `passing_score` (KKM)
- `timer_type`: `strict` (ketat, sinkronisasi server) atau `flexible`
- `is_published` (publikasi)
- `token` + `is_token_visible` (token akses ujian)
- `is_randomized_question`, `is_randomized_answer`
- `is_show_result` (tampilkan hasil), `is_visible_hint`
- `is_paste_allowed` (izinkan salin-tempel)
- `is_open_other_apps_allowed`
- Relasi: `subject`, `academic_year`, `classrooms`/`classroom_ids`, `teacher/user`,
  `exam_reading_materials`.

Aksi pada ujian:
- CRUD ujian.
- Bulk delete/update; soft delete (`trashed`, `restore`, `forceDelete`).
- Pemilihan soal untuk ujian (`exam_questions`; bulk update/delete).
- `regenerateToken` — regenerasi token.
- `resetExam`, `forceFinish`, `addTime`, `reopenExam` per siswa.
- `liveScore` — data skor real-time.

### 6.14 Live Score Ujian (Exam Live Score)
Halaman: `ExamLiveScorePage` (`admin/exams/:id/live`).
Fungsionalitas: pantau skor siswa secara real-time (status in_progress/idle/finished/
completed/timed_out, sisa waktu, extra_time, skor, progress jawaban, history skor);
pencarian siswa, pemfilteran tab, penambahan waktu ekstra, modal token, tampilan skor
dengan logika timer ketat (strict) dan perbaikan tampilan sisa waktu.

### 6.15 Pengambilan Ujian (Exam Taker — Siswa)
Halaman: `ExamTaker` (`exams/:id/take`).

Fungsionalitas inti untuk siswa:
- Menampilkan ujian, daftar soal, navigasi soal (prev/next), sidebar daftar nomor.
- Beragam input jawaban sesuai tipe soal (student-inputs).
- **Timer** dengan mode strict vs flexible; penambahan waktu ekstra via Reverb
  (`TimerSynchronized`).
- **Mode offline**: jawaban disimpan ke `localStorage` (`exam_{id}_pending_answers`),
  queued → disinkronkan ke server saat kembali online; indikator online/offline, tombol
  submit offline.
- **Antifraud / anti-cheat**:
  - Deteksi & pencatatan perpindahan tab (`tabSwitches`).
  - Pemblokiran **paste** pada input essay & jawaban singkat (kecuali diizinkan oleh
    `is_paste_allowed`).
  - Pelaporan pelanggaran ke server & update UI (exam violation reporting).
  - Mode layar penuh / zoom gambar.
- Penyesuaian ukuran font, tombol flag/tandai, download data, indikasi waktu habis dengan
  grace period.

### 6.16 Riwayat & Hasil Ujian (Siswa)
Halaman: `StudentExamsPage` (`exams`), `StudentExamHistoryPage` (`exams/history`),
`StudentResultDetailPage` (`exams/history/:id/:sessionId`).
Fungsionalitas: daftar ujian tersedia, riwayat ujian yang pernah dikerjakan, detail hasil
siswa; tampilan hasil dikondisikan berdasarkan pengaturan visibilitas (`is_show_result`).
Jawaban siswa dapat dipulihkan (`restoreStudentAnswer`) dan diperiksa integritasnya
(`checkIntegrity`) oleh admin.

### 6.17 Koreksi Ujian (Exam Correction)
Halaman: `ExamCorrectionPage` (`admin/exams/:id/correction`), beserta sub-modul di
`pages/admin/exams/correction/`:
- `CorrectionByStudent` — koreksi per siswa.
- `CorrectionByQuestion` — koreksi per soal.
- `CorrectionLeaderboard` — papan peringkat koreksi.
- `ExamQuestionManagement` — kelola kunci jawaban & skor per soal ujian.
- `ItemAnalysisTab` — analisis butir soal (termasuk efektivitas pengecoh untuk pilihan
  ganda).
- `StudentResultDetailPage` — detail hasil per siswa (juga dipakai rute admin).

Fungsi koreksi:
- **Koreksi otomatis** untuk soal objektif (`multiple_choice`, `multiple_selection`,
  `true_false`, `matching`, `sequence`, `arrange_words`, `categorization`).
- Koreksi **manual** untuk soal subjektif (essay, short_answer, math_input,
  arabic_response, javanese_response) dengan `score_earned`, `marking_status`
  (`full`/`partial`/`no`), dan `correction_notes`.
- **Bulk correction** (`/exams/{id}/bulk-correction`).
- **Koreksi AI** (`/exams/{id}/ai-correct`) dengan provider `gemini`, `openrouter`, atau
  `lmstudio` (default dari `VITE_AI_PROVIDER`); mode sasaran: semua jawaban / hanya yang
  belum dikoreksi / per soal / per sesi. Menampilkan progress koreksi.
- `resetObjectiveCorrection` — reset & koreksi ulang soal objektif (tidak memengaruhi
  subjektif).
- `finishCorrection`, `recalculateScore`, `recalculateAllScores`.
- `deleteSession` — hapus sesi siswa.
- `exportResults` — ekspor hasil ujian (blob).

### 6.18 Queue Monitor (Admin)
Halaman: `QueueMonitorPage` (`admin/queue-monitor`, role admin).
Fungsionalitas: memantau antrian job (status running/queued/succeeded/failed), pencarian,
filter status, pagination, serta aksi **retry**, **cancel**, **delete**, dan **purge**
antrian.

### 6.19 Backup & Restore Aset (Admin)
Halaman: `BackupManagementPage` (`admin/backup`, role admin).
Fungsionalitas:
- **Backup aset** (`backupAssetsApi.backupAssets`) → unduh arsip aset (gambar/media).
- **Restore aset** dari file arsip (extract).
- **Backup ujian** (export) dan **restore ujian** per sesi siswa, dengan pratinjau
  (exam backup preview) dan hasil restore (jumlah soal dipulihkan, skor baru).

### 6.20 Dashboard
- `Dashboard.tsx`, `AdminDashboard`, `StudentDashboard`, dan komponen `StatsCard`.
- Admin Dashboard menampilkan statistik: jumlah siswa, kelas, ujian berlangsung, daftar
  ujian berjalan, dan aktivitas terbaru (via data `/dashboard`).
- Skeleton loading untuk UX saat memuat.

---

## 7. Workflow / Alur Kerja (End-to-End)

### 7.1 Alur Persiapan Ujian (Guru/Admin)
1. **Siapkan master data**: tahun akademik → guru → mapel/unit → kelas → siswa.
2. **Buat Bank Soal**: `QuestionBankList` → `CreateQuestionBank`, lalu tambah soal via
   `EditQuestionBank`/`QuestionFormPage` (pilih tipe & atribut, masukkan konten dengan
   editor TipTap + media, tetapkan kunci jawaban).
   - Alternatif: import soal dari Word, gunakan **Math Generator**, atau sertakan
     bahan bacaan.
   - Siapkan reviewer & kelola suggestion bila diperlukan.
3. **Buat Ujian**: `ExamManagementPage` → `EditExamPage`: isi pengaturan ujian, pilih
   subject/kelas/akademik, atur timer, randomisasi, token, publikasi, izin paste, dll.
   Pilih soal-soal yang masuk ke ujian (`exam_questions`).
4. **Publikasikan** ujian (`is_published`) — siswa bisa melihat & mengerjakan.

### 7.2 Alur Pelaksanaan Ujian (Live Monitoring)
1. Siswa membuka `StudentExamsPage` → memilih ujian → masuk ke `ExamTaker`.
2. Siswa mengerjakan soal; jawaban disinkronkan (dengan debounce) dan juga di-queue
   offline bila jaringan terputus.
3. Pengawas membuka `ExamLiveScorePage` untuk memantau skor & progres real-time; bila
   perlu: tambah waktu, force finish, atau reset ujian siswa.
4. Timer strict disinkronkan ke siswa via Reverb (`TimerSynchronized`).

### 7.3 Alur Koreksi & Hasil
1. **Koreksi otomatis** berjalan untuk soal objektif setelah ujian selesai.
2. Guru membuka `ExamCorrectionPage`:
   - Tab **Per Siswa** / **Per Soal** untuk koreksi manual subjektif.
   - Aplikasikan **koreksi AI** (provider tersedia; cakupan semua / uncorrected / soal /
     sesi) lalu pantau progress.
   - Gunakan **bulk correction** untuk menilai banyak jawaban sekaligus.
3. Hitung ulang skor (`recalculate` / `recalculateAllScores`) bila perlu.
4. Tinjau **Item Analysis** untuk kualitas butir soal.
5. **Ekspor hasil** (`exportResults`) untuk diarsipkan/mulai.

### 7.4 Alur Backup & Pemulihan
1. Admin melakukan **backup aset** → unduh arsip media/gambar.
2. Admin dapat **restore aset** dari arsip dan **restore ujian** per sesi siswa
   (mengembalikan jawaban & skor).

### 7.5 Alur Pemantauan Antrian
1. Job backend (mis. AI correction, import, ekspor) dicatat di queue monitor.
2. Admin memantau, me-*retry* job gagal, membatalkan job berjalan, menghapus/purge record.

---

## 8. Entitas / Model Data Utama (Konteks Frontend)

Dari definisi tipe pada `src/lib/api.ts` dan `api.json`:

| Entitas          | Field utama |
|------------------|-------------|
| `User`           | id, name, username, email, avatar, role/user_type, email_verified_at |
| `AcademicYear`   | id, year, semester, user |
| `Classroom`      | id, name, code, level, user, academic_year, students_count, students |
| `Subject`        | id, name, teacher(s), kelas, unit |
| `QuestionBank`   | bank soal + reviewer & saran |
| `Question`       | content, type, difficulty, timer, score, hint, reading_material_id, tags, media, options, key_answer |
| `QuestionOption` | option_key, content, order, is_correct, media, metadata (side/pair/match_with) |
| `ReadingMaterial`| title, content, media |
| `Exam`           | title, type, duration, timer_type, token, kelas, publikasi, randomisasi, passing_score, dll. |
| `ExamQuestion`   | question_number, content, options, key_answer, score_value, question_type, difficulty |
| `ExamSession`    | status, start_time, remaining_time, extra_time, score, progress, history |
| `QuestionSuggestion` | question_id, data, description, state (pending/approved/rejected) |
| `QuestionBankReviewer` | rating, notes, state, suggested_questions_count |
| `QueueMonitor`   | status (running/queued/succeeded/failed), progress, job info |
| `DashboardData`  | stats (students/classrooms/ongoing exams), ongoing_exams, recent_activities |

---

## 9. API Backend (REST) — Digunakan Frontend

Base URL: `VITE_API_URL`. Seluruh request memakai Auth Bearer token.

### Auth
- `POST /login`, `POST /register`, `POST /logout`, `GET /me`
- `POST /forgot-password`, `POST /reset-password`
- `POST /email/verify/{id}/{hash}`, `POST /email/resend`

### Master Data / Akademik
- `/academic-years`, `/classrooms`, `/teachers`, `/students`, `/subjects`,
  `/subject-units`, `/students/search`, `/subjects/search`

### Bank Soal & Soal
- `/question-banks` (+ `/mine`, `/public`, `/trashed`, `/restore`, `/force-delete`,
  `/{id}/import`, `/{id}/export`, `/{id}/questions`)
- `/question-bank-reviewers` (+ `/mine`, `/public`, approve/reject)
- `/questions` (+ `/import-template`, `/import`)
- `/question-suggestions` (+ `/mine`, approve/reject)
- `/tags`

### Reading Materials
- `/reading-materials` (CRUD)

### Ujian & Sesi
- `/exams` (CRUD, bulk-delete, trashed/restore/force-delete, regenerasi token)
- `/exams/{id}/sessions`, `/exams/{id}/live-score`
- Aksi per siswa: `/exams/{id}/reset`, `force-finish`, `add-time`, `reopen`
- Jawaban: `/exams/{id}/sessions/{sid}/details/{did}/answer` (PUT), `/restore`,
  `/check-integrity`
- Soal ujian: `/exam-questions` (bulk-update, bulk-delete)

### Koreksi
- `/exams/{id}/bulk-correction`
- `/sessions/{sid}/details/{did}` (PUT correction)
- `/sessions/{sid}/finish-correction`, `/sessions/{sid}/recalculate`
- `/exams/{id}/recalculate-all`, `/exams/{id}/item-analysis`
- `/exams/{id}/ai-correct`, `/exams/{id}/correction-progress`
- `/exams/{id}/reset-objective-correction`, `/exams/{id}/export-results`

### Admin Tools
- `/queue-monitor` (+ retry, cancel, delete, purge)
- Backup/restore aset & ujian (`backupAssetsApi`)
- `/dashboard` (statistik & aktivitas)

---

## 10. Persyaratan Non-Fungsional

- **Responsivitas**: UI responsif mobile & desktop (sidebar dapat disembunyikan).
- **Keamanan**: autentikasi Bearer token, header keamanan Nginx, pemblokiran paste &
  deteksi pelanggaran di ujian.
- **Kinerja**: pembangunan dioptimalkan Vite; caching aset statis & gzip di Nginx.
- **Real-time**: WebSocket (Reverb/Laravel Echo) untuk timer & live score.
- **Ketahanan**: mode offline dengan antrian sinkronisasi jawaban di `localStorage`.
- **Aksesibilitas peran**: routing dilindungi role (admin/teacher/student).

---

## 11. Command / Cara Menjalankan

```bash
# Development (Vite dev server, port 5173)
npm run dev

# Build produksi (tsc + vite build)
npm run build

# Lint
npm run lint

# Preview build
npm run preview

# Deploy (Docker compose, port 8080)
docker-compose up --build
```

---

## 12. Riwayat Peningkatan Utama (dari Git Log)

- Koreksi AI dengan mode cakupan (all / uncorrected / per soal / per sesi).
- Penyesuaian logika timer ketat & tampilan sisa waktu di Live Score.
- Fitur pelaporan pelanggaran ujian & anti-cheat dengan pembaruan UI.
- Pemblokiran paste pada jawaban essay & jawaban singkat.
- Modul matematika generator (konfigurasi, pratinjau, simpan).
- Dashboard koreksi ujian; koreksi per siswa / per soal / leaderboard / item analysis.
- Ekspor hasil ujian & halaman detail hasil siswa.
- RichTextEditor berbasis TipTap dengan ekstensi matematika, Arab, dan Jawa.
- Modul bank soal, reviewer, saran soal, bahan bacaan, queue monitor, dan backup.
- Build pipeline Docker (Node 20 → Nginx) dengan dukungan WebSocket Reverb.

---

*Dokumen PRD ini disusun berdasarkan analisis kode pada repositori `lunar-pinwheel`
(commit terakhir `596ee23`). Seluruh rincian berorientasi pada implementasi frontend
yang terlihat pada direktori `src/`, `api.json`, serta konfigurasi build & deploy.*