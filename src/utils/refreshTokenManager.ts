// utils/refreshTokenManager.ts
import { getRefreshToken, saveTokens, clearTokens } from "./tokenManager";
import { getDeviceType } from "./deviceDetector";

// 토큰 리프레시 중복 방지를 위한 전역 상태
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

/**
 * 전역 토큰 리프레시 함수 - 중복 호출 방지
 * @returns 새로운 액세스 토큰 또는 null
 */
export const refreshAccessToken = async (): Promise<string | null> => {
  // 이미 리프레시 중이면 기존 Promise 반환
  if (refreshPromise) {
    return refreshPromise;
  }

  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return null;
  }

  // 새로운 리프레시 Promise 생성
  refreshPromise = (async () => {
    try {
      isRefreshing = true;

      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const deviceType = getDeviceType();

      const response = await fetch(`${API_URL}/api/auth/reissue`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Refresh-Token": refreshToken,
          "Device-Type": deviceType,
        },
      });

      if (!response.ok) {
        // 401: 리프레시 토큰 만료/무효 → 토큰 삭제
        // 4xx: 클라이언트 에러 → 토큰 삭제
        // 5xx: 서버 에러 → 토큰 유지 (일시적 에러 가능성)
        if (response.status === 401 || (response.status >= 400 && response.status < 500)) {
          clearTokens();
        }
        return null;
      }

      const data = await response.json();
      if (!data.accessToken) {
        // 응답은 성공했지만 토큰이 없음 → 백엔드 오류, 토큰 삭제
        clearTokens();
        return null;
      }

      const newRefreshToken = data.refreshToken || refreshToken;
      saveTokens(data.accessToken, newRefreshToken);

      // 토큰 갱신 성공 이벤트 발생
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("token-refreshed"));
      }

      return data.accessToken;
    } catch (error) {
      // 네트워크 에러 등 예외 상황 → 토큰 유지 (일시적 에러 가능성)
      return null;
    } finally {
      isRefreshing = false;
      // Promise 완료 후 참조 제거
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

export const isTokenRefreshing = () => isRefreshing;
