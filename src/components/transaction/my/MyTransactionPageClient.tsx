"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import MyTransactionItem from "@/components/transaction/MyTransactionItem";
import TransactionHeader from "@/components/transaction/v2/TransactionHeader";
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
import { useMemberStore } from "@/stores/useMemberStore";
import { useToastStore } from "@/stores/useToastStore";
import TransactionPageSkeleton from "@/components/skeletons/TransactionPageSkeleton";
import { getGroups } from "@/services/groupService";
import { getMyCategories } from "@/services/categoryService";
import Sidebar from "@/components/ui/Sidebar";
import DemoModeTopBanner from "@/components/common/DemoModeTopBanner";
import { isDemoMode } from "@/utils/demoMode";

export default function MyTransactionPageClient() {
  const router = useRouter();
  const { fetchMember } = useMemberStore();
  const addToast = useToastStore((state) => state.addToast);

  // 사이드바 상태
  const [showSidebar, setShowSidebar] = useState(false);

  // 개인/그룹 토글 상태
  const [viewMode, setViewMode] = useState<ViewMode>("personal");

  const handleViewModeToggle = async (mode: ViewMode) => {
    if (mode === "group") {
      try {
        const response = await getGroups();
        if (response.groups && response.groups.length > 0) {
          const firstTeamId = response.groups[0].teamId;
          // 첫 번째 그룹의 거래 내역 페이지로 이동
          router.push(`/transaction/group/${firstTeamId}`);
        } else {
          // 그룹이 없으면 빈 그룹 페이지로 이동
          router.push("/transaction/group");
        }
      } catch (error) {
        console.error("Failed to fetch groups:", error);
        router.push("/transaction/group");
      }
    } else {
      // 이미 개인 페이지인 경우 현재 날짜로 초기화
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
    const saved = sessionStorage.getItem("my-transaction-date");
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

  // 중복 호출 방지를 위한 ref
  const lastRequestRef = useRef<string>("");
  const isRequestInProgressRef = useRef<boolean>(false);

  // 스크롤 위치 저장/복원을 위한 ref
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const shouldRestoreScroll = useRef(false);
  const summarySectionRef = useRef<HTMLDivElement>(null);
  const stickyThresholdRef = useRef(0);

  const hasFetchedMember = useRef(false);
  const sortModalCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const filterModalCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  useEffect(() => {
    if (!hasFetchedMember.current) {
      fetchMember();
      hasFetchedMember.current = true;
    }
  }, [fetchMember]);

  useEffect(() => {
    return () => {
      if (sortModalCloseTimerRef.current) {
        clearTimeout(sortModalCloseTimerRef.current);
      }
      if (filterModalCloseTimerRef.current) {
        clearTimeout(filterModalCloseTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      const [expenseCategories, incomeCategories] = await Promise.all([
        getMyCategories("EXPENSE"),
        getMyCategories("INCOME"),
      ]);

      const expenseNames = expenseCategories.map((category) => category.name);
      const incomeNames = incomeCategories.map((category) => category.name);
      const all = Array.from(new Set([...expenseNames, ...incomeNames]));

      setCategoriesByType({
        ALL: all,
        EXPENSE: expenseNames,
        INCOME: incomeNames,
      });

      const defaultFilter: FilterDraftState = {
        type: "ALL",
        categoryNames: all,
        creatorNicknames: [],
      };

      setAppliedFilter(defaultFilter);
      setDraftFilter(defaultFilter);
    };

    void fetchCategories();
  }, []);

  // 사이드바 메뉴 핸들러
  const handleMenuClick = () => {
    setShowSidebar(true);
  };

  // 페이지 진입 시 스크롤 위치 복원 플래그 설정
  useEffect(() => {
    const savedScroll = sessionStorage.getItem("my-transaction-scroll");
    const scrollPos = savedScroll ? parseInt(savedScroll, 10) : 0;
    if (Number.isFinite(scrollPos) && scrollPos > 0) {
      shouldRestoreScroll.current = true;
    }
  }, []);

  // 데이터 로딩 완료 후 스크롤 복원
  useEffect(() => {
    if (
      !isLoading &&
      shouldRestoreScroll.current &&
      scrollContainerRef.current &&
      response.transactions.length > 0
    ) {
      const savedScroll = sessionStorage.getItem("my-transaction-scroll");
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
  }, [isLoading, response.transactions]);

  // 스크롤 시 총액 섹션 스타일 변경을 위한 상태 및 관찰자
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
    sessionStorage.setItem("my-transaction-date", selectedDate.toISOString());
  }, [selectedDate]);

  // 통합된 useEffect로 중복 호출 방지
  useEffect(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth() + 1;
    const requestKey = `${year}-${month}`;

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
            teamId: null,
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
  }, [selectedDate]);

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
      sessionStorage.setItem("my-transaction-scroll", scrollPos.toString());
    }
  };

  // 플로팅 버튼 핸들러
  const handleFloatingButtonClick = () => {
    setIsFloatingMenuOpen((prev) => !prev);
  };

  const handleWritingTransaction = () => {
    setIsFloatingMenuOpen(false);
    router.push("/transaction/my/add/writing");
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
    setDraftFilter({
      type: "ALL",
      categoryNames: allCategories,
      creatorNicknames: [],
    });
  };

  const handleApplyFilter = () => {
    setAppliedFilter(draftFilter);
    handleCloseFilterModal();
  };

  return (
    <div className="flex flex-col h-screen bg-gray-30 relative font-landing overflow-hidden">
      <DemoModeTopBanner />

      {/* 상단바 (컴포넌트 분리됨) */}
      <TransactionHeader
        title={formatDateForDisplay(selectedDate)}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onMenuClick={handleMenuClick}
      />

      <Sidebar isOpen={showSidebar} onClose={() => setShowSidebar(false)} />

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

            {/* 거래 내역 목록 영역 - White Sheet (배경 White) */}
            <div className="bg-white flex-1">
              {/* 필터 버튼 영역 (Sticky) */}
              <TransactionFilter
                selectedSort={selectedSort}
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
                          <MyTransactionItem
                            key={transaction.transactionId}
                            date={shouldShowDate ? currentDate : ""}
                            category={transaction.categoryName}
                            description={transaction.content}
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
                      {/* 하단 여백 (약 2개 아이템 높이) */}
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

      {/* 오버레이 (플로팅 메뉴) */}
      {!isSortModalMounted && !isFilterModalMounted && isFloatingMenuOpen && (
        <div
          className="absolute inset-0 bg-black/20 z-40"
          onClick={() => setIsFloatingMenuOpen(false)}
        />
      )}

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
        isGroup={false}
        categoriesByType={categoriesByType}
        draft={draftFilter}
        onChangeDraft={setDraftFilter}
        onReset={handleResetFilter}
        onApply={handleApplyFilter}
        onClose={handleCloseFilterModal}
      />

      {!isSortModalMounted && !isFilterModalMounted && (
        <div className="absolute bottom-0 left-0 right-0 pb-6 px-4 flex items-end justify-between pointer-events-none">
          {/* 개인/그룹 토글 */}
          <TransactionTypeToggle
            viewMode={viewMode}
            onToggle={handleViewModeToggle}
          />

          {/* 플로팅 + 버튼 */}
          <TransactionFloatingButton
            isOpen={isFloatingMenuOpen}
            onToggle={handleFloatingButtonClick}
            onWriteDirect={handleWritingTransaction}
            onWriteReceipt={handleReceiptTransaction}
          />
        </div>
      )}
    </div>
  );
}

