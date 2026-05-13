import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Routes not migrated to Next SSR redirect to the legacy Vite app.
 * LEGACY_VITE_ORIGIN env variable must be set in production if legacy routes are needed.
 */
export function middleware(request: NextRequest) {
  const legacy = process.env.LEGACY_VITE_ORIGIN ?? "";
  const { pathname } = request.nextUrl;

  const legacyExact = ["/cart", "/login", "/register"];
  if (legacyExact.includes(pathname)) {
    return NextResponse.redirect(new URL(pathname + request.nextUrl.search, legacy));
  }

  if (pathname.startsWith("/orders") || pathname.startsWith("/admin")) {
    return NextResponse.redirect(new URL(pathname + request.nextUrl.search, legacy));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/cart",
    "/login",
    "/register",
    "/orders",
    "/orders/:path*",
    "/admin",
    "/admin/:path*",
  ],
};
