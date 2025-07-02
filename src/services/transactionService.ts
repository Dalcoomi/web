// services/transactionService.ts
import { get, post, put, del } from "@/utils/apiClient";

// 백엔드 응답에 맞춘 트랜잭션 타입 정의
export interface Transaction {
  transactionId: string;
  amount: number;
  content: string;
  transactionDate: string;
  transactionType: "INCOME" | "EXPENSE";
  creatorNickname: string;
  categoryId: number;
  categoryName: string;
  iconUrl: string;
}

// 월별 트랜잭션 응답 타입
export interface MonthlyTransactionsResponse {
  income: number;
  expense: number;
  total: number;
  transactions: Transaction[];
}

// 거래 내역 추가 API
export const addTransaction = async (transactionData: any) => {
  return post("/api/transactions", transactionData);
};

// 전체 거래 내역 조회 API
export const getTransactions = async (
  teamIdOrYear: number,
  yearOrMonth: number,
  month?: number
): Promise<MonthlyTransactionsResponse> => {
  try {
    let url: string;

    if (month !== undefined) {
      // 3개 매개변수가 모두 있는 경우: teamId, year, month
      const teamId = teamIdOrYear;
      const year = yearOrMonth;
      url = `/api/transactions?teamId=${teamId}&year=${year}&month=${month}`;
    } else {
      // 2개 매개변수만 있는 경우: year, month (개인 거래)
      const year = teamIdOrYear;
      const monthParam = yearOrMonth;
      url = `/api/transactions?year=${year}&month=${monthParam}`;
    }

    const response = await get(url);

    return response;
  } catch (error) {
    alert(error);

    // 기본값 반환
    return {
      income: 0,
      expense: 0,
      total: 0,
      transactions: [],
    };
  }
};

// 특정 거래 내역 조회 API
export const getTransactionById = async (
  transactionId: string,
  teamId?: string
): Promise<Transaction> => {
  try {
    let url: string;

    if (teamId === undefined) {
      url = `/api/transactions/${transactionId}`;
    } else {
      url = `/api/transactions/${transactionId}?teamId=${teamId}`;
    }

    const response = await get(url);

    return response;
  } catch (error) {
    throw error;
  }
};

// 거래 내역 수정
export const updateTransaction = async (transactionId: string, data: any) => {
  return put(`/api/transactions/${transactionId}`, data);
};

// 거래 내역 삭제
export const deleteTransaction = async (
  transactionId: string
): Promise<void> => {
  return del(`/api/transactions/${transactionId}`);
};
