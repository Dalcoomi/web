// next.config.ts

import type { NextConfig } from "next";
import path from "path";
import dotenv from "dotenv";

// 환경 설정 로드 함수
function loadEnvironmentConfig() {
  const nodeEnv = process.env.NODE_ENV;

  // 기본 공용 설정 로드
  dotenv.config({
    path: path.resolve("./env-config/.env"),
  });

  // 환경별 설정 로드 (기본값 덮어쓰기)
  let envFile = ".env.local"; // 기본값

  if (nodeEnv === "production") {
    envFile = ".env.production";
  } else if (nodeEnv === "development") {
    envFile = ".env.development";
  }

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
  ],
})(nextConfig);
