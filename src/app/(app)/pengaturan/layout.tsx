"use client";

import { Tabs } from "@heroui/react";
import { useRouter, usePathname } from "next/navigation";
import { SectionHeader } from "@/components/ui/primitives";

export default function PengaturanLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const selected = pathname === "/pengaturan/koneksi" ? "koneksi" : pathname === "/pengaturan/anggota" ? "anggota" : "profil";

  return (
    <div className="space-y-6 py-4">
      <SectionHeader title="Pengaturan" description="Profil, koneksi & anggota" />
      <div className="glass-card p-3">
        <Tabs.Root selectedKey={selected} onSelectionChange={(k) => router.push(k === "koneksi" ? "/pengaturan/koneksi" : k === "anggota" ? "/pengaturan/anggota" : "/pengaturan")}>
          <Tabs.List>
            <Tabs.Tab id="profil">Profil</Tabs.Tab>
            <Tabs.Tab id="koneksi">Koneksi</Tabs.Tab>
            <Tabs.Tab id="anggota">Anggota</Tabs.Tab>
          </Tabs.List>
        </Tabs.Root>
      </div>
      <div>{children}</div>
    </div>
  );
}
