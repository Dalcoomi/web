// hooks/useAuth.ts
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  getAccessToken,
  getRefreshToken,
  saveTokens,
  clearTokens,
} from "@/utils/tokenManager";
import { useMemberStore } from "@/stores/useMemberStore";
import { logout as logoutAPI } from "@/services/authService";

export function useAuth() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [mounted, setMounted] = useState(false);
  const { clearMember } = useMemberStore();

  // 🔥 토큰 리프레시 진행 상태와 중복 방지
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const refreshPromiseRef = useRef<Promise<boolean> | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 🔥 토큰 리프레시 함수 - 중복 호출 방지
  const refreshAccessToken = useCallback(async (): Promise<boolean> => {
    // 이미 리프레시 중이면 기존 Promise 반환
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      return false;
    }

    // 새로운 리프레시 Promise 생성
    refreshPromiseRef.current = (async () => {
      try {
        setIsRefreshing(true);

        const API_URL = process.env.NEXT_PUBLIC_API_URL;
        const response = await fetch(`${API_URL}/api/auth/reissue`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Refresh-Token": refreshToken,
          },
        });

        if (!response.ok) {
          return false;
        }

        const data = await response.json();
        if (!data.accessToken) {
          return false;
        }

        const newRefreshToken = data.refreshToken || refreshToken;
        saveTokens(data.accessToken, newRefreshToken);

        return true;
      } catch (error) {
        return false;
      } finally {
        setIsRefreshing(false);
        // Promise 완료 후 참조 제거
        refreshPromiseRef.current = null;
      }
    })();

    return refreshPromiseRef.current;
  }, []);

  // 🔥 초기 인증 상태 확인 - 매우 빠르게 처리
  useEffect(() => {
    if (!mounted) return;

    const checkAuth = async () => {
      try {
        const accessToken = getAccessToken();
        const refreshToken = getRefreshToken();

        // 🔥 리프레시 토큰이 없으면 즉시 로그아웃 상태 설정
        if (!refreshToken) {
          clearTokens();
          clearMember(); // 회원 정보도 제거
          setIsLoggedIn(false);
          setIsLoading(false);
          return;
        }

        // 🔥 액세스 토큰이 있으면 즉시 로그인 상태 설정
        if (accessToken) {
          setIsLoggedIn(true);
          setIsLoading(false);
          return;
        }

        // 🔥 액세스 토큰이 없지만 리프레시 토큰이 있는 경우
        // 🔥 일단 로그인 상태로 설정하고 로딩 해제 (사용자 경험 개선)
        setIsLoggedIn(true);
        setIsLoading(false);

        // 🔥 백그라운드에서 토큰 리프레시 (비동기)
        refreshAccessToken().then((success) => {
          if (!success) {
            clearTokens();
            clearMember(); // 회원 정보도 제거
            setIsLoggedIn(false);

            // 보호된 페이지에 있다면 메인으로 이동
            const currentPath = window.location.pathname;
            const protectedPaths = ["/transaction", "/group"];
            const isProtectedPath = protectedPaths.some((path) =>
              currentPath.startsWith(path)
            );

            if (isProtectedPath) {
              router.replace("/");
            }
          }
        });
      } catch (error) {
        setIsLoggedIn(false);
        clearTokens();
        clearMember(); // 회원 정보도 제거
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [mounted, refreshAccessToken, router, clearMember]);

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
      if (!accessToken && !isRefreshing) {
        refreshAccessToken().then((success) => {
          if (!success) {
            clearTokens();
            clearMember(); // 회원 정보도 제거
            setIsLoggedIn(false);
            router.replace("/");
          }
        });
      }

      if (callback) {
        callback();
      }
    },
    [isLoading, isRefreshing, router, refreshAccessToken, clearMember]
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
        const refreshed = await refreshAccessToken();

        if (refreshed) {
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
      const refreshed = await refreshAccessToken();
      if (refreshed) {
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
    isLoading: isLoading, // 🔥 리프레시 상태는 로딩에 포함하지 않음
    mounted,
    login,
    logout,
    requireAuth,
    requireUnauth,
    getToken: getAccessToken,
    getRefreshToken,
    checkTokenValidity,
    refreshAuthState,
    refreshAccessToken,
  };
}
