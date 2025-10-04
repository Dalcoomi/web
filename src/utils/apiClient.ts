// utils/apiClient.ts
import { getAccessToken, clearTokens } from "./tokenManager";
import {
  refreshAccessToken,
  isTokenRefreshing,
} from "./refreshTokenManager";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// 대기 중인 요청들을 위한 큐
let failedQueue: Array<{
  resolve: (value: any) => void;
  reject: (reason: any) => void;
}> = [];

// 대기 중인 요청들을 처리하는 함수
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });

  failedQueue = [];
};

// API 요청 함수
export const apiClient = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<any> => {
  const url = `${API_URL}${endpoint}`;

  // 기본 헤더 설정
  const headers: Record<string, string> = {
    ...options.headers,
  };

  // body가 FormData가 아닐 때만 Content-Type을 application/json으로 설정
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  // 액세스 토큰이 있으면 인증 헤더 추가
  const accessToken = getAccessToken();
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  // 요청 설정
  const config: RequestInit = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);

    // 인증 오류(401) 발생 시 토큰 리프레시 시도
    if (response.status === 401) {
      // 이미 리프레시 중이면 대기열에 추가
      if (isTokenRefreshing()) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            // 리프레시 완료 후 원래 요청 재시도
            const newAccessToken = getAccessToken();
            if (newAccessToken) {
              headers["Authorization"] = `Bearer ${newAccessToken}`;
              return fetch(url, { ...config, headers });
            }
            throw new Error("AUTH_ERROR");
          })
          .then(handleResponse);
      }

      try {
        const refreshed = await refreshAccessToken();

        if (refreshed) {
          const newAccessToken = getAccessToken();
          processQueue(null, newAccessToken);

          // 원래 요청 재시도
          headers["Authorization"] = `Bearer ${newAccessToken}`;
          const retryResponse = await fetch(url, { ...config, headers });
          return handleResponse(retryResponse);
        } else {
          // 리프레시 실패 시에만 로그아웃 처리
          processQueue(new Error("AUTH_ERROR"), null);
          handleLogout();
          throw new Error("AUTH_ERROR");
        }
      } catch (error) {
        processQueue(error, null);
        throw error;
      }
    }

    return handleResponse(response);
  } catch (error) {
    // 네트워크 에러 등의 경우
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error("네트워크 연결을 확인해주세요.");
    }
    throw error;
  }
};

// 응답 처리 함수
const handleResponse = async (response: Response) => {
  const contentType = response.headers.get("content-type");

  // JSON 응답 처리
  if (contentType?.includes("application/json")) {
    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
          `HTTP ${response.status}: 요청 처리 중 오류가 발생했습니다.`
      );
    }

    return data;
  }

  // 텍스트 응답 처리
  const text = await response.text();

  if (!response.ok) {
    throw new Error(
      `HTTP ${response.status}: 요청 처리 중 오류가 발생했습니다.`
    );
  }

  return text;
};

// 로그아웃 처리
const handleLogout = () => {
  clearTokens();

  if (typeof window !== "undefined") {
    // auth-error 이벤트 발생 (useAuth에서 처리)
    window.dispatchEvent(new CustomEvent("auth-error"));
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

export const patch = (endpoint: string, data?: any, options?: RequestInit) => {
  // FormData인 경우, JSON.stringify를 하지 않고 바로 반환
  if (data instanceof FormData) {
    return apiClient(endpoint, {
      ...options,
      method: "PATCH",
      body: data,
    });
  }

  return apiClient(endpoint, {
    ...options,
    method: "PATCH",
    body: data ? JSON.stringify(data) : undefined,
  });
};

export const del = (endpoint: string, data?: any, options?: RequestInit) =>
  apiClient(endpoint, {
    ...options,
    method: "DELETE",
    body: data ? JSON.stringify(data) : undefined,
  });

// 토큰 상태 확인 유틸리티
export const isTokenValid = (): boolean => {
  const accessToken = getAccessToken();
  return !!accessToken;
};

// 수동 로그아웃 함수
export const logout = () => {
  handleLogout();
};
