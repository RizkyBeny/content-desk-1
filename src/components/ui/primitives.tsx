import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function GlassCard({
  className,
  children,
  as: Tag = "div",
}: {
  className?: string;
  children: ReactNode;
  as?: "div" | "section" | "article";
}) {
  return <Tag className={cn("glass-card p-5", className)}>{children}</Tag>;
}

export function GlassPanel({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("glass-panel p-4", className)}>{children}</div>;
}

export function SectionHeader({
  title,
  description,
  action,
  className,
  align = "start",
  size = "md",
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  align?: "start" | "center";
  size?: "md" | "lg";
}) {
  const centered = align === "center";
  return (
    <div
      className={cn(
        "flex gap-4",
        centered ? "flex-col items-center text-center" : "items-start justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className={cn("font-semibold tracking-tight", size === "lg" ? "text-[1.35rem]" : "text-lg")}>
          {title}
        </h2>
        {description ? (
          <p
            className={cn(
              "mt-0.5 text-zinc-500 dark:text-zinc-400",
              size === "lg" ? "text-[1.05rem]" : "text-sm",
            )}
          >
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
