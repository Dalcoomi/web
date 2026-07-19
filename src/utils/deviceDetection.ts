// utils/deviceDetection.ts

interface IOSNavigator extends Navigator {
  standalone?: boolean;
}

export const isPWA = (): boolean => {
  // 여러 방법으로 PWA 감지
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as IOSNavigator).standalone === true ||
    document.referrer.includes("android-app://") ||
    /wv/.test(navigator.userAgent) // WebView 감지
  );
};

export const isMobile = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

export const isDesktopPWA = (): boolean => {
  // PWA이면서 모바일이 아닌 경우 = 데스크톱 PWA
  return isPWA() && !isMobile();
};
