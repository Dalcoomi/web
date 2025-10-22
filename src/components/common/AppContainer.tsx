// components/common/AppContainer.tsx
"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import LandingContent from "@/components/landing/LandingContent";

interface AppContainerProps {
  children: ReactNode;
}

export default function AppContainer({ children }: AppContainerProps) {
  const pathname = usePathname();
  const isRootPage = pathname === "/";

  if (isRootPage) {
    // 루트 페이지: 기존 스플릿 스크린 (page.tsx에서 처리)
    return <div className="w-full h-screen overflow-hidden">{children}</div>;
  }

  // 다른 페이지: 데스크톱에서 랜딩 + 앱 스플릿, 모바일에서 앱만
  return (
    <>
      {/* 데스크톱: Split Screen (랜딩 + 앱) */}
      <div className="hidden lg:flex w-full h-screen justify-center bg-gray-100 px-8">
        <div className="flex w-full max-w-[1000px] h-full shadow-2xl overflow-hidden bg-white">
          {/* 왼쪽: 랜딩 페이지 */}
          <div className="flex-1 h-full overflow-y-auto">
            <LandingContent />
          </div>

          {/* 오른쪽: 앱 페이지 (390px 고정) */}
          <div className="w-[390px] h-full flex-shrink-0 overflow-y-auto bg-white relative">
            {children}
          </div>
        </div>
      </div>

      {/* 모바일: 앱 페이지만 표시 */}
      <div className="lg:hidden w-full h-screen-safe max-h-[844px] relative bg-white">
        {children}
      </div>
    </>
  );
}
