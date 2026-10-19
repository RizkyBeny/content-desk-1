"use client";

import { useEffect, type ReactNode } from "react";
import { Button } from "@heroui/react";
import { XIcon } from "./icons";

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const maxW = size === "sm" ? "max-w-sm" : size === "lg" ? "max-w-2xl" : "max-w-lg";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 backdrop-blur-[4.8px] sm:items-center sm:p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        className={`glass-panel w-full ${maxW} max-h-[90vh] overflow-y-auto rounded-t-3xl border border-white/15 p-5 shadow-2xl sm:rounded-3xl`}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-base font-semibold tracking-tight">{title}</h3>
            {description ? (
              <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
            ) : null}
          </div>
          <Button isIconOnly variant="ghost" size="sm" aria-label="Tutup" onPress={onClose}>
            <XIcon width={18} height={18} />
          </Button>
        </div>
        <div className="mt-4">{children}</div>
        {footer ? <div className="mt-5 flex justify-end gap-2">{footer}</div> : null}
      </div>
    </div>
  );
}
