// services/authService.ts
import { post } from "@/utils/apiClient";
import { getRefreshToken } from "@/utils/tokenManager";

// 로그인 API
export const socialLogin = async (data: {
  socialEmail: string;
  socialId: string;
  socialType: string;
  socialRefreshToken?: string;
  deviceType: string;
}) => {
  return post("/api/auth/login", data);
};

// 로그아웃 API
export const logout = async () => {
  const refreshToken = getRefreshToken();

  try {
    // 리프레시 토큰을 헤더에 포함하여 요청
    // skipAuthRefresh: true로 401 발생 시 토큰 재발급 시도하지 않음
    await post("/api/auth/logout", undefined, {
      headers: {
        "Refresh-Token": refreshToken || "",
      },
      skipAuthRefresh: true,
    });
  } catch (error) {
    // 백엔드 로그아웃 실패해도 에러를 던지지 않음
    // 프론트엔드에서는 항상 로그아웃이 성공해야 함
    console.error("백엔드 로그아웃 실패 (무시됨):", error);
  }

  // 항상 성공으로 반환
  return Promise.resolve();
};
