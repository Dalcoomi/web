"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  type PointerEvent,
} from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Image from "next/image";
import GroupTransactionItem from "@/components/transaction/GroupTransactionItem";
import TransactionHeader from "@/components/transaction/v2/TransactionHeader";
import GroupNameCard from "@/components/transaction/v2/GroupNameCard";
import TransactionSummary from "@/components/transaction/v2/TransactionSummary";
import TransactionTotal from "@/components/transaction/v2/TransactionTotal";
import TransactionFilter from "@/components/transaction/v2/TransactionFilter";
import SortBottomSheet, {
  SortOption,
} from "@/components/transaction/v2/SortBottomSheet";
import FilterBottomSheet from "@/components/transaction/v2/FilterBottomSheet";
import TransactionTypeToggle, {
  ViewMode,
} from "@/components/transaction/v2/TransactionTypeToggle";
import TransactionFloatingButton from "@/components/transaction/v2/TransactionFloatingButton";
import {
  getTransactions,
  MonthlyTransactionsResponse,
  TransactionSearchCriteria,
} from "@/services/transactionService";
import {
  getGroupInfo,
  GroupInfo,
  getGroups,
  Group,
  updateGroupOrder,
} from "@/services/groupService";
import { useMemberStore } from "@/stores/useMemberStore";
import { useToastStore } from "@/stores/useToastStore";
import TransactionPageSkeleton from "@/components/skeletons/TransactionPageSkeleton";
import Skeleton from "@/components/skeletons/Skeleton";
import Sidebar from "@/components/ui/Sidebar";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { getTeamCategories } from "@/services/categoryService";
import DemoModeTopBanner from "@/components/common/DemoModeTopBanner";
import { isDemoMode } from "@/utils/demoMode";
import { arrayMove } from "@dnd-kit/sortable";
import type { TransactionCategoriesByType } from "@/features/transaction/model/transactionFilter";
import { useAnimatedModal } from "@/hooks/useAnimatedModal";
import { useTransactionFilters } from "@/features/transaction/hooks/useTransactionFilters";
import GroupSwitcherModal from "@/features/transaction/components/GroupSwitcherModal";

let cachedGroupModalList: Group[] = [];
const MAX_GROUPS_PER_MEMBER = 3;
const MAX_GROUPS_REACHED_MESSAGE =
  "이미 최대 3개 그룹에 참여 중이어서 새 그룹을 만들 수 없어요.";
const GROUP_FILTER_STORAGE_KEY_PREFIX = "group-transaction-filter-v1";

