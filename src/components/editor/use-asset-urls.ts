"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/client";
import type { AssetDTO, CreationDTO, EditorState } from "@/types";

/** Collect every asset id referenced by an editor state. */
export function collectAssetIds(state: EditorState | null): string[] {
  if (!state) return [];
  const ids = new Set<string>();
  const add = (v: string | null | undefined) => {
    // Values starting with "/" are direct URLs, not asset ids.
    if (v && !v.startsWith("/")) ids.add(v);
  };
  if (state.type === "image") {
    add(state.slide.background?.assetId);
    state.slide.layers.forEach((l) => l.type === "image" && add(l.assetId));
  } else if (state.type === "carousel") {
    state.slides.forEach((s) => {
      add(s.background?.assetId);
      s.layers.forEach((l) => l.type === "image" && add(l.assetId));
    });
  } else if (state.type === "video") {
    state.scenes.forEach((s) => add(s.clipAssetId));
    add(state.narration?.assetId);
    add(state.music?.assetId);
  } else if (state.type === "audio") {
    state.segments.forEach((s) => add(s.assetId));
    add(state.music?.assetId);
  } else if (state.type === "article") {
    state.blocks?.forEach((b) => b.type === "image" && add(b.assetId));
  }
  return Array.from(ids);
}

/** Resolve asset ids (from items + editor state) to signed URLs. */
export function useAssetUrls(creation: CreationDTO, state: EditorState | null): Record<string, string> {
  const [extra, setExtra] = useState<Record<string, string>>({});
  const base = useMemo(() => {
    const map: Record<string, string> = {};
    for (const item of creation.items) {
      if (item.asset?.fileUrl) map[item.asset.id] = item.asset.fileUrl;
    }
    return map;
  }, [creation]);

  useEffect(() => {
    const missing = collectAssetIds(state).filter((id) => !base[id] && !(id in extra));
    if (!missing.length) return;
    let aborted = false;
    (async () => {
      const found: Record<string, string> = {};
      for (const id of missing) {
        try {
          const res = await apiFetch<{ asset: AssetDTO }>(`/api/assets/${id}`);
          if (res.asset.fileUrl) found[id] = res.asset.fileUrl;
        } catch {
          /* ignore missing assets */
        }
      }
      if (!aborted && Object.keys(found).length) setExtra((prev) => ({ ...prev, ...found }));
    })();
    return () => {
      aborted = true;
    };
  }, [state, base, extra]);

  return useMemo(() => ({ ...base, ...extra }), [base, extra]);
}
