export interface OverviewTab {
  id: string;
  label: string;
}

export const OVERVIEW_TABS: OverviewTab[] = [
  { id: "executive-summary", label: "Executive Summary" },
  { id: "data-platform", label: "Data Platform" },
  { id: "content-type", label: "Content Type" },
  { id: "publishing-time", label: "Publishing Time" },
  { id: "building-block", label: "Building Block" },
  { id: "content-highlight", label: "Content Analysis" },
];

export interface OverviewCluster {
  id: string;
  label: string;
}

export const OVERVIEW_CLUSTERS: OverviewCluster[] = [
  { id: "news", label: "News" },
  { id: "bisnis", label: "Bisnis" },
  { id: "oto", label: "Otomotif" },
  { id: "mom", label: "Mom" },
  { id: "hits", label: "Hits" },
];

// ─────────────────────────────────────────────────────────────
// Tab 1: Executive Summary (Figma node 349:18798)
// ─────────────────────────────────────────────────────────────

export interface TopicRecommendationItem {
  rank: number;
  score: number;
  title: string;
  description: string;
  views: string;
  engagement: string;
  promptPrefill: string;
}

export const TOPIC_RECOMMENDATIONS_DATA: TopicRecommendationItem[] = [
  {
    rank: 1,
    score: 96,
    title: "Kasus Korupsi Indonesia",
    description: "Isu kebijakan ini pemerintah pada pekan ini sedang ramai dibahas dan relevan untuk kebutuhan informasi publik",
    views: "523.k Views",
    engagement: "123.k Engagement",
    promptPrefill: "Ulasan mendalam mengenai perkembangan kasus korupsi di Indonesia dan dampaknya bagi masyarakat",
  },
  {
    rank: 2,
    score: 96,
    title: "Kasus Korupsi Indonesia",
    description: "Isu kebijakan ini pemerintah pada pekan ini sedang ramai dibahas dan relevan untuk kebutuhan informasi publik",
    views: "523.k Views",
    engagement: "123.k Engagement",
    promptPrefill: "Ulasan mendalam mengenai perkembangan kasus korupsi di Indonesia dan dampaknya bagi masyarakat",
  },
  {
    rank: 3,
    score: 96,
    title: "Kasus Korupsi Indonesia",
    description: "Isu kebijakan ini pemerintah pada pekan ini sedang ramai dibahas dan relevan untuk kebutuhan informasi publik",
    views: "523.k Views",
    engagement: "123.k Engagement",
    promptPrefill: "Ulasan mendalam mengenai perkembangan kasus korupsi di Indonesia dan dampaknya bagi masyarakat",
  },
];

export interface KeyTakeawayItem {
  title: string;
  description: string;
}

export interface KeyTakeawayGroup {
  type: "highlights" | "lowlights" | "actions";
  title: string;
  summary: string;
  items: KeyTakeawayItem[];
}