export default function GroupTransactionPageClient() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const teamId = params.teamId as string;
  const isValidTeamId = /^\d+$/.test(teamId);
  const groupModalQuery = searchParams.get("groupModal");
  const { member, fetchMember } = useMemberStore();
  const addToast = useToastStore((state) => state.addToast);
  const copyToClipboard = useCopyToClipboard();

  // 사이드바 상태
  const [showSidebar, setShowSidebar] = useState(false);
  const [isGroupModalMounted, setIsGroupModalMounted] = useState(
    groupModalQuery === "open",
  );
  const [showGroupModal, setShowGroupModal] = useState(
    groupModalQuery === "open",
  );
  const [groupInfoActionLabel, setGroupInfoActionLabel] = useState(
    "그룹 정보 확인하기",
  );
  const [groups, setGroups] = useState<Group[]>(cachedGroupModalList);
  const [editableGroups, setEditableGroups] = useState<Group[]>(
    cachedGroupModalList,
  );
  const [isGroupOrderEditMode, setIsGroupOrderEditMode] = useState(false);
  const [isSavingGroupOrder, setIsSavingGroupOrder] = useState(false);

  // 개인/그룹 토글 상태
  const [viewMode, setViewMode] = useState<ViewMode>("group");

  const handleViewModeToggle = (mode: ViewMode) => {
    if (mode === "personal") {
      router.push("/transaction/my");
    } else {
      // 이미 그룹 페이지인 경우 현재 날짜로 초기화
      setViewMode(mode);
      setSelectedDate(new Date());
    }
  };

  // 플로팅 버튼 토글 상태
  const [isFloatingMenuOpen, setIsFloatingMenuOpen] = useState<boolean>(false);
  const [selectedSort, setSelectedSort] = useState<SortOption>("최신순");
  const {
    isMounted: isSortModalMounted,
    isOpen: showSortModal,
    open: openSortModal,
    close: handleCloseSortModal,
  } = useAnimatedModal();
  const [categoriesByType, setCategoriesByType] =
    useState<TransactionCategoriesByType>({
      ALL: [],
      EXPENSE: [],
      INCOME: [],
    });

  // 날짜 관련 상태
  const getSavedDate = (): Date => {
    if (typeof window === "undefined") return new Date();
    const saved = sessionStorage.getItem(`group-transaction-date-${teamId}`);
    const now = new Date();
    if (saved) {
      const parsed = new Date(saved);
      if (!isNaN(parsed.getTime())) {
        if (
          isDemoMode() &&
          (parsed.getFullYear() !== now.getFullYear() ||
            parsed.getMonth() !== now.getMonth())
        ) {
          return now;
        }
        return parsed;
      }
    }
    return now;
  };

  const [selectedDate, setSelectedDate] = useState<Date>(getSavedDate());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [response, setResponse] = useState<MonthlyTransactionsResponse>({
    income: 0,
    expense: 0,
    total: 0,
    transactions: [],
  });
  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);

  // 중복 호출 방지를 위한 ref
  const lastRequestRef = useRef<string>("");
  const isRequestInProgressRef = useRef<boolean>(false);

  // 스크롤 위치 저장/복원을 위한 ref
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const shouldRestoreScroll = useRef(false);
  const summarySectionRef = useRef<HTMLDivElement>(null);
  const stickyThresholdRef = useRef(0);

  const closeModalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasFetchedMember = useRef(false);
  const hasOpenedFromQueryRef = useRef(false);
  const modalDragStartYRef = useRef<number | null>(null);
  const modalIsDraggingRef = useRef(false);
  const [modalDragOffset, setModalDragOffset] = useState(0);
  const MODAL_CLOSE_DRAG_THRESHOLD = 160;
  const groupFilterStorageKey = `${GROUP_FILTER_STORAGE_KEY_PREFIX}-${teamId}`;
  const allCreatorNicknames = useMemo(
    () =>
      (groupInfo?.members ?? []).map((memberInfo) => memberInfo.nickname),
    [groupInfo?.members],
  );
  const {
    appliedFilter,
    draftFilter,
    setDraftFilter,
    filterButtonLabel,
    isFilterModalMounted,
    showFilterModal,
    openFilter: openFilterModal,
    closeFilter: handleCloseFilterModal,
    resetFilter: handleResetFilter,
    applyFilter: handleApplyFilter,
  } = useTransactionFilters({
    storageKey: groupFilterStorageKey,
    categoriesByType,
    creatorNicknames: allCreatorNicknames,
    enabled: isValidTeamId,
  });
  const getCanEditGroupInfo = useCallback((
    info: GroupInfo | null,
    groupList: Group[],
    currentTeamId: string,
    nickname?: string,
  ) => {
    if (typeof info?.isLeader === "boolean") {
      return info.isLeader;
    }

    const currentGroup = groupList.find(
      (group) => String(group.teamId) === String(currentTeamId),
    );
    if (typeof currentGroup?.isLeader === "boolean") {
      return currentGroup.isLeader;
    }

    if (!nickname || !info?.leaderNickname) {
      return false;
    }

    return info.leaderNickname === nickname;
  }, []);

  useEffect(() => {
    if (!hasFetchedMember.current) {
      fetchMember();
      hasFetchedMember.current = true;
    }
  }, [fetchMember]);

  useEffect(() => {
    let isCancelled = false;

    const validateTeamRoute = async () => {
      if (!isValidTeamId) {
        router.replace("/transaction/group");
        return;
      }

      const groupsResponse = await getGroups();
      const myGroups = groupsResponse.groups ?? [];
      if (!isCancelled) {
        cachedGroupModalList = myGroups;
        setGroups(myGroups);
        setEditableGroups(myGroups);
      }
      const isMemberOfTeam = myGroups.some(
        (group) => String(group.teamId) === String(teamId),
      );

      if (!isCancelled && !isMemberOfTeam) {
        router.replace("/transaction/group");
      }
    };

    void validateTeamRoute();

    return () => {
      isCancelled = true;
    };
  }, [isValidTeamId, router, teamId]);

  useEffect(() => {
    return () => {
      if (closeModalTimerRef.current) {
        clearTimeout(closeModalTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setGroupInfoActionLabel("그룹 정보 확인하기");
    setGroupInfo(null);
    setIsGroupOrderEditMode(false);
    setIsSavingGroupOrder(false);
  }, [teamId]);

  // 그룹 정보 로딩
  useEffect(() => {
    if (!teamId || !isValidTeamId) return;

    let isCancelled = false;

    const fetchGroupInfo = async () => {
      try {
        const info = await getGroupInfo(teamId);
        if (!isCancelled) {
          setGroupInfo(info);
        }
      } catch (error) {
        console.error("Failed to fetch group info:", error);
        // router.replace("/group"); // 에러 시 그룹 목록으로 이동? 일단 유지
      }
    };

    fetchGroupInfo();

    return () => {
      isCancelled = true;
    };
  }, [isValidTeamId, teamId]);

  useEffect(() => {
    if (!teamId || !isValidTeamId) return;

    const fetchCategories = async () => {
      const numericTeamId = Number(teamId);
      const [expenseCategories, incomeCategories] = await Promise.all([
        getTeamCategories(numericTeamId, "EXPENSE"),
        getTeamCategories(numericTeamId, "INCOME"),
      ]);

      const expenseNames = expenseCategories.map((category) => category.name);
      const incomeNames = incomeCategories.map((category) => category.name);
      const all = Array.from(new Set([...expenseNames, ...incomeNames]));

      setCategoriesByType({
        ALL: all,
        EXPENSE: expenseNames,
        INCOME: incomeNames,
      });
    };

    void fetchCategories();
  }, [isValidTeamId, teamId]);

  // 사이드바 메뉴 핸들러
  const handleMenuClick = () => {
    setShowSidebar(true);
  };

  // 페이지 진입 시 스크롤 위치 복원 플래그 설정
  useEffect(() => {
    if (!isValidTeamId) return;

    const savedScroll = sessionStorage.getItem(
      `group-transaction-scroll-${teamId}`,
    );
    const scrollPos = savedScroll ? parseInt(savedScroll, 10) : 0;
    if (Number.isFinite(scrollPos) && scrollPos > 0) {
      shouldRestoreScroll.current = true;
    }
  }, [isValidTeamId, teamId]);

  // 데이터 로딩 완료 후 스크롤 복원
  useEffect(() => {
    if (
      !isLoading &&
      shouldRestoreScroll.current &&
      scrollContainerRef.current &&
      response.transactions.length > 0
    ) {
      const savedScroll = sessionStorage.getItem(
        `group-transaction-scroll-${teamId}`,
      );
      if (savedScroll) {
        const scrollPos = parseInt(savedScroll, 10);
        setTimeout(() => {
          requestAnimationFrame(() => {
            if (scrollContainerRef.current) {
              scrollContainerRef.current.scrollTop = scrollPos;
              shouldRestoreScroll.current = false;
            }
          });
        }, 100);
      }
    } else if (!isLoading && shouldRestoreScroll.current) {
      shouldRestoreScroll.current = false;
    }
  }, [isLoading, response.transactions, teamId]);

  // 스크롤 시 총액 섹션 스타일 변경을 위한 상태
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    const updateStickyThreshold = () => {
      stickyThresholdRef.current = summarySectionRef.current?.offsetHeight ?? 0;
      const scrollPos = scrollContainerRef.current?.scrollTop ?? 0;
      setIsSticky(scrollPos >= stickyThresholdRef.current);
    };

    const rafId = requestAnimationFrame(updateStickyThreshold);
    window.addEventListener("resize", updateStickyThreshold);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", updateStickyThreshold);
    };
  }, [isLoading, response.transactions.length]);

  // 날짜 변경 시 저장
  useEffect(() => {
    sessionStorage.setItem(
      `group-transaction-date-${teamId}`,
      selectedDate.toISOString(),
    );
  }, [selectedDate, teamId]);

  // 통합된 useEffect로 중복 호출 방지
  useEffect(() => {
    if (!teamId || !isValidTeamId) return;

    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth() + 1;
    const requestKey = `${teamId}-${year}-${month}`;

    if (
      isRequestInProgressRef.current &&
      lastRequestRef.current === requestKey
    ) {
      return;
    }

    setIsLoading(true);

    const timeoutId = setTimeout(() => {
      if (
        isRequestInProgressRef.current &&
        lastRequestRef.current === requestKey
      ) {
        return;
      }

      isRequestInProgressRef.current = true;
      lastRequestRef.current = requestKey;

      const fetchData = async () => {
        try {
          const criteria: TransactionSearchCriteria = {
            teamId: parseInt(teamId),
            year,
            month,
          };

          const response = await getTransactions(criteria);
          setResponse(response);
        } catch (error) {
          if (error instanceof Error && error.message.includes("401")) {
            window.location.href = "/";
            return;
          }

          setResponse({
            income: 0,
            expense: 0,
            total: 0,
            transactions: [],
          });
        } finally {
          setIsLoading(false);
          isRequestInProgressRef.current = false;
        }
      };

      fetchData();
    }, 300);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isValidTeamId, selectedDate, teamId]);

  // 필터링된 거래 내역 가져오기
  const getFilteredTransactions = () => {
    const filtered = response.transactions.filter((transaction) => {
      if (
        appliedFilter.type !== "ALL" &&
        transaction.transactionType !== appliedFilter.type
      ) {
        return false;
      }

      if (
        appliedFilter.categoryNames.length > 0 &&
        !appliedFilter.categoryNames.includes(transaction.categoryName)
      ) {
        return false;
      }

      if (
        appliedFilter.creatorNicknames.length > 0 &&
        !appliedFilter.creatorNicknames.includes(transaction.creatorNickname)
      ) {
        return false;
      }
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (selectedSort === "오래된 순") {
        return (
          new Date(a.transactionDate).getTime() -
          new Date(b.transactionDate).getTime()
        );
      }

      if (selectedSort === "높은 금액 순") {
        return b.amount - a.amount;
      }

      if (selectedSort === "낮은 금액 순") {
        return a.amount - b.amount;
      }

      return (
        new Date(b.transactionDate).getTime() -
        new Date(a.transactionDate).getTime()
      );
    });
  };

  // 날짜 변경 핸들러
  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  // 날짜를 "MM.DD" 형식으로 변환
  const formatDateToMMDD = (dateString: string): string => {
    const date = new Date(dateString);
    return `${(date.getMonth() + 1).toString().padStart(2, "0")}.${date
      .getDate()
      .toString()
      .padStart(2, "0")}`;
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
    handleDateChange(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth() + 1,
      1,
    );
    handleDateChange(newDate);
  };

  // 스크롤 이벤트 핸들러
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const scrollPos = scrollContainerRef.current.scrollTop;
      setIsSticky(scrollPos >= stickyThresholdRef.current);
      sessionStorage.setItem(
        `group-transaction-scroll-${teamId}`,
        scrollPos.toString(),
      );
    }
  };

  // 플로팅 버튼 핸들러
  const handleFloatingButtonClick = () => {
    setIsFloatingMenuOpen((prev) => !prev);
  };

  const handleWritingTransaction = () => {
    setIsFloatingMenuOpen(false);
    router.push(`/transaction/group/${teamId}/add/writing`);
  };

  const handleReceiptTransaction = () => {
    if (isDemoMode()) {
      setIsFloatingMenuOpen(false);
      addToast("info", "로그인 시 이용 가능합니다.");
      return;
    }

    addToast("info", "서비스 점검 중입니다.");
  };

  const handleOpenSortModal = () => {
    setIsFloatingMenuOpen(false);
    openSortModal();
  };

  const handleSelectSort = (sort: SortOption) => {
    setSelectedSort(sort);
    handleCloseSortModal();
  };

  const handleOpenFilterModal = () => {
    setIsFloatingMenuOpen(false);
    openFilterModal();
  };

  const openGroupModalWithResolvedLabel = useCallback(async () => {
    hasOpenedFromQueryRef.current = true;

    try {
      const [info, groupsResponse] = await Promise.all([
        getGroupInfo(teamId),
        getGroups(),
      ]);
      setGroupInfo(info);
      const fetchedGroups = groupsResponse.groups ?? [];
      setGroups(fetchedGroups);
      setEditableGroups(fetchedGroups);
      setIsGroupOrderEditMode(false);
      setIsSavingGroupOrder(false);

      const canEdit = getCanEditGroupInfo(
        info,
        fetchedGroups,
        teamId,
        member?.nickname,
      );

      setGroupInfoActionLabel(canEdit ? "그룹 정보 수정하기" : "그룹 정보 확인하기");
    } catch {
      setGroupInfoActionLabel("그룹 정보 확인하기");
    }

    if (closeModalTimerRef.current) {
      clearTimeout(closeModalTimerRef.current);
      closeModalTimerRef.current = null;
    }

    if (!isGroupModalMounted) {
      setIsGroupModalMounted(true);
      requestAnimationFrame(() => setShowGroupModal(true));
    } else {
      setShowGroupModal(true);
    }

    router.replace(`/transaction/group/${teamId}?groupModal=open`, {
      scroll: false,
    });
  }, [getCanEditGroupInfo, isGroupModalMounted, member?.nickname, router, teamId]);

  useEffect(() => {
    if (groupModalQuery !== "open") {
      hasOpenedFromQueryRef.current = false;
      return;
    }

    if (hasOpenedFromQueryRef.current) {
      return;
    }

    hasOpenedFromQueryRef.current = true;
    void openGroupModalWithResolvedLabel();
  }, [groupModalQuery, openGroupModalWithResolvedLabel]);

  // 그룹 정보 이동
  const handleGroupInfo = async () => {
    await openGroupModalWithResolvedLabel();
  };

  const handleEnterInviteCode = () => {
    if (isDemoMode()) {
      setIsFloatingMenuOpen(false);
      addToast("info", "로그인 시 이용 가능합니다.");
      return;
    }

    router.push("/group/join");
  };

  const handleCreateGroup = async (): Promise<boolean> => {
    const knownGroups =
      groups.length > 0 ? groups : cachedGroupModalList;
    const groupCount = knownGroups.length;

    if (groupCount >= MAX_GROUPS_PER_MEMBER) {
      addToast("info", MAX_GROUPS_REACHED_MESSAGE);
      return false;
    }

    router.push("/group/create");
    return true;
  };

  const handleCreateGroupFromModal = async () => {
    const canNavigate = await handleCreateGroup();
    if (canNavigate) {
      setShowGroupModal(false);
    }
  };

  const handleCloseGroupModal = () => {
    setModalDragOffset(0);
    setShowGroupModal(false);
    setIsGroupOrderEditMode(false);
    setIsSavingGroupOrder(false);
    setEditableGroups(groups);

    if (closeModalTimerRef.current) {
      clearTimeout(closeModalTimerRef.current);
    }

    closeModalTimerRef.current = setTimeout(() => {
      setIsGroupModalMounted(false);
      router.replace(`/transaction/group/${teamId}`, { scroll: false });
      closeModalTimerRef.current = null;
    }, 220);
  };

  const handleModalHandlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    modalIsDraggingRef.current = true;
    modalDragStartYRef.current = e.clientY;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleModalHandlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!modalIsDraggingRef.current || modalDragStartYRef.current === null) {
      return;
    }

    const deltaY = Math.max(0, e.clientY - modalDragStartYRef.current);
    setModalDragOffset(deltaY);
  };

  const handleModalHandlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (!modalIsDraggingRef.current) return;

    modalIsDraggingRef.current = false;
    modalDragStartYRef.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);

    if (modalDragOffset > MODAL_CLOSE_DRAG_THRESHOLD) {
      handleCloseGroupModal();
      return;
    }

    setModalDragOffset(0);
  };

  const handleSelectGroup = (selectedTeamId: string) => {
    if (isGroupOrderEditMode) return;
    if (selectedTeamId === teamId) return;
    sessionStorage.removeItem(`group-transaction-date-${selectedTeamId}`);
    sessionStorage.removeItem(`group-transaction-scroll-${selectedTeamId}`);
    router.push(`/transaction/group/${selectedTeamId}?groupModal=open`);
  };

  const handleGroupOrderEditToggle = () => {
    if (isGroupOrderEditMode) return;
    setEditableGroups(groups);
    setIsGroupOrderEditMode(true);
  };

  const handleCompleteGroupOrderEdit = async () => {
    if (!isGroupOrderEditMode || isSavingGroupOrder) return;
    setIsSavingGroupOrder(true);

    try {
      await updateGroupOrder(
        editableGroups.map((group, index) => ({
          teamId: group.teamId,
          displayOrder: index,
        })),
      );

      cachedGroupModalList = editableGroups;
      setGroups(editableGroups);
      setIsGroupOrderEditMode(false);
    } catch {
      addToast("error", "그룹 순서 저장에 실패했습니다.");
    } finally {
      setIsSavingGroupOrder(false);
    }
  };

  const handleGroupOrderDragEnd = (
    activeTeamId: string,
    overTeamId: string,
  ) => {
    if (!isGroupOrderEditMode) return;
    if (activeTeamId === overTeamId) return;

    setEditableGroups((prev) => {
      const oldIndex = prev.findIndex(
        (group) => group.teamId === activeTeamId,
      );
      const newIndex = prev.findIndex(
        (group) => group.teamId === overTeamId,
      );
      if (oldIndex < 0 || newIndex < 0) {
        return prev;
      }
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const handleGroupInfoEdit = () => {
    setShowGroupModal(false);
    router.push(`/group/info/${teamId}`);
  };

  const handleGroupInvite = async () => {
    try {
      const info =
        groupInfo && groupInfo.teamId === teamId
          ? groupInfo
          : await getGroupInfo(teamId);
      if (!info?.invitationCode) {
        addToast("error", "초대 코드를 불러올 수 없습니다.");
        return;
      }
      await copyToClipboard(info.invitationCode, "초대 코드가 복사되었습니다.");
      router.replace(`/transaction/group/${teamId}`, { scroll: false });
    } catch (error) {
      addToast("error", String(error) || "초대 코드 복사에 실패했습니다.");
    }
  };

  useEffect(() => {
    if (isGroupOrderEditMode) return;
    if (!isGroupModalMounted) return;

    const fetchGroups = async () => {
      try {
        const response = await getGroups();
        const nextGroups = response.groups || [];
        cachedGroupModalList = nextGroups;
        setGroups(nextGroups);
        setEditableGroups(nextGroups);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "그룹 목록을 불러오지 못했습니다.";
        addToast("error", message);
      }
    };

    fetchGroups();
  }, [isGroupModalMounted, isGroupOrderEditMode, addToast]);

  return (
    <div className="flex flex-col h-screen bg-gray-30 relative font-landing overflow-hidden">
      <DemoModeTopBanner />

      {/* 상단바 */}
      <TransactionHeader
        title={formatDateForDisplay(selectedDate)}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onMenuClick={handleMenuClick}
      />

      <Sidebar isOpen={showSidebar} onClose={() => setShowSidebar(false)} />

      {/* 그룹명 섹션 */}
      <div className="px-5 pt-2 pb-1 bg-gray-30">
        {isLoading ? (
          <div className="bg-white rounded-[18px] pl-5 pr-4 h-[56px] flex items-center gap-3">
            <Skeleton className="w-[10px] h-[10px] rounded-full" />
            <Skeleton className="h-5 w-[241px] rounded-md" />
          </div>
        ) : (
          <GroupNameCard
            groupName={groupInfo?.title}
            label={groupInfo?.label}
            onInfoClick={handleGroupInfo}
            onNameClick={handleGroupInfo}
          />
        )}
      </div>

      {/* 메인 컨텐츠 영역 */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto flex flex-col relative scrollbar-hide z-10 bg-gray-30"
      >
        {isLoading ? (
          <TransactionPageSkeleton />
        ) : (
          <>
            {/* 요약 카드 상단 (스크롤됨) */}
            <div ref={summarySectionRef} className="px-5 pt-1 bg-gray-30">
              <TransactionSummary
                income={response.income}
                expense={response.expense}
                showCharacter={response.transactions.length > 0}
              />
            </div>

            {/* 요약 카드 하단 (총액) - Sticky */}
            <div
              className={`sticky top-0 z-30 px-5 pb-5 bg-gray-30 transition-all duration-300 ${
                isSticky ? "pt-1" : "pt-0"
              }`}
            >
              <TransactionTotal total={response.total} isSticky={isSticky} />
            </div>

            {/* 거래 내역 목록 영역 - White Sheet */}
            <div className="bg-white flex-1">
              {/* 필터 버튼 영역 (Sticky) */}
              <TransactionFilter
                selectedSort={selectedSort}
                selectedAll={filterButtonLabel}
                onSortToggle={handleOpenSortModal}
                onAllToggle={handleOpenFilterModal}
                stickyTopClass={isSticky ? "top-[106px]" : "top-[102px]"}
              />

              {/* 리스트 */}
              <div className="space-y-0">
                {(() => {
                  const filteredTransactions = getFilteredTransactions();
                  return filteredTransactions.length > 0 ? (
                    <>
                      {filteredTransactions.map((transaction, index) => {
                        const currentDate = formatDateToMMDD(
                          transaction.transactionDate,
                        );
                        const prevDate =
                          index > 0
                            ? formatDateToMMDD(
                                filteredTransactions[index - 1].transactionDate,
                              )
                            : null;
                        const shouldShowDate = prevDate !== currentDate;

                        return (
                          <GroupTransactionItem
                            key={transaction.transactionId}
                            teamId={teamId}
                            date={shouldShowDate ? currentDate : ""}
                            category={transaction.categoryName}
                            description={transaction.content}
                            creator={transaction.creatorNickname}
                            creatorProfileImageUrl={
                              transaction.creatorProfileImageUrl
                            }
                            amount={
                              transaction.transactionType === "EXPENSE"
                                ? -transaction.amount
                                : transaction.amount
                            }
                            transactionId={transaction.transactionId}
                            showSeparator={index > 0 && shouldShowDate}
                          />
                        );
                      })}
                      <div className="h-24 bg-white" />
                    </>
                  ) : (
                    <div className="flex flex-col items-center mt-11">
                      <Image
                        src="/images/transaction/v2/empty_캐릭터.svg"
                        alt="데이터 없음"
                        width={120}
                        height={120}
                        className="opacity-40 mix-blend-luminosity"
                      />
                      <span className="text-subtitle text-gray-300">
                        아직 작성된 기록이 없어요.
                      </span>
                    </div>
                  );
                })()}
              </div>
            </div>
          </>
        )}
      </div>

      <SortBottomSheet
        isMounted={isSortModalMounted}
        isOpen={showSortModal}
        selectedSort={selectedSort}
        onClose={handleCloseSortModal}
        onSelect={handleSelectSort}
      />

      <FilterBottomSheet
        isMounted={isFilterModalMounted}
        isOpen={showFilterModal}
        isGroup
        categoriesByType={categoriesByType}
        creators={(groupInfo?.members ?? []).map((memberInfo) => ({
          nickname: memberInfo.nickname,
          profileImageUrl: memberInfo.profileImageUrl,
        }))}
        draft={draftFilter}
        onChangeDraft={setDraftFilter}
        onReset={handleResetFilter}
        onApply={handleApplyFilter}
        onClose={handleCloseFilterModal}
      />

      <GroupSwitcherModal
        isMounted={isGroupModalMounted}
        isOpen={showGroupModal}
        isDragging={modalIsDraggingRef.current}
        dragOffset={modalDragOffset}
        groups={groups}
        editableGroups={editableGroups}
        selectedTeamId={teamId}
        isEditMode={isGroupOrderEditMode}
        isSavingOrder={isSavingGroupOrder}
        infoActionLabel={groupInfoActionLabel}
        onClose={handleCloseGroupModal}
        onHandlePointerDown={handleModalHandlePointerDown}
        onHandlePointerMove={handleModalHandlePointerMove}
        onHandlePointerUp={handleModalHandlePointerUp}
        onToggleOrderEdit={handleGroupOrderEditToggle}
        onCompleteOrderEdit={handleCompleteGroupOrderEdit}
        onReorder={handleGroupOrderDragEnd}
        onSelectGroup={handleSelectGroup}
        onCreateGroup={handleCreateGroupFromModal}
        onOpenGroupInfo={handleGroupInfoEdit}
        onInviteGroup={handleGroupInvite}
      />

      {!isGroupModalMounted && !isSortModalMounted && !isFilterModalMounted && (
        <>
          {isFloatingMenuOpen && (
            <div
              className="absolute inset-0 bg-black/20 z-40"
              onClick={() => setIsFloatingMenuOpen(false)}
            />
          )}

          {/* 하단 개인/그룹 토글 및 플로팅 버튼 */}
          <div className="absolute bottom-0 left-0 right-0 pb-6 px-4 flex items-end justify-between pointer-events-none">
            <TransactionTypeToggle
              viewMode={viewMode}
              onToggle={handleViewModeToggle}
            />

            <TransactionFloatingButton
              isOpen={isFloatingMenuOpen}
              onToggle={handleFloatingButtonClick}
              onWriteDirect={handleWritingTransaction}
              onWriteReceipt={handleReceiptTransaction}
              onEnterInviteCode={handleEnterInviteCode}
              onCreateGroup={handleCreateGroup}
            />
          </div>
        </>
      )}
    </div>
  );
}

