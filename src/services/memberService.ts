// services/memberService.ts
import { get, post, put, del, patch } from "@/utils/apiClient";

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

// 프로필 정보 업데이트 요청 타입
export interface UpdateProfileRequest {
  name: string;
  nickname: string;
  birthday?: string; // LocalDate 형식 (YYYY-MM-DD)
  gender?: string;
}

// 프로필 정보 업데이트 응답 타입
export interface UpdateProfileResponse {
  name: string;
  nickname: string;
  birthday: string;
  gender: string;
}

// 탈퇴 사유 enum (백엔드와 일치)
export enum WithdrawalType {
  LOW_USAGE_FREQUENCY = "LOW_USAGE_FREQUENCY",
  LACK_OF_FEATURES = "LACK_OF_FEATURES",
  USING_OTHER_SERVICE = "USING_OTHER_SERVICE",
  DIFFICULT_UI_UX = "DIFFICULT_UI_UX",
  FREQUENT_BUGS = "FREQUENT_BUGS",
  PRIVACY_CONCERN = "PRIVACY_CONCERN",
  OTHER = "OTHER",
}

// 리더 권한 이양 정보 타입
export interface LeaderTransferInfo {
  teamId: number;
  nextLeaderNickname: string;
}

// 회원탈퇴 요청 타입
export interface WithdrawRequest {
  withdrawalType: WithdrawalType;
  otherReason?: string;
  leaderTransferInfos: LeaderTransferInfo[];
}

// 회원가입 API
export const signUp = async (signUpData: any) => {
  return post("/api/members/sign-up", signUpData);
};

// 소셜 연동 API
export const integrateSocial = async (data: {
  socialEmail: string;
  socialId: string;
  socialType: string;
}) => {
  return post("/api/members/integrate", data);
};

// 회원 조회
export const getMember = async (): Promise<Member> => {
  try {
    const response = await get("/api/members");
    return response;
  } catch (error) {
    throw error;
  }
};

// 닉네임 사용 가능 여부 확인
export const checkNicknameAvailability = async (
  nickname: string
): Promise<boolean> => {
  try {
    const response = await get(
      `/api/members/nickname/availability?nickname=${encodeURIComponent(
        nickname
      )}`
    );
    return response;
  } catch (error) {
    throw error;
  }
};

// 프로필 사진 업데이트
export const updateAvatar = async (
  profileImage: File | null,
  removeAvatar: boolean = false
): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append("removeAvatar", removeAvatar ? "true" : "false");

    if (profileImage && !removeAvatar) {
      formData.append("profileImage", profileImage);
    }

    const response = await patch("/api/members/avatar", formData);

    return response;
  } catch (error) {
    throw error;
  }
};

// 프로필 정보 업데이트
export const updateProfile = async (
  profileData: UpdateProfileRequest
): Promise<UpdateProfileResponse> => {
  try {
    const response = await patch("/api/members/profile", profileData);
    return response;
  } catch (error) {
    throw error;
  }
};

// 회원탈퇴 API 함수
export const withdrawMember = async (
  request: WithdrawRequest
): Promise<void> => {
  try {
    await patch("/api/members", request);
  } catch (error) {
    throw error;
  }
};
