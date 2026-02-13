"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import GroupTransactionItem from "@/components/transaction/GroupTransactionItem";
import TransactionHeader from "@/components/transaction/v2/TransactionHeader";
import GroupNameCard from "@/components/transaction/v2/GroupNameCard";
import TransactionSummary from "@/components/transaction/v2/TransactionSummary";
import TransactionTotal from "@/components/transaction/v2/TransactionTotal";
import TransactionFilter from "@/components/transaction/v2/TransactionFilter";
import TransactionTypeToggle, {
  ViewMode,
} from "@/components/transaction/v2/TransactionTypeToggle";
import TransactionFloatingButton from "@/components/transaction/v2/TransactionFloatingButton";
import {
  getTransactions,
  MonthlyTransactionsResponse,
  TransactionSearchCriteria,
} from "@/services/transactionService";
import { getGroupInfo, GroupInfo } from "@/services/groupService";
import { useMemberStore } from "@/stores/useMemberStore";
import { useToastStore } from "@/stores/useToastStore";
import TransactionPageSkeleton from "@/components/skeletons/TransactionPageSkeleton";
import Skeleton from "@/components/skeletons/Skeleton";
import Sidebar from "@/components/ui/Sidebar";

export default function GroupTransactionPageClient() {
  const router = useRouter();
  const params = useParams();
  const teamId = params.teamId as string;
  const { fetchMember } = useMemberStore();
  const addToast = useToastStore((state) => state.addToast);

  // 사이드바 상태
  const [showSidebar, setShowSidebar] = useState(false);

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

  // 날짜 관련 상태
  const getSavedDate = (): Date => {
    if (typeof window === "undefined") return new Date();
    const saved = sessionStorage.getItem(`group-transaction-date-${teamId}`);
    if (saved) {
      const parsed = new Date(saved);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }
    return new Date();
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

  // 필터링 관련 상태
  const [showCategoryFilter, setShowCategoryFilter] = useState<boolean>(false);
const [allCategories, setAllCategories] = useState<string[]>([]);
  const [currentCategoryFilter, setCurrentCategoryFilter] = useState<
    string | null
  >(null);

  // 중복 호출 방지를 위한 ref
  const lastRequestRef = useRef<string>("");
  const isRequestInProgressRef = useRef<boolean>(false);

  // 스크롤 위치 저장/복원을 위한 ref
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const shouldRestoreScroll = useRef(false);
  const [isRestoringScroll, setIsRestoringScroll] = useState(false);

  const hasFetchedMember = useRef(false);

  useEffect(() => {
    if (!hasFetchedMember.current) {
      fetchMember();
      hasFetchedMember.current = true;
    }
  }, [fetchMember]);

  // 그룹 정보 로딩
  useEffect(() => {
    if (!teamId || groupInfo) return;

    const fetchGroupInfo = async () => {
      try {
        const info = await getGroupInfo(teamId);
        setGroupInfo(info);
      } catch (error) {
        console.error("Failed to fetch group info:", error);
        // router.replace("/group"); // 에러 시 그룹 목록으로 이동? 일단 유지
      }
    };
    fetchGroupInfo();
  }, [teamId, groupInfo]);

  // 사이드바 메뉴 핸들러
  const handleMenuClick = () => {
    setShowSidebar(true);
  };

  // 페이지 진입 시 스크롤 위치 복원 플래그 설정
  useEffect(() => {
    const savedScroll = sessionStorage.getItem(
      `group-transaction-scroll-${teamId}`,
    );
    if (savedScroll) {
      shouldRestoreScroll.current = true;
      setIsRestoringScroll(true);
    }
  }, [teamId]);

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
              setTimeout(() => {
                setIsRestoringScroll(false);
              }, 50);
            }
          });
        }, 100);
      }
    } else if (!isLoading && shouldRestoreScroll.current) {
      shouldRestoreScroll.current = false;
      setIsRestoringScroll(false);
    }
  }, [isLoading, response.transactions, teamId]);

  // 스크롤 시 총액 섹션 스타일 변경을 위한 상태 및 관찰자
  const [isSticky, setIsSticky] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsSticky(!entry.isIntersecting);
      },
      { threshold: [0, 1] },
    );

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => {
      if (sentinelRef.current) {
        observer.unobserve(sentinelRef.current);
      }
    };
  }, []);

  // 날짜 변경 시 저장
  useEffect(() => {
    sessionStorage.setItem(
      `group-transaction-date-${teamId}`,
      selectedDate.toISOString(),
    );
  }, [selectedDate, teamId]);

  // 통합된 useEffect로 중복 호출 방지
  useEffect(() => {
    if (!teamId) return;

    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth() + 1;
    const requestKey = `${teamId}-${year}-${month}-${
      currentCategoryFilter || ""
    }`;

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
            categoryName: currentCategoryFilter,
          };

          const response = await getTransactions(criteria);
          setResponse(response);

          if (!currentCategoryFilter) {
            const uniqueCategories = Array.from(
              new Set(response.transactions.map((t) => t.categoryName)),
            );
            setAllCategories(uniqueCategories);
          }
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
  }, [selectedDate, currentCategoryFilter, teamId]);

  // 필터링된 거래 내역 가져오기
  const getFilteredTransactions = () => {
    return response.transactions.filter((transaction) => {
      if (
        currentCategoryFilter &&
        transaction.categoryName !== currentCategoryFilter
      ) {
        return false;
      }
      return true;
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

  const formatNumber = (num: number): string => {
    return num.toLocaleString("ko-KR");
  };

  // 스크롤 이벤트 핸들러
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const scrollPos = scrollContainerRef.current.scrollTop;
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
    // setIsFloatingMenuOpen(false);
    // router.push(`/transaction/group/${teamId}/add/receipt`);
    addToast("info", "서비스 점검 중입니다.");
  };

  // 카테고리 필터 핸들러
  const handleCategoryFilterToggle = () => {
    setShowCategoryFilter((prev) => !prev);
  };

  // 지출이 더 많은 날인지 확인
  const isExpenseDay = response.expense > response.income;
  // 수입이 더 많은 날인지 확인
  const isIncomeDay = response.income > response.expense;

  // 그룹 정보 이동
  const handleGroupInfo = () => {
    router.push(`/group/info/${teamId}`);
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
          />
        )}
      </div>

      {/* 메인 컨텐츠 영역 */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto flex flex-col relative scrollbar-hide z-10 bg-gray-30"
        style={{
          opacity: isRestoringScroll ? 0 : 1,
          transition: "opacity 0.15s",
        }}
      >
        {isLoading ? (
          <TransactionPageSkeleton />
        ) : (
          <>
            {/* 요약 카드 상단 (스크롤됨) */}
            <div className="px-5 pt-1 bg-gray-30">
              <TransactionSummary
                income={response.income}
                expense={response.expense}
                showCharacter={response.transactions.length > 0}
              />
            </div>

            {/* Sticky 감지용 Sentinel */}
            <div
              ref={sentinelRef}
              className="absolute w-full h-px -mt-px pointer-events-none opacity-0"
            />

            {/* 요약 카드 하단 (총액) - Sticky */}
            <div className="sticky top-0 z-30 px-5 pb-3 bg-gray-30 -mt-[1px] transition-all duration-300">
              <TransactionTotal total={response.total} isSticky={isSticky} />
            </div>

            {/* 거래 내역 목록 영역 - White Sheet */}
            <div className="bg-white flex-1">
              {/* 필터 버튼 영역 (Sticky) */}
              <TransactionFilter
                showCategoryFilter={showCategoryFilter}
                onCategoryToggle={handleCategoryFilterToggle}
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
                            creatorProfileImageUrl={transaction.creatorProfileImageUrl}
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
    </div>
  );
}
