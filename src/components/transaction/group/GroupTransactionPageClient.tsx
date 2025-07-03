// components/transaction/group/GroupTransactionPageClient.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  getTransactions,
  MonthlyTransactionsResponse,
} from "@/services/transactionService";
import Image from "next/image";
import TopBar from "@/components/ui/TopBar";
import BottomBar from "@/components/ui/BottomBar";
import GroupTransactionItem from "@/components/transaction/GroupTransactionItem";
import EmptyTransactionList from "@/components/transaction/EmptyTransactionList";
import { getGroupInfo, GroupInfo } from "@/services/groupService";

export default function MyTransactionPageClient() {
  const router = useRouter();
  const params = useParams();
  const teamId = params.teamId as string;

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
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

  const [showAddPageModal, setShowAddPageModal] = useState<boolean>(false);

  // 날짜 변경 핸들러
  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  // 트랜잭션 데이터 로드
  const loadTransactions = useCallback(
    async (teamId: string, year: number, month: number) => {
      const requestKey = `${year}-${month}`;

      // 같은 요청이 진행 중이면 무시
      if (
        isRequestInProgressRef.current &&
        lastRequestRef.current === requestKey
      ) {
        return;
      }

      // 요청 시작
      isRequestInProgressRef.current = true;
      lastRequestRef.current = requestKey;
      setIsLoading(true);

      try {
        const response = await getTransactions(parseInt(teamId), year, month);

        setResponse(response);
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
    },
    [router]
  );

  // useEffect를 변경
  useEffect(() => {
    if (!teamId) {
      router.replace("/group"); // teamId가 없으면 그룹 목록으로 리다이렉트
      return;
    }

    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth() + 1;

    // 약간의 디바운스 추가
    const timeoutId = setTimeout(() => {
      loadTransactions(teamId, year, month);
    }, 100);

    const timeoutId2 = setTimeout(async () => {
      if (!teamId) {
        router.replace("/group");
        return;
      }

      try {
        setIsLoading(true);

        const response = await getGroupInfo(teamId);

        setGroupInfo(response);
      } catch (error) {
        alert(error || "그룹 정보를 불러올 수 없습니다.");

        router.replace("/group");
      } finally {
        setIsLoading(false);
      }
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(timeoutId2);
    };
  }, [selectedDate, teamId, loadTransactions, router]);

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
    alert("서비스 준비 중입니다.");
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
                    className="flex-1 mx-10 mb-4 mt-2 py-4 text-[#0EABFF] font-light border-3 rounded-[10px]  hover:bg-blue-100 cursor-pointer transition-colors"
                  >
                    직접 작성하기
                  </button>
                </div>
                <div className="flex">
                  <button
                    onClick={handleReceiptTransaction}
                    className="flex-1 mx-10 mb-2 py-4 text-[#0EABFF] font-light border-3 rounded-[10px]  hover:bg-blue-100 cursor-pointer transition-colors"
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
        </div>
      </div>

      {/* 카테고리/내용/금액 헤더 */}
      <div className="mx-2  border-t-2 border-[#959595] rounded-t-[20px] overflow-hidden">
        <div className="flex py-2 px-7 bg-white">
          <div className="flex-1 text-center text-sm font-light text-[#959595] translate-x-2">
            카테고리
          </div>
          <div className="flex-1 text-left text-sm font-light text-[#959595] translate-x-2">
            내용
          </div>
          <div className="flex-1 text-left text-sm font-light text-[#959595] translate-x-1">
            작성자
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
              <GroupTransactionItem
                key={index}
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
          <EmptyTransactionList />
        )}
      </div>

      <BottomBar />
    </div>
  );
}
