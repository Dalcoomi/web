// app/providers.tsx
"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { isAuthenticated } from "@/utils/tokenManager";

interface ClientProvidersProps {
  children: React.ReactNode;
  isLoggedIn: boolean;
}

export default function ClientProviders({
  children,
  isLoggedIn,
}: ClientProvidersProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // 클라이언트 사이드가 준비되었는지 확인
    setIsReady(true);

    // 클라이언트에서 인증 상태 확인
    const clientAuth = isAuthenticated();

    // 인증 상태 불일치 처리
    if (isLoggedIn !== clientAuth) {
      // 미인증 상태에서 보호된 경로 접근
      if (!clientAuth && pathname.startsWith("/transaction")) {
        router.replace("/");
      }
      // 인증된 상태에서 루트 페이지 접근
      else if (clientAuth && pathname === "/") {
        router.replace("/transaction/my");
      }
    }
  }, [pathname, isLoggedIn, router]);

  // 클라이언트가 준비될 때까지 로딩 표시
  if (!isReady) {
    return (
      <div className="flex items-center justify-center w-full h-screen">
        <div className="text-center">로딩 중...</div>
      </div>
    );
  }

  return <>{children}</>;
}
