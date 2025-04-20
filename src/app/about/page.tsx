import Link from "next/link";

export default function About() {
  return (
    <main className="flex min-h-screen flex-col p-4">
      <h1 className="text-2xl font-bold mb-4">소개</h1>
      <p className="mb-4">
        이 애플리케이션은 Next.js, TypeScript, Tailwind CSS를 사용하여
        구축되었습니다.
      </p>
      <p className="mb-4">
        모바일 환경에 최적화된 웹 애플리케이션으로, 반응형 디자인을
        적용하였습니다.
      </p>

      <Link href="/" className="mt-6 text-blue-500">
        ← 홈으로 돌아가기
      </Link>
    </main>
  );
}
