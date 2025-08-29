// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const accessToken = request.cookies.get("accessToken")?.value;
  const refreshToken = request.cookies.get("refreshToken")?.value;
  const path = request.nextUrl.pathname;

  // 정적 자원 제외
  if (
    path.includes("/_next") ||
    path.includes("/api") ||
    path.match(/\.(ico|png|jpg|jpeg|gif|svg|css|js|woff|woff2|ttf|eot)$/)
  ) {
    return NextResponse.next();
  }

  const publicPaths = ["/"];
  const authOptionalPaths = ["/sign-up"];
  const protectedPaths = ["/transaction", "/group", "/profile"];

  const isPublicPath = publicPaths.some((p) => path === p);
  const isAuthOptionalPath = authOptionalPaths.some((p) => path.startsWith(p));
  const isProtectedPath = protectedPaths.some((p) => path.startsWith(p));

  // 🔥 보호된 경로 접근 시 리프레시 토큰만 확인
  if (isProtectedPath) {
    if (!refreshToken) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // 🔥 회원가입 페이지: 액세스 토큰이 있을 때만 리다이렉트
  if (isAuthOptionalPath && accessToken) {
    return NextResponse.redirect(new URL("/transaction/my", request.url));
  }

  // 🔥 메인 페이지: 리다이렉트 하지 않음 (무한 루프 방지)
  if (isPublicPath) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
