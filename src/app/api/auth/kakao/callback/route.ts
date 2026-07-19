// app/api/auth/kakao/callback/route.ts
import { NextRequest } from "next/server";

function redirectWithReplace(url: string) {
  const safeUrl = JSON.stringify(url);
  return new Response(
    `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <style>html,body{margin:0;height:100%;background:#ffffff;}</style>
    <script>window.location.replace(${safeUrl});</script>
  </head>
  <body></body>
</html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

function buildSameOriginUrl(request: NextRequest, pathWithQuery: string) {
  return new URL(pathWithQuery, request.nextUrl.origin).toString();
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code) {
    const errorMessage = "인증 코드가 없습니다.";
    const loginUrl = buildSameOriginUrl(
      request,
      `/?error=${encodeURIComponent(errorMessage)}`
    );
    return redirectWithReplace(loginUrl);
  }

  try {
    const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY;
    const KAKAO_REDIRECT_URI = process.env.KAKAO_REDIRECT_URI;

    if (!KAKAO_REST_API_KEY || !KAKAO_REDIRECT_URI) {
      throw new Error("API 키 또는 리다이렉트 URI가 설정되지 않았습니다.");
    }

    const tokenResponse = await fetch("https://kauth.kakao.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: KAKAO_REST_API_KEY,
        redirect_uri: KAKAO_REDIRECT_URI,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) throw new Error("토큰 요청 실패");

    const userResponse = await fetch("https://kapi.kakao.com/v2/user/me", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
      },
    });

    const userData = await userResponse.json();
    if (!userResponse.ok) throw new Error("사용자 정보 요청 실패");

    const userInfo = {
      kakaoId: userData.id,
      email: userData.kakao_account?.email,
      nickname: userData.properties?.nickname,
      profileImage: userData.properties?.profile_image,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
    };

    const userInfoEncoded = encodeURIComponent(JSON.stringify(userInfo));
    const redirectPath =
      state === "profile_integration" ? "/profile/update" : "/";
    const successUrl = buildSameOriginUrl(
      request,
      `${redirectPath}?kakao_login=success&user_data=${userInfoEncoded}`
    );

    return redirectWithReplace(successUrl);
  } catch {
    const errorMessage = "로그인 처리 중 오류가 발생했습니다.";
    const loginUrl = buildSameOriginUrl(
      request,
      `/?error=${encodeURIComponent(errorMessage)}`
    );
    return redirectWithReplace(loginUrl);
  }
}
