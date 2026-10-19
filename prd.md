# PRD: AI Content Creator Platform — Hulu ke Hilir

**Versi:** v1.0
**Tanggal:** 16 Oktober 2026
**Status:** Ready for implementation

## Ringkasan
Platform AI untuk content creator internal yang mencakup seluruh siklus produksi konten dalam satu tempat: melihat insight performa konten sendiri, menemukan topik trending, menurunkan topik menjadi angle, memilih jenis konten, menyusun content brief yang bisa diedit, men-generate media (image/carousel/video/audio/artikel), mengedit hasilnya di editor bawaan, lalu mengunduh/ekspor. Setiap fitur juga bisa dipakai mandiri (standalone) tanpa mengikuti alur utama, dan creator bisa memasukkan referensi (dokumen, media, audio) untuk diubah jadi brief atau script.

Tujuan produk: creator tidak perlu berpindah-pindah tools dan waktu produksi konten menjadi lebih singkat.

## Tujuan
- Satu workspace dari insight sampai file siap pakai
- Rekomendasi topik dan angle berbasis data nyata (performa konten sendiri + tren eksternal)
- Semua fitur bisa dipakai terpisah sesuai kebutuhan, bukan hanya lewat satu alur kaku
- Hasil generate bisa diedit lengkap di dalam platform sebelum diekspor

---

## Goals
- Alur utama terpandu: Insight → Topik → Angle → Jenis Konten → Brief → Generate → Editor → Export
- Mode standalone: generate image, carousel, video, audio, artikel, dan brief langsung dari menu
- Input referensi multi-format yang dikonversi menjadi brief/script
- Tiga sumber media: aset milik creator (upload), Asset Management platform, dan generate AI
- Rekomendasi caption sosial media otomatis di setiap brief
- Data analitik dan tren berasal dari integrasi sungguhan (API platform sosial media, sumber internal, penyedia data tren)

## Non-Goals (Out of Scope v1)
- Publish/auto-post ke sosial media (v1 hanya download/ekspor; caption disediakan untuk disalin)
- Kolaborasi real-time multi-user pada satu konten, komentar, workflow approval
- Billing, kuota berbayar, dan marketplace template
- Aplikasi native mobile (web responsif saja)
- Editor video profesional multi-track tingkat NLE (v1 timeline sederhana, lihat FR-ED-4)
- Penjadwalan konten dan kalender editorial
- Multi-workspace/multi-tenant (satu perusahaan)

---

## Peta Modul
| Kode | Modul |
|---|---|
| `AUTH` | Akun, role, pengaturan, tema |
| `CONN` | Koneksi data: akun sosial media (read-only), sumber internal, sinkronisasi |
| `INS` | Insight performa konten |
| `TRD` | Rekomendasi topik trending & topik buatan sendiri |
| `ANG` | Angle dan pemilihan jenis konten |
| `BRF` | Content brief dan caption |
| `REF` | Input referensi (dokumen/media/audio) |
| `GEN` | Generate media dan konten |
| `ED` | Editor per jenis konten |
| `AST` | Asset Management |
| `EXP` | Download/ekspor |
| `SA` | Mode standalone |
| `NFR` | Non-functional (responsif, performa, keamanan) |

## Alur Utama (Ringkas)
1. Creator membuka **Insight**: ringkasan performa konten + insight AI
2. Creator masuk **Topik**: memilih dari rekomendasi trending atau mengetik topik sendiri
3. AI menghasilkan **Angle** (5–9) untuk topik itu, disertai insight per angle
4. Creator memilih satu angle lalu memilih **tepat satu jenis konten** (Image, Carousel, Video, Audio, Artikel); AI menandai 3 jenis yang paling direkomendasikan
5. AI menyusun **Content Brief** (tabel) + rekomendasi caption; creator bisa mengedit
6. Creator klik **Generate**; media diambil dari aset creator, Asset Management, atau generate AI
7. Hasil dibuka di **Editor** sesuai jenis konten
8. Creator **mengunduh/mengekspor** file

---

## Functional Requirements

### AUTH — Akun & Pengaturan

**FR-AUTH-1**: Login dengan email + password. Pengguna baru masuk lewat undangan Admin (link berlaku 7 hari).

**FR-AUTH-2**: Dua role: `admin` (kelola anggota, koneksi data, pengaturan workspace) dan `creator` (semua fitur pembuatan konten, tidak bisa kelola anggota/koneksi workspace).

**FR-AUTH-3**: Halaman Pengaturan berisi: profil (nama, foto, ganti password), tema (Light / Dark / Ikuti sistem), niche/profil kreator (teks bebas + pilihan kategori, dipakai sebagai konteks rekomendasi), dan bahasa konten default (Indonesia/Inggris).

**FR-AUTH-4**: Tema tersimpan per user dan diterapkan tanpa flash warna salah saat halaman dimuat.

### CONN — Koneksi Data & Sinkronisasi

**FR-CONN-1**: Admin dapat menghubungkan akun Instagram, TikTok, X, Facebook, dan YouTube lewat OAuth dengan scope **read-only** (insight/analitik). Satu workspace dapat memiliki beberapa akun per platform.

**FR-CONN-2**: Creator dapat menautkan dirinya ke satu atau lebih akun yang sudah terhubung (relasi `owner`), sehingga Insight hanya menampilkan konten milik akun yang ditautkan pada creator tersebut. Admin dapat melihat semua.

**FR-CONN-3**: Sumber data internal dihubungkan lewat **Internal Data Connector**: endpoint JSON bersertifikat API key yang mengikuti skema `InternalContentRecord` (lihat Technical Requirements) dan/atau unggah CSV dengan kolom yang sama. Admin mengatur URL, API key, dan jadwal tarik.

**FR-CONN-4**: Sinkronisasi data berjalan otomatis setiap 6 jam via job terjadwal, dan dapat dipicu manual lewat tombol "Sinkronkan sekarang" (maks 1x per 15 menit per sumber).

**FR-CONN-5**: Hasil sinkronisasi dinormalisasi ke tabel `ContentMetric` dengan metrik inti lintas platform (reach, impressions/views, engagement, engagement rate) dan metrik spesifik format di kolom JSON.

