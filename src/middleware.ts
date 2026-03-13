import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC_PATHS = ["/", "/auth/signin", "/auth/signup", "/auth/error", "/auth/verify-otp"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths, Next.js internals, and API-key-authenticated routes
  if (
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "?")) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/v1") ||       // Public REST API — uses API key auth
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/public")
  ) {
    return NextResponse.next();
  }

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/signin";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  const role = token.role as string;

  // Tenant routes — only TENANT
  if (pathname.startsWith("/tenant/")) {
    if (role !== "TENANT") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // Landlord/Admin routes — block TENANT
  const landlordRoutes = ["/dashboard", "/properties", "/tenants", "/payments", "/tickets", "/announcements", "/analytics", "/documents", "/settings"];
  if (landlordRoutes.some((r) => pathname === r || pathname.startsWith(r + "/"))) {
    if (role === "TENANT") {
      return NextResponse.redirect(new URL("/tenant/dashboard", request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
