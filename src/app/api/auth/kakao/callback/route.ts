// app/api/auth/kakao/callback/route.ts
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  // URL에서 코드 파라미터 추출
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");

  // User-Agent로 요청이 팝업에서 온 것인지 확인
  const userAgent = request.headers.get("user-agent") || "";
  const isKakaoTalkBrowser = /KAKAOTALK/i.test(userAgent);

  // 코드가 없으면 에러 반환
  if (!code) {
    const errorMessage = "인증 코드가 없습니다.";

    if (isKakaoTalkBrowser) {
      // 리다이렉트 방식 - 메인 페이지로 에러와 함께 리다이렉트
      return Response.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/login?error=${encodeURIComponent(
          errorMessage
        )}`,
        302
      );
    } else {
      // 팝업 방식 - 기존 HTML 응답
      return new Response(
        `
        <html>
          <head>
            <title>로그인 실패</title>
            <script>
              window.opener.postMessage({ type: 'kakaoLogin', success: false, error: '${errorMessage}' }, window.opener.location.origin);
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
    const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY;
    const KAKAO_REDIRECT_URI = process.env.KAKAO_REDIRECT_URI;

    // 환경 변수가 없는 경우 로그 남기기
    if (!KAKAO_REST_API_KEY || !KAKAO_REDIRECT_URI) {
      console.error(
        "KAKAO_REST_API_KEY 혹은 KAKAO_REDIRECT_URI 환경 변수가 설정되지 않았습니다."
      );
      throw new Error("API 키 or 리다이렉트 URI가 설정되지 않았습니다.");
    }

    console.log("카카오 인증 코드 받음:", code.substring(0, 10) + "...");

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

    if (!tokenResponse.ok) {
      console.error("토큰 요청 실패:", tokenData);
      throw new Error("토큰 요청 실패");
    }

    // 2. 토큰으로 사용자 정보 요청
    const userResponse = await fetch("https://kapi.kakao.com/v2/user/me", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
      },
    });

    const userData = await userResponse.json();

    if (!userResponse.ok) {
      console.error("사용자 정보 요청 실패:", userData);
      throw new Error("사용자 정보 요청 실패");
    }

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
    if (isKakaoTalkBrowser) {
      // 리다이렉트 방식 - 메인 페이지로 사용자 데이터와 함께 리다이렉트
      const userInfoEncoded = encodeURIComponent(JSON.stringify(userInfo));
      return Response.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/login?kakao_login=success&user_data=${userInfoEncoded}`,
        302
      );
    } else {
      // 팝업 방식 - 기존 HTML 응답
      return new Response(
        `
        <html>
          <head>
            <title>로그인 성공</title>
            <script>
              window.opener.postMessage(
                { 
                  type: 'kakaoLogin', 
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
    console.error("카카오 로그인 처리 오류:", error);

    const errorMessage = "로그인 처리 중 오류가 발생했습니다.";

    // 오류 발생 시 브라우저 타입에 따라 다른 응답
    if (isKakaoTalkBrowser) {
      // 리다이렉트 방식 - 메인 페이지로 에러와 함께 리다이렉트
      return Response.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/login?error=${encodeURIComponent(
          errorMessage
        )}`,
        302
      );
    } else {
      // 팝업 방식 - 기존 HTML 응답
      return new Response(
        `
        <html>
          <head>
            <title>로그인 실패</title>
            <script>
              window.opener.postMessage(
                { 
                  type: 'kakaoLogin', 
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
