"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  type CSSProperties,
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
import FilterBottomSheet, {
  FilterDraftState,
} from "@/components/transaction/v2/FilterBottomSheet";
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
import { BRAND_COLORS } from "@/constants/brandColors";
import { getTeamCategories } from "@/services/categoryService";
import DemoModeTopBanner from "@/components/common/DemoModeTopBanner";
import { isDemoMode } from "@/utils/demoMode";
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import {
  restrictToParentElement,
  restrictToVerticalAxis,
} from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";

let cachedGroupModalList: Group[] = [];
const MAX_GROUPS_PER_MEMBER = 3;
const MAX_GROUPS_REACHED_MESSAGE =
  "이미 최대 3개 그룹에 참여 중이어서 새 그룹을 만들 수 없어요.";
const GROUP_FILTER_STORAGE_KEY_PREFIX = "group-transaction-filter-v1";

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const isTransactionTypeFilter = (
  value: unknown,
): value is FilterDraftState["type"] =>
  value === "ALL" || value === "EXPENSE" || value === "INCOME";

const isSameStringSet = (selected: string[], all: string[]) =>
  selected.length === all.length && all.every((item) => selected.includes(item));

const isSameFilterState = (a: FilterDraftState, b: FilterDraftState) =>
  a.type === b.type &&
  a.categoryNames.length === b.categoryNames.length &&
  a.creatorNicknames.length === b.creatorNicknames.length &&
  a.categoryNames.every((item) => b.categoryNames.includes(item)) &&
  a.creatorNicknames.every((item) => b.creatorNicknames.includes(item));

const readStoredFilter = (storageKey: string): FilterDraftState | null => {
  if (typeof window === "undefined") return null;

  const raw = sessionStorage.getItem(storageKey);
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;

    const candidate = parsed as Partial<FilterDraftState>;
    if (
      !isTransactionTypeFilter(candidate.type) ||
      !isStringArray(candidate.categoryNames) ||
      !isStringArray(candidate.creatorNicknames)
    ) {
      return null;
    }

    return {
      type: candidate.type,
      categoryNames: candidate.categoryNames,
      creatorNicknames: candidate.creatorNicknames,
    };
  } catch {
    return null;
  }
};

