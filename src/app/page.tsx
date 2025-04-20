import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-6">모바일 웹 앱</h1>
      <p className="text-gray-600 mb-8 text-center">
        Next.js, TypeScript, Tailwind CSS로 구축된 모바일 웹 애플리케이션입니다.
      </p>

      <div className="grid gap-4">
        <button className="btn btn-primary w-full">시작하기</button>
        <Link href="/about" className="text-blue-500 text-center">
          더 알아보기
        </Link>
      </div>
    </main>
  );
}
