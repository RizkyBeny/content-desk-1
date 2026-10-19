"use client";

import dynamic from "next/dynamic";
import type { SlideCanvasProps } from "./konva-canvas";

const KonvaCanvas = dynamic(() => import("./konva-canvas").then((m) => m.KonvaCanvas), {
  ssr: false,
  loading: () => (
    <div className="flex aspect-[4/5] w-full items-center justify-center rounded-2xl border border-zinc-200/60 text-sm text-zinc-500 dark:border-white/10 dark:text-zinc-400">
      Memuat kanvas…
    </div>
  ),
});

export type { SlideCanvasProps };

export function SlideCanvas(props: SlideCanvasProps) {
  return <KonvaCanvas {...props} />;
}
