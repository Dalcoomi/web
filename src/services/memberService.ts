// services/memberService.ts
import { get, post, put, del } from "@/utils/apiClient";

// 소셜 타입 enum 정의
export enum SocialType {
  KAKAO = "KAKAO",
  NAVER = "NAVER",
}

// 멤버 타입 정의
export interface Member {
  socialType: SocialType;
  email: string;
  name: string;
  nickname: string;
  birthday: string; // LocalDate는 문자열로 전송됨 (YYYY-MM-DD 형식)
  gender: string;
  profileImageUrl: string;
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
