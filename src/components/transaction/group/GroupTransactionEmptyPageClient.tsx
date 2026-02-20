"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import TransactionHeader from "@/components/transaction/v2/TransactionHeader";
import TransactionTypeToggle, {
  ViewMode,
} from "@/components/transaction/v2/TransactionTypeToggle";
import TransactionFloatingButton from "@/components/transaction/v2/TransactionFloatingButton";
import { useMemberStore } from "@/stores/useMemberStore";
import Sidebar from "@/components/ui/Sidebar";
import { getGroups } from "@/services/groupService";

export default function GroupTransactionEmptyPageClient() {
  const router = useRouter();
  const { fetchMember } = useMemberStore();

  const [showSidebar, setShowSidebar] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("group");
  const [isFloatingMenuOpen, setIsFloatingMenuOpen] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [hasResolvedGroups, setHasResolvedGroups] = useState(false);

  const hasFetchedMember = useRef(false);

  useEffect(() => {
    if (!hasFetchedMember.current) {
      fetchMember();
      hasFetchedMember.current = true;
    }
  }, [fetchMember]);

  useEffect(() => {
    let isCancelled = false;

    const resolveGroups = async () => {
      try {
        const response = await getGroups();
        const groups = response.groups ?? [];

        if (!isCancelled && groups.length > 0) {
          router.replace(`/transaction/group/${groups[0].teamId}`);
          return;
        }
      } catch {
        // 그룹 조회 실패 시에는 기존 빈 상태 화면을 유지
      } finally {
        if (!isCancelled) {
          setHasResolvedGroups(true);
        }
      }
    };

    resolveGroups();

    return () => {
      isCancelled = true;
    };
  }, [router]);

  const handleViewModeToggle = (mode: ViewMode) => {
    if (mode === "personal") {
      router.push("/transaction/my");
    } else {
      setViewMode(mode);
    }
  };

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
      <TransactionHeader
        title={formatDateForDisplay(selectedDate)}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onMenuClick={handleMenuClick}
      />

      <Sidebar isOpen={showSidebar} onClose={() => setShowSidebar(false)} />

      {hasResolvedGroups && (
        <>
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

          {!isFloatingMenuOpen && !showSidebar && (
            <div
              className="absolute bottom-22 flex flex-col items-start pointer-events-none z-50"
              style={{ right: "45.65px" }}
            >
              <span className="text-caption2-semibold text-green-600">Tip</span>
              <span className="text-caption1-semibold text-gray-900 mt-2">
                새로운 그룹을 생성하거나
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
        </>
      )}

      {isFloatingMenuOpen && (
        <div
          className="absolute inset-0 bg-black/20 z-40"
          onClick={() => setIsFloatingMenuOpen(false)}
        />
      )}

      <div className="absolute bottom-0 left-0 right-0 pb-6 px-4 flex items-end justify-between pointer-events-none">
        <TransactionTypeToggle
          viewMode={viewMode}
          onToggle={handleViewModeToggle}
        />

        <TransactionFloatingButton
          isOpen={isFloatingMenuOpen}
          onToggle={handleFloatingButtonClick}
          onEnterInviteCode={handleEnterInviteCode}
          onCreateGroup={handleCreateGroup}
        />
      </div>
    </div>
  );
}
