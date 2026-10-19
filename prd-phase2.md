# PRD: Halaman Create (Image, Video, Audio, Brief) & Galeri Hasil Generate

**Versi:** v1.0
**Tanggal:** 18 Oktober 2026
**Status:** Ready for implementation

## Ringkasan
Empat halaman pembuatan konten pada platform AI untuk content creator: **Create Image**, **Create Video**, **Create Audio**, dan **Create Brief**. Semua halaman memakai pola yang sama: kotak prompt bergaya chat (ala ChatGPT/Gemini/Claude/Dreamina) dengan konfigurasi dan info kuota harian di atas, lalu galeri hasil generate seluruh user workspace di bawahnya dalam tata letak bento grid dengan auto-load 10 item. Klik item membuka popup detail (hasil di kiri, informasi di kanan) dengan tombol "Buat serupa" yang mengisi ulang prompt dan konfigurasi.

## Tujuan
- Creator bisa membuat image, video, audio, dan brief dari satu pola antarmuka yang konsisten
- Creator bisa melihat dan terinspirasi dari hasil generate seluruh tim, serta mengulang resep (prompt + konfigurasi) dengan satu klik
- Pemakaian terkendali lewat kuota harian per user per jenis

---

## Goals
- Empat halaman Create dengan composer + galeri bento + popup detail
- Konfigurasi yang sesuai konteks tiap jenis (rasio/kualitas/dimensi untuk image, durasi/resolusi untuk video, suara/bahasa untuk audio, jenis konten/platform/tone untuk brief)
- Galeri bersama seluruh workspace dengan infinite scroll (10 item per muat)
- Kuota harian per user per jenis, terlihat jelas dan ditegakkan di server

## Non-Goals (Out of Scope v1)
- Editor pascageneratif (edit layer, trim, dll) dan ekspor lanjutan (dibahas di PRD terpisah)
- Generate beberapa hasil sekaligus dalam satu perintah (v1: 1 hasil per generate)
- Image-to-image / referensi gambar pada Create Image (video mendukung start frame, lihat FR-VID-4)
- Musik dan sound effect pada Create Audio (v1 hanya text-to-speech)
- Like, komentar, folder/koleksi, dan pencarian galeri
- Penjadwalan generate, billing, dan pembelian kuota tambahan
- Navigasi prev/next antar item di dalam popup

---

## Halaman & Navigasi

| Menu | Route |
|---|---|
| Create Image | `/create/image` (halaman default setelah login) |
| Create Video | `/create/video` |
| Create Audio | `/create/audio` |
| Create Brief | `/create/brief` |

**FR-NAV-1**: Navigasi utama berisi 4 menu di atas. Desktop ≥1024px: sidebar kiri tetap. Tablet 768–1023px: sidebar collapsible (ikon saja saat collapsed). Mobile <768px: bottom navigation dengan 4 item. Menu aktif ditandai jelas.

**FR-NAV-2**: Setiap halaman Create memiliki struktur vertikal yang sama: (1) Composer, (2) judul seksi "Hasil Generate", (3) galeri bento, (4) sentinel auto-load.

---

## Functional Requirements

### Composer (umum untuk semua halaman) — `CMP`

**FR-CMP-1**: Composer berupa kotak teks multi-baris bergaya chat. Tinggi otomatis menyesuaikan isi (min 2 baris, maks 6 baris, lalu scroll internal). Placeholder per halaman:
- Image: "Deskripsikan gambar yang ingin dibuat…"
- Video: "Deskripsikan video yang ingin dibuat…"
- Audio: "Tulis naskah yang akan diucapkan…"
- Brief: "Tulis topik atau instruksi untuk content brief…"

**FR-CMP-2**: Batas karakter prompt: Image 1.000, Video 1.000, Audio 5.000, Brief 2.000. Penghitung `n/maks` muncul saat isi ≥80% batas; input di atas batas ditolak (tidak bisa mengetik lebih).

**FR-CMP-3**: Prompt wajib minimal 3 karakter setelah di-trim. Jika kurang, tombol Generate disabled.

**FR-CMP-4**: Tombol kirim (ikon panah) di kanan bawah composer. Desktop: `Enter` mengirim, `Shift+Enter` baris baru. Mobile: `Enter` baris baru, kirim hanya lewat tombol.

**FR-CMP-5**: Baris konfigurasi ditampilkan di bawah kotak teks sebagai chip (mis. "1:1", "Tinggi", "1024×1024"). Klik chip membuka popover (desktop/tablet) atau bottom sheet (mobile) berisi pilihan konfigurasi tersebut.

**FR-CMP-6**: Konfigurasi terakhir yang dipakai disimpan per jenis di browser (`localStorage`, dibungkus try/catch) dan dipulihkan saat halaman dibuka; jika kosong/tidak tersedia, pakai nilai default masing-masing jenis.

**FR-CMP-7**: Saat kirim: tombol berubah jadi loading dan nonaktif sampai server menerima permintaan (respon 202), lalu composer dikosongkan **kecuali** konfigurasi (konfigurasi dipertahankan). Item baru muncul di posisi pertama galeri dengan status memproses (FR-GEN-2).

### Kuota — `QTA`

**FR-QTA-1**: Kuota berlaku **harian per user per jenis** (image, video, audio, brief terpisah). Reset setiap pukul 00.00 WIB (Asia/Jakarta). Batas default (dapat diubah Admin lewat konfigurasi, lihat Asumsi): Image 20, Video 5, Audio 30, Brief 30 per hari.

**FR-QTA-2**: Composer menampilkan info kuota di sisi kanan baris konfigurasi: teks "Sisa {sisa}/{batas} hari ini" dan tooltip/teks kecil "Reset pukul 00.00 WIB". Warna peringatan (kuning) saat sisa ≤20% dari batas, merah saat 0.

