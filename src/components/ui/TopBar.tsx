// components/ui/TopBar.tsx
"use client";

import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { useCallback } from "react";

interface TopBarProps {
  showBackButton?: boolean;
  title?: string;
  onBackClick?: () => void;
  onLogoClick?: () => void;
}

export default function TopBar({
  showBackButton = true,
  onBackClick,
  onLogoClick,
}: TopBarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      router.back();
    }
  };

  const handleLogoClick = useCallback(() => {
    // 커스텀 로고 클릭 핸들러가 있으면 사용
    if (onLogoClick) {
      onLogoClick();
      return;
    }

    // 현재 페이지가 /transaction/my 인 경우
    if (pathname === "/transaction/my") {
      // 방법 1: 페이지 완전 새로고침
      // window.location.reload();

      // 방법 2: 페이지 리로드 (동일한 URL로 이동)
      window.location.href = "/transaction/my";
    } else {
      // 다른 페이지에서는 일반적인 라우팅
      router.push("/transaction/my");
    }
  }, [pathname, router, onLogoClick]);

  return (
    <div className="bg-[#11ABFF] text-white h-11 flex items-center justify-between w-full relative">
      {/* 왼쪽 - 뒤로가기 버튼 */}
      <div className="flex items-left w-10">
        {showBackButton && (
          <button
            onClick={handleBackClick}
            className="flex cursor-pointer items-left justify-left"
          >
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M15 18L9 12L15 6"
                stroke="white"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>

      {/* 중앙 - 로고 */}
      <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div
          className="flex cursor-pointer items-center"
          onClick={handleLogoClick}
        >
          <Image
            src="/images/메인로고.svg"
            alt="Dalcoomi"
            width={120}
            height={140}
            priority
          />
        </div>
      </div>

      {/* 오른쪽 - 햄버거 메뉴 */}
      <div className="flex items-center">
        <button className="flex cursor-pointer items-center justify-center">
          <svg
            width="50"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3 12H21M3 6H21M3 18H21"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
