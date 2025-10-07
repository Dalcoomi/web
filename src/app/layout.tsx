// app/layout.tsx

import "./globals.css";
import { cookies } from "next/headers";
import ClientProviders from "./providers";
import type { Metadata, Viewport } from "next";
import ViewportFixer from "@/components/common/ViewportFixer";

export const metadata: Metadata = {
  title: {
    default: "달쿠미 | 개인&그룹 AI 가계부",
    template: "%s - 달쿠미",
  },
  description:
    "개인과 그룹을 위한 AI 가계부 서비스. 간편한 가계부 작성, AI 영수증 분석, 그룹 작성 기능을 제공합니다.",
  generator: "Next.js",
  manifest: "/manifest.json",
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
  authors: [{ name: "달쿠미 팀" }],
  creator: "달쿠미 팀",
  publisher: "달쿠미",
  icons: [
    { rel: "apple-touch-icon", url: "/icons/icon-192x192.png" },
    { rel: "icon", url: "/icons/icon-192x192.png" },
  ],
  metadataBase: new URL("https://dalcoomi.com"),
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  minimumScale: 1,
  initialScale: 1,
  width: "device-width",
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 서버에서 쿠키 읽기
  const cookieStore = await cookies();
  const isLoggedIn = !!cookieStore.get("accessToken");

  return (
    <html lang="ko">
      <head>
        {/* Google Search Console 인증 */}
        <meta
          name="google-site-verification"
          content="tgUU4sqjYyMvAIZ0nAuQQRpPO7kKJyRj2WmsKc2_KdA"
        />

        {/* 네이버 서치어드바이저 인증 - 새로 추가 */}
        <meta
          name="naver-site-verification"
          content="39c4d20da5440f7822f33fabd7022c0c98622c82"
        />

        {/* PWA 메타 태그 */}
        <meta name="application-name" content="달쿠미" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="달쿠미" />
        <meta name="apple-touch-fullscreen" content="yes" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />

        {/* Viewport */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=5, shrink-to-fit=no, viewport-fit=cover"
        />

        {/* 구조화된 데이터 (JSON-LD) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "달쿠미",
              description: "개인과 그룹을 위한 AI 가계부 서비스",
              url: "https://dalcoomi.com",
              applicationCategory: "FinanceApplication",
              operatingSystem: "All",
              keywords: "가계부, AI 가계부, 그룹 가계부, 달쿠미, 달쿠미 가계부",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "KRW",
              },
              author: {
                "@type": "Organization",
                name: "달쿠미 팀",
              },
            }),
          }}
        />

        {/* 파비콘 및 아이콘 */}
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="icon" href="/icons/icon-192x192.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="shortcut icon" href="/favicon.ico" />

        {/* iOS 스플래시 스크린 */}
        <link
          rel="apple-touch-startup-image"
          href="/icons/splash-750x1334.png"
          media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/icons/splash-1125x2436.png"
          media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/icons/splash-1242x2208.png"
          media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />

        {/* iPhone 14 (6.1인치) */}
        <link
          rel="apple-touch-startup-image"
          href="/icons/splash-1170x2532.png"
          media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />

        {/* iPhone 14 Plus (6.7인치) */}
        <link
          rel="apple-touch-startup-image"
          href="/icons/splash-1284x2778.png"
          media="(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />

        {/* iPhone 14 Pro, 15 (6.1인치) */}
        <link
          rel="apple-touch-startup-image"
          href="/icons/splash-1179x2556.png"
          media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />

        {/* iPhone 14 Pro Max (6.7인치) */}
        <link
          rel="apple-touch-startup-image"
          href="/icons/splash-1290x2796.png"
          media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />
      </head>
      <body className="flex justify-center items-center min-h-screen bg-white">
        <ViewportFixer />
        <div className="w-full max-w-[390px] h-screen-safe max-h-[844px] relative overflow-hidden shadow-lg bg-white">
          <ClientProviders isLoggedIn={isLoggedIn}>{children}</ClientProviders>
        </div>
      </body>
    </html>
  );
}
