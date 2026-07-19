// app/api/auth/kakao/revoke/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { accessToken, refreshToken } = await request.json();

    if (!accessToken && !refreshToken) {
      return NextResponse.json({
        success: true,
        message: "토큰이 없어서 카카오 연결 해제를 건너뜀",
      });
    }

    const KAKAO_CLIENT_ID = process.env.KAKAO_REST_API_KEY;

    if (!KAKAO_CLIENT_ID) {
      return NextResponse.json(
        { error: "카카오 API 설정이 없습니다." },
        { status: 500 }
      );
    }

    let finalAccessToken = accessToken;

    // 🔥 1단계: 리프레시 토큰이 있으면 새로운 액세스 토큰 발급
    if (refreshToken) {
      try {
        const refreshResponse = await fetch(
          "https://kauth.kakao.com/oauth/token",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
            },
            body: new URLSearchParams({
              grant_type: "refresh_token",
              client_id: KAKAO_CLIENT_ID,
              refresh_token: refreshToken,
            }),
          }
        );

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          if (refreshData.access_token) {
            finalAccessToken = refreshData.access_token;
          }
        } else {
        }
      } catch {}
    }

    // 🔥 2단계: 토큰 해제 요청

    const revokeResponse = await fetch(
      "https://kapi.kakao.com/v1/user/unlink",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${finalAccessToken}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    if (revokeResponse.ok) {
      const revokeData = await revokeResponse.json();

      return NextResponse.json({
        success: true,
        message: "카카오 토큰 해제 성공",
        data: revokeData,
      });
    } else {
      const errorData = await revokeResponse.json();

      return NextResponse.json(
        {
          error: "카카오 토큰 해제 실패",
          details: errorData,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("카카오 토큰 해제 처리 중 에러:", error);
    return NextResponse.json(
      { error: "서버 에러가 발생했습니다." },
      { status: 500 }
    );
  }
}