**FR-QTA-3**: Kuota dipotong 1 saat permintaan generate diterima server (reservasi), dalam satu transaksi database yang menjamin pemakaian tidak melebihi batas meski ada permintaan bersamaan.

**FR-QTA-4**: Jika generate berstatus `failed` (error provider, timeout, atau ditolak moderasi), kuota dikembalikan 1 secara otomatis. Generate yang berhasil tidak dikembalikan.

**FR-QTA-5**: Saat sisa kuota 0: tombol kirim disabled dan muncul pesan di bawah composer "Kuota harian habis. Reset pukul 00.00 WIB." Jika permintaan tetap sampai ke API, server menolak dengan status 429.

**FR-QTA-6**: Jumlah generate yang sedang berjalan (`queued`/`processing`) per user per jenis dibatasi maksimal: Image 3, Video 2, Audio 3, Brief 3. Melebihi batas ditolak dengan pesan "Masih ada {n} proses berjalan, tunggu salah satu selesai" (status 409). Ini tidak memotong kuota.

### Galeri Bento — `GAL`

**FR-GAL-1**: Galeri menampilkan hasil generate **seluruh user di workspace** untuk jenis halaman tersebut (galeri bersama), diurutkan terbaru di atas (`createdAt` descending). Yang tampil ke semua user hanya status `completed` dan belum dihapus. Milik user sendiri yang berstatus `queued`, `processing`, atau `failed` tampil di bagian paling atas galeri khusus untuk pemiliknya.

**FR-GAL-2**: Tata letak bento grid dengan CSS Grid (`grid-auto-flow: dense`, gap 12px). Jumlah kolom: 4 (≥1024px), 3 (768–1023px), 2 (<768px). Unit sel berbentuk persegi mengikuti lebar kolom. Ukuran tile ditentukan rasio media (Image/Video):
- rasio lebar/tinggi ≥ 1,6 (landscape, mis. 16:9): span 2 kolom × 1 baris
- rasio ≤ 0,7 (portrait, mis. 9:16): span 1 kolom × 2 baris
- selainnya (mendekati persegi, mis. 1:1, 4:5, 3:4, 4:3): span 1 × 1
Media ditampilkan `object-fit: cover`; tampilan penuh tanpa crop ada di popup. Pada breakpoint 2 kolom, span 2 kolom sama dengan lebar penuh.

**FR-GAL-3**: Tile Image menampilkan thumbnail (WebP sisi terpanjang 640px). Tile Video menampilkan poster (frame detik ke-1), ikon play, dan badge durasi (`0:10`); di desktop (hover capable), hover memutar pratinjau video tanpa suara setelah 300 ms dan berhenti saat kursor keluar. Tile Audio berupa kartu (span 2×1 desktop/tablet, lebar penuh mobile) berisi waveform, tombol play/pause inline, durasi, nama suara, dan cuplikan naskah 2 baris. Tile Brief berupa kartu (span 2×1 desktop/tablet, lebar penuh mobile) berisi judul brief, badge jenis konten, badge platform tujuan, dan cuplikan ringkasan 3 baris.

**FR-GAL-4**: Pemutaran audio inline pada tile Audio tidak membuka popup; hanya satu audio yang boleh diputar pada satu waktu (memutar yang baru menghentikan sebelumnya). Klik area kartu di luar tombol play membuka popup.

**FR-GAL-5**: **Auto-load** dengan cursor pagination: muat awal 10 item; saat sentinel di akhir galeri masuk ke jarak 400px dari viewport (IntersectionObserver), muat 10 item berikutnya. Selama memuat tampil 3 tile skeleton. Tidak ada tombol "muat lebih banyak".

**FR-GAL-6**: Saat tidak ada lagi data, tampilkan teks "Semua hasil sudah ditampilkan" di bawah galeri. Jika galeri benar-benar kosong, tampilkan empty state "Belum ada hasil. Buat yang pertama lewat kotak di atas!".

**FR-GAL-7**: Jika pemuatan halaman berikutnya gagal, tampilkan pesan "Gagal memuat, coba lagi" dengan tombol "Coba lagi" di posisi sentinel; auto-load tidak mengulang otomatis sampai tombol ditekan.

**FR-GAL-8**: Item baru yang selesai dibuat oleh user lain tidak muncul otomatis di galeri aktif (galeri hanya menyegarkan saat halaman dimuat ulang); item milik user sendiri yang selesai berpindah dari area "memproses" ke posisi normal tanpa reload (FR-GEN-3).

### Popup Detail — `MOD`

**FR-MOD-1**: Klik tile (Image, Video, Audio, Brief) membuka popup modal di tengah layar dengan overlay gelap. Desktop/tablet (≥768px): dua kolom — **kiri hasil generate** (lebar ±60%), **kanan informasi** (±40%). Mobile (<768px): modal layar penuh, hasil di atas dan informasi di bawah, bisa digulir.

**FR-MOD-2**: Kolom kiri menampilkan hasil sesuai jenis: Image = gambar utuh (resolusi penuh, tanpa crop, `object-fit: contain`); Video = pemutar video dengan kontrol standar (play/pause, seek, volume, fullscreen), autoplay tanpa suara; Audio = pemutar dengan waveform besar, play/pause, seek, kecepatan 0,75×/1×/1,25×/1,5×; Brief = tampilan tabel brief lengkap (ringkasan, tabel baris sesuai jenis konten, dan 3 caption), dapat digulir.

