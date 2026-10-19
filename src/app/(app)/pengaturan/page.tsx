"use client";

import { useEffect, useState } from "react";
import { Button, Chip } from "@heroui/react";
import { apiFetch, patch } from "@/lib/client";
import { GlassCard, SectionHeader } from "@/components/ui/primitives";
import { toast } from "@heroui/react";
import { RefreshIcon } from "@/components/ui/icons";

interface Me {
  user: {
    name: string;
    email: string;
    niche: string | null;
    nicheCategories: string[];
  };
}

export default function ProfilPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [name, setName] = useState("");
  const [niche, setNiche] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await apiFetch<Me>("/api/me");
    setMe(res);
    setName(res.user.name);
    setNiche(res.user.niche ?? "");
  }

  useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        const res = await apiFetch<Me>("/api/me");
        if (!aborted) {
          setMe(res);
          setName(res.user.name);
          setNiche(res.user.niche ?? "");
        }
      } catch (e: unknown) {
        if (aborted) return;
        const err = e as { message?: string };
        toast.danger(err.message ?? "Gagal memuat profil.");
      }
    })();
    return () => { aborted = true; };
  }, []);

  async function save() {
    setSaving(true);
    try {
      await patch("/api/me", { name, niche });
      toast.success("Profil berhasil disimpan.");
    } catch (e: unknown) {
      const err = e as { message?: string };
      toast.danger(err.message ?? "Gagal menyimpan.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <GlassCard className="flex flex-col gap-5 p-5">
      <SectionHeader title="Profil" description="Informasi dasar akun" action={<Button variant="secondary" size="sm" onPress={load}><RefreshIcon width={16} height={16}/> Muat ulang</Button>} />
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Nama lengkap</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full max-w-md rounded-xl border border-zinc-200/70 bg-white/80 px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-900/70" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Email</label>
          <input value={me?.user.email ?? ""} readOnly className="w-full max-w-md rounded-xl border border-zinc-200/70 bg-white/50 px-3 py-2 text-sm opacity-70 dark:border-white/10 dark:bg-zinc-900/40" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Niche (opsional)</label>
          <input value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="Contoh: Produktivitas & AI untuk remote worker" className="w-full max-w-md rounded-xl border border-zinc-200/70 bg-white/80 px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-900/70" />
        </div>
        <div className="flex gap-2">
          {me?.user.nicheCategories.map((c) => <Chip key={c} size="sm" variant="soft">{c}</Chip>)}
        </div>
        <div>
          <Button variant="primary" onPress={save} isDisabled={saving}>{saving ? "Menyimpan..." : "Simpan perubahan"}</Button>
        </div>
      </div>
    </GlassCard>
  );
}
