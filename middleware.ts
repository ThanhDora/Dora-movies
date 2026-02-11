import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/vip";

export default auth((req) => {
  const path = req.nextUrl.pathname;
  const session = req.auth;
  if (path.startsWith("/admin")) {
    if (!session?.user?.role || !isAdmin(session.user.role)) {
      const url = new URL("/login", req.nextUrl.origin);
      url.searchParams.set("callbackUrl", path);
      return Response.redirect(url);
    }
  }
  if (path.startsWith("/vip") || path.startsWith("/profile")) {
    if (!session) {
      const url = new URL("/login", req.nextUrl.origin);
      url.searchParams.set("callbackUrl", path);
      return Response.redirect(url);
    }
  }
  if (path.startsWith("/phim/")) {
    if (!session) {
      const url = new URL("/login", req.nextUrl.origin);
      url.searchParams.set("callbackUrl", path);
      return Response.redirect(url);
    }
  }
  return undefined;
});

export const config = {
  matcher: ["/admin/:path*", "/vip/:path*", "/profile/:path*", "/phim/:path*"],
};
