// app/api/auth/kakao/callback/route.ts
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  // URL에서 코드 파라미터 추출
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");

  // 코드가 없으면 에러 반환
  if (!code) {
    return new Response(
      `
      <html>
        <head>
          <title>로그인 실패</title>
          <script>
            window.opener.postMessage({ type: 'kakaoLogin', success: false, error: '인증 코드가 없습니다.' }, window.opener.location.origin);
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

  try {
    // 환경 변수에서 API 키 불러오기 (서버 컴포넌트에서는 NEXT_PUBLIC_ 접두사 없이도 접근 가능)
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

    // 3. HTML 응답으로 부모 창에 메시지 전송 후 창 닫기
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
  } catch (error) {
    console.error("카카오 로그인 처리 오류:", error);

    // 오류 발생 시 부모 창에 메시지 전송 후 창 닫기
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
                error: '로그인 처리 중 오류가 발생했습니다.' 
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
