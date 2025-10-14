// components/auth/LoginPageClient.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { socialLogin } from "@/services/authService";
import { connectSocial } from "@/services/memberService";
import { isPWA, isMobile } from "@/utils/deviceDetection";

export default function LoginPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // 소셜 연동 모달 상태
  const [showIntegrateModal, setShowIntegrateModal] = useState(false);
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [pendingSocialData, setPendingSocialData] = useState<{
    socialEmail: string;
    socialId: string;
    socialType: string;
    socialAccessToken: string;
    socialRefreshToken?: string; // 네이버 연결 해제용
    existingSocialType?: string; // 연동 확인 모달에서만 사용
  } | null>(null);

  // 브라우저 및 환경 감지 함수들
  const isKakaoTalkBrowser = () => {
    return /KAKAOTALK/i.test(navigator.userAgent);
  };

  const isEdge = () => {
    return /Edg\//.test(navigator.userAgent);
  };

  // 리다이렉트를 사용해야 하는 경우 판단
  const shouldUseRedirect = () => {
    return isKakaoTalkBrowser() || isPWA() || isMobile();
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

    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_REST_API_KEY}&redirect_uri=${REDIRECT_URI}&response_type=code`;

    // PWA, 모바일, 카카오톡 브라우저는 리다이렉트
    if (shouldUseRedirect()) {
      window.location.href = kakaoAuthUrl;
      return;
    }

    // PC 웹 (크롬, 파이어폭스, 엣지 포함)은 팝업
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

    // 엣지 브라우저 특별 처리
    let popupOptions = `width=${width},height=${height},left=${left},top=${top}`;

    if (isEdge()) {
      popupOptions +=
        ",scrollbars=yes,resizable=yes,location=yes,menubar=no,toolbar=no";
    }

    // 팝업 창 열기
    const popup = window.open(kakaoAuthUrl, "kakaoLogin", popupOptions);

    // 팝업 창이 열리지 않은 경우 처리
    if (!popup) {
      alert("팝업이 차단되었습니다. 팝업 차단을 해제해주세요.");
      return;
    }

    // 엣지에서 팝업 포커스
    if (isEdge()) {
      popup.focus();

      // 엣지에서 팝업이 제대로 열렸는지 확인
      setTimeout(() => {
        if (popup && (popup.closed || !popup.location)) {
          popup.close();
          window.location.href = kakaoAuthUrl;
          return;
        }
      }, 1000);
    }

    // 팝업 창 모니터링
    const checkInterval = isEdge() ? 300 : 500;
    const checkPopup = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(checkPopup);
        window.removeEventListener("message", receiveKakaoMessage, false);
      }
    }, checkInterval);

    // 30초 후 자동으로 팝업 체크 중단
    setTimeout(() => {
      clearInterval(checkPopup);
      window.removeEventListener("message", receiveKakaoMessage, false);
    }, 30000);

    window.addEventListener("message", receiveKakaoMessage, false);

    function receiveKakaoMessage(event) {
      if (event.origin !== window.location.origin) return;

      if (event.data.type === "kakaoLogin") {
        if (event.data.success) {
          sendToBackend(event.data.userData, "KAKAO");
        } else {
          if (!event.data.cancelled) {
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

    const naverAuthUrl = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${NAVER_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&state=${STATE}`;

    // PWA, 모바일, 카카오톡 브라우저는 리다이렉트
    if (shouldUseRedirect()) {
      // 리다이렉트 방식에서는 state를 storage에 저장
      try {
        localStorage.setItem("naverLoginState", STATE);
      } catch (error) {
        sessionStorage.setItem("naverLoginState", STATE);
      }
      window.location.href = naverAuthUrl;
      return;
    }

    // PC 웹은 팝업
    handleNaverPopupLogin();
  };

  // 네이버 팝업 로그인 (일반 브라우저용)
  const handleNaverPopupLogin = () => {
    const NAVER_CLIENT_ID = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID;
    const REDIRECT_URI = process.env.NEXT_PUBLIC_NAVER_REDIRECT_URI;
    const STATE = Math.random().toString(36).substring(2, 15);

    const width = 500;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const naverAuthUrl = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${NAVER_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&state=${STATE}`;

    let popupOptions = `width=${width},height=${height},left=${left},top=${top}`;
    if (isEdge()) {
      popupOptions +=
        ",scrollbars=yes,resizable=yes,location=yes,menubar=no,toolbar=no";
    }

    const popup = window.open(naverAuthUrl, "naverLogin", popupOptions);

    if (!popup) {
      alert("팝업이 차단되었습니다. 팝업 차단을 해제해주세요.");
      return;
    }

    if (isEdge()) {
      popup.focus();
      setTimeout(() => {
        if (popup && (popup.closed || !popup.location)) {
          popup.close();
          window.location.href = naverAuthUrl;
          return;
        }
      }, 1000);
    }

    const checkInterval = isEdge() ? 300 : 500;
    const checkPopup = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(checkPopup);
        window.removeEventListener("message", receiveNaverMessage, false);
      }
    }, checkInterval);

    setTimeout(() => {
      clearInterval(checkPopup);
      window.removeEventListener("message", receiveNaverMessage, false);
    }, 30000);

    window.addEventListener("message", receiveNaverMessage, false);

    function receiveNaverMessage(event) {
      if (event.origin !== window.location.origin) return;

      if (event.data.type === "naverLogin") {
        if (event.data.success) {
          sendToBackend(event.data.userData, "NAVER");
        } else {
          if (!event.data.cancelled) {
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
        socialEmail: userData.email,
        socialId:
          socialType === "KAKAO"
            ? userData.kakaoId.toString()
            : userData.naverId.toString(),
        socialType: socialType,
        socialRefreshToken: userData.refreshToken, // 소셜 리프레시 토큰 추가
      };

      try {
        const response = await socialLogin(requestData);

        // sameSocial이 false면 다른 소셜로 가입된 계정이 있음 → 연동 확인 모달
        if (response.sameSocial === false) {
          setPendingSocialData({
            socialEmail: requestData.socialEmail,
            socialId: requestData.socialId,
            socialType: requestData.socialType,
            socialAccessToken: userData.accessToken,
            socialRefreshToken: userData.refreshToken, // 네이버 리프레시 토큰 추가
            existingSocialType: response.existingSocialType,
          });

          setShowIntegrateModal(true);
          return;
        }

        // 로그인 성공 시 토큰 저장
        login(response.accessToken, response.refreshToken);

        // 현재 로그인 소셜 타입을 임시 저장 (회원 정보 로드 후 적용하기 위해)
        localStorage.setItem("currentLoginSocial", socialType);

        // 이미지 깨짐 방지를 위해 hard navigation 사용
        window.location.href = "/transaction/my";
      } catch (error) {
        if (
          error.message === "존재하지 않는 회원입니다." ||
          error.message.includes("404")
        ) {
          // 가입된 계정이 없음 → 회원가입 안내 모달
          setPendingSocialData({
            socialEmail: requestData.socialEmail,
            socialId: requestData.socialId,
            socialType: requestData.socialType,
            socialAccessToken: userData.accessToken,
            socialRefreshToken: userData.refreshToken, // 네이버 리프레시 토큰 추가
          });

          setShowSignUpModal(true);
        } else {
          alert(`로그인 실패: ${error.message}`);
        }
      }
    } catch (error) {
      alert(
        "로그인 처리 중 오류가 발생했습니다. 네트워크 연결을 확인해주세요."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 소셜 연동 확인 처리
  const handleIntegrateConfirm = async () => {
    if (!pendingSocialData) return;

    try {
      setIsLoading(true);
      await connectSocial({
        socialEmail: pendingSocialData.socialEmail,
        socialId: pendingSocialData.socialId,
        socialType: pendingSocialData.socialType,
        socialRefreshToken: pendingSocialData.socialRefreshToken
      });

      // 연동 성공 후 다시 로그인 시도
      const response = await socialLogin({
        socialEmail: pendingSocialData.socialEmail,
        socialId: pendingSocialData.socialId,
        socialType: pendingSocialData.socialType,
        socialRefreshToken: pendingSocialData.socialRefreshToken, // 소셜 리프레시 토큰 추가
      });

      login(response.accessToken, response.refreshToken);

      // 현재 로그인 소셜 타입을 임시 저장 (회원 정보 로드 후 적용하기 위해)
      localStorage.setItem("currentLoginSocial", pendingSocialData.socialType);

      setShowIntegrateModal(false);
      setPendingSocialData(null);

      // 이미지 깨짐 방지를 위해 hard navigation 사용
      window.location.href = "/transaction/my";
    } catch (error) {
      alert(`소셜 연동 실패: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 소셜 연동 취소 처리 (소셜 플랫폼에서 연결 끊기)
  const handleIntegrateCancel = async () => {
    if (!pendingSocialData) return;

    // 카카오 또는 네이버 연결 해제
    if (pendingSocialData.socialType === "KAKAO") {
      await disconnectKakao();
    } else if (pendingSocialData.socialType === "NAVER") {
      await disconnectNaver();
    }

    setShowIntegrateModal(false);
    setPendingSocialData(null);
  };

  // 회원가입 처리
  const handleSignUp = () => {
    if (!pendingSocialData) return;

    const socialLoginData = {
      socialId: pendingSocialData.socialId,
      socialType: pendingSocialData.socialType,
      socialEmail: pendingSocialData.socialEmail || null,
      socialRefreshToken: pendingSocialData.socialRefreshToken,
      nickname: null,
      profileImage: null,
    };

    sessionStorage.setItem("socialLoginData", JSON.stringify(socialLoginData));
    setShowSignUpModal(false);
    setPendingSocialData(null);
    router.push("/sign-up/step1");
  };

  // 회원가입 취소 처리 (소셜 플랫폼에서 연결 끊기)
  const handleSignUpCancel = async () => {
    if (!pendingSocialData) return;

    // 카카오 또는 네이버 연결 해제
    if (pendingSocialData.socialType === "KAKAO") {
      await disconnectKakao();
    } else if (pendingSocialData.socialType === "NAVER") {
      await disconnectNaver();
    }

    setShowSignUpModal(false);
    setPendingSocialData(null);
  };

  // 카카오 연결 해제
  const disconnectKakao = async () => {
    if (!pendingSocialData?.socialAccessToken) return;


    try {
      // 🔥 서버 API를 통해 카카오 토큰 해제 처리
      const response = await fetch('/api/auth/kakao/revoke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken: pendingSocialData.socialAccessToken
        })
      });

      if (response.ok) {
        const result = await response.json();
      } else {
      }

    } catch (error) {
      console.error("카카오 연결 해제 실패:", error);
    }
  };

  // 네이버 연결 해제
  const disconnectNaver = async () => {
    if (!pendingSocialData?.socialAccessToken) return;


    try {
      // 🔥 서버 API를 통해 네이버 토큰 해제 처리
      const response = await fetch('/api/auth/naver/revoke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken: pendingSocialData.socialAccessToken,
          refreshToken: pendingSocialData.socialRefreshToken
        })
      });

      if (response.ok) {
        const result = await response.json();
      } else {
      }

    } catch (error) {
      console.error("네이버 연결 해제 실패:", error);
    }
  };

  return (
    <div className="relative w-full h-screen">
      {/* SEO용 숨김 텍스트 */}
      <div className="sr-only">
        <h1>달쿠미 - 개인과 그룹을 위한 AI 가계부</h1>
        <p>
          개인과 그룹을 위한 AI 가계부 서비스. 간편한 가계부 작성, AI 영수증
          분석, 그룹 작성 기능을 제공합니다. 달쿠미 가계부로 지출 관리를
          시작해보세요.
        </p>
        <p>
          AI가 도와주는 스마트한 가계부 앱입니다. 개인 가계부부터 그룹
          가계부까지 모든 기능을 한 번에 관리할 수 있습니다.
        </p>
        <nav>
          <ul>
            <li>개인 가계부 작성 및 관리</li>
            <li>그룹 가계부 공유 기능</li>
            <li>AI 영수증 자동 분석</li>
            <li>지출 패턴 분석 리포트</li>
            <li>예산 관리 및 알림</li>
          </ul>
        </nav>
      </div>

      {/* 배경 이미지 */}
      <div className="absolute inset-0 w-full h-full z-0" style={{ backgroundColor: '#ffffff' }}>
        <img
          src="/images/auth/로그인 페이지 이미지.png"
          alt="로그인 배경"
          className="w-full h-full object-cover"
          loading="eager"
          style={{ display: 'block' }}
        />
      </div>

      {/* 로그인 버튼 */}
      <div className="absolute w-full max-w-[390px] flex flex-col items-center z-10 bg-gradient-to-t from-white via-white to-transparent pt-4" style={{ bottom: '40px', left: '50%', transform: 'translateX(-50%)', paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}>
        {/* 간편 로그인 제목과 구분선 */}
        <div className="flex items-center w-[320px] mb-6">
          <div className="flex-1 h-px bg-gray-300"></div>
          <span className="px-4 text-sm text-gray-400">간편 로그인</span>
          <div className="flex-1 h-px bg-gray-300"></div>
        </div>

        {/* 소셜 로그인 버튼들 (가로 배치) */}
        <div className="flex items-center space-x-4">
          {/* 네이버 로그인 버튼 */}
          <button
            className="w-[50px] cursor-pointer"
            onClick={handleNaverLogin}
            disabled={isLoading}
          >
            <img
              src="/images/auth/네이버_로그인.png?v=1"
              alt="네이버 로그인"
              width={150}
              height={33}
              className="w-full"
              loading="eager"
              style={{ display: 'block' }}
            />
          </button>

          {/* 카카오 로그인 버튼 */}
          <button
            className="w-[50px] cursor-pointer"
            onClick={handleKakaoLogin}
            disabled={isLoading}
          >
            <img
              src="/images/auth/카카오_로그인.png?v=1"
              alt="카카오 로그인"
              width={150}
              height={34}
              className="w-full"
              loading="eager"
              style={{ display: 'block' }}
            />
          </button>
        </div>
      </div>

      {/* 소셜 연동 확인 모달 */}
      {showIntegrateModal && (
        <>
          {/* 배경 오버레이 */}
          <div
            className="absolute top-0 left-0 right-0 bottom-0 bg-[#d9d9d9] opacity-50 flex h-screen items-center justify-center z-50"
            onClick={handleIntegrateCancel}
          ></div>

          {/* 모달 컨텐츠 */}
          <div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white border-2 border-[#C7C3C3] rounded-[10px] p-6 w-[80%] max-w-sm z-50"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-center mb-4">
              SNS 간편 로그인 안내
            </h3>
            <p className="text-gray-600 text-center mb-6 text-sm leading-relaxed">
              <span className="font-medium text-blue-500">
                {pendingSocialData?.socialEmail}
              </span>
              <br />
              이미{" "}
              <span className="font-medium text-gray-800">
                {pendingSocialData?.existingSocialType}
              </span>{" "}
              계정으로 가입된
              <br />
              회원 정보가 있습니다.
              <br />
              <br />
              <span className="font-medium text-gray-800">
                {pendingSocialData?.socialType}
              </span>{" "}
              계정과 연동하시겠습니까?
              <br />
            </p>

            <div className="flex space-x-3">
              <button
                onClick={handleIntegrateCancel}
                className="flex-1 py-3 px-4 text-[#0EABFF] font-light border-2 border-[#0EABFF] rounded-[10px] hover:bg-blue-50 transition-colors cursor-pointer"
              >
                취소
              </button>
              <button
                onClick={handleIntegrateConfirm}
                disabled={isLoading}
                className="flex-1 py-3 px-4 bg-[#0EABFF] text-white font-light rounded-[10px] hover:bg-blue-600 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {isLoading ? "연동 중..." : "확인"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* 회원가입 안내 모달 */}
      {showSignUpModal && (
        <>
          {/* 배경 오버레이 */}
          <div
            className="absolute top-0 left-0 right-0 bottom-0 bg-[#d9d9d9] opacity-50 flex h-screen items-center justify-center z-50"
            onClick={handleSignUpCancel}
          ></div>

          {/* 모달 컨텐츠 */}
          <div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white border-2 border-[#C7C3C3] rounded-[10px] p-6 w-[80%] max-w-sm z-50"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-center mb-4">
              SNS 간편 로그인 안내
            </h3>
            <p className="text-gray-600 text-center mb-6 text-md leading-relaxed">
              <span className="font-medium text-gray-800">
                {pendingSocialData?.socialType}
              </span>{" "}
              계정 정보로
              <br />
              일치하는 회원 정보를 찾을 수 없어요.
              <br />
              <br />
              <span className="font-medium text-gray-800">
                {pendingSocialData?.socialType}
              </span>{" "}
              계정 회원가입을 원하시는 경우
              <br />
              회원가입 버튼을 눌러주세요.
              <br />
              <br />
              <span className="text-xs text-gray-500">
                이미 다른 소셜로 가입한 회원이시라면
                <br />
                로그인 후 <span className="text-red-400">"마이페이지 > 프로필 수정"</span>
                <br />
                메뉴에서 소셜 연동 설정을 진행해 주세요.
              </span>
            </p>

            <div className="flex space-x-3">
              <button
                onClick={handleSignUpCancel}
                className="flex-1 py-3 px-4 text-[#0EABFF] font-light border-2 border-[#0EABFF] rounded-[10px] hover:bg-blue-50 transition-colors cursor-pointer"
              >
                취소
              </button>
              <button
                onClick={handleSignUp}
                className="flex-1 py-3 px-4 bg-[#0EABFF] text-white font-light rounded-[10px] hover:bg-blue-600 transition-colors cursor-pointer"
              >
                회원가입
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
