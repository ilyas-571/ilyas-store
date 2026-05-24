import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Routes not migrated to Next SSR redirect to the legacy Vite app.
 * LEGACY_VITE_ORIGIN env variable must be set in production if legacy routes are needed.
 */
export function middleware(request: NextRequest) {
  const legacy = process.env.LEGACY_VITE_ORIGIN ?? "";
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get("host") || "";

  // 1. Extract store slug from subdomain (e.g., store1.ilyas-store.com)
  const domain = process.env.NEXT_PUBLIC_SITE_URL?.replace("https://", "").replace(/\/$/, "") || "localhost";
  const subdomain = hostname.replace(`.${domain}`, "").split(":")[0];

  // If we are on the main domain or localhost, we can treat it as a global landing page
  // or a default store. For now, we'll pass the subdomain as a header.
  const response = NextResponse.next();

  if (subdomain && subdomain !== "www" && subdomain !== domain) {
    request.headers.set("x-store-slug", subdomain);
  }

  const legacyExact = ["/cart", "/login", "/register"];
  if (legacyExact.includes(pathname)) {
    return NextResponse.redirect(new URL(pathname + request.nextUrl.search, legacy));
  }

  if (pathname.startsWith("/orders") || pathname.startsWith("/admin")) {
    return NextResponse.redirect(new URL(pathname + request.nextUrl.search, legacy));
  }

  return response;
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
