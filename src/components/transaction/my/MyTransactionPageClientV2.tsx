"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import MyTransactionItemV2 from "@/components/transaction/MyTransactionItemV2";
import TransactionHeaderV2 from "@/components/transaction/v2/TransactionHeaderV2";
import TransactionTypeToggleV2, {
  ViewMode,
} from "@/components/transaction/v2/TransactionTypeToggleV2";
import TransactionFloatingButtonV2 from "@/components/transaction/v2/TransactionFloatingButtonV2";
import {
  getTransactions,
  MonthlyTransactionsResponse,
  TransactionSearchCriteria,
} from "@/services/transactionService";
import { useMemberStore } from "@/stores/useMemberStore";

export default function MyTransactionPageClientV2() {
  const router = useRouter();
  const { fetchMember } = useMemberStore();

  // 사이드바 상태
  const [showSidebar, setShowSidebar] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // 개인/그룹 토글 상태
  const [viewMode, setViewMode] = useState<ViewMode>("personal");

  // 플로팅 버튼 토글 상태
  const [isFloatingMenuOpen, setIsFloatingMenuOpen] = useState<boolean>(false);

  // 날짜 관련 상태
  const getSavedDate = (): Date => {
    if (typeof window === "undefined") return new Date();
    const saved = sessionStorage.getItem("my-transaction-date");
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

  // 필터링 관련 상태
  const [showCategoryFilter, setShowCategoryFilter] = useState<boolean>(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
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

  // 페이지 진입 시 스크롤 위치 복원 플래그 설정
  useEffect(() => {
    const savedScroll = sessionStorage.getItem("my-transaction-scroll");
    if (savedScroll) {
      shouldRestoreScroll.current = true;
      setIsRestoringScroll(true);
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
  }, [isLoading, response.transactions]);

  // 스크롤 시 총액 섹션 스타일 변경을 위한 상태 및 관찰자
  const [isSticky, setIsSticky] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // sentinel이 화면 밖으로 나가면(즉, 스크롤이 내려가면) sticky 상태로 간주
        setIsSticky(!entry.isIntersecting);
      },
      { threshold: [0, 1] } // 상단 모서리에 닿자마자 감지
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
    sessionStorage.setItem("my-transaction-date", selectedDate.toISOString());
  }, [selectedDate]);

  // 통합된 useEffect로 중복 호출 방지
  useEffect(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth() + 1;
    const requestKey = `${year}-${month}-${currentCategoryFilter || ""}`;

    if (
      isRequestInProgressRef.current &&
      lastRequestRef.current === requestKey
    ) {
      return;
    }

    const timeoutId = setTimeout(() => {
      if (
        isRequestInProgressRef.current &&
        lastRequestRef.current === requestKey
      ) {
        return;
      }

      isRequestInProgressRef.current = true;
      lastRequestRef.current = requestKey;
      setIsLoading(true);

      const fetchData = async () => {
        try {
          const criteria: TransactionSearchCriteria = {
            teamId: null,
            year,
            month,
            categoryName: currentCategoryFilter,
          };

          const response = await getTransactions(criteria);
          setResponse(response);

          if (!currentCategoryFilter) {
            const uniqueCategories = Array.from(
              new Set(response.transactions.map((t) => t.categoryName))
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
  }, [selectedDate, currentCategoryFilter]);

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
      1
    );
    handleDateChange(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth() + 1,
      1
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
    setIsFloatingMenuOpen(false);
    router.push("/transaction/my/add/receipt");
  };

  // 카테고리 필터 핸들러
  const handleCategoryFilterToggle = () => {
    setShowCategoryFilter((prev) => !prev);
  };

  // 지출이 더 많은 날인지 확인
  const isExpenseDay = response.expense > response.income;
  // 수입이 더 많은 날인지 확인
  const isIncomeDay = response.income > response.expense;

  return (
    <div className="flex flex-col h-screen bg-gray-50 relative font-landing">
      {/* 상단바 (컴포넌트 분리됨) */}
      <TransactionHeaderV2
        title={formatDateForDisplay(selectedDate)}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onMenuClick={handleMenuClick}
      />

      {/* 사이드바 */}
      {showSidebar && (
        <>
          {/* 반투명 오버레이 */}
          <div
            className="absolute inset-0 bg-[#d9d9d9] opacity-50 z-40"
            onClick={() => setShowSidebar(false)}
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
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto flex flex-col relative scrollbar-hide"
        style={{
          opacity: isRestoringScroll ? 0 : 1,
          transition: "opacity 0.15s",
        }}
      >
        {/* 요약 카드 상단 (스크롤됨) */}
        <div className="px-5 pt-1 bg-gray-50">
          <div
            className="rounded-t-[18px] px-5 pt-3 pb-2 flex flex-col items-center relative z-40"
            style={{
              background:
                "radial-gradient(circle at top, #FFEDF0 0%, #EDF3FF 30%, #FFFFFF 60%)",
            }}
          >
            {/* 지출이 더 많은 달 뱃지 */}
            {isExpenseDay && (
              <div className="bg-white px-3 py-1.5 rounded-full mb-4">
                <span className="text-red-600 text-caption1-semibold">
                  지출이 더 많은 달
                </span>
              </div>
            )}

            {/* 수입이 더 많은 달 뱃지 */}
            {isIncomeDay && (
              <div className="bg-[#F0F7FF] px-3 py-1.5 rounded-full mb-4">
                <span className="text-[#0E7AFF] text-caption1-semibold">
                  수입이 더 많은 달
                </span>
              </div>
            )}

            {/* 아이콘 */}
            <div className="mb-[20px]">
              <Image
                src="/images/transaction/v2/요약_카드_캐릭터.svg"
                alt="캐릭터"
                width={100}
                height={100}
              />
            </div>

            {/* 수입/지출 그리드 */}
            <div className="flex w-full mb-2 divide-x divide-gray-100">
              <div className="flex-1 flex flex-col items-start pr-[20px]">
                <div className="text-gray-400 mb-1 text-caption1-medium">
                  수입
                </div>
                <div className="text-blue-600 text-body1-semibold">
                  +{formatNumber(response.income)}원
                </div>
              </div>
              <div className="flex-1 flex flex-col items-start pl-[20px]">
                <div className="text-gray-400 mb-1 text-caption1-medium">
                  지출
                </div>
                <div className="text-red-600 text-body1-semibold">
                  -{formatNumber(response.expense)}원
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky 감지용 Sentinel */}
        <div ref={sentinelRef} className="h-px w-full" />

        {/* 요약 카드 하단 (총액) - Sticky */}
        <div className="sticky top-0 z-30 px-5 pb-3 bg-gray-50 transition-all duration-300">
          <div
            className={`bg-white pt-[20px] px-[16px] pb-[16px] flex flex-col items-center transition-all duration-300 ${
              isSticky
                ? "rounded-[18px] shadow-xs"
                : "rounded-b-[18px] shadow-xs"
            }`}
          >
            {/* 총액 */}
            <div className="w-full bg-gray-50 rounded-xl py-[12px] px-[16px] flex items-center justify-between">
              <div className="bg-gray-900 text-white px-2 pb-0.5 rounded-lg">
                <span className="text-caption2-semibold">총액</span>
              </div>
              <span className="text-gray-900 text-body1-semibold">
                {response.total > 0 ? "+" : ""}
                {formatNumber(response.total)}원
              </span>
            </div>
          </div>
        </div>

        {/* 거래 내역 목록 영역 - White Sheet (배경 White) */}
        <div className="bg-white flex-1">
          {/* 필터 버튼 영역 (Sticky) */}
          <div className="sticky top-[90px] z-20 bg-white pt-4 pb-2 px-5 flex items-center justify-between mb-2">
            {/* 좌측: 최신순 */}
            <button className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-gray-200 bg-white cursor-pointer">
              <span className="text-body2-regular text-gray-900">최신순</span>
              <svg
                width="10"
                height="6"
                viewBox="0 0 10 6"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M1 1L5 5L9 1"
                  stroke="#111827"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {/* 우측: 카테고리, 전체 */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleCategoryFilterToggle}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-gray-200 bg-white cursor-pointer"
              >
                <span className="text-body2-regular text-gray-900">
                  카테고리
                </span>
                <svg
                  width="10"
                  height="6"
                  viewBox="0 0 10 6"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className={`transform transition-transform ${
                    showCategoryFilter ? "rotate-180" : ""
                  }`}
                >
                  <path
                    d="M1 1L5 5L9 1"
                    stroke="#111827"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              <button className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-gray-200 bg-white cursor-pointer">
                <span className="text-body2-regular text-gray-900">전체</span>
                <svg
                  width="10"
                  height="6"
                  viewBox="0 0 10 6"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M1 1L5 5L9 1"
                    stroke="#111827"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* 리스트 */}
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="text-gray-400 text-sm">로딩 중...</div>
            </div>
          ) : (
            <div className="space-y-0">
              {(() => {
                const filteredTransactions = getFilteredTransactions();
                return filteredTransactions.length > 0 ? (
                  <>
                    {filteredTransactions.map((transaction, index) => {
                      const currentDate = formatDateToMMDD(
                        transaction.transactionDate
                      );
                      const prevDate =
                        index > 0
                          ? formatDateToMMDD(
                              filteredTransactions[index - 1].transactionDate
                            )
                          : null;
                      const shouldShowDate = prevDate !== currentDate;

                      return (
                        <MyTransactionItemV2
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
                  <div className="flex items-center justify-center h-40">
                    <div className="text-gray-400 text-sm">
                      거래 내역이 없습니다.
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      {/* 오버레이 (플로팅 메뉴) */}
      {isFloatingMenuOpen && (
        <div
          className="absolute inset-0 bg-black/20 z-40"
          onClick={() => setIsFloatingMenuOpen(false)}
        />
      )}

      {/* 하단 개인/그룹 토글 및 플로팅 버튼 */}
      <div className="absolute bottom-0 left-0 right-0 pb-6 px-4 flex items-end justify-between pointer-events-none">
        {/* 개인/그룹 토글 */}
        <TransactionTypeToggleV2 viewMode={viewMode} onToggle={setViewMode} />

        {/* 플로팅 + 버튼 */}
        <TransactionFloatingButtonV2
          isOpen={isFloatingMenuOpen}
          onToggle={handleFloatingButtonClick}
          onWriteDirect={handleWritingTransaction}
          onWriteReceipt={handleReceiptTransaction}
        />
      </div>
    </div>
  );
}
