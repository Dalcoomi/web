"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import TransactionHeaderV2 from "@/components/transaction/v2/TransactionHeaderV2";
import TransactionTypeToggleV2, {
  ViewMode,
} from "@/components/transaction/v2/TransactionTypeToggleV2";
import TransactionFloatingButtonV2 from "@/components/transaction/v2/TransactionFloatingButtonV2";
import { useMemberStore } from "@/stores/useMemberStore";

export default function GroupTransactionEmptyPageClientV2() {
  const router = useRouter();
  const { fetchMember } = useMemberStore();

  // 사이드바 상태
  const [showSidebar, setShowSidebar] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // 개인/그룹 토글 상태
  const [viewMode, setViewMode] = useState<ViewMode>("group");

  const handleViewModeToggle = (mode: ViewMode) => {
    if (mode === "personal") {
      router.push("/transaction/my");
    } else {
      // 이미 그룹 모드이므로 유지
      setViewMode(mode);
    }
  };

  // 플로팅 버튼 토글 상태
  const [isFloatingMenuOpen, setIsFloatingMenuOpen] = useState<boolean>(false);

  // 날짜 관련 상태 (표시용)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const hasFetchedMember = useRef(false);

  useEffect(() => {
    if (!hasFetchedMember.current) {
      fetchMember();
      hasFetchedMember.current = true;
    }
  }, [fetchMember]);

  // 외부 클릭 감지 (사이드바)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        setShowSidebar(false);
      }
    };

    if (showSidebar) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSidebar]);

  // 사이드바 메뉴 핸들러
  const handleMenuClick = () => {
    setShowSidebar(true);
  };

  const handleMyPage = () => {
    setShowSidebar(false);
    router.push("/profile");
  };

  const handleNotice = () => {
    alert("서비스 준비 중입니다.");
  };

  const handleContactUs = () => {
    window.open("https://forms.gle/ucj6CNNx25wzB9a88", "_blank");
  };

  const formatDateForDisplay = (date: Date): string => {
    return `${date.getFullYear()}. ${date.getMonth() + 1}월`;
  };

  const handlePrevMonth = () => {
    const newDate = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth() - 1,
      1
    );
    setSelectedDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth() + 1,
      1
    );
    setSelectedDate(newDate);
  };

  // 플로팅 버튼 핸들러
  const handleFloatingButtonClick = () => {
    setIsFloatingMenuOpen((prev) => !prev);
  };

  const handleEnterInviteCode = () => {
    router.push("/group/join");
  };

  const handleCreateGroup = () => {
    router.push("/group/create");
  };

  return (
    <div className="flex flex-col h-screen bg-gray-30 relative font-landing overflow-hidden">
      {/* 상단바 */}
      <TransactionHeaderV2
        title={formatDateForDisplay(selectedDate)}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onMenuClick={handleMenuClick}
      />

      {/* 사이드바 */}
      {showSidebar && (
        <>
          <div
            className="absolute inset-0 bg-[#d9d9d9] opacity-50 z-40"
            onClick={() => setShowSidebar(false)}
          />
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
                  <span className="text-subtitle text-gray-900">
                    마이페이지
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
      )}

      {/* 메인 컨텐츠 영역 */}
      <div className="flex-1 flex flex-col items-center justify-center pb-20">
        <div className="bg-white px-3 py-1.5 rounded-full mb-4">
          <span className="text-blue-600 text-caption1-semibold">
            새로운 그룹을 만들어봐요~!
          </span>
        </div>
        <Image
          src="/images/transaction/v2/요약_카드_캐릭터.svg"
          alt="캐릭터"
          width={100}
          height={100}
        />
      </div>

      {isFloatingMenuOpen && (
        <div
          className="absolute inset-0 bg-black/20 z-40"
          onClick={() => setIsFloatingMenuOpen(false)}
        />
      )}

      {/* 하단 개인/그룹 토글 및 플로팅 버튼 */}
      <div className="absolute bottom-0 left-0 right-0 pb-6 px-4 flex items-end justify-between pointer-events-none">
        <TransactionTypeToggleV2
          viewMode={viewMode}
          onToggle={handleViewModeToggle}
        />

        <TransactionFloatingButtonV2
          isOpen={isFloatingMenuOpen}
          onToggle={handleFloatingButtonClick}
          onEnterInviteCode={handleEnterInviteCode}
          onCreateGroup={handleCreateGroup}
        />
      </div>
    </div>
  );
}
