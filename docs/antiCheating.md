# Spesifikasi Frontend Anti-Cheating

## Keystroke Dynamics dan Behavioral Typing Analytics

**Aplikasi:** `lunar-pinwheel`  
**Stack:** React 18, TypeScript, Axios, Vite  
**Backend contract:** `cbt-app-api/docs/antiCheating.md`  
**Status fitur:** Toggleable, configurable, dan advisory

Dokumen ini menjelaskan implementasi sisi frontend. Kontrak backend adalah
sumber kebenaran untuk nama field, endpoint, status analisis, batas payload,
dan aturan keamanan. Frontend tidak menghitung keputusan kecurangan dan tidak
boleh menganggap metrics sebagai bukti yang tidak dapat dimanipulasi.

---

## 1. Tujuan dan Batasan

Frontend hanya bertugas:

1. membaca setting analytics dari payload ujian;
2. merekam sinyal pengetikan secara lokal pada input teks;
3. mengagregasi sinyal menjadi `typing_metrics`;
4. mengirim metrics bersama payload jawaban;
5. menjaga autosave, offline queue, dan UX ujian tetap berjalan.

Frontend **tidak** boleh:

- menyimpan raw keydown/keyup events secara permanen;
- mengirim karakter tombol, isi clipboard, audio, atau video;
- menentukan bahwa siswa pasti curang;
- menghapus session atau jawaban karena anomaly score;
- mengirim `user_id` sebagai sumber identitas;
- mengubah endpoint `violation` untuk keystroke anomaly.

Fitur membuka aplikasi lain, paste, dan tab-switch yang sudah ada adalah
mekanisme terpisah. Keystroke analytics tidak menggantikan mekanisme tersebut.

---

## 2. Pemetaan ke Kode Frontend Saat Ini

| Tanggung jawab | Lokasi saat ini |
|---|---|
| Halaman pengerjaan | `src/pages/student/ExamTaker.tsx` |
| Axios client | `src/lib/api.ts` |
| API student | `studentApi` pada `src/lib/api.ts` |
| Ambil data ujian | `studentApi.takeExam(id)` |
| Simpan jawaban | `studentApi.answerQuestion(id, data)` |
| Finish ujian | `studentApi.finishExam(id)` |
| Pelaporan violation eksplisit | `studentApi.reportExamViolation(id, data)` |
| Input essay student | `src/components/questions/student-inputs/StudentEssayInput.tsx` |
| Offline pending answers | `exam_{id}_pending_answers` di localStorage |
| Cache ujian | `exam_{id}_cache_data` di localStorage |
| Metadata paste/tab-switch | field `metadata` pada payload answer |

`ExamTaker` saat ini sudah melakukan debounce/autosave, retry offline, dan
sinkronisasi berurutan ketika online kembali. Integrasi analytics harus
memakai pipeline payload yang sama, bukan membuat request paralel baru untuk
setiap event keyboard.

---

## 3. Konfigurasi yang Dibaca dari Backend

Backend akan mengirim setting berikut pada `ExamResource`:

```ts
interface ExamIntegritySettings {
  enable_keystroke_analytics?: boolean;
  min_char_keystroke_threshold?: number;
  is_paste_allowed?: boolean;
  is_open_other_apps_allowed?: boolean;
}
```

Frontend hanya mengetahui setting per ujian. Master switch global
`CBT_KEYSTROKE_ENABLED` berada di backend dan tidak dikirim ke browser.
Dengan demikian, kondisi efektif frontend adalah:

```ts
const isKeystrokeAnalyticsEnabled =
  exam?.enable_keystroke_analytics === true;
```

Jika field belum dikirim oleh backend, perlakukan analytics sebagai **nonaktif**
untuk mencegah frontend mengumpulkan data sebelum kontrak backend siap.

Threshold yang dipakai frontend hanya untuk menghemat kerja capture dan
request. Backend tetap menghitung panjang jawaban dari `answer` dan tetap
menjadi otoritas akhir.

```ts
const minChars = exam?.min_char_keystroke_threshold ?? 150;
const shouldCapture = isKeystrokeAnalyticsEnabled && answer.length >= minChars;
```

