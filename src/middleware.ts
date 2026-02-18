import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Check for session token cookie (set by NextAuth)
  const token = request.cookies.get("authjs.session-token") || request.cookies.get("__Secure-authjs.session-token");

  const { pathname } = request.nextUrl;

  // Admin routes require auth (role check happens in the page/API)
  if (pathname.startsWith("/admin/users")) {
    if (!token) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/users/:path*"],
};