**FR-MOD-3**: Kolom kanan menampilkan berurutan:
1. **Pembuat**: nama user (dan avatar bila ada)
2. **Waktu generate**: format `D Bulan YYYY, HH.mm WIB` (contoh: "18 Oktober 2026, 14.35 WIB")
3. **Prompt** yang dipakai, lengkap (maks tinggi 200px lalu scroll) dengan tombol "Salin"
4. **Detail** (daftar label–nilai): AI/model yang digunakan + parameter sesuai jenis (lihat tabel Detail per Jenis)
5. **Tombol aksi**: "Buat serupa" (utama), "Unduh" (sekunder), dan menu "Hapus" (hanya terlihat untuk pemilik dan Admin)

**FR-MOD-4**: Tabel Detail per Jenis:

| Jenis | Field Detail |
|---|---|
| Image | Model, Rasio, Dimensi (`W×H px`), Kualitas |
| Video | Model, Rasio, Dimensi (`W×H px`), Resolusi, Durasi, Start frame (thumbnail bila dipakai) |
| Audio | Model, Suara, Bahasa, Kecepatan, Gaya, Format, Durasi |
| Brief | Model, Jenis konten, Platform tujuan, Tone, Bahasa, Target audiens, Panjang |

**FR-MOD-5**: **Buat serupa**: menutup popup, menggulir halaman ke composer, dan mengisi **prompt serta seluruh konfigurasi** dari item tersebut (termasuk start frame untuk video). Tidak otomatis men-generate; user dapat mengubah lalu mengirim. Jika model/opsi asal sudah tidak tersedia, gunakan default saat ini dan tampilkan toast "Sebagian pengaturan disesuaikan karena model sebelumnya tidak tersedia". Semua user boleh memakai "Buat serupa" untuk item milik siapa pun.

**FR-MOD-6**: Popup dapat ditutup dengan tombol X, klik overlay, atau tombol `Esc`. Saat terbuka, fokus terkunci di dalam modal (focus trap), scroll body dinonaktifkan, dan fokus kembali ke tile asal saat ditutup.

**FR-MOD-7**: Popup memiliki URL yang dapat dibagikan lewat query `?g={generationId}` (mis. `/create/image?g=abc123`). Membuka URL itu langsung menampilkan popup; tombol Back browser menutup popup. Jika ID tidak ditemukan, sudah dihapus, atau jenisnya tidak sesuai halaman, tampilkan toast "Hasil tidak ditemukan" dan buka halaman tanpa popup.

**FR-MOD-8**: **Unduh**: Image → file asli (PNG); Video → MP4; Audio → file sesuai format hasil (MP3/WAV); Brief → file Markdown (.md) berisi ringkasan, tabel, dan caption. Nama file: `{jenis}_{YYYYMMDD-HHmmss}_{id-pendek}.{ekstensi}`.

**FR-MOD-9**: **Hapus**: pemilik atau Admin dapat menghapus item setelah konfirmasi "Hapus hasil ini? Tindakan tidak bisa dibatalkan." Penghapusan bersifat soft delete (`deletedAt` terisi), item langsung hilang dari galeri semua user, dan kuota tidak dikembalikan.

### Proses Generate — `GEN`

**FR-GEN-1**: Generate dijalankan asinkron lewat job queue. Status: `queued` → `processing` → `completed` atau `failed`.

**FR-GEN-2**: Item milik user yang sedang `queued`/`processing` tampil di awal galeri sebagai tile placeholder berukuran sesuai rasio/jenis dengan animasi loading, label status ("Antre…" / "Memproses…"), cuplikan prompt, dan (khusus video) estimasi "Biasanya 1–3 menit".

**FR-GEN-3**: Aplikasi memeriksa status item yang sedang berjalan setiap 3 detik (polling `GET /api/generations/:id`). Saat `completed`, placeholder berubah menjadi tile hasil tanpa reload dan muncul toast "Hasil siap" dengan aksi "Lihat" (membuka popup). Pemeriksaan berhenti saat status final atau saat user meninggalkan halaman.

**FR-GEN-4**: Item `failed` milik user tampil sebagai tile error dengan pesan penyebab singkat, tombol "Coba lagi" (membuat generate baru dengan prompt dan konfigurasi sama, memakai 1 kuota baru) dan tombol "Hapus" (menghilangkan tile). Item `failed` tidak pernah tampil ke user lain.

**FR-GEN-5**: Timeout generate: Image 120 detik, Audio 120 detik, Brief 90 detik, Video 600 detik sejak mulai `processing`. Melewati batas, status `failed` dengan pesan "Waktu proses habis, coba lagi" dan kuota dikembalikan (FR-QTA-4).

**FR-GEN-6**: Jika user menutup halaman saat generate berjalan, proses tetap berlanjut; hasil muncul saat halaman dibuka kembali (item berada di posisi paling atas galeri miliknya).

### Create Image — `IMG`

**FR-IMG-1**: Konfigurasi Create Image: **Rasio**, **Kualitas**, **Dimensi**. Default: rasio `1:1`, kualitas `Tinggi`, dimensi `Sedang`.

**FR-IMG-2**: Pilihan **Rasio**: `1:1`, `4:5`, `3:4`, `9:16`, `16:9`, `4:3`, dan `Kustom`.

**FR-IMG-3**: Pilihan **Kualitas**: `Standar`, `Tinggi`, `Maksimal` (dipetakan ke parameter kualitas provider: `low`, `medium`, `high`).

**FR-IMG-4**: Pilihan **Dimensi** untuk rasio preset: `Kecil`, `Sedang`, `Besar` dengan ukuran tetap sesuai tabel. Chip dimensi menampilkan ukuran terpilih (mis. "1024×1024"). Untuk rasio `Kustom`, tampil dua input angka **Lebar** dan **Tinggi** (rentang 512–2048 px, kelipatan 8), beserta teks rasio hasil hitung (mis. "≈ 3:2"); nilai di luar rentang ditolak dengan pesan validasi di bawah input.

