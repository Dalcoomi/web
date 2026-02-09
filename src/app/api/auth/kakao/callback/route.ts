// app/api/auth/kakao/callback/route.ts
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  // URL에서 코드 파라미터 추출
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  // 코드가 없으면 에러 반환
  if (!code) {
    const errorMessage = "인증 코드가 없습니다.";
    return Response.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/?error=${encodeURIComponent(
        errorMessage
      )}`,
      302
    );
  }

  try {
    // 환경 변수에서 API 키 불러오기
    const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY;
    const KAKAO_REDIRECT_URI = process.env.KAKAO_REDIRECT_URI;

    if (!KAKAO_REST_API_KEY || !KAKAO_REDIRECT_URI) {
      throw new Error("API 키 or 리다이렉트 URI가 설정되지 않았습니다.");
    }

    // 1. 받은 code로 카카오 토큰 요청
    const tokenResponse = await fetch("https://kauth.kakao.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: KAKAO_REST_API_KEY,
        redirect_uri: KAKAO_REDIRECT_URI,
        code: code,
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) throw new Error("토큰 요청 실패");

    // 2. 토큰으로 사용자 정보 요청
    const userResponse = await fetch("https://kapi.kakao.com/v2/user/me", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
      },
    });

    const userData = await userResponse.json();
    if (!userResponse.ok) throw new Error("사용자 정보 요청 실패");

    // 사용자 데이터 정제
    const userInfo = {
      kakaoId: userData.id,
      email: userData.kakao_account?.email,
      nickname: userData.properties?.nickname,
      profileImage: userData.properties?.profile_image,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
    };

    // 3. 리다이렉트 응답
    const userInfoEncoded = encodeURIComponent(JSON.stringify(userInfo));

    // 프로필 연동인 경우 프로필 페이지로 리다이렉트
    const redirectPath =
      state === "profile_integration" ? "/profile/update" : "/";

    return Response.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}${redirectPath}?kakao_login=success&user_data=${userInfoEncoded}`,
      302
    );
  } catch {
    const errorMessage = "로그인 처리 중 오류가 발생했습니다.";
    return Response.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/?error=${encodeURIComponent(
        errorMessage
      )}`,
      302
    );
  }
}
