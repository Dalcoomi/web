// components/transaction/my/MyTransactionPageClient.tsx
"use client";

import { useState, useEffect, useRef } from "react";
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
import { useMemberStore } from "@/stores/useMemberStore";

export default function MyTransactionPageClient() {
  const router = useRouter();
  const { fetchMember } = useMemberStore();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState<boolean>(false); // 초기 로딩 제거
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

  const hasFetchedMember = useRef(false);

  useEffect(() => {
    if (!hasFetchedMember.current) {
      fetchMember();
      hasFetchedMember.current = true;
    }
  }, [fetchMember]);

  // 통합된 useEffect로 중복 호출 방지
  useEffect(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth() + 1;

    const timeoutId = setTimeout(() => {
      // loadTransactions 직접 호출하지 않고 내부 로직 실행
      const requestKey = `${year}-${month}-${currentCategoryFilter || ""}`;

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

          // 전체 카테고리 목록을 위해 필터 없이 별도 조회
          if (!currentCategoryFilter) {
            // 필터가 없을 때만 전체 카테고리 목록 갱신
            const uniqueCategories = Array.from(
              new Set(response.transactions.map((t) => t.categoryName))
            );
            setAllCategories(uniqueCategories);
          } else if (allCategories.length === 0) {
            // 카테고리 목록이 비어있을 때만 전체 조회
            const allCriteria: TransactionSearchCriteria = {
              teamId: null,
              year,
              month,
              categoryName: null,
            };
            const allResponse = await getTransactions(allCriteria);
            const uniqueCategories = Array.from(
              new Set(allResponse.transactions.map((t) => t.categoryName))
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
  }, [selectedDate, currentCategoryFilter]); // allCategories.length 의존성 제거로 중복 호출 방지

  // 필터링된 거래 내역 가져오기
  const getFilteredTransactions = () => {
    return response.transactions.filter((transaction) => {
      // 카테고리 필터
      if (
        currentCategoryFilter &&
        transaction.categoryName !== currentCategoryFilter
      ) {
        return false;
      }

      return true;
    });
  };

  // 날짜 변경 핸들러 (필터 유지)
  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    // 필터는 유지하고, 드롭다운만 닫기
    setShowCategoryFilter(false);
  };

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
    let newSelection;
    if (selectedCategories.includes(categoryName)) {
      newSelection = []; // 이미 선택된 경우 선택 해제
    } else {
      newSelection = [categoryName]; // 새로운 카테고리만 선택
    }

    setSelectedCategories(newSelection);

    // 바로 필터링 적용
    const categoryFilter = newSelection.length > 0 ? newSelection[0] : null;
    setCurrentCategoryFilter(categoryFilter);

    // 드롭다운 닫기
    setShowCategoryFilter(false);
  };

  // 카테고리 전체 해제
  const handleClearCategories = () => {
    setSelectedCategories([]);
    setCurrentCategoryFilter(null);

    // 드롭다운 닫기
    setShowCategoryFilter(false);
  };

  // 필터 초기화
  const handleResetFilters = () => {
    setSelectedCategories([]);
    setCurrentCategoryFilter(null);
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

  // 달력 입력 핸들러
  const handleMonthInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value; // "YYYY-MM" 형식
    if (value) {
      const [year, month] = value.split("-").map(Number);
      const newDate = new Date(year, month - 1, 1);
      handleDateChange(newDate);
    }
  };

  const formatNumber = (num: number): string => {
    return num.toLocaleString("ko-KR");
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      <TopBar />

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

            <div
              className="relative cursor-pointer"
              onClick={(e) => {
                const input = e.currentTarget.querySelector('input[type="month"]') as HTMLInputElement;
                if (input) input.showPicker();
              }}
            >
              <span className={`text-m text-[#534E4E] px-2 py-0.5 rounded ${
                selectedDate.getFullYear() === new Date().getFullYear() &&
                selectedDate.getMonth() === new Date().getMonth()
                  ? 'font-bold bg-[#B3E5FC]'
                  : 'font-light'
              }`}>
                {formatDateForDisplay(selectedDate)}
              </span>
              <input
                type="month"
                value={`${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}`}
                onChange={handleMonthInputChange}
                className="absolute opacity-0 pointer-events-none"
                style={{ width: '1px', height: '1px', left: 0, top: '100%' }}
              />
            </div>

            <button
              onClick={handleNextMonth}
              className="p-0 ml-4 cursor-pointer"
            >
              <Image
                src="/images/transaction/화살표_오른쪽.svg"
                alt="다음 달"
                width={11}
                height={11}
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
                  {currentCategoryFilter && (
                    <span className="px-2 py-1 bg-[#FFF3E0] text-[#F57C00] text-xs rounded border">
                      📂 {currentCategoryFilter}
                    </span>
                  )}
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
                className="absolute top-full left-0 mt-1 bg-white border border-[#C7C3C3] rounded-[10px] shadow-lg z-40 w-[140px]"
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
                <div className="max-h-[150px] overflow-y-auto">
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
        ) : (
          (() => {
            const filteredTransactions = getFilteredTransactions();
            return filteredTransactions.length > 0 ? (
              filteredTransactions.map((transaction, index) => {
                // 현재 거래의 날짜
                const currentDate = formatDateToMMDD(
                  transaction.transactionDate
                );

                // 이전 거래와 날짜가 같은지 확인
                const prevDate =
                  index > 0
                    ? formatDateToMMDD(
                        filteredTransactions[index - 1].transactionDate
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
                <div className="text-gray-500">거래 내역이 없습니다.</div>
              </div>
            );
          })()
        )}
      </div>

      <BottomBar />
    </div>
  );
}
