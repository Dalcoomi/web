// app/page.tsx (루트 페이지 - 로그인)
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import LoginPageClient from "@/components/auth/LoginPageClient";

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
  const accessToken = cookieStore.get("accessToken");

  // 이미 로그인된 경우 개인 거래 페이지로 리다이렉트
  if (accessToken) {
    redirect("/transaction/my");
  }

  // 로그인되지 않은 경우 로그인 페이지 표시
  return <LoginPageClient />;
}
