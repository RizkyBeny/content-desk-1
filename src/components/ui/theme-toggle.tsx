"use client";

import { useTheme } from "@/components/theme/theme-provider";
import { useEffect, useState } from "react";
import { Button } from "@heroui/react";
import { SunIcon, MoonIcon } from "./icons";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const isDark = resolvedTheme === "dark";
  return (
    <Button
      variant="ghost"
      isIconOnly
      aria-label={mounted ? (isDark ? "Aktifkan tema terang" : "Aktifkan tema gelap") : "Ubah tema"}
      className={className}
      onPress={() => setTheme(isDark ? "light" : "dark")}
    >
      {mounted && isDark ? <SunIcon /> : <MoonIcon />}
    </Button>
  );
}
