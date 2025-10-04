// utils/refreshTokenManager.ts
import { getRefreshToken, saveTokens, clearTokens } from "./tokenManager";

// 토큰 리프레시 중복 방지를 위한 전역 상태
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

/**
 * 전역 토큰 리프레시 함수 - 중복 호출 방지
 */
export const refreshAccessToken = async (): Promise<boolean> => {
  // 이미 리프레시 중이면 기존 Promise 반환
  if (refreshPromise) {
    console.log("[refreshAccessToken] 이미 리프레시 중");
    return refreshPromise;
  }

  const refreshToken = getRefreshToken();
  console.log("[refreshAccessToken] 리프레시 토큰:", refreshToken ? "있음" : "없음");
  if (!refreshToken) {
    console.log("[refreshAccessToken] 리프레시 토큰 없음 - 실패");
    return false;
  }

  // 새로운 리프레시 Promise 생성
  refreshPromise = (async () => {
    try {
      isRefreshing = true;

      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${API_URL}/api/auth/reissue`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Refresh-Token": refreshToken,
        },
      });

      console.log("[refreshAccessToken] API 응답 상태:", response.status);
      if (!response.ok) {
        // 401 Unauthorized: 리프레시 토큰 만료/무효 → 토큰 삭제
        if (response.status === 401) {
          console.log("[refreshAccessToken] 401 에러 - 리프레시 토큰 만료/무효");
          clearTokens();
        }
        return false;
      }

      const data = await response.json();
      console.log("[refreshAccessToken] 응답 데이터:", data.accessToken ? "accessToken 있음" : "accessToken 없음");
      if (!data.accessToken) {
        console.log("[refreshAccessToken] accessToken 없음 - 실패");
        clearTokens();
        return false;
      }

      const newRefreshToken = data.refreshToken || refreshToken;
      saveTokens(data.accessToken, newRefreshToken);
      console.log("[refreshAccessToken] 토큰 재발급 성공");

      // 토큰 갱신 성공 이벤트 발생
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("token-refreshed"));
      }

      return true;
    } catch (error) {
      // 네트워크 에러 등 예외 상황 → 토큰 유지 (일시적 에러 가능성)
      console.log("[refreshAccessToken] 예외 발생:", error);
      return false;
    } finally {
      isRefreshing = false;
      // Promise 완료 후 참조 제거
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

export const isTokenRefreshing = () => isRefreshing;
