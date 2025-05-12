// components/transaction/MyTransactionPageClient.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import TopBar from "@/components/ui/TopBar";
import BottomBar from "@/components/ui/BottomBar";
import DateSelector from "@/components/transaction/DateSelector";
import TransactionSummary from "@/components/transaction/TransactionSummary";
import TransactionItem from "@/components/transaction/TransactionItem";
import EmptyTransactionList from "@/components/transaction/EmptyTransactionList";
import {
  getMyTransactions,
  MonthlyTransactionsResponse,
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
  const [selectedTab, setSelectedTab] = useState<
    "category" | "description" | "amount"
  >("category");

  // 중복 호출 방지를 위한 ref
  const lastRequestRef = useRef<string>("");
  const isRequestInProgressRef = useRef<boolean>(false);

  // 날짜 변경 핸들러
  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  // 트랜잭션 데이터 로드
  const loadTransactions = useCallback(
    async (year: number, month: number) => {
      const requestKey = `${year}-${month}`;

      // 같은 요청이 진행 중이면 무시
      if (
        isRequestInProgressRef.current &&
        lastRequestRef.current === requestKey
      ) {
        console.log("동일한 요청이 진행 중입니다. 무시합니다.");
        return;
      }

      // 요청 시작
      isRequestInProgressRef.current = true;
      lastRequestRef.current = requestKey;
      setIsLoading(true);

      try {
        console.log(`거래 내역 조회 요청: ${year}년 ${month}월`);
        const response = await getMyTransactions(year, month);
        setResponse(response);
      } catch (error) {
        console.error("거래 내역 로드 중 오류 발생:", error);

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
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth() + 1;

    // 약간의 디바운스 추가
    const timeoutId = setTimeout(() => {
      loadTransactions(year, month);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [selectedDate, loadTransactions]);

  // 날짜를 "MM.DD" 형식으로 변환
  const formatDateToMMDD = (dateString: string): string => {
    const date = new Date(dateString);
    return `${(date.getMonth() + 1).toString().padStart(2, "0")}.${date
      .getDate()
      .toString()
      .padStart(2, "0")}`;
  };

  // 새 거래 추가 버튼 클릭 핸들러
  const handleAddTransaction = () => {
    router.push("/transaction/add");
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <TopBar />

      <DateSelector
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
      />

      <TransactionSummary
        income={response.income}
        expense={response.expense}
        total={response.total}
      />

      {/* 탭 메뉴 */}
      <div className="flex border-b border-gray-200 bg-white">
        <button
          className={`flex-1 py-3 text-sm font-medium ${
            selectedTab === "category"
              ? "text-black border-b-2 border-blue-500"
              : "text-gray-500"
          }`}
          onClick={() => setSelectedTab("category")}
        >
          카테고리
        </button>
        <button
          className={`flex-1 py-3 text-sm font-medium ${
            selectedTab === "description"
              ? "text-black border-b-2 border-blue-500"
              : "text-gray-500"
          }`}
          onClick={() => setSelectedTab("description")}
        >
          내용
        </button>
        <button
          className={`flex-1 py-3 text-sm font-medium ${
            selectedTab === "amount"
              ? "text-black border-b-2 border-blue-500"
              : "text-gray-500"
          }`}
          onClick={() => setSelectedTab("amount")}
        >
          금액
        </button>
      </div>

      {/* 거래 내역 목록 */}
      <div className="flex-1 overflow-y-auto bg-white">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="text-gray-500">로딩 중...</div>
          </div>
        ) : response.transactions.length > 0 ? (
          response.transactions.map((transaction, index) => (
            <TransactionItem
              key={index}
              date={formatDateToMMDD(transaction.transactionDate)}
              category={transaction.categoryName}
              description={transaction.content}
              amount={
                transaction.transactionType === "EXPENSE"
                  ? -transaction.amount
                  : transaction.amount
              }
            />
          ))
        ) : (
          <EmptyTransactionList />
        )}
      </div>

      {/* 새 거래 추가 버튼 */}
      <div className="fixed bottom-20 right-5">
        <button
          onClick={handleAddTransaction}
          className="w-14 h-14 rounded-full bg-[#0EABFF] text-white flex items-center justify-center shadow-lg"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="white" />
          </svg>
        </button>
      </div>

      <BottomBar />
    </div>
  );
}