**FR-CONN-6**: Status tiap koneksi ditampilkan: `connected`, `syncing`, `error`, `expired`. Jika token kedaluwarsa atau API error, status berubah dan Admin melihat pesan penyebabnya; data lama tetap ditampilkan dengan label "Terakhir sinkron: <waktu>".

**FR-CONN-7**: Data tren eksternal diambil lewat **Trend Provider** berbentuk adapter. Adapter v1: Google Trends (via penyedia data pihak ketiga), YouTube Data API (video populer per kategori/negara), dan X API (trending topics). Adapter dapat ditambah tanpa mengubah modul lain.

**FR-CONN-8**: Data tren di-refresh setiap 3 jam dan disimpan sebagai `TrendSignal` bersama sumber, wilayah (default `ID`), dan skor volume ternormalisasi (0–100).

### INS — Insight Performa

**FR-INS-1**: Halaman Insight menampilkan filter periode (7/30/90 hari + custom, default 30 hari) dan filter sumber (Internal, Instagram, TikTok, X, Facebook, YouTube; default semua).

**FR-INS-2**: Strip KPI menampilkan Total Reach, Total Impressions/Views, Total Engagement, dan Rata-rata Engagement Rate untuk filter aktif, beserta persentase perubahan dibanding periode sebelumnya dengan durasi sama.

**FR-INS-3**: Daftar **Konten Paling Works** diurutkan Engagement Rate descending (opsi urut lain: Reach, Views, Engagement), 20 item per muat, dengan "Muat lebih banyak".

**FR-INS-4**: Setiap item menampilkan thumbnail, judul/caption singkat, badge sumber, badge format, tanggal, dan 4 metrik inti. Klik membuka panel detail inline berisi metrik spesifik platform & format (mis. retention curve video, swipe-through carousel, drop-off thread).

**FR-INS-5**: Tiap item menampilkan indikator vs benchmark Engagement Rate untuk kombinasi platform+format yang punya benchmark (lihat tabel Benchmark). Platform/format tanpa benchmark tidak menampilkan indikator.

**FR-INS-6**: Panel **Insight AI** menampilkan 3–5 insight naratif berbasis data filter aktif (mis. format yang konsisten unggul, jam posting terbaik, topik yang naik). Setiap insight memuat dasar angka dan tombol "Jadikan topik" yang membuka modul Topik dengan konteks insight tersebut.

**FR-INS-7**: Insight AI di-generate ulang hanya saat filter berubah atau user menekan "Perbarui insight", dan di-cache per kombinasi filter selama 1 jam.

**FR-INS-8**: Jika tidak ada data (belum ada koneksi atau tidak ada konten di periode itu), tampilkan empty state dengan CTA "Hubungkan sumber data" (untuk Admin) atau pesan menghubungi Admin (untuk Creator).

### TRD — Topik

**FR-TRD-1**: Halaman Topik menampilkan 10 **rekomendasi topik trending**, masing-masing berisi judul topik, ringkasan 1–2 kalimat, sumber sinyal tren (badge), skor tren (0–100), dan skor kecocokan dengan niche creator (0–100).

**FR-TRD-2**: Rekomendasi dibangun AI dari gabungan `TrendSignal` terbaru, niche/profil creator (FR-AUTH-3), dan performa konten creator (FR-INS) sehingga topik yang relevan dengan niche dan format yang selama ini unggul diprioritaskan.

**FR-TRD-3**: Creator dapat memfilter rekomendasi berdasarkan sumber tren dan kategori, serta menekan "Segarkan rekomendasi" (maks 1x per 5 menit).

**FR-TRD-4**: Creator dapat memilih satu topik dari rekomendasi **atau** mengetik topik sendiri (teks 3–200 karakter) pada input "Buat topik sendiri".

**FR-TRD-5**: Setelah topik dipilih/dibuat, AI menampilkan **Insight Topik**: ringkasan mengapa topik relevan, data pendukung (sinyal tren, konten sejenis milik creator beserta performanya jika ada), dan audiens/platform yang paling cocok.

**FR-TRD-6**: Untuk topik buatan sendiri tanpa sinyal tren yang cocok, Insight Topik tetap ditampilkan berdasarkan data performa creator dan pengetahuan umum AI, dengan catatan "Belum ada sinyal tren eksternal untuk topik ini".

### ANG — Angle & Jenis Konten

**FR-ANG-1**: Setelah topik dipilih, AI menghasilkan **5 hingga 9 angle** (target 8) berupa kartu: judul angle, deskripsi 1–2 kalimat, target audiens, dan alasan angle ini menarik (insight singkat).

**FR-ANG-2**: Creator dapat meminta angle tambahan atau mengganti angle ("Buat angle lain"), dengan total angle tersimpan per topik maksimal 9 yang aktif.

**FR-ANG-3**: Creator dapat mengedit judul dan deskripsi angle, atau menambah angle buatan sendiri.

**FR-ANG-4**: Setelah memilih satu angle, tampil pemilihan jenis konten dengan 5 opsi: **Single Image, Carousel, Video, Audio, Artikel**. Creator hanya dapat memilih **tepat satu** jenis per angle yang diproses (radio, bukan checkbox).

**FR-ANG-5**: AI menandai maksimal **3 jenis konten** sebagai "Direkomendasikan" untuk angle tersebut berdasarkan sifat angle dan performa format creator di data insight, disertai alasan satu kalimat. Jenis yang tidak direkomendasikan tetap bisa dipilih.

**FR-ANG-6**: Creator dapat memproses beberapa angle secara berurutan dalam satu topik; setiap kombinasi angle+jenis menjadi satu **Project Konten** terpisah.

### BRF — Content Brief & Caption

