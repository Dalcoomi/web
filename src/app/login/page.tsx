"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { kakaoLogin } from "@/services/authService";

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoggedIn, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  // 컴포넌트 마운트 시 로그인 상태 확인
  useEffect(() => {
    // 인증 상태 로딩 중이면 아직 체크하지 않음
    if (authLoading) return;

    // 이미 로그인 상태면 메인 페이지로 리디렉션
    if (isLoggedIn) {
      router.replace("/main");
      return;
    }

    // 페이지 로딩 완료 표시
    setPageLoading(false);
  }, [authLoading, isLoggedIn, router]);

  // 카카오 로그인 처리 함수
  const handleKakaoLogin = () => {
    const KAKAO_REST_API_KEY = process.env.NEXT_PUBLIC_KAKAO_API_KEY;
    const REDIRECT_URI = `${window.location.origin}/api/auth/kakao/callback`;

    // 팝업 창 크기 설정
    const width = 500;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    // 카카오 인증 URL
    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_REST_API_KEY}&redirect_uri=${REDIRECT_URI}&response_type=code`;

    // 팝업 창 열기
    const popup = window.open(
      kakaoAuthUrl,
      "kakaoLogin",
      `width=${width},height=${height},left=${left},top=${top}`
    );

    // 팝업 창 모니터링
    const checkPopup = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(checkPopup);
        console.log("카카오 로그인 창이 닫혔습니다.");
      }
    }, 1000);

    // 팝업 창에서 메시지 수신 설정
    window.addEventListener("message", receiveMessage, false);

    // 팝업 창으로부터 메시지 수신 처리
    function receiveMessage(event) {
      // 메시지 출처 확인 (보안)
      if (event.origin !== window.location.origin) return;

      if (event.data.type === "kakaoLogin") {
        if (event.data.success) {
          // 로그인 성공 처리
          console.log("카카오 로그인 성공:", event.data.userData);

          // 백엔드로 데이터 전송
          sendToBackend(event.data.userData);
        } else {
          // 로그인 실패 처리
          console.error("카카오 로그인 실패:", event.data.error);
          alert(`로그인 실패: ${event.data.error}`);
        }

        // 더 이상 메시지를 받지 않음
        window.removeEventListener("message", receiveMessage, false);
      }
    }
  };

  // 백엔드로 데이터 전송
  const sendToBackend = async (userData) => {
    try {
      setIsLoading(true);

      // 백엔드 요청 형식에 맞게 데이터 구성
      const requestData = {
        socialId: userData.kakaoId.toString(),
        socialType: "KAKAO",
      };

      try {
        // API 서비스를 통한 로그인 요청
        const response = await kakaoLogin(requestData);

        // 로그인 성공 처리
        console.log("로그인 성공:", response);

        // 토큰 저장 및 로그인 상태 업데이트
        login(response.accessToken, response.refreshToken);

        // 메인 페이지로 리디렉션
        router.push("/main");
      } catch (error) {
        // API 에러 처리
        if (error.message === "존재하지 않는 회원입니다.") {
          // 소셜 로그인 정보를 로컬 스토리지에 저장
          sessionStorage.setItem(
            "socialLoginData",
            JSON.stringify({
              socialId: userData.kakaoId.toString(),
              socialType: "KAKAO",
              email: userData.email || null,
              nickname: userData.nickname || null,
              profileImage: userData.profileImage || null,
            })
          );

          // 회원가입을 위한 리디렉션
          router.push("/sign-up/step1");
        } else {
          alert(`로그인 실패: ${error.message}`);
        }
      }
    } catch (error) {
      console.error("백엔드 요청 오류:", error);
      alert(
        "로그인 처리 중 오류가 발생했습니다. 네트워크 연결을 확인해주세요."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 로딩 중이면 로딩 표시
  if (authLoading || pageLoading || isLoading) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <div className="text-center">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* 배경 이미지 */}
      <div className="inset-0 w-full h-full z-0">
        <Image
          src="/images/login-background.svg"
          alt="로그인 배경"
          width={390}
          height={700}
        />
      </div>

      {/* 로그인 버튼들 */}
      <div className="absolute w-full bottom-7 flex flex-col items-center space-y-4 z-10">
        {/* 네이버 로그인 버튼 (비활성화) */}
        <button className="w-[180px] cursor-pointer">
          <Image
            src="/images/네이버 버튼1.svg"
            alt="네이버 로그인"
            width={160}
            height={40}
            className="w-full"
          />
        </button>

        {/* 카카오 로그인 버튼 */}
        <button className="w-[180px] cursor-pointer" onClick={handleKakaoLogin}>
          <Image
            src="/images/카카오 버튼1.svg"
            alt="카카오 로그인"
            width={160}
            height={41}
            className="w-full"
          />
        </button>
      </div>
    </div>
  );
}
