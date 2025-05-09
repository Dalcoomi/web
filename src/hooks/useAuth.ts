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

  // 컴포넌트 마운트 시 인증 상태 확인
  useEffect(() => {
    const checkAuth = () => {
      const authStatus = isAuthenticated();
      setIsLoggedIn(authStatus);
      setIsLoading(false);
    };

    // 초기 로딩 시 한 번만 실행
    checkAuth();
  }, []);

  // 로그인 함수 - useCallback으로 메모이제이션
  const login = useCallback((accessToken: string, refreshToken?: string) => {
    saveTokens(accessToken, refreshToken);
    setIsLoggedIn(true);
  }, []);

  // 로그아웃 함수 - useCallback으로 메모이제이션
  const logout = useCallback(() => {
    clearTokens();
    setIsLoggedIn(false);
    router.push("/login");
  }, [router]);

  // 보호된 페이지 접근 권한 확인 - useCallback으로 메모이제이션
  const requireAuth = useCallback(
    (callback?: () => void) => {
      if (isLoading) return; // 로딩 중에는 아무 작업도 하지 않음

      if (!isLoggedIn) {
        router.replace("/login");
        return;
      }

      if (callback) {
        callback();
      }
    },
    [isLoading, isLoggedIn, router]
  );

  // 비로그인 페이지 접근 권한 확인 - useCallback으로 메모이제이션
  const requireUnauth = useCallback(
    (callback?: () => void) => {
      if (isLoading) return; // 로딩 중에는 아무 작업도 하지 않음

      if (isLoggedIn) {
        router.replace("/main");
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
