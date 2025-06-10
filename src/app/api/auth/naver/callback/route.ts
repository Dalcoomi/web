// app/api/auth/naver/callback/route.ts
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  // URL에서 파라미터 추출
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // 사용자가 취소한 경우
  if (error === "access_denied" && errorDescription === "Canceled By User") {
    return new Response(
      `
      <html>
        <head>
          <title>로그인 취소</title>
          <script>
            window.opener.postMessage(
              { 
                type: 'naverLogin', 
                success: false, 
                error: '사용자가 로그인을 취소했습니다.',
                cancelled: true
              }, 
              window.opener.location.origin
            );
            window.close();
          </script>
        </head>
        <body>
          <p>로그인이 취소되었습니다.</p>
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

  // 다른 에러가 있는 경우
  if (error) {
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
                error: '${
                  errorDescription || "로그인 중 오류가 발생했습니다."
                }' 
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
        status: 400,
        headers: {
          "Content-Type": "text/html",
        },
      }
    );
  }

  // 코드나 state가 없으면 에러 반환
  if (!code || !state) {
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
                error: '인증 코드 또는 state가 없습니다.' 
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
        status: 400,
        headers: {
          "Content-Type": "text/html",
        },
      }
    );
  }

  try {
    // 환경 변수에서 API 키 불러오기
    const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID;
    const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;
    const NAVER_REDIRECT_URI = process.env.NAVER_REDIRECT_URI;

    // 환경 변수가 없는 경우 로그 남기기
    if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET || !NAVER_REDIRECT_URI) {
      console.error(
        "NAVER_CLIENT_ID, NAVER_CLIENT_SECRET 혹은 NAVER_REDIRECT_URI 환경 변수가 설정되지 않았습니다."
      );
      throw new Error("API 키 or 리다이렉트 URI가 설정되지 않았습니다.");
    }

    console.log("네이버 인증 코드 받음:", code.substring(0, 10) + "...");

    // 1. 받은 code로 네이버 토큰 요청
    const tokenUrl = "https://nid.naver.com/oauth2.0/token";
    const params = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: NAVER_CLIENT_ID,
      client_secret: NAVER_CLIENT_SECRET,
      code: code,
      state: state,
    });

    const tokenResponse = await fetch(`${tokenUrl}?${params}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || tokenData.error) {
      console.error("토큰 요청 실패:", tokenData);
      throw new Error(tokenData.error_description || "토큰 요청 실패");
    }

    // 2. 토큰으로 사용자 정보 요청
    const userResponse = await fetch("https://openapi.naver.com/v1/nid/me", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
      },
    });

    const userData = await userResponse.json();

    if (!userResponse.ok || userData.resultcode !== "00") {
      console.error("사용자 정보 요청 실패:", userData);
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

    // 3. HTML 응답으로 부모 창에 메시지 전송 후 창 닫기
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
  } catch (error) {
    console.error("네이버 로그인 처리 오류:", error);

    // 오류 발생 시 부모 창에 메시지 전송 후 창 닫기
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
