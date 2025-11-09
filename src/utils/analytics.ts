// utils/analytics.ts

/**
 * Google Analytics 이벤트 추적 유틸리티
 * 타입 정의는 src/types/analytics.d.ts 참조
 */

/**
 * GA 페이지뷰 이벤트 전송
 * @param url - 페이지 URL
 */
export const sendPageView = (url: string) => {
  if (typeof window === "undefined" || !window.gtag) return;

  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  if (!measurementId) return;

  window.gtag("config", measurementId, {
    page_path: url,
  });
};

/**
 * GA 커스텀 이벤트 전송
 * @param eventName - 이벤트 이름
 * @param parameters - 이벤트 파라미터
 */
export const sendEvent = (
  eventName: string,
  parameters?: Record<string, unknown>
) => {
  if (typeof window === "undefined" || !window.gtag) return;

  window.gtag("event", eventName, parameters);
};

/**
 * 회원가입 완료 이벤트
 */
export const trackSignUp = (method: "kakao" | "naver" | "email") => {
  sendEvent("sign_up", {
    method,
  });
};

/**
 * 로그인 완료 이벤트
 */
export const trackLogin = (method: "kakao" | "naver" | "email") => {
  sendEvent("login", {
    method,
  });
};

/**
 * 거래 생성 이벤트
 */
export const trackTransactionCreate = (
  type: "income" | "expense",
  category?: string
) => {
  sendEvent("transaction_create", {
    transaction_type: type,
    category,
  });
};

/**
 * 그룹 생성 이벤트
 */
export const trackGroupCreate = () => {
  sendEvent("group_create");
};

/**
 * 그룹 참여 이벤트
 */
export const trackGroupJoin = () => {
  sendEvent("group_join");
};

/**
 * 프로필 수정 이벤트
 */
export const trackProfileUpdate = (field: "avatar" | "nickname" | "info") => {
  sendEvent("profile_update", {
    field,
  });
};

/**
 * AI 영수증 스캔 이벤트
 */
export const trackReceiptScan = () => {
  sendEvent("receipt_scan");
};

/**
 * 검색 이벤트
 */
export const trackSearch = (searchTerm: string) => {
  sendEvent("search", {
    search_term: searchTerm,
  });
};

/**
 * 공유 이벤트
 */
export const trackShare = (contentType: string, method: string) => {
  sendEvent("share", {
    content_type: contentType,
    method,
  });
};
