"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function SignUpSuccess() {
  const router = useRouter();

  useEffect(() => {
    // 5초 후 메인 페이지로 자동 이동
    const timer = setTimeout(() => {
      router.push("/");
    }, 5000);

    // 컴포넌트 언마운트 시 타이머 정리
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen bg-[#f0fef9]">
      {/* 전체 SVG 이미지 */}
      <Image
        src="/images/signup-success.svg"
        alt="회원가입 완료"
        width={414}
        height={680}
        priority
      />
    </div>
  );
}
