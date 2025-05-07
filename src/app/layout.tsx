import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, user-scalable=no"
        />
      </head>
      <body className="flex justify-center items-center min-h-screen">
        {/* 모바일 앱 스타일 컨테이너 - 모든 페이지에서 동일한 크기와 스타일 유지 */}
        <div className="w-full max-w-[390px] h-screen max-h-[844px] relative overflow-hidden shadow-lg">
          {children}
        </div>
      </body>
    </html>
  );
}
