import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const accessToken = request.cookies.get("accessToken")?.value;
  const refreshToken = request.cookies.get("refreshToken")?.value;
  const path = request.nextUrl.pathname;

  if (
    path.includes("/_next") ||
    path.includes("/api") ||
    path.match(/\.(ico|png|jpg|jpeg|gif|svg|css|js|woff|woff2|ttf|eot)$/)
  ) {
    return NextResponse.next();
  }

  const publicPaths = ["/"];
  const authOptionalPaths = ["/sign-up"];
  const protectedPaths = ["/profile"];

  const isPublicPath = publicPaths.some((p) => path === p);
  const isAuthOptionalPath = authOptionalPaths.some((p) => path.startsWith(p));
  const isProtectedPath = protectedPaths.some((p) => path.startsWith(p));

  if (isProtectedPath) {
    if (!refreshToken) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (isAuthOptionalPath && accessToken) {
    return NextResponse.redirect(new URL("/transaction/my", request.url));
  }

  if (isPublicPath) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
