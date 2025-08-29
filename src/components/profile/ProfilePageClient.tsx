// components/profile/ProfilePageClient.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import TopBar from "@/components/ui/TopBar";
import BottomBar from "@/components/ui/BottomBar";
import { useMemberStore } from "@/stores/useMemberStore";
import { useAuth } from "@/hooks/useAuth";

export default function ProfilePageClient() {
  const router = useRouter();
  const { member, fetchMember } = useMemberStore();
  const { logout, isLoggedIn } = useAuth();

  // 회원 정보가 없으면 가져오기 (단, 로그인된 상태에서만)
  useEffect(() => {
    if (!member && isLoggedIn) {
      fetchMember();
    }
  }, [member, isLoggedIn, fetchMember]);

  const handleProfileUpdate = () => {
    router.push("/profile/update");
  };

  const handlePrivacyPolicy = () => {
    window.open(
      "https://dalcoomi.notion.site/2326ea725ec881628880db9f9f487680",
      "_blank"
    );
  };

  const handleTermsOfService = () => {
    window.open(
      "https://dalcoomi.notion.site/2326ea725ec880d69db1ecccb049bcf9",
      "_blank"
    );
  };

  const handleLogout = () => {
    logout();
  };

  const handleWithdrawal = () => {
    if (
      confirm("정말로 회원탈퇴를 하시겠습니까?\n이 작업은 되돌릴 수 없습니다.")
    ) {
      // 회원탈퇴 로직 구현 필요
      console.log("회원탈퇴 처리");
    }
  };

  // 로그인 상태가 아니거나 회원 정보가 없는 경우
  if (!member) {
    return <div className="h-screen bg-white flex flex-col"></div>;
  }

  return (
    <div className="h-screen bg-white flex flex-col">
      <TopBar />

      <main className="flex-1 px-6 py-4 overflow-y-auto">
        {/* Profile Section */}
        <div className="text-center mb-6">
          <h1 className="text-2xl text-black mb-4">
            {member?.nickname || "사용자"}
          </h1>

          <div className="w-24 h-24 mx-auto mb-6 relative">
            {member?.profileImageUrl ? (
              <Image
                src={member.profileImageUrl}
                alt={`${member.nickname}`}
                width={96}
                height={96}
                quality={100}
                unoptimized={true}
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center"></div>
            )}
          </div>
        </div>

        {/* Menu Section */}
        <div className="bg-gray-50 rounded-lg shadow-sm">
          <div className="divide-y divide-gray-100">
            <button
              onClick={handleProfileUpdate}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-100 cursor-pointer transition-colors"
            >
              <span className="text-gray-600">프로필 수정</span>
              <span className="text-gray-400">›</span>
            </button>
          </div>
        </div>

        {/* Policy & Help Section */}
        <div className="bg-gray-50 rounded-lg text-sm shadow-sm mt-4">
          <div className="divide-y divide-gray-100">
            <button
              onClick={handlePrivacyPolicy}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-100 cursor-pointer transition-colors"
            >
              <span className="text-gray-600">개인정보 처리방침</span>
              <span className="text-gray-400">›</span>
            </button>

            <button
              onClick={handleTermsOfService}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-100 cursor-pointer transition-colors"
            >
              <span className="text-gray-600">서비스 이용약관</span>
              <span className="text-gray-400">›</span>
            </button>
          </div>
        </div>

        {/* Logout & Withdrawal Buttons */}
        <div className="mt-6 space-y-3">
          <button
            onClick={handleLogout}
            className="w-full bg-red-50 text-red-600 py-3 px-4 rounded-lg text-sm font-medium hover:bg-red-100 cursor-pointer transition-colors"
          >
            로그아웃
          </button>
          <button
            onClick={handleWithdrawal}
            className="w-full text-gray-400 py-3 px-4 rounded-lg text-sm font-medium hover:bg-gray-100 cursor-pointer transition-colors"
          >
            회원탈퇴
          </button>
        </div>
      </main>

      <BottomBar />
    </div>
  );
}