Jangan memakai `typing_metrics.total_keystrokes` untuk menentukan panjang
jawaban.

---

## 4. Kontrak API

Wrapper yang digunakan:

```ts
studentApi.answerQuestion(examId, payload);
```

Request:

```http
POST /api/v1/students/exams/{exam}/answer
Content-Type: application/json
Authorization: Bearer <token>
```

Payload minimum yang tetap kompatibel:

```ts
interface SaveAnswerPayload {
  question_id: string; // ID ExamResultDetail, bukan ExamQuestion
  answer: unknown;
  is_flagged?: boolean;
  metadata?: Record<string, unknown>;
  typing_metrics?: TypingMetrics;
}
```

Payload keystroke:

```ts
interface TypingMetrics {
  schema_version: 1;
  is_analyzed: true;
  total_keystrokes: number;
  avg_dwell_time_ms: number;
  avg_flight_time_ms: number;
  backspace_count: number;
  delete_count: number;
  correction_ratio: number;
  long_pauses_count: number;
  pause_positions: number[];
  wpm_estimated: number | null;
  capture_started_at: string;
  capture_duration_ms: number;
}
```

Contoh request:

```json
{
  "question_id": "01J...",
  "answer": "Pendapatan nasional adalah ...",
  "is_flagged": false,
  "metadata": {
    "tab_switches": 0
  },
  "typing_metrics": {
    "schema_version": 1,
    "is_analyzed": true,
    "total_keystrokes": 184,
    "avg_dwell_time_ms": 82.4,
    "avg_flight_time_ms": 145.1,
    "backspace_count": 3,
    "delete_count": 0,
    "correction_ratio": 0.016,
    "long_pauses_count": 4,
    "pause_positions": [12, 45, 88],
    "wpm_estimated": 42.5,
    "capture_started_at": "2026-09-09T12:00:00.000Z",
    "capture_duration_ms": 265000
  }
}
```

`question_id` adalah ID detail jawaban dari `take` (`q.id` pada data yang
ditampilkan), bukan `q.exam_question.id`.

### Aturan pengiriman

- Untuk soal non-teks, jangan kirim `typing_metrics`.
- Untuk fitur nonaktif, jangan kirim `typing_metrics`.
- Untuk jawaban di bawah threshold, boleh tidak mengirim metrics.
- Untuk metrics invalid atau capture tidak lengkap, lebih aman tidak mengirim
  metrics daripada mengirim angka buatan.
- `metadata` yang sudah dipakai untuk paste/tab-switch harus tetap dipertahankan.
- `typing_metrics` adalah field top-level, bukan dimasukkan ke
  `metadata.anti_cheating`.
- Jangan membuat request khusus per `keydown` atau `keyup`.

---

## 5. Desain Hook `useKeystrokeAnalytics`

Implementasikan hook terisolasi, misalnya:

```text
src/hooks/useKeystrokeAnalytics.ts
```

Hook tidak menyimpan event mentah di React state. Gunakan `useRef` untuk
buffer sementara dan kembalikan API minimal:

```ts
interface UseKeystrokeAnalyticsOptions {
  enabled: boolean;
  minCharThreshold: number;
}

interface UseKeystrokeAnalyticsResult {
  onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => void;
  onKeyUp: (event: React.KeyboardEvent<HTMLElement>) => void;
  getMetrics: (answer: string) => TypingMetrics | undefined;
  reset: () => void;
}
```

### Data sementara yang boleh direkam

Di memory saja:

- timestamp keydown terakhir;
- timestamp keyup terakhir;
- jumlah keystroke;
- jumlah backspace/delete;
- total dwell time;
- total flight time;
- jumlah jeda di atas `long_pause_ms`;
- posisi karakter saat jeda;
- waktu capture dimulai.

Jangan menyimpan:

- `event.key`;
- isi karakter;
- clipboard;
- URL atau isi halaman lain;
- password atau data di luar textarea target.

### Perhitungan

Untuk key yang relevan:

```text
dwell = keyup_timestamp - keydown_timestamp
flight = current_keydown_timestamp - previous_keyup_timestamp
correction_ratio =
  (backspace_count + delete_count) / max(total_keystrokes, 1)
```

Aturan implementasi:

- abaikan modifier murni (`Shift`, `Control`, `Alt`, `Meta`);
- gunakan `performance.now()` untuk interval, bukan jam sistem;
- gunakan `Date.toISOString()` hanya untuk `capture_started_at`;
- clamp interval negatif atau tidak wajar;
- hitung `pause_positions` berdasarkan panjang teks saat event terjadi;
- batasi jumlah pause yang disimpan agar payload tetap kecil;
- `wpm_estimated` boleh `null` jika durasi atau jumlah karakter belum cukup.

Hook harus aman ketika `enabled` berubah dari `true` menjadi `false`: buffer
di-reset dan tidak ada metrics yang dikirim pada save berikutnya.

---

## 6. Integrasi pada Input Jawaban

Analytics hanya dipasang pada komponen jawaban teks, terutama:

- essay;
- short answer;
- language response jika input akhirnya berupa teks;
- tipe lain hanya jika secara eksplisit menggunakan textarea teks.

Jangan memasang hook pada seluruh `ExamTaker`, karena input pilihan ganda,
matching, math, dan sequence tidak memiliki pola pengetikan essay yang sama.

Contoh integrasi konseptual:

```tsx
const analytics = useKeystrokeAnalytics({
  enabled: exam?.enable_keystroke_analytics === true,
  minCharThreshold: exam?.min_char_keystroke_threshold ?? 150,
});

<textarea
  value={value}
  onChange={handleChange}
  onKeyDown={analytics.onKeyDown}
  onKeyUp={analytics.onKeyUp}
/>;
```

Komponen input tetap mengirim perubahan nilai ke parent seperti sebelumnya.
Hook hanya menambah sumber metrics; hook tidak boleh mengambil alih state
jawaban.

Jika komponen saat ini memakai callback `onChange` yang langsung memanggil
handler `ExamTaker`, integrasikan pengumpulan metrics di level komponen input
atau wrapper input, lalu berikan hasilnya ke pipeline save. Jangan membuat
request dari dalam hook.

---

## 7. Integrasi dengan Autosave dan Offline Queue

Payload final harus dibentuk di satu tempat sebelum dikirim atau dimasukkan ke
offline queue:

```ts
function buildAnswerPayload(question: QuestionState): SaveAnswerPayload {
  const payload: SaveAnswerPayload = {
    question_id: question.id,
    answer: question.student_answer,
    is_flagged: question.is_flagged,
    metadata: buildExistingMetadata(question),
  };

  const metrics = question.typingAnalytics?.getMetrics(
    typeof question.student_answer === 'string'
      ? question.student_answer
      : ''
  );

  if (metrics) {
    payload.typing_metrics = metrics;
  }

  return payload;
}
```

### Aturan queue

1. Jika online, kirim melalui `studentApi.answerQuestion`.
2. Jika offline, simpan payload final ke antrean yang sudah ada.
3. Metrics ikut disimpan hanya sebagai snapshot payload pending; jangan
   menyimpan buffer raw events ke localStorage.
4. Saat request berhasil, hapus item pending.
5. Setelah sinkronisasi berhasil, reset buffer metrics untuk soal tersebut.
6. Jika request gagal, pertahankan payload terakhir yang lengkap.
7. Jangan menggabungkan `typing_metrics` dari beberapa autosave secara manual.
   Setiap request mewakili metrics agregat sejak reset terakhir.

Payload pada `localStorage` adalah data siswa dan harus diperlakukan sebagai
cache yang dapat dibaca pengguna. Jangan menaruh token, raw events, atau data
sensitif tambahan di dalamnya.

Jika ukuran payload mendekati batas backend, buang metrics dari retry payload
dan tetap pertahankan `answer`; jawaban tidak boleh hilang hanya karena
analytics gagal.

---

## 8. Paste, Tab-Switch, dan External App

Mekanisme yang sudah ada harus dipertahankan:

- `is_paste_allowed` mengontrol perilaku paste;
- `is_open_other_apps_allowed` mengontrol pelaporan violation;
- `metadata.paste_count`, `metadata.is_pasted`, dan `metadata.tab_switches`
  tetap memakai nama yang sudah disepakati backend;
- `clear_paste_metadata` tetap dipakai hanya untuk alur pembersihan metadata
  yang sudah ada.

Keystroke analytics tidak boleh:

- mengubah `tab_switches` menjadi `typing_metrics`;
- memanggil `reportExamViolation` ketika anomaly score belum diketahui;
- menghapus jawaban lokal;
- menampilkan pesan bahwa siswa pasti curang.

Violation eksternal tetap mengikuti aturan UI yang sudah ada dan endpoint:

```ts
studentApi.reportExamViolation(examId, {
  reason,
  source: 'external_app_or_tab_switch',
});
```

---

## 9. UX dan Status di Sisi Siswa

Siswa tidak perlu melihat anomaly score, baseline, atau formula scoring.
Frontend cukup menampilkan status operasional:

- analytics aktif atau tidak;
- jawaban tersimpan atau menunggu sinkronisasi;
- koneksi offline;
- metrics tidak tersedia karena jawaban terlalu pendek (opsional, bukan error);
- error penyimpanan jawaban.

Jangan menampilkan label “curang”, “joki”, atau “didikte” kepada siswa.
Anomaly result hanya untuk dashboard guru/admin melalui resource backend yang
sesuai authorization.

Kegagalan analytics harus non-blocking:

```text
capture gagal -> tetap simpan answer
metrics invalid -> tetap simpan answer
endpoint analytics gagal -> tetap pertahankan answer
```

---

## 10. Lifecycle dan Reset

Reset buffer pada kondisi berikut:

1. jawaban berhasil disimpan dan metrics sudah menjadi bagian request;
2. siswa berpindah soal jika kebijakan autosave menetapkan satu capture per
   soal;
3. session selesai;
4. session di-reset karena `violation` eksplisit;
5. analytics dinonaktifkan oleh setting ujian;
6. unmount halaman untuk mencegah kebocoran referensi event.

Jangan reset buffer hanya karena render React biasa. Semua listener harus
dibersihkan saat unmount.

Untuk reload offline, jawaban dari cache boleh dipulihkan, tetapi raw typing
buffer tidak dipulihkan. Capture baru dimulai setelah input kembali aktif.

---

## 11. TypeScript dan API Layer

Perbarui tipe di `src/lib/api.ts` secara eksplisit:

```ts
export interface TypingMetrics {
  schema_version: 1;
  is_analyzed: true;
  total_keystrokes: number;
  avg_dwell_time_ms: number;
  avg_flight_time_ms: number;
  backspace_count: number;
  delete_count: number;
  correction_ratio: number;
  long_pauses_count: number;
  pause_positions: number[];
  wpm_estimated: number | null;
  capture_started_at: string;
  capture_duration_ms: number;
}

export interface SaveAnswerPayload {
  question_id: string;
  answer: unknown;
  is_flagged?: boolean;
  metadata?: Record<string, unknown>;
  typing_metrics?: TypingMetrics;
}
```

Ubah signature `answerQuestion` dari `data: any` menjadi
`data: SaveAnswerPayload` setelah seluruh call site disesuaikan. Untuk payload
soal non-teks, `typing_metrics` tetap optional.

Tambahkan ke `Exam`:

```ts
enable_keystroke_analytics?: boolean;
min_char_keystroke_threshold?: number;
```

Tidak perlu membuat endpoint baru untuk analytics. Endpoint answer yang sudah
ada adalah kontrak pengiriman.

---

## 12. Validasi Lokal Sebelum Request

Validasi lokal hanya untuk mencegah payload rusak; validasi backend tetap wajib.

Checklist:

- `schema_version === 1`;
- `is_analyzed === true`;
- semua angka finite;
- semua angka tidak negatif;
- `correction_ratio` berada pada `0..1`;
- `pause_positions` adalah array integer;
- posisi pause tidak melebihi panjang answer;
- `capture_duration_ms` masuk akal;
- `pause_positions` tidak melebihi batas jumlah;
- serialized payload tidak melebihi batas yang ditentukan backend.