| Rasio | Kecil | Sedang | Besar |
|---|---|---|---|
| 1:1 | 768×768 | 1024×1024 | 1536×1536 |
| 4:5 | 768×960 | 1024×1280 | 1536×1920 |
| 3:4 | 768×1024 | 960×1280 | 1152×1536 |
| 9:16 | 576×1024 | 720×1280 | 1080×1920 |
| 16:9 | 1024×576 | 1280×720 | 1920×1080 |
| 4:3 | 1024×768 | 1280×960 | 1536×1152 |

**FR-IMG-5**: Pemetaan ke ukuran asli provider: server memilih ukuran native provider terdekat dengan rasio permintaan (mis. persegi → 1024×1024, landscape → 1536×1024, portrait → 1024×1536), lalu menyesuaikan ke dimensi permintaan dengan center-crop ke rasio target dan resize (Lanczos). Dimensi yang tersimpan dan ditampilkan di popup adalah dimensi **final** hasil.

**FR-IMG-6**: Output Image disimpan sebagai PNG (asli) dan WebP thumbnail (FR-GAL-3).

### Create Video — `VID`

**FR-VID-1**: Konfigurasi Create Video: **Rasio**, **Durasi**, **Resolusi (kualitas)**, **Start frame (opsional)**. Default: `16:9`, `5 detik`, `720p`, tanpa start frame.

**FR-VID-2**: Pilihan **Rasio**: `16:9`, `9:16`, `1:1`. Pilihan **Durasi**: `5`, `10`, `15` detik. Pilihan **Resolusi**: `720p`, `1080p`.

**FR-VID-3**: Dimensi ditampilkan read-only pada chip berdasarkan rasio + resolusi (720p: 1280×720 / 720×1280 / 720×720; 1080p: 1920×1080 / 1080×1920 / 1080×1080).

**FR-VID-4**: **Start frame**: user dapat menambahkan satu gambar sebagai frame awal video (image-to-video) lewat unggah file (JPG/PNG/WEBP, maks 10 MB) atau memilih dari galeri Image workspace. Gambar tampil sebagai thumbnail kecil di composer dengan tombol hapus. Jika rasio gambar berbeda dari rasio video, gambar di-crop tengah ke rasio video.

**FR-VID-5**: Output Video: MP4 (H.264 + AAC bila provider menghasilkan audio), poster JPG (frame detik ke-1), dan durasi aktual yang disimpan dalam detik.

**FR-VID-6**: Kuota video bernilai 1 per generate tanpa memandang durasi/resolusi.

### Create Audio — `AUD`

**FR-AUD-1**: Konfigurasi Create Audio: **Suara**, **Bahasa**, **Kecepatan**, **Gaya**, **Format**. Default: suara pertama dalam daftar, bahasa `Indonesia`, kecepatan `1.0×`, gaya `Natural`, format `MP3`.

**FR-AUD-2**: **Suara**: daftar suara diambil dari provider lewat endpoint internal, ditampilkan sebagai list dengan nama, label (mis. "Pria • Hangat"), dan tombol pratinjau 5 detik yang memutar contoh. Hanya satu pratinjau berbunyi pada satu waktu.

**FR-AUD-3**: **Bahasa**: `Indonesia`, `Inggris`. **Kecepatan**: slider 0,7×–1,2× dengan langkah 0,1. **Gaya**: `Natural`, `Ekspresif`, `Stabil` (dipetakan ke parameter stability/style provider). **Format**: `MP3` (128 kbps), `WAV` (44,1 kHz, 16-bit).

**FR-AUD-4**: Teks naskah dipecah otomatis oleh server bila melebihi batas satu permintaan provider, dan hasilnya digabung menjadi satu file audio tanpa jeda berlebih (jeda sambungan maks 200 ms).

**FR-AUD-5**: Output Audio: file audio sesuai format, waveform 64 titik (array nilai 0–1) untuk tile dan popup, serta durasi aktual dalam detik. Kuota audio bernilai 1 per generate.

### Create Brief — `BRF`

**FR-BRF-1**: Konfigurasi Create Brief: **Jenis konten**, **Platform tujuan**, **Tone**, **Bahasa**, **Target audiens (opsional)**, **Panjang**. Default: `Single Image`, `Instagram`, `Santai`, `Indonesia`, kosong, `Standar`.

**FR-BRF-2**: Pilihan **Jenis konten**: `Single Image`, `Carousel`, `Video`, `Audio`, `Artikel`. **Platform tujuan**: `Instagram`, `TikTok`, `X`, `Facebook`, `YouTube`, `Website/Artikel`, `Umum`. **Tone**: `Santai`, `Informatif`, `Formal`, `Persuasif`, `Inspiratif`. **Panjang**: `Singkat`, `Standar`, `Detail`. Target audiens berupa teks bebas maks 150 karakter.

**FR-BRF-3**: Hasil brief terdiri dari: **ringkasan** (judul, tujuan, target audiens, tone, durasi/ukuran total, platform), **tabel brief** dengan kolom sesuai jenis konten, dan **3 rekomendasi caption** (gaya: informatif, santai, CTA kuat; masing-masing dengan 3–8 hashtag).

**FR-BRF-4**: Kolom tabel brief per jenis konten:
- Single Image: elemen visual, teks pada gambar, rasio, gaya visual, catatan
- Carousel: nomor slide, judul slide, isi teks, deskripsi visual, catatan (5–10 slide; `Singkat` = 5, `Standar` = 7, `Detail` = 10)
- Video: nomor scene, durasi (detik), visual, narasi/dialog, teks on-screen, audio/musik (total durasi `Singkat` ≈ 15 dtk, `Standar` ≈ 30 dtk, `Detail` ≈ 60 dtk)
- Audio: segmen, durasi estimasi (detik), naskah, nada/gaya bicara, efek/musik
- Artikel: nomor section, judul section, poin utama, perkiraan jumlah kata (`Singkat` ≈ 400, `Standar` ≈ 800, `Detail` ≈ 1.500 kata total)

