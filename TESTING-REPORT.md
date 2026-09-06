# Laporan Testing & Debug — lunar-pinwheel (Frontend React/Vite)

> Tanggal: 2026-08-29
> Scope: Build, lint, konfigurasi, alur login 3 role, manajemen & seleksi tahun akademik, konsumsi API backend + math engine.
> Catatan: **Tidak ada revisi kode yang dilakukan** — ini hanya laporan temuan.
> Environment: `npm run build` (vite 7), `npx eslint`, `.env` → `VITE_API_URL=http://127.0.0.1:8000/api/v1`.

---

## 1. Ringkasan Eksekusi

| Area | Status |
|---|---|
| `npm run build` | ✅ Sukses (exit 0), tapi bundle ~2.3MB tanpa code-splitting |
| `npm run lint` | ❌ Gagal total — config eslint import package yang tidak terinstal (BUG-01) |
| Login & token (admin/guru/siswa) via axios | ✅ OK |
| Manajemen Academic Year (CRUD UI) | ✅ OK (parsing nested `data.data` + `meta` sudah benar) |
| **Seleksi tahun akademik (selector global)** | ❌ Client-only, tidak pernah persist ke server (BUG-02) |
| Konsumsi math-generate | ✅ Endpoint URL benar (`/math-generate/*`) |

---

## 2. Daftar Bug / Masalah

### 🔴 BUG-01 — `npm run lint` rusak: `typescript-eslint` tidak ada di dependencies
- **File:** `eslint.config.js` (baris ~5) vs `package.json`
- **Bukti:** `npx eslint .` → `ERR_MODULE_NOT_FOUND: Cannot find package 'typescript-eslint'`. Package tidak ada di `devDependencies` maupun `node_modules`.
- **Dampak:** Seluruh quality-gate lint non-fungsional; error styling/typo tidak pernah tertangkap di CI/dev.

### 🔴 BUG-02 — Ganti tahun akademik hanya mengubah state client, tapi menampilkan toast sukses (menyesatkan)
- **File:** `src/contexts/AcademicYearContext.tsx` (`setSelectedYearId`, baris 104–127)
- **Fakta kode:**
  - Hanya `setState` + `localStorage.setItem('selectedAcademicYearId', id)` + `await sleep(300)`.
  - **Tidak ada call API sama sekali**, lalu menampilkan toast `success: 'Academic Year Updated — Active academic year changed locally.'`.
- **Dampak (skenario "pengaturan tahun akademik berbeda"):**
  - Admin/guru mengira tahun aktif sudah diganti "di sistem", padahal hanya di browser itu.
  - Tahun yang dipilih tidak sama antar device/browser; guru mengajar dengan anggapan yang salah.
  - Kombinasi dengan tidak adanya konsep tahun aktif server-side (BUG-09 backend) → fitur "tahun akademik aktif" saat ini murni ilusi UI.
- **Catatan tambahan di file yang sama:** komentar baris 129–132 mengakui jika `selectedYearId` tersimpan (localStorage) tidak ada dalam daftar yang dimuat (mis. >10 tahun, pagination context per_page=10), `selectedYear` jadi `null` → selector tampil kosong padahal filter masih aktif.

### 🟠 BUG-03 — Sync halaman terhadap perubahan tahun tidak konsisten
- **Fakta kode (grep `useAcademicYear`):** hanya sebagian halaman yang bereaksi terhadap `selectedYearId`.
  - ✅ `pages/admin/exams/ExamManagementPage.tsx` — re-fetch saat `selectedYearId` berubah (`useEffect [selectedYearId]`).
  - ✅ `components/admin/question-banks/QuestionBankSettingsModal.tsx` — mengirim `academic_year_id` saat fetch subjects.
  - ❌ Halaman lain (mis. Classroom Management, dsb.) tidak men-subscribe context, jadi isinya tetap dari tahun lama sampai di-refresh manual.
- **Dampak:** Setelah ganti tahun, sebagian menu menampilkan data tahun baru, sebagian masih tahun lama — konsistensi data antar-halaman rusak.
- **✅ FIXED (Fase 3, repo ini — FE-03):** `src/layouts/AdminLayout.tsx` membungkus `<Outlet />` dengan `key={selectedYearId ?? 'no-year'}` — pergantian tahun me-remount seluruh konten halaman sehingga semua fetch list/detail dijalankan ulang dengan filter tahun baru (header/sidebar sengaja di luar elemen berkunci). Build sukses (46s).

### 🟠 BUG-04 — `PaginatedResponse<T>` didefinisikan salah (meta sejajar data)
- **File:** `src/lib/api.ts` (interface `PaginatedResponse<T>`)
- **Fakta:** interface menuntut `{ success, message, data: T[], meta }` — padahal backend membungkus pagination **di dalam** `data` (`data.data` + `data.meta`, sesuai `ApiController::success`).
- **Dampak:** Semua pemanggil generik yang percaya interface ini akan membaca `meta` di level yang salah (`undefined`) → pagination tidak jalan. Halaman-halaman saat ini "selamat" karena masing-masing men-cast `as any` dan membaca `result.meta` (nested) secara manual — pola rapuh dan duplikatif.

### 🟠 BUG-05 — Typing ID tidak konsisten: `user_id` dianggap integer di request, string di resource
- **File:** `src/lib/api.ts` — komentar eksplisit di interface `AcademicYear` ("integer in request, string/ulid in resource? Check schema") dan `UpdateClassroomRequest.user_id?: string | null`.
- **Fakta backend:** semua ID adalah ULID string 26 char; `StoreAcademicYearRequest` memvalidasi `'user_id' => ['required','ulid']`.
- **Dampak:** Risiko dev mengirim number (ULID kehilangan presisi bila pernah dikonversi via Number) dan TypeScript tidak membantu menangkapnya. Perlu dirapikan ke `string` di semua request type.

