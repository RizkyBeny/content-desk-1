"use client";

import { useCallback, useEffect, useRef, useState, type ComponentType } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "@heroui/react";
import { apiFetch, ClientError } from "@/lib/client";
import { cn } from "@/lib/utils";
import type { GenerationDTO, GenerationParams, GenerationType } from "@/types";
import { ATTACHMENT_ACCEPT_IMAGE, ATTACHMENT_ACCEPT_VIDEO, ATTACHMENT_MAX_IMAGE_MB, ATTACHMENT_MAX_VIDEO_MB, PAGE_DESCRIPTION, PAGE_TITLE, PLACEHOLDER, PROMPT_LIMITS, defaultParams } from "../../../config/generation";
import { IMAGE_TEMPLATES } from "../../../config/templates";
import { SectionHeader } from "@/components/ui/primitives";
import { BentoGallery } from "./bento-gallery";
import { Composer, type ComposerAttachment } from "./composer";
import { ComposerCard } from "./composer-card";
import { ConfigRow, CONFIG_PANEL } from "./config-panels";
import { DetailModal } from "./detail-modal";
import { HeroSection } from "./hero-section";
import { InsightSection } from "./insight-section";
import { GuidedImageFlow } from "./guided-image-flow";
import { ImageStudioFlow } from "./image-studio-flow";
import { VideoStudioFlow } from "./video-studio-flow";
import { BriefStudioFlow } from "./brief-studio-flow";
import { ReferenceOutputGrid } from "./reference-output-grid";
import { TopicChips } from "./topic-chips";
import { useGenerations } from "./use-generations";

const STORAGE_PREFIX = "aistudio:config:";

type PanelComponent = ComponentType<{
  params: GenerationParams;
  onChange: (patch: Partial<GenerationParams>) => void;
}>;

