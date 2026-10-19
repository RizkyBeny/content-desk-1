"use client";

import { useEffect, useState } from "react";
import { Button, Chip } from "@heroui/react";
import { apiFetch, post } from "@/lib/client";
import { GlassCard, SectionHeader } from "@/components/ui/primitives";
import { toast } from "@heroui/react";
import { PlusIcon, RefreshIcon } from "@/components/ui/icons";
import type { ConnectionType } from "@/types";

interface Connection {
  id: string;
  type: string;
  displayName: string;
  accountHandle: string | null;
  status: string;
  lastSyncedAt: string | null;
  owners: { id: string; name: string; email: string }[];
}

export default function KoneksiPage() {
  const [items, setItems] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<{ user: { role: string; id: string } } | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [url, setUrl] = useState("https://internal.example.com/api/content");
  const [apiKey, setApiKey] = useState("");
  const [creatingInternal, setCreatingInternal] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [connRes, meRes] = await Promise.all([
        apiFetch<{ items: Connection[] }>("/api/connections"),
        apiFetch<{ user: { id: string; role: string } }>("/api/me"),
      ]);
      setItems(connRes.items);
      setMe(meRes);
    } catch (e: unknown) {
      const err = e as { message?: string };
      toast.danger(err.message ?? "Gagal memuat koneksi.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        const [connRes, meRes] = await Promise.all([
          apiFetch<{ items: Connection[] }>("/api/connections"),
          apiFetch<{ user: { id: string; role: string } }>("/api/me"),
        ]);
        if (aborted) return;
        setItems(connRes.items);
        setMe(meRes);
      } catch (e: unknown) {
        if (aborted) return;
        const err = e as { message?: string };
        toast.danger(err.message ?? "Gagal memuat koneksi.");
      } finally {
        if (!aborted) setLoading(false);
      }
    })();
    return () => {
      aborted = true;
    };
  }, []);

  async function startConnect(type: ConnectionType, dn: string) {
    try {
      const res = await apiFetch<{ url: string; state: string }>(`/api/connections/${type}/oauth/start?displayName=${encodeURIComponent(dn)}`);
      location.assign(res.url);
    } catch (e: unknown) {
      const err = e as { message?: string };
      toast.danger(err.message ?? "Gagal memulai koneksi.");
    }
  }

  async function createInternal() {
    if (!displayName) return toast.danger("Nama koneksi wajib diisi.");
    if (!url) return toast.danger("URL wajib diisi.");
    setCreatingInternal(true);
    try {
      await post("/api/connections/internal", { displayName, url, apiKey });
      toast.success("Koneksi internal berhasil dibuat.");
      setDisplayName(""); setApiKey("");
      await load();
    } catch (e: unknown) {
      const err = e as { message?: string };
      toast.danger(err.message ?? "Gagal membuat koneksi.");
    } finally {
      setCreatingInternal(false);
    }
  }

  const isAdmin = me?.user?.role === "admin";

  return (
    <div className="space-y-6">
      <GlassCard className="flex flex-col gap-5 p-5">
        <SectionHeader title="Koneksi sosial (mock OAuth)" description="Demo: sistem akan mengarahkan ke callback mock setelah klik." action={<Button variant="secondary" size="sm" onPress={load} isDisabled={loading}><RefreshIcon width={16} height={16}/> Muat ulang</Button>} />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(["instagram","tiktok","x","facebook","youtube"] as const).map((t) => (
            <button key={t} onClick={() => startConnect(t, `${t} Demo`)} disabled={!isAdmin || loading} className="glass-panel flex flex-col items-start gap-1 p-4 text-left transition-transform hover:-translate-y-0.5 disabled:opacity-50">
              <p className="text-sm font-medium capitalize">{t}</p>
              <p className="text-xs text-zinc-500">Klik untuk mock connect</p>
            </button>
          ))}
        </div>
      </GlassCard>

      {isAdmin && (
        <GlassCard className="flex flex-col gap-5 p-5">
          <SectionHeader title="Koneksi internal (manual)" description="Tambahkan koneksi data internal." />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Nama koneksi</label>
              <input value={displayName} onChange={(e)=>setDisplayName(e.target.value)} className="w-full rounded-xl border border-zinc-200/70 bg-white/80 px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-900/70" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Endpoint URL</label>
              <input value={url} onChange={(e)=>setUrl(e.target.value)} className="w-full rounded-xl border border-zinc-200/70 bg-white/80 px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-900/70" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">API Key (opsional)</label>
              <input value={apiKey} onChange={(e)=>setApiKey(e.target.value)} className="w-full rounded-xl border border-zinc-200/70 bg-white/80 px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-900/70" />
            </div>
            <div className="flex items-end">
              <Button variant="primary" onPress={createInternal} isDisabled={creatingInternal}><PlusIcon width={16} height={16}/> Tambah</Button>
            </div>
          </div>
        </GlassCard>
      )}

      <GlassCard className="flex flex-col gap-4 p-5">
        <SectionHeader title="Daftar koneksi" description={`Total ${items.length} koneksi`} />
        <div className="space-y-3">
          {items.map((c) => (
            <div key={c.id} className="glass-panel flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{c.displayName}</p>
                  <Chip size="sm">{c.type}</Chip>
                  <Chip size="sm" variant="soft">{c.status}</Chip>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                  {c.accountHandle && <span>@{c.accountHandle}</span>}
                  {c.lastSyncedAt && <span>Terakhir sync: {new Date(c.lastSyncedAt).toLocaleString("id-ID")}</span>}
                  <span>Pemilik: {c.owners.map(o=>o.name).join(", ") || "-"}</span>
                </div>
              </div>
            </div>
          ))}
          {items.length === 0 && <p className="text-sm text-zinc-500">Belum ada koneksi.</p>}
        </div>
      </GlassCard>
    </div>
  );
}