**FR-BRF-1**: Setelah jenis dipilih, AI men-generate **Content Brief** berbentuk tabel yang struktur kolomnya mengikuti jenis konten:
- Single Image: elemen visual, teks pada gambar, rasio, gaya visual, catatan
- Carousel: nomor slide, judul slide, isi teks, deskripsi visual, catatan (jumlah slide 5–10)
- Video: nomor scene, durasi (detik), visual, narasi/dialog, teks on-screen, audio/musik, sumber media
- Audio: segmen, durasi estimasi (detik), naskah, nada/gaya bicara, efek/musik
- Artikel: nomor section, judul section, poin utama, perkiraan jumlah kata, referensi

**FR-BRF-2**: Di atas tabel, brief memuat ringkasan: judul konten, tujuan, target audiens, tone, durasi/ukuran total, dan platform tujuan yang disarankan.

**FR-BRF-3**: Seluruh sel tabel dapat diedit langsung (inline). Baris dapat ditambah, dihapus, dan diurutkan ulang (drag-and-drop pada desktop, tombol naik/turun pada mobile). Perubahan tersimpan otomatis.

**FR-BRF-4**: Creator dapat meminta AI merevisi satu baris atau seluruh brief lewat kolom instruksi (mis. "buat lebih santai"); hanya bagian yang dimaksud yang berubah, dan versi sebelumnya dapat dikembalikan lewat riwayat 10 versi terakhir.

**FR-BRF-5**: Setiap brief menyertakan **3 rekomendasi caption** untuk sosial media, masing-masing dengan variasi gaya (informatif, santai, CTA kuat), hashtag (3–8), dan indikator platform yang cocok. Caption dapat diedit, disalin dengan satu klik, dan di-generate ulang.

**FR-BRF-6**: Brief memiliki status `draft` atau `siap`. Tombol "Generate Konten" aktif hanya saat status `siap` dan tidak ada sel wajib yang kosong.

### REF — Input Referensi

**FR-REF-1**: Creator dapat mengunggah referensi: dokumen (PDF, DOCX, TXT, MD), gambar (JPG, PNG, WEBP), video (MP4, MOV), audio (MP3, WAV, M4A), dan menempelkan URL artikel/video. Maks 10 file per sesi, 200 MB per file, 20 MB untuk dokumen.

**FR-REF-2**: Sistem mengekstrak isi referensi: teks dari dokumen, transkrip dari audio/video (speech-to-text), deskripsi visual dari gambar/frame video, dan teks dari URL.

**FR-REF-3**: Creator memilih jenis keluaran dari referensi: Content Brief atau Script (untuk video/audio), lalu jenis konten tujuan. Hasilnya muncul sebagai brief (FR-BRF) yang dapat diedit.

**FR-REF-4**: Brief hasil referensi menampilkan kolom "Sumber" yang menunjuk bagian referensi asal (mis. halaman, timestamp) agar bisa diverifikasi.

**FR-REF-5**: Referensi dan hasil ekstraksi tersimpan di Asset Management dengan label `reference` dan hanya bisa diakses pemiliknya.

### GEN — Generate Konten

**FR-GEN-1**: Klik "Generate Konten" membuat satu `Creation` dari brief dan menjalankan proses asinkron per jenis:
- **Single Image**: 1 gambar (rasio sesuai brief)
- **Carousel**: N slide gambar sesuai jumlah baris brief
- **Video**: klip per scene, narasi, musik, dan teks on-screen, dirakit menjadi satu video
- **Audio**: audio hasil text-to-speech dari naskah, dengan musik/efek bila diminta
- **Artikel**: teks artikel lengkap per section

**FR-GEN-2**: Untuk setiap kebutuhan media visual (gambar/klip) pada brief, creator memilih **salah satu dari tiga sumber media** per item: (a) **Aset Creator** (unggah dari perangkat), (b) **Asset Management** (pilih dari library platform), (c) **Generate AI**. Default semua item = Generate AI.

**FR-GEN-3**: Pada pemilihan sumber (a) dan (b), sistem memakai media apa adanya dengan penyesuaian rasio/crop; pada sumber (c), sistem memakai prompt yang diturunkan dari kolom visual brief dan prompt dapat dilihat serta diedit sebelum generate.

**FR-GEN-4**: Provider generate berbentuk adapter yang dapat diganti per jenis media. Default v1: gambar & video via OpenAI; suara via ElevenLabs; teks via model LLM platform. Pemilihan provider diatur Admin tanpa perubahan kode (konfigurasi).

**FR-GEN-5**: UI menampilkan progres per `Creation` dan per item di dalamnya dengan status `queued` → `processing` → `completed` / `failed`, serta estimasi waktu bila tersedia. User dapat meninggalkan halaman; notifikasi in-app muncul saat selesai.

**FR-GEN-6**: Item yang gagal dapat dicoba ulang satuan tanpa mengulang item yang sudah berhasil. Pesan error ditampilkan dalam bahasa yang dapat dipahami.

**FR-GEN-7**: Setiap hasil generate AI dapat di-generate ulang per item (variasi baru); versi sebelumnya tetap tersimpan di riwayat item tersebut (maks 5 versi).

**FR-GEN-8**: Setelah semua item `completed`, `Creation` otomatis dibuka di Editor (FR-ED).

### ED — Editor

**FR-ED-1 (umum)**: Editor menyimpan otomatis setiap 5 detik setelah ada perubahan, mendukung undo/redo (minimal 50 langkah), dan menampilkan status "Tersimpan". Panel kanan (desktop) atau bottom sheet (mobile) memuat properti elemen terpilih.

**FR-ED-2 (Single Image)**: Kanvas dengan: ganti rasio (1:1, 4:5, 9:16, 16:9), tambah/edit/hapus layer teks (font, ukuran, warna, alignment, shadow), tambah layer gambar/logo dari Asset Management, crop, rotate, filter dasar (brightness, contrast, saturation), dan ganti gambar latar (pilih dari tiga sumber media FR-GEN-2).

**FR-ED-3 (Carousel)**: Editor slide dengan daftar thumbnail slide; tambah, duplikat, hapus, dan urutkan ulang slide (5–10 slide); tiap slide diedit dengan kemampuan setara Single Image; dapat menerapkan gaya teks/warna ke semua slide sekaligus.

