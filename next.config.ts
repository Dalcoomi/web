import type { NextConfig } from "next";
import path from "path";
import dotenv from "dotenv";
import withPWAInit from "@ducanh2912/next-pwa";

function loadEnvironmentConfig() {
  const appEnv = process.env.APP_ENV || "local";

  dotenv.config({
    path: path.resolve("./env-config/.env"),
  });

  let envFile = ".env.local";
  if (appEnv === "prod") {
    envFile = ".env.prod";
  } else if (appEnv === "dev") {
    envFile = ".env.dev";
  }

  dotenv.config({
    path: path.resolve(`./env-config/${envFile}`),
  });
}

loadEnvironmentConfig();

const nextConfig: NextConfig = {
  turbopack: {},
  async redirects() {
    return [
      {
        source: "/login",
        destination: "/",
        permanent: true,
      },
    ];
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

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  disable: process.env.APP_ENV !== "prod",
  workboxOptions: {
    skipWaiting: true,
    exclude: [/middleware-manifest\.json$/, /proxy-manifest\.json$/],
    runtimeCaching: [
      {
        urlPattern: /^https?.*\.(png|jpg|jpeg|svg|gif|webp)$/,
        handler: "NetworkFirst",
        options: {
          cacheName: "image-cache",
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 60 * 60 * 24,
          },
        },
      },
    ],
  },
});

export default withPWA(nextConfig);
