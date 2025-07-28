// components/common/ViewportFixer.tsx

"use client";

import { useEffect } from "react";

export default function ViewportFixer() {
  useEffect(() => {
    const setVH = () => {
      // 실제 뷰포트 높이를 CSS 변수로 설정
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };

    // 초기 설정
    setVH();

    // 다양한 이벤트에서 뷰포트 재계산
    const events = [
      "resize",
      "orientationchange",
      "pageshow",
      "visibilitychange",
    ];

    events.forEach((event) => {
      window.addEventListener(event, setVH);
    });

    // PWA에서 특별히 필요한 처리
    if (window.matchMedia("(display-mode: standalone)").matches) {
      // PWA에서는 약간의 지연 후 다시 계산
      setTimeout(setVH, 100);
      setTimeout(setVH, 500);
    }

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, setVH);
      });
    };
  }, []);

  return null;
}
