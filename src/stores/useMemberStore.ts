// stores/useMemberStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getMember } from "@/services/memberService";

// 소셜 타입 enum 정의
export enum SocialType {
  KAKAO = "KAKAO",
  NAVER = "NAVER",
}

// 멤버 타입 정의
export interface Member {
  socialTypes: SocialType[]; // 연동된 소셜 계정 리스트
  currentLoginSocial?: SocialType; // 현재 로그인에 사용한 소셜 타입
  email: string;
  name: string;
  nickname: string;
  birthday: string;
  gender: string;
  profileImageUrl: string;
  aiLearningAgreement: boolean;
}

interface MemberStore {
  member: Member | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchMember: (force?: boolean) => Promise<void>;
  setMember: (member: Member) => void;
  clearMember: () => void;
  updateMember: (updates: Partial<Member>) => void;
}

export const useMemberStore = create<MemberStore>()(
  persist(
    (set, get) => ({
      member: null,
      isLoading: false,
      error: null,

      fetchMember: async (force = false) => {
        // force가 true이면 강제로 다시 조회, 그렇지 않으면 이미 회원 정보가 있으면 API 호출하지 않음
        if (!force && get().member) {
          return;
        }

        try {
          set({ isLoading: true, error: null });
          const memberData = await getMember();

          // localStorage에서 currentLoginSocial 확인 후 적용
          const savedLoginSocial = localStorage.getItem("currentLoginSocial");
          if (savedLoginSocial) {
            const currentLoginSocial = savedLoginSocial === "KAKAO" ? SocialType.KAKAO : SocialType.NAVER;
            memberData.currentLoginSocial = currentLoginSocial;
            // localStorage에서 제거 (한번만 적용)
            localStorage.removeItem("currentLoginSocial");
          }

          set({ member: memberData, isLoading: false });
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "회원 정보를 가져오는데 실패했습니다.",
            isLoading: false,
          });
        }
      },

      setMember: (member: Member) => {
        set({ member, error: null });
      },

      clearMember: () => {
        set({ member: null, error: null, isLoading: false });
      },

      updateMember: (updates: Partial<Member>) => {
        const currentMember = get().member;
        if (currentMember) {
          set({ member: { ...currentMember, ...updates } });
        }
      },
    }),
    {
      name: "member-storage", // localStorage에 저장될 키 이름
      partialize: (state) => ({ member: state.member }), // member 정보만 persist
    }
  )
);
