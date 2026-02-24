"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import LoginPageClient from "@/components/auth/LoginPageClient";
import LandingContent from "@/components/landing/LandingContent";
import MyTransactionPageClient from "@/components/transaction/my/MyTransactionPageClient";
import ToastContainer from "@/components/ui/ToastContainer";

export default function RootPageClient() {
  const searchParams = useSearchParams();
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const updateWidth = () => {
      const width = window.innerWidth;
      const isDesktopSize = width >= 1024;
      setIsDesktop(isDesktopSize);
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);

    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const isLoginPanelRequested = searchParams.get("panel") === "login";
  const hasAuthCallbackParams =
    searchParams.get("kakao_login") === "success" ||
    searchParams.get("naver_login") === "success" ||
    !!searchParams.get("user_data") ||
    !!searchParams.get("error");
  const isLoginPanel = isLoginPanelRequested || hasAuthCallbackParams;

  return (
    <div className="w-full h-screen bg-gray-100">
      <div
        className="h-full flex justify-center"
        style={{ padding: isDesktop ? "0 2rem" : "0" }}
      >
        <div
          className="h-full bg-white flex"
          style={{
            width: "100%",
            maxWidth: isDesktop ? "1000px" : "390px",
            boxShadow: isDesktop ? "0 25px 50px -12px rgb(0 0 0 / 0.25)" : "none",
          }}
        >
          {isDesktop && (
            <div className="h-full overflow-y-auto" style={{ flex: 1 }}>
              <LandingContent />
            </div>
          )}

          <div
            className="h-full overflow-y-auto bg-white relative"
            style={{
              width: isDesktop ? "390px" : "100%",
              boxShadow: isDesktop ? "none" : "0 10px 15px -3px rgb(0 0 0 / 0.1)",
            }}
          >
            <ToastContainer />
            {isLoginPanel ? <LoginPageClient /> : <MyTransactionPageClient />}
          </div>
        </div>
      </div>
    </div>
  );
}
