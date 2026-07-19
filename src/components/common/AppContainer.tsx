// components/common/AppContainer.tsx
"use client";

import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import LandingContent from "@/components/landing/LandingContent";
import ToastContainer from "@/components/ui/ToastContainer";
import { isDemoMode } from "@/utils/demoMode";
import { isAuthenticated } from "@/utils/tokenManager";

interface AppContainerProps {
  children: ReactNode;
}

export default function AppContainer({ children }: AppContainerProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isRootPage = pathname === "/";
  const [isDesktop, setIsDesktop] = useState(false);
  const [isAccessResolved, setIsAccessResolved] = useState(isRootPage);

  useEffect(() => {
    const requiresAppAccess =
      pathname.startsWith("/transaction") || pathname.startsWith("/group");

    if (!requiresAppAccess || isAuthenticated() || isDemoMode()) {
      setIsAccessResolved(true);
      return;
    }

    setIsAccessResolved(false);
    router.replace("/");
  }, [pathname, router]);

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

  if (!isAccessResolved) {
    return <div className="h-screen w-full bg-white" aria-hidden="true" />;
  }

  if (isRootPage) {
    // 루트 페이지: 기존 스플릿 스크린 (page.tsx에서 처리)
    return <div className="w-full h-screen overflow-hidden">{children}</div>;
  }

  // 다른 페이지: 데스크톱에서 랜딩 + 앱 스플릿, 모바일에서 앱만
  return (
    <div className="w-full h-screen bg-gray-100">
      {/* 전체 레이아웃 컨테이너 */}
      <div className="h-full flex justify-center" style={{ padding: isDesktop ? '0 2rem' : '0' }}>
        <div
          className="h-full bg-white flex"
          style={{
            width: '100%',
            maxWidth: isDesktop ? '1000px' : '430px',
            boxShadow: isDesktop ? '0 25px 50px -12px rgb(0 0 0 / 0.25)' : 'none'
          }}
        >
          {/* 왼쪽: 랜딩 페이지 (화면 1024px 이상에서만 표시) */}
          {isDesktop && (
            <div className="h-full overflow-y-auto" style={{ flex: 1 }}>
              <LandingContent />
            </div>
          )}

          {/* 오른쪽: 앱 페이지 (390px 고정) */}
          <div
            className="h-full overflow-y-auto bg-white relative"
            style={{
              width: isDesktop ? '390px' : '100%',
              boxShadow: isDesktop ? 'none' : '0 10px 15px -3px rgb(0 0 0 / 0.1)'
            }}
          >
            <ToastContainer />
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
