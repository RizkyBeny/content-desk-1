"use client";

import { useState } from "react";
import { Button, toast } from "@heroui/react";
import { patch } from "@/lib/client";
import { CopyIcon } from "@/components/ui/icons";
import type { Caption } from "@/types";

export function CaptionPanel({
  briefId,
  captions,
}: {
  briefId: string | null;
  captions: Caption[];
}) {
  const [items, setItems] = useState<Caption[]>(captions);
  const [saving, setSaving] = useState(false);

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Caption disalin.");
    } catch {
      toast.danger("Gagal menyalin.");
    }
  }

  async function persist() {
    if (!briefId) return;
    setSaving(true);
    try {
      await patch(`/api/briefs/${briefId}`, { captions: items });
      toast.success("Caption tersimpan.");
    } catch (e) {
      toast.danger((e as Error).message ?? "Gagal menyimpan caption.");
    } finally {
      setSaving(false);
    }
  }

  if (!items.length) {
    return <p className="text-sm text-zinc-500 dark:text-zinc-400">Belum ada caption dari brief.</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((c, i) => (
        <div key={i} className="rounded-xl border border-zinc-200/60 p-3 dark:border-white/10">
          <div className="mb-1 flex items-center justify-between">
            {(c.style || c.platform) ? (
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {c.style}{c.platform ? ` · ${c.platform}` : ""}
              </span>
            ) : (
              <span />
            )}
            <Button variant="ghost" size="sm" onPress={() => copy(`${c.text}\n\n${c.hashtags.join(" ")}`)} aria-label="Salin caption">
              <CopyIcon width={16} height={16} />
            </Button>
          </div>
          <textarea
            rows={3}
            value={c.text}
            onChange={(e) => setItems((prev) => prev.map((x, xi) => (xi === i ? { ...x, text: e.target.value } : x)))}
            className="w-full rounded-lg border border-zinc-200/70 bg-white/80 px-2 py-1 text-sm dark:border-white/10 dark:bg-zinc-900/70"
          />
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{c.hashtags.join(" ")}</p>
        </div>
      ))}
      {briefId && (
        <Button variant="secondary" size="sm" onPress={persist} isDisabled={saving}>
          {saving ? "Menyimpan…" : "Simpan caption"}
        </Button>
      )}
    </div>
  );
}
