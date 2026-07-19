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
    const clientAuth = isAuthenticated();

    if (isLoggedIn !== clientAuth) {
      if (!clientAuth && pathname.startsWith("/profile")) {
        router.replace("/");
      }
    }
  }, [pathname, isLoggedIn, router]);

  return <>{children}</>;
}
