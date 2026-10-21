"use client";

import {
  LOW_LIGHT_TABLE_DATA,
  TOP_HIGHLIGHT_TABLE_DATA,
  type ContentHighlightRow,
} from "../../../../config/overview";
import { HoverTip } from "../hover-tip";

function SocialIcon({ platform }: { platform: ContentHighlightRow["platform"] }) {
  if (platform === "Instagram") {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#E1306C" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
      </svg>
    );
  }
  if (platform === "Facebook") {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="#1877F2">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    );
  }
  if (platform === "YouTube") {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="#FF0000">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    );
  }
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" className="text-zinc-900 dark:text-white">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.85.12V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.47 6.26 6.26 0 0 0 1.86-4.47v-7a8.16 8.16 0 0 0 4.91 1.64V6.85c-.34-.04-.67-.09-1-.16z" />
    </svg>
  );
}

function HighlightSectionContainer({
  title,
  subtitle,
  calloutTitle,
  calloutBullets,
  calloutType,
  data,
}: {
  title: string;
  subtitle: string;
  calloutTitle: string;
  calloutBullets: string[];
  calloutType: "red" | "green";
  data: ContentHighlightRow[];
}) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-zinc-200/80 bg-white p-5 sm:p-6 shadow-sm dark:border-white/10 dark:bg-zinc-900/70">
      {/* Header Row with Filter Dropdown */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-base font-bold tracking-tight text-zinc-900 sm:text-lg dark:text-white">
            {title}
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{subtitle}</p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <label className="text-xs text-zinc-500 dark:text-zinc-400">Filter Akun Media Sosial</label>
          <div className="relative">
            <select className="h-8.5 rounded-lg border border-zinc-200 bg-white pl-3 pr-8 text-xs font-semibold text-zinc-700 shadow-sm transition-colors focus:border-brand focus:outline-none dark:border-white/10 dark:bg-zinc-900/60 dark:text-zinc-200">
              <option>Semua akun (News)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Callout Box */}
      <div
        className={`rounded-xl p-4 text-xs ${
          calloutType === "red"
            ? "border border-rose-200 bg-rose-50 dark:border-rose-900/40 dark:bg-rose-950/20"
            : "border border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-950/20"
        }`}
      >
        <h4
          className={`font-bold ${
            calloutType === "red"
              ? "text-rose-600 dark:text-rose-400"
              : "text-emerald-700 dark:text-emerald-400"
          }`}
        >
          {calloutTitle}
        </h4>
        <ul className="mt-2 space-y-1.5 text-[11px] leading-relaxed text-zinc-700 dark:text-zinc-300">
          {calloutBullets.map((bullet, idx) => (
            <li key={idx}>{bullet}</li>
          ))}
        </ul>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-zinc-200/80 dark:border-white/10">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-zinc-200/80 bg-zinc-50/60 text-[11px] font-semibold text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400">
              <th scope="col" className="px-4 py-2.5 font-semibold">Platform</th>
              <th scope="col" className="px-4 py-2.5 font-semibold">Konten</th>
              <th scope="col" className="px-4 py-2.5 font-semibold">Topik</th>
              <th scope="col" className="px-4 py-2.5 font-semibold"><HoverTip side="bottom" tip="Total tayangan konten ini">Impression</HoverTip></th>
              <th scope="col" className="px-4 py-2.5 font-semibold"><HoverTip side="bottom" tip="Total interaksi konten ini">Engagment</HoverTip></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-white/10 text-zinc-800 dark:text-zinc-200">
            {data.map((row, idx) => (
              <tr key={idx} className="transition-colors hover:bg-zinc-50/60 dark:hover:bg-white/5">
                {/* Platform */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <SocialIcon platform={row.platform} />
                    <span className="font-semibold text-zinc-900 dark:text-white">{row.platform}</span>
                  </div>
                </td>

                {/* Konten title link */}
                <td className="px-4 py-3 max-w-md">
                  <a
                    href="#"
                    className="line-clamp-1 font-medium text-brand-strong hover:underline dark:text-brand"
                  >
                    {row.contentTitle}
                  </a>
                </td>

                {/* Topic Badges */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    {row.topicBadges.map((badge, bIdx) => (
                      <span
                        key={bIdx}
                        className="rounded-md bg-brand/10 px-2 py-0.5 text-[10.5px] font-semibold text-brand-strong dark:bg-brand/15 dark:text-brand"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                </td>

                {/* Impression */}
                <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-white">
                  {row.impression}
                </td>

                {/* Engagement */}
                <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-white">
                  {row.engagement}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function ContentHighlightTab() {
  return (
    <div className="space-y-6">
      {/* Container 1: 5 Content Low Light */}
      <HighlightSectionContainer
        title="5 Content  Low Light"
        subtitle="Konten dengan performa impression lebih rendah dibandingkan standar cluster."
        calloutTitle="Single Photo Muncul di 3 Konten dengan Impression Terendah"
        calloutType="red"
        calloutBullets={[
          '• Format Single Photo muncul di 3 dari 5 konten dengan impression terendah. Konten "5 Tips Memilih Skincare untuk Kulit Berminyak" dari @woman_daily di Instagram hanya meraih 4,2K impression (0,4x standar) dan 120 engagement (0,5x standar). Evaluasi penggunaan Single Photo untuk topik serupa dan uji format Carousel untuk melihat apakah performanya meningkat.',
          '• Performa rendah juga terjadi pada topik berita. Konten "Update Harga Mobil Terbaru" dari @oto_daily di Facebook mencatat 5,1K impression (0,6x standar) dan 95 engagement (0,4x standar). Uji pendekatan penyajian berita yang lebih menarik, misalnya perbandingan harga atau rangkuman visual, lalu bandingkan hasilnya dengan format sebelumnya.',
        ]}
        data={LOW_LIGHT_TABLE_DATA}
      />

      {/* Container 2: 5 Content Highlight */}
      <HighlightSectionContainer
        title="5 Content Highlight"
        subtitle="Konten dengan performa impression jauh lebih tinggi dibandingkan standar cluster."
        calloutTitle="Building Block Tutorial Muncul di 3 Konten dengan Impression Tertinggi"
        calloutType="green"
        calloutBullets={[
          '• Dari 5 konten dengan impression tertinggi, Tutorial menjadi format yang paling menonjol, terutama pada Instagram dan Facebook. Konten "3 Cara Merawat Mesin agar Tetap Awet" dari akun @oto_daily mencatat 120K impression (2,4x standar) dan 8,4K engagement (2,1x standar), disusul konten tips hemat BBM dari Otomotif Indonesia dengan 95K impression (1,9x standar).',
          '• Sementara itu, konten dengan format Comparison lebih kuat di engagement, mencatat 5,6K engagement di Facebook (1,8x standar), menunjukkan bahwa format ini mampu mendorong interaksi lebih tinggi dibanding standar.',
        ]}
        data={TOP_HIGHLIGHT_TABLE_DATA}
      />
    </div>
  );
}