### 🟡 BUG-06 — `AcademicYear.year` tidak divalidasi format `YYYY/YYYY` di client
- **File:** `components/admin/academic-year/AcademicYearModal.tsx` — hanya `z.string().min(4)`.
- **Dampak:** "2023" atau "abc/def" lolos validasi client; backend hanya `max:20` juga tidak memvalidasi pola. Duplikat (year+semester sama) juga bisa dibuat (lihat BUG-09 backend) dan UI tidak memberi pesan bermakna selain generic error.

### 🟡 BUG-07 — Search Academic Year re-fetch dengan nilai kosong saat pertama mount
- **File:** `pages/admin/AcademicYearManagement.tsx` (baris 76–84)
- **Fakta:** `useEffect [searchQuery]` langsung jalan saat mount; `searchQuery` awal `''` dan kondisinya `if (searchQuery !== undefined)` selalu true → fetch ganda (fetch awal `useEffect []` + fetch kedua 300ms kemudian).
- **Dampak:** Request duplikat kecil tiap kali halaman dibuka; race condition ringan mungkin.

### 🟡 BUG-08 — `api.ts` satu file raksasa (~1500+ baris) dengan duplikasi
- **Fakta:** semua API domain ditumpuk dalam satu file; interface `User`/`Teacher`/`Student` tumpang tindih; banyak `params?: any` (tanpa type).
- **Dampak:** Sulit dirawat, mudah terjadi drift kontrak dengan backend (sudah terlihat di BUG-04/05).

### ⚪ PERF-01 — Bundle besar tanpa code-splitting
- **Bukti build:** peringatan Vite — satu chunk JS ~2.3MB (limit 500kB) + aset font material-symbols ~12MB.
- **Dampak:** First-load lambat, terutama jaringan sekolah. Pertimbangkan route-level lazy loading + subset font.

### ⚪ PERF-02 — Toast + dialog campur library (sweetalert2 dan custom toast) untuk alur yang sama
- **Fakta:** context pakai dynamic-import `sweetalert2`, halaman lain pakai `MySwal.mixin` toast; tidak ada mekanisme toast global yang seragam.
- **Dampak:** UX tidak konsisten; ukuran bundle bertambah (dua library dialog).

---

## 3. Skenario Login yang Diuji (hasil)
| Role | Kredensial | Hasil |
|---|---|---|
| Admin | admin@example.com / password | ✅ Login OK, dashboard admin jalan |
| Guru | teguh@example.com / password (Teguh Permadi) | ✅ Login OK |
| Siswa kelas 6 | student6@miarridlo.sch.id / password | ✅ Login OK |

Semua token disimpan & dipakai untuk verifikasi endpoint (lihat `e:\laragon\www\cbtapp\tokens\`).

## 4. Rekomendasi Prioritas
1. ~~Putuskan arsitektur "tahun akademik aktif"~~ → **Selesai** (Fase 3): flag `is_active` di server + `set-active` endpoint; selector tinggal memanggilnya (FE-02) dan re-fetch menyeluruh (FE-03) menyusul.
2. ~~Install/perbaiki `typescript-eslint` agar lint jalan~~ → **Selesai** (FE-06): config kini memakai parser/plugin yang terinstal; lint berjalan dengan 550 temuan pre-existing.
3. Betulkan `PaginatedResponse` dan typing ULID (BUG-04, BUG-05).
4. Optimasi bundle (PERF-01) setelah bug fungsional beres.
---

## 5. Perbaikan yang Diterapkan di Repo Ini (2026-09-06)

### eslint.config.js (lint hidup kembali — FE-06)
| File | Perubahan |
|---|---|
| `eslint.config.js` | Import `typescript-eslint` (paket yang **tidak terinstal**) diganti `@typescript-eslint/parser` + `@typescript-eslint/eslint-plugin` (sudah ada di node_modules). `npm run lint` kini berjalan: **550 temuan pre-existing** (`no-explicit-any` dsb.) — keduanya style, bukan error konfigurasi. Tidak ada dependensi baru yang ditambahkan |
| `src/contexts/AcademicYearContext.tsx`, `src/lib/api.ts` | **FE-02 selesai**: `academicYearApi.setActive(id)` (POST `/academic-years/{id}/set-active`) dipanggil oleh `setSelectedYearId` — tahun aktif kini **persist ke server**; state + localStorage hanya diperbarui saat sukses, gagal → toast error; pilihan default kini memakai `is_active` dari server (bukan tebakan lokal) |

### Kontrak backend baru untuk tahun akademik (Opsi A — flag di server)
Backend kini punya `academic_years.is_active` + `POST /academic-years/{id}/set-active`, dan endpoint `mine` (classroom/subject) memakai fallback tahun aktif bila `academic_year_id` tidak dikirim.

### FE-03 selesai: propagasi re-fetch saat tahun berganti
- `src/layouts/AdminLayout.tsx`: elemen berkunci di sekitar `<Outlet />` — pergantian tahun akademik me-remount semua halaman admin, memicu fetch ulang dengan filter tahun baru tanpa harus mengubah tiap halaman satu per satu.

### Masih terbuka (menyusul)
- Menampilkan indikator "tahun aktif" (dari `is_active`) di header/selector.
- Bersih-bersih 550 temuan lint pre-existing (kini terlihat karena lint sudah jalan).
- PERF-01 (code-splitting), PERF-02 (duplikasi toast/dialog), serta BUG-04 s/d BUG-08 (typing & UX kecil).

### Verifikasi build setelah perubahan
- `npm run build` → **sukses** (run pertama 1m 20s; run terakhir setelah FE-03: 46s); bundle ~2.3MB (PERF-01 masih terbuka, hanya tercatat).


