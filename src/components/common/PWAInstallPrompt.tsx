// components/common/PWAInstallPrompt.tsx
"use client";

import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // iOS 감지
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // 이미 설치된 상태인지 확인
    const isInStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(isInStandalone);

    // 이전에 닫은 시간 확인 (7일 동안 다시 표시 안 함)
    const dismissedTime = localStorage.getItem("pwa-install-dismissed");
    if (dismissedTime) {
      const daysSinceDismissed =
        (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        return;
      }
    }

    // 이미 설치되어 있으면 표시 안 함
    if (isInStandalone) {
      return;
    }

    // Chrome/Edge의 beforeinstallprompt 이벤트 처리
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // 3초 후에 프롬프트 표시 (사용자 경험 개선)
      setTimeout(() => {
        setShowInstallPrompt(true);
      }, 1000);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // iOS는 3초 후 자동으로 안내 표시
    if (isIOSDevice && !isInStandalone) {
      setTimeout(() => {
        setShowInstallPrompt(true);
      }, 3000);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    // 브라우저 설치 프롬프트 실행
    await deferredPrompt.prompt();

    // 사용자 선택 결과
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      console.log("PWA 설치 완료");
    }

    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleClose = () => {
    setShowInstallPrompt(false);
  };

  const handleDismissWeek = () => {
    setShowInstallPrompt(false);
    localStorage.setItem("pwa-install-dismissed", Date.now().toString());
  };

  if (!showInstallPrompt || isStandalone) return null;

  // iOS용 안내 UI
  if (isIOS) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
        <div className="bg-white rounded-t-2xl shadow-2xl p-6 border-t-4 border-blue-500 mx-auto max-w-[390px]">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center space-x-3">
              <img
                src="/icons/icon-72x72.png"
                alt="달쿠미"
                className="w-14 h-14 rounded-xl"
              />
              <div>
                <h3 className="font-bold text-lg text-gray-800">
                  달쿠미 앱 설치
                </h3>
                <p className="text-sm text-gray-600">홈 화면에 추가하기</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none cursor-pointer"
              aria-label="닫기"
            >
              ×
            </button>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 space-y-2 mb-4">
            <div className="flex items-start space-x-3">
              <span className="text-2xl">1️⃣</span>
              <p className="text-sm text-gray-700 flex-1">
                Safari 하단의{" "}
                <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-500 text-white rounded text-xs mx-1">
                  ⬆︎
                </span>{" "}
                <strong>공유</strong> 버튼을 누르세요
              </p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-2xl">2️⃣</span>
              <p className="text-sm text-gray-700 flex-1">
                <strong>"홈 화면에 추가"</strong>를 선택하세요
              </p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-2xl">3️⃣</span>
              <p className="text-sm text-gray-700 flex-1">
                오른쪽 상단의 <strong>"추가"</strong>를 눌러 완료하세요
              </p>
            </div>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={handleClose}
              className="flex-1 py-2.5 px-3 cursor-ponter text-gray-700 text-sm font-medium border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleDismissWeek}
              className="flex-1 py-2.5 px-3 cursor-pointer text-[#0EABFF] text-sm font-medium border-2 border-[#0EABFF] rounded-lg hover:bg-blue-50 transition-colors"
            >
              7일간 보지 않기
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center mt-3">
            홈 화면에 추가하고 앱처럼 빠르게 접속하세요!
          </p>
        </div>
      </div>
    );
  }

  // Android Chrome/Edge용 커스텀 프롬프트
  return (
    <div className="fixed bottom-14 left-1/2 transform -translate-x-1/2 z-50 w-[90%] max-w-md animate-slide-up">
      <div className="bg-white rounded-xl shadow-2xl p-5 border border-gray-200">
        <div className="flex items-start space-x-4 mb-4">
          <img
            src="/icons/icon-72x72.png"
            alt="달쿠미"
            className="w-16 h-16 rounded-xl flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-1">
              <h3 className="font-bold text-lg text-gray-800">
                달쿠미 앱 설치
              </h3>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none ml-2 cursor-pointer"
                aria-label="닫기"
              >
                ×
              </button>
            </div>
            <p className="text-sm text-gray-600">
              홈 화면에 추가하고 앱처럼 빠르게 접속하세요!
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleDismissWeek}
            className="flex-1 py-2.5 px-3 cursor-pointer border-2 border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            7일간 보지 않기
          </button>
          <button
            onClick={handleInstall}
            className="flex-1 py-2.5 px-3 cursor-pointer bg-[#0EABFF] text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
          >
            설치하기
          </button>
        </div>
      </div>
    </div>
  );
}
