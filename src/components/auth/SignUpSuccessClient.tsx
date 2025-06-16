// components/auth/SignUpSuccessClient.tsx
"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";

export default function SignUpSuccessClient() {
  const router = useRouter();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(2);
  const [loginProcessed, setLoginProcessed] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // 세션 데이터 정리 함수
  const clearSessionData = () => {
    // 회원가입 과정에서 사용된 모든 데이터 삭제
    sessionStorage.removeItem("socialLoginData");
    sessionStorage.removeItem("agreementData");
    sessionStorage.removeItem("signupStep1Completed");
  };

  // 완전 정리 함수 (모든 세션 데이터 제거)
  const clearAllSessionData = () => {
    clearSessionData();
    sessionStorage.removeItem("signupResponse");
    sessionStorage.removeItem("signupStep2Completed");
  };

  // 페이지 접근 및 초기화
  useEffect(() => {
    const checkAccess = async () => {
      // 회원가입 완료 여부 확인
      const step2Completed = sessionStorage.getItem("signupStep2Completed");
      if (!step2Completed) {
        router.replace("/sign-up/step1");
        return;
      }

      // 회원가입 응답 데이터 확인
      const signupResponseJson = sessionStorage.getItem("signupResponse");
      if (!signupResponseJson) {
        router.replace("/sign-up/step1");
        return;
      }

      // 로그인 처리
      try {
        const response = JSON.parse(signupResponseJson);

        if (response.accessToken) {
          // 토큰 저장 및 로그인 상태 업데이트
          login(response.accessToken, response.refreshToken);
          setLoginProcessed(true);
        }
      } catch (error) {}

      // 나머지 세션 데이터 정리
      clearSessionData();

      // 로딩 상태 해제
      setIsLoading(false);
    };

    checkAccess();
  }, [router, login]);

  // 카운트다운 및 자동 이동
  useEffect(() => {
    if (isLoading || !loginProcessed) return;

    // 카운트다운
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // 3초 후 페이지 이동
    timeoutRef.current = setTimeout(() => {
      // 모든 세션 데이터 제거
      clearAllSessionData();

      // 내 거래 페이지로 이동
      router.push("/transaction/my");
    }, 2000);

    // 클린업
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isLoading, loginProcessed, router]);

  // 로딩 중이면 로딩 표시
  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <div className="text-center">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full w-full relative">
      {/* 배경 이미지가 전체 화면을 채우도록 설정 */}
      <div className="absolute inset-0 w-full h-full flex items-center justify-center">
        <Image
          src="/images/auth/회원가입_완료.svg"
          alt="회원가입 완료"
          width={414}
          height={680}
          priority
          className="w-full h-full object-cover"
        />
      </div>

      {/* 카운트다운 메시지 (배경 위에 표시) */}
      <div className="absolute top-10 left-0 right-0 text-center">
        <div className="bg-white/80 mx-auto py-2 px-6 rounded-full inline-block backdrop-blur-sm">
          <p className="font-medium">
            {timeLeft}초 후 메인 화면으로 이동합니다
          </p>
        </div>
      </div>
    </div>
  );
}
