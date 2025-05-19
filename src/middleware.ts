// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const accessToken = request.cookies.get("accessToken")?.value;
  const path = request.nextUrl.pathname;

  // 정적 자원 제외
  if (path.includes("/_next") || path.includes("/api") || path.includes(".")) {
    return NextResponse.next();
  }

  // 공개 페이지 (인증 불필요)
  const publicPaths = ["/", "/about", "/features", "/privacy", "/terms"];

  // 인증 선택적 페이지 (로그인 상태면 내 거래 페이지로)
  const authOptionalPaths = ["/sign-up"];

  // 인증 필수 페이지
  const protectedPaths = ["/transaction", "/profile", "/settings"];

  const isPublicPath = publicPaths.some((p) => path === p);
  const isAuthOptionalPath = authOptionalPaths.some((p) => path.startsWith(p));
  const isProtectedPath = protectedPaths.some((p) => path.startsWith(p));

  // 보호된 경로에 미인증 접근
  if (isProtectedPath && !accessToken) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // 로그인한 사용자가 회원가입 페이지 접근
  if (isAuthOptionalPath && accessToken) {
    return NextResponse.redirect(new URL("/transaction/my", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
