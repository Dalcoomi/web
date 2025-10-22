/**
 * 날짜 유틸리티 함수 모음
 */

/**
 * Date 객체를 YYYY-MM-DD 형식 문자열로 변환
 * @param date - Date 객체
 * @returns YYYY-MM-DD 형식의 문자열
 */
export const formatDateToISO = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Date 객체 또는 YYYY-MM-DD 형식 문자열을 YY/MM/DD 형식으로 변환
 * @param date - Date 객체 또는 YYYY-MM-DD 형식 문자열
 * @returns YY/MM/DD 형식의 문자열 (예: 25/10/10)
 */
export const formatDateToDisplay = (date: Date | string): string => {
  let dateObj: Date;

  if (typeof date === "string") {
    dateObj = new Date(date);
  } else {
    dateObj = date;
  }

  const year = String(dateObj.getFullYear()).slice(-2); // 마지막 두 자리
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");

  return `${year}/${month}/${day}`;
};

/**
 * YY/MM/DD 형식 문자열을 YYYY-MM-DD 형식으로 변환
 * @param displayDate - YY/MM/DD 형식 문자열 (예: 25/10/10)
 * @returns YYYY-MM-DD 형식의 문자열
 */
export const parseDisplayDate = (displayDate: string): string => {
  const parts = displayDate.split("/");
  if (parts.length !== 3) {
    return formatDateToISO(new Date());
  }

  const [yy, mm, dd] = parts;
  const currentCentury = Math.floor(new Date().getFullYear() / 100) * 100;
  const year = currentCentury + parseInt(yy, 10);

  return `${year}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
};

/**
 * YY/MM/DD 형식 문자열을 Date 객체로 변환
 * @param displayDate - YY/MM/DD 형식 문자열 (예: 25/10/10)
 * @returns Date 객체
 */
export const parseDisplayDateToDate = (displayDate: string): Date => {
  const isoDate = parseDisplayDate(displayDate);
  return new Date(isoDate);
};

/**
 * 입력값이 유효한 YY/MM/DD 형식인지 검증
 * @param value - 검증할 문자열
 * @returns 유효하면 true, 아니면 false
 */
export const isValidDisplayDate = (value: string): boolean => {
  const regex = /^(\d{2})\/(\d{2})\/(\d{2})$/;
  const match = value.match(regex);

  if (!match) return false;

  const [, yy, mm, dd] = match;
  const month = parseInt(mm, 10);
  const day = parseInt(dd, 10);

  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  return true;
};
