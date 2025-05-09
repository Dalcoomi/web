// middleware.ts (프로젝트 루트에 위치)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // 클라이언트 사이드 쿠키에서 토큰 확인
  const accessToken = request.cookies.get("accessToken")?.value;

  // 로그인이 필요한 경로 패턴
  const authRequiredPaths = ["/main", "/profile"];

  // 회원가입 일반 페이지 패턴 (로그인 상태에서 접근 불가)
  const signUpPaths = ["/sign-up/step1", "/sign-up/step2"];

  // 현재 경로
  const path = request.nextUrl.pathname;

  // 로그인 필요한 페이지에 미로그인 상태로 접근 시
  if (authRequiredPaths.some((p) => path.startsWith(p)) && !accessToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 일반 회원가입 페이지에 로그인 상태로 접근 시 (성공 페이지 제외)
  if (signUpPaths.some((p) => path === p) && accessToken) {
    return NextResponse.redirect(new URL("/main", request.url));
  }

  return NextResponse.next();
}

// 미들웨어를 적용할 경로 설정
export const config = {
  matcher: ["/main/:path*", "/profile/:path*", "/sign-up/:path*"],
};
