"use client";

import { useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToastStore } from "@/stores/useToastStore";

interface SidebarV2Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function SidebarV2({ isOpen, onClose }: SidebarV2Props) {
  const router = useRouter();
  const addToast = useToastStore((state) => state.addToast);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 감지
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

  // 메뉴 항목 클릭 핸들러들
  const handleMyPage = () => {
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
      {/* 반투명 오버레이 */}
      <div
        className="absolute inset-0 bg-[#d9d9d9] opacity-50 z-40"
        onClick={onClose}
      />

      {/* 사이드바 본문 */}
      <div
        ref={sidebarRef}
        className="absolute top-0 right-0 h-full w-48 bg-white shadow-lg border-l border-[#E0E0E0] transform transition-transform duration-300 ease-in-out z-50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pt-6 px-4">
          <div className="space-y-2">
            <button
              onClick={handleMyPage}
              className="w-full text-left p-3 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
            >
              <span className="text-subtitle text-gray-900">마이페이지</span>
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
