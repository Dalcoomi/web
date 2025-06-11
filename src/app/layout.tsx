// app/layout.tsx
import "./globals.css";
import { cookies } from "next/headers";
import ClientProviders from "./providers";

export const metadata = {
  title: {
    default: "달쿠미",
    template: "달쿠미 | %s",
  },
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
      <body className="flex justify-center items-center min-h-screen">
        {/* 모바일 앱 스타일 컨테이너 - 모든 페이지에서 동일한 크기와 스타일 유지 */}
        <div className="w-full max-w-[390px] h-screen max-h-[844px] relative overflow-hidden shadow-lg">
          <ClientProviders isLoggedIn={isLoggedIn}>{children}</ClientProviders>
        </div>
      </body>
    </html>
  );
}