**FR-BRF-5**: Hasil brief bersifat baca-saja pada galeri/popup di PRD ini (pengeditan brief dibahas di PRD editor terpisah). Tombol "Salin" tersedia pada tiap caption di popup.

**FR-BRF-6**: Brief disimpan sebagai JSON terstruktur (lihat contoh) agar dapat dipakai modul lain.

### Non-Functional — `NFR`

**FR-NFR-1 (Responsif)**: Semua halaman dapat dipakai di desktop, tablet, dan mobile tanpa horizontal scroll pada body. Composer menempel (sticky) di atas area galeri pada desktop/tablet; di mobile composer berada di bagian atas halaman dan bisa digulir bersama konten.

**FR-NFR-2 (Tema & gaya)**: Dukung mode Light/Dark. Panel composer, popup, dan tile memakai gaya glassmorphism (latar blur semi-transparan, border tipis) yang konsisten di kedua mode; tombol dan input tetap kontras tinggi tanpa efek kaca.

**FR-NFR-3 (Performa)**: Galeri memuat 10 item pertama ≤2 detik pada jaringan 4G. Gambar dan poster memakai `loading="lazy"` kecuali 4 tile pertama; ukuran tile tetap dihitung dari rasio agar tidak terjadi layout shift (CLS ≤ 0,1). Video pratinjau hover dimuat hanya saat hover.

**FR-NFR-4 (Aksesibilitas)**: Kontras teks ≥4,5:1; semua kontrol dapat dioperasikan keyboard; tile berupa elemen `button` dengan label deskriptif; `alt` gambar = 120 karakter pertama prompt; popup memakai `role="dialog"`, `aria-modal="true"`, dan focus trap; animasi hover/loading menghormati `prefers-reduced-motion`.

**FR-NFR-5 (Keamanan)**: Semua endpoint membutuhkan sesi login. URL media memakai signed URL berkedaluwarsa 1 jam. Kuota dan batas proses bersamaan ditegakkan di server, bukan hanya di UI.

---

## Technical Requirements

### Stack
- Frontend + Backend: Next.js 14 (App Router), TypeScript, Tailwind CSS
- Database: MySQL 8 via Prisma ORM
- Job queue: Redis + BullMQ (satu antrean per jenis: `image`, `video`, `audio`, `brief`)
- Object storage: S3-compatible (file media, thumbnail, poster)
- Pemrosesan media: FFmpeg (poster video, konversi/gabung audio, WAV/MP3), Sharp (crop, resize, thumbnail WebP)
- Provider (lewat adapter yang dapat diganti per jenis lewat konfigurasi): Image & Video = OpenAI; Audio = ElevenLabs (text-to-speech); Brief = model LLM platform
> Stack dilanjutkan dari PRD sebelumnya. Lihat seksi Asumsi.

### Data Model (Prisma)

```prisma
model Generation {
  id              String    @id @default(uuid())
  type            String    // 'image' | 'video' | 'audio' | 'brief'
  userId          String
  prompt          String    @db.Text
  params          Json      // konfigurasi lengkap sesuai jenis (lihat contoh)
  provider        String    // mis. 'openai'
  modelName       String    // nama tampilan, mis. 'OpenAI gpt-image-1'
  status          String    // 'queued' | 'processing' | 'completed' | 'failed'
  errorMessage    String?
  fileUrl         String?   // image/video/audio
  thumbnailUrl    String?   // image: webp; video: poster jpg
  waveform        Json?     // audio: array 64 angka 0-1
  resultJson      Json?     // brief: ringkasan, tabel, caption
  width           Int?
  height          Int?
  durationSeconds Float?
  startFrameAssetId String? // video, opsional
  createdAt       DateTime  @default(now())
  startedAt       DateTime?
  completedAt     DateTime?
  deletedAt       DateTime?

  @@index([type, status, deletedAt, createdAt, id])
  @@index([userId, type, status])
}

model QuotaUsage {
  id     String @id @default(uuid())
  userId String
  type   String   // 'image' | 'video' | 'audio' | 'brief'
  date   String   // 'YYYY-MM-DD' zona Asia/Jakarta
  used   Int      @default(0)

  @@unique([userId, type, date])
}

model QuotaConfig {
  type       String @id  // 'image' | 'video' | 'audio' | 'brief'
  dailyLimit Int
  maxConcurrent Int
}
```

`User` (id, name, avatarUrl, role `admin|creator`) dan `Asset` (untuk start frame yang diunggah) mengikuti model yang sudah ada.

### Konfigurasi Model & Provider (`config/generation.ts`)
Berisi per jenis: `provider`, `modelId`, `modelDisplayName`, ukuran native provider untuk image, daftar durasi/resolusi yang didukung untuk video, dan batas teks per permintaan untuk audio. Admin/developer mengubah nilai ini tanpa mengubah logika halaman.

### Contoh `params` per Jenis

```json
// image
{ "aspectRatio": "16:9", "quality": "high", "dimensionPreset": "medium", "width": 1280, "height": 720 }
```
```json
// image kustom
{ "aspectRatio": "custom", "quality": "standard", "dimensionPreset": null, "width": 1200, "height": 800 }
```
```json
// video
{ "aspectRatio": "9:16", "durationSeconds": 10, "resolution": "1080p", "startFrameAssetId": "uuid-asset" }
```
```json
// audio
{ "voiceId": "voice_abc", "voiceName": "Rani", "language": "id", "speed": 1.0, "style": "natural", "format": "mp3" }
```
```json
// brief
{ "contentType": "carousel", "platform": "instagram", "tone": "casual", "language": "id", "audience": "karyawan muda 22-30 th", "length": "standard" }
```

