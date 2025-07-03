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
    const response = await get("/api/members");

    return response;
  } catch (error) {
    throw error;
  }
};
