import type { ConnectionType } from "@/types";

/** Deterministic PRNG seeded from a string (stable mock data across runs). */
export function seededRandom(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function computeEngagementRate(
  engagement: number,
  reach: number | null | undefined,
  impressions: number,
): number {
  const base = reach && reach > 0 ? reach : impressions;
  if (!base || base <= 0) return 0;
  return Math.round((engagement / base) * 10000) / 100; // percent, 2 decimals
}

function retentionCurve(rand: () => number, len = 11): number[] {
  let v = 100;
  const out: number[] = [100];
  for (let i = 1; i < len; i++) {
    v = Math.max(2, v - (2 + rand() * 12));
    out.push(Math.round(v * 10) / 10);
  }
  return out;
}

/** Build format-specific metrics matching the PRD metric table. */
export function buildFormatMetrics(
  source: ConnectionType,
  format: string,
  reach: number | null,
  impressions: number,
  rand: () => number,
): Record<string, unknown> {
  const r = (min: number, max: number, digits = 0) => {
    const v = min + rand() * (max - min);
    const f = Math.pow(10, digits);
    return Math.round(v * f) / f;
  };
  const key = `${source}:${format}`;
  switch (key) {
    case "internal:artikel":
      return {
        pageViews: Math.round(impressions * r(0.2, 0.4, 2)),
        avgReadTimeSeconds: r(120, 360),
        shares: r(50, 500),
      };
    case "instagram:reels":
      return {
        avgWatchTimeSeconds: r(4, 12),
        completionRate: r(15, 45),
        retentionCurve: retentionCurve(rand),
        shares: r(50, 800),
        saves: r(100, 2000),
        followsFromReel: r(5, 200),
      };
    case "instagram:image":
      return { saves: r(100, 3000), profileVisits: r(50, 900), follows: r(3, 120) };
    case "instagram:carousel":
      return { swipeThroughRate: r(25, 70), saves: r(200, 4000), shares: r(50, 700), lastSlideCTR: r(2, 12) };
    case "tiktok:video":
      return {
        avgWatchTimeSeconds: r(3, 15),
        completionRate: r(12, 50),
        retentionCurve: retentionCurve(rand),
        shares: r(30, 900),
        saves: r(50, 3000),
        follows: r(3, 250),
        trafficSource: pickTraffic(rand),
      };
    case "tiktok:image":
    case "tiktok:carousel":
      return { swipeThroughRate: r(20, 65), shares: r(20, 600), saves: r(50, 2500) };
    case "x:video":
      return {
        views3s: Math.round(impressions * r(0.3, 0.6, 2)),
        views50pct: Math.round(impressions * r(0.1, 0.3, 2)),
        views95pct: Math.round(impressions * r(0.02, 0.1, 2)),
        completionRate: r(8, 40),
        mediaEngagementRate: r(1, 8, 2),
      };
    case "x:image":
      return { linkClicks: r(20, 500), retweets: r(5, 300), quotes: r(0, 60) };
    case "x:thread":
      return {
        tweetBreakdown: Array.from({ length: 5 }, (_, i) => ({
          index: i + 1,
          views: Math.round(impressions * (1 - i * 0.15) * r(0.08, 0.2, 3)),
        })),
        dropOffRate: r(20, 60),
        profileClicks: r(10, 400),
        follows: r(2, 120),
      };
    case "facebook:video":
      return {
        views3s: Math.round(impressions * r(0.3, 0.6, 2)),
        views10s: Math.round(impressions * r(0.15, 0.4, 2)),
        thruPlays: Math.round(impressions * r(0.05, 0.2, 2)),
        avgWatchTimeSeconds: r(4, 20),
        shares: r(30, 700),
        clicks: r(20, 400),
      };
    case "facebook:image":
      return { reactions: r(100, 5000), comments: r(20, 800), shares: r(10, 500), clicks: r(20, 500) };
    case "facebook:carousel":
      return { clicksPerImage: r(5, 40), shares: r(10, 300) };
    case "youtube:long_form":
      return {
        ctr: r(2, 10, 2),
        avgViewDurationSeconds: r(60, 400),
        avgPercentageViewed: r(25, 60),
        retentionCurve: retentionCurve(rand),
        trafficSource: pickTraffic(rand),
      };
    case "youtube:shorts":
      return {
        avgViewDurationSeconds: r(10, 40),
        completionRate: r(20, 60),
        swipeAwayRate: r(20, 55),
        likes: r(100, 5000),
        comments: r(10, 400),
        shares: r(10, 300),
        subscribes: r(5, 200),
      };
    case "youtube:community_post":
      return { impressions, likes: r(50, 2000), comments: r(5, 300), votes: r(0, 500) };
    default:
      return { note: "No format-specific metrics" };
  }
}

function pickTraffic(rand: () => number): string {
  const options = ["For You", "Following", "Search", "Profile", "Suggested"];
  return options[Math.floor(rand() * options.length)];
}