export const KEY_TAKEAWAYS_DATA: KeyTakeawayGroup[] = [
  {
    type: "highlights",
    title: "What Works (Highlights)",
    summary:
      "Platform instagram mencatatkan tren penurunan signifikan sebesar 30% selama 7 hari terakhir, serta engagement rate di bawah rata-rata standar.",
    items: [
      {
        title: "Educational Content Mendorong Impression Instagram Naik 45%",
        description:
          "Impression instagram naik 45% dibanding periode sebelumnya. Hal ini didorong oleh peningkatan proporsi konten bertema educational_needs yang didistribusikan melalui format Reels. Metadata menunjukkan konten dengan topik ini menghasilkan rasio share yang lebih tinggi, sehingga mendorong jangkauan organik ke luar basis followers.",
      },
      {
        title: "Reels Menghasilkan 65% Engagement dari Hanya 30% Publikasi",
        description:
          "Reels menjadi format dengan efisiensi performa tertinggi. Walaupun hanya menyumbang 30% dari total publikasi (n_content), Reels mampu mendatangkan 65% dari total engagement akun. Data akumulasi harian (eval_age) mengonfirmasi bahwa interaksi pada Reels masih terus bertambah hingga D+7, sementara format Carousel cenderung stagnan setelah 24 jam pertama.",
      },
      {
        title: "Konten Sponsor Memicu Lebih Banyak Interaksi melalui Pertanyaan Komparatif",
        description:
          "Konten berstatus sponsor mencatatkan engagement rate di atas rata-rata standar. Berdasarkan tag content_sponsor_status, konten-konten ini memiliki struktur caption yang secara spesifik mengajukan pertanyaan komparasi produk, sehingga memicu jumlah komentar yang lebih banyak dibanding konten reguler.",
      },
    ],
  },
  {
    type: "lowlights",
    title: "What Didn't Work (Lowlights)",
    summary:
      "Platform instagram mencatatkan tren penurunan signifikan sebesar 30% selama 7 hari terakhir, serta engagement rate di bawah rata-rata standar.",
    items: [
      {
        title: "Impression TikTok 35% di Bawah Benchmark, Diduga Dipengaruhi Jadwal Upload Pagi",
        description:
          "Rata-rata impression per konten di TikTok berada 35% di bawah benchmark. Data menunjukkan adanya penumpukan jadwal upload di rentang jam 08.00–10.00 WIB. Konten-konten yang di-upload pada slot waktu ini secara konsisten menghasilkan lifetime impression yang rendah dan masuk ke bucket below, mengindikasikan jadwal rilis yang kurang efektif.",
      },
      {
        title: "8 dari 10 Konten Single Image Masuk Daftar Lowlight",
        description:
          "Format Single Image mengalami penurunan performa interaksi. Sebanyak 8 dari 10 konten Single Image periode ini tercatat dalam daftar lowlight. Karakteristik visual tunggal yang tidak diimbangi dengan caption pemicu diskusi membuat tingkat dwell time rendah, sehingga engagement rate-nya bertahan di bawah angka 0.8%.",
      },
      {
        title: "Volume Upload Tinggi di Awal Pekan Belum Menghasilkan Reach Optimal",
        description:
          "Konten yang dipublikasikan pada hari Senin dan Selasa mencatatkan rata-rata reach terendah. Meskipun volume publikasi cukup tinggi di awal pekan, rerata impression yang didapat oleh konten-konten tersebut tidak setinggi konten yang dirilis pada pertengahan hingga akhir pekan.",
      },
      {
        title: "Konten dan caption terlalu generik",
        description:
          "Secara data insight user menyukai konten dan caption yang tidak kaku. Gunakan caption yang menarik dan hook yang powerful sesuai dengan market yang dituju",
      },
    ],
  },
  {
    type: "actions",
    title: "Recommended Actions",
    summary:
      "Platform instagram mencatatkan tren penurunan signifikan sebesar 30% selama 7 hari terakhir, serta engagement rate di bawah rata-rata standar.",
    items: [
      {
        title: "Tingkatkan Porsi Reels hingga 50–60% untuk Memaksimalkan Engagement",
        description:
          "Gunakan caption yang menarik dan hook yang powerful sesuai dengan market yang dituju",
      },
      {
        title: "Eksekusi Topik dengan Skor Rekomendasi Tertinggi: Strategi Budgeting Gaji UMR",
        description:
          "Secara data insight user menyukai konten dan caption yang tidak kaku.",
      },
      {
        title: "Prioritaskan Slot Publikasi Pukul 18.00–20.00 WIB untuk Performa Lebih Stabil",
        description:
          "Gunakan caption yang menarik dan hook yang powerful sesuai dengan market yang dituju",
      },
      {
        title: "Konten dan caption terlalu generik",
        description:
          "Gunakan caption yang menarik dan hook yang powerful sesuai dengan market yang dituju",
      },
    ],
  },
];

export interface SocialSparklineMetric {
  id: string;
  label: string;
  value: string;
  changePct: string;
  isPositive: boolean;
  currentPoints: number[];
  previousPoints: number[];
  days: string[];
}

export const SOCIAL_METRICS_DATA: SocialSparklineMetric[] = [
  {
    id: "impression",
    label: "Impression",
    value: "2,3M",
    changePct: "22,8%",
    isPositive: true,
    currentPoints: [180, 240, 220, 310, 390, 360, 420],
    previousPoints: [140, 180, 190, 230, 280, 310, 340],
    days: ["Sel", "Rab", "Kam", "Jum", "Sab", "Min", "Sen"],
  },
  {
    id: "engagement",
    label: "Engagement",
    value: "100,2K",
    changePct: "164,8%",
    isPositive: true,
    currentPoints: [15, 22, 19, 38, 55, 62, 75],
    previousPoints: [8, 11, 10, 15, 20, 22, 28],
    days: ["Sel", "Rab", "Kam", "Jum", "Sab", "Min", "Sen"],
  },
  {
    id: "engagementRate",
    label: "Engagement Rate",
    value: "6,6%",
    changePct: "3,6%",
    isPositive: true,
    currentPoints: [4.8, 5.2, 5.0, 5.8, 6.2, 6.4, 6.6],
    previousPoints: [4.0, 4.3, 4.2, 4.8, 5.0, 5.2, 5.4],
    days: ["Sel", "Rab", "Kam", "Jum", "Sab", "Min", "Sen"],
  },
  {
    id: "contentCount",
    label: "Jumlah konten",
    value: "19",
    changePct: "35,7%",
    isPositive: true,
    currentPoints: [2, 3, 2, 4, 3, 2, 3],
    previousPoints: [1, 2, 2, 2, 3, 2, 2],
    days: ["Sel", "Rab", "Kam", "Jum", "Sab", "Min", "Sen"],
  },
];

