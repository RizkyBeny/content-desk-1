"use client";

import { useEffect } from "react";

/**
 * TabSessionGuard memastikan bahwa setiap sesi hanya bertahan selama tab aktif.
 * Jika tab ditutup dan pengguna membuka tab baru, sessionStorage akan kosong
 * sehingga sesi di-reset dan pengguna diarahkan untuk login ulang.
 */
export function TabSessionGuard() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const tabSession = sessionStorage.getItem("acp_tab_session");
    if (!tabSession) {
      // Tab baru tanpa sesi aktif -> hapus cookie session dan redirect ke login
      fetch("/api/auth/logout", { method: "POST" })
        .catch(() => {})
        .finally(() => {
          window.location.href = "/login";
        });
    }
  }, []);

  return null;
}
