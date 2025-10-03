// utils/tokenManager.ts
import { setCookie, getCookie, eraseCookie } from "./cookieManager";

// 토큰 저장
export const saveTokens = (accessToken: string, refreshToken?: string) => {
  if (typeof window === "undefined") return; // 서버 사이드에서 실행 방지

  // 🔥 액세스 토큰: 1시간 (1/24일)
  setCookie("accessToken", accessToken, 1 / 24);

  // localStorage에도 백업 저장 (쿠키가 사라질 경우 대비)
  try {
    localStorage.setItem("accessToken", accessToken);
  } catch (e) {
    // 저장 실패 시 무시
  }

  if (refreshToken) {
    // 리프레시 토큰: 3일
    setCookie("refreshToken", refreshToken, 3);

    // localStorage에도 백업 저장 (쿠키가 사라질 경우 대비)
    try {
      localStorage.setItem("refreshToken", refreshToken);
    } catch (e) {
      // 저장 실패 시 무시
    }
  }
};

// 액세스 토큰 가져오기
export const getAccessToken = () => {
  if (typeof window === "undefined") return null;

  // 쿠키에서 먼저 시도
  const cookieToken = getCookie("accessToken");
  if (cookieToken) return cookieToken;

  // 쿠키에 없으면 localStorage에서 복구
  try {
    const localToken = localStorage.getItem("accessToken");
    if (localToken) {
      // localStorage에서 복구했으면 쿠키에도 다시 저장
      setCookie("accessToken", localToken, 1 / 24);
      return localToken;
    }
  } catch (e) {
    console.warn("localStorage에서 accessToken 읽기 실패:", e);
  }

  return null;
};

// 리프레시 토큰 가져오기
export const getRefreshToken = () => {
  if (typeof window === "undefined") return null;

  // 쿠키에서 먼저 시도
  const cookieToken = getCookie("refreshToken");
  if (cookieToken) return cookieToken;

  // 쿠키에 없으면 localStorage에서 복구
  try {
    const localToken = localStorage.getItem("refreshToken");
    if (localToken) {
      // localStorage에서 복구했으면 쿠키에도 다시 저장
      setCookie("refreshToken", localToken, 3);
      return localToken;
    }
  } catch (e) {
    // 복구 실패 시 무시
  }

  return null;
};

// 토큰 삭제 (로그아웃)
export const clearTokens = () => {
  if (typeof window === "undefined") return;

  // 쿠키 삭제
  eraseCookie("accessToken");
  eraseCookie("refreshToken");

  // localStorage도 삭제
  try {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  } catch (e) {
    // 삭제 실패 시 무시
  }
};

// 🔥 인증 상태 확인 로직 변경: 리프레시 토큰 기준
export const isAuthenticated = () => {
  if (typeof window === "undefined") return false;
  // 액세스 토큰이 없어도 리프레시 토큰이 있으면 인증된 상태로 간주
  return !!getCookie("refreshToken");
};
