// services/authService.ts
import { post } from "@/utils/apiClient";

// 로그인 API
export const socialLogin = async (data: {
  socialId: string;
  socialType: string;
}) => {
  return post("/api/auth/login", data);
};

// 로그아웃 API
export const logout = async () => {
  return post("/api/auth/logout");
};

// 회원가입 API
export const signUp = async (signUpData: any) => {
  return post("/api/member/sign-up", signUpData);
};
