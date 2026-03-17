// utils/tokenManager.ts
import { setCookie, getCookie, eraseCookie } from "./cookieManager";

const ACCESS_TOKEN_COOKIE_DAYS = 1 / 24;
const REFRESH_TOKEN_COOKIE_DAYS = 14;

// 토큰 저장
export const saveTokens = (accessToken: string, refreshToken?: string) => {
  if (typeof window === "undefined") return;

  setCookie("accessToken", accessToken, ACCESS_TOKEN_COOKIE_DAYS);
  if (refreshToken) {
    setCookie("refreshToken", refreshToken, REFRESH_TOKEN_COOKIE_DAYS);
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

// 🔥 인증 상태 확인 로직 변경: 리프레시 토큰 기준
export const isAuthenticated = () => {
  if (typeof window === "undefined") return false;
  // 액세스 토큰이 없어도 리프레시 토큰이 있으면 인증된 상태로 간주
  return !!getCookie("refreshToken");
};