export interface ProgressTableRow {
  platform: "Instagram" | "TikTok" | "YouTube" | "Facebook";
  average: string;
  standard: string;
  changeValue: string;
  status: "above" | "below";
  statusText: string;
  pctBelow: number;
  pctAverage: number;
  pctAbove: number;
}

export const IMPRESSION_PER_CONTENT_DATA: ProgressTableRow[] = [
  {
    platform: "Instagram",
    average: "182,9K",
    standard: "112,8K",
    changeValue: "62%",
    status: "above",
    statusText: "Di atas standar",
    pctBelow: 20,
    pctAverage: 50,
    pctAbove: 20,
  },
  {
    platform: "TikTok",
    average: "182,9K",
    standard: "112,8K",
    changeValue: "50%",
    status: "below",
    statusText: "Di bawah standar",
    pctBelow: 10,
    pctAverage: 60,
    pctAbove: 30,
  },
  {
    platform: "YouTube",
    average: "182,9K",
    standard: "112,8K",
    changeValue: "20%",
    status: "below",
    statusText: "Di bawah standar",
    pctBelow: 5,
    pctAverage: 20,
    pctAbove: 60,
  },
  {
    platform: "Facebook",
    average: "182,9K",
    standard: "112,8K",
    changeValue: "11%",
    status: "below",
    statusText: "Di bawah standar",
    pctBelow: 2,
    pctAverage: 64,
    pctAbove: 80,
  },
];

export const ENGAGEMENT_PER_CONTENT_DATA: ProgressTableRow[] = [
  {
    platform: "Instagram",
    average: "182,9K",
    standard: "112,8K",
    changeValue: "62%",
    status: "above",
    statusText: "Di atas standar",
    pctBelow: 20,
    pctAverage: 50,
    pctAbove: 20,
  },
  {
    platform: "TikTok",
    average: "182,9K",
    standard: "112,8K",
    changeValue: "50%",
    status: "below",
    statusText: "Di bawah standar",
    pctBelow: 10,
    pctAverage: 60,
    pctAbove: 30,
  },
  {
    platform: "YouTube",
    average: "182,9K",
    standard: "112,8K",
    changeValue: "20%",
    status: "below",
    statusText: "Di bawah standar",
    pctBelow: 5,
    pctAverage: 20,
    pctAbove: 60,
  },
  {
    platform: "Facebook",
    average: "182,9K",
    standard: "112,8K",
    changeValue: "11%",
    status: "below",
    statusText: "Di bawah standar",
    pctBelow: 2,
    pctAverage: 64,
    pctAbove: 80,
  },
];

// ─────────────────────────────────────────────────────────────
// Tab 2: Data Platform (Figma node 349:19317)
// ─────────────────────────────────────────────────────────────

export interface DataPlatformHighlight {
  iconType: "play" | "film" | "image";
  title: string;
  description: string;
}

export const DATA_PLATFORM_HIGHLIGHTS: DataPlatformHighlight[] = [
  {
    iconType: "play",
    title: "Instagram Jadi Kontributor Engagement Terbesar, Video Paling Efisien",
    description:
      "Instagram menyumbang 55% engagement cluster. Di akun kumparanmom, Video menghasilkan 45% engagement dari hanya 25% total konten, jadi format ini layak diprioritaskan.",
  },
  {
    iconType: "film",
    title: "Single Photo Hasilkan Engagement 35% di Bawah Standar",
    description:
      "Dari 40 konten Single Photo akun kumparanmoms, engagement masih 35% di bawah standar. Alihkan sebagian produksi ke Video, format ini terbukti menghasilkan engagement lebih tinggi di TikTok.",
  },
  {
    iconType: "image",
    title: "TikTok Punya Peluang Optimasi: 40% Produksi Hanya Menghasilkan 15% Engagement",
    description:
      "Kurangi porsi Single Image dan alihkan ke format dengan engagement lebih tinggi. Prioritaskan topik dan jam publikasi yang potensial untuk membantu mengejar target MTD cluster.",
  },
];

