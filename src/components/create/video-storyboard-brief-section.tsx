"use client";

import { useState, type ChangeEvent } from "react";
import Image from "next/image";
import { toast } from "@heroui/react";
import { cn } from "@/lib/utils";
import {
  CheckIcon,
  DownloadIcon,
  PencilIcon,
  PlusIcon,
  RefreshIcon,
  VideoIcon,
  XIcon,
} from "@/components/ui/icons";

export interface VideoStoryboardBriefSectionProps {
  initialTopic?: string;
  ratio?: string;
  duration?: string;
  style?: string;
  angle?: string;
  voiceover?: string;
  onOpenEditor: () => void;
  isNavigatingEditor?: boolean;
}

export interface StoryboardSceneRow {
  sceneNumber: number;
  duration: string;
  category: string;
  visualDescription: string;
  cameraMovement: string;
  visualText: string;
  voiceover: string;
  thumbnailUrl: string;
  references: string[];
}

const DEFAULT_SCENES: StoryboardSceneRow[] = [
  {
    sceneNumber: 1,
    duration: "00:05",
    category: "Establishing Shot",
    visualDescription:
      "Tumpukan berkas dokumen audit forensik dengan stempel merah 'RAHASIA NEGARA' di atas meja rapat kayu jati gelap berdebu.",
    cameraMovement: "Zoom In (Dolly-in)",
    visualText: "KASUS KORUPSI TERBESAR TAHUN INI",
    voiceover:
      "Uang rakyat kembali dirampok. Kali ini bukan angka miliaran biasa, melainkan triliunan rupiah yang lenyap tanpa jejak.",
    thumbnailUrl: "/post-media/card-1.png",
    references: [],
  },
  {
    sceneNumber: 2,
    duration: "00:05",
    category: "Detail / Close Up",
    visualDescription:
      "Tangan bersarung karet membuka map cokelat berisikan grafik aliran dana mencurigakan ke puluhan rekening luar negeri.",
    cameraMovement: "Pan Left / Right",
    visualText: "MODUS: REKENING SILUMAN",
    voiceover:
      "Penyidik KPK menemukan jejak transaksi rumit yang sengaja disamarkan menggunakan nama korporasi boneka di luar negeri.",
    thumbnailUrl: "/post-media/card-2.png",
    references: [],
  },
  {
    sceneNumber: 3,
    duration: "00:05",
    category: "Action Sequence",
    visualDescription:
      "Sorotan lampu kilat kamera wartawan mengiringi mobil tahanan berjeruji hitam melaju keluar gerbang gedung merah putih.",
    cameraMovement: "Tracking Shot",
    visualText: "12 PEJABAT RESMI TERSANGKA",
    voiceover:
      "Tak butuh waktu lama, dua belas pejabat lintas kementerian langsung ditetapkan sebagai tersangka utama dalam operasi senyap ini.",
    thumbnailUrl: "/post-media/card-3.png",
    references: [],
  },
  {
    sceneNumber: 4,
    duration: "00:05",
    category: "Data & Infografis",
    visualDescription:
      "Grafik 3D neraca kerugian negara membubung tinggi, kontras dengan foto fasilitas publik yang terbengkalai rusak parah.",
    cameraMovement: "Tilt Up / Down",
    visualText: "RP 271 TRILIUN KERUGIAN NEGARA",
    voiceover:
      "Angka fantastis ini setara dengan pembangunan ratusan rumah sakit dan puluhan ribu sekolah yang terbengkalai di pelosok negeri.",
    thumbnailUrl: "/seed/unsplash/abstract-03.jpg",
    references: [],
  },
  {
    sceneNumber: 5,
    duration: "00:05",
    category: "Call to Action",
    visualDescription:
      "Siluet palu sidang mengetuk meja pengadilan, diakhiri transisi logo kumparan investigasi dan ajakan partisipasi publik.",
    cameraMovement: "Static / Fixed Shot",
    visualText: "KAWAL KASUS SAMPAI TUNTAS",
    voiceover:
      "Kawal terus persidangan ini bersama redaksi kumparan. Ketik pendapatmu dan bagikan informasi ini demi transparansi hukum.",
    thumbnailUrl: "/seed/unsplash/abstract-01.jpg",
    references: [],
  },
];

const CAMERA_MOVEMENT_OPTIONS = [
  "Pan Left / Right",
  "Zoom In (Dolly-in)",
  "Zoom Out",
  "Tilt Up / Down",
  "Tracking Shot",
  "Static / Fixed Shot",
];

