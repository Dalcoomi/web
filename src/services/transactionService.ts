// services/transactionService.ts
import { get, post, put, del } from "@/utils/apiClient";

// 백엔드 응답에 맞춘 트랜잭션 타입 정의
export interface Transaction {
  creatorNickname: string;
  categoryName: string;
  transactionDate: string;
  content: string;
  amount: number;
  transactionType: "INCOME" | "EXPENSE";
}

// 트랜잭션 요약 타입
export interface TransactionSummary {
  income: number;
  expense: number;
  total: number;
}

// 월별 트랜잭션 응답 타입
export interface MonthlyTransactionsResponse {
  income: number;
  expense: number;
  total: number;
  transactions: Transaction[];
}

// 내 거래 내역 조회
export const getMyTransactions = async (
  year: number,
  month: number
): Promise<MonthlyTransactionsResponse> => {
  try {
    const response = await get(
      `/api/transaction/my?year=${year}&month=${month}`
    );
    return response;
  } catch (error) {
    console.error("개인 거래 내역 조회 중 오류 발생:", error);
    // 기본값 반환
    return {
      income: 0,
      expense: 0,
      total: 0,
      transactions: [],
    };
  }
};

// 내 거래 내역 추가
export const addMyTransaction = async (
  transaction: Omit<Transaction, "creatorNickname">
): Promise<Transaction> => {
  return post("/api/transaction", transaction);
};

// 내 거래 내역 수정
export const updateMyTransaction = async (
  id: number,
  data: Partial<Transaction>
): Promise<Transaction> => {
  return put(`/api/transaction/${id}`, data);
};

// 내 거래 내역 삭제
export const deleteMyTransaction = async (id: number): Promise<void> => {
  return del(`/api/transaction/${id}`);
};
