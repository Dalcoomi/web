// services/categoryService.ts
import { get, post, put, del } from "@/utils/apiClient";

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
  try {
    const response: GetCategoriesResponse = await get(
      `/api/category/my?transactionType=${transactionType}`
    );

    return response.categories;
  } catch (error) {
    alert(error);

    // 에러 발생 시 빈 배열 반환
    return [];
  }
};

// 거래 유형에 따른 그룹 카테고리 조회
export const getTeamCategories = async (
  teamId: number,
  transactionType: "INCOME" | "EXPENSE"
): Promise<Category[]> => {
  try {
    const response: GetCategoriesResponse = await get(
      `/api/category/team?teamId=${teamId}&transactionType=${transactionType}`
    );

    return response.categories;
  } catch (error) {
    alert(error);

    // 에러 발생 시 빈 배열 반환
    return [];
  }
};
