"use client";

import { useEffect, useState } from "react";
import { Button, toast } from "@heroui/react";
import { Modal } from "@/components/ui/modal";
import { apiFetch } from "@/lib/client";
import type { AssetDTO } from "@/types";

interface Usage {
  itemId: string;
  creationId: string;
  projectId: string;
  type: string;
}

const TYPE_LABELS: Record<string, string> = {
  image: "Gambar",
  carousel: "Carousel",
  video: "Video",
  audio: "Audio",
  article: "Artikel",
};

export function AssetDeleteDialog({
  asset,
  onClose,
  onDeleted,
}: {
  asset: AssetDTO | null;
  onClose: () => void;
  onDeleted: (asset: AssetDTO, detachedFrom: number) => void;
}) {
  return (
    <Modal open={Boolean(asset)} onClose={onClose} title="Hapus aset">
      {asset ? <DeleteConfirm asset={asset} onClose={onClose} onDeleted={onDeleted} /> : null}
    </Modal>
  );
}

function DeleteConfirm({
  asset,
  onClose,
  onDeleted,
}: {
  asset: AssetDTO;
  onClose: () => void;
  onDeleted: (asset: AssetDTO, detachedFrom: number) => void;
}) {
  const [usage, setUsage] = useState<Usage[] | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        const res = await apiFetch<{ usage: Usage[] }>(`/api/assets/${asset.id}`);
        if (!aborted) setUsage(res.usage);
      } catch {
        if (!aborted) setUsage([]);
      }
    })();
    return () => {
      aborted = true;
    };
  }, [asset.id]);

  async function remove(force: boolean) {
    setBusy(true);
    try {
      const res = await apiFetch<{ detachedFrom: number }>(
        `/api/assets/${asset.id}${force ? "?force=true" : ""}`,
        { method: "DELETE" },
      );
      toast.success(force ? "Aset dihapus dan dilepas dari konten." : "Aset dihapus.");
      onDeleted(asset, res.detachedFrom ?? 0);
      onClose();
    } catch (e) {
      toast.danger((e as Error).message ?? "Gagal menghapus aset.");
    } finally {
      setBusy(false);
    }
  }

  const inUse = (usage?.length ?? 0) > 0;

  return (
    <div className="space-y-4">
      <div className="space-y-3 text-sm">
        <p>
          Yakin ingin menghapus <span className="font-semibold">{asset.name}</span>? Tindakan ini tidak
          dapat dibatalkan.
        </p>
        {inUse && (
          <div className="rounded-xl border border-amber-300/60 bg-amber-50/70 p-3 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
            <p className="font-medium">Aset sedang dipakai oleh {usage?.length} konten:</p>
            <ul className="mt-1 list-inside list-disc">
              {usage?.slice(0, 5).map((u) => (
                <li key={u.itemId}>{TYPE_LABELS[u.type] ?? u.type}</li>
              ))}
              {(usage?.length ?? 0) > 5 && <li>…dan {usage!.length - 5} lainnya</li>}
            </ul>
            <p className="mt-1.5">
              Dengan melanjutkan, media pada konten tersebut diganti placeholder dan perlu di-generate ulang.
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="secondary" size="sm" onPress={onClose}>
          Batal
        </Button>
        {inUse ? (
          <Button variant="danger" size="sm" onPress={() => remove(true)} isDisabled={busy}>
            {busy ? "Menghapus…" : "Hapus dan lepas dari konten"}
          </Button>
        ) : (
          <Button
            variant="danger"
            size="sm"
            onPress={() => remove(false)}
            isDisabled={busy || usage === null}
          >
            {busy ? "Menghapus…" : "Hapus"}
          </Button>
        )}
      </div>
    </div>
  );
}
