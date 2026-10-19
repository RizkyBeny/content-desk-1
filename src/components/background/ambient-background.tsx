"use client";

import { useEffect, useRef } from "react";

export function AmbientBackground() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const reducedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedRef.current = mq.matches;
    const handleChange = (e: MediaQueryListEvent) => {
      reducedRef.current = e.matches;
    };
    mq.addEventListener("change", handleChange);

    let rafId = 0;
    const handleMove = (e: MouseEvent) => {
      if (reducedRef.current) return;
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const el = containerRef.current;
        if (!el) return;
        el.style.setProperty("--px", x.toFixed(3));
        el.style.setProperty("--py", y.toFixed(3));
      });
    };

    window.addEventListener("mousemove", handleMove, { passive: true });
    return () => {
      mq.removeEventListener("change", handleChange);
      window.removeEventListener("mousemove", handleMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 -z-10 pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, color-mix(in oklch, var(--foreground) 10%, transparent) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          opacity: 0.7,
        }}
      />
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-[25%] -left-[15%] w-[610px] h-[400px] blur-[127px] opacity-[0.72] motion-reduce:animate-none"
          style={{
            backgroundImage: "linear-gradient(#6e20ff, #ef7be9)",
            animation: "rotate 22s linear infinite",
            borderRadius: "30% 70% 70% 30%/30% 30% 70% 70%",
            transform: "translate3d(calc(var(--px, 0) * 6px), calc(var(--py, 0) * 4px), 0)",
            willChange: "transform, filter",
          }}
        />
        <div
          className="absolute -bottom-[30%] -right-[10%] h-[60vmax] w-[60vmax] rounded-full blur-[110px] opacity-[0.20] motion-reduce:animate-none"
          style={{
            background:
              "radial-gradient(closest-side, oklch(58% 0.22 255) 0%, oklch(70% 0.22 310) 38%, transparent 72%)",
            transform: "translate3d(calc(var(--px, 0) * -5px), calc(var(--py, 0) * -6px), 0)",
            animation: "blob-float-b 22s ease-in-out infinite alternate",
            willChange: "transform",
          }}
        />
        <div
          className="absolute top-[15%] right-[20%] h-[40vmax] w-[48vmax] rounded-full blur-[100px] opacity-[0.18] motion-reduce:animate-none"
          style={{
            background:
              "radial-gradient(closest-side, oklch(72% 0.20 235) 0%, oklch(68% 0.22 275) 32%, transparent 70%)",
            transform: "translate3d(calc(var(--px, 0) * 4px), calc(var(--py, 0) * 5px), 0)",
            animation: "blob-float-c 16s ease-in-out infinite alternate",
            willChange: "transform",
          }}
        />
      </div>
    </div>
  );
}
