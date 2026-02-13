"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import BottomButton from "@/components/ui/BottomButton";

export default function JoinSuccessPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const teamId = searchParams.get("teamId");
  const title = searchParams.get("title") || "그룹";

  // If no teamId, maybe redirect back? For now, render anyway.

  const handleStart = () => {
    if (teamId) {
      router.push(`/transaction/group/${teamId}`);
    } else {
      router.push("/transaction/group");
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden">
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center pt-30">
        {/* Icon */}
        <div className="mb-16">
          <Image
            src="/images/transaction/v2/그룹_초대_아이콘.svg"
            alt="참여 완료"
            width={180}
            height={180}
          />
        </div>

        {/* Group Name */}
        <h1 className="text-title1 text-green-600 text-center mb-2">{title}</h1>

        {/* Success Message */}
        <h2 className="text-title1 text-gray-900 text-center mb-6">
          그룹 가계부에 들어왔어요
        </h2>

        {/* Description */}
        <p className="text-body2-regular text-gray-500 text-center whitespace-pre-wrap">
          이제 그룹 가계부를 함께 작성할 수 있어요.
          <br />
          어떤 내역이 있나 둘러볼까요?
        </p>
      </div>

      {/* Bottom Button */}
      <BottomButton text="가계부 둘러보기" onClick={handleStart} />
    </div>
  );
}
