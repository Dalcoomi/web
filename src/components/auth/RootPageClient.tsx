// components/auth/RootPageClient.tsx
"use client";

import LoginPageClient from "@/components/auth/LoginPageClient";
import LandingContent from "@/components/landing/LandingContent";

export default function RootPageClient() {
  return (
    <div className="w-full h-screen bg-gray-100">
      {/* 전체 레이아웃 컨테이너 */}
      <div className="h-full flex justify-center lg:px-8">
        <div className="w-full max-w-[390px] lg:max-w-[1000px] h-full lg:shadow-2xl bg-white flex">
          {/* 왼쪽: 랜딩 페이지 (화면 1024px 이상에서만 표시) */}
          <div className="hidden lg:block lg:flex-1 h-full overflow-y-auto">
            <LandingContent />
          </div>

          {/* 오른쪽: 로그인 페이지 (390px 고정) */}
          <div className="w-full lg:w-[390px] h-full overflow-y-auto bg-white relative shadow-lg lg:shadow-none">
            <LoginPageClient />
          </div>
        </div>
      </div>
    </div>
  );
}
