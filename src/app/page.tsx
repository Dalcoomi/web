// app/page.tsx (루트 페이지 - 랜딩 + 로그인)
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import RootPageClient from "@/components/auth/RootPageClient";
import PWAInstallPrompt from "@/components/common/PWAInstallPrompt";

export const metadata = {
  title: "달쿠미 | 개인&그룹 가계부",
  description:
    "개인과 그룹을 위한 가계부 서비스 달쿠미. 간편한 가계부 작성과 AI 영수증 분석, 그룹 가계부로 스마트한 지출 관리를 시작해 보세요!",
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
    "무료 가계부",
    "가계부 앱",
    "영수증 분석",
    "재무관리",
  ],
  openGraph: {
    title: "달쿠미 | 개인&그룹 가계부",
    description:
      "개인과 그룹을 위한 가계부 서비스 달쿠미. 간편한 가계부 작성과 AI 영수증 분석, 그룹 가계부로 스마트한 지출 관리를 시작해 보세요!",
    url: "https://dalcoomi.com",
    siteName: "달쿠미",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "달쿠미 가계부 서비스 - 개인과 그룹을 위한 스마트 가계부",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "달쿠미 | 개인&그룹 가계부",
    description: "개인과 그룹을 위한 가계부 서비스 달쿠미",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
    "naver-site-verification": "39c4d20da5440f7822f33fabd7022c0c98622c82",
  },
  alternates: {
    canonical: "https://dalcoomi.com",
  },
  other: {
    "naver-site-verification": "39c4d20da5440f7822f33fabd7022c0c98622c82",
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
      <RootPageClient />
      {/* PWA 설치 프롬프트 */}
      <PWAInstallPrompt />
    </>
  );
}