export interface PlatformCardInsight {
  type: "positive" | "negative";
  title: string;
  description: string;
  thumbnail: string;
}

export interface PlatformDetailCard {
  platform: "Instagram" | "TikTok" | "YouTube";
  headerBg: string;
  impression: string;
  impressionChange: string;
  isImpressionPositive: boolean;
  engagement: string;
  engagementChange: string;
  er: string;
  erChange: string;
  isErPositive: boolean;
  contentCount: string;
  contentChange: string;
  insights: PlatformCardInsight[];
}

export const PLATFORM_DETAIL_CARDS: PlatformDetailCard[] = [
  {
    platform: "Instagram",
    headerBg: "bg-[#271E47] text-white",
    impression: "435K",
    impressionChange: "39.7%",
    isImpressionPositive: true,
    engagement: "43.5K",
    engagementChange: "39.7%",
    er: "8.0%",
    erChange: "39.7%",
    isErPositive: false,
    contentCount: "29",
    contentChange: "39.7%",
    insights: [
      {
        type: "negative",
        title: "Single Photo di Bawah Standar",
        description: "Akun kumparanmom: 12 konten Single Photo menghasilkan engagement 35% di bawah rata-rata akun.",
        thumbnail: "/post-media/card-1.png",
      },
      {
        type: "positive",
        title: "Video Lebih Efisien",
        description: "Akun kumparanmom: Konten Video menghasilkan 45% engagement dari 25% total konten (efisiensi 1,8x).",
        thumbnail: "/post-media/card-2.png",
      },
    ],
  },
  {
    platform: "TikTok",
    headerBg: "bg-[#181E38] text-white",
    impression: "435K",
    impressionChange: "39.7%",
    isImpressionPositive: true,
    engagement: "43.5K",
    engagementChange: "39.7%",
    er: "8.0%",
    erChange: "39.7%",
    isErPositive: false,
    contentCount: "29",
    contentChange: "39.7%",
    insights: [
      {
        type: "negative",
        title: "Engagement Rendah pada Building Block Edukasi",
        description: "Akun kumparannews: 15 konten dengan building block edukasi menghasilkan engagement 40% di bawah rata-rata.",
        thumbnail: "/post-media/card-2.png",
      },
      {
        type: "positive",
        title: "Video Newsroom Dorong Engagement",
        description: "Akun kumparannews: Video breaking news menghasilkan engagement 1,6x median konten TikTok.",
        thumbnail: "/post-media/card-3.png",
      },
    ],
  },
  {
    platform: "YouTube",
    headerBg: "bg-[#381622] text-white",
    impression: "435K",
    impressionChange: "39.7%",
    isImpressionPositive: false,
    engagement: "43.5K",
    engagementChange: "39.7%",
    er: "8.0%",
    erChange: "39.7%",
    isErPositive: false,
    contentCount: "29",
    contentChange: "39.7%",
    insights: [
      {
        type: "negative",
        title: "Impression Shorts di Bawah Standar",
        description: "Akun kumparanOTO: 10 konten Shorts menghasilkan impression 38% di bawah rata-rata.",
        thumbnail: "/post-media/card-3.png",
      },
      {
        type: "positive",
        title: "Review Otomotif Hasilkan Impression Tinggi",
        description: "Akun kumparanOTO: Video review mobil menghasilkan 1,7x impression median konten YouTube.",
        thumbnail: "/post-media/card-1.png",
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────
// Tab 3: Content Type (Figma node 349:19396)
// ─────────────────────────────────────────────────────────────

export interface ContentTypeHighlightItem {
  iconType: "play" | "film" | "image";
  title: string;
  description: string;
  postTitle: string;
  postAuthor: string;
  postThumbnail: string;
}

export const CONTENT_TYPE_HIGHLIGHTS: ContentTypeHighlightItem[] = [
  {
    iconType: "play",
    title: "Reels Cuma 25% Konten, Tapi Borong 62% Engagement:",
    description:
      "Format ini terbukti paling efisien karena akumulasi distribusinya yang panjang membuat perolehan interaksinya jauh melampaui format gambar tunggal.",
    postTitle: "KPK membongkar modus dugaan korupsi di BNPB. Salah satunya melibatkan adik sekaligus tenaga...",
    postAuthor: "kumparancom",
    postThumbnail: "/post-media/card-1.png",
  },
  {
    iconType: "film",
    title: "Single Image Buang Resource: 40% Produksi Cuma Hasilkan 12% Interaksi",
    description:
      "Format gambar tunggal menjadi beban akun periode ini karena daya tarik visualnya rendah, sehingga mayoritas kontennya tersangkut di bawah standar rata-rata.",
    postTitle: "KPK membongkar modus dugaan korupsi di BNPB. Salah satunya melibatkan adik sekaligus tenaga...",
    postAuthor: "kumparancom",
    postThumbnail: "/post-media/card-2.png",
  },
  {
    iconType: "image",
    title: "Stop Bikin Single Image, Pindahkan 50% Kuota Produksi ke Reels",
    description:
      "Pangkas porsi gambar tunggal dan alihkan alokasi ke Reels untuk mengeksekusi topik edukasi pada slot publikasi malam hari (18.00–20.00 WIB).",
    postTitle: "KPK membongkar modus dugaan korupsi di BNPB. Salah satunya melibatkan adik sekaligus tenaga...",
    postAuthor: "kumparancom",
    postThumbnail: "/post-media/card-3.png",
  },
];

export interface ContentTypeTableRow {
  platform: "TikTok" | "YouTube" | "Instagram";
  contentType: string;
  totalContent: string;
  totalImpression: string;
  impressionPerContent: string;
  totalEngagement: string;
  engagementRate: string;
  status: "Perlu Dievaluasi" | "Cukup Baik" | "Sangat Baik";
}

export const CONTENT_TYPE_EVAL_DATA: ContentTypeTableRow[] = [
  { platform: "TikTok", contentType: "Tiktok Video", totalContent: "183", totalImpression: "1,76jt", impressionPerContent: "9,6rb", totalEngagement: "87,9rb", engagementRate: "4,8%", status: "Perlu Dievaluasi" },
  { platform: "YouTube", contentType: "Youtube Short", totalContent: "183", totalImpression: "1,76jt", impressionPerContent: "9,6rb", totalEngagement: "87,9rb", engagementRate: "4,8%", status: "Perlu Dievaluasi" },
  { platform: "TikTok", contentType: "Tiktok Photo", totalContent: "183", totalImpression: "1,76jt", impressionPerContent: "9,6rb", totalEngagement: "87,9rb", engagementRate: "4,8%", status: "Perlu Dievaluasi" },
  { platform: "TikTok", contentType: "Tiktok Carousel", totalContent: "183", totalImpression: "1,76jt", impressionPerContent: "9,6rb", totalEngagement: "87,9rb", engagementRate: "4,8%", status: "Perlu Dievaluasi" },
  { platform: "TikTok", contentType: "Tiktok Carousel", totalContent: "183", totalImpression: "1,76jt", impressionPerContent: "9,6rb", totalEngagement: "87,9rb", engagementRate: "4,8%", status: "Perlu Dievaluasi" },
];

export const CONTENT_TYPE_GOOD_DATA: ContentTypeTableRow[] = [
  { platform: "Instagram", contentType: "Instagram Reels Video", totalContent: "183", totalImpression: "1,76jt", impressionPerContent: "9,6rb", totalEngagement: "87,9rb", engagementRate: "4,8%", status: "Cukup Baik" },
  { platform: "Instagram", contentType: "Instagram Reels Video", totalContent: "183", totalImpression: "1,76jt", impressionPerContent: "9,6rb", totalEngagement: "87,9rb", engagementRate: "4,8%", status: "Cukup Baik" },
  { platform: "Instagram", contentType: "Instagram Post", totalContent: "183", totalImpression: "1,76jt", impressionPerContent: "9,6rb", totalEngagement: "87,9rb", engagementRate: "4,8%", status: "Cukup Baik" },
  { platform: "Instagram", contentType: "Instagram Post", totalContent: "183", totalImpression: "1,76jt", impressionPerContent: "9,6rb", totalEngagement: "87,9rb", engagementRate: "4,8%", status: "Cukup Baik" },
  { platform: "YouTube", contentType: "Youtube Full Video", totalContent: "183", totalImpression: "1,76jt", impressionPerContent: "1,76jt", totalEngagement: "87,9rb", engagementRate: "4,8%", status: "Cukup Baik" },
];

export const CONTENT_TYPE_EXCELLENT_DATA: ContentTypeTableRow[] = [
  { platform: "Instagram", contentType: "Instagram Reels Video", totalContent: "183", totalImpression: "1,76jt", impressionPerContent: "9,6rb", totalEngagement: "87,9rb", engagementRate: "4,8%", status: "Sangat Baik" },
  { platform: "Instagram", contentType: "Instagram Reels Video", totalContent: "183", totalImpression: "1,76jt", impressionPerContent: "9,6rb", totalEngagement: "87,9rb", engagementRate: "4,8%", status: "Sangat Baik" },
  { platform: "Instagram", contentType: "Instagram Post", totalContent: "183", totalImpression: "1,76jt", impressionPerContent: "9,6rb", totalEngagement: "87,9rb", engagementRate: "4,8%", status: "Sangat Baik" },
  { platform: "Instagram", contentType: "Instagram Reels Video", totalContent: "183", totalImpression: "1,76jt", impressionPerContent: "9,6rb", totalEngagement: "87,9rb", engagementRate: "4,8%", status: "Sangat Baik" },
  { platform: "Instagram", contentType: "Instagram Post", totalContent: "183", totalImpression: "1,76jt", impressionPerContent: "9,6rb", totalEngagement: "87,9rb", engagementRate: "4,8%", status: "Sangat Baik" },
];

// ─────────────────────────────────────────────────────────────
// Tab 4: Publishing Time (Figma node 349:19477)
// ─────────────────────────────────────────────────────────────

export interface PublishingTimeInsightCard {
  iconType: "trophy" | "sun" | "moon" | "chart";
  title: string;
  pillText: string;
  pillColor: string;
  description: string;
}

export const PUBLISHING_TIME_INSIGHTS: PublishingTimeInsightCard[] = [
  {
    iconType: "trophy",
    title: "Jam terbaik",
    pillText: "20.00 - 21.00",
    pillColor: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
    description: "Memberikan performa tertinggi dengan 20 konten, 36jt Impression, dan 104rb engagement",
  },
  {
    iconType: "sun",
    title: "Performa Pagi Meningkat",
    pillText: "+28%",
    pillColor: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
    description: "Total konten dan impression meningkat dibandingkan dengan periode sebelumnya",
  },
  {
    iconType: "moon",
    title: "Sore-malam paling efektif",
    pillText: "+42%",
    pillColor: "bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400",
    description: "Menyumbang 42% total impression dan 38% total engagement dengan puncak di jam 20.00",
  },
  {
    iconType: "chart",
    title: "Engagement Rate",
    pillText: "Stabil",
    pillColor: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
    description: "Rata-rata engagement rate 6.6% (vs 6.4% periode sebelumnya)",
  },
];

export interface HourlyChartData {
  hour: string;
  content: number;
  impression: number; // in thousands or millions
  engagement: number; // in thousands
}

export const HOURLY_PUBLISHING_DATA: HourlyChartData[] = [
  { hour: "00", content: 0, impression: 0, engagement: 0 },
  { hour: "02", content: 1, impression: 0.1, engagement: 8 },
  { hour: "04", content: 2, impression: 0.2, engagement: 12 },
  { hour: "06", content: 2, impression: 0.2, engagement: 15 },
  { hour: "08", content: 3, impression: 0.4, engagement: 25 },
  { hour: "10", content: 8, impression: 2.2, engagement: 70 },
  { hour: "12", content: 5, impression: 1.2, engagement: 42 },
  { hour: "14", content: 6, impression: 1.4, engagement: 45 },
  { hour: "16", content: 5, impression: 1.8, engagement: 40 },
  { hour: "18", content: 11, impression: 2.8, engagement: 62 },
  { hour: "20", content: 16, impression: 3.6, engagement: 95 },
  { hour: "22", content: 4, impression: 0.9, engagement: 28 },
];

export interface TimeSlotSectionCard {
  iconType: "sun-outline" | "sun-solid" | "moon";
  title: string;
  contentCountText: string;
  impressionText: string;
  engagementText: string;
  growthPillText: string;
}

export const TIME_SLOT_SECTION_CARDS: TimeSlotSectionCard[] = [
  {
    iconType: "sun-outline",
    title: "Pagi (06.00-11.59)",
    contentCountText: "112 (36%)",
    impressionText: "1.8M (22%)",
    engagementText: "126,4K (24%)",
    growthPillText: "+28% Performa meningkat dibanding periode sebelumnya",
  },
  {
    iconType: "sun-solid",
    title: "Siang (12.00-14.59)",
    contentCountText: "112 (36%)",
    impressionText: "1.8M (22%)",
    engagementText: "126,4K (24%)",
    growthPillText: "+28% Performa meningkat dibanding periode sebelumnya",
  },
  {
    iconType: "moon",
    title: "Sore-malem (15.00-21.59)",
    contentCountText: "112 (36%)",
    impressionText: "1.8M (22%)",
    engagementText: "126,4K (24%)",
    growthPillText: "+28% Performa meningkat dibanding periode sebelumnya",
  },
];

// ─────────────────────────────────────────────────────────────
// Tab 5: Building Block (Figma node 349:19556)
// ─────────────────────────────────────────────────────────────

export interface BuildingBlockHighlight {
  iconType: "play" | "film" | "image";
  title: string;
  description: string;
}

export const BUILDING_BLOCK_HIGHLIGHTS: BuildingBlockHighlight[] = [
  {
    iconType: "play",
    title: 'Formula "Tutorial & Tips" Hasilkan Engagement Rate 3x Lipat Lebih Tinggi',
    description:
      "Struktur narasi problem-solving ini paling disukai audiens karena langsung memberikan nilai tambah, sehingga memicu jumlah saves dan shares yang melimpah.",
  },
  {
    iconType: "film",
    title: 'Formula "Behind The Scenes" Gagal Total: 8 dari 10 Konten Sepi Interaksi',
    description:
      "Pendekatan narasi ini kurang memikat audiens target karena tidak memiliki hook yang kuat di 3 detik pertama, membuat engagement-nya tersangkut jauh di bawah standar.",
  },
  {
    iconType: "image",
    title: 'Stop Bikin "Behind The Scenes", Ubah Jadi Formula "Tutorial Ringkas"',
    description:
      "Alihkan fokus konten yang tidak efektif ke struktur Tutorial dan kemas ke dalam format Reels untuk mengeksekusi topik-topik edukasi teratas.",
  },
];

export interface BuildingBlockTableRow {
  blockName: string;
  totalContent: string;
  totalImpression: string;
  impressionPerContent: string;
  totalEngagement?: string;
  engagementRate: string;
  status: "Perlu Dievaluasi" | "Cukup Baik" | "Sangat Baik";
}

export const BUILDING_BLOCK_EVAL_DATA: BuildingBlockTableRow[] = [
  { blockName: "Explainer", totalContent: "183", totalImpression: "1,76jt", impressionPerContent: "87,9rb", engagementRate: "4,8%", status: "Perlu Dievaluasi" },
  { blockName: "Infografis", totalContent: "183", totalImpression: "1,76jt", impressionPerContent: "87,9rb", engagementRate: "4,8%", status: "Perlu Dievaluasi" },
  { blockName: "Oneliner", totalContent: "183", totalImpression: "1,76jt", impressionPerContent: "87,9rb", engagementRate: "4,8%", status: "Perlu Dievaluasi" },
  { blockName: "Vidol", totalContent: "183", totalImpression: "1,76jt", impressionPerContent: "87,9rb", engagementRate: "4,8%", status: "Perlu Dievaluasi" },
  { blockName: "Vidol", totalContent: "183", totalImpression: "1,76jt", impressionPerContent: "87,9rb", engagementRate: "4,8%", status: "Perlu Dievaluasi" },
];

export const BUILDING_BLOCK_GOOD_DATA: BuildingBlockTableRow[] = [
  { blockName: "Listicle", totalContent: "183", totalImpression: "1,76jt", impressionPerContent: "87,9rb", engagementRate: "4,8%", status: "Cukup Baik" },
  { blockName: "Tutorial", totalContent: "183", totalImpression: "1,76jt", impressionPerContent: "87,9rb", engagementRate: "4,8%", status: "Cukup Baik" },
  { blockName: "Listicle", totalContent: "183", totalImpression: "1,76jt", impressionPerContent: "87,9rb", engagementRate: "4,8%", status: "Cukup Baik" },
  { blockName: "Listicle", totalContent: "183", totalImpression: "1,76jt", impressionPerContent: "87,9rb", engagementRate: "4,8%", status: "Cukup Baik" },
  { blockName: "Tutorial", totalContent: "183", totalImpression: "1,76jt", impressionPerContent: "87,9rb", engagementRate: "4,8%", status: "Cukup Baik" },
];

export const BUILDING_BLOCK_EXCELLENT_DATA: BuildingBlockTableRow[] = [
  { blockName: "Live report", totalContent: "183", totalImpression: "1,76jt", impressionPerContent: "87,9rb", engagementRate: "4,8%", status: "Sangat Baik" },
  { blockName: "Quote", totalContent: "183", totalImpression: "1,76jt", impressionPerContent: "87,9rb", engagementRate: "4,8%", status: "Sangat Baik" },
  { blockName: "Quote", totalContent: "183", totalImpression: "1,76jt", impressionPerContent: "87,9rb", engagementRate: "4,8%", status: "Sangat Baik" },
  { blockName: "Svl", totalContent: "183", totalImpression: "1,76jt", impressionPerContent: "87,9rb", engagementRate: "4,8%", status: "Sangat Baik" },
  { blockName: "Svt", totalContent: "183", totalImpression: "1,76jt", impressionPerContent: "87,9rb", engagementRate: "4,8%", status: "Sangat Baik" },
];

// ─────────────────────────────────────────────────────────────
// Tab 6: Content Highlight / Content Analysis (Figma node 349:19636)
// ─────────────────────────────────────────────────────────────

export interface ContentHighlightRow {
  platform: "Instagram" | "Facebook" | "YouTube" | "TikTok";
  contentTitle: string;
  topicBadges: string[];
  impression: string;
  engagement: string;
}

export const LOW_LIGHT_TABLE_DATA: ContentHighlightRow[] = [
  {
    platform: "Instagram",
    contentTitle: "Seorang pria ditemukan meninggal dunia di kamar indekosnya di Jalan Salam IV, RT 10/06, Kelurahan Kebon...",
    topicBadges: ["Produktivitas", "Kecantikan"],
    impression: "87,9rb",
    engagement: "87,9rb",
  },
  {
    platform: "Facebook",
    contentTitle: "Seorang pria ditemukan meninggal dunia di kamar indekosnya di Jalan Salam IV, RT 10/06, Kelurahan Kebon...",
    topicBadges: ["Produktivitas", "Kecantikan"],
    impression: "87,9rb",
    engagement: "87,9rb",
  },
  {
    platform: "YouTube",
    contentTitle: "Seorang pria ditemukan meninggal dunia di kamar indekosnya di Jalan Salam IV, RT 10/06, Kelurahan Kebon...",
    topicBadges: ["Produktivitas", "Kecantikan"],
    impression: "87,9rb",
    engagement: "87,9rb",
  },
  {
    platform: "TikTok",
    contentTitle: "Seorang pria ditemukan meninggal dunia di kamar indekosnya di Jalan Salam IV, RT 10/06, Kelurahan Kebon...",
    topicBadges: ["Produktivitas", "Kecantikan"],
    impression: "87,9rb",
    engagement: "87,9rb",
  },
  {
    platform: "TikTok",
    contentTitle: "Seorang pria ditemukan meninggal dunia di kamar indekosnya di Jalan Salam IV, RT 10/06, Kelurahan Kebon...",
    topicBadges: ["Produktivitas", "Kecantikan"],
    impression: "87,9rb",
    engagement: "87,9rb",
  },
];

export const TOP_HIGHLIGHT_TABLE_DATA: ContentHighlightRow[] = [
  {
    platform: "Instagram",
    contentTitle: "Seorang pria ditemukan meninggal dunia di kamar indekosnya di Jalan Salam IV, RT 10/06, Kelurahan Kebon...",
    topicBadges: ["Produktivitas", "Kecantikan"],
    impression: "87,9rb",
    engagement: "87,9rb",
  },
  {
    platform: "Facebook",
    contentTitle: "Seorang pria ditemukan meninggal dunia di kamar indekosnya di Jalan Salam IV, RT 10/06, Kelurahan Kebon...",
    topicBadges: ["Produktivitas", "Kecantikan"],
    impression: "87,9rb",
    engagement: "87,9rb",
  },
  {
    platform: "YouTube",
    contentTitle: "Seorang pria ditemukan meninggal dunia di kamar indekosnya di Jalan Salam IV, RT 10/06, Kelurahan Kebon...",
    topicBadges: ["Produktivitas", "Kecantikan"],
    impression: "87,9rb",
    engagement: "87,9rb",
  },
  {
    platform: "TikTok",
    contentTitle: "Seorang pria ditemukan meninggal dunia di kamar indekosnya di Jalan Salam IV, RT 10/06, Kelurahan Kebon...",
    topicBadges: ["Produktivitas", "Kecantikan"],
    impression: "87,9rb",
    engagement: "87,9rb",
  },
  {
    platform: "TikTok",
    contentTitle: "Seorang pria ditemukan meninggal dunia di kamar indekosnya di Jalan Salam IV, RT 10/06, Kelurahan Kebon...",
    topicBadges: ["Produktivitas", "Kecantikan"],
    impression: "87,9rb",
    engagement: "87,9rb",
  },
];
