// app/api/auth/kakao/callback/route.ts
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  // URL에서 코드 파라미터 추출
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // 🔥 state 파라미터 추가

  // 다양한 방법으로 PWA/모바일 감지
  const userAgent = request.headers.get("user-agent") || "";
  const referer = request.headers.get("referer") || "";
  const secFetchSite = request.headers.get("sec-fetch-site");

  const isKakaoTalkBrowser = /KAKAOTALK/i.test(userAgent);
  const isMobileApp = /Mobile|Android|iPhone|iPad/i.test(userAgent);
  const isEdgeBrowser = /Edg\//.test(userAgent);
  const isPWARequest =
    secFetchSite === "none" ||
    referer.includes("android-app://") ||
    /wv/.test(userAgent);

  // 엣지 웹은 팝업으로 처리 (PWA가 아닌 경우)
  const isEdgeWeb = isEdgeBrowser && !isPWARequest && referer.includes("http");

  // 리다이렉트를 사용해야 하는 경우들
  const shouldUseRedirect =
    (isKakaoTalkBrowser ||
      isPWARequest ||
      (isMobileApp && !referer.includes("http"))) &&
    !isEdgeWeb;

  // 코드가 없으면 에러 반환
  if (!code) {
    const errorMessage = "인증 코드가 없습니다.";

    if (shouldUseRedirect) {
      return Response.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/?error=${encodeURIComponent(
          errorMessage
        )}`,
        302
      );
    } else {
      // PC 웹 팝업용
      return new Response(
        `
        <html>
          <head>
            <title>로그인 실패</title>
            <script>
              if (window.opener) {
                window.opener.postMessage({ 
                  type: 'kakaoLogin', 
                  success: false, 
                  error: '${errorMessage}' 
                }, window.opener.location.origin);
                window.close();
              } else {
                // 팝업이 아닌 경우 메인으로 리다이렉트
                window.location.href = '${
                  process.env.NEXT_PUBLIC_BASE_URL
                }/?error=${encodeURIComponent(errorMessage)}';
              }
            </script>
          </head>
          <body>
            <p>로그인 실패</p>
          </body>
        </html>
        `,
        {
          status: 400,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        }
      );
    }
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

    // 3. 브라우저 타입에 따라 다른 응답 방식 사용
    if (shouldUseRedirect) {
      // 모바일/PWA: 리다이렉트 방식
      const userInfoEncoded = encodeURIComponent(JSON.stringify(userInfo));

      // 🔥 프로필 연동인 경우 프로필 페이지로 리다이렉트
      const redirectPath =
        state === "profile_integration" ? "/profile/update" : "/";

      return Response.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}${redirectPath}?kakao_login=success&user_data=${userInfoEncoded}`,
        302
      );
    } else {
      // PC 웹: 팝업 방식
      return new Response(
        `
        <html>
          <head>
            <title>로그인 성공</title>
            <script>
              if (window.opener) {
                window.opener.postMessage(
                  { 
                    type: 'kakaoLogin', 
                    success: true, 
                    userData: ${JSON.stringify(userInfo)} 
                  }, 
                  window.opener.location.origin
                );
                window.close();
              } else {
                // 팝업이 아닌 경우 적절한 페이지로 리다이렉트
                const userInfoEncoded = encodeURIComponent('${JSON.stringify(
                  userInfo
                )}');
                const redirectPath = '${
                  state === "profile_integration" ? "/profile/update" : "/"
                }';
                window.location.href = '${
                  process.env.NEXT_PUBLIC_BASE_URL
                }' + redirectPath + '?kakao_login=success&user_data=' + userInfoEncoded;
              }
            </script>
          </head>
          <body>
            <p>로그인 성공! 창을 닫아주세요.</p>
          </body>
        </html>
        `,
        {
          status: 200,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        }
      );
    }
  } catch {
    const errorMessage = "로그인 처리 중 오류가 발생했습니다.";

    if (shouldUseRedirect) {
      return Response.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/?error=${encodeURIComponent(
          errorMessage
        )}`,
        302
      );
    } else {
      return new Response(
        `
        <html>
          <head>
            <title>로그인 실패</title>
            <script>
              if (window.opener) {
                window.opener.postMessage(
                  { 
                    type: 'kakaoLogin', 
                    success: false, 
                    error: '${errorMessage}' 
                  }, 
                  window.opener.location.origin
                );
                window.close();
              } else {
                window.location.href = '${
                  process.env.NEXT_PUBLIC_BASE_URL
                }/?error=${encodeURIComponent(errorMessage)}';
              }
            </script>
          </head>
          <body>
            <p>로그인 실패</p>
          </body>
        </html>
        `,
        {
          status: 500,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        }
      );
    }
  }
}
