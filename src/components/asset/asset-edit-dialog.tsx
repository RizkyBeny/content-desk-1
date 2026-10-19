"use client";

import { useState } from "react";
import { Button, toast } from "@heroui/react";
import { Modal } from "@/components/ui/modal";
import { patch } from "@/lib/client";
import type { AssetDTO, AssetVisibility } from "@/types";

const inputClass =
  "w-full rounded-lg border border-zinc-200/70 bg-white/80 px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-900/70";

export function AssetEditDialog({
  asset,
  onClose,
  onSaved,
}: {
  asset: AssetDTO | null;
  onClose: () => void;
  onSaved: (asset: AssetDTO) => void;
}) {
  return (
    <Modal open={Boolean(asset)} onClose={onClose} title="Ubah aset">
      {asset ? <EditForm asset={asset} onClose={onClose} onSaved={onSaved} /> : null}
    </Modal>
  );
}

function EditForm({
  asset,
  onClose,
  onSaved,
}: {
  asset: AssetDTO;
  onClose: () => void;
  onSaved: (asset: AssetDTO) => void;
}) {
  const [name, setName] = useState(asset.name);
  const [tags, setTags] = useState(asset.tags.join(", "));
  const [visibility, setVisibility] = useState<AssetVisibility>(asset.visibility);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!name.trim()) return toast.danger("Nama aset wajib diisi.");
    setSaving(true);
    try {
      const tagList = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const res = await patch<{ asset: AssetDTO }>(`/api/assets/${asset.id}`, {
        name: name.trim(),
        tags: tagList,
        visibility,
      });
      toast.success("Aset diperbarui.");
      onSaved(res.asset);
      onClose();
    } catch (e) {
      toast.danger((e as Error).message ?? "Gagal memperbarui aset.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Nama</span>
        <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Tag</span>
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="pisahkan dengan koma"
          className={inputClass}
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Visibilitas</span>
        <select
          value={visibility}
          onChange={(e) => setVisibility(e.target.value as AssetVisibility)}
          className={inputClass}
        >
          <option value="private">Pribadi (hanya saya)</option>
          <option value="workspace">Workspace (semua anggota)</option>
        </select>
      </label>

      <div className="flex justify-end gap-2 pt-1">
        <Button variant="secondary" size="sm" onPress={onClose}>
          Batal
        </Button>
        <Button variant="primary" size="sm" onPress={save} isDisabled={saving}>
          {saving ? "Menyimpan…" : "Simpan"}
        </Button>
      </div>
    </div>
  );
}