const SAMPLE_MEDIA_ASSETS = [
  { id: "m1", url: "/post-media/card-1.png", title: "Berkas Investigasi Kasus", duration: "00:05" },
  { id: "m2", url: "/post-media/card-2.png", title: "Aliran Dana Rekening", duration: "00:05" },
  { id: "m3", url: "/post-media/card-3.png", title: "Mobil Tahanan & Wartawan", duration: "00:05" },
  { id: "m4", url: "/seed/unsplash/abstract-03.jpg", title: "Grafik Kerugian Negara", duration: "00:05" },
  { id: "m5", url: "/seed/unsplash/abstract-01.jpg", title: "Palu Sidang Tipikor", duration: "00:05" },
  { id: "m6", url: "/seed/unsplash/abstract-02.jpg", title: "Gedung Komisi Pemberantasan", duration: "00:05" },
];

export function VideoStoryboardBriefSection({
  initialTopic = "Jelaskan Kasus Korupsi Indonesia dalam 60 detik secara komprehensif.",
  ratio = "9:16",
  duration = "25 detik",
  style = "Cinematic",
  angle = "Investigatif",
  voiceover = "Dalipin (Deep & Dramatic)",
  onOpenEditor,
  isNavigatingEditor = false,
}: VideoStoryboardBriefSectionProps) {
  // Step state: 2 = Content Brief Scene Breakdown, 3 = Storyboard 5 Kolom Table
  const [step, setStep] = useState<2 | 3>(2);

  const [prompt, setPrompt] = useState(initialTopic);
  const [scenes, setScenes] = useState<StoryboardSceneRow[]>(DEFAULT_SCENES);

  // Loading animation state
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Audio preview playing state
  const [playingAudioScene, setPlayingAudioScene] = useState<number | null>(null);

  // Asset picker modal state
  const [activeSceneForAsset, setActiveSceneForAsset] = useState<number | null>(null);
  const [selectedAssetUrl, setSelectedAssetUrl] = useState<string | null>(null);

  // Caption rekomendasi state
  const [captionHeadline] = useState("Jelaskan Kasus Korupsi Indonesia Dalam 60 Detik.");
  const [captionBody] = useState(
    "Fakta lengkap mega korupsi yang merugikan ratusan triliun rupiah. Simak breakdown alur investigasi dan keterlibatan tersangka hanya di kumparan.",
  );
  const [captionHashtags] = useState(
    "#KorupsiIndonesia #Investigasi #Hukum #KPK #KumparanNews #BeritaTerkini",
  );

  function startGenerateStoryboard() {
    setLoading(true);
    setProgress(15);

    const t1 = setTimeout(() => setProgress(50), 300);
    const t2 = setTimeout(() => setProgress(85), 650);
    const t3 = setTimeout(() => {
      setProgress(100);
      setLoading(false);
      setStep(3);
      toast.success("Tabel Storyboard 5 Kolom berhasil disusun!");
    }, 950);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }

  function handleUpdateSceneText(sceneNum: number, field: "visualDescription" | "cameraMovement" | "visualText" | "voiceover", val: string) {
    setScenes((prev) =>
      prev.map((s) => (s.sceneNumber === sceneNum ? { ...s, [field]: val } : s)),
    );
  }

  function handleAddReference(sceneNum: number, e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setScenes((prev) =>
      prev.map((s) =>
        s.sceneNumber === sceneNum ? { ...s, references: [...s.references, url] } : s,
      ),
    );
    toast.success(`Referensi visual ditambahkan ke Scene ${sceneNum}.`);
  }

  function handleRemoveReference(sceneNum: number, refIndex: number) {
    setScenes((prev) =>
      prev.map((s) =>
        s.sceneNumber === sceneNum
          ? { ...s, references: s.references.filter((_, idx) => idx !== refIndex) }
          : s,
      ),
    );
  }

  function handleApplyAssetToScene() {
    if (activeSceneForAsset === null || !selectedAssetUrl) return;
    setScenes((prev) =>
      prev.map((s) =>
        s.sceneNumber === activeSceneForAsset ? { ...s, thumbnailUrl: selectedAssetUrl } : s,
      ),
    );
    setActiveSceneForAsset(null);
    setSelectedAssetUrl(null);
    toast.success("Aset visual berhasil disematkan ke scene.");
  }

  function toggleAudioPlayback(sceneNum: number) {
    if (playingAudioScene === sceneNum) {
      setPlayingAudioScene(null);
    } else {
      setPlayingAudioScene(sceneNum);
      // Auto stop after simulated 3.5s
      setTimeout(() => {
        setPlayingAudioScene((cur) => (cur === sceneNum ? null : cur));
      }, 3500);
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SUB-STEP 1: CONTENT BRIEF SCENE BREAKDOWN (FIGMA 360:40302 / STEP 2 VIDEO)
  // ══════════════════════════════════════════════════════════════════════════
  if (step === 2) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        {/* Header Content Brief */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-4 dark:border-white/5">
          <div>
            <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
              Content Brief: Scene Breakdown
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Rincian naskah adegan dan pergerakan kamera untuk {scenes.length} scene video.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
            <span className="rounded-md bg-zinc-100 px-2 py-0.5 dark:bg-zinc-800">
              {scenes.length} Scene
            </span>
            <span className="rounded-md bg-zinc-100 px-2 py-0.5 dark:bg-zinc-800">
              Rasio {ratio}
            </span>
            <span className="rounded-md bg-zinc-100 px-2 py-0.5 dark:bg-zinc-800">
              {duration}
            </span>
            <span className="rounded-md bg-zinc-100 px-2 py-0.5 dark:bg-zinc-800">
              {style}
            </span>
            <span className="rounded-md bg-zinc-100 px-2 py-0.5 dark:bg-zinc-800">
              VO: {voiceover}
            </span>
          </div>
        </div>

        {/* User Prompt Context Box */}
        <div className="rounded-xl border border-zinc-200/90 bg-white/70 p-4 transition-all dark:border-white/10 dark:bg-zinc-900/50">
          <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            Topik Utama & Narasi Induk
          </label>
          <textarea
            rows={2}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="mt-1 w-full resize-none rounded-xl border border-zinc-200 bg-white/80 p-3 text-xs leading-relaxed text-zinc-900 outline-none focus:border-[#01AFAE] dark:border-white/10 dark:bg-zinc-900/70 dark:text-white"
          />
        </div>

        {/* Scene Cards 1 s/d N (Figma 360:40302) */}
        <div className="space-y-4">
          {scenes.map((scene) => (
            <div
              key={`scene-brief-card-${scene.sceneNumber}`}
              className="space-y-3.5 rounded-xl border border-zinc-200/90 bg-white/70 p-4 shadow-2xs dark:border-white/10 dark:bg-zinc-900/50"
            >
              <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-[#01AFAE]/15 px-2.5 py-1 text-xs font-bold text-[#01AFAE] dark:text-[#7de9e6]">
                    <VideoIcon className="size-3.5" />
                    <span>Scene {scene.sceneNumber}</span>
                  </span>
                  <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    {scene.category}
                  </span>
                </div>
                <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
                  {scene.duration}
                </span>
              </div>

              {/* Textarea Visual & Action */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Visual & Action Description
                </label>
                <textarea
                  rows={2}
                  value={scene.visualDescription}
                  onChange={(e) =>
                    handleUpdateSceneText(scene.sceneNumber, "visualDescription", e.target.value)
                  }
                  placeholder="Deskripsikan objek utama, apa yang sedang dilakukan objek tersebut..."
                  className="w-full resize-none rounded-xl border border-zinc-200 bg-white/80 p-3 text-xs leading-relaxed text-zinc-900 outline-none focus:border-[#01AFAE] dark:border-white/10 dark:bg-zinc-900/70 dark:text-white"
                />
              </div>

              {/* Camera Motion & References */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                    Camera Motion
                  </label>
                  <select
                    value={scene.cameraMovement}
                    onChange={(e) =>
                      handleUpdateSceneText(scene.sceneNumber, "cameraMovement", e.target.value)
                    }
                    className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-800 outline-none focus:border-[#01AFAE] dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-200"
                  >
                    {CAMERA_MOVEMENT_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                    Referensi Visual Scene
                  </label>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {scene.references.map((refUrl, rIdx) => (
                      <div
                        key={`ref-tag-${scene.sceneNumber}-${rIdx}`}
                        className="relative size-8 overflow-hidden rounded-md border border-zinc-200 dark:border-white/10"
                      >
                        <Image src={refUrl} alt="Ref" fill className="object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveReference(scene.sceneNumber, rIdx)}
                          className="absolute inset-0 bg-black/60 text-white opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity"
                        >
                          <XIcon className="size-3" />
                        </button>
                      </div>
                    ))}
                    <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-dashed border-zinc-300 px-2.5 py-1.5 text-[11px] font-medium text-zinc-600 hover:border-[#01AFAE] hover:text-[#01AFAE] dark:border-zinc-700 dark:text-zinc-400">
                      <PlusIcon className="size-3" />
                      <span>Tambah Ref</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleAddReference(scene.sceneNumber, e)}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Loading Progress Transition */}
        {loading && (
          <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/80 p-4 shadow-sm dark:border-white/10 dark:bg-zinc-800/60 animate-in fade-in duration-200">
            <div className="mb-2 flex items-center justify-between text-xs font-medium text-zinc-600 dark:text-zinc-300">
              <span className="flex items-center gap-2">
                <RefreshIcon className="size-3.5 animate-spin text-[#01AFAE]" />
                <span>Menyusun Tabel Storyboard 5 Kolom & Naskah Voiceover...</span>
              </span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
              <div
                className="h-full rounded-full bg-[#01AFAE] transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Action Button: Buka Storyboard */}
        {!loading && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-100 dark:border-white/5">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Simpan naskah dan alur adegan sebelum membuka tabel Storyboard.
            </span>
            <button
              type="button"
              onClick={startGenerateStoryboard}
              className="inline-flex items-center gap-2 rounded-lg bg-[#01AFAE] px-5 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#009b9a] active:scale-95"
            >
              <span>Buka Storyboard</span>
              <span>→</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SUB-STEP 2: STORYBOARD TABEL 5 KOLOM (FIGMA 314:21543 / STEP 3 VIDEO)
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ── TOP CONTEXT SUMMARY BAR (FIGMA 314:21543) ────────────────────── */}
      <div className="rounded-xl border border-zinc-200/90 bg-zinc-50/70 p-4 dark:border-white/10 dark:bg-zinc-900/60 shadow-2xs">
        <div className="grid grid-cols-1 divide-y md:grid-cols-12 md:divide-x md:divide-y-0 divide-zinc-200 dark:divide-white/10 gap-3 md:gap-0">
          {/* Video Configuration */}
          <div className="md:col-span-5 flex flex-col gap-1.5 md:pr-4">
            <span className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase dark:text-zinc-500">
              VIDEO CONFIGURATION
            </span>
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="inline-flex items-center gap-1 rounded-md bg-[#002C22]/40 px-2 py-0.5 text-xs font-semibold text-[#00D492] border border-[#00D492]/20">
                <VideoIcon className="size-3" />
                <span>Video Storyboard</span>
              </span>
              <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                {scenes.length} Scene
              </span>
              <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                Rasio {ratio}
              </span>
              <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                {duration}
              </span>
            </div>
          </div>

          {/* Context / Topik */}
          <div className="md:col-span-4 flex flex-col gap-1.5 pt-3 md:pt-0 md:px-4">
            <span className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase dark:text-zinc-500">
              CONTEXT
            </span>
            <p className="line-clamp-2 text-xs font-bold text-zinc-900 dark:text-white" title={prompt}>
              {prompt}
            </p>
          </div>

          {/* Angle & Voiceover */}
          <div className="md:col-span-3 flex flex-col justify-between gap-1.5 pt-3 md:pt-0 md:pl-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase dark:text-zinc-500">
                ANGLE & VO
              </span>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#01AFAE] hover:underline"
              >
                <PencilIcon className="size-3" />
                <span>Ubah</span>
              </button>
            </div>
            <p className="line-clamp-2 text-xs text-zinc-600 dark:text-zinc-300">
              <strong className="text-zinc-900 dark:text-white">{angle}</strong> · {voiceover}
            </p>
          </div>
        </div>

        {/* Quota Banner */}
        <div className="mt-3 flex items-center justify-between border-t border-zinc-200/80 pt-2.5 text-xs text-zinc-600 dark:border-white/5 dark:text-zinc-400">
          <div className="flex items-center gap-1.5">
            <span className="inline-block size-2 rounded-full bg-teal-500" />
            <span>Maksimal 3x generate video visual AI. Sisa kuota produksi: 3/3</span>
          </div>
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            Mode Aktif
          </span>
        </div>
      </div>

      {/* ── HEADER STORY BOARD ────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
            Tabel Story Board 5 Kolom (Figma 314:21543)
          </h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Rincian alur durasi, elemen visual, teks layar, dan naskah voiceover siap disunting di Video Editor.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setStep(2)}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-200 shadow-2xs"
          >
            Edit Naskah
          </button>
          <button
            type="button"
            onClick={() => toast.success("PDF Storyboard siap diunduh.")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-200 shadow-2xs"
          >
            <DownloadIcon className="size-3.5" />
            <span>Unduh PDF</span>
          </button>
        </div>
      </div>

      {/* Warning banner jika asset kosong */}
      <div className="flex items-center gap-2 rounded-xl border border-rose-200/80 bg-rose-50/60 px-4 py-2 text-xs text-rose-800 dark:border-rose-900/30 dark:bg-rose-950/20 dark:text-rose-300">
        <span className="font-bold">Info:</span>
        <span>Aset visual scene yang kosong akan digenerate otomatis oleh AI saat masuk ke Video Editor.</span>
      </div>

      {/* ── TABEL 5 KOLOM STORY BOARD (FIGMA 314:21543) ──────────────────── */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xs dark:border-white/10 dark:bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-xs">
            <thead className="border-b border-zinc-200 bg-zinc-50 font-semibold text-zinc-500 uppercase tracking-wider dark:border-white/10 dark:bg-zinc-800/60 dark:text-zinc-400">
              <tr>
                <th className="px-3.5 py-3 text-center w-14">SCENE</th>
                <th className="px-3.5 py-3 w-24">DURASI</th>
                <th className="px-3.5 py-3 min-w-[240px]">VISUAL</th>
                <th className="px-3.5 py-3 min-w-[180px]">TEXT PADA VISUAL</th>
                <th className="px-3.5 py-3 min-w-[220px]">VOICEOVER (VO)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-white/5">
              {scenes.map((scene) => (
                <tr key={`storyboard-row-${scene.sceneNumber}`} className="hover:bg-zinc-50/50 dark:hover:bg-white/5">
                  {/* SCENE */}
                  <td className="px-3.5 py-3.5 text-center font-bold text-zinc-900 dark:text-white align-top">
                    {scene.sceneNumber}
                  </td>

                  {/* DURASI */}
                  <td className="px-3.5 py-3.5 font-mono text-zinc-500 dark:text-zinc-400 align-top whitespace-nowrap">
                    {scene.duration}
                  </td>

                  {/* VISUAL */}
                  <td className="px-3.5 py-3.5 align-top space-y-2">
                    <div className="flex items-start gap-2.5">
                      {/* Thumbnail / Add Media */}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveSceneForAsset(scene.sceneNumber);
                          setSelectedAssetUrl(scene.thumbnailUrl);
                        }}
                        className="relative size-16 shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 hover:ring-2 hover:ring-[#01AFAE] dark:border-white/10 dark:bg-zinc-800"
                        title="Ubah Aset Visual"
                      >
                        <Image
                          src={scene.thumbnailUrl}
                          alt={`Scene ${scene.sceneNumber}`}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                          <PlusIcon className="size-4" />
                        </div>
                      </button>

                      <div className="space-y-1 min-w-0">
                        <span className="inline-block rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                          {scene.category}
                        </span>
                        <p className="line-clamp-3 text-xs text-zinc-700 dark:text-zinc-300">
                          {scene.visualDescription}
                        </p>
                        <span className="text-[10px] text-zinc-400">
                          Motion: {scene.cameraMovement}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* TEXT PADA VISUAL */}
                  <td className="px-3.5 py-3.5 align-top">
                    <textarea
                      rows={2}
                      value={scene.visualText}
                      onChange={(e) =>
                        handleUpdateSceneText(scene.sceneNumber, "visualText", e.target.value)
                      }
                      className="w-full resize-none rounded-lg border border-zinc-200 bg-white/70 p-2 text-xs font-semibold text-zinc-900 outline-none focus:border-[#01AFAE] dark:border-white/10 dark:bg-zinc-900/60 dark:text-white"
                    />
                  </td>

                  {/* VOICEOVER */}
                  <td className="px-3.5 py-3.5 align-top space-y-2">
                    <textarea
                      rows={2}
                      value={scene.voiceover}
                      onChange={(e) =>
                        handleUpdateSceneText(scene.sceneNumber, "voiceover", e.target.value)
                      }
                      className="w-full resize-none rounded-lg border border-zinc-200 bg-white/70 p-2 text-xs leading-relaxed text-zinc-700 outline-none focus:border-[#01AFAE] dark:border-white/10 dark:bg-zinc-900/60 dark:text-zinc-300"
                    />

                    {/* Audio Preview Button */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleAudioPlayback(scene.sceneNumber)}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold transition-colors",
                          playingAudioScene === scene.sceneNumber
                            ? "bg-rose-500 text-white"
                            : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300",
                        )}
                      >
                        <span>{playingAudioScene === scene.sceneNumber ? "⏸ Stop VO" : "▶ Dengar VO"}</span>
                      </button>
                      {playingAudioScene === scene.sceneNumber && (
                        <span className="flex items-center gap-1 text-[10px] text-teal-600 dark:text-teal-400 font-mono">
                          <span className="inline-block size-1.5 rounded-full bg-teal-500 animate-pulse" />
                          Playing ({voiceover})...
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Caption Rekomendasi Section (Figma 314:21543) */}
      <div className="space-y-3 rounded-xl border border-zinc-200/90 bg-zinc-50/50 p-4 dark:border-white/10 dark:bg-zinc-900/40">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-900 dark:text-white">
            Caption Rekomendasi Video
          </span>
          <button
            type="button"
            onClick={() => {
              const fullCaption = `${captionHeadline}\n\n${captionBody}\n\n${captionHashtags}`;
              navigator.clipboard?.writeText(fullCaption);
              toast.success("Semua caption video berhasil disalin!");
            }}
            className="text-xs font-semibold text-[#01AFAE] hover:underline"
          >
            Salin Semua
          </button>
        </div>

        <div className="space-y-2 text-xs">
          <div>
            <span className="text-[10px] font-semibold text-zinc-400 uppercase">Headline</span>
            <p className="font-semibold text-zinc-800 dark:text-zinc-100">{captionHeadline}</p>
          </div>
          <div>
            <span className="text-[10px] font-semibold text-zinc-400 uppercase">Body Narasi</span>
            <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">{captionBody}</p>
          </div>
          <div>
            <span className="text-[10px] font-semibold text-zinc-400 uppercase">Hashtag</span>
            <p className="text-[#01AFAE] font-medium">{captionHashtags}</p>
          </div>
        </div>
      </div>

      {/* Action CTA: Buka di Video Editor */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-500/20 bg-rose-50/50 p-4 dark:border-rose-400/20 dark:bg-rose-950/20">
        <div>
          <p className="text-xs font-bold text-rose-900 dark:text-rose-200">
            💡 Alur Produksi Video Storyboard:
          </p>
          <p className="text-[11px] text-rose-800 dark:text-rose-300">
            Klik <strong>&quot;Buka di Video Editor&quot;</strong> untuk menata timeline, klip visual, musik latar, dan ekspor video akhir.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenEditor}
          disabled={isNavigatingEditor}
          className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-black active:scale-[0.98] disabled:opacity-75 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 shrink-0"
        >
          <VideoIcon className="size-3.5" />
          <span>{isNavigatingEditor ? "Membuka..." : "Buka di Video Editor"}</span>
        </button>
      </div>

      {/* ── MODAL UBAH ASSET SCENE (Asset Picker) ── */}
      {activeSceneForAsset !== null && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="relative w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl dark:border-white/15 dark:bg-zinc-900 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-white/5">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                  Pilih Aset Visual Scene {activeSceneForAsset}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Pilih klip visual utama dari galeri editorial atau unggah aset.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveSceneForAsset(null)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800"
              >
                <XIcon className="size-4" />
              </button>
            </div>

            {/* Grid Assets */}
            <div className="grid grid-cols-3 gap-2.5 max-h-64 overflow-y-auto p-1">
              {SAMPLE_MEDIA_ASSETS.map((asset) => {
                const isSelected = selectedAssetUrl === asset.url;
                return (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() => setSelectedAssetUrl(asset.url)}
                    className={cn(
                      "group relative aspect-video overflow-hidden rounded-lg border text-left transition-all",
                      isSelected
                        ? "ring-2 ring-[#01AFAE] border-transparent"
                        : "border-zinc-200 hover:border-zinc-300 dark:border-white/10",
                    )}
                  >
                    <Image src={asset.url} alt={asset.title} fill className="object-cover" />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1.5 text-[9px] text-white font-medium line-clamp-1">
                      {asset.title}
                    </div>
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-[#01AFAE] text-white">
                        <CheckIcon className="size-2.5" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-zinc-100 pt-3 dark:border-white/5">
              <button
                type="button"
                onClick={() => setActiveSceneForAsset(null)}
                className="rounded-lg px-3.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleApplyAssetToScene}
                disabled={!selectedAssetUrl}
                className="rounded-lg bg-[#01AFAE] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#009b9a] disabled:opacity-50"
              >
                Terapkan ke Scene {activeSceneForAsset}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
