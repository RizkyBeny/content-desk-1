import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { connectSocial } from "@/lib/services/connections";
import type { ConnectionType } from "@/types";

const TYPES: ConnectionType[] = ["instagram", "tiktok", "x", "facebook", "youtube"];

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const url = new URL(req.url);
  const { id: type } = await ctx.params;
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.redirect(new URL("/login", url.origin));
  }
  if (!TYPES.includes(type as ConnectionType)) {
    return NextResponse.redirect(new URL("/pengaturan/koneksi?error=tipe", url.origin));
  }
  const displayName = url.searchParams.get("displayName") ?? `${type} utama`;
  try {
    await connectSocial(user, type as ConnectionType, displayName);
    return NextResponse.redirect(new URL("/pengaturan/koneksi?connected=1", url.origin));
  } catch (err) {
    const message = err instanceof Error ? err.message : "gagal";
    return NextResponse.redirect(
      new URL(`/pengaturan/koneksi?error=${encodeURIComponent(message)}`, url.origin),
    );
  }
}
