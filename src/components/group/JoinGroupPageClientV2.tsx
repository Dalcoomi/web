"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { joinGroup } from "@/services/groupService";
import BottomButton from "@/components/ui/BottomButton";

export default function JoinGroupPageClientV2() {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove non-alphanumeric characters and force uppercase
    const value = e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    if (value.length <= 8) {
      setInviteCode(value);
    }
  };

  const handleSubmit = async () => {
    if (inviteCode.length !== 8 || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // 1. 그룹 참가 요청 (응답에 teamId, title 포함)
      const { teamId, title } = await joinGroup(inviteCode);

      // 2. 성공 페이지로 이동
      router.push(
        `/group/join/success?teamId=${teamId}&title=${encodeURIComponent(title)}`
      );
    } catch (error: any) {
      alert(
        error.message || "그룹 참여에 실패했습니다. 코드를 다시 확인해주세요."
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden">
      {/* 헤더 */}
      <div className="z-50 bg-white">
        <div className="flex items-center justify-end h-[48px] px-5">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center cursor-pointer"
          >
            <Image
              src="/images/transaction/v2/페이지_닫기.svg"
              alt="닫기"
              width={24}
              height={24}
            />
          </button>
        </div>
      </div>

      {/* 컨텐츠 */}
      <div className="flex-1 px-5 flex flex-col items-center">
        {/* 타이틀 - 헤더와 56px 간격 (헤더 높이 48px 제외하고 margin-top으로 조정) */}
        <h1 className="text-title2 text-gray-900 text-center mt-[56px] mb-[56px] whitespace-pre-wrap">
          그룹 가계부{"\n"}초대코드 입력하기
        </h1>

        {/* 입력창 (8자리) */}
        <div className="relative">
          <div className="flex gap-2">
            {Array.from({ length: 8 }).map((_, index) => {
              const char = inviteCode[index];
              const isActive = isFocused && index === inviteCode.length;
              const isLastAndFull =
                inviteCode.length === 8 && index === 7 && isFocused;
              
              return (
                <div
                  key={index}
                  className="w-[36px] h-[36px] flex items-center justify-center relative"
                >
                  {char ? (
                    <div className="relative flex items-center justify-center">
                      <span className="text-title2 text-gray-900">{char}</span>
                      {isLastAndFull && (
                        <div className="absolute left-full ml-[1px] w-[1.5px] h-[20px] bg-gray-900 animate-cursor-blink" />
                      )}
                    </div>
                  ) : isActive ? (
                    <div className="w-[1.5px] h-[20px] bg-gray-900 animate-cursor-blink" />
                  ) : (
                    <div className="w-[10px] h-[10px] rounded-full bg-gray-300" />
                  )}
                </div>
              );
            })}
          </div>
          
          {/* 투명 입력 필드를 위에 덮어씌움 */}
          <input
            ref={inputRef}
            type="text"
            value={inviteCode}
            onChange={handleInputChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            maxLength={8}
            className="absolute inset-0 w-full h-full opacity-0 cursor-text bg-transparent text-transparent caret-transparent"
            autoFocus
          />
        </div>
      </div>

            {/* 하단 고정 영역 */}
            <BottomButton
              text={isSubmitting ? "참여 중..." : "입력 완료"}
              onClick={handleSubmit}
              disabled={inviteCode.length !== 8 || isSubmitting}
            >
              {/* 안내 문구 */}
              <p className="text-caption2-medium text-gray-500 text-center mb-5 whitespace-pre-wrap">
                참여할 그룹 가계부의 초대코드를 입력해주세요.{"\n"}
                그룹더보기 &gt; 그룹 초대하기에서 초대코드를 확인할 수 있어요.
              </p>
            </BottomButton>
          </div>
        );
      }
