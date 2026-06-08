import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  const isCustomerRoute =
    pathname.startsWith("/design") || pathname.startsWith("/orders");
  const isAdminRoute = pathname.startsWith("/admin");

  if (isCustomerRoute && !session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isAdminRoute) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (session.user.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/design/:path*", "/orders/:path*", "/admin/:path*"],
};
