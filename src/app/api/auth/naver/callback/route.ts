// app/api/auth/naver/callback/route.ts
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
  const error = searchParams.get("error");

  if (error || !code || !state) {
    const errorMessage =
      error === "access_denied"
        ? "사용자가 로그인을 취소했습니다."
        : "인증 코드가 없습니다.";
    const loginUrl = buildSameOriginUrl(
      request,
      `/?error=${encodeURIComponent(errorMessage)}`
    );

    return redirectWithReplace(loginUrl);
  }

  try {
    const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID;
    const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;

    if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
      throw new Error("API 키가 설정되지 않았습니다.");
    }

    const tokenResponse = await fetch("https://nid.naver.com/oauth2.0/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: NAVER_CLIENT_ID,
        client_secret: NAVER_CLIENT_SECRET,
        code,
        state,
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) throw new Error("토큰 요청 실패");

    const userResponse = await fetch("https://openapi.naver.com/v1/nid/me", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const userData = await userResponse.json();
    if (!userResponse.ok) throw new Error("사용자 정보 요청 실패");

    const userInfo = {
      naverId: userData.response.id,
      email: userData.response.email,
      nickname: userData.response.nickname,
      profileImage: userData.response.profile_image,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
    };

    const userInfoEncoded = encodeURIComponent(JSON.stringify(userInfo));
    const isProfileIntegration = state?.startsWith("profile_integration");
    const redirectPath = isProfileIntegration ? "/profile/update" : "/";
    const successUrl = buildSameOriginUrl(
      request,
      `${redirectPath}?naver_login=success&user_data=${userInfoEncoded}`
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
