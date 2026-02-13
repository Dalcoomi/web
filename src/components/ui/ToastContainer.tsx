"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useToastStore, Toast, ToastType } from "@/stores/useToastStore";

const ICON_MAP: Record<ToastType, string> = {
  success: "/images/transaction/v2/토스트_성공.svg",
  error: "/images/transaction/v2/토스트_실패.svg",
  info: "/images/transaction/v2/토스트_정보.svg",
};

function ToastItem({
  toast,
  index,
  total,
}: {
  toast: Toast;
  index: number;
  total: number;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const removeToast = useToastStore((state) => state.removeToast);

  // 역순 인덱스 (0이 가장 최신)
  const reverseIndex = total - 1 - index;

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));

    const leaveTimer = setTimeout(() => {
      setIsLeaving(true);
    }, 4500);

    const removeTimer = setTimeout(() => {
      removeToast(toast.id);
    }, 5000);

    return () => {
      clearTimeout(leaveTimer);
      clearTimeout(removeTimer);
    };
  }, [toast.id, removeToast]);

  // 스택 효과를 위한 스타일 계산
  const offset = reverseIndex * 12; // 겹치는 간격
  const scale = 1 - reverseIndex * 0.05; // 뒤로 갈수록 작아짐
  const isHidden = reverseIndex > 2; // 3개까지만 보이게 처리

  return (
    <div
      className="col-start-1 row-start-1 flex items-center min-h-12 bg-white rounded-full pl-3 pr-5 py-3 shadow-lg transition-all duration-300 ease-out whitespace-nowrap pointer-events-auto"
      style={{
        zIndex: total - reverseIndex,
        transform:
          isVisible && !isLeaving
            ? `translateY(${offset}px) scale(${scale})`
            : `translateY(-20px) scale(0.9)`,
        opacity: isVisible && !isLeaving && !isHidden ? 1 : 0,
      }}
    >
      <Image
        src={ICON_MAP[toast.type]}
        alt={toast.type}
        width={24}
        height={24}
        className="shrink-0"
      />
      <span className="text-body1-semibold text-gray-900 ml-2">
        {toast.message}
      </span>
    </div>
  );
}

export default function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="absolute top-12 left-1/2 -translate-x-1/2 z-9999 grid place-items-center pointer-events-none">
      {toasts.map((toast, index) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          index={index}
          total={toasts.length}
        />
      ))}
    </div>
  );
}
