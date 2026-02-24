// components/landing/LandingContent.tsx
"use client";

import { useRef, useState, useEffect } from "react";
import { useToastStore } from "@/stores/useToastStore";

export default function LandingContent() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const addToast = useToastStore((state) => state.addToast);
  const currentYear = new Date().getFullYear();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  // BeforeInstallPromptEvent 타입 정의
  interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
  }

  // PWA 설치 프롬프트 감지
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  // PWA 설치 버튼 클릭 핸들러
  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      addToast("info", "웹앱 설치는 브라우저의 설치 기능을 이용해주세요.");
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  // 로고 클릭 시 맨 위로 스크롤
  const handleLogoClick = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const faqs = [
    {
      question: "네이티브 앱은 없나요?",
      answer:
        "Android는 아직 일정에 없지만, iOS 모바일 앱이 조만간 앱스토어에 출시될 예정이에요.\n" +
        "현재는 웹앱 설치만 가능하고, 웹앱은 iOS, Android에서도 앱처럼 이용이 가능해요.",
    },
    {
      question: "개인정보 보안 안전한가요?",
      answer:
        "개인정보나 가계부정보 같은 민감한 데이터들은 안전하게 암호화된 상태로 분리 보관되며, 별도 서버에서 안전하게 관리돼요. 이외 다른 목적으로 절대 사용되지 않기에 안심하셔도 돼요.",
    },
    {
      question: "가계부 데이터 활용 동의가 무엇인가요?",
      answer:
        "동의를 하실 경우, 작성하신 가계부 내역 중 카테고리, 금액 데이터가 AI 서비스 개선을 위해 활용돼요. 이때, 개인정보는 절대 활용되지 않으며 데이터 익명성을 보장해요.",
    },
  ];

  return (
    <div className="flex flex-col h-full font-landing">
      {/* 1. 고정 탑바 */}
      <div className="flex-shrink-0 h-10 bg-blue-50 border-b border-blue-100 flex items-center px-6">
        {/* 왼쪽 - 아이콘과 로고 */}
        <button
          onClick={handleLogoClick}
          className="flex items-center gap-1 -mx-2 hover:cursor-pointer"
        >
          <img
            src="/images/transaction/v2/메인_캐릭터.svg"
            alt="달쿠미"
            className="w-6 h-6 rounded"
          />
          <span className="text-md font-semibold text-sky-500">달쿠미</span>
        </button>

        {/* 오른쪽 영역 (향후 확장용) */}
        <div className="ml-auto">{/* 추후 버튼들이 여기에 들어갈 예정 */}</div>
      </div>

      {/* 2. 스크롤 가능한 바디 콘텐츠 */}
      <div className="flex-1 overflow-hidden relative">
        <div ref={scrollRef} className="absolute inset-0 overflow-y-auto">
          {/* 1. 로고 + 타이틀 영역 - 그라데이션 배경 (고정 높이) */}
          <div
            className="relative h-[600px] px-6 flex items-start justify-center pt-40"
            style={{
              background:
                "linear-gradient(to bottom, #11ABFF, #8DD5FF, #C7E9FF, #E8F6FF, #FFFFFF)",
            }}
          >
            <div className="flex items-center gap-7">
              {/* 왼쪽 - 로고 */}
              <div className="flex-shrink-0">
                <img
                  src="/images/transaction/v2/메인_캐릭터.svg"
                  alt="달쿠미 로고"
                  className="w-32 h-32 object-contain"
                />
              </div>
              {/* 오른쪽 - 타이틀 */}
              <div>
                <p className="text-title1 text-sky-600">
                  개인과 그룹을 위한 가계부 서비스
                </p>
                <p className="text-header text-sky-600">달쿠미</p>
              </div>
            </div>

            {/* 하단 스크롤 안내 화살표 - 푸터 위에 고정 */}
            <div
              className="absolute bottom-24 left-1/2 transform -translate-x-1/2 animate-bounce cursor-pointer"
              onClick={() => {
                if (scrollRef.current) {
                  scrollRef.current.scrollTo({
                    top: 600,
                    behavior: "smooth",
                  });
                }
              }}
            >
              <svg
                className="w-8 h-8 text-sky-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
              <svg
                className="w-8 h-8 text-sky-600 -mt-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>

          {/* 2. 서비스 소개 영역 */}
          <div className="h-[400px] px-6 bg-white flex items-center justify-center">
            <div className="max-w-xl mx-auto text-center">
              <p className="text-title1 text-gray-800">
                <span className="text-title1 text-[#11ABFF]">달쿠미</span>는
                복잡한 가계부 작성 과정을 해결했어요
              </p>
              <p className="text-title1 text-gray-800">
                그리고 가족이나 동료와 함께 가계부를 관리할 수 있어요
              </p>
            </div>
          </div>

          {/* 3. 주요 기능 영역 */}
          <div
            className="min-h-[1200px] py-20 px-6"
            style={{
              background:
                "linear-gradient(to bottom, #E0F2FE, #DBEAFE, #E0E7FF, #EDE9FE, #FCE7F3, #f9fafb)",
            }}
          >
            <div className="max-w-xl mx-auto pl-3">
              <div className="flex flex-col gap-10">
                {/* 첫 번째 카드(빠른 입력) - 이미지 왼쪽 */}
                <div className="w-full">
                  <div className="p-5 rounded-2xl flex gap-10">
                    {/* 왼쪽 - 텍스트 */}
                    <div className="flex-1 flex flex-col items-start">
                      <div className="inline-block mb-3">
                        <p className="text-title1 text-gray-800">
                          복잡한 작성은 이제 끝!
                        </p>
                        <p className="text-title1 text-gray-800">
                          <span className="text-[#11ABFF]">
                            빠른 가계부 작성
                          </span>
                          이 가능해요
                        </p>
                      </div>
                      <p className="text-body1-semibold text-gray-500 leading-relaxed">
                        간단한 UI로 몇 초만에 지출, 수입 내역을 작성할 수
                        있어요.
                      </p>
                    </div>
                    {/* 오른쪽 - 이미지 */}
                    <div className="flex-shrink-0">
                      <img
                        src="/images/landing/가계부작성예시.jpg"
                        alt="가계부 작성 예시"
                        className="w-40 h-auto rounded-2xl object-contain"
                      />
                    </div>
                  </div>
                </div>

                {/* 두 번째 카드(그룹 가계부) - 이미지 오른쪽 */}
                <div className="w-full">
                  <div className="p-5 rounded-2xl flex gap-7">
                    {/* 왼쪽 - 이미지 */}
                    <div className="flex-shrink-0">
                      <img
                        src="/images/landing/그룹가계부예시.jpg"
                        alt="그룹 가계부 예시"
                        className="w-40 h-auto rounded-2xl object-contain"
                      />
                    </div>
                    {/* 오른쪽 - 텍스트 */}
                    <div className="flex-1 flex flex-col items-end">
                      <div className="inline-block mb-3 text-right">
                        <p className="text-title1 text-gray-800">
                          <span className="text-[#11ABFF]">그룹</span>으로
                          가계부를 관리해요
                        </p>
                      </div>
                      <p className="text-body1-semibold text-gray-500 leading-relaxed text-right">
                        가족, 친구, 동료와 함께 가계부를 관리해 보세요!
                      </p>
                    </div>
                  </div>
                </div>

                {/* 세 번째 카드(AI 영수증 분석) - 이미지 왼쪽 */}
                <div className="w-full">
                  <div className="p-5 rounded-2xl flex gap-7">
                    {/* 왼쪽 - 텍스트 */}
                    <div className="flex-1 flex flex-col items-start">
                      <div className="inline-block mb-3">
                        <p className="text-title1 text-gray-800">
                          직접 작성하기 귀찮다면,
                        </p>
                        <p className="text-title1 text-gray-800">
                          AI에게
                          <span className="text-[#11ABFF]"> 영수증</span>을
                          맡겨봐요
                        </p>
                      </div>
                      <p className="text-body1-semibold text-gray-500 leading-relaxed">
                        영수증 사진을 업로드만 하면,
                      </p>
                      <p className="text-body1-semibold text-gray-500 leading-relaxed">
                        AI가 자동으로 분석하여 가계부 작성을 도와줘요.
                      </p>
                    </div>
                    {/* 오른쪽 - 이미지 */}
                    <div className="flex-shrink-0">
                      <img
                        src="/images/landing/영수증작성예시.jpg"
                        alt="영수증 작성 예시"
                        className="w-40 h-auto rounded-2xl object-contain"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4. PWA 설치 영역 */}
          <div className="min-h-[400px] py-12 px-6 flex items-center justify-center bg-gray-50">
            <div className="max-w-xl text-center">
              <p className="text-title1 text-gray-800 mb-5">
                <span className="text-[#11ABFF]">달쿠미</span>를 홈 화면에
                추가하고 앱처럼 편하게 사용하세요
              </p>
              <br />
              <button
                onClick={handleInstallClick}
                className="px-10 py-3 text-white bg-[#11ABFF] rounded-4xl text-title1 hover:bg-sky-400 transition-colors cursor-pointer shadow-lg"
              >
                {isInstallable ? "설치하기" : "설치 방법 보기"}
              </button>
              <br />
              <br />
              <p className="text-body1-semibold text-gray-800 mt-4">
                iOS, Android, PC 지원
              </p>
            </div>
          </div>

          {/* 5. FAQ 영역 */}
          <div className="min-h-[500px] py-20 px-6 bg-sky-50">
            <div className="max-w-xl mx-auto">
              {/* FAQ 제목 */}
              <h2 className="text-header text-gray-800 text-center mb-10">
                자주 묻는 질문
              </h2>

              {/* FAQ 아코디언 */}
              <div className="flex flex-col gap-3">
                {faqs.map((faq, index) => (
                  <div key={index} className="rounded-lg overflow-hidden">
                    {/* 질문 - 클릭 가능 */}
                    <button
                      onClick={() =>
                        setOpenFaqIndex(openFaqIndex === index ? null : index)
                      }
                      className="w-full text-left p-4 bg-sky-50 hover:transition-colors cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        {/* Q 아이콘 */}
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#11ABFF] flex items-center justify-center">
                          <span className="text-white text-body2-regular">
                            Q
                          </span>
                        </div>
                        {/* 질문 텍스트 */}
                        <span className="text-subtitle text-gray-800">
                          {faq.question}
                        </span>
                      </div>
                      {/* 화살표 아이콘 */}
                      <svg
                        className={`w-6 h-6 text-gray-400 transition-transform ${
                          openFaqIndex === index ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

                    {/* 답변 - 펼쳐졌을 때만 보임 */}
                    {openFaqIndex === index && (
                      <div className="p-8 py-0.5 bg-sky-50">
                        <p className="text-body2-regular text-gray-600 leading-relaxed whitespace-pre-line">
                          {faq.answer}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. 고정 푸터 */}
      <div className="flex-shrink-0 z-40">
        <footer className="bg-blue-50 border-t border-blue-100 py-3 px-10">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col gap-2">
              {/* Contacts - 첫 번째 줄 */}
              <div className="flex items-center gap-3">
                <h3 className="text-xs font-semibold text-gray-800 w-16 flex-shrink-0">
                  Contacts
                </h3>
                <div className="flex font-semibold items-center gap-3">
                  <a
                    href="mailto:dalcoomi.team@gmail.com"
                    className="text-[11px] text-gray-500 hover:text-blue-600 transition-colors"
                  >
                    dalcoomi.team@gmail.com
                  </a>
                  <span className="text-xs text-gray-200">|</span>
                  <a
                    href="https://forms.gle/ucj6CNNx25wzB9a88"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-semibold text-gray-500 hover:text-blue-600 transition-colors"
                  >
                    문의하기
                  </a>
                </div>
              </div>

              {/* Socials - 두 번째 줄 */}
              <div className="flex items-center gap-3">
                <h3 className="text-xs font-semibold text-gray-800 w-16 flex-shrink-0">
                  Socials
                </h3>
                <div className="flex font-semibold items-center gap-3">
                  <a
                    href="https://github.com/Dalcoomi"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px]  text-gray-500 hover:text-blue-600 transition-colors"
                  >
                    GitHub
                  </a>
                </div>
              </div>

              {/* Copyright 및 약관 - 하단 중앙 */}
              <div className="flex font-semibold items-center justify-center gap-2 border-t border-blue-100 pt-2 mt-1">
                <a
                  href="https://dalcoomi.notion.site/2326ea725ec880d69db1ecccb049bcf9"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-gray-500 hover:text-blue-600 transition-colors"
                >
                  이용약관
                </a>
                <a
                  href="https://dalcoomi.notion.site/2326ea725ec881628880db9f9f487680"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-gray-500 hover:text-blue-600 transition-colors"
                >
                  개인정보처리방침
                </a>
                <p className="text-[10px] text-gray-500">
                  {`Copyright © ${currentYear} 달쿠미. All rights reserved.`}
                </p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
