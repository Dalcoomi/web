// app/sitemap.ts

import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://dalcoomi.com";
  const currentDate = new Date();

  return [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    // 추가 공개 페이지가 있다면 여기에 추가
    // 예: 이용약관, 개인정보처리방침 등
  ];
}
