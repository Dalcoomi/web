"use client";

import { useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToastStore } from "@/stores/useToastStore";
import { isDemoMode } from "@/utils/demoMode";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const router = useRouter();
  const addToast = useToastStore((state) => state.addToast);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isGuest = isDemoMode();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleMyPage = () => {
    if (isGuest) {
      onClose();
      router.push("/?panel=login");
      return;
    }

    onClose();
    router.push("/profile");
  };

  const handleNotice = () => {
    addToast("info", "서비스 준비 중입니다.");
  };

  const handleContactUs = () => {
    window.open("https://forms.gle/ucj6CNNx25wzB9a88", "_blank");
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <>
      <div
        className="absolute inset-0 bg-[#d9d9d9] opacity-50 z-60"
        onClick={onClose}
      />

      <div
        ref={sidebarRef}
        className="absolute top-0 right-0 h-full w-48 bg-white shadow-lg border-l border-[#E0E0E0] transform transition-transform duration-300 ease-in-out z-70"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pt-6 px-4">
          <div className="space-y-2">
            <button
              onClick={handleMyPage}
              className="w-full text-left p-3 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
            >
              <span className="text-subtitle text-gray-900">
                {isGuest ? "로그인" : "마이페이지"}
              </span>
            </button>
            <button
              onClick={handleNotice}
              className="w-full text-left p-3 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
            >
              <span className="text-subtitle text-gray-900">공지사항</span>
            </button>
            <button
              onClick={handleContactUs}
              className="w-full text-left p-3 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
            >
              <span className="text-subtitle text-gray-900">문의하기</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
