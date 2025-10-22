// app/page.tsx (루트 페이지 - 랜딩 + 로그인)
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import LoginPageClient from "@/components/auth/LoginPageClient";
import LandingContent from "@/components/landing/LandingContent";
import PWAInstallPrompt from "@/components/common/PWAInstallPrompt";

export const metadata = {
  description:
    "개인과 그룹을 위한 AI 가계부 서비스. 간편한 가계부 작성, AI 영수증 분석, 그룹 작성 기능을 제공합니다. 지금 시작해보세요!",
  keywords: [
    "가계부",
    "달쿠미",
    "dalcoomi",
    "달쿠미 가계부",
    "개인가계부",
    "그룹가계부",
    "가계관리",
    "AI 가계부",
    "지출관리",
    "예산관리",
  ],
  openGraph: {
    title: "달쿠미 | 개인&그룹 AI 가계부",
    description:
      "개인과 그룹을 위한 AI 가계부 서비스. 간편한 가계부 작성과 지출 분석을 제공합니다.",
    url: "https://dalcoomi.com",
    siteName: "달쿠미",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "달쿠미 AI 가계부 서비스",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "달쿠미 | 개인&그룹 AI 가계부",
    description: "개인과 그룹을 위한 AI 가계부 서비스",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  alternates: {
    canonical: "https://dalcoomi.com",
  },
};

export default async function RootPage() {
  // 서버에서 인증 확인
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refreshToken");

  // 🔥 리프레시 토큰이 있으면 로그인된 상태로 간주 (액세스 토큰은 클라이언트에서 재발급)
  if (refreshToken) {
    redirect("/transaction/my");
  }

  // 로그인되지 않은 경우 랜딩 + 로그인 페이지 표시
  return (
    <>
      {/* 데스크톱: Split Screen (랜딩 + 로그인) - 중앙 정렬 */}
      <div className="hidden lg:flex w-full h-screen justify-center bg-gray-100 px-8">
        <div className="flex w-full max-w-[1000px] h-full shadow-2xl overflow-hidden bg-white">
          {/* 왼쪽: 랜딩 페이지 */}
          <div className="flex-1 h-full overflow-y-auto">
            <LandingContent />
          </div>

          {/* 오른쪽: 로그인 페이지 (390px 고정) */}
          <div className="w-[390px] h-full flex-shrink-0 overflow-y-auto relative">
            <LoginPageClient />
          </div>
        </div>
      </div>

      {/* 모바일: 로그인 페이지만 표시 */}
      <div className="lg:hidden w-full h-full">
        <LoginPageClient />
      </div>

      {/* PWA 설치 프롬프트 */}
      <PWAInstallPrompt />
    </>
  );
}
