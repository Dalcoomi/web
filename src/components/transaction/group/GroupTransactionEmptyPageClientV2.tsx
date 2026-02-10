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
import SidebarV2 from "@/components/ui/SidebarV2";

export default function GroupTransactionEmptyPageClientV2() {
  const router = useRouter();
  const { fetchMember } = useMemberStore();

  // 사이드바 상태
  const [showSidebar, setShowSidebar] = useState(false);

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

  // 사이드바 메뉴 핸들러
  const handleMenuClick = () => {
    setShowSidebar(true);
  };

  const formatDateForDisplay = (date: Date): string => {
    return `${date.getFullYear()}. ${date.getMonth() + 1}월`;
  };

  const handlePrevMonth = () => {
    const newDate = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth() - 1,
      1,
    );
    setSelectedDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth() + 1,
      1,
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

      <SidebarV2 isOpen={showSidebar} onClose={() => setShowSidebar(false)} />

      {/* 메인 컨텐츠 영역 - 팁 섹션(~142px) + 간격(120px) = bottom 약 350px */}
      <div
        className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none"
        style={{ bottom: "350px" }}
      >
        <Image
          src="/images/transaction/v2/empty_캐릭터.svg"
          alt="참여 중인 그룹 없음"
          width={120}
          height={120}
          className="opacity-40 mix-blend-luminosity"
        />
        <span className="text-subtitle text-gray-300">
          참여 중인 그룹이 없어요.
        </span>
      </div>

      {isFloatingMenuOpen && (
        <div
          className="absolute inset-0 bg-black/20 z-40"
          onClick={() => setIsFloatingMenuOpen(false)}
        />
      )}

      {/* 플로팅 버튼 위 안내 섹션 */}
      {!isFloatingMenuOpen && (
        <div
          className="absolute bottom-22 flex flex-col items-start pointer-events-none z-50"
          style={{ right: "45.65px" }}
        >
          <span className="text-caption2-semibold text-green-600">Tip</span>
          <span className="text-caption1-semibold text-gray-900 mt-2">
            새로운 그룹을 생성하거나,
            <br />
            초대 코드를 입력해보세요!
          </span>
          <Image
            src="/images/transaction/v2/그룹_안내_arrow.svg"
            alt="안내 화살표"
            width={64}
            height={64}
            className="mt-3 self-end"
          />
        </div>
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
