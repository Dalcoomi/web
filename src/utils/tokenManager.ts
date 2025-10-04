// utils/tokenManager.ts
import { setCookie, getCookie, eraseCookie } from "./cookieManager";

// 토큰 저장
export const saveTokens = (accessToken: string, refreshToken?: string) => {
  if (typeof window === "undefined") return;

  console.log("[saveTokens] 토큰 저장 시작", {
    accessToken: accessToken ? "있음" : "없음",
    refreshToken: refreshToken ? "있음" : "없음"
  });
  setCookie("accessToken", accessToken, 1 / 24);
  if (refreshToken) {
    setCookie("refreshToken", refreshToken, 3);
  }
  console.log("[saveTokens] 토큰 저장 완료");
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

  console.log("[clearTokens] 토큰 삭제 호출됨", new Error().stack);
  eraseCookie("accessToken");
  eraseCookie("refreshToken");
};

// 🔥 인증 상태 확인 로직 변경: 리프레시 토큰 기준
export const isAuthenticated = () => {
  if (typeof window === "undefined") return false;
  // 액세스 토큰이 없어도 리프레시 토큰이 있으면 인증된 상태로 간주
  return !!getCookie("refreshToken");
};
