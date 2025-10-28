// components/auth/RootPageClient.tsx
"use client";

import { useEffect, useState } from "react";
import LoginPageClient from "@/components/auth/LoginPageClient";
import LandingContent from "@/components/landing/LandingContent";

export default function RootPageClient() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const updateWidth = () => {
      const width = window.innerWidth;
      const isDesktopSize = width >= 1024;
      setIsDesktop(isDesktopSize);
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);

    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  return (
    <div className="w-full h-screen bg-gray-100">
      {/* 전체 레이아웃 컨테이너 */}
      <div className="h-full flex justify-center" style={{ padding: isDesktop ? '0 2rem' : '0' }}>
        <div
          className="h-full bg-white flex"
          style={{
            width: '100%',
            maxWidth: isDesktop ? '1000px' : '390px',
            boxShadow: isDesktop ? '0 25px 50px -12px rgb(0 0 0 / 0.25)' : 'none'
          }}
        >
          {/* 왼쪽: 랜딩 페이지 (화면 1024px 이상에서만 표시) */}
          {isDesktop && (
            <div className="h-full overflow-y-auto" style={{ flex: 1 }}>
              <LandingContent />
            </div>
          )}

          {/* 오른쪽: 로그인 페이지 (390px 고정) */}
          <div
            className="h-full overflow-y-auto bg-white relative"
            style={{
              width: isDesktop ? '390px' : '100%',
              boxShadow: isDesktop ? 'none' : '0 10px 15px -3px rgb(0 0 0 / 0.1)'
            }}
          >
            <LoginPageClient />
          </div>
        </div>
      </div>
    </div>
  );
}
