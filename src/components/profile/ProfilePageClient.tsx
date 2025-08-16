// components/profile/ProfilePageClient.tsx
"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import TopBar from "@/components/ui/TopBar";
import BottomBar from "@/components/ui/BottomBar";
import { getMember, Member } from "@/services/memberService";

export default function ProfilePageClient() {
  const [member, setMember] = useState<Member | null>(null);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // 기존 디바운스 타이머 제거
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // 디바운스 적용된 API 호출
    debounceRef.current = setTimeout(async () => {
      try {
        const memberData = await getMember();
        setMember(memberData);
        setError(null);
      } catch (err) {
        setError("회원 정보를 불러오는데 실패했습니다.");
        console.error("Failed to fetch member:", err);

        // 에러 발생 시 기본값 설정
        setMember({
          email: "",
          name: "",
          nickname: "사용자",
          profileImageUrl: "",
        });
      }
    }, 100);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // 에러 재시도 함수
  const handleRetry = () => {
    setError(null);
    window.location.reload();
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

  return (
    <div className="h-screen bg-white flex flex-col">
      <TopBar />

      {/* 에러 토스트 */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-6 mt-4">
          <div className="flex justify-between items-center">
            <div className="flex">
              <span className="text-red-700 text-sm">{error}</span>
            </div>
            <button
              onClick={handleRetry}
              className="text-red-600 text-sm underline hover:text-red-800"
            >
              다시 시도
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 px-6 py-4 overflow-y-auto">
        {/* Profile Section */}
        <div className="text-center mb-6">
          <h1 className="text-2xl text-black mb-4">{member?.nickname}</h1>

          <div className="w-24 h-24 mx-auto mb-6 relative">
            {member?.profileImageUrl && (
              <Image
                src={member.profileImageUrl}
                alt={`${member.nickname}의 프로필`}
                width={24}
                height={24}
                quality={100}
                unoptimized={true}
                className="w-24 h-24 rounded-full object-cover"
              />
            )}
          </div>
        </div>

        {/* Menu Section */}
        <div className="bg-gray-50 rounded-lg shadow-sm">
          <div className="divide-y divide-gray-100">
            <button className="w-full flex items-center justify-between p-4 hover:bg-gray-100 cursor-pointer transition-colors">
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
          <button className="w-full bg-red-50 text-red-600 py-3 px-4 rounded-lg text-sm font-medium hover:bg-red-100 cursor-pointer transition-colors">
            로그아웃
          </button>
          <button className="w-full text-gray-400 py-3 px-4 rounded-lg text-sm font-medium hover:bg-gray-100 cursor-pointer transition-colors">
            회원탈퇴
          </button>
        </div>
      </main>

      <BottomBar />
    </div>
  );
}
