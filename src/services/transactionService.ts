// services/transactionService.ts
import { get, post, put, del } from "@/utils/apiClient";
import { isDemoMode } from "@/utils/demoMode";
import {
  addDemoTransaction,
  deleteDemoTransaction,
  getDemoTransactionById,
  getDemoTransactionsByMonth,
  updateDemoTransaction,
} from "@/services/demoData";

// 🔥 중복 요청 방지를 위한 Promise 캐시
const pendingRequests = new Map<string, Promise<MonthlyTransactionsResponse>>();

// 백엔드 응답에 맞춘 트랜잭션 타입 정의
export interface Transaction {
  transactionId: string;
  amount: number;
  content: string;
  transactionDate: string;
  transactionType: "INCOME" | "EXPENSE";
  creatorNickname: string;
  creatorProfileImageUrl?: string | null;
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

// 트랜잭션 검색 조건 타입
export interface TransactionSearchCriteria {
  teamId?: number | null;
  year: number;
  month: number;
  categoryName?: string | null;
  creatorNickname?: string | null;
}

// 🔥 영수증 업로드 관련 타입 정의
export interface UploadReceiptResponseItem {
  transactionDate: string; // LocalDate는 문자열로 전송됨
  categoryName: string;
  content: string;
  amount: number;
}

export interface UploadReceiptResponse {
  taskId: string; // 🔥 taskId 추가
  transactions: UploadReceiptResponseItem[];
}

// 🔥 벌크 거래 내역 생성 관련 타입 정의
export interface TransactionRequest {
  categoryId: number;
  teamId?: number | null;
  amount: number;
  content: string | null;
  transactionDate: string;
  transactionType: "INCOME" | "EXPENSE";
  synchronizeTransaction?: boolean;
}

export interface ReceiptsTransactionRequest {
  taskId: string;
  transactions: TransactionRequest[];
}

// 거래 내역 추가 API
export const addTransaction = async (transactionData: TransactionRequest) => {
  if (isDemoMode()) {
    addDemoTransaction(transactionData);
    return;
  }
  return post("/api/transactions", transactionData);
};

// 🔥 영수증 거래 내역 추가 API
export const addReceiptsTransactions = async (
  receiptsData: ReceiptsTransactionRequest
) => {
  if (isDemoMode()) {
    receiptsData.transactions.forEach((transaction) => {
      addDemoTransaction(transaction);
    });
    return;
  }
  return post("/api/transactions/receipts/save", receiptsData);
};

// 🔥 영수증 업로드 API
export const uploadReceipt = async (
  file: File,
  teamId?: number | null
): Promise<UploadReceiptResponse> => {
  if (isDemoMode()) {
    return {
      taskId: `demo-receipt-${Date.now()}`,
      transactions: [
        {
          transactionDate: new Date().toISOString().slice(0, 19),
          categoryName: "식비",
          content: `${file.name.replace(/\.[^.]+$/, "")} 결제`,
          amount: 12000,
        },
      ],
    };
  }

  try {
    // FormData 생성
    const formData = new FormData();
    formData.append("receipt", file);

    // teamId가 있으면 추가, 없으면 빈 문자열 (개인 거래)
    formData.append("teamId", teamId ? teamId.toString() : "");

    // apiClient를 사용하되, 특별한 처리가 필요한 경우
    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    // 토큰 가져오기 (apiClient에서 사용하는 방식과 동일)
    const { getAccessToken } = await import("@/utils/tokenManager");
    const accessToken = getAccessToken();

    const headers: Record<string, string> = {};
    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }

    const response = await fetch(
      `${API_URL}/api/transactions/receipts/upload`,
      {
        method: "POST",
        body: formData,
        headers, // Content-Type은 FormData 사용 시 자동 설정
        credentials: "include", // 쿠키 포함 (PWA 환경에서 필수)
        mode: "cors", // CORS 모드 명시
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      // 🔥 413 에러 (Payload Too Large) 처리
      if (response.status === 413) {
        throw new Error("파일 크기가 너무 큽니다. 10MB 이하의 파일을 선택해주세요.");
      }

      throw new Error(
        errorData.message ||
          `HTTP ${response.status}: 영수증 업로드에 실패했습니다.`
      );
    }

    return response.json();
  } catch (error) {
    // 🔥 네트워크 에러 처리
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error("네트워크 연결을 확인하거나, 파일 크기가 너무 크지 않은지 확인해주세요.");
    }
    throw error;
  }
};

// 전체 거래 내역 조회 API
export const getTransactions = async (
  criteria: TransactionSearchCriteria
): Promise<MonthlyTransactionsResponse> => {
  if (isDemoMode()) {
    return getDemoTransactionsByMonth(criteria);
  }

  const params = new URLSearchParams();

  // teamId 추가 (null이면 개인 거래)
  if (criteria.teamId !== null && criteria.teamId !== undefined) {
    params.append("teamId", criteria.teamId.toString());
  }

  // year, month는 필수
  params.append("year", criteria.year.toString());
  params.append("month", criteria.month.toString());

  // 선택적 필터 조건들
  if (criteria.categoryName) {
    params.append("categoryName", criteria.categoryName);
  }

  if (criteria.creatorNickname) {
    params.append("creatorNickname", criteria.creatorNickname);
  }

  const url = `/api/transactions?${params.toString()}`;

  // 🔥 이미 동일한 요청이 진행 중이면 기존 Promise 반환
  if (pendingRequests.has(url)) {
    return pendingRequests.get(url)!;
  }

  // 🔥 새로운 요청 시작
  const requestPromise = (async () => {
    try {
      const response = await get(url);
      return response;
    } catch (error) {
      console.error("거래 내역 조회 실패:", error);
      // 기본값 반환
      return {
        income: 0,
        expense: 0,
        total: 0,
        transactions: [],
      };
    } finally {
      // 🔥 요청 완료 후 캐시에서 제거 (50ms 후)
      setTimeout(() => {
        pendingRequests.delete(url);
      }, 50);
    }
  })();

  pendingRequests.set(url, requestPromise);
  return requestPromise;
};

// 특정 거래 내역 조회 API
export const getTransactionById = async (
  transactionId: string,
  teamId?: string
): Promise<Transaction> => {
  if (isDemoMode()) {
    const found = getDemoTransactionById(transactionId, teamId);
    if (!found) {
      throw new Error("거래 내역을 찾을 수 없습니다.");
    }
    return found;
  }

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
export const updateTransaction = async (
  transactionId: string,
  data: TransactionRequest
) => {
  if (isDemoMode()) {
    updateDemoTransaction(transactionId, data);
    return;
  }
  return put(`/api/transactions/${transactionId}`, data);
};

// 거래 내역 삭제
export const deleteTransaction = async (
  transactionId: string
): Promise<void> => {
  if (isDemoMode()) {
    deleteDemoTransaction(transactionId);
    return;
  }
  return del(`/api/transactions/${transactionId}`);
};
