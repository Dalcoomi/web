// utils/apiClient.ts
import {
  getAccessToken,
  getRefreshToken,
  saveTokens,
  clearTokens,
} from "./tokenManager";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// API 요청 함수
export const apiClient = async (
  endpoint: string,
  options: RequestInit = {}
) => {
  const url = `${API_URL}${endpoint}`;

  // 기본 헤더 설정
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  // 액세스 토큰이 있으면 인증 헤더 추가
  const accessToken = getAccessToken();
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  // 요청 설정
  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);

    // 인증 오류(401) 발생 시 토큰 리프레시 시도
    if (response.status === 401) {
      const refreshed = await refreshAccessToken();

      // 토큰 리프레시 성공 시 요청 재시도
      if (refreshed) {
        headers["Authorization"] = `Bearer ${getAccessToken()}`;
        return fetch(url, { ...config, headers });
      } else {
        // 리프레시 실패 시 로그아웃 처리
        clearTokens();
        window.location.href = "/";
        throw new Error("인증이 만료되었습니다. 다시 로그인해주세요.");
      }
    }

    // JSON 응답 반환
    if (response.headers.get("content-type")?.includes("application/json")) {
      const data = await response.json();

      // API 에러 처리
      if (!response.ok) {
        throw new Error(data.message || "요청 처리 중 오류가 발생했습니다.");
      }

      return data;
    }

    // JSON이 아닌 응답 처리
    if (!response.ok) {
      throw new Error("요청 처리 중 오류가 발생했습니다.");
    }

    return await response.text();
  } catch (error) {
    console.error("API 호출 오류:", error);
    throw error;
  }
};

// 토큰 리프레시 함수
const refreshAccessToken = async (): Promise<boolean> => {
  const refreshToken = getRefreshToken();

  if (!refreshToken) return false;

  try {
    const response = await fetch(`${API_URL}/api/auth/reissue`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${refreshToken}`,
      },
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    saveTokens(data.accessToken, data.refreshToken);
    return true;
  } catch (error) {
    console.error("토큰 리프레시 오류:", error);
    return false;
  }
};

// API 메서드 헬퍼 함수
export const get = (endpoint: string, options?: RequestInit) =>
  apiClient(endpoint, { ...options, method: "GET" });

export const post = (endpoint: string, data?: any, options?: RequestInit) =>
  apiClient(endpoint, {
    ...options,
    method: "POST",
    body: data ? JSON.stringify(data) : undefined,
  });

export const put = (endpoint: string, data?: any, options?: RequestInit) =>
  apiClient(endpoint, {
    ...options,
    method: "PUT",
    body: data ? JSON.stringify(data) : undefined,
  });

export const del = (endpoint: string, data?: any, options?: RequestInit) =>
  apiClient(endpoint, {
    ...options,
    method: "DELETE",
    body: data ? JSON.stringify(data) : undefined,
  });
