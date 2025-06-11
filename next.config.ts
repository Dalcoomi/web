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

  console.log(
    `✅ Loaded environment: ${isDevelopment ? "development" : "production"}`
  );
}

// 환경 설정 로드 실행
loadEnvironmentConfig();

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // 빌드 시 ESLint 무시
  },
  typescript: {
    ignoreBuildErrors: true, // 빌드 시 TypeScript 에러 무시
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

export default nextConfig;