function loadConfig<T extends GenerationParams>(type: GenerationType): T {
  const fallback = defaultParams(type) as T;
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${type}`);
    if (!raw) return fallback;
    return { ...fallback, ...(JSON.parse(raw) as Partial<T>) } as T;
  } catch {
    return fallback;
  }
}

function saveConfig(type: GenerationType, params: GenerationParams) {
  try {
    window.localStorage.setItem(`${STORAGE_PREFIX}${type}`, JSON.stringify(params));
  } catch {
    /* localStorage tidak tersedia */
  }
}

export function CreateStudio({ type, canModerate }: { type: GenerationType; canModerate?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const gParam = searchParams.get("g");

  const [prompt, setPrompt] = useState("");
  const [params, setParams] = useState<GenerationParams>(() => defaultParams(type));
  const [scope, setScope] = useState<"all" | "mine">("all");
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<GenerationDTO | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [attachment, setAttachment] = useState<ComposerAttachment | null>(null);
  const [guidedPhase, setGuidedPhase] = useState(false);
  const [guidedContext, setGuidedContext] = useState("");
  const [guidedAttachment, setGuidedAttachment] = useState<ComposerAttachment | null>(null);
  const hydrated = useRef(false);

  const { items, quota, loading, loadingMore, hasMore, error, loadMore, refresh, submit, remove, retry } =
    useGenerations(type, scope);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setParams(loadConfig(type));
    hydrated.current = true;
  }, [type]);

  useEffect(() => {
    if (hydrated.current) saveConfig(type, params);
  }, [type, params]);

  const patch = useCallback((delta: Partial<GenerationParams>) => {
    setParams((prev) => ({ ...prev, ...delta }) as GenerationParams);
  }, []);

  function toggleAudio(item: GenerationDTO) {
    if (!item.fileUrl) return;
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.addEventListener("ended", () => setPlayingAudioId(null));
    }
    const audio = audioRef.current;
    if (playingAudioId === item.id) {
      audio.pause();
      setPlayingAudioId(null);
      return;
    }
    audio.src = item.fileUrl;
    audio.currentTime = 0;
    void audio.play().catch(() => setPlayingAudioId(null));
    setPlayingAudioId(item.id);
  }

  async function handleSubmit() {
    const trimmed = prompt.trim();
    if (trimmed.length < 3) return;
    // Image & Video: masuk guided mode dulu (brief → step → final prompt → generate).
    if (type === "image" || type === "video") {
      setGuidedContext(trimmed);
      setGuidedAttachment(attachment);
      setGuidedPhase(true);
      setPrompt("");
      setAttachment(null);
      return;
    }
    setBusy(true);
    try {
      const merged = params as GenerationParams;
      await submit(trimmed, merged);
      setPrompt("");
      setAttachment(null);
    } catch (err) {
      toast.danger(err instanceof ClientError ? err.message : "Gagal mengirim permintaan.");
    } finally {
      setBusy(false);
    }
  }

  function openItem(item: GenerationDTO) {
    setSelected(item);
    router.push(`${pathname}?g=${item.id}`, { scroll: false });
  }

  const closeModal = useCallback(() => {
    if (gParam) router.back();
    else setSelected(null);
  }, [gParam, router]);

  useEffect(() => {
    if (!gParam) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelected(null);
      return;
    }
    if (selected?.id === gParam) return;
    let disposed = false;
    void (async () => {
      try {
        const data = await apiFetch<{ generation: GenerationDTO }>(`/api/generations/${gParam}`);
        if (!disposed) setSelected(data.generation);
      } catch {
        if (disposed) return;
        toast.danger("Hasil tidak ditemukan.");
        router.replace(pathname);
      }
    })();
    return () => {
      disposed = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gParam]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  async function handleAttachFile(file: File) {
    try {
      if (type === "image") {
        const max = ATTACHMENT_MAX_IMAGE_MB * 1024 * 1024;
        if (file.size > max) {
          toast.danger(`Ukuran maksimal ${ATTACHMENT_MAX_IMAGE_MB} MB.`);
          return;
        }
        const form = new FormData();
        form.append("file", file);
        const res = await apiFetch<{ asset: { id: string; fileUrl: string; name: string } }>("/api/assets", {
          method: "POST",
          body: form,
          headers: {},
        } as unknown as RequestInit);
        setAttachment({
          assetId: res.asset.id,
          fileUrl: res.asset.fileUrl,
          name: res.asset.name,
          kind: "image",
          mode: "edit",
        });
        return;
      }
      if (type === "video") {
        const max = ATTACHMENT_MAX_VIDEO_MB * 1024 * 1024;
        if (file.size > max) {
          toast.danger(`Ukuran maksimal ${ATTACHMENT_MAX_VIDEO_MB} MB.`);
          return;
        }
        const form = new FormData();
        form.append("file", file);
        const res = await apiFetch<{ asset: { id: string; fileUrl: string; name: string } }>("/api/assets", {
          method: "POST",
          body: form,
          headers: {},
        } as unknown as RequestInit);
        const kind = res.asset.fileUrl.endsWith(".mp4") || res.asset.fileUrl.includes("video") || file.type.startsWith("video") ? "video" : "image";
        if (kind === "video") {
          setAttachment({ assetId: res.asset.id, fileUrl: res.asset.fileUrl, name: res.asset.name, kind: "video", mode: "edit" });
          return;
        }
        setAttachment({ assetId: res.asset.id, fileUrl: res.asset.fileUrl, name: res.asset.name, kind: "image", mode: "edit" });
        return;
      }
    } catch (err) {
      toast.danger(err instanceof ClientError ? err.message : "Gagal melampirkan file.");
    }
  }

  function handleSimilar(item: GenerationDTO) {
    setPrompt(item.prompt);
    setParams({ ...(item.params as GenerationParams) });
    saveConfig(type, item.params as GenerationParams);
    setAttachment(null);
    closeModal();
    window.scrollTo({ top: 0, behavior: "smooth" });
    toast.success("Pengaturan disalin. Periksa lalu tekan kirim.");
  }

  function handleInsightSimilar(topic: string) {
    setPrompt(topic);
    setAttachment(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
    toast.success("Topik dimuat ke composer. Periksa lalu tekan kirim.");
  }

  const Panel = CONFIG_PANEL[type] as PanelComponent;
  const exhausted = false;

  const completedImages =
    type === "image"
      ? items.filter((item) => item.status === "completed" && (item.thumbnailUrl || item.fileUrl))
      : [];

  if (type === "image") {
    return <ImageStudioFlow items={items} canModerate={canModerate} />;
  }

  if (type === "video") {
    return <VideoStudioFlow items={items} canModerate={canModerate} />;
  }

  if (type === "brief") {
    return <BriefStudioFlow canModerate={canModerate} />;
  }

  return (
    <div className="space-y-4 py-2">
      <SectionHeader title={PAGE_TITLE[type]} description={PAGE_DESCRIPTION[type]} align="center" size="lg" />

      <Composer
        value={prompt}
        onChange={setPrompt}
        onSubmit={handleSubmit}
        maxLength={PROMPT_LIMITS[type]}
        placeholder={PLACEHOLDER[type]}
        label={PAGE_TITLE[type]}
        busy={busy}
        attachAccept={ATTACHMENT_ACCEPT_VIDEO}
        onAttachFile={handleAttachFile}
        attachment={attachment}
        onRemoveAttachment={() => setAttachment(null)}
        onAttachmentModeChange={(mode) => setAttachment((prev) => (prev ? { ...prev, mode } : prev))}
      >
        <ConfigRow>
          <Panel params={params} onChange={patch} />
        </ConfigRow>
      </Composer>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold tracking-tight">Hasil Generate</h2>
        <div className="flex shrink-0 gap-1 rounded-full bg-zinc-900/5 p-1 text-xs dark:bg-white/5">
          {(["all", "mine"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setScope(tab)}
              aria-pressed={scope === tab}
              className={cn(
                "rounded-full px-2 py-1 font-medium transition-colors",
                scope === tab
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white"
                  : "text-zinc-500 dark:text-zinc-400",
              )}
            >
              {tab === "all" ? "Semua" : "Generate saya"}
            </button>
          ))}
        </div>
      </div>

      <BentoGallery
        type={type}
        items={items}
        loading={loading}
        loadingMore={loadingMore}
        hasMore={hasMore}
        error={error}
        onLoadMore={loadMore}
        onRetryLoad={refresh}
        onOpen={openItem}
        onRetry={(item) => void retry(item.id)}
        playingAudioId={playingAudioId}
        onToggleAudio={toggleAudio}
      />

      <DetailModal
        item={selected}
        canModerate={canModerate}
        onClose={closeModal}
        onSimilar={handleSimilar}
        onDeleted={(id) => void remove(id)}
      />
    </div>
  );
}