**FR-ED-4 (Video)**: Timeline sederhana dengan: urutan scene (trim, split, urutkan, hapus), satu track narasi, satu track musik (atur volume, trim), layer teks on-screen dengan durasi muncul, subtitle otomatis dari narasi yang dapat diedit, penggantian klip per scene dari tiga sumber media, dan preview player. Resolusi ekspor default 1080p; rasio 9:16 / 16:9 / 1:1.

**FR-ED-5 (Audio)**: Editor naskah per segmen dengan pemilihan suara, kecepatan, dan nada per segmen; generate ulang per segmen; atur musik latar dan volume; waveform dengan trim awal/akhir; preview player.

**FR-ED-6 (Artikel)**: Editor teks kaya (heading, bold/italic, list, link, kutipan, sisipan gambar dari tiga sumber media), jumlah kata/karakter, dan tombol revisi AI pada teks terpilih (ubah tone, ringkas, perpanjang).

**FR-ED-7**: Panel Caption selalu tersedia di Editor, menampilkan 3 caption rekomendasi dari brief (FR-BRF-5) yang bisa diedit dan disalin.

**FR-ED-8**: Perubahan di Editor tidak men-generate ulang media AI kecuali user menekan generate ulang pada item tersebut; edit teks/layer/trim langsung terlihat di preview.

### AST — Asset Management

**FR-AST-1**: Menu Asset Management menyimpan semua media: unggahan creator, hasil generate, referensi, dan ekspor. Tipe: Gambar, Video, Audio, Teks/Artikel, Referensi.

**FR-AST-2**: Asset dapat dicari (nama, tag), difilter (tipe, sumber: upload/generate/referensi, tanggal, pemilik), diberi tag, diganti nama, dan dihapus.

**FR-AST-3**: Setiap asset memiliki visibilitas `private` (hanya pemilik) atau `workspace` (semua anggota). Default `private`; hasil generate boleh diubah ke `workspace` oleh pemiliknya.

**FR-AST-4**: Saat memilih media dari Asset Management di Editor/Generate, hanya asset yang visibilitasnya memungkinkan (milik sendiri atau `workspace`) yang tampil.

**FR-AST-5**: Penghapusan asset yang sedang dipakai suatu Creation ditolak dengan pesan menyebut konten yang memakainya, kecuali user memilih "Hapus dan lepas dari konten" (media diganti placeholder pada konten tersebut).

### EXP — Download & Ekspor

**FR-EXP-1**: Ekspor tersedia per jenis:
- Single Image: PNG, JPG
- Carousel: ZIP berisi PNG per slide, dan PDF satu file
- Video: MP4 (H.264)
- Audio: MP3, WAV
- Artikel: Markdown (.md), DOCX, dan salin sebagai teks

**FR-EXP-2**: Pengaturan ekspor memuat kualitas/resolusi (gambar: 1x/2x; video: 720p/1080p) dan opsi sertakan caption sebagai file `caption.txt` dalam paket unduhan.

**FR-EXP-3**: Ekspor dijalankan sebagai job asinkron; progres ditampilkan dan file tersedia lewat tautan unduhan selama 24 jam serta otomatis tersimpan di Asset Management.

**FR-EXP-4**: Nama file ekspor mengikuti pola `{judul-slug}_{jenis}_{YYYYMMDD}.{ekstensi}`.

### SA — Mode Standalone

**FR-SA-1**: Menu **Studio** menyediakan pintu masuk langsung ke: Generate Image, Generate Carousel, Generate Video, Generate Audio, Tulis Artikel, Buat Content Brief, dan Referensi → Brief/Script, tanpa harus melewati Insight/Topik/Angle.

**FR-SA-2**: Setiap tool standalone memakai kemampuan modul yang sama (BRF, GEN, ED, EXP), dimulai dari form prompt singkat (instruksi, jumlah/rasio/durasi, tone, sumber media) dan menghasilkan Project Konten berstatus `standalone`.

**FR-SA-3**: Dari Project Konten yang dibuat lewat alur utama atau standalone, creator dapat berpindah modul kapan saja (mis. dari brief standalone langsung Generate, dari Editor kembali ke brief) tanpa kehilangan data.

**FR-SA-4**: Halaman Proyek menampilkan semua Project Konten (alur utama dan standalone) dengan status (`brief`, `generating`, `editing`, `diekspor`), dapat difilter dan dicari, serta dilanjutkan dari tahap terakhir.

### NFR — Non-Functional

**FR-NFR-1 (Responsif)**: Desktop ≥1024px (sidebar tetap), tablet 768–1023px (sidebar collapsible), mobile <768px (bottom navigation). Editor di mobile memakai mode terbatas: semua fungsi tersedia lewat bottom sheet, timeline video bisa digulir horizontal.

**FR-NFR-2 (Performa)**: Halaman non-editor memuat konten pertama ≤2,5 detik pada jaringan 4G; respons aksi UI ≤200 ms (di luar proses AI/jaringan); autosave tidak memblokir interaksi.

**FR-NFR-3 (Keamanan)**: Token OAuth dan API key provider disimpan terenkripsi (AES-256-GCM, kunci dari environment/secret manager). File unggahan dipindai tipe & ukuran; URL media memakai signed URL berkedaluwarsa.

**FR-NFR-4 (Aksesibilitas)**: Kontras teks minimal 4,5:1, seluruh kontrol dapat dioperasikan keyboard di luar kanvas editor, dan label ARIA pada kontrol ikon.

**FR-NFR-5 (Gaya visual)**: Antarmuka memakai gaya glassmorphism (panel blur semi-transparan, border tipis) konsisten di Light dan Dark mode; kontrol fungsional (tombol utama, input) tetap kontras tinggi tanpa efek kaca.

---

## Technical Requirements

