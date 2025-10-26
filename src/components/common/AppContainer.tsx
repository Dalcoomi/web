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
    <div className="w-full h-screen bg-gray-100">
      {/* 전체 레이아웃 컨테이너 */}
      <div className="h-full flex justify-center lg:px-8">
        <div className="w-full max-w-[390px] lg:max-w-[1000px] h-full lg:shadow-2xl bg-white flex">
          {/* 왼쪽: 랜딩 페이지 (데스크톱에서만 표시) */}
          <div className="hidden lg:block lg:flex-1 h-full overflow-y-auto">
            <LandingContent />
          </div>

          {/* 오른쪽: 앱 페이지 (390px 고정) */}
          <div className="w-full lg:w-[390px] h-full overflow-y-auto bg-white relative shadow-lg lg:shadow-none">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
