// components/auth/LoginPageClient.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { socialLogin } from "@/services/authService";
import { connectSocial } from "@/services/memberService";
import { useMemberStore } from "@/stores/useMemberStore";
import { useToastStore } from "@/stores/useToastStore";
import { AUTH_DEVICE_TYPE } from "@/constants/auth";
import { clearTokens } from "@/utils/tokenManager";

type SocialProvider = "KAKAO" | "NAVER";

interface OAuthCallbackUserData {
  email: string;
  kakaoId?: string | number;
  naverId?: string | number;
  accessToken: string;
  refreshToken?: string;
}

interface PendingSocialData {
  socialEmail: string;
  socialId: string;
  socialType: SocialProvider;
  socialAccessToken: string;
  socialRefreshToken?: string;
  existingSocialType?: string;
}

interface SocialLoginResponse {
  accessToken: string;
  refreshToken?: string;
  sameSocial?: boolean;
  existingSocialType?: string;
}

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }
  return "알 수 없는 오류가 발생했습니다.";
};

export default function LoginPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const addToast = useToastStore((state) => state.addToast);
  const clearMember = useMemberStore((state) => state.clearMember);

  const [isLoading, setIsLoading] = useState(false);
  const [showIntegrateModal, setShowIntegrateModal] = useState(false);
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const logoRef = useRef<HTMLHeadingElement | null>(null);
  const subtitleRef = useRef<HTMLParagraphElement | null>(null);
  const [logoGradientOffsetPx, setLogoGradientOffsetPx] = useState(0);
  const [pendingSocialData, setPendingSocialData] =
    useState<PendingSocialData | null>(null);

  useEffect(() => {
    const updateGradientFrame = () => {
      const logoWidth = logoRef.current?.getBoundingClientRect().width ?? 0;
      const subtitleWidth =
        subtitleRef.current?.getBoundingClientRect().width ?? 0;

      if (logoWidth <= 0 || subtitleWidth <= 0) {
        return;
      }

      // Figma 기준처럼 소제목 시작 x축에 맞춰 로고 그라디언트 시작점을 보정한다.
      setLogoGradientOffsetPx((subtitleWidth - logoWidth) / 2);
    };

    updateGradientFrame();
    window.addEventListener("resize", updateGradientFrame);
    return () => window.removeEventListener("resize", updateGradientFrame);
  }, []);

  const logoGradientStyle = {
    backgroundImage:
      "linear-gradient(81deg, #FF4B6C 0%, #4D83FF 54%, #121315 100%), linear-gradient(#121315, #121315)",
    backgroundSize: "100% 100%, 100% 100%",
    backgroundPosition: `-${Math.max(0, logoGradientOffsetPx)}px 0, 0 0`,
    backgroundRepeat: "no-repeat, no-repeat",
    backgroundClip: "text",
    WebkitBackgroundClip: "text",
    color: "transparent",
    WebkitTextFillColor: "transparent",
  } as const;

  const handleKakaoLogin = () => {
    const KAKAO_REST_API_KEY = process.env.NEXT_PUBLIC_KAKAO_API_KEY;
    const REDIRECT_URI = process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI;

    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_REST_API_KEY}&redirect_uri=${REDIRECT_URI}&response_type=code`;
    window.location.assign(kakaoAuthUrl);
  };

  const handleNaverLogin = () => {
    const NAVER_CLIENT_ID = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID;
    const REDIRECT_URI = process.env.NEXT_PUBLIC_NAVER_REDIRECT_URI;
    const state = Math.random().toString(36).substring(2, 15);

    const naverAuthUrl = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${NAVER_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&state=${state}`;

    try {
      localStorage.setItem("naverLoginState", state);
    } catch {
      sessionStorage.setItem("naverLoginState", state);
    }

    window.location.assign(naverAuthUrl);
  };

  const sendToBackend = useCallback(
    async (userData: OAuthCallbackUserData, socialType: SocialProvider) => {
      const socialIdSource =
        socialType === "KAKAO" ? userData.kakaoId : userData.naverId;

      if (!socialIdSource) {
        addToast("error", "소셜 로그인 정보가 올바르지 않습니다.");
        return;
      }

      try {
        setIsLoading(true);

        const requestData = {
          socialEmail: userData.email,
          socialId: String(socialIdSource),
          socialType,
          socialRefreshToken: userData.refreshToken,
          deviceType: AUTH_DEVICE_TYPE,
        };

        try {
          const response = (await socialLogin(
            requestData,
          )) as SocialLoginResponse;

          if (response.sameSocial === false) {
            setPendingSocialData({
              socialEmail: requestData.socialEmail,
              socialId: requestData.socialId,
              socialType: requestData.socialType,
              socialAccessToken: userData.accessToken,
              socialRefreshToken: userData.refreshToken,
              existingSocialType: response.existingSocialType,
            });
            setShowIntegrateModal(true);
            return;
          }

          login(response.accessToken, response.refreshToken);
          localStorage.setItem("currentLoginSocial", socialType);
          window.location.replace("/transaction/my");
        } catch (error: unknown) {
          const message = getErrorMessage(error);

          if (
            message === "존재하지 않는 회원입니다." ||
            message.includes("404")
          ) {
            setPendingSocialData({
              socialEmail: requestData.socialEmail,
              socialId: requestData.socialId,
              socialType: requestData.socialType,
              socialAccessToken: userData.accessToken,
              socialRefreshToken: userData.refreshToken,
            });
            setShowSignUpModal(true);
          } else {
            addToast("error", `로그인 실패: ${message}`);
          }
        }
      } catch {
        addToast(
          "error",
          "로그인 처리 중 오류가 발생했습니다. 네트워크 연결을 확인해 주세요.",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [addToast, login],
  );

  useEffect(() => {
    const kakaoLogin = searchParams.get("kakao_login");
    const naverLogin = searchParams.get("naver_login");
    const userData = searchParams.get("user_data");
    const error = searchParams.get("error");

    if (error) {
      addToast("error", `로그인 실패: ${decodeURIComponent(error)}`);
      window.history.replaceState({}, "", window.location.pathname);
      return;
    }

    const isSocialSuccess =
      kakaoLogin === "success" || naverLogin === "success";
    if (!isSocialSuccess || !userData) {
      return;
    }

    try {
      const parsedData = JSON.parse(
        decodeURIComponent(userData),
      ) as OAuthCallbackUserData;
      const socialType: SocialProvider =
        kakaoLogin === "success" ? "KAKAO" : "NAVER";
      void sendToBackend(parsedData, socialType);
    } catch {
      addToast("error", "로그인 정보 파싱에 실패했습니다.");
    } finally {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [addToast, searchParams, sendToBackend]);

  const disconnectKakao = async () => {
    if (!pendingSocialData?.socialAccessToken) return;

    try {
      await fetch("/api/auth/kakao/revoke", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accessToken: pendingSocialData.socialAccessToken,
        }),
      });
    } catch (error) {
      console.error("카카오 연동 해제 실패:", error);
    }
  };

  const disconnectNaver = async () => {
    if (!pendingSocialData?.socialAccessToken) return;

    try {
      await fetch("/api/auth/naver/revoke", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accessToken: pendingSocialData.socialAccessToken,
          refreshToken: pendingSocialData.socialRefreshToken,
        }),
      });
    } catch (error) {
      console.error("네이버 연동 해제 실패:", error);
    }
  };

  const handleIntegrateConfirm = async () => {
    if (!pendingSocialData) return;

    try {
      setIsLoading(true);

      await connectSocial({
        socialEmail: pendingSocialData.socialEmail,
        socialId: pendingSocialData.socialId,
        socialType: pendingSocialData.socialType,
        socialRefreshToken: pendingSocialData.socialRefreshToken,
      });

      const response = (await socialLogin({
        socialEmail: pendingSocialData.socialEmail,
        socialId: pendingSocialData.socialId,
        socialType: pendingSocialData.socialType,
        socialRefreshToken: pendingSocialData.socialRefreshToken,
        deviceType: AUTH_DEVICE_TYPE,
      })) as SocialLoginResponse;

      login(response.accessToken, response.refreshToken);
      localStorage.setItem("currentLoginSocial", pendingSocialData.socialType);

      setShowIntegrateModal(false);
      setPendingSocialData(null);
      window.location.replace("/transaction/my");
    } catch (error: unknown) {
      addToast("error", `소셜 연동 실패: ${getErrorMessage(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleIntegrateCancel = async () => {
    if (!pendingSocialData) return;

    if (pendingSocialData.socialType === "KAKAO") {
      await disconnectKakao();
    } else {
      await disconnectNaver();
    }

    setShowIntegrateModal(false);
    setPendingSocialData(null);
  };

  const handleSignUp = () => {
    if (!pendingSocialData) return;

    const socialLoginData = {
      socialId: pendingSocialData.socialId,
      socialType: pendingSocialData.socialType,
      socialEmail: pendingSocialData.socialEmail,
      socialRefreshToken: pendingSocialData.socialRefreshToken,
      nickname: null,
      profileImage: null,
    };

    sessionStorage.setItem("socialLoginData", JSON.stringify(socialLoginData));
    setShowSignUpModal(false);
    setPendingSocialData(null);
    router.push("/sign-up/step1");
  };

  const handleSignUpCancel = async () => {
    if (!pendingSocialData) return;

    if (pendingSocialData.socialType === "KAKAO") {
      await disconnectKakao();
    } else {
      await disconnectNaver();
    }

    setShowSignUpModal(false);
    setPendingSocialData(null);
  };

  const handleEnterDemoMode = () => {
    clearTokens();
    clearMember();
    localStorage.removeItem("currentLoginSocial");
    window.location.replace("/transaction/my");
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-white">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 242.5px 199px at 50% calc(100% - (98px + env(safe-area-inset-bottom))), #FFEDF0 0%, #EDF3FF 56%, #FFFFFF 100%)",
        }}
      />

      <div className="sr-only">
        <p>달쿠미 - 개인과 그룹을 위한 가계부</p>
        <p>
          가볍게 기록하고, 함께 절약하는 달콤한 시작. 개인 거래와 그룹 거래를 한
          번에 관리해 보세요.
        </p>
      </div>

      <div className="absolute inset-x-5 top-[56px] z-10 flex flex-col items-center">
        <h1
          ref={logoRef}
          className="font-stunning text-[40px] leading-[150%] tracking-[-0.01em]"
          style={logoGradientStyle}
        >
          Dalcoomi
        </h1>

        <p ref={subtitleRef} className="mt-1 text-body2-regular text-gray-600">
          가볍게 기록하고, 함께 절약하는 달콤한 시작
        </p>

        <img
          src="/images/transaction/v2/달쿠미_캐릭터2.svg"
          alt="달쿠미 캐릭터"
          width={202}
          height={202}
          className="mt-[75px] h-[202px] w-[202px]"
          loading="eager"
          style={{ display: "block" }}
        />
      </div>

      <div className="absolute inset-x-5 bottom-[calc(40px+env(safe-area-inset-bottom))] z-10 flex flex-col gap-3">
        <button
          type="button"
          className="h-[52px] w-full cursor-pointer overflow-hidden rounded-[12px] border border-[#EBEDED] bg-white p-0 disabled:opacity-50"
          onClick={handleNaverLogin}
          disabled={isLoading}
        >
          <img
            src="/images/transaction/v2/네이버_로그인.svg"
            alt="네이버로 시작하기"
            width={335}
            height={52}
            className="h-full w-full object-cover"
            loading="eager"
            style={{ display: "block" }}
          />
        </button>

        <button
          type="button"
          className="h-[52px] w-full cursor-pointer overflow-hidden rounded-[12px] border border-[#EBEDED] bg-white p-0 disabled:opacity-50"
          onClick={handleKakaoLogin}
          disabled={isLoading}
        >
          <img
            src="/images/transaction/v2/카카오_로그인.svg"
            alt="카카오로 시작하기"
            width={335}
            height={52}
            className="h-full w-full object-cover"
            loading="eager"
            style={{ display: "block" }}
          />
        </button>

        <button
          type="button"
          className="h-[52px] w-full cursor-pointer rounded-[12px] bg-gray-900 text-body1-semibold text-white disabled:opacity-50"
          onClick={handleEnterDemoMode}
          disabled={isLoading}
        >
          로그인 없이 체험하기
        </button>
      </div>

      {showIntegrateModal && (
        <>
          <div
            className="absolute inset-0 z-50 flex h-screen items-center justify-center bg-[#d9d9d9] opacity-50"
            onClick={handleIntegrateCancel}
          />

          <div
            className="absolute left-1/2 top-1/2 z-50 w-[80%] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-[10px] border-2 border-[#C7C3C3] bg-white p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="mb-4 text-center text-lg font-semibold">
              SNS 간편 로그인 안내
            </h3>
            <p className="mb-6 text-center text-sm leading-relaxed text-gray-600">
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
              계정과 연동하시겠어요?
            </p>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={handleIntegrateCancel}
                className="flex-1 cursor-pointer rounded-[10px] border-2 border-[#0EABFF] px-4 py-3 font-light text-[#0EABFF] transition-colors hover:bg-blue-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleIntegrateConfirm}
                disabled={isLoading}
                className="flex-1 cursor-pointer rounded-[10px] bg-[#0EABFF] px-4 py-3 font-light text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
              >
                {isLoading ? "연동 중..." : "확인"}
              </button>
            </div>
          </div>
        </>
      )}

      {showSignUpModal && (
        <>
          <div
            className="absolute inset-0 z-50 flex h-screen items-center justify-center bg-[#d9d9d9] opacity-50"
            onClick={handleSignUpCancel}
          />

          <div
            className="absolute left-1/2 top-1/2 z-50 w-[80%] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-[10px] border-2 border-[#C7C3C3] bg-white p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="mb-4 text-center text-lg font-semibold">
              SNS 간편 로그인 안내
            </h3>
            <p className="mb-6 text-center text-md leading-relaxed text-gray-600">
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
              계정 회원가입을 원하시면
              <br />
              회원가입 버튼을 눌러주세요.
              <br />
              <br />
              <span className="text-xs text-gray-500">
                이미 다른 SNS로 가입하셨다면
                <br />
                로그인 후{" "}
                <span className="text-red-400">
                  &quot;마이페이지 &gt; 프로필 수정&quot;
                </span>
                <br />
                메뉴에서 SNS 연동을 진행해 주세요.
              </span>
            </p>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={handleSignUpCancel}
                className="flex-1 cursor-pointer rounded-[10px] border-2 border-[#0EABFF] px-4 py-3 font-light text-[#0EABFF] transition-colors hover:bg-blue-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSignUp}
                className="flex-1 cursor-pointer rounded-[10px] bg-[#0EABFF] px-4 py-3 font-light text-white transition-colors hover:bg-blue-600"
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
