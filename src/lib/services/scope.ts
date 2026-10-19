import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/auth/session";

/** Connection ids the user may read. `null` = all (admin). */
export async function accessibleConnectionIds(user: SessionUser): Promise<string[] | null> {
  if (user.role === "admin") return null;
  const links = await prisma.connectionOwner.findMany({
    where: { userId: user.id },
    select: { connectionId: true },
  });
  return links.map((l) => l.connectionId);
}

export interface FormatPerformance {
  format: string;
  avgEr: number;
}

/** Average Engagement Rate per format across the user's accessible metrics. */
export async function getUserFormatPerformance(
  user: SessionUser,
  windowDays = 90,
): Promise<FormatPerformance[]> {
  const connIds = await accessibleConnectionIds(user);
  const since = new Date(Date.now() - windowDays * 86400000);
  const metrics = await prisma.contentMetric.findMany({
    where: {
      ...(connIds === null ? {} : { connectionId: { in: connIds } }),
      publishedAt: { gte: since },
    },
    select: { format: true, engagementRate: true },
  });
  const bucket = new Map<string, { sum: number; n: number }>();
  for (const m of metrics) {
    const b = bucket.get(m.format) ?? { sum: 0, n: 0 };
    b.sum += m.engagementRate;
    b.n += 1;
    bucket.set(m.format, b);
  }
  return [...bucket.entries()]
    .map(([format, { sum, n }]) => ({ format, avgEr: sum / n }))
    .sort((a, b) => b.avgEr - a.avgEr);
}
