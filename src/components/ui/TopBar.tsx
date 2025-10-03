// components/ui/TopBar.tsx
"use client";

import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { useCallback, useState, useRef, useEffect } from "react";

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
  const [showSidebar, setShowSidebar] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

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
      window.location.href = "/transaction/my";
    } else {
      // 다른 페이지에서는 일반적인 라우팅
      router.push("/transaction/my");
    }
  }, [pathname, router, onLogoClick]);

  // 햄버거 메뉴 클릭 핸들러
  const handleMenuClick = () => {
    setShowSidebar(true);
  };

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        setShowSidebar(false);
      }
    };

    if (showSidebar) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSidebar]);

  // 메뉴 항목 클릭 핸들러들
  const handleMyPage = () => {
    router.push("/profile");
    setShowSidebar(false);
  };

  const handleNotice = () => {
    alert("서비스 준비 중입니다.");
  };

  const handleContactUs = () => {
    alert("서비스 준비 중입니다.");
  };

  return (
    <>
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
              unoptimized
            />
          </div>
        </div>

        {/* 오른쪽 - 햄버거 메뉴 */}
        <div className="flex items-center">
          <button
            onClick={handleMenuClick}
            className="flex cursor-pointer items-center justify-center"
          >
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

      {/* 사이드바 - TopBar와 분리하되 앱 크기 내에서만 */}
      {showSidebar && (
        <>
          {/* 반투명 오버레이 - 앱 영역 내에서만 */}
          <div
            className="absolute inset-0 bg-[#d9d9d9] opacity-50 z-40"
            onClick={() => setShowSidebar(false)}
          ></div>

          {/* 사이드바 */}
          <div
            ref={sidebarRef}
            className="absolute top-0 right-0 h-full w-48 bg-white shadow-lg border-2 border-[#C7C3C3] transform transition-transform duration-300 ease-in-out z-50"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 사이드바 메뉴 */}
            <div className="pt-6 px-4">
              <div className="space-y-2">
                <button
                  onClick={handleMyPage}
                  className="w-full text-left p-3 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
                >
                  <span className="text-gray-700">마이페이지</span>
                </button>

                <button
                  onClick={handleNotice}
                  className="w-full text-left p-3 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
                >
                  <span className="text-gray-700">공지사항</span>
                </button>

                <button
                  onClick={handleContactUs}
                  className="w-full text-left p-3 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
                >
                  <span className="text-gray-700">문의하기</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
