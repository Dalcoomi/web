// app/providers.tsx
"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
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

  useEffect(() => {
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

  return <>{children}</>;
}
