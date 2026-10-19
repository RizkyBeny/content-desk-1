import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "acp_session";
const PROTECTED = ["/insight", "/proyek", "/studio", "/desain", "/aset", "/pengaturan"];

/** Development-only: AUTH_DISABLED="true" melewati login sepenuhnya. */
const authDisabled = process.env.AUTH_DISABLED === "true";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSession = Boolean(req.cookies.get(SESSION_COOKIE)?.value);

  if (authDisabled) {
    if (pathname === "/login") {
      const url = req.nextUrl.clone();
      url.pathname = "/insight";
      url.search = "";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  const isProtected = PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (isProtected && !hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (pathname === "/login" && hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/insight";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/insight/:path*", "/proyek/:path*", "/studio/:path*", "/desain/:path*", "/aset/:path*", "/pengaturan/:path*", "/login"],
};
