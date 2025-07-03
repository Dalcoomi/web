// components/auth/SignUpAgreementClient.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignUpAgreementClient() {
  const router = useRouter();
  const [agreements, setAgreements] = useState({
    all: false,
    service: false,
    privacy: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);

  // 소셜 로그인 데이터 확인
  useEffect(() => {
    const checkData = () => {
      const socialLoginData = sessionStorage.getItem("socialLoginData");
      if (!socialLoginData) {
        router.replace("/");
        return;
      }
      setIsLoading(false);
    };

    checkData();
  }, [router]);

  // 모든 동의 체크/해제 처리
  const handleAllAgreement = () => {
    const newValue = !agreements.all;
    setAgreements({
      all: newValue,
      service: newValue,
      privacy: newValue,
    });
  };

  // 개별 동의 처리
  const handleAgreement = (key: "service" | "privacy") => {
    const newAgreements = {
      ...agreements,
      [key]: !agreements[key],
    };

    // 모든 약관이 체크되었는지 확인
    newAgreements.all = newAgreements.service && newAgreements.privacy;

    setAgreements(newAgreements);
  };

  // 다음 단계로 이동
  const handleNext = () => {
    if (agreements.service && agreements.privacy) {
      try {
        // 중복 실행 방지
        if (isNavigating) return;
        setIsNavigating(true);

        // 세션 스토리지에 백업
        sessionStorage.setItem(
          "agreementData",
          JSON.stringify({
            service: true,
            privacy: true,
          })
        );
        sessionStorage.setItem("signupStep1Completed", "true");

        router.push("/sign-up/step2");
      } catch (error) {
        setIsNavigating(false);
      }
    }
  };

  // 필수 약관 모두 동의했는지 확인
  const isAllRequiredAgreed = agreements.service && agreements.privacy;

  // 로딩 중이면 로딩 표시
  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <div className="text-center">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 상단 단계 표시 */}
      <div className="flex justify-center mt-6 mb-6">
        <div className="flex space-x-2">
          <div className="w-8 h-8 rounded-full bg-[#0EABFF] text-white flex items-center justify-center">
            1
          </div>
          <div className="w-8 h-8 rounded-full bg-[#DDECFF] text-[#D4D4D4] flex items-center justify-center">
            2
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 px-5">
        <h1 className="text-xl font-medium text-left mb-5">
          약관에 동의해주세요
        </h1>

        {/* 전체 동의 */}
        <div className="mb-5">
          <div
            className="flex items-center cursor-pointer"
            onClick={handleAllAgreement}
          >
            <div className="relative w-5 h-5 mr-2">
              <div
                className={`w-5 h-5 border rounded-full transition-colors ${
                  agreements.all ? "border-[#0EABFF]" : "border-gray-300"
                }`}
              >
                {agreements.all && (
                  <div className="absolute top-1 left-1 w-3 h-3 bg-[#0EABFF] rounded-full"></div>
                )}
              </div>
            </div>
            <span className="text-base font-light">모두 동의</span>
          </div>
          <p className="text-sm text-[#737373] mt-1 ml-8">
            서비스 이용을 위해 아래 약관에 모두 동의합니다.
          </p>
        </div>

        {/* 서비스 이용약관 */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div
              className="flex items-center cursor-pointer"
              onClick={() => handleAgreement("service")}
            >
              <div className="relative w-5 h-5 mr-2">
                <div
                  className={`w-5 h-5 border rounded-full transition-colors ${
                    agreements.service ? "border-[#0EABFF]" : "border-gray-300"
                  }`}
                >
                  {agreements.service && (
                    <div className="absolute top-1 left-1 w-3 h-3 bg-[#0EABFF] rounded-full"></div>
                  )}
                </div>
              </div>
              <span className="text-sm">(필수) 서비스 이용약관 동의</span>
            </div>
            <Link
              href="https://example.com/terms"
              target="_blank"
              className="text-sm text-gray-400 min-w-[30px] text-right"
            >
              보기
            </Link>
          </div>
        </div>

        {/* 개인정보 처리방침 */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div
              className="flex items-center cursor-pointer"
              onClick={() => handleAgreement("privacy")}
            >
              <div className="relative w-5 h-5 mr-2">
                <div
                  className={`w-5 h-5 border rounded-full transition-colors ${
                    agreements.privacy ? "border-[#0EABFF]" : "border-gray-300"
                  }`}
                >
                  {agreements.privacy && (
                    <div className="absolute top-1 left-1 w-3 h-3 bg-[#0EABFF] rounded-full"></div>
                  )}
                </div>
              </div>
              <span className="text-sm">(필수) 개인정보 처리방침 동의</span>
            </div>
            <Link
              href="https://example.com/privacy"
              target="_blank"
              className="text-sm text-gray-400 min-w-[30px] text-right"
            >
              보기
            </Link>
          </div>
        </div>
      </div>

      {/* 다음 버튼 */}
      <div className="px-7 pb-7">
        <button
          className={`w-full py-3 rounded-md font-medium transition-colors ${
            isAllRequiredAgreed
              ? isNavigating
                ? "bg-[#0EABFF] opacity-70 cursor-not-allowed text-white"
                : "bg-[#0EABFF] text-white hover:bg-blue-500 cursor-pointer"
              : "bg-gray-300 text-white cursor-not-allowed"
          }`}
          onClick={handleNext}
          disabled={!isAllRequiredAgreed || isNavigating}
        >
          {isNavigating ? "이동 중..." : "다음"}
        </button>
      </div>
    </div>
  );
}
