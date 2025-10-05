// hooks/useAuth.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  getAccessToken,
  getRefreshToken,
  saveTokens,
  clearTokens,
} from "@/utils/tokenManager";
import {
  refreshAccessToken,
  isTokenRefreshing,
} from "@/utils/refreshTokenManager";
import { useMemberStore } from "@/stores/useMemberStore";
import { logout as logoutAPI } from "@/services/authService";

export function useAuth() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [mounted, setMounted] = useState(false);
  const { clearMember } = useMemberStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  // 🔥 초기 인증 상태 확인 - 토큰 존재 여부만 확인 (재발급은 API 호출 시 자동 처리)
  useEffect(() => {
    if (!mounted) return;

    const refreshToken = getRefreshToken();

    if (refreshToken) {
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
      clearMember();
    }

    setIsLoading(false);
  }, [mounted, clearMember]);

  // 로그인 함수
  const login = useCallback((accessToken: string, refreshToken?: string) => {
    saveTokens(accessToken, refreshToken);
    setIsLoggedIn(true);
  }, []);

  // 로그아웃 함수
  const logout = useCallback(async () => {
    try {
      // 백엔드 로그아웃 API 호출
      await logoutAPI();
    } catch (error) {
      // 로그아웃 API 실패해도 클라이언트 로그아웃은 진행
      console.error("로그아웃 API 호출 실패:", error);
    } finally {
      // 클라이언트 상태 정리
      clearTokens();
      clearMember(); // 회원 정보도 제거
      setIsLoggedIn(false);

      const currentPath = window.location.pathname;
      const protectedPaths = ["/transaction", "/group", "/profile"];
      const isProtectedPath = protectedPaths.some((path) =>
        currentPath.startsWith(path)
      );

      if (isProtectedPath) {
        router.push("/");
      }
    }
  }, [router, clearMember]);

  // 🔥 requireAuth - 간소화 및 최적화
  const requireAuth = useCallback(
    async (callback?: () => void) => {
      if (isLoading) {
        return;
      }

      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        router.replace("/");
        return;
      }

      // 🔥 리프레시 토큰이 있으면 일단 접근 허용
      // 액세스 토큰 확인 및 필요시 백그라운드 리프레시
      const accessToken = getAccessToken();
      if (!accessToken && !isTokenRefreshing()) {
        refreshAccessToken().then((newToken) => {
          if (!newToken) {
            clearTokens();
            clearMember();
            setIsLoggedIn(false);
            router.replace("/");
          }
        });
      }

      if (callback) {
        callback();
      }
    },
    [isLoading, router, clearMember]
  );

  // 🔥 requireUnauth - 리프레시 토큰 기준
  const requireUnauth = useCallback(
    (callback?: () => void) => {
      if (isLoading) {
        return;
      }

      const refreshToken = getRefreshToken();
      if (refreshToken) {
        router.replace("/transaction/my");
        return;
      }

      if (callback) {
        callback();
      }
    },
    [isLoading, router]
  );

  // 🔥 이벤트 리스너 - 401 에러 처리
  useEffect(() => {
    if (!mounted) return;

    const handleAuthError = async (event: Event) => {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        const newToken = await refreshAccessToken();

        if (newToken) {
          setIsLoggedIn(true);
          return;
        }
      }

      setIsLoggedIn(false);
      clearTokens();
      clearMember(); // 회원 정보도 제거

      const currentPath = window.location.pathname;
      const protectedPaths = ["/transaction", "/group"];
      const isProtectedPath = protectedPaths.some((path) =>
        currentPath.startsWith(path)
      );

      if (isProtectedPath) {
        router.replace("/");
      }
    };

    const handleTokenRefresh = (event: Event) => {
      setIsLoggedIn(true);
    };

    window.addEventListener("auth-error", handleAuthError);
    window.addEventListener("token-refreshed", handleTokenRefresh);

    return () => {
      window.removeEventListener("auth-error", handleAuthError);
      window.removeEventListener("token-refreshed", handleTokenRefresh);
    };
  }, [router, mounted, refreshAccessToken, clearMember]);

  // 기타 함수들
  const checkTokenValidity = useCallback(() => {
    const accessToken = getAccessToken();
    const refreshToken = getRefreshToken();

    return {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      isValid: !!refreshToken,
    };
  }, []);

  const refreshAuthState = useCallback(async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      setIsLoggedIn(false);
      return false;
    }

    const accessToken = getAccessToken();
    if (!accessToken) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        setIsLoggedIn(true);
        return true;
      } else {
        setIsLoggedIn(false);
        clearTokens();
        clearMember(); // 회원 정보도 제거
        return false;
      }
    }

    setIsLoggedIn(true);
    return true;
  }, [refreshAccessToken, clearMember]);

  return {
    isLoggedIn,
    isLoading,
    mounted,
    login,
    logout,
    requireAuth,
    requireUnauth,
    getToken: getAccessToken,
    getRefreshToken,
    checkTokenValidity,
    refreshAuthState,
  };
}
