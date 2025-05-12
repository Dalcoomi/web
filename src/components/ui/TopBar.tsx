"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";

interface TopBarProps {
  showBackButton?: boolean;
  title?: string;
  onBackClick?: () => void;
}

export default function TopBar({
  showBackButton = true,
  onBackClick,
}: TopBarProps) {
  const router = useRouter();

  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      router.back();
    }
  };

  return (
    <div className="bg-[#1BA5FF] text-white h-12 flex items-center justify-between px-4 w-full">
      <div className="flex items-center">
        {showBackButton && (
          <button
            onClick={handleBackClick}
            className="mr-3 flex items-center justify-center"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M15 18L9 12L15 6"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
        <div className="flex items-center">
          <Image
            src="/images/메인로고.svg" // 로고 이미지 경로
            alt="Dalcoomi"
            width={150}
            height={100}
            className="mr-2"
          />
        </div>
      </div>
      <button className="flex items-center justify-center">
        <svg
          width="24"
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
  );
}
