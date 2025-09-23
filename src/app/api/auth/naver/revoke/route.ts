// app/api/auth/naver/revoke/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { accessToken, refreshToken } = await request.json();

    if (!accessToken && !refreshToken) {
      return NextResponse.json({
        success: true,
        message: "토큰이 없어서 네이버 연결 해제를 건너뜀"
      });
    }

    const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID;
    const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;

    if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
      return NextResponse.json(
        { error: "네이버 API 설정이 없습니다." },
        { status: 500 }
      );
    }

    let finalAccessToken = accessToken;

    // 🔥 1단계: 리프레시 토큰이 있으면 새로운 액세스 토큰 발급
    if (refreshToken) {
      try {

        const refreshResponse = await fetch("https://nid.naver.com/oauth2.0/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            grant_type: "refresh_token",
            client_id: NAVER_CLIENT_ID,
            client_secret: NAVER_CLIENT_SECRET,
            refresh_token: refreshToken,
          }),
        });

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          if (refreshData.access_token) {
            finalAccessToken = refreshData.access_token;
          }
        } else {
        }
      } catch (refreshError) {
      }
    }

    // 🔥 2단계: 토큰 해제 요청

    const revokeResponse = await fetch("https://nid.naver.com/oauth2.0/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "delete",
        client_id: NAVER_CLIENT_ID,
        client_secret: NAVER_CLIENT_SECRET,
        access_token: finalAccessToken,
      }),
    });

    const revokeData = await revokeResponse.json();

    if (revokeResponse.ok) {
      return NextResponse.json({
        success: true,
        message: "네이버 토큰 해제 성공",
        data: revokeData
      });
    } else {
      return NextResponse.json(
        {
          error: "네이버 토큰 해제 실패",
          details: revokeData
        },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error("네이버 토큰 해제 처리 중 에러:", error);
    return NextResponse.json(
      { error: "서버 에러가 발생했습니다." },
      { status: 500 }
    );
  }
}