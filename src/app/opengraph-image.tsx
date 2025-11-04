// app/opengraph-image.tsx
import { ImageResponse } from "next/og";

// 이미지 메타데이터
export const alt = "달쿠미 AI 가계부 서비스 - 개인과 그룹을 위한 스마트 가계부";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

// 이미지 생성
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 64,
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 120,
            fontWeight: "bold",
            marginBottom: 20,
          }}
        >
          달쿠미
        </div>
        <div
          style={{
            fontSize: 48,
            opacity: 0.9,
            textAlign: "center",
          }}
        >
          개인&그룹 AI 가계부
        </div>
        <div
          style={{
            fontSize: 32,
            opacity: 0.8,
            marginTop: 30,
            textAlign: "center",
          }}
        >
          스마트한 지출 관리를 시작해보세요
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