### Stack
- Frontend + Backend: Next.js 14 (App Router), TypeScript, Tailwind CSS
- Database: MySQL 8 via Prisma ORM
- Job queue: Redis + BullMQ (sinkronisasi, tren, generate, ekspor)
- Object storage: S3-compatible (media, referensi, ekspor)
- Pemrosesan media server-side: FFmpeg (perakitan video, konversi audio, ekspor)
- Canvas editor (image/carousel): library canvas berbasis browser (mis. Konva/Fabric.js); timeline video: komponen kustom di atas `<video>`/WebCodecs, render final di server dengan FFmpeg
- AI: LLM (analisis, insight, topik, angle, brief, caption), OpenAI (image & video), ElevenLabs (TTS), speech-to-text untuk transkrip referensi
> Asumsi stack dilanjutkan dari proyek sebelumnya. Lihat seksi Asumsi.

### Skema `InternalContentRecord` (kontrak Internal Data Connector)

```json
{
  "id": "art-2026-0912",
  "title": "5 Rutinitas Pagi Tim Remote yang Produktif",
  "format": "artikel",
  "publishedAt": "2026-09-12T03:00:00Z",
  "ownerEmail": "creator@perusahaan.com",
  "url": "https://perusahaan.com/artikel/rutinitas-pagi",
  "thumbnailUrl": "https://cdn.perusahaan.com/t/art-2026-0912.jpg",
  "metrics": { "reach": 40500, "impressions": 48200, "engagement": 2750, "pageViews": 12300, "avgReadTimeSeconds": 240, "shares": 310 }
}
```
Endpoint harus mendukung query `?since=<ISO8601>&cursor=<string>` dan mengembalikan `{ "items": [...], "nextCursor": "..." | null }`. CSV memakai kolom: `id,title,format,publishedAt,ownerEmail,url,thumbnailUrl,reach,impressions,engagement,pageViews,avgReadTimeSeconds,shares`.

### Metrik Inti & Format-Specific (normalisasi `ContentMetric`)

| Sumber | Format | Metrik detail (kolom `formatMetrics`) |
|---|---|---|
| Internal | artikel | pageViews, avgReadTimeSeconds, shares |
| Instagram | reels | avgWatchTimeSeconds, completionRate, retentionCurve, shares, saves, followsFromReel |
| Instagram | image | saves, profileVisits, follows |
| Instagram | carousel | swipeThroughRate, saves, shares, lastSlideCTR |
| TikTok | video | avgWatchTimeSeconds, completionRate, retentionCurve, shares, saves, follows, trafficSource |
| TikTok | image/carousel | swipeThroughRate, shares, saves |
| X | video | views3s, views50pct, views95pct, completionRate, mediaEngagementRate |
| X | image | linkClicks, retweets, quotes |
| X | thread | tweetBreakdown, dropOffRate, profileClicks, follows |
| Facebook | video | views3s, views10s, thruPlays, avgWatchTimeSeconds, shares, clicks |
| Facebook | image | reactions, comments, shares, clicks |
| Facebook | carousel | clicksPerImage, shares |
| YouTube | long_form | ctr, avgViewDurationSeconds, avgPercentageViewed, retentionCurve, trafficSource |
| YouTube | shorts | avgViewDurationSeconds, completionRate, swipeAwayRate, likes, comments, shares, subscribes |
| YouTube | community_post | impressions, likes, comments, votes |

`engagementRate` dihitung sistem: `engagement / reach` bila `reach` tersedia, selain itu `engagement / impressions` (X, YouTube).

### Benchmark Engagement Rate (untuk FR-INS-5)

| Platform | Format | Benchmark median (organik) |
|---|---|---|
| Instagram | reels | 0,5% – 1%+ (pakai 0,5% sebagai garis banding) |
| Instagram | carousel | 0,55% |
| TikTok | video | 3,39% |
| TikTok | image/carousel | 1,92% |
| X | image / text | 3,4% |
| Facebook | image | 5,20% |
| Facebook | video | 4,84% |
| YouTube, Internal | — | tidak ada benchmark ER; indikator tidak ditampilkan |

Benchmark disimpan di file konfigurasi `config/benchmarks.ts` agar mudah diperbarui.

### Data Model (Prisma, inti)

```prisma
model User {
  id           String   @id @default(uuid())
  name         String
  email        String   @unique
  passwordHash String
  role         String   // 'admin' | 'creator'
  theme        String   @default("system")
  niche        String?  @db.Text
  contentLang  String   @default("id")
  createdAt    DateTime @default(now())
}

model DataConnection {
  id            String    @id @default(uuid())
  type          String    // 'instagram'|'tiktok'|'x'|'facebook'|'youtube'|'internal'
  displayName   String
  accessToken   String?   @db.Text   // terenkripsi
  refreshToken  String?   @db.Text   // terenkripsi
  config        Json?     // untuk internal: { url, apiKeyEncrypted, schedule }
  status        String    // 'connected'|'syncing'|'error'|'expired'
  lastSyncedAt  DateTime?
  lastError     String?
  ownerUserIds  Json      // array userId yang ditautkan (FR-CONN-2)
}

model ContentMetric {
  id             String   @id @default(uuid())
  connectionId   String
  externalId     String
  source         String
  format         String
  title          String
  thumbnailUrl   String?
  url            String?
  publishedAt    DateTime
  reach          Int?
  impressions    Int
  engagement     Int
  engagementRate Float
  formatMetrics  Json
  syncedAt       DateTime @default(now())
  @@unique([connectionId, externalId])
  @@index([publishedAt])
}

model TrendSignal {
  id         String   @id @default(uuid())
  provider   String   // 'google_trends'|'youtube'|'x'
  region     String   @default("ID")
  keyword    String
  category   String?
  volumeScore Int     // 0-100
  rawPayload Json?
  fetchedAt  DateTime @default(now())
  @@index([fetchedAt])
}

model Project {
  id          String   @id @default(uuid())
  userId      String
  origin      String   // 'flow' | 'standalone'
  topicTitle  String?
  topicSource String?  // 'trending' | 'custom'
  angleTitle  String?
  angleDesc   String?  @db.Text
  contentType String?  // 'image'|'carousel'|'video'|'audio'|'article'
  status      String   // 'brief'|'generating'|'editing'|'exported'
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model ContentBrief {
  id         String   @id @default(uuid())
  projectId  String   @unique
  summary    Json     // judul, tujuan, audiens, tone, durasi/ukuran, platform
  rows       Json     // array baris sesuai jenis konten (FR-BRF-1)
  captions   Json     // 3 caption: { style, text, hashtags[] }
  status     String   // 'draft' | 'siap'
  versions   Json     // maks 10 snapshot
  updatedAt  DateTime @updatedAt
}

model ReferenceInput {
  id          String   @id @default(uuid())
  userId      String
  projectId   String?
  kind        String   // 'document'|'image'|'video'|'audio'|'url'
  assetId     String?
  url         String?
  extractedText String? @db.LongText
  status      String   // 'processing'|'ready'|'failed'
}

model Asset {
  id          String   @id @default(uuid())
  ownerId     String
  type        String   // 'image'|'video'|'audio'|'text'|'reference'
  origin      String   // 'upload'|'generated'|'reference'|'export'
  name        String
  fileUrl     String?
  textContent String?  @db.LongText
  tags        Json
  visibility  String   @default("private") // 'private'|'workspace'
  sizeBytes   BigInt?
  createdAt   DateTime @default(now())
}

model Creation {
  id          String   @id @default(uuid())
  projectId   String
  type        String
  editorState Json     // lihat contoh struktur di bawah
  status      String   // 'generating'|'ready'|'failed'
  updatedAt   DateTime @updatedAt
  items       CreationItem[]
}

model CreationItem {
  id          String   @id @default(uuid())
  creationId  String
  briefRowRef Int      // indeks baris brief
  mediaSource String   // 'creator_asset'|'asset_management'|'ai_generated'
  assetId     String?
  prompt      String?  @db.Text
  provider    String?
  status      String   // 'queued'|'processing'|'completed'|'failed'
  errorMessage String?
  versions    Json     // riwayat maks 5 versi
  creation    Creation @relation(fields: [creationId], references: [id])
}

model ExportJob {
  id         String   @id @default(uuid())
  creationId String
  format     String   // 'png'|'jpg'|'zip'|'pdf'|'mp4'|'mp3'|'wav'|'md'|'docx'
  options    Json
  status     String   // 'queued'|'processing'|'completed'|'failed'
  assetId    String?
  expiresAt  DateTime?
}
```

