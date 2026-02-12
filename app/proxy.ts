import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE_NAMES = ["authjs.session-token", "__Secure-authjs.session-token", "__Host-authjs.session-token"];

function hasSessionCookie(cookies: NextRequest["cookies"]): boolean {
  const names = Array.from(cookies.getAll().map((c) => c.name));
  return names.some((name) =>
    SESSION_COOKIE_NAMES.some((base) => name === base || name.startsWith(base + "."))
  );
}

export function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const hasSession = hasSessionCookie(req.cookies);
  if (path.startsWith("/admin") || path.startsWith("/vip") || path.startsWith("/profile")) {
    if (!hasSession) {
      const url = new URL("/login", req.nextUrl.origin);
      url.searchParams.set("callbackUrl", path);
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/vip/:path*", "/profile/:path*"],
};
