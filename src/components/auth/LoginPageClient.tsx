// components/auth/LoginPageClient.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { socialLogin } from "@/services/authService";

export default function LoginPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // 카카오톡 인앱 브라우저 감지 함수
  const isKakaoTalkBrowser = () => {
    const userAgent = navigator.userAgent;
    return /KAKAOTALK/i.test(userAgent);
  };

  // 페이지 로드 시 쿼리 파라미터 확인 (소셜 로그인 콜백 처리)
  useEffect(() => {
    const kakaoLogin = searchParams.get("kakao_login");
    const naverLogin = searchParams.get("naver_login");
    const userData = searchParams.get("user_data");
    const error = searchParams.get("error");

    if (error) {
      alert(`로그인 실패: ${decodeURIComponent(error)}`);
      // URL 정리
      window.history.replaceState({}, "", window.location.pathname);
      return;
    }

    if (kakaoLogin === "success" && userData) {
      const userInfo = JSON.parse(decodeURIComponent(userData));
      sendToBackend(userInfo, "KAKAO");
      // URL 정리
      window.history.replaceState({}, "", window.location.pathname);
    }

    if (naverLogin === "success" && userData) {
      const userInfo = JSON.parse(decodeURIComponent(userData));
      sendToBackend(userInfo, "NAVER");
      // URL 정리
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [searchParams]);

  // 카카오 로그인 처리 함수
  const handleKakaoLogin = () => {
    const KAKAO_REST_API_KEY = process.env.NEXT_PUBLIC_KAKAO_API_KEY;
    const REDIRECT_URI = process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI;

    if (isKakaoTalkBrowser()) {
      // 카카오톡 인앱 브라우저에서는 리다이렉트 방식 사용
      const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_REST_API_KEY}&redirect_uri=${REDIRECT_URI}&response_type=code`;
      window.location.href = kakaoAuthUrl;
      return;
    }

    // 일반 브라우저에서는 팝업 방식 유지 (사용자 경험 개선)
    handleKakaoPopupLogin();
  };

  // 카카오 팝업 로그인 (일반 브라우저용)
  const handleKakaoPopupLogin = () => {
    const KAKAO_REST_API_KEY = process.env.NEXT_PUBLIC_KAKAO_API_KEY;
    const REDIRECT_URI = process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI;

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

    // 팝업 창이 열리지 않은 경우 처리
    if (!popup) {
      alert("팝업이 차단되었습니다. 팝업 차단을 해제해주세요.");
      return;
    }

    // 팝업 창 모니터링
    const checkPopup = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(checkPopup);
        console.log("카카오 로그인 창이 닫혔습니다.");
        window.removeEventListener("message", receiveKakaoMessage, false);
      }
    }, 500);

    // 30초 후 자동으로 팝업 체크 중단
    setTimeout(() => {
      if (popup && !popup.closed) {
        console.log("카카오 로그인 타임아웃");
      }
      clearInterval(checkPopup);
      window.removeEventListener("message", receiveKakaoMessage, false);
    }, 30000);

    // 팝업 창에서 메시지 수신 설정
    window.addEventListener("message", receiveKakaoMessage, false);

    // 팝업 창으로부터 메시지 수신 처리
    function receiveKakaoMessage(event) {
      if (event.origin !== window.location.origin) return;

      if (event.data.type === "kakaoLogin") {
        if (event.data.success) {
          console.log("카카오 로그인 성공:", event.data.userData);
          sendToBackend(event.data.userData, "KAKAO");
        } else {
          if (event.data.cancelled) {
            console.log("사용자가 카카오 로그인을 취소했습니다.");
          } else {
            console.error("카카오 로그인 실패:", event.data.error);
            alert(`로그인 실패: ${event.data.error}`);
          }
        }

        if (popup && !popup.closed) {
          popup.close();
        }

        window.removeEventListener("message", receiveKakaoMessage, false);
        clearInterval(checkPopup);
      }
    }
  };

  // 네이버 로그인 처리 함수
  const handleNaverLogin = () => {
    const NAVER_CLIENT_ID = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID;
    const REDIRECT_URI = process.env.NEXT_PUBLIC_NAVER_REDIRECT_URI;
    const STATE = Math.random().toString(36).substring(2, 15);

    if (isKakaoTalkBrowser()) {
      // 카카오톡 인앱 브라우저에서는 리다이렉트 방식 사용
      const naverAuthUrl = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${NAVER_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&state=${STATE}`;
      window.location.href = naverAuthUrl;
      return;
    }

    // 일반 브라우저에서는 팝업 방식 유지
    handleNaverPopupLogin();
  };

  // 네이버 팝업 로그인 (일반 브라우저용)
  const handleNaverPopupLogin = () => {
    const NAVER_CLIENT_ID = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID;
    const REDIRECT_URI = process.env.NEXT_PUBLIC_NAVER_REDIRECT_URI;
    const STATE = Math.random().toString(36).substring(2, 15);

    // 팝업 창 크기 설정
    const width = 500;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    // 네이버 인증 URL
    const naverAuthUrl = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${NAVER_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&state=${STATE}`;

    // 팝업 창 열기
    const popup = window.open(
      naverAuthUrl,
      "naverLogin",
      `width=${width},height=${height},left=${left},top=${top}`
    );

    if (!popup) {
      alert("팝업이 차단되었습니다. 팝업 차단을 해제해주세요.");
      return;
    }

    // 팝업 창 모니터링
    const checkPopup = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(checkPopup);
        console.log("네이버 로그인 창이 닫혔습니다.");
        window.removeEventListener("message", receiveNaverMessage, false);
      }
    }, 500);

    setTimeout(() => {
      if (popup && !popup.closed) {
        console.log("네이버 로그인 타임아웃");
      }
      clearInterval(checkPopup);
      window.removeEventListener("message", receiveNaverMessage, false);
    }, 30000);

    window.addEventListener("message", receiveNaverMessage, false);

    function receiveNaverMessage(event) {
      if (event.origin !== window.location.origin) return;

      if (event.data.type === "naverLogin") {
        if (event.data.success) {
          console.log("네이버 로그인 성공:", event.data.userData);
          sendToBackend(event.data.userData, "NAVER");
        } else {
          if (event.data.cancelled) {
            console.log("사용자가 네이버 로그인을 취소했습니다.");
          } else {
            console.error("네이버 로그인 실패:", event.data.error);
            alert(`로그인 실패: ${event.data.error}`);
          }
        }

        if (popup && !popup.closed) {
          popup.close();
        }

        window.removeEventListener("message", receiveNaverMessage, false);
        clearInterval(checkPopup);
      }
    }
  };

  // 백엔드로 데이터 전송 (공통 함수)
  const sendToBackend = async (userData, socialType) => {
    try {
      setIsLoading(true);

      const requestData = {
        socialId:
          socialType === "KAKAO"
            ? userData.kakaoId.toString()
            : userData.naverId.toString(),
        socialType: socialType,
      };

      try {
        const response = await socialLogin(requestData);
        console.log("로그인 성공:", response);

        login(response.accessToken, response.refreshToken);
        router.push("/transaction/my");
      } catch (error) {
        if (error.message === "존재하지 않는 회원입니다.") {
          const socialLoginData = {
            socialId:
              socialType === "KAKAO"
                ? userData.kakaoId.toString()
                : userData.naverId.toString(),
            socialType: socialType,
            email: userData.email || null,
            nickname: userData.nickname || null,
            profileImage: userData.profileImage || null,
          };

          sessionStorage.setItem(
            "socialLoginData",
            JSON.stringify(socialLoginData)
          );

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

  return (
    <div className="relative w-full h-screen">
      {/* 배경 이미지 */}
      <div className="absolute inset-0 w-full h-full z-0">
        <Image
          src="/images/auth/login-background.svg"
          alt="로그인 배경"
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* 카카오톡 인앱 브라우저 안내 */}
      {isKakaoTalkBrowser() && (
        <div className="absolute top-4 left-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded z-10">
          <p className="text-sm">
            카카오톡 앱에서 접속하셨네요!
            <br />
            로그인 시 현재 페이지에서 진행됩니다.
          </p>
        </div>
      )}

      {/* 로그인 버튼 */}
      <div className="absolute w-full bottom-15 flex flex-col items-center space-y-4 z-10">
        {/* 네이버 로그인 버튼 */}
        <button
          className="w-[180px] cursor-pointer"
          onClick={handleNaverLogin}
          disabled={isLoading}
        >
          <Image
            src="/images/auth/네이버_버튼.svg"
            alt="네이버 로그인"
            width={180}
            height={40}
            className="w-full"
          />
        </button>

        {/* 카카오 로그인 버튼 */}
        <button
          className="w-[180px] cursor-pointer"
          onClick={handleKakaoLogin}
          disabled={isLoading}
        >
          <Image
            src="/images/auth/카카오_버튼.svg"
            alt="카카오 로그인"
            width={180}
            height={41}
            className="w-full"
          />
        </button>
      </div>

      {/* 로딩 오버레이 */}
      {isLoading && (
        <div className="absolute inset-0 bg-opacity-50 flex items-center justify-center z-20">
          <div className="text-lg text-white">로그인 중...</div>
        </div>
      )}
    </div>
  );
}