### Contoh `editorState`

```json
// carousel
{
  "ratio": "4:5",
  "slides": [
    { "id": "s1", "background": { "assetId": "uuid", "fit": "cover" },
      "layers": [ { "type": "text", "text": "3 Tanda Kamu Butuh Cuti", "x": 64, "y": 420, "fontSize": 72, "fontFamily": "Inter", "color": "#FFFFFF", "align": "left" } ] }
  ]
}
```
```json
// video
{
  "ratio": "9:16", "resolution": "1080p",
  "scenes": [ { "id": "sc1", "clipAssetId": "uuid", "startSec": 0, "endSec": 6, "texts": [ { "text": "POV: Senin WFH lagi", "fromSec": 0.5, "toSec": 4 } ] } ],
  "narration": { "assetId": "uuid", "volume": 1.0 },
  "music": { "assetId": "uuid", "volume": 0.3 },
  "subtitles": [ { "fromSec": 0, "toSec": 3.2, "text": "Senin pertama WFH lagi..." } ]
}
```

### API Contract (endpoint kunci)

**GET /api/insights?from=2026-09-16&to=2026-10-16&sources=instagram,tiktok&sortBy=engagementRate&limit=20&offset=0**
```json
{
  "kpi": { "totalReach": 622200, "totalImpressions": 968500, "totalEngagement": 41335, "avgEngagementRate": 5.07, "previousPeriod": { "totalReach": 580100, "avgEngagementRate": 4.6 } },
  "items": [ { "id": "uuid", "source": "instagram", "format": "carousel", "title": "3 Tanda Kamu Butuh Cuti", "publishedAt": "2026-09-08", "core": { "reach": 98500, "impressions": 110200, "engagement": 7780, "engagementRate": 7.9 }, "formatMetrics": { "swipeThroughRate": 54.2, "saves": 4100 }, "benchmark": { "er": 0.55, "status": "above" } } ],
  "hasMore": true
}
```

**POST /api/insights/ai** — body `{ "from": "...", "to": "...", "sources": [] }` → `{ "insights": [ { "text": "...", "evidence": "Carousel IG rata-rata ER 7,9% vs reels 4,0%", "suggestedTopic": "Tanda burnout karyawan" } ] }`

**GET /api/topics/recommendations**
```json
{ "items": [ { "id": "tp-1", "title": "Quiet quitting versi 2026", "summary": "…", "sources": ["google_trends", "x"], "trendScore": 86, "nicheFit": 74 } ] }
```

**POST /api/projects** — `{ "origin": "flow", "topicTitle": "...", "topicSource": "custom" }` → `{ "projectId": "uuid" }`

**POST /api/projects/:id/angles** → `{ "angles": [ { "id": "ag-1", "title": "...", "description": "...", "audience": "...", "reason": "..." } ] }` (5–9 item)

**POST /api/projects/:id/content-type** — `{ "angleId": "ag-1", "contentType": "carousel" }` → `{ "recommendedTypes": [ { "type": "carousel", "reason": "..." }, { "type": "video", "reason": "..." }, { "type": "image", "reason": "..." } ] }`

**POST /api/projects/:id/brief** → `{ "briefId": "uuid", "summary": {…}, "rows": […], "captions": […] }`

**PATCH /api/briefs/:id** — `{ "rows": [...], "status": "siap" }`; **POST /api/briefs/:id/revise** — `{ "instruction": "buat lebih santai", "rowIndex": 3 | null }`

**POST /api/references** (multipart) → `{ "referenceId": "uuid", "status": "processing" }`; **POST /api/references/:id/to-brief** — `{ "output": "brief" | "script", "contentType": "video" }`

**POST /api/creations** — `{ "projectId": "uuid", "mediaSources": [ { "briefRow": 1, "source": "ai_generated" }, { "briefRow": 2, "source": "asset_management", "assetId": "uuid" } ] }` → 202 `{ "creationId": "uuid", "status": "generating" }`

