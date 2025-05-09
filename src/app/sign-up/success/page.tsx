"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";

export default function SignUpSuccess() {
  const router = useRouter();
  const { login, isLoggedIn, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(2);

  // 세션 데이터 정리 함수
  const clearSessionData = () => {
    // 회원가입 과정에서 사용된 모든 데이터 삭제 (signupResponse와 signupStep2Completed 제외)
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

  // 로그인 토큰 처리 함수
  const processLogin = () => {
    const signupResponseJson = sessionStorage.getItem("signupResponse");
    if (signupResponseJson) {
      try {
        const response = JSON.parse(signupResponseJson);
        if (response.accessToken) {
          // 토큰 저장 및 로그인 상태 업데이트
          login(response.accessToken, response.refreshToken);
          // 사용 후 토큰 데이터 삭제
          sessionStorage.removeItem("signupResponse");
        }
      } catch (error) {
        console.error("토큰 처리 중 오류 발생:", error);
      }
    }
  };

  // 페이지 접근 및 초기화
  useEffect(() => {
    if (authLoading) return;

    const checkAccess = () => {
      // 이미 로그인 상태이면 성공 페이지 표시 (회원가입 직후 로그인된 경우)
      if (isLoggedIn) {
        clearSessionData();
        setIsLoading(false);
        return;
      }

      // 회원가입 완료 여부 확인
      const step2Completed = sessionStorage.getItem("signupStep2Completed");
      if (!step2Completed) {
        console.log("회원가입이 완료되지 않았습니다. 첫 단계로 이동합니다.");
        router.replace("/sign-up/step1");
        return;
      }

      // 회원가입 응답 데이터 확인
      const signupResponseJson = sessionStorage.getItem("signupResponse");
      if (!signupResponseJson) {
        console.log("회원가입 데이터가 없습니다. 첫 단계로 이동합니다.");
        router.replace("/sign-up/step1");
        return;
      }

      // 토큰 처리 (로그인)
      processLogin();

      // 나머지 세션 데이터 정리
      clearSessionData();

      // 로딩 상태 해제
      setIsLoading(false);
    };

    checkAccess();
  }, [authLoading, isLoggedIn, login, router]);

  // 카운트다운 및 자동 이동
  useEffect(() => {
    if (isLoading) return;

    // 카운트다운 및 자동 이동 처리
    const countdownInterval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);

          // 모든 세션 데이터 제거 (회원가입 과정 완전히 종료)
          clearAllSessionData();

          // 홈페이지로 이동
          router.push("/main");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // 컴포넌트 언마운트 시 타이머 정리 및 세션 데이터 정리
    return () => {
      clearInterval(countdownInterval);
      clearAllSessionData();
    };
  }, [isLoading, router]);

  // 로딩 중이면 로딩 표시
  if (authLoading || isLoading) {
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
          src="/images/signup-success.svg"
          alt="회원가입 완료"
          width={414}
          height={680}
          priority
          className="w-full h-full object-cover"
        />
      </div>

      {/* 카운트다운 메시지 (배경 위에 표시) */}
      <div className="absolute bottom-8 left-0 right-0 text-center">
        <div className="bg-white/80 mx-auto py-2 px-6 rounded-full inline-block backdrop-blur-sm">
          <p className="text-gray-700 font-medium">
            {timeLeft}초 후 메인 화면으로 이동합니다
          </p>
        </div>
      </div>
    </div>
  );
}
