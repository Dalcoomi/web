"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useToastStore, Toast, ToastType } from "@/stores/useToastStore";

const ICON_MAP: Record<ToastType, string> = {
  success: "/images/transaction/v2/토스트_성공.svg",
  error: "/images/transaction/v2/토스트_실패.svg",
  info: "/images/transaction/v2/토스트_정보.svg",
};

function ToastItem({ toast }: { toast: Toast }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const removeToast = useToastStore((state) => state.removeToast);

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

  return (
    <div
      className="flex items-center min-h-12 bg-white rounded-full pl-3 pr-5 py-3 shadow-lg transition-transform duration-300 ease-out whitespace-nowrap"
      style={{
        transform:
          isVisible && !isLeaving ? "translateY(0)" : "translateY(-100%)",
        opacity: isVisible && !isLeaving ? 1 : 0,
        transition: "transform 300ms ease-out, opacity 300ms ease-out",
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
    <div className="absolute top-12 left-1/2 -translate-x-1/2 z-9999 flex flex-col items-center gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
