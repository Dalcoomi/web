// utils/cookieManager.ts

/**
 * 쿠키를 설정하는 함수
 * @param name 쿠키 이름
 * @param value 쿠키 값
 * @param days 유효 기간(일) - 지정하지 않으면 세션 쿠키
 */
export const setCookie = (name: string, value: string, days?: number) => {
  if (typeof window === "undefined") return; // 서버 사이드에서 실행 방지

  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = `; expires=${date.toUTCString()}`;
  }

  document.cookie = `${name}=${value}${expires}; path=/`;
};

/**
 * 쿠키 값을 가져오는 함수
 * @param name 쿠키 이름
 * @returns 쿠키 값 또는 null
 */
export const getCookie = (name: string): string | null => {
  if (typeof window === "undefined") return null; // 서버 사이드에서 실행 방지

  const nameEQ = `${name}=`;
  const ca = document.cookie.split(";");

  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === " ") c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }

  return null;
};

/**
 * 쿠키를 삭제하는 함수
 * @param name 삭제할 쿠키 이름
 */
export const eraseCookie = (name: string) => {
  if (typeof window === "undefined") return; // 서버 사이드에서 실행 방지

  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
};

/**
 * 모든 쿠키를 가져오는 함수
 * @returns 쿠키 객체 {이름: 값}
 */
export const getAllCookies = (): Record<string, string> => {
  if (typeof window === "undefined") return {}; // 서버 사이드에서 실행 방지

  const cookies: Record<string, string> = {};
  const ca = document.cookie.split(";");

  for (let i = 0; i < ca.length; i++) {
    const c = ca[i].trim();
    if (!c) continue;

    const parts = c.split("=");
    if (parts.length >= 2) {
      const name = parts[0];
      const value = parts.slice(1).join("=");
      cookies[name] = value;
    }
  }

  return cookies;
};
