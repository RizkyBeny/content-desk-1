"use client";

import { useEffect, useState } from "react";
import { Button, Chip } from "@heroui/react";
import { apiFetch, post } from "@/lib/client";
import { GlassCard, SectionHeader } from "@/components/ui/primitives";
import { toast } from "@heroui/react";
import { LinkIcon, UsersIcon } from "@/components/ui/icons";

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Me {
  user: { role: string };
}

export default function AnggotaPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("creator");
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        const me = await apiFetch<Me>("/api/me");
        if (aborted) return;
        setIsAdmin(me.user.role === "admin");
        if (me.user.role === "admin") {
          const res = await apiFetch<{ items: Member[] }>("/api/members");
          if (!aborted) setMembers(res.items);
        }
      } catch (e: unknown) {
        if (aborted) return;
        const err = e as { message?: string };
        toast.danger(err.message ?? "Gagal memuat anggota.");
      }
    })();
    return () => {
      aborted = true;
    };
  }, []);

  async function invite() {
    setBusy(true);
    setInviteUrl(null);
    try {
      const res = await post<{ url: string }>("/api/admin/invites", { email, role });
      setInviteUrl(res.url);
      toast.success("Undangan dibuat.");
      setEmail("");
    } catch (e: unknown) {
      const err = e as { message?: string };
      toast.danger(err.message ?? "Gagal mengundang.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {isAdmin && (
        <GlassCard className="flex flex-col gap-4 p-5">
          <SectionHeader title="Undang anggota" description="Kirim tautan undangan (mock: URL ditampilkan)." />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-zinc-200/70 bg-white/80 px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-900/70"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Peran</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-xl border border-zinc-200/70 bg-white/80 px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-900/70"
              >
                <option value="creator">Creator</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button variant="primary" onPress={invite} isDisabled={busy}>
                <LinkIcon width={16} height={16} /> Buat undangan
              </Button>
            </div>
          </div>
          {inviteUrl && (
            <div className="glass-panel break-all p-3 text-xs">
              Tautan undangan: <span className="font-medium">{inviteUrl}</span>
            </div>
          )}
        </GlassCard>
      )}

      <GlassCard className="flex flex-col gap-4 p-5">
        <SectionHeader title="Anggota" description={isAdmin ? `${members.length} anggota` : "Hanya admin yang dapat melihat daftar anggota."} />
        <div className="space-y-3">
          {members.map((m) => (
            <div key={m.id} className="glass-panel flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                  <UsersIcon width={16} height={16} />
                </span>
                <div>
                  <p className="text-sm font-medium">{m.name}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{m.email}</p>
                </div>
              </div>
              <Chip size="sm" variant="soft">{m.role === "admin" ? "Admin" : "Creator"}</Chip>
            </div>
          ))}
          {isAdmin && members.length === 0 && <p className="text-sm text-zinc-500">Belum ada anggota.</p>}
        </div>
      </GlassCard>
    </div>
  );
}
