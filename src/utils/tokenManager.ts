// utils/tokenManager.ts
import { setCookie, getCookie, eraseCookie } from "./cookieManager";
import { useAuthStore } from "@/stores/useAuthStore";

// 토큰 저장
export const saveTokens = (accessToken: string, refreshToken?: string) => {
  if (typeof window === "undefined") return;

  // Zustand persist store에 저장 (가장 안정적)
  useAuthStore.getState().setTokens(accessToken, refreshToken);

  // 쿠키에도 저장 (서버 사이드 렌더링 대비)
  setCookie("accessToken", accessToken, 1 / 24);
  if (refreshToken) {
    setCookie("refreshToken", refreshToken, 3);
  }
};

// 액세스 토큰 가져오기
export const getAccessToken = () => {
  if (typeof window === "undefined") return null;

  // 쿠키에서 먼저 시도
  const cookieToken = getCookie("accessToken");
  if (cookieToken) return cookieToken;

  // Zustand store에서 복구
  const storeToken = useAuthStore.getState().getAccessToken();
  if (storeToken) {
    setCookie("accessToken", storeToken, 1 / 24);
    return storeToken;
  }

  return null;
};

// 리프레시 토큰 가져오기
export const getRefreshToken = () => {
  if (typeof window === "undefined") return null;

  // 쿠키에서 먼저 시도
  const cookieToken = getCookie("refreshToken");
  if (cookieToken) return cookieToken;

  // Zustand store에서 복구
  const storeToken = useAuthStore.getState().getRefreshToken();
  if (storeToken) {
    setCookie("refreshToken", storeToken, 3);
    return storeToken;
  }

  return null;
};

// 토큰 삭제 (로그아웃)
export const clearTokens = () => {
  if (typeof window === "undefined") return;

  // Zustand store 삭제
  useAuthStore.getState().clearTokens();

  // 쿠키 삭제
  eraseCookie("accessToken");
  eraseCookie("refreshToken");
};

// 🔥 인증 상태 확인 로직 변경: 리프레시 토큰 기준
export const isAuthenticated = () => {
  if (typeof window === "undefined") return false;
  // 액세스 토큰이 없어도 리프레시 토큰이 있으면 인증된 상태로 간주
  return !!getCookie("refreshToken");
};