**GET /api/creations/:id** → status + items; **PATCH /api/creations/:id/editor-state** → autosave; **POST /api/creation-items/:id/regenerate**

**POST /api/exports** — `{ "creationId": "uuid", "format": "mp4", "options": { "resolution": "1080p", "includeCaption": true } }` → 202 `{ "exportJobId": "uuid" }`

**Assets**: `GET /api/assets?type=image&origin=upload&q=...`, `POST /api/assets` (multipart), `PATCH /api/assets/:id`, `DELETE /api/assets/:id?force=true`

**Koneksi**: `POST /api/connections/:type/oauth/start`, `GET /api/connections/:type/oauth/callback`, `POST /api/connections/internal`, `POST /api/connections/:id/sync`

---

## UI/UX Requirements

- **Navigasi utama (sidebar/bottom nav)**: Insight, Topik, Studio, Proyek, Asset, Pengaturan (Koneksi untuk Admin ada di Pengaturan)
- **Alur terpandu**: indikator langkah di atas (Topik → Angle → Jenis → Brief → Generate → Editor → Export) yang bisa diklik untuk kembali ke langkah sebelumnya tanpa kehilangan data
- **Kartu angle**: grid kartu; kartu terpilih ditandai jelas; pemilihan jenis konten berupa 5 kartu ikon dengan badge "Direkomendasikan" pada maksimal 3 kartu
- **Brief**: tabel dengan header lengket, sel dapat diedit inline, kolom "Sumber media" berupa dropdown 3 pilihan, panel caption di samping (desktop) atau tab (mobile)
- **Generate**: halaman progres dengan daftar item + status; dapat diminimalkan jadi indikator di header
- **Editor**: kanvas/timeline di tengah, panel properti di kanan, daftar slide/scene di kiri atau bawah; toolbar undo/redo, zoom, preview
- **Tema**: Light/Dark; gaya glassmorphism pada panel dan kartu (lihat FR-NFR-5)
- **State standar**: skeleton loader saat memuat; empty state beraksi (CTA) ; error state dengan tombol coba lagi; semua proses panjang menampilkan progres

---

## Edge Cases & Error Handling

- Token OAuth kedaluwarsa/dicabut saat sinkron → status koneksi `expired`, data lama tetap tampil, Admin menerima notifikasi in-app untuk menyambungkan ulang
- Rate limit API platform → job sinkron dijadwalkan ulang dengan exponential backoff (maks 5 percobaan), status `error` dengan pesan jika tetap gagal
- Internal Data Connector mengembalikan item tak sesuai skema → item itu dilewati, dicatat di log sinkron beserta alasan, item valid tetap diproses
- Platform tidak menyediakan `reach` (X, YouTube) → ditampilkan "—" dan ER dihitung dari impressions
- Trend Provider gagal → rekomendasi topik memakai `TrendSignal` terakhir yang tersimpan dengan label "Data tren terakhir: <waktu>"; jika kosong, tampilkan rekomendasi berbasis performa konten saja
- User belum punya data performa sama sekali → rekomendasi topik memakai niche + tren saja; Insight menampilkan empty state
- Topik buatan sendiri sangat pendek/ambigu → AI meminta satu klarifikasi singkat sebelum menghasilkan angle
- Pemilihan lebih dari satu jenis konten pada satu angle → tidak dimungkinkan oleh UI (radio); jika dikirim lewat API, ditolak 400 "Pilih tepat satu jenis konten"
- Brief diedit saat Creation sedang `generating` → perubahan ditolak sementara dengan pesan "Konten sedang diproses"; tersedia setelah selesai
- Media sumber (a)/(b) berformat/rasio tidak cocok → dicrop otomatis dengan fit `cover`, user dapat menyesuaikan di Editor
- Provider generate gagal/timeout → item `failed` dengan opsi coba ulang (FR-GEN-6); item lain tetap berlanjut
- Unggahan melebihi batas ukuran/jumlah atau tipe tidak didukung → ditolak sebelum unggah dengan pesan spesifik
- Dua tab membuka Editor yang sama → tab yang menyimpan terakhir menang; tab lain menampilkan peringatan "Konten diperbarui di tempat lain, muat ulang"
- Ekspor video gagal di tengah → job `failed`, creation tidak berubah, user bisa mengulang ekspor
- Asset dihapus saat dipakai konten → aturan FR-AST-5

---

## Acceptance Criteria

**AC untuk FR-CONN-1, FR-CONN-5 (sinkron data)**
- Given Admin menghubungkan akun Instagram via OAuth read-only dan sinkron selesai
- When Creator yang tertaut membuka Insight
- Then konten akun itu tampil dengan metrik inti dan Engagement Rate terhitung benar (`engagement / reach`)

**AC untuk FR-INS-2, FR-INS-3 (KPI & daftar)**
- Given filter 30 hari terakhir, semua sumber
- When halaman Insight dimuat
- Then KPI menampilkan 4 angka dengan perbandingan periode sebelumnya, dan daftar urut Engagement Rate tertinggi ke terendah, 20 item pertama

**AC untuk FR-TRD-4, FR-TRD-5 (topik)**
- Given creator mengetik topik "tips WFH hemat listrik"
- When menekan "Gunakan topik ini"
- Then tampil Insight Topik, dan jika tak ada sinyal tren cocok muncul catatan "Belum ada sinyal tren eksternal untuk topik ini"

**AC untuk FR-ANG-1, FR-ANG-4, FR-ANG-5 (angle & jenis)**
- Given topik terpilih
- When AI menghasilkan angle
- Then tampil 5–9 kartu angle; setelah satu angle dipilih, 5 jenis konten muncul sebagai pilihan tunggal dengan paling banyak 3 badge "Direkomendasikan"

**AC untuk FR-BRF-1, FR-BRF-3 (brief tabel & edit)**
- Given jenis Video dipilih untuk sebuah angle
- When brief dibuat
- Then tabel memuat kolom scene, durasi, visual, narasi, teks on-screen, audio, sumber media; user mengedit sel narasi dan perubahan tersimpan otomatis

