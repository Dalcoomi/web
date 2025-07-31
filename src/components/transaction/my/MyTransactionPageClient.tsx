// components/transaction/my/MyTransactionPageClient.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import TopBar from "@/components/ui/TopBar";
import BottomBar from "@/components/ui/BottomBar";
import MyTransactionItem from "@/components/transaction/MyTransactionItem";
import {
  getTransactions,
  MonthlyTransactionsResponse,
  TransactionSearchCriteria,
} from "@/services/transactionService";

export default function MyTransactionPageClient() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
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

  // 현재 적용된 필터 (API 호출용)
  const [currentCategoryFilter, setCurrentCategoryFilter] = useState<
    string | null
  >(null);

  // 중복 호출 방지를 위한 ref
  const lastRequestRef = useRef<string>("");
  const isRequestInProgressRef = useRef<boolean>(false);

  const [showAddPageModal, setShowAddPageModal] = useState<boolean>(false);

  // 필터 드롭다운 외부 클릭 감지를 위한 ref
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  // 날짜 변경 핸들러
  const handleDateChange = (date: Date) => {
    setSelectedDate(date);

    // 필터 초기화
    setSelectedCategories([]);
    setCurrentCategoryFilter(null);

    // 새 월 데이터 로드
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    loadTransactions(year, month, null);
  };

  // 트랜잭션 데이터 로드
  const loadTransactions = useCallback(
    async (year: number, month: number, categoryFilter?: string | null) => {
      // const requestKey = `${year}-${month}-${categoryFilter || ""}`;

      // // 같은 요청이 진행 중이면 무시
      // if (
      //   isRequestInProgressRef.current &&
      //   lastRequestRef.current === requestKey
      // ) {
      //   return;
      // }

      // // 새로운 요청이면 이전 요청 상태 초기화
      // if (lastRequestRef.current !== requestKey) {
      //   isRequestInProgressRef.current = false;
      // }

      // // 요청 시작
      // isRequestInProgressRef.current = true;
      // lastRequestRef.current = requestKey;
      setIsLoading(true);

      try {
        const criteria: TransactionSearchCriteria = {
          teamId: null, // 개인 거래
          year,
          month,
          categoryName: categoryFilter,
        };

        const response = await getTransactions(criteria);
        setResponse(response);

        // 전체 데이터에서 카테고리 목록 추출 (필터링 안된 데이터가 필요하면 별도 API 호출)
        if (!categoryFilter) {
          const uniqueCategories = Array.from(
            new Set(response.transactions.map((t) => t.categoryName))
          );

          setAllCategories(uniqueCategories);

          // // 처음 로드시 선택된 상태를 빈 배열로 설정
          // if (selectedCategories.length === 0) {
          //   setSelectedCategories([]);
          // }
        }
      } catch (error) {
        // 401 에러면 루트(로그인)로 리다이렉트
        if (error instanceof Error && error.message.includes("401")) {
          router.replace("/");
          return;
        }

        // 기타 오류 처리
        setResponse({
          income: 0,
          expense: 0,
          total: 0,
          transactions: [],
        });
      } finally {
        setIsLoading(false);
        // isRequestInProgressRef.current = false;
      }
    },
    [router]
  );

  // 초기 데이터 로드 및 날짜 변경 시
  useEffect(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth() + 1;

    // 약간의 디바운스 추가
    const timeoutId = setTimeout(() => {
      loadTransactions(year, month);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [loadTransactions, selectedDate]);

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      // 카테고리 필터 드롭다운과 버튼 클릭이 아닌 경우에만 닫기
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(target) &&
        !(target.closest && target.closest("button[data-category-filter]"))
      ) {
        setShowCategoryFilter(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // 카테고리 필터 토글
  const handleCategoryFilterToggle = () => {
    setShowCategoryFilter((prev) => !prev);
  };

  // 카테고리 선택 (단일 선택)
  const handleCategorySelect = (categoryName: string) => {
    let newSelection: string | any[] | ((prevState: string[]) => string[]);
    if (selectedCategories.includes(categoryName)) {
      newSelection = []; // 이미 선택된 경우 선택 해제
    } else {
      newSelection = [categoryName]; // 새로운 카테고리만 선택
    }

    setSelectedCategories(newSelection);

    // 바로 필터링 적용
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth() + 1;
    const categoryFilter = newSelection.length > 0 ? newSelection[0] : null;

    setCurrentCategoryFilter(categoryFilter);
    loadTransactions(year, month, categoryFilter);

    // 드롭다운 닫기
    setShowCategoryFilter(false);
  };

  // 카테고리 전체 해제
  const handleClearCategories = () => {
    setSelectedCategories([]);
    setCurrentCategoryFilter(null);

    // 바로 필터링 적용
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth() + 1;
    loadTransactions(year, month, null);

    // 드롭다운 닫기
    setShowCategoryFilter(false);
  };

  // 필터 초기화
  const handleResetFilters = () => {
    setSelectedCategories([]);
    setCurrentCategoryFilter(null);

    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth() + 1;
    loadTransactions(year, month);
  };

  // 날짜를 "MM.DD" 형식으로 변환
  const formatDateToMMDD = (dateString: string): string => {
    const date = new Date(dateString);
    return `${(date.getMonth() + 1).toString().padStart(2, "0")}.${date
      .getDate()
      .toString()
      .padStart(2, "0")}`;
  };

  // 새 거래 추가 버튼 클릭 핸들러
  const handleAddTransactionClick = () => {
    setShowAddPageModal(true);
  };

  const handleWritingTransaction = () => {
    router.push("/transaction/my/add/writing");
  };

  const handleReceiptTransaction = () => {
    alert("서비스 준비 중입니다.");
    // router.push("/transaction/my/add/receipt");
  };

  // 모달 닫기
  const handleCloseModal = () => {
    setShowAddPageModal(false);
  };

  const formatDateForDisplay = (date: Date): string => {
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
  };

  const handlePrevMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() - 1);
    handleDateChange(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + 1);
    handleDateChange(newDate);
  };

  const isCurrentMonth = () => {
    const now = new Date();
    return (
      selectedDate.getFullYear() === now.getFullYear() &&
      selectedDate.getMonth() === now.getMonth()
    );
  };

  const formatNumber = (num: number): string => {
    return num.toLocaleString("ko-KR");
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      <TopBar />

      {/* 거래 내역 작성 제목 블록 */}
      {/* <div className="text-[#11ABFF] px-4 py-2 items-center">
        <h1 className="text-xl font-light text-center">
          {memberInfo?.nickname}의 가계부
        </h1> */}

      {/* 파란색 박스 영역 */}
      <div className="px-2 py-2">
        <div className="bg-[#EEF9FF] rounded-[10px] px-2 py-1.5">
          {/* 날짜 선택기 */}
          <div className="flex items-center mb-2">
            <button
              onClick={handlePrevMonth}
              className="p-0 mr-4 cursor-pointer"
            >
              <Image
                src="/images/transaction/화살표_왼쪽.svg"
                alt="이전 달"
                width={11}
                height={11}
              />
            </button>

            <div className="text-m font-light text-[#534E4E]">
              {formatDateForDisplay(selectedDate)}
            </div>

            <button
              onClick={handleNextMonth}
              className="p-0 ml-4 cursor-pointer"
              disabled={isCurrentMonth()}
            >
              <Image
                src="/images/transaction/화살표_오른쪽.svg"
                alt="다음 달"
                width={11}
                height={11}
                style={{ opacity: isCurrentMonth() ? 0.3 : 1 }}
              />
            </button>

            {/* 새 거래 추가 버튼 */}
            <button
              onClick={handleAddTransactionClick}
              className="ml-auto border-none cursor-pointer"
            >
              <Image
                src="/images/transaction/거래_내역_작성.svg"
                alt="새 거래 추가"
                width={30}
                height={30}
                priority
              />
            </button>
          </div>

          {/* 거래 내역 추가 페이지 모달 */}
          {showAddPageModal && (
            <>
              {/* 배경 오버레이 */}
              <div
                className="absolute top-0 left-0 right-0 bottom-0 bg-[#d9d9d9] opacity-50 flex h-screen items-center justify-center z-50"
                onClick={handleCloseModal}
              ></div>

              {/* 모달 컨텐츠 */}
              <div
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white border-2 border-[#C7C3C3] rounded-[10px] p-2 w-[80%] z-50"
                onClick={(e) => e.stopPropagation()}
              >
                {/* 버튼들 */}
                <div className="flex">
                  <button
                    onClick={handleWritingTransaction}
                    className="flex-1 mx-10 mb-4 mt-2 py-4 text-[#0EABFF] font-light border-3 rounded-[10px] hover:bg-blue-100 cursor-pointer transition-colors"
                  >
                    직접 작성하기
                  </button>
                </div>
                <div className="flex">
                  <button
                    onClick={handleReceiptTransaction}
                    className="flex-1 mx-10 mb-2 py-4 text-[#0EABFF] font-light border-3 rounded-[10px] hover:bg-blue-100 cursor-pointer transition-colors"
                  >
                    영수증으로 작성하기 (AI)
                  </button>
                </div>
              </div>
            </>
          )}

          {/* 수입/지출 태그 */}
          <div className="grid grid-cols-2 mb-2">
            <div className="flex items-center">
              <div className="px-1 border border-[#0E7AFF] rounded-[3px] leading-[1]">
                <span className="text-xs font-light text-[#0E7AFF]">수입</span>
              </div>
              <span className="ml-1 text-sm font-light text-[#0E7AFF]">
                {response.income === 0
                  ? "0"
                  : `+${formatNumber(response.income)}`}
              </span>
            </div>

            <div className="flex items-center justify-left">
              <div className="px-1 border border-[#FF005E] rounded-[3px] leading-[1]">
                <span className="text-xs font-light text-[#FF005E]">지출</span>
              </div>
              <span className="ml-1 text-sm font-light text-[#FF005E]">
                {response.expense === 0
                  ? "0"
                  : `-${formatNumber(response.expense)}`}
              </span>
            </div>
          </div>

          {/* 총액 태그 */}
          <div className="flex items-center">
            <div className="px-1 border border-[#534E4E] rounded-[3px] leading-[1]">
              <span className="text-xs font-light text-[#534E4E]">총액</span>
            </div>
            <span className="ml-1 text-sm font-light text-[#534E4E]">
              {response.total === 0 ? "0" : formatNumber(response.total)}
            </span>
          </div>

          {/* 현재 적용된 필터 표시 */}
          {currentCategoryFilter && (
            <div className="mt-2 p-2 bg-white rounded-[5px] border border-[#E0E0E0]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#666]">필터</span>
                  <span className="px-2 py-1 bg-[#FFF3E0] text-[#F57C00] text-xs rounded border">
                    📂 {currentCategoryFilter}
                  </span>
                </div>
                <button
                  onClick={handleResetFilters}
                  className="text-xs text-[#999] hover:text-[#666] cursor-pointer"
                >
                  초기화
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 카테고리/내용/금액 헤더 */}
      <div className="mx-2 border-t-2 border-[#959595] rounded-t-[20px] overflow-visible relative">
        <div className="flex py-2 px-7">
          <div className="flex-1 text-center text-sm font-light text-[#959595] translate-x-5 relative">
            <button
              onClick={handleCategoryFilterToggle}
              className="flex items-center justify-center cursor-pointer bg-transparent border-none p-0"
              data-category-filter
            >
              <span>카테고리</span>
              <svg
                width="8"
                height="5"
                viewBox="0 0 8 5"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={`ml-1 transform transition-transform ${
                  showCategoryFilter ? "rotate-180" : ""
                }`}
              >
                <path
                  d="M1 1L4 4L7 1"
                  stroke="#959595"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {/* 카테고리 필터 드롭다운 */}
            {showCategoryFilter && (
              <div
                ref={categoryDropdownRef}
                className="absolute top-full left-0 mt-1 bg-white border border-[#C7C3C3] rounded-[10px] shadow-lg z-40 min-w-[140px]"
              >
                {/* 전체 해제 */}
                <div className="p-2 border-b border-[#E5E5E5]">
                  <button
                    onClick={handleClearCategories}
                    className="w-full text-left text-xs font-medium text-[#534E4E] cursor-pointer hover:text-[#FF005E]"
                  >
                    전체 해제
                  </button>
                </div>

                {/* 카테고리 목록 */}
                <div className="max-h-[90px] overflow-y-auto">
                  {allCategories.map((category, index) => (
                    <div
                      key={index}
                      className="p-2 hover:bg-[#F5F5F5] hover:rounded-[10px]"
                    >
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="categoryFilter"
                          checked={selectedCategories.includes(category)}
                          onChange={() => handleCategorySelect(category)}
                          className="mr-2 w-3 h-3"
                        />
                        <span className="text-xs font-light text-[#534E4E]">
                          {category}
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex-1 text-left text-sm font-light text-[#959595] -translate-x-0.5">
            내용
          </div>
          <div className="flex-1 text-right text-sm font-light text-[#959595]">
            금액
          </div>
        </div>
      </div>

      {/* 거래 내역 목록 */}
      <div className="flex-1 overflow-y-auto bg-white">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="text-gray-500">로딩 중...</div>
          </div>
        ) : response.transactions.length > 0 ? (
          response.transactions.map((transaction, index) => {
            // 현재 거래의 날짜
            const currentDate = formatDateToMMDD(transaction.transactionDate);

            // 이전 거래와 날짜가 같은지 확인
            const prevDate =
              index > 0
                ? formatDateToMMDD(
                    response.transactions[index - 1].transactionDate
                  )
                : null;

            // 이전 거래와 날짜가 같으면 날짜를 숨김
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
              />
            );
          })
        ) : (
          <div className="flex items-center justify-center h-40">
            <div className="text-gray-500">
              {currentCategoryFilter
                ? "필터 조건에 맞는 거래 내역이 없습니다."
                : "거래 내역이 없습니다."}
            </div>
          </div>
        )}
      </div>

      <BottomBar />
    </div>
  );
}
