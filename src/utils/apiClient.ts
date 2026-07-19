// utils/apiClient.ts
import { getAccessToken, clearTokens } from "./tokenManager";
import {
  refreshAccessToken,
  isTokenRefreshing,
} from "./refreshTokenManager";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
type ApiClientOptions = RequestInit & { skipAuthRefresh?: boolean };

// 🔥 중복 요청 방지를 위한 Promise 캐시
const pendingRequests = new Map<string, Promise<unknown>>();

// 대기 중인 요청들을 위한 큐
let failedQueue: Array<{
  resolve: (value: string | null) => void;
  reject: (reason: unknown) => void;
}> = [];

// 대기 중인 요청들을 처리하는 함수
const processQueue = (error: unknown, token: string | null = null) => {
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
export const apiClient = async <T = unknown>(
  endpoint: string,
  options: ApiClientOptions = {}
): Promise<T> => {
  const url = `${API_URL}${endpoint}`;

  // skipAuthRefresh 플래그 추출 (RequestInit에는 없는 커스텀 속성)
  const { skipAuthRefresh, ...fetchOptions } = options;

  // 🔥 중복 요청 방지: 같은 URL + method + body 조합의 요청이 진행 중이면 기존 Promise 반환
  const method = fetchOptions.method || "GET";
  const bodyKey = fetchOptions.body instanceof FormData
    ? "FormData"
    : typeof fetchOptions.body === "string"
    ? fetchOptions.body
    : "";
  const requestKey = `${method}:${url}:${bodyKey}`;

  if (pendingRequests.has(requestKey)) {
    return pendingRequests.get(requestKey)! as Promise<T>;
  }

  // 기본 헤더 설정
  const headers: Record<string, string> = {
    ...(fetchOptions.headers as Record<string, string>),
  };

  // body가 FormData가 아닐 때만 Content-Type을 application/json으로 설정
  if (!(fetchOptions.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  // 액세스 토큰이 있으면 인증 헤더 추가
  const accessToken = getAccessToken();
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  // 요청 설정
  const config: RequestInit = {
    ...fetchOptions,
    headers,
  };

  // 🔥 Promise를 생성하고 캐시에 저장
  const requestPromise = (async () => {
    try {
      const response = await fetch(url, config);

    // 인증 오류(401) 발생 시 토큰 리프레시 시도 (skipAuthRefresh가 true면 스킵)
    if (response.status === 401 && !skipAuthRefresh) {
      // 이미 리프레시 중이면 대기열에 추가
      if (isTokenRefreshing()) {
        return new Promise<string | null>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((newAccessToken) => {
            // 리프레시 완료 후 원래 요청 재시도
            if (newAccessToken) {
              headers["Authorization"] = `Bearer ${newAccessToken}`;
              return fetch(url, { ...config, headers });
            }
            return null;
          })
          .then((response) => {
            if (!response) return null as T;
            return handleResponse<T>(response);
          });
      }

      try {
        const newAccessToken = await refreshAccessToken();

        if (newAccessToken) {
          processQueue(null, newAccessToken);

          // 원래 요청 재시도
          headers["Authorization"] = `Bearer ${newAccessToken}`;
          const retryResponse = await fetch(url, { ...config, headers });
          return handleResponse<T>(retryResponse);
        } else {
          // 리프레시 실패 시에만 로그아웃 처리
          processQueue(new Error("AUTH_ERROR"), null);
          handleLogout();
          return null as T;
        }
      } catch (error) {
        processQueue(error, null);
        if (error instanceof Error && error.message === "AUTH_ERROR") {
          return null as T;
        }
        throw error;
      }
    }

      return handleResponse<T>(response);
    } catch (error) {
      // 네트워크 에러 등의 경우
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error("네트워크 연결을 확인해주세요.");
      }
      throw error;
    } finally {
      // 🔥 요청 완료 후 캐시에서 제거 (GET은 50ms 후, 나머지는 즉시)
      const clearDelay = method === "GET" ? 50 : 0;
      setTimeout(() => {
        pendingRequests.delete(requestKey);
      }, clearDelay);
    }
  })();

  pendingRequests.set(requestKey, requestPromise);
  return requestPromise;
};

// 응답 처리 함수
const handleResponse = async <T>(response: Response): Promise<T> => {
  const contentType = response.headers.get("content-type");

  // JSON 응답 처리
  if (contentType?.includes("application/json")) {
    const data: unknown = await response.json();

    if (!response.ok) {
      const message =
        typeof data === "object" &&
        data !== null &&
        "message" in data &&
        typeof data.message === "string"
          ? data.message
          : null;
      throw new Error(
        message ||
          `HTTP ${response.status}: 요청 처리 중 오류가 발생했습니다.`
      );
    }

    return data as T;
  }

  // 텍스트 응답 처리
  const text = await response.text();

  if (!response.ok) {
    throw new Error(
      `HTTP ${response.status}: 요청 처리 중 오류가 발생했습니다.`
    );
  }

  return text as T;
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
export const get = <T = unknown>(endpoint: string, options?: ApiClientOptions) =>
  apiClient<T>(endpoint, { ...options, method: "GET" });

export const post = <T = unknown>(
  endpoint: string,
  data?: unknown,
  options?: ApiClientOptions
) =>
  apiClient<T>(endpoint, {
    ...options,
    method: "POST",
    body: data ? JSON.stringify(data) : undefined,
  });

export const put = <T = unknown>(
  endpoint: string,
  data?: unknown,
  options?: ApiClientOptions
) =>
  apiClient<T>(endpoint, {
    ...options,
    method: "PUT",
    body: data ? JSON.stringify(data) : undefined,
  });

export const patch = <T = unknown>(
  endpoint: string,
  data?: unknown,
  options?: ApiClientOptions
) => {
  // FormData인 경우, JSON.stringify를 하지 않고 바로 반환
  if (data instanceof FormData) {
    return apiClient<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: data,
    });
  }

  return apiClient<T>(endpoint, {
    ...options,
    method: "PATCH",
    body: data ? JSON.stringify(data) : undefined,
  });
};

export const del = <T = unknown>(
  endpoint: string,
  data?: unknown,
  options?: ApiClientOptions
) =>
  apiClient<T>(endpoint, {
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
