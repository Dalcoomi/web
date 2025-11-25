// services/categoryService.ts
import { get, post, put, del } from "@/utils/apiClient";

// 🔥 중복 요청 방지를 위한 Promise 캐시
const pendingCategoryRequests = new Map<string, Promise<Category[]>>();

// 카테고리 타입 정의
export interface Category {
  id: number;
  name: string;
  iconUrl: string;
  ownerType: "USER" | "SYSTEM";
}

// 카테고리 응답 타입
export interface GetCategoriesResponse {
  categories: Category[];
}

// 거래 유형에 따른 개인 카테고리 조회
export const getMyCategories = async (
  transactionType: "INCOME" | "EXPENSE"
): Promise<Category[]> => {
  const url = `/api/categories?transactionType=${transactionType}`;

  // 🔥 이미 동일한 요청이 진행 중이면 기존 Promise 반환
  if (pendingCategoryRequests.has(url)) {
    return pendingCategoryRequests.get(url)!;
  }

  // 🔥 새로운 요청 시작
  const requestPromise = (async () => {
    try {
      const response: GetCategoriesResponse = await get(url);
      return response.categories;
    } catch (error) {
      alert(error);
      return [];
    } finally {
      // 🔥 요청 완료 후 캐시에서 제거 (50ms 후)
      setTimeout(() => {
        pendingCategoryRequests.delete(url);
      }, 50);
    }
  })();

  pendingCategoryRequests.set(url, requestPromise);
  return requestPromise;
};

// 거래 유형에 따른 그룹 카테고리 조회
export const getTeamCategories = async (
  teamId: number,
  transactionType: "INCOME" | "EXPENSE"
): Promise<Category[]> => {
  const url = `/api/categories?teamId=${teamId}&transactionType=${transactionType}`;

  // 🔥 이미 동일한 요청이 진행 중이면 기존 Promise 반환
  if (pendingCategoryRequests.has(url)) {
    return pendingCategoryRequests.get(url)!;
  }

  // 🔥 새로운 요청 시작
  const requestPromise = (async () => {
    try {
      const response: GetCategoriesResponse = await get(url);
      return response.categories;
    } catch (error) {
      alert(error);
      return [];
    } finally {
      // 🔥 요청 완료 후 캐시에서 제거 (50ms 후)
      setTimeout(() => {
        pendingCategoryRequests.delete(url);
      }, 50);
    }
  })();

  pendingCategoryRequests.set(url, requestPromise);
  return requestPromise;
};