### Contoh `resultJson` Brief (carousel)

```json
{
  "summary": { "title": "3 Tanda Kamu Butuh Cuti", "goal": "Edukasi burnout ringan", "audience": "Karyawan muda", "tone": "Santai", "size": "7 slide", "platform": "Instagram" },
  "rows": [
    { "slide": 1, "title": "Capek terus?", "text": "Mungkin bukan malas, tapi butuh jeda.", "visual": "Ilustrasi orang di meja kerja dengan kopi dingin", "notes": "Hook" }
  ],
  "captions": [
    { "style": "informatif", "text": "Tiga tanda tubuhmu minta cuti…", "hashtags": ["#worklifebalance", "#burnout", "#tipskerja"] },
    { "style": "santai", "text": "Jujur deh, kapan terakhir kamu benar-benar libur?", "hashtags": ["#cuti", "#kerja", "#hybridwork"] },
    { "style": "cta", "text": "Simpan postingan ini dan ajak temanmu yang butuh cuti!", "hashtags": ["#simpan", "#cuti", "#produktivitas"] }
  ]
}
```

### API Contract

**GET /api/generations?type=image&limit=10&cursor={cursor}**
Respons (200):
```json
{
  "items": [
    {
      "id": "g_8f2a",
      "type": "image",
      "status": "completed",
      "isOwner": false,
      "user": { "id": "u_12", "name": "Rani Putri", "avatarUrl": null },
      "prompt": "Meja kerja minimalis dengan tanaman, cahaya pagi, gaya flat lay",
      "thumbnailUrl": "https://cdn.contoh.com/t/g_8f2a.webp",
      "width": 1280, "height": 720,
      "aspectRatio": "16:9",
      "createdAt": "2026-10-18T07:35:00Z"
    }
  ],
  "nextCursor": "MjAyNi0xMC0xOFQwNzozNTowMFp8Z184ZjJh"
}
```
`limit` default dan maksimal 10. `nextCursor` bernilai `null` bila tidak ada data lagi. Item milik pemanggil dengan status `queued`/`processing`/`failed` hanya disertakan pada halaman pertama (tanpa `cursor`) dan berada di urutan awal. Urutan: `createdAt` desc, tie-break `id` desc; cursor = base64(`createdAt|id`).

**GET /api/generations/:id** — detail lengkap (termasuk `params`, `modelName`, `fileUrl` signed, `resultJson` untuk brief) untuk popup dan polling status. Respons 404 bila tidak ada, sudah dihapus, atau (untuk `failed`/proses) bukan milik pemanggil.

**POST /api/generations**
Permintaan:
```json
{ "type": "image", "prompt": "Meja kerja minimalis dengan tanaman, cahaya pagi", "params": { "aspectRatio": "16:9", "quality": "high", "dimensionPreset": "medium" } }
```
Respons (202):
```json
{ "id": "g_9c1d", "status": "queued", "quota": { "type": "image", "used": 4, "limit": 20, "resetAt": "2026-10-18T17:00:00Z" } }
```
Respons (429) kuota habis: `{ "error": "QUOTA_EXCEEDED", "message": "Kuota harian habis. Reset pukul 00.00 WIB.", "quota": { "used": 20, "limit": 20, "resetAt": "2026-10-18T17:00:00Z" } }`
Respons (409) batas proses bersamaan: `{ "error": "TOO_MANY_RUNNING", "message": "Masih ada 3 proses berjalan, tunggu salah satu selesai" }`
Respons (400) validasi: `{ "error": "VALIDATION", "fields": { "prompt": "Minimal 3 karakter" } }`

**GET /api/quota?type=image** → `{ "type": "image", "used": 3, "limit": 20, "resetAt": "2026-10-18T17:00:00Z" }`

**POST /api/generations/:id/retry** — membuat generate baru dari item `failed` milik pemanggil (memakai 1 kuota); respons sama dengan POST /api/generations.

**DELETE /api/generations/:id** — soft delete oleh pemilik/Admin; 204 bila berhasil, 403 bila bukan pemilik/Admin.

**GET /api/audio/voices** → `{ "voices": [ { "id": "voice_abc", "name": "Rani", "label": "Wanita • Hangat", "previewUrl": "https://…" } ] }`

**POST /api/uploads/start-frame** (multipart) → `{ "assetId": "uuid-asset", "thumbnailUrl": "https://…" }`

### Algoritma Tile Bento (acuan implementasi FR-GAL-2)

```ts
function tileSpan(type: 'image'|'video'|'audio'|'brief', w?: number, h?: number) {
  if (type === 'audio' || type === 'brief') return { col: 2, row: 1 };
  const ratio = (w ?? 1) / (h ?? 1);
  if (ratio >= 1.6) return { col: 2, row: 1 };
  if (ratio <= 0.7) return { col: 1, row: 2 };
  return { col: 1, row: 1 };
}
```
Pada breakpoint 2 kolom, `col: 2` = lebar penuh.

---

## UI/UX Requirements

