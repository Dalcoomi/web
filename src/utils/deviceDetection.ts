// utils/deviceDetection.ts

export const isPWA = (): boolean => {
  // 여러 방법으로 PWA 감지
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes("android-app://") ||
    /wv/.test(navigator.userAgent) // WebView 감지
  );
};

export const isMobile = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};