Jika validasi gagal, hilangkan `typing_metrics` dari payload dan log error
teknis secara lokal tanpa menghentikan save answer. Jangan mengubah answer untuk
memaksa metrics menjadi valid.

---

## 13. Testing Frontend

### Unit test hook

Uji:

1. disabled tidak merekam dan tidak menghasilkan metrics;
2. modifier keys tidak menambah keystroke;
3. dwell time dihitung dari keydown/keyup;
4. flight time dihitung antar key;
5. backspace/delete menambah correction count;
6. pause di atas threshold terhitung;
7. correction ratio tidak membagi dengan nol;
8. buffer reset menghapus metrics;
9. metrics tidak mengandung karakter tombol;
10. angka outlier tidak masuk payload.

### Component test

Uji:

1. hanya input teks yang memasang capture;
2. input pilihan tidak menghasilkan `typing_metrics`;
3. setting ujian nonaktif tidak mengirim metrics;
4. jawaban pendek tetap tersimpan;
5. save answer tetap berjalan ketika capture gagal;
6. metadata paste/tab-switch tidak hilang;
7. berpindah soal tidak mencampur buffer dua soal.

### Integration test API

Uji:

1. online answer mengirim payload sesuai kontrak;
2. offline answer masuk queue;
3. reconnect mengirim ulang berurutan;
4. request gagal mempertahankan answer;
5. finish membersihkan cache tanpa mengirim request metrics tambahan;
6. violation eksplisit tetap memakai endpoint dan payload lama.

Validasi dengan script yang sudah tersedia:

```bash
npm run lint
npm run build
```

---

## 14. Urutan Implementasi

### Tahap 1 - Kontrak tipe

- Tambahkan `TypingMetrics` dan `SaveAnswerPayload`.
- Tambahkan dua field analytics ke interface `Exam`.
- Ubah `answerQuestion` agar typed.

### Tahap 2 - Hook capture

- Buat `useKeystrokeAnalytics`.
- Tambahkan sanitasi dan batas numeric.
- Tambahkan test hook.

### Tahap 3 - Integrasi input

- Integrasikan pada `StudentEssayInput`.
- Evaluasi short answer dan language response.
- Pastikan input objektif tidak terpengaruh.

### Tahap 4 - Integrasi ExamTaker

- Gabungkan metrics dengan payload autosave yang sudah ada.
- Pertahankan metadata paste/tab-switch.
- Pertahankan offline queue dan retry.
- Reset buffer setelah keberhasilan sync.

### Tahap 5 - Rollout

- Deploy setelah backend migration dan endpoint siap.
- Backend global switch tetap menjadi rollback utama.
- Aktifkan per ujian setelah staging test berhasil.

---

## 15. Acceptance Criteria Frontend

Implementasi frontend dianggap sesuai jika:

1. Analytics hanya aktif ketika `exam.enable_keystroke_analytics === true`.
2. Threshold diambil dari `min_char_keystroke_threshold`.
3. Metrics hanya dikirim sebagai `typing_metrics` top-level.
4. `question_id` yang dikirim adalah ID `ExamResultDetail`.
5. Tidak ada raw key event, karakter tombol, atau clipboard yang dikirim.
6. Soal non-teks tidak mengirim metrics.
7. Jawaban pendek tetap tersimpan normal.
8. Metrics invalid tidak menggagalkan penyimpanan jawaban.
9. Offline queue tetap menyimpan dan mengirim payload terakhir.
10. Metadata paste/tab-switch tidak tertimpa.
11. Keystroke anomaly tidak memanggil endpoint `violation`.
12. Siswa tidak melihat anomaly score atau label kecurangan.
13. Buffer reset pada save, finish, violation, unmount, dan disable.
14. `npm run lint` dan `npm run build` berhasil.
15. Kontrak payload konsisten dengan `cbt-app-api/docs/antiCheating.md`.
