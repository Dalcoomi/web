import { useToastStore } from "@/stores/useToastStore";
import { useCallback } from "react";

/**
 * 클립보드 복사 훅
 * 모바일 사파리 등 다양한 환경 대응을 위해 Clipboard API와 execCommand를 모두 사용합니다.
 */
export function useCopyToClipboard() {
  const addToast = useToastStore((state) => state.addToast);

  const copy = useCallback(
    async (text: string, successMessage?: string): Promise<boolean> => {
      // 1. 최신 방식: navigator.clipboard (HTTPS 환경에서만 동작)
      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(text);
          addToast("success", successMessage || "클립보드에 복사되었어요.");
          return true;
        } catch (error) {
          console.warn("Clipboard API 복사 실패, Fallback 시도:", error);
        }
      }

      // 2. 구식 방식 (Fallback): document.execCommand
      // 모바일 사파리 등 일부 환경에서 필요
      try {
        const textArea = document.createElement("textarea");
        textArea.value = text;

        // 화면 밖으로 숨김 처리 (display: none은 focus가 안될 수 있음)
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";

        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        const successful = document.execCommand("copy");
        document.body.removeChild(textArea);

        if (successful) {
          addToast("success", successMessage || "클립보드에 복사되었어요.");
          return true;
        }
      } catch (error) {
        console.error("Fallback 복사 실패:", error);
      }

      addToast("error", "복사에 실패했어요. 직접 복사해주세요.");
      return false;
    },
    [addToast],
  );

  return copy;
}
