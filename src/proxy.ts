import { NextResponse, type NextRequest } from "next/server";
import { authDisabled } from "@/lib/data-mode";
import {
  BASIC_AUTH_CHALLENGE,
  isBasicAuthExempt,
  verifyBasicAuth,
} from "@/lib/auth/basic";

const SESSION_COOKIE = "acp_session";

const PUBLIC_PREFIXES = [
  "/_next",
  "/favicon.ico",
  "/icon.png",
  "/apple-icon.png",
  "/robots.txt",
  "/brand",
  "/seed",
  "/post-media",
  "/figma_overview",
  "/login",
  "/api/auth/login",
  "/api/auth/logout",
  "/invite",
  "/api/auth/invite",
];

function isPublicRoute(pathname: string): boolean {
  if (/\.(png|jpe?g|gif|webp|svg|ico|mp4|woff2?)$/i.test(pathname)) {
    return true;
  }
  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

/**
 * HTTP Basic Auth bawaan browser jika BASIC_AUTH_USER diset di env.
 */
function enforceBasicAuth(req: NextRequest): NextResponse | null {
  const { pathname } = req.nextUrl;
  if (isBasicAuthExempt(pathname)) return null;

  const result = verifyBasicAuth(req.headers.get("authorization"));
  if (result.ok) return null;

  return new NextResponse("Unauthorized", {
    status: 401,
    headers: {
      "WWW-Authenticate": BASIC_AUTH_CHALLENGE,
      "Cache-Control": "no-store",
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}

/**
 * Next.js Proxy (Middleware): Menjaga gerbang Web Login Gate.
 * Pengunjung wajib memasukkan username & password untuk mengakses aplikasi.
 */
export function proxy(req: NextRequest) {
  // 1. HTTP Basic Auth jika dikonfigurasi di environment
  const basicAuthDenied = enforceBasicAuth(req);
  if (basicAuthDenied) return basicAuthDenied;

  const { pathname } = req.nextUrl;

  // 2. Jika auth dilewati eksplisit via AUTH_DISABLED="true"
  if (authDisabled()) {
    if (pathname === "/login" || pathname === "/") {
      const url = req.nextUrl.clone();
      url.pathname = "/overview";
      url.search = "";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // 3. Web Login Gate Session Check
  const hasSession = Boolean(req.cookies.get(SESSION_COOKIE)?.value);

  // Jika sudah login dan mengakses /login atau root /
  if (hasSession && (pathname === "/login" || pathname === "/")) {
    const nextUrl = req.nextUrl.searchParams.get("next");
    const target = nextUrl && nextUrl.startsWith("/") ? nextUrl : "/overview";
    const url = req.nextUrl.clone();
    url.pathname = target;
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Jika path publik, izinkan lewat
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Jika belum login:
  if (!hasSession) {
    // Untuk API internal, tolak dengan 401
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Untuk halaman web, alihkan ke /login
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

/**
 * Matcher mencakup seluruh rute agar tidak ada celah akses publik.
 */
export const config = {
  matcher: ["/(.*)"],
};