const normalizeFilterState = (
  filter: FilterDraftState,
  allCategories: string[],
  allCreators: string[],
): FilterDraftState => {
  const categoryNames = filter.categoryNames.filter((name) =>
    allCategories.includes(name),
  );
  const creatorNicknames =
    allCreators.length === 0
      ? filter.creatorNicknames
      : filter.creatorNicknames.filter((nickname) =>
          allCreators.includes(nickname),
        );

  return {
    ...filter,
    categoryNames,
    creatorNicknames,
  };
};

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
  const [isSortModalMounted, setIsSortModalMounted] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [isFilterModalMounted, setIsFilterModalMounted] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [appliedFilter, setAppliedFilter] = useState<FilterDraftState>({
    type: "ALL",
    categoryNames: [],
    creatorNicknames: [],
  });
  const [draftFilter, setDraftFilter] = useState<FilterDraftState>({
    type: "ALL",
    categoryNames: [],
    creatorNicknames: [],
  });
  const [categoriesByType, setCategoriesByType] = useState<{
    ALL: string[];
    EXPENSE: string[];
    INCOME: string[];
  }>({
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
  const hasHydratedFilterRef = useRef(false);

  const closeModalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sortModalCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const filterModalCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const hasFetchedMember = useRef(false);
  const hasOpenedFromQueryRef = useRef(false);
  const modalDragStartYRef = useRef<number | null>(null);
  const modalIsDraggingRef = useRef(false);
  const [modalDragOffset, setModalDragOffset] = useState(0);
  const MODAL_CLOSE_DRAG_THRESHOLD = 160;
  const groupFilterStorageKey = `${GROUP_FILTER_STORAGE_KEY_PREFIX}-${teamId}`;
  const groupOrderSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 120,
        tolerance: 8,
      },
    }),
  );
  const allCreatorNicknames = useMemo(
    () =>
      (groupInfo?.members ?? []).map((memberInfo) => memberInfo.nickname),
    [groupInfo?.members],
  );
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
      if (sortModalCloseTimerRef.current) {
        clearTimeout(sortModalCloseTimerRef.current);
      }
      if (filterModalCloseTimerRef.current) {
        clearTimeout(filterModalCloseTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setGroupInfoActionLabel("그룹 정보 확인하기");
    setGroupInfo(null);
    hasHydratedFilterRef.current = false;
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

  useEffect(() => {
    const allCategories = categoriesByType.ALL;
    if (allCategories.length === 0 || !isValidTeamId) return;

    const defaultFilter: FilterDraftState = {
      type: "ALL",
      categoryNames: allCategories,
      creatorNicknames: allCreatorNicknames,
    };

    if (!hasHydratedFilterRef.current) {
      const stored = readStoredFilter(groupFilterStorageKey);
      const next = normalizeFilterState(
        stored ?? defaultFilter,
        allCategories,
        allCreatorNicknames,
      );
      setAppliedFilter(next);
      setDraftFilter(next);
      hasHydratedFilterRef.current = true;
      return;
    }

    setAppliedFilter((prev) => {
      const next = normalizeFilterState(prev, allCategories, allCreatorNicknames);
      return isSameFilterState(prev, next) ? prev : next;
    });
    setDraftFilter((prev) => {
      const next = normalizeFilterState(prev, allCategories, allCreatorNicknames);
      return isSameFilterState(prev, next) ? prev : next;
    });
  }, [
    allCreatorNicknames,
    categoriesByType.ALL,
    groupFilterStorageKey,
    isValidTeamId,
  ]);

  useEffect(() => {
    if (!hasHydratedFilterRef.current || !isValidTeamId) return;
    if (typeof window === "undefined") return;
    sessionStorage.setItem(groupFilterStorageKey, JSON.stringify(appliedFilter));
  }, [appliedFilter, groupFilterStorageKey, isValidTeamId]);

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

  const isCategoryFilterApplied =
    categoriesByType.ALL.length > 0 &&
    appliedFilter.categoryNames.length > 0 &&
    !isSameStringSet(appliedFilter.categoryNames, categoriesByType.ALL);
  const isCreatorFilterApplied =
    allCreatorNicknames.length > 0 &&
    appliedFilter.creatorNicknames.length > 0 &&
    !isSameStringSet(appliedFilter.creatorNicknames, allCreatorNicknames);
  const isFilterApplied =
    appliedFilter.type !== "ALL" ||
    isCategoryFilterApplied ||
    isCreatorFilterApplied;
  const filterButtonLabel = isFilterApplied ? "필터 적용 중" : "필터";

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

    if (sortModalCloseTimerRef.current) {
      clearTimeout(sortModalCloseTimerRef.current);
      sortModalCloseTimerRef.current = null;
    }

    if (!isSortModalMounted) {
      setIsSortModalMounted(true);
      requestAnimationFrame(() => setShowSortModal(true));
      return;
    }

    setShowSortModal(true);
  };

  const handleCloseSortModal = () => {
    setShowSortModal(false);

    if (sortModalCloseTimerRef.current) {
      clearTimeout(sortModalCloseTimerRef.current);
    }

    sortModalCloseTimerRef.current = setTimeout(() => {
      setIsSortModalMounted(false);
      sortModalCloseTimerRef.current = null;
    }, 220);
  };

  const handleSelectSort = (sort: SortOption) => {
    setSelectedSort(sort);
    handleCloseSortModal();
  };

  const handleOpenFilterModal = () => {
    setIsFloatingMenuOpen(false);

    if (filterModalCloseTimerRef.current) {
      clearTimeout(filterModalCloseTimerRef.current);
      filterModalCloseTimerRef.current = null;
    }

    setDraftFilter(appliedFilter);

    if (!isFilterModalMounted) {
      setIsFilterModalMounted(true);
      requestAnimationFrame(() => setShowFilterModal(true));
      return;
    }

    setShowFilterModal(true);
  };

  const handleCloseFilterModal = () => {
    setShowFilterModal(false);

    if (filterModalCloseTimerRef.current) {
      clearTimeout(filterModalCloseTimerRef.current);
    }

    filterModalCloseTimerRef.current = setTimeout(() => {
      setIsFilterModalMounted(false);
      filterModalCloseTimerRef.current = null;
    }, 220);
  };

  const handleResetFilter = () => {
    const allCategories = categoriesByType.ALL;
    const allCreatorNicknames = (groupInfo?.members ?? []).map(
      (memberInfo) => memberInfo.nickname,
    );

    setDraftFilter({
      type: "ALL",
      categoryNames: allCategories,
      creatorNicknames: allCreatorNicknames,
    });
  };

  const handleApplyFilter = () => {
    setAppliedFilter(draftFilter);
    handleCloseFilterModal();
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

  const handleGroupOrderDragEnd = (event: DragEndEvent) => {
    if (!isGroupOrderEditMode) return;

    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setEditableGroups((prev) => {
      const oldIndex = prev.findIndex((group) => group.teamId === active.id);
      const newIndex = prev.findIndex((group) => group.teamId === over.id);
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

  const getLabelColor = (label?: string) => {
    if (!label) return BRAND_COLORS.gray;
    return label in BRAND_COLORS
      ? BRAND_COLORS[label as keyof typeof BRAND_COLORS]
      : BRAND_COLORS.gray;
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

      {isGroupModalMounted && (
        <>
          <div
            className={`absolute inset-0 z-40 transition-opacity duration-200 ${
              showGroupModal
                ? "bg-[#d9d9d9] opacity-50"
                : "bg-[#d9d9d9] opacity-0"
            }`}
            onClick={handleCloseGroupModal}
          />
          <div
            className={`absolute left-0 right-0 bottom-0 z-50 bg-gray-30 rounded-t-[20px] rounded-b-none px-5 pt-3 pb-0 ${
              modalIsDraggingRef.current
                ? ""
                : "transition-transform duration-200 ease-out"
            }`}
            style={{
              transform: showGroupModal
                ? `translateY(${modalDragOffset}px)`
                : "translateY(100%)",
            }}
          >
            <div
              className="w-16 h-[5px] bg-gray-100 rounded-[100px] mx-auto mb-5 cursor-grab active:cursor-grabbing touch-none"
              onPointerDown={handleModalHandlePointerDown}
              onPointerMove={handleModalHandlePointerMove}
              onPointerUp={handleModalHandlePointerUp}
              onPointerCancel={handleModalHandlePointerUp}
            />

            <div className="mt-2 mb-3 flex items-center justify-between">
              <p className="text-body2-semibold text-gray-500">그룹 목록</p>
              {groups.length > 0 && (
                <button
                  type="button"
                  disabled={isSavingGroupOrder}
                  onClick={
                    isGroupOrderEditMode
                      ? handleCompleteGroupOrderEdit
                      : handleGroupOrderEditToggle
                  }
                  className={`text-body2-semibold cursor-pointer ${
                    isSavingGroupOrder ? "opacity-60" : ""
                  }`}
                  style={{
                    color: isGroupOrderEditMode
                      ? BRAND_COLORS.red
                      : BRAND_COLORS.gray,
                  }}
                >
                  {isGroupOrderEditMode ? "편집 완료" : "순서 편집"}
                </button>
              )}
            </div>

            <div className="space-y-0 mb-3 max-h-[220px] overflow-y-auto">
              <DndContext
                sensors={groupOrderSensors}
                collisionDetection={closestCenter}
                onDragEnd={handleGroupOrderDragEnd}
                modifiers={[restrictToVerticalAxis, restrictToParentElement]}
              >
                <SortableContext
                  items={(isGroupOrderEditMode ? editableGroups : groups).map(
                    (group) => group.teamId,
                  )}
                  strategy={verticalListSortingStrategy}
                >
                  {(isGroupOrderEditMode ? editableGroups : groups).map((group) => (
                    <SortableGroupModalItem
                      key={group.teamId}
                      group={group}
                      isSelected={String(group.teamId) === String(teamId)}
                      isEditMode={isGroupOrderEditMode}
                      getLabelColor={getLabelColor}
                      onSelect={handleSelectGroup}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </div>

            <button
              onClick={async () => {
                const canNavigate = await handleCreateGroup();
                if (canNavigate) {
                  setShowGroupModal(false);
                }
              }}
              className="w-full h-12 px-5 py-3 rounded-[100px] bg-gray-50 border border-gray-100 cursor-pointer mb-2 flex items-center justify-center gap-2"
            >
              <Image
                src="/images/transaction/v2/증가_가능.svg"
                alt="그룹 추가"
                width={24}
                height={24}
              />
              <span className="text-body1-semibold text-gray-900">
                그룹 새로 만들기
              </span>
            </button>

            <div className="-mx-5 py-4">
              <div className="border-t border-gray-100" />
            </div>

            <div className="mt-2 space-y-0">
              <button
                onClick={handleGroupInfoEdit}
                className="w-full h-[46px] py-3 text-left text-body1-semibold text-gray-900 cursor-pointer"
              >
                {groupInfoActionLabel}
              </button>
              <button
                onClick={handleGroupInvite}
                className="w-full h-[46px] py-3 text-left text-body1-semibold text-gray-900 cursor-pointer mb-8"
              >
                그룹 초대하기
              </button>
            </div>
          </div>
        </>
      )}

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

interface SortableGroupModalItemProps {
  group: Group;
  isSelected: boolean;
  isEditMode: boolean;
  onSelect: (teamId: string) => void;
  getLabelColor: (label?: string) => string;
}

function SortableGroupModalItem({
  group,
  isSelected,
  isEditMode,
  onSelect,
  getLabelColor,
}: SortableGroupModalItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: group.teamId,
      disabled: !isEditMode,
    });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`w-full h-[46px] px-2 py-3 flex items-center ${
        isEditMode ? "cursor-default" : "cursor-pointer"
      } ${isDragging ? "opacity-80" : ""}`}
    >
      <button
        type="button"
        onClick={() => onSelect(group.teamId)}
        disabled={isEditMode}
        className="min-w-0 flex-1 flex items-center gap-4 text-left disabled:cursor-default"
      >
        <span
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: getLabelColor(group.label) }}
        />
        <span className="text-body1-semibold text-gray-900 truncate">
          {group.title}
        </span>
      </button>

      {isEditMode ? (
        <button
          type="button"
          aria-label={`${group.title} 순서 이동`}
          className="ml-4 flex-shrink-0 p-0.5 cursor-grab active:cursor-grabbing touch-none"
          {...attributes}
          {...listeners}
        >
          <Image
            src="/images/transaction/v2/햄버거_메뉴.svg"
            alt=""
            aria-hidden
            width={20}
            height={20}
          />
        </button>
      ) : (
        isSelected && (
          <Image
            src="/images/transaction/v2/체크_블랙.svg"
            alt="선택됨"
            width={24}
            height={24}
            className="ml-4 flex-shrink-0"
          />
        )
      )}
    </div>
  );
}

