import type { Ratio } from "@/types";

/** Editor canvas resolution per ratio (matches server-side export). */
export const CANVAS_DIMS: Record<Ratio, { w: number; h: number }> = {
  "1:1": { w: 1080, h: 1080 },
  "4:5": { w: 1080, h: 1350 },
  "9:16": { w: 1080, h: 1920 },
  "16:9": { w: 1920, h: 1080 },
};

export const RATIOS: Ratio[] = ["1:1", "4:5", "9:16", "16:9"];
