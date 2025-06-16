// app/api/auth/naver/callback/route.ts
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  // URL에서 파라미터 추출
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // User-Agent로 요청이 어디서 온 것인지 확인
  const userAgent = request.headers.get("user-agent") || "";
  const isKakaoTalkBrowser = /KAKAOTALK/i.test(userAgent);

  // 에러가 있거나 코드가 없으면 에러 반환
  if (error || !code || !state) {
    const errorMessage =
      error === "access_denied"
        ? "사용자가 로그인을 취소했습니다."
        : "인증 코드가 없습니다.";

    if (isKakaoTalkBrowser) {
      // 리다이렉트 방식
      return Response.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/login?error=${encodeURIComponent(
          errorMessage
        )}`,
        302
      );
    } else {
      // 팝업 방식
      const cancelled = error === "access_denied";
      return new Response(
        `
        <html>
          <head>
            <title>로그인 실패</title>
            <script>
              window.opener.postMessage({ 
                type: 'naverLogin', 
                success: false, 
                error: '${errorMessage}',
                cancelled: ${cancelled}
              }, window.opener.location.origin);
              window.close();
            </script>
          </head>
          <body>
            <p>로그인 실패</p>
          </body>
        </html>
        `,
        {
          status: 400,
          headers: {
            "Content-Type": "text/html",
          },
        }
      );
    }
  }

  try {
    // 환경 변수에서 API 키 불러오기
    const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID;
    const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;

    if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
      throw new Error("API 키가 설정되지 않았습니다.");
    }

    // 1. 받은 code로 네이버 토큰 요청
    const tokenResponse = await fetch("https://nid.naver.com/oauth2.0/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: NAVER_CLIENT_ID,
        client_secret: NAVER_CLIENT_SECRET,
        code: code,
        state: state,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      throw new Error("토큰 요청 실패");
    }

    // 2. 토큰으로 사용자 정보 요청
    const userResponse = await fetch("https://openapi.naver.com/v1/nid/me", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const userData = await userResponse.json();

    if (!userResponse.ok) {
      throw new Error("사용자 정보 요청 실패");
    }

    // 사용자 데이터 정제
    const userInfo = {
      naverId: userData.response.id,
      email: userData.response.email,
      nickname: userData.response.nickname,
      profileImage: userData.response.profile_image,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
    };

    // 3. 브라우저 타입에 따라 다른 응답 방식 사용
    if (isKakaoTalkBrowser) {
      // 리다이렉트 방식
      const userInfoEncoded = encodeURIComponent(JSON.stringify(userInfo));
      return Response.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}?naver_login=success&user_data=${userInfoEncoded}`,
        302
      );
    } else {
      // 팝업 방식
      return new Response(
        `
        <html>
          <head>
            <title>로그인 성공</title>
            <script>
              window.opener.postMessage(
                { 
                  type: 'naverLogin', 
                  success: true, 
                  userData: ${JSON.stringify(userInfo)} 
                }, 
                window.opener.location.origin
              );
              window.close();
            </script>
          </head>
          <body>
            <p>로그인 성공! 창을 닫아주세요.</p>
          </body>
        </html>
        `,
        {
          status: 200,
          headers: {
            "Content-Type": "text/html",
          },
        }
      );
    }
  } catch (error) {
    const errorMessage = "로그인 처리 중 오류가 발생했습니다.";

    if (isKakaoTalkBrowser) {
      // 리다이렉트 방식
      return Response.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/login?error=${encodeURIComponent(
          errorMessage
        )}`,
        302
      );
    } else {
      // 팝업 방식
      return new Response(
        `
        <html>
          <head>
            <title>로그인 실패</title>
            <script>
              window.opener.postMessage(
                { 
                  type: 'naverLogin', 
                  success: false, 
                  error: '${errorMessage}' 
                }, 
                window.opener.location.origin
              );
              window.close();
            </script>
          </head>
          <body>
            <p>로그인 실패</p>
          </body>
        </html>
        `,
        {
          status: 500,
          headers: {
            "Content-Type": "text/html",
          },
        }
      );
    }
  }
}