- **Composer**: kartu kaca di atas halaman; baris atas = kotak teks + tombol kirim; baris bawah = chip konfigurasi (kiri) dan info kuota (kanan); pada mobile chip dapat digulir horizontal, info kuota pindah ke baris sendiri di atas chip
- **Galeri**: judul seksi "Hasil Generate", bento grid sesuai FR-GAL-2, tile berujung membulat (radius 16px) dengan overlay gradien tipis berisi nama user dan waktu relatif (mis. "2 jam lalu") yang muncul saat hover (desktop) atau selalu terlihat kecil di pojok bawah (mobile)
- **Tile pemrosesan**: shimmer + label status; tile gagal: ikon peringatan, pesan, tombol "Coba lagi"/"Hapus"
- **Popup**: dua kolom sesuai FR-MOD-1; tombol X di pojok kanan atas; kolom kanan dapat digulir terpisah bila isi panjang
- **Create Video**: chip tambahan "Start frame" menampilkan thumbnail kecil bila ada
- **Create Audio**: pemilih suara berupa panel list dengan pratinjau; slider kecepatan menampilkan nilai
- **State standar**: skeleton saat memuat; empty state beraksi; error state dengan tombol coba lagi; toast untuk notifikasi singkat

---

## Edge Cases & Error Handling

- Prompt hanya spasi → tombol kirim disabled (FR-CMP-3)
- Dua permintaan generate dikirim hampir bersamaan saat sisa kuota 1 → hanya satu diterima (transaksi FR-QTA-3), yang lain 429
- Provider menolak prompt karena kebijakan konten → status `failed`, pesan "Prompt tidak dapat diproses karena melanggar kebijakan konten. Ubah prompt Anda.", kuota dikembalikan
- Provider error/timeout → status `failed`, pesan "Gagal membuat hasil, coba lagi", kuota dikembalikan
- Dimensi kustom di luar 512–2048 atau bukan kelipatan 8 → validasi inline, tombol kirim disabled
- Start frame berukuran >10 MB atau tipe tidak didukung → ditolak saat unggah dengan pesan spesifik
- Start frame dari galeri Image yang dihapus saat video sedang diproses → job tetap memakai salinan file yang sudah diambil saat permintaan diterima
- Naskah audio melebihi batas satu permintaan provider → dipecah otomatis (FR-AUD-4); gagal pada satu bagian = seluruh generate `failed` dan kuota dikembalikan
- Suara yang dipakai item lama sudah tidak ada di provider → "Buat serupa" memakai suara default dengan toast penyesuaian (FR-MOD-5); popup item lama tetap menampilkan nama suara asal
- Item dihapus oleh pemilik saat user lain membuka popup-nya → aksi berikutnya (mis. Unduh) menampilkan toast "Hasil sudah dihapus" dan popup ditutup
- Membuka `?g=` dari jenis lain (mis. id image di `/create/video`) → toast "Hasil tidak ditemukan" (FR-MOD-7)
- Galeri berisi hasil yang rasio/dimensinya tidak tersedia (data lama) → tile 1×1 sebagai fallback
- Auto-load terpicu berulang saat konten terlalu pendek untuk memenuhi layar → muat halaman berikutnya hingga viewport penuh atau data habis, dengan jeda minimal 300 ms antar permintaan
- Reset kuota terjadi saat user sedang membuka halaman → info kuota diperbarui saat generate berikutnya atau pada refresh halaman; server selalu memakai tanggal WIB saat permintaan diterima
- Pemutaran hover video gagal dimuat → tampilkan poster saja tanpa pesan error
- Koneksi putus saat polling → polling berhenti sementara dan dilanjutkan saat koneksi pulih (event `online`)

---

## Acceptance Criteria

**AC untuk FR-CMP-1, FR-CMP-5, FR-CMP-7 (composer & kirim)**
- Given user di `/create/image` dengan rasio 16:9, kualitas Tinggi, dimensi Sedang
- When user mengetik prompt "Meja kerja minimalis" lalu menekan Enter
- Then prompt dikirim, kotak teks dikosongkan, chip konfigurasi tetap 16:9/Tinggi/1280×720, dan tile placeholder "Memproses…" muncul di posisi pertama galeri

**AC untuk FR-QTA-2 – FR-QTA-5 (kuota)**
- Given batas image 20/hari dan user sudah memakai 19
- When user mengirim generate ke-20 dan berhasil diterima
- Then info kuota menampilkan "Sisa 0/20 hari ini" berwarna merah, tombol kirim disabled, dan muncul "Kuota harian habis. Reset pukul 00.00 WIB."
- And bila generate itu berakhir `failed`, kuota kembali menjadi "Sisa 1/20" dan tombol kirim aktif lagi

**AC untuk FR-GAL-1, FR-GAL-2 (bento & visibilitas)**
- Given galeri berisi hasil milik user A (16:9), user B (9:16), dan user A (1:1)
- When user C membuka `/create/image`
- Then ketiganya tampil terbaru di atas; tile 16:9 menempati 2 kolom × 1 baris, tile 9:16 menempati 1 kolom × 2 baris, tile 1:1 menempati 1×1 pada tampilan ≥1024px

**AC untuk FR-GAL-5, FR-GAL-6 (auto-load)**
- Given ada 25 hasil di database
- When halaman dibuka lalu user menggulir ke bawah
- Then 10 item termuat awal, scroll mendekati dasar memuat 10 item berikutnya, lalu 5 item terakhir, dan muncul teks "Semua hasil sudah ditampilkan"

**AC untuk FR-MOD-1 – FR-MOD-4 (popup)**
- Given user mengklik tile image hasil Rani Putri pada 18 Oktober 2026 pukul 14.35 WIB
- When popup terbuka
- Then gambar utuh tampil di kiri; di kanan tampil nama "Rani Putri", "18 Oktober 2026, 14.35 WIB", prompt lengkap, serta Model, Rasio, Dimensi, Kualitas, dan tombol "Buat serupa"

**AC untuk FR-MOD-5 (buat serupa)**
- Given popup terbuka untuk image dengan rasio 9:16, kualitas Maksimal, dimensi Besar
- When user klik "Buat serupa"
- Then popup tertutup, halaman menggulir ke composer, kotak teks terisi prompt item tersebut, dan chip menunjukkan 9:16, Maksimal, 1080×1920; tidak ada generate otomatis

