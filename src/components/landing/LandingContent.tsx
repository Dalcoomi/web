// components/landing/LandingContent.tsx
"use client";

import { useRef, useState } from "react";

export default function LandingContent() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // 로고 클릭 시 맨 위로 스크롤
  const handleLogoClick = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const features = [
    {
      title: "빠른 작성",
      description: "간단한 UI로 빠르게 지출, 수입 내역을 작성할 수 있어요",
    },
    {
      title: "그룹 기능",
      description:
        "그룹을 생성하고 초대 코드를 공유하면 가족, 친구, 동료와 함께 공동으로 가계부를 관리할 수 있어요",
    },
    {
      title: "AI 영수증 분석",
      description:
        "영수증 사진을 업로드하면 AI가 자동으로 분석하여 가계부 작성을 도와줘요",
    },
  ];

  const faqs = [
    {
      question: "앱 서비스는 없나요?",
      answer: "iOS 모바일 앱을 개발 중이며, 앱스토어에 조만간 출시 예정입니다.",
    },
    {
      question: "개인 정보나 가계부 정보들이 노출될까 봐 걱정돼요",
      answer:
        "달쿠미는 개인, 금액 등 민감한 정보 데이터들을 철저히 암호화해서 보관하고 있습니다.",
    },
    {
      question: "계정에 문제가 있어요",
      answer:
        "현재 페이지 하단에 Contacts를 통해 문의해 주시면 최대한 빠르게 확인해서 조치해 드리겠습니다.",
    },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* 1. 고정 탑바 */}
      <div className="flex-shrink-0 h-10 bg-blue-50 border-b border-blue-100 flex items-center px-6">
        {/* 왼쪽 - 아이콘과 로고 */}
        <button
          onClick={handleLogoClick}
          className="flex items-center gap-1 -mx-2 hover:cursor-pointer"
        >
          <img
            src="/icons/icon-192x192.png"
            alt="달쿠미"
            className="w-5 h-5 rounded"
          />
          <span className="text-sm text-sky-500">달쿠미</span>
        </button>

        {/* 오른쪽 영역 (향후 확장용) */}
        <div className="ml-auto">{/* 추후 버튼들이 여기에 들어갈 예정 */}</div>
      </div>

      {/* 2. 스크롤 가능한 바디 콘텐츠 */}
      <div className="flex-1 overflow-hidden relative">
        <div ref={scrollRef} className="absolute inset-0 overflow-y-auto">
          {/* 1. 로고 + 타이틀 영역 - 흰색 배경 (고정 높이) */}
          <div className="relative h-[200px] px-6 bg-white flex items-center justify-center">
            <div className="flex items-center gap-7">
              {/* 왼쪽 - 로고 */}
              <div className="flex-shrink-0">
                <img
                  src="/icons/icon-512x512.png"
                  alt="달쿠미 로고"
                  className="w-32 h-32 object-contain"
                />
              </div>
              {/* 오른쪽 - 타이틀 */}
              <div>
                <h1 className="text-3xl font-bold text-sky-500">달쿠미</h1>
                <p className="text-md text-sky-400">
                  개인과 그룹을 위한 AI 가계부 서비스
                </p>
              </div>
            </div>
          </div>

          {/* 2. 서비스 소개 영역 - 연한 파랑 배경 (고정 높이) */}
          <div className="h-[200px] px-6 bg-sky-400 flex items-center justify-center">
            <div className="max-w-xl mx-auto text-center">
              <p className="text-2xl text-green-50 leading-relaxed">
                간편한 가계부 서비스를 제공해요
              </p>
              <br />
              <p className="text-md text-green-50">
                저희는 기존에 복잡한 작성 과정을 해결했어요
              </p>
              <p className="text-md text-green-50">
                또한 혼자서는 물론이고 친구나 동료와 함께 가계부를 관리할 수
                있어요
              </p>
            </div>
          </div>

          {/* 3. 주요 기능 영역 - 흰색 배경 (나머지 공간 채우기) */}
          <div className="min-h-[400px] py-10 px-6 bg-white">
            <div className="max-w-xl mx-auto pl-3">
              <div className="flex flex-col gap-4">
                {features.map((feature, index) => (
                  <div key={index} className="w-full">
                    {/* 첫 번째 카드(빠른 입력) - 이미지 왼쪽 */}
                    {index === 0 ? (
                      <div className="p-5 rounded-2xl bg-sky-50 flex items-center gap-4">
                        {/* 왼쪽 - 이미지 */}
                        <div className="flex-shrink-0">
                          <img
                            src="/images/landing/가계부작성예시.jpg"
                            alt="가계부 작성 예시"
                            className="w-40 h-auto rounded-lg object-contain"
                          />
                        </div>
                        {/* 오른쪽 - 텍스트 */}
                        <div className="flex-1 flex flex-col items-start">
                          <div className="inline-block px-3 py-1 mb-3 bg-yellow-200 rounded-lg shadow-sm">
                            <h3 className="text-lg text-gray-700">
                              {feature.title}
                            </h3>
                          </div>
                          <p className="text-md text-gray-600 leading-relaxed">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    ) : index === 1 ? (
                      /* 두 번째 카드(그룹 가계부) - 이미지 오른쪽 */
                      <div className="p-5 rounded-2xl bg-sky-50 flex items-center gap-4">
                        {/* 왼쪽 - 텍스트 */}
                        <div className="flex-1 flex flex-col items-end">
                          <div className="inline-block px-3 py-1 mb-3 bg-yellow-200 rounded-lg shadow-sm">
                            <h3 className="text-lg text-gray-700">
                              {feature.title}
                            </h3>
                          </div>
                          <p className="text-md text-gray-600 leading-relaxed">
                            {feature.description}
                          </p>
                        </div>
                        {/* 오른쪽 - 이미지 */}
                        <div className="flex-shrink-0">
                          <img
                            src="/images/landing/그룹가계부예시.jpg"
                            alt="그룹 가계부 예시"
                            className="w-40 h-auto rounded-lg object-contain"
                          />
                        </div>
                      </div>
                    ) : (
                      /* 세 번째 카드 */
                      <div className="p-5 rounded-2xl bg-sky-50 flex flex-col items-center">
                        <div className="inline-block px-3 py-1 mb-3 bg-yellow-200 rounded-lg shadow-sm">
                          <h3 className="text-lg text-gray-700">
                            {feature.title}
                          </h3>
                        </div>
                        <p className="text-md text-gray-600 leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 4. FAQ 영역 - 흰색 배경 */}
          <div className="min-h-[500px] py-10 px-6 bg-sky-50">
            <div className="max-w-xl mx-auto">
              {/* FAQ 제목 */}
              <h2 className="text-3xl font-bold text-black text-center mb-10">
                FAQ
              </h2>

              {/* FAQ 아코디언 */}
              <div className="flex flex-col gap-3">
                {faqs.map((faq, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg overflow-hidden"
                  >
                    {/* 질문 - 클릭 가능 */}
                    <button
                      onClick={() =>
                        setOpenFaqIndex(openFaqIndex === index ? null : index)
                      }
                      className="w-full text-left p-4 bg-white hover:bg-sky-100 transition-colors cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        {/* Q 아이콘 */}
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-sky-400 flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            Q
                          </span>
                        </div>
                        {/* 질문 텍스트 */}
                        <span className="text-lg text-gray-800">
                          {faq.question}
                        </span>
                      </div>
                      <span className="text-gray-400 text-xl">
                        {openFaqIndex === index ? "−" : "+"}
                      </span>
                    </button>

                    {/* 답변 - 펼쳐졌을 때만 보임 */}
                    {openFaqIndex === index && (
                      <div className="p-5 pl-7 bg-white">
                        <p className="text-sm text-gray-600 leading-relaxed">
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
                <div className="flex items-center gap-3">
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
                    className="text-[11px] text-gray-500 hover:text-blue-600 transition-colors"
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
                <div className="flex items-center gap-3">
                  <a
                    href="https://github.com/Dalcoomi"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-gray-500 hover:text-blue-600 transition-colors"
                  >
                    GitHub
                  </a>
                </div>
              </div>

              {/* Copyright 및 약관 - 하단 중앙 */}
              <div className="flex items-center justify-center gap-2 border-t border-blue-100 pt-2 mt-1">
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
                  Copyright © 2025 달쿠미. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
