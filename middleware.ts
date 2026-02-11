import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE_NAMES = ["authjs.session-token", "__Secure-authjs.session-token"];

function hasSessionCookie(cookies: NextRequest["cookies"]): boolean {
  return SESSION_COOKIE_NAMES.some((name) => cookies.has(name));
}

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const hasSession = hasSessionCookie(req.cookies);
  if (path.startsWith("/admin") || path.startsWith("/vip") || path.startsWith("/profile") || path.startsWith("/phim/")) {
    if (!hasSession) {
      const url = new URL("/login", req.nextUrl.origin);
      url.searchParams.set("callbackUrl", path);
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/vip/:path*", "/profile/:path*", "/phim/:path*"],
};
