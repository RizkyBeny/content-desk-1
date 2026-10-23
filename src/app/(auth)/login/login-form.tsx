"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "@heroui/react";
import { post } from "@/lib/client";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextTarget = searchParams.get("next");
  const target =
    nextTarget && nextTarget.startsWith("/") && nextTarget !== "/"
      ? nextTarget
      : "/overview";

  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await post("/api/auth/login", { username, password });
      if (typeof window !== "undefined") {
        sessionStorage.setItem("acp_tab_session", "active");
      }
      toast.success("Akses berhasil dibuka!");
      window.location.href = target;
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.danger(e.message ?? "Gagal login. Periksa username dan password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass-card flex w-full max-w-[420px] flex-col gap-6 p-7 shadow-2xl rounded-2xl border border-zinc-200/80 bg-white/90 dark:border-white/10 dark:bg-zinc-900/90 backdrop-blur-md">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Masuk ke Content Desk
        </h1>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Masukkan kredensial akses untuk membuka aplikasi dan data konten.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Username atau Email
          </label>
          <input
            type="text"
            required
            autoComplete="username"
            placeholder="Username atau email"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-xl border border-zinc-200/80 bg-white px-3.5 py-2.5 text-sm shadow-sm transition-colors focus:border-brand-strong focus:outline-none focus:ring-2 focus:ring-brand/30 dark:border-white/10 dark:bg-zinc-800/80 dark:text-zinc-100"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Password
          </label>
          <input
            type="password"
            required
            autoComplete="current-password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-zinc-200/80 bg-white px-3.5 py-2.5 text-sm shadow-sm transition-colors focus:border-brand-strong focus:outline-none focus:ring-2 focus:ring-brand/30 dark:border-white/10 dark:bg-zinc-800/80 dark:text-zinc-100"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center rounded-xl bg-zinc-900 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-brand/40 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 disabled:opacity-50"
        >
          {loading ? "Memverifikasi..." : "Masuk"}
        </button>
      </form>
    </div>
  );
}
