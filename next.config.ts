// next.config.ts

import type { NextConfig } from "next";
import path from "path";
import dotenv from "dotenv";

// 환경 설정 로드 함수
function loadEnvironmentConfig() {
  const isDevelopment = process.env.NODE_ENV !== "production";

  // 기본 공용 설정 로드
  dotenv.config({
    path: path.resolve("./env-config/.env"),
  });

  // 환경별 설정 로드 (기본값 덮어쓰기)
  const envFile = isDevelopment ? ".env.local" : ".env.production";

  dotenv.config({
    path: path.resolve(`./env-config/${envFile}`),
  });
}

// 환경 설정 로드 실행
loadEnvironmentConfig();

// next-pwa를 ES6 방식으로 import
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "dalcoomi.s3.ap-northeast-2.amazonaws.com",
      },
    ],
  },
};

export default withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  buildExcludes: [/middleware-manifest\.json$/],
  runtimeCaching: [
    {
      // 이미지 파일만 캐싱 (영수증 업로드는 제외)
      urlPattern: /^https?.*\.(png|jpg|jpeg|svg|gif|webp)$/,
      handler: "NetworkFirst",
      options: {
        cacheName: "image-cache",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24, // 24 hours
        },
      },
    },
    {
      // 🔥 모든 API 요청은 Service Worker를 거치지 않고 직접 네트워크로
      // GET, POST, PUT, DELETE, PATCH 모두 포함
      urlPattern: ({ url }) => {
        return (
          url.pathname.includes("/api/") ||
          url.hostname.includes("api.dalcoomi.com") ||
          url.hostname.includes("dalcoomi.s3.ap-northeast-2.amazonaws.com")
        );
      },
      handler: "NetworkOnly",
    },
  ],
})(nextConfig);
