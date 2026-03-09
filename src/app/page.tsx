import RootPageClient from "@/components/auth/RootPageClient";
import PWAInstallPrompt from "@/components/common/PWAInstallPrompt";
import { cookies } from "next/headers";

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
  },
  alternates: {
    canonical: "https://dalcoomi.com",
  },
  other: {
    "naver-site-verification": "39c4d20da5440f7822f33fabd7022c0c98622c82",
  },
};

export default async function RootPage() {
  const cookieStore = await cookies();
  const isLoggedIn = !!cookieStore.get("accessToken");

  return (
    <>
      <RootPageClient isLoggedIn={isLoggedIn} />
      <PWAInstallPrompt />
    </>
  );
}