**AC untuk FR-BRF-5 (caption)**
- Given brief selesai dibuat
- When user membuka panel caption
- Then tampil 3 caption dengan gaya berbeda dan hashtag 3–8; tombol salin menyalin teks caption beserta hashtag

**AC untuk FR-GEN-2 (tiga sumber media)**
- Given brief carousel 6 slide
- When user memilih slide 1 dari Aset Creator, slide 2 dari Asset Management, slide 3–6 Generate AI, lalu klik Generate
- Then slide 1–2 memakai media yang dipilih tanpa generate, slide 3–6 men-generate gambar baru, dan Creation terbuka di Editor setelah semua selesai

**AC untuk FR-GEN-6 (retry)**
- Given 1 dari 6 item gagal
- When user klik "Coba lagi" pada item itu
- Then hanya item itu diproses ulang, 5 item lainnya tidak berubah

**AC untuk FR-ED-3 (editor carousel)**
- Given carousel 6 slide terbuka di Editor
- When user menduplikat slide 2, mengubah teks pada salinan, lalu menggeser salinan ke posisi 5
- Then jumlah slide menjadi 7, urutan dan teks tersimpan otomatis, status menampilkan "Tersimpan"

**AC untuk FR-EXP-1, FR-EXP-3 (ekspor)**
- Given carousel final
- When user memilih ekspor ZIP PNG dengan "sertakan caption"
- Then job berjalan, file ZIP berisi PNG per slide dan `caption.txt` dapat diunduh, dan tersimpan di Asset Management

**AC untuk FR-REF-1–FR-REF-3 (referensi → brief)**
- Given user mengunggah PDF 8 halaman dan memilih keluaran Brief untuk jenis Artikel
- When ekstraksi selesai
- Then brief artikel muncul dengan kolom "Sumber" yang menunjuk halaman PDF asal

**AC untuk FR-SA-1, FR-SA-3 (standalone)**
- Given user membuka Studio → Generate Image tanpa pernah memakai Insight/Topik
- When user mengisi prompt dan generate
- Then Project berstatus `standalone` dibuat, gambar terbuka di Editor, dan dapat diekspor tanpa langkah lain

**AC untuk FR-NFR-1 (responsif)**
- Given viewport 375px
- When user membuka Insight, Brief, dan Editor
- Then tidak ada horizontal scroll pada body, navigasi berupa bottom navigation, dan properti editor muncul sebagai bottom sheet

---

## Asumsi

- **Pemetaan "3 jenis konten rekomendasi"**: Anda menyebut 3 jenis rekomendasi tetapi 5 jenis yang tersedia, dan menjelaskan AI memberi maksimal 8–9 rekomendasi dengan 5 jenis konten per angle. Diterjemahkan menjadi: **5–9 angle per topik** (target 8), **5 jenis konten selalu tersedia** dengan **maksimal 3 ditandai "Direkomendasikan"**, dan user memilih tepat satu. Jika maksud Anda berbeda, bagian FR-ANG-1 s.d. FR-ANG-5 yang perlu diubah.
- **Data nyata**: analitik dari API resmi tiap platform (read-only), tren dari Trend Provider. Setiap platform mewajibkan proses app review/verifikasi sebelum bisa dipakai untuk akun di luar tester, dan sebagian API (TikTok, X, Instagram) punya pembatasan akses/biaya. Ini risiko jadwal terpisah dari pekerjaan coding.
- **Sumber tren v1**: Google Trends (via penyedia pihak ketiga), YouTube Data API, X API. Tren khusus TikTok/Instagram tidak ada API publik yang setara; di v1 sinyal untuk dua platform itu hanya berasal dari performa akun yang terhubung. Adapter tambahan bisa dipasang kemudian.
- **Sumber data internal**: belum diketahui bentuk aslinya, sehingga dibuat kontrak generik (endpoint JSON + CSV, FR-CONN-3). Tim internal perlu menyediakan endpoint/CSV yang mengikuti skema tersebut.
- **Tidak ada publish ke sosmed** di v1 karena brief hanya menyebut download/ekspor dan rekomendasi caption untuk disalin.
- **Provider AI**: default OpenAI (gambar/video) dan ElevenLabs (suara) seperti keputusan proyek sebelumnya; ketersediaan dan batas API video generation perlu dikonfirmasi saat implementasi. Referensi platform yang Anda sebut (Kling, Higgsfield, Dreamina, dll.) dapat dipasang sebagai adapter provider tambahan.
- **Editor video** sengaja sederhana (satu track narasi, satu track musik, teks, subtitle) agar layak dibangun di v1; editing multi-track penuh di luar scope.
- **Autentikasi**: email+password dengan undangan dan dua role, dilanjutkan dari proyek sebelumnya.
- **Retensi ekspor**: tautan unduhan aktif 24 jam, file tetap ada di Asset Management.
- **Gaya visual** glassmorphism dan Dark/Light mode dilanjutkan dari fase sebelumnya.
- **Bahasa UI** Indonesia; bahasa konten dapat diatur per user (Indonesia/Inggris).

---

## Open Questions

- [ ] Apa bentuk nyata sumber data internal (database, API CMS, Google Analytics, atau lainnya), dan siapa yang menyiapkan endpoint/CSV sesuai skema FR-CONN-3?
- [ ] Apakah sudah ada langganan penyedia data tren (mis. Google Trends via provider, social listening tool) atau anggaran untuk itu?
- [ ] Apakah perlu dukungan tren khusus TikTok/Instagram lewat penyedia pihak ketiga berbayar, atau cukup seperti asumsi di atas?
- [ ] Perkiraan jumlah creator pengguna dan jumlah generate per hari, untuk menentukan kapasitas job queue dan biaya provider AI.

Selain empat pertanyaan di atas, seluruh keputusan teknis sudah diasumsikan secara eksplisit dan spesifikasi ini siap diimplementasikan. Disarankan untuk membangun bertahap mengikuti urutan modul: AUTH → CONN/INS → TRD/ANG/BRF → GEN/ED/EXP → REF/SA.