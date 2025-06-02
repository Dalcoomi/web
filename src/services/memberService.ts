// services/memberService.ts
import { get, post, put, del } from "@/utils/apiClient";

// 멤버 타입 정의
export interface Member {
  email: string;
  name: string;
  nickname: string;
  profileIamgeUrl: string;
}

// 회원 조회
export const getMember = async (): Promise<Member> => {
  try {
    const response = await get("/api/member");

    return response;
  } catch (error) {
    console.error("회원 조회 중 오류 발생:", error);
    throw error;
  }
};