**AC untuk FR-MOD-7 (deep link)**
- Given URL `/create/image?g=g_8f2a` dengan item valid
- When URL dibuka langsung
- Then popup item tersebut terbuka; menekan Back browser menutup popup dan tetap di halaman galeri

**AC untuk FR-GEN-3, FR-GEN-4 (selesai & gagal)**
- Given user menjalankan generate video yang berstatus `processing`
- When status berubah `completed`
- Then placeholder berganti menjadi tile video dengan poster dan durasi, muncul toast "Hasil siap" dengan aksi "Lihat"
- And bila status berubah `failed`, tile error dengan tombol "Coba lagi" tampil hanya untuk pemiliknya

**AC untuk FR-IMG-4, FR-IMG-5 (dimensi)**
- Given user memilih rasio Kustom dengan lebar 1200 dan tinggi 800
- When generate selesai
- Then gambar final berukuran tepat 1200×800 px dan popup menampilkan "1200×800 px"

**AC untuk FR-VID-4 (start frame)**
- Given user menambahkan start frame 1:1 pada video rasio 16:9
- When generate diproses
- Then gambar di-crop tengah ke 16:9 sebagai frame awal dan popup menampilkan thumbnail start frame pada detail

**AC untuk FR-AUD-2 – FR-AUD-5 (audio)**
- Given user memilih suara "Rani", bahasa Indonesia, kecepatan 1,1×, format MP3, dan naskah 4.000 karakter
- When generate selesai
- Then tile audio menampilkan waveform, durasi, nama suara "Rani", dan popup menampilkan pemutar dengan kontrol kecepatan serta detail Suara, Bahasa, Kecepatan, Gaya, Format, Durasi

**AC untuk FR-BRF-3, FR-BRF-4 (brief)**
- Given user memilih jenis Video, platform TikTok, tone Santai, panjang Standar
- When brief selesai
- Then popup menampilkan ringkasan, tabel dengan kolom scene/durasi/visual/narasi/teks on-screen/audio dengan total durasi ≈ 30 detik, dan 3 caption berhashtag 3–8

**AC untuk FR-MOD-9 (hapus)**
- Given user A membuka popup hasil miliknya
- When user A memilih Hapus dan mengonfirmasi
- Then item hilang dari galeri semua user dan kuota tidak bertambah

**AC untuk FR-NFR-1 (responsif)**
- Given viewport lebar 375px
- When user membuka salah satu halaman Create dan membuka popup
- Then navigasi berupa bottom navigation, galeri 2 kolom tanpa horizontal scroll, dan popup tampil layar penuh dengan hasil di atas dan informasi di bawah

---

## Asumsi

- **Galeri bersama**: sesuai jawaban Anda, semua user workspace melihat hasil semua user. Karena itu hasil `failed` dan yang masih diproses hanya terlihat oleh pemiliknya.
- **Batas kuota default** (Image 20, Video 5, Audio 30, Brief 30 per hari) dan batas proses bersamaan (3/2/3/3) adalah angka usulan karena brief hanya menyebut "ada limit". Nilai disimpan di `QuotaConfig` agar Admin dapat mengubah tanpa kode.
- **Create Brief** memakai pola yang sama dengan jenis konten, struktur kolom, dan caption dari PRD platform sebelumnya; pengeditan brief tidak dibahas di sini.
- **Create Audio = text-to-speech saja**. Musik/sound effect tidak termasuk karena brief tidak menyebutnya.
- **Tombol Unduh dan Hapus** ditambahkan di popup meski tidak disebut brief, karena galeri bersama membutuhkan kontrol pemilik dan hasil yang bisa dipakai. Jika tidak diinginkan, FR-MOD-8 dan FR-MOD-9 dapat dihapus.
- **Dimensi image**: provider hanya mendukung beberapa ukuran native, sehingga dimensi akhir dicapai lewat center-crop dan resize (FR-IMG-5). Dimensi di atas ukuran native berarti hasil di-upscale tanpa detail tambahan.
- **Video**: ketersediaan, durasi, dan resolusi yang benar-benar didukung API video OpenAI harus dikonfirmasi saat implementasi; opsi (5/10/15 dtk, 720p/1080p) disimpan di `config/generation.ts` dan bisa disesuaikan atau diganti provider lain tanpa mengubah UI.
- **Polling 3 detik** dipilih daripada WebSocket/SSE agar sederhana; dapat diganti kemudian tanpa mengubah kontrak UI.
- **Preferensi konfigurasi** disimpan di browser (per perangkat), bukan di server.
- **Tema/gaya** glassmorphism dan Dark/Light dilanjutkan dari PRD platform sebelumnya.
- **Autentikasi & role** (Admin/Creator) mengikuti PRD platform sebelumnya; PRD ini hanya memakai `userId`, nama, avatar, dan role.
- **Zona waktu** seluruh tampilan waktu dan reset kuota: Asia/Jakarta (WIB).

---

## Open Questions

- [ ] Apakah angka kuota default (20 / 5 / 30 / 30 per hari) sudah sesuai, atau ada angka dari anggaran provider AI yang harus dipakai?
- [ ] Apakah penghapusan hasil sebaiknya hanya oleh Admin (bukan pemilik) untuk menjaga galeri bersama tetap utuh?
- [ ] Apakah perlu filter konten sensitif/moderasi tambahan di galeri bersama selain penolakan dari provider?
- [ ] Apakah Create Audio juga perlu fitur musik atau sound effect di fase ini?

Selain empat pertanyaan di atas, seluruh keputusan teknis sudah diasumsikan secara eksplisit dan spesifikasi ini siap diimplementasikan.