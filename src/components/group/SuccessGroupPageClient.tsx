// components/group/SuccessGroupPageClient.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import TopBar from "@/components/ui/TopBar";
import BottomBar from "@/components/ui/BottomBar";

export default function SuccessGroupPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [inviteCode, setInviteCode] = useState("");

  // URL에서 초대 코드 가져오기
  useEffect(() => {
    const code = searchParams.get("code");
    if (code) {
      setInviteCode(code);
    } else {
      // 초대 코드가 없으면 그룹 메인으로 리다이렉트
      router.replace("/group");
    }
  }, [searchParams, router]);

  // 초대 코드 복사하기
  const handleCopyInviteCode = async () => {
    if (!inviteCode) {
      alert("초대 코드가 없습니다.");
      return;
    }

    try {
      await navigator.clipboard.writeText(inviteCode);
      alert("초대 코드가 복사되었습니다.");
    } catch (error) {
      console.error("복사 실패:", error);
      alert("복사에 실패했습니다. 다시 시도해 주세요.");
    }
  };

  // 완료 버튼 클릭 핸들러
  const handleComplete = () => {
    router.push("/group");
  };

  // 초대 코드가 없으면 로딩 표시
  if (!inviteCode) {
    return (
      <div className="flex flex-col h-screen bg-white">
        <TopBar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">로딩 중...</div>
        </div>
        <BottomBar />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white relative">
      <TopBar />

      {/* 배경 이미지 */}
      <div className="flex-1 relative">
        <Image
          src="/images/group/그룹_생성_완료.svg"
          alt="그룹 생성 완료"
          fill
          className="object-cover"
          priority
        />

        {/* 초대 코드 섹션 - 배경 위에 오버레이 */}
        <div className="absolute bottom-32 left-0 right-0 px-4">
          {/* 초대 코드 텍스트 */}
          <div className="text-center mb-4">
            <span className="text-2xl text-[#0064A2] font-medium">
              초대 코드 : {inviteCode}
            </span>
          </div>

          {/* 초대 코드 복사하기 버튼 */}
          <div className="flex justify-center mb-8">
            <button
              onClick={handleCopyInviteCode}
              className="hover:opacity-50 transition-opacity cursor-pointer"
            >
              <Image
                src="/images/group/초대_코드_복사.svg"
                alt="초대 코드 복사하기"
                width={200}
                height={50}
                priority
              />
            </button>
          </div>
        </div>
      </div>

      {/* 완료 버튼 */}
      <div className="px-10 pb-7">
        <button
          onClick={handleComplete}
          className="w-full py-3 rounded-md font-medium bg-[#0EABFF] hover:bg-blue-500 text-white cursor-pointer transition-colors"
        >
          완료
        </button>
      </div>

      <BottomBar />
    </div>
  );
}
