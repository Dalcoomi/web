// hooks/useAuth.ts (수정된 버전)
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  getAccessToken,
  saveTokens,
  clearTokens,
  isAuthenticated,
} from "@/utils/tokenManager";

export function useAuth() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [mounted, setMounted] = useState(false);

  // 컴포넌트 마운트 확인
  useEffect(() => {
    setMounted(true);
  }, []);

  // 인증 상태 확인
  useEffect(() => {
    if (!mounted) return;

    const checkAuth = () => {
      try {
        const authStatus = isAuthenticated();
        setIsLoggedIn(authStatus);
      } catch (error) {
        alert(error);
        setIsLoggedIn(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // 401 에러 발생 시 처리할 이벤트 리스너
    const handleAuthError = () => {
      setIsLoggedIn(false);
      router.replace("/");
    };

    // 이벤트 리스너 등록
    window.addEventListener("auth-error", handleAuthError);

    // 클린업 함수
    return () => {
      window.removeEventListener("auth-error", handleAuthError);
    };
  }, [router, mounted]);

  // 로그인 함수
  const login = useCallback((accessToken: string, refreshToken?: string) => {
    saveTokens(accessToken, refreshToken);
    setIsLoggedIn(true);
  }, []);

  // 로그아웃 함수
  const logout = useCallback(() => {
    clearTokens();
    setIsLoggedIn(false);
    router.push("/");
  }, [router]);

  // 보호된 페이지 접근 권한 확인
  const requireAuth = useCallback(
    (callback?: () => void) => {
      if (isLoading) return;

      if (!isLoggedIn) {
        router.replace("/");
        return;
      }

      if (callback) {
        callback();
      }
    },
    [isLoading, isLoggedIn, router]
  );

  // 비로그인 페이지 접근 권한 확인
  const requireUnauth = useCallback(
    (callback?: () => void) => {
      if (isLoading) return;

      if (isLoggedIn) {
        router.replace("/transaction/my");
        return;
      }

      if (callback) {
        callback();
      }
    },
    [isLoading, isLoggedIn, router]
  );

  return {
    isLoggedIn,
    isLoading,
    login,
    logout,
    requireAuth,
    requireUnauth,
    getToken: getAccessToken,
  };
}
