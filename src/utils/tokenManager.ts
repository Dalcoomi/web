// utils/tokenManager.ts
import { setCookie, getCookie, eraseCookie } from "./cookieManager";

// 토큰 저장
export const saveTokens = (accessToken: string, refreshToken?: string) => {
  if (typeof window === "undefined") return; // 서버 사이드에서 실행 방지

  // 쿠키 저장 (미들웨어용)
  setCookie("accessToken", accessToken, 1 / 24); // 1일 유효
  if (refreshToken) {
    setCookie("refreshToken", refreshToken, 7); // 7일 유효
  }
};

// 액세스 토큰 가져오기
export const getAccessToken = () => {
  if (typeof window === "undefined") return null;

  return getCookie("accessToken");
};

// 리프레시 토큰 가져오기
export const getRefreshToken = () => {
  if (typeof window === "undefined") return null;

  return getCookie("refreshToken");
};

// 토큰 삭제 (로그아웃)
export const clearTokens = () => {
  if (typeof window === "undefined") return;

  eraseCookie("accessToken");
  eraseCookie("refreshToken");
};

// 토큰 존재 여부 확인 (로그인 상태 확인)
export const isAuthenticated = () => {
  if (typeof window === "undefined") return false;

  return !!getCookie("accessToken");
};
