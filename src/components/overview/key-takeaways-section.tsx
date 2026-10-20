"use client";

import { CheckIcon } from "@/components/ui/icons";
import { KEY_TAKEAWAYS_DATA, type KeyTakeawayGroup } from "../../../config/overview";

const HEADER_STYLES: Record<KeyTakeawayGroup["type"], { barBg: string }> = {
  highlights: {
    barBg: "bg-[#10B981] text-white",
  },
  lowlights: {
    barBg: "bg-[#EF4444] text-white",
  },
  actions: {
    barBg: "bg-[#0066FF] text-white",
  },
};

function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}

function ThumbDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 14V2" />
      <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z" />
    </svg>
  );
}

function ThumbUpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 10v12" />
      <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
    </svg>
  );
}

function GroupHeaderIcon({ type }: { type: KeyTakeawayGroup["type"] }) {
  if (type === "highlights") return <TrophyIcon className="size-4" />;
  if (type === "lowlights") return <ThumbDownIcon className="size-4" />;
  return <ThumbUpIcon className="size-4" />;
}

export function KeyTakeawaysSection() {
  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm dark:border-[#2E2E2E] dark:bg-[#1A1A1A]">
      {/* Section Header */}
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl dark:text-white">
            Key Takeaways
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 sm:text-sm dark:text-zinc-400">
            Ringkasan insight utama dari keseluruhan analisis pada periode ini
          </p>
        </div>
        <span className="self-start text-xs text-slate-400 sm:self-auto dark:text-zinc-500 font-medium">
          Diperbarui tiap hari
        </span>
      </div>

      {/* 3 Column Cards Grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {KEY_TAKEAWAYS_DATA.map((group) => {
          const style = HEADER_STYLES[group.type];
          return (
            <div
              key={group.type}
              className="flex flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm dark:border-[#2E2E2E] dark:bg-[#1E1E1E]"
            >
              {/* Card Color Header Bar */}
              <div className={`flex items-center gap-2.5 px-4 py-3 ${style.barBg}`}>
                <div className="flex size-6 items-center justify-center rounded-full bg-white/20 text-white">
                  <GroupHeaderIcon type={group.type} />
                </div>
                <h3 className="text-sm font-bold tracking-tight">{group.title}</h3>
              </div>

              {/* Card Body */}
              <div className="flex flex-1 flex-col gap-4 p-4 text-xs">
                {/* Intro summary block */}
                <p className="leading-relaxed text-slate-600 dark:text-zinc-300">
                  {group.summary.includes("30% selama 7 hari terakhir") ? (
                    <>
                      Platform instagram mencatatkan tren penurunan signifikan sebesar{" "}
                      <span className="font-semibold text-rose-500">30% selama 7 hari terakhir</span>, serta
                      engagement rate di bawah rata-rata standar.
                    </>
                  ) : (
                    group.summary
                  )}
                </p>

                {/* Items List */}
                <div className="flex flex-1 flex-col gap-4 pt-1">
                  {group.items.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2.5">
                      <div className="mt-0.5 shrink-0">
                        {group.type === "highlights" && (
                          <span className="flex size-4 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                            <CheckIcon width={10} height={10} />
                          </span>
                        )}
                        {group.type === "lowlights" && (
                          <span className="flex size-4 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                              <line x1="4" x2="4" y1="22" y2="15" stroke="currentColor" strokeWidth="3" />
                            </svg>
                          </span>
                        )}
                        {group.type === "actions" && (
                          <span className="flex size-4 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                            <ThumbUpIcon className="size-2.5" />
                          </span>
                        )}
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold leading-snug text-slate-900 dark:text-white">
                          {item.title}
                        </h4>
                        <p className="text-[11px] leading-relaxed text-slate-500 dark:text-zinc-400">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
