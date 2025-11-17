// components/transaction/group/GroupTransactionPageClient.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { createPortal } from "react-dom";
import {
  getTransactions,
  MonthlyTransactionsResponse,
  TransactionSearchCriteria,
} from "@/services/transactionService";
import Image from "next/image";
import TopBar from "@/components/ui/TopBar";
import BottomBar from "@/components/ui/BottomBar";
import GroupTransactionItem from "@/components/transaction/GroupTransactionItem";
import { getGroupInfo, GroupInfo } from "@/services/groupService";

export default function MyTransactionPageClient() {
  const router = useRouter();
  const params = useParams();
  const teamId = params.teamId as string;

  // 스크롤 위치 복원을 위한 저장된 날짜 가져오기
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
  const [showMemberFilter, setShowMemberFilter] = useState<boolean>(false);
  const [showCategoryFilter, setShowCategoryFilter] = useState<boolean>(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [allMembers, setAllMembers] = useState<string[]>([]);
  const [allCategories, setAllCategories] = useState<string[]>([]);

  // 현재 적용된 필터 (API 호출용)
  const [currentMemberFilter, setCurrentMemberFilter] = useState<string | null>(
    null
  );
  const [currentCategoryFilter, setCurrentCategoryFilter] = useState<
    string | null
  >(null);

  // 중복 호출 방지를 위한 ref
  const lastRequestRef = useRef<string>("");
  const isRequestInProgressRef = useRef<boolean>(false);

  const [showAddPageModal, setShowAddPageModal] = useState<boolean>(false);

  // 필터 드롭다운 외부 클릭 감지를 위한 ref
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const memberButtonRef = useRef<HTMLButtonElement>(null);
  const categoryButtonRef = useRef<HTMLButtonElement>(null);

  // 드롭다운 위치
  const [memberDropdownPos, setMemberDropdownPos] = useState({
    top: 0,
    left: 0,
  });
  const [categoryDropdownPos, setCategoryDropdownPos] = useState({
    top: 0,
    left: 0,
  });

  // 스크롤 위치 저장/복원을 위한 ref
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const shouldRestoreScroll = useRef(false);
  const [isRestoringScroll, setIsRestoringScroll] = useState(false);

  // 페이지 진입 시 스크롤 위치 복원 플래그 설정
  useEffect(() => {
    const savedScroll = sessionStorage.getItem(`group-transaction-scroll-${teamId}`);
    if (savedScroll) {
      shouldRestoreScroll.current = true;
      setIsRestoringScroll(true);
    }
  }, [teamId]);

  // 데이터 로딩 완료 후 스크롤 복원
  useEffect(() => {
    if (!isLoading && shouldRestoreScroll.current && scrollContainerRef.current && response.transactions.length > 0) {
      const savedScroll = sessionStorage.getItem(`group-transaction-scroll-${teamId}`);
      if (savedScroll) {
        const scrollPos = parseInt(savedScroll, 10);
        // DOM 렌더링 완료 후 스크롤 복원
        setTimeout(() => {
          requestAnimationFrame(() => {
            if (scrollContainerRef.current) {
              scrollContainerRef.current.scrollTop = scrollPos;
              shouldRestoreScroll.current = false;
              // 약간의 딜레이 후 투명도 제거
              setTimeout(() => {
                setIsRestoringScroll(false);
              }, 50);
            }
          });
        }, 100);
      }
    } else if (!isLoading && shouldRestoreScroll.current) {
      // 거래 내역이 없는 경우 투명도만 제거
      shouldRestoreScroll.current = false;
      setIsRestoringScroll(false);
    }
  }, [isLoading, response.transactions, teamId]);

  // 날짜 변경 시 저장
  useEffect(() => {
    sessionStorage.setItem(`group-transaction-date-${teamId}`, selectedDate.toISOString());
  }, [selectedDate, teamId]);

  // 날짜 변경 핸들러 (필터 유지)
  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    // 필터는 유지하고, 드롭다운만 닫기
    setShowMemberFilter(false);
    setShowCategoryFilter(false);
  };

  // 통합된 useEffect로 중복 호출 방지
  useEffect(() => {
    if (!teamId) {
      router.replace("/group");
      return;
    }

    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth() + 1;
    const requestKey = `${year}-${month}-${currentMemberFilter || ""}-${
      currentCategoryFilter || ""
    }`;

    // 🔥 이미 같은 요청이 진행 중이거나 완료된 경우 즉시 리턴
    if (
      isRequestInProgressRef.current &&
      lastRequestRef.current === requestKey
    ) {
      return;
    }

    const timeoutId = setTimeout(() => {
      // 🔥 타임아웃 후에도 한 번 더 체크
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
            teamId: parseInt(teamId),
            year,
            month,
            creatorNickname: currentMemberFilter,
            categoryName: currentCategoryFilter,
          };

          const response = await getTransactions(criteria);
          setResponse(response);

          // 멤버와 카테고리 목록 갱신: 필터 없이 조회할 때만 전체 목록 추출
          if (!currentMemberFilter && !currentCategoryFilter) {
            const uniqueMembers = Array.from(
              new Set(response.transactions.map((t) => t.creatorNickname))
            );
            const uniqueCategories = Array.from(
              new Set(response.transactions.map((t) => t.categoryName))
            );
            setAllMembers(uniqueMembers);
            setAllCategories(uniqueCategories);
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
          isRequestInProgressRef.current = false;
        }
      };

      fetchData();
    }, 300);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [
    selectedDate,
    teamId,
    router,
    currentMemberFilter,
    currentCategoryFilter,
  ]); // groupInfo 의존성 제거로 중복 호출 방지

  // 그룹 정보 로딩을 별도의 useEffect로 분리
  useEffect(() => {
    if (!teamId || groupInfo) {
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        const response = await getGroupInfo(teamId);
        setGroupInfo(response);
      } catch (error) {
        alert(error || "그룹 정보를 불러올 수 없습니다.");
        router.replace("/group");
      }
    }, 100);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [teamId, router, groupInfo]); // groupInfo 포함하되, early return으로 중복 방지

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      // 멤버 필터 드롭다운과 버튼 클릭이 아닌 경우에만 닫기
      if (
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(target) &&
        !(target.closest && target.closest("button[data-member-filter]"))
      ) {
        setShowMemberFilter(false);
      }

      // 카테고리 필터 드롭다운과 버튼 클릭이 아닌 경우에만 닫기
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(target) &&
        !(target.closest && target.closest("button[data-category-filter]"))
      ) {
        setShowCategoryFilter(false);
      }

      // 거래 유형 필터 관련 코드 제거됨
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // 멤버 필터 토글
  const handleMemberFilterToggle = () => {
    setShowCategoryFilter(false);
    if (!showMemberFilter && memberButtonRef.current) {
      const rect = memberButtonRef.current.getBoundingClientRect();
      setMemberDropdownPos({
        top: rect.bottom + 4,
        left: rect.left + rect.width / 2 - 70,
      });
    }
    setShowMemberFilter((prev) => !prev);
  };

  // 카테고리 필터 토글
  const handleCategoryFilterToggle = () => {
    setShowMemberFilter(false);
    if (!showCategoryFilter && categoryButtonRef.current) {
      const rect = categoryButtonRef.current.getBoundingClientRect();
      setCategoryDropdownPos({
        top: rect.bottom + 4,
        left: rect.left + rect.width / 2 - 70,
      });
    }
    setShowCategoryFilter((prev) => !prev);
  };

  // 멤버 선택 (단일 선택으로 변경)
  const handleMemberSelect = (memberName: string) => {
    let newSelection;
    if (selectedMembers.includes(memberName)) {
      newSelection = []; // 이미 선택된 경우 선택 해제
    } else {
      newSelection = [memberName]; // 새로운 멤버만 선택
    }

    setSelectedMembers(newSelection);

    // 필터 상태만 업데이트 (useEffect가 자동으로 API 호출)
    const memberFilter = newSelection.length > 0 ? newSelection[0] : null;
    setCurrentMemberFilter(memberFilter);

    // 드롭다운 닫기
    setShowMemberFilter(false);
  };

  // 카테고리 선택 (단일 선택으로 변경)
  const handleCategorySelect = (categoryName: string) => {
    let newSelection;
    if (selectedCategories.includes(categoryName)) {
      newSelection = []; // 이미 선택된 경우 선택 해제
    } else {
      newSelection = [categoryName]; // 새로운 카테고리만 선택
    }

    setSelectedCategories(newSelection);

    // 필터 상태만 업데이트 (useEffect가 자동으로 API 호출)
    const categoryFilter = newSelection.length > 0 ? newSelection[0] : null;
    setCurrentCategoryFilter(categoryFilter);

    // 드롭다운 닫기
    setShowCategoryFilter(false);
  };

  // 멤버 전체 해제
  const handleClearMembers = () => {
    setSelectedMembers([]);
    setCurrentMemberFilter(null);

    // 드롭다운 닫기
    setShowMemberFilter(false);
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
    setSelectedMembers([]);
    setSelectedCategories([]);
    setCurrentMemberFilter(null);
    setCurrentCategoryFilter(null);
  };

  // 필터링된 거래 내역 가져오기
  const getFilteredTransactions = () => {
    return response.transactions.filter((transaction) => {
      // 멤버 필터
      if (
        currentMemberFilter &&
        transaction.creatorNickname !== currentMemberFilter
      ) {
        return false;
      }

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
    router.push(`/transaction/group/${teamId}/add/writing`);
  };

  const handleReceiptTransaction = () => {
    alert("서비스 점검 중입니다.");
    // router.push(`/transaction/group/${teamId}/add/receipt`);
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

  // 스크롤 이벤트 핸들러
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      sessionStorage.setItem(
        `group-transaction-scroll-${teamId}`,
        scrollContainerRef.current.scrollTop.toString()
      );
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      <TopBar />

      {/* 거래 내역 작성 제목 블록 */}
      <div className="text-[#11ABFF] px-4 py-2 items-center">
        <h1 className="text-md text-center font-light border-2 rounded-[10px]">
          {groupInfo?.title}
        </h1>
      </div>

      {/* 파란색 박스 영역 */}
      <div className="px-2 py-2 pt-0">
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
                e.stopPropagation();
                const input = e.currentTarget.querySelector(
                  'input[type="month"]'
                ) as HTMLInputElement;
                if (input) {
                  if (typeof input.showPicker === "function") {
                    input.showPicker();
                  } else {
                    input.click();
                  }
                }
              }}
            >
              <span
                className={`text-m text-[#534E4E] px-2 py-0.5 rounded ${
                  selectedDate.getFullYear() === new Date().getFullYear() &&
                  selectedDate.getMonth() === new Date().getMonth()
                    ? "bg-[#B3E5FC]"
                    : "font-light"
                }`}
              >
                {formatDateForDisplay(selectedDate)}
              </span>
              <input
                type="month"
                value={`${selectedDate.getFullYear()}-${String(
                  selectedDate.getMonth() + 1
                ).padStart(2, "0")}`}
                onChange={handleMonthInputChange}
                className="absolute opacity-0"
                style={{
                  width: "100%",
                  height: "100%",
                  left: 0,
                  top: 0,
                  pointerEvents: "none",
                }}
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
          {(currentMemberFilter || currentCategoryFilter) && (
            <div className="mt-2 p-2 bg-white rounded-[5px] border border-[#E0E0E0]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#666]">필터</span>
                  {currentMemberFilter && (
                    <span className="px-2 py-1 bg-[#E3F2FD] text-[#1976D2] text-xs rounded border">
                      👤 {currentMemberFilter}
                    </span>
                  )}
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

      {/* 카테고리/내용/작성자/금액 헤더 */}
      <div className="mx-2 border-t-2 border-[#959595] rounded-t-[20px] overflow-visible relative">
        <div className="flex py-2 px-6">
          <div className="flex-1 text-center text-sm font-light text-[#959595] translate-x-4 relative">
            <button
              ref={categoryButtonRef}
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
          </div>
          <div className="flex-1 text-left text-sm font-light text-[#959595] translate-x-3 relative">
            내용
          </div>
          <div className="flex-1 text-center text-sm font-light text-[#959595] translate-x-7 relative">
            <button
              ref={memberButtonRef}
              onClick={handleMemberFilterToggle}
              className="flex items-center cursor-pointer bg-transparent border-none p-0"
              data-member-filter
            >
              <span>작성자</span>
              <svg
                width="8"
                height="5"
                viewBox="0 0 8 5"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={`ml-1 transform transition-transform ${
                  showMemberFilter ? "rotate-180" : ""
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
          </div>
          <div className="flex-1 text-right text-sm font-light text-[#959595]">
            금액
          </div>
        </div>
      </div>

      {/* 거래 내역 목록 */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto bg-white"
        style={{ opacity: isRestoringScroll ? 0 : 1, transition: 'opacity 0.15s' }}
      >
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
                  <GroupTransactionItem
                    key={transaction.transactionId}
                    teamId={teamId}
                    date={shouldShowDate ? currentDate : ""}
                    category={transaction.categoryName}
                    description={transaction.content}
                    creator={transaction.creatorNickname}
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

      {/* 카테고리 필터 드롭다운 (Portal) */}
      {showCategoryFilter &&
        typeof window !== "undefined" &&
        createPortal(
          <div
            ref={categoryDropdownRef}
            className="fixed bg-white border border-[#C7C3C3] rounded-[10px] shadow-lg w-[140px]"
            style={{
              top: `${categoryDropdownPos.top}px`,
              left: `${categoryDropdownPos.left}px`,
              zIndex: 9999,
            }}
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
            <div className="max-h-[200px] overflow-y-auto">
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
          </div>,
          document.body
        )}

      {/* 멤버 필터 드롭다운 (Portal) */}
      {showMemberFilter &&
        typeof window !== "undefined" &&
        createPortal(
          <div
            ref={filterDropdownRef}
            className="fixed bg-white border border-[#C7C3C3] rounded-[10px] shadow-lg w-[140px]"
            style={{
              top: `${memberDropdownPos.top}px`,
              left: `${memberDropdownPos.left}px`,
              zIndex: 9999,
            }}
          >
            {/* 전체 해제 */}
            <div className="p-2 border-b border-[#E5E5E5]">
              <button
                onClick={handleClearMembers}
                className="w-full text-left text-xs font-medium text-[#534E4E] cursor-pointer hover:text-[#FF005E]"
              >
                전체 해제
              </button>
            </div>

            {/* 멤버 목록 */}
            <div className="max-h-[200px] overflow-y-auto">
              {allMembers.map((member, index) => (
                <div
                  key={index}
                  className="p-2 hover:bg-[#F5F5F5] hover:rounded-[10px]"
                >
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="memberFilter"
                      checked={selectedMembers.includes(member)}
                      onChange={() => handleMemberSelect(member)}
                      className="mr-2 w-3 h-3"
                    />
                    <span className="text-xs font-light text-[#534E4E]">
                      {member}
                    </span>
                  </label>
                </div>
              ))}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
