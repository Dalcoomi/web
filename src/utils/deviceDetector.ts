// utils/deviceDetector.ts

/**
 * 디바이스 타입 enum
 */
export enum DeviceType {
  WEB = "WEB",
  MOBILE = "MOBILE",
}

/**
 * 현재 디바이스 타입을 감지하는 함수
 * User-Agent와 화면 크기를 기반으로 판단
 */
export const getDeviceType = (): DeviceType => {
  if (typeof window === "undefined") {
    return DeviceType.WEB;
  }

  const userAgent = navigator.userAgent.toLowerCase();
  const isMobileUA =
    /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
      userAgent
    );

  // 화면 크기도 함께 고려 (모바일 브라우저에서 데스크톱 모드인 경우 대비)
  const isMobileScreen = window.innerWidth <= 768;

  return isMobileUA || isMobileScreen ? DeviceType.MOBILE : DeviceType.WEB;
};
