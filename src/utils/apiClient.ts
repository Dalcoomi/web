// utils/apiClient.ts
import {
  getAccessToken,
  getRefreshToken,
  saveTokens,
  clearTokens,
} from "./tokenManager";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// 토큰 리프레시 중복 방지를 위한 플래그
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: any) => void;
  reject: (reason: any) => void;
}> = [];

// 🔥 에러 메시지 중복 표시 방지
let hasShownAuthError = false;

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
      if (isRefreshing) {
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
            throw new Error("토큰 리프레시 실패");
          })
          .then(handleResponse);
      }

      isRefreshing = true;

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
          processQueue(new Error("토큰 리프레시 실패"), null);
          handleLogout();

          // 🔥 에러 메시지 중복 방지
          if (!hasShownAuthError) {
            hasShownAuthError = true;
            throw new Error("인증이 만료되었습니다. 다시 로그인해주세요.");
          } else {
            throw new Error("AUTH_ERROR"); // 조용히 실패
          }
        }
      } finally {
        isRefreshing = false;
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

// 🔥 로그아웃 처리 개선 - 즉시 리다이렉트 제거
const handleLogout = () => {
  clearTokens();

  if (typeof window !== "undefined") {
    // 🔥 auth-error 이벤트 발생 (useAuth에서 처리)
    window.dispatchEvent(new CustomEvent("auth-error"));

    // 🔥 즉시 리다이렉트 완전 제거
    // useAuth에서 이벤트를 받아서 처리하도록 위임
  }
};

// 토큰 리프레시 함수
const refreshAccessToken = async (): Promise<boolean> => {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    clearTokens();
    return false;
  }

  try {
    const response = await fetch(`${API_URL}/api/auth/reissue`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Refresh-Token": refreshToken,
      },
    });

    if (!response.ok) {
      // 401 Unauthorized: 리프레시 토큰 만료/무효 → 토큰 삭제
      if (response.status === 401) {
        clearTokens();
      }
      // 그 외 에러(500, 502 등)는 토큰 유지 (일시적 서버 에러 가능성)
      return false;
    }

    const data = await response.json();

    // 응답 데이터 검증
    if (!data.accessToken) {
      // 응답은 성공했지만 토큰이 없음 → 비정상 상황, 토큰 삭제
      clearTokens();
      return false;
    }

    // 새로운 토큰 저장
    const newRefreshToken = data.refreshToken || refreshToken;
    saveTokens(data.accessToken, newRefreshToken);

    // 🔥 토큰 갱신 성공 시 에러 상태 리셋
    hasShownAuthError = false;

    // 🔥 토큰 갱신 성공 이벤트 발생
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("token-refreshed"));
    }

    return true;
  } catch (error) {
    // 네트워크 에러 등 예외 상황 → 토큰 유지 (일시적 에러 가능성)
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
