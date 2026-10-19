"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@heroui/react";
import { apiFetch, post } from "@/lib/client";

interface InviteInfo {
  email: string;
  role: "admin" | "creator";
}

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        const d = await apiFetch<InviteInfo>(`/api/auth/invite/${token}`);
        if (!aborted) setInvite(d);
      } catch {
        if (!aborted) setInvite(null);
      } finally {
        if (!aborted) setLoading(false);
      }
    })();
    return () => {
      aborted = true;
    };
  }, [token]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) return toast.danger("Password minimal 8 karakter.");
    if (password !== confirm) return toast.danger("Konfirmasi password tidak sesuai.");
    setSubmitting(true);
    try {
      await post(`/api/auth/invite/${token}`, { name, password });
      toast.success("Akun berhasil dibuat!");
      router.replace("/insight");
    } catch (e: unknown) {
      const err = e as { message?: string };
      toast.danger(err.message ?? "Gagal membuat akun.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="glass-card p-6">Memuat...</div>;
  if (!invite)
    return (
      <div className="glass-card p-6">Undangan tidak valid, sudah digunakan, atau kedaluwarsa.</div>
    );

  return (
    <div className="glass-card flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Lengkapi profil</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Undangan untuk {invite.email} sebagai {invite.role === "admin" ? "Admin" : "Creator"}.
        </p>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Nama lengkap</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-zinc-200/70 bg-white/80 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-white/10 dark:bg-zinc-900/70"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Password (min 8 karakter)</label>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-zinc-200/70 bg-white/80 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-white/10 dark:bg-zinc-900/70"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Konfirmasi password</label>
          <input
            type="password"
            required
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full rounded-xl border border-zinc-200/70 bg-white/80 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-white/10 dark:bg-zinc-900/70"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-transform hover:-translate-y-0.5 disabled:opacity-50"
        >
          {submitting ? "Memproses..." : "Buat akun"}
        </button>
      </form>
    </div>
  );
}
