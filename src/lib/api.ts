import { NextResponse } from "next/server";
import { getSessionUser, type SessionUser } from "@/lib/auth/session";

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status = 400, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(message: string, status = 400, code?: string) {
  return NextResponse.json({ error: message, code }, { status });
}

/** Wrap a route handler with consistent error handling. */
export async function handle(fn: () => Promise<NextResponse>): Promise<NextResponse> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof ApiError) return fail(err.message, err.status, err.code);
    if (err instanceof Error && err.message === "UNAUTHORIZED") return fail("Belum masuk. Silakan login.", 401);
    if (err instanceof Error && err.message === "FORBIDDEN") return fail("Tidak punya akses.", 403);
    console.error("[api] error:", err);
    return fail("Terjadi kesalahan pada server. Coba lagi.", 500);
  }
}

export async function currentUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new ApiError("Belum masuk. Silakan login.", 401);
  return user;
}

export async function currentAdmin(): Promise<SessionUser> {
  const user = await currentUser();
  if (user.role !== "admin") throw new ApiError("Khusus admin.", 403);
  return user;
}
