// components/transaction/my/UpdateMyTransactionPageClient.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getTransactionById,
  updateTransaction,
  deleteTransaction,
} from "@/services/transactionService";
import { getMyCategories, Category } from "@/services/categoryService";
import Image from "next/image";
import TopBar from "@/components/ui/TopBar";
import BottomBar from "@/components/ui/BottomBar";

export default function UpdateTransactionPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const transactionId = searchParams.get("id");

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [transactionType, setTransactionType] = useState<"EXPENSE" | "INCOME">(
    "EXPENSE"
  );
  const [amount, setAmount] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [date, setDate] = useState<string>(
    new Date().toISOString().split("T")[0].replace(/-/g, "/")
  );
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState<boolean>(false);
  const [amountError, setAmountError] = useState(false);
  const [amountTouched, setAmountTouched] = useState(false);

  // 카테고리 관련 상태
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  // 카테고리 로드
  const loadCategories = useCallback(async (type: "EXPENSE" | "INCOME") => {
    setIsLoadingCategories(true);
    try {
      const categoryList = await getMyCategories(type);
      setCategories(categoryList);

      // 기본 카테고리 설정 (첫 번째 카테고리 또는 "기타" 찾기)
      if (categoryList.length > 0) {
        const defaultCategory =
          categoryList.find((cat) => cat.name === "기타") || categoryList[0];
        setCategoryId(defaultCategory.id);
      }
    } catch (error) {
      console.error("카테고리 로드 오류:", error);
      setCategories([]);
    } finally {
      setIsLoadingCategories(false);
    }
  }, []);

  // 초기 카테고리 로드
  useEffect(() => {
    loadCategories(transactionType);
  }, [loadCategories, transactionType]);

  // 기존 거래 내역 로드
  useEffect(() => {
    const loadTransaction = async () => {
      if (!transactionId) {
        router.replace("/transaction/my");

        return;
      }

      try {
        setIsLoading(true);

        const transaction = await getTransactionById(transactionId);

        // 기존 데이터로 폼 초기화
        setTransactionType(transaction.transactionType);
        setAmount(transaction.amount.toString());
        setContent(transaction.content || "");
        setDate(
          new Date(transaction.transactionDate)
            .toISOString()
            .split("T")[0]
            .replace(/-/g, "/")
        );
        setCategoryId(transaction.categoryId);
      } catch (error) {
        console.error("거래 내역 로드 오류:", error);

        alert("거래 내역을 불러올 수 없습니다.");

        router.replace("/transaction/my");
      } finally {
        setIsLoading(false);
      }
    };

    loadTransaction();
  }, [transactionId, router]);

  // 폼 유효성 검사
  useEffect(() => {
    setIsFormValid(amount.trim().length > 0);
  }, [amount]);

  // 금액 입력 핸들러
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d]/g, "");
    setAmount(value);
  };

  // 내용 입력 핸들러
  const handleContentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContent(e.target.value);
  };

  // 날짜 입력 핸들러
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDate(e.target.value);
  };

  // 카테고리 선택 핸들러
  const handleCategoryChange = (selectedCategoryId: number) => {
    setCategoryId(selectedCategoryId);
    setShowCategoryModal(false);
  };

  // 거래 유형 변경 핸들러
  const handleTransactionTypeChange = (type: "EXPENSE" | "INCOME") => {
    setTransactionType(type);
    loadCategories(type); // 거래 유형 변경 시 카테고리 다시 로드
  };

  // 저장 핸들러 (수정용)
  const handleSubmit = async () => {
    if (isSubmitting || !transactionId) {
      console.log("이미 처리 중이거나 거래 ID가 없습니다.");
      return;
    }

    if (!isFormValid || !categoryId) return;

    console.log("거래 내역 수정 시작");
    setIsSubmitting(true);

    try {
      // 날짜 형식 변환
      const dateStr = date.replace(/\//g, "-");
      const transactionDateTime = new Date(dateStr);
      transactionDateTime.setHours(new Date().getHours());
      transactionDateTime.setMinutes(new Date().getMinutes());
      transactionDateTime.setSeconds(new Date().getSeconds());

      // API 요청을 위한 데이터 구조화
      const transactionData = {
        categoryId: categoryId,
        teamId: null,
        amount: Number(amount),
        content: content || null,
        transactionDate: transactionDateTime.toISOString(),
        transactionType: transactionType,
      };

      console.log("전송할 데이터:", transactionData);

      // API 서비스로 내 거래 내역 수정 요청
      const response = await updateTransaction(transactionId, transactionData);

      console.log("내 거래 내역 수정 성공:", response);

      // 성공 시 내 거래 내역 조회 페이지로 이동
      router.push("/transaction/my");
    } catch (error) {
      console.error("내 거래 내역 수정 오류:", error);
      alert(error.message || "내 거래 내역 수정 중 오류가 발생했습니다.");
      setIsSubmitting(false);
    }
  };

  // 삭제 핸들러
  const handleDelete = async () => {
    if (!transactionId) {
      console.error("거래 ID가 없습니다.");
      return;
    }

    if (!confirm("정말로 이 거래 내역을 삭제하시겠습니까?")) {
      return;
    }

    try {
      await deleteTransaction(transactionId);

      console.log("내 거래 내역 삭제 성공");

      router.push("/transaction/my");
    } catch (error) {
      console.error("내 거래 내역 삭제 오류:", error);
      alert(error.message || "내 거래 내역 삭제 중 오류가 발생했습니다.");
    }
  };

  // 포맷된 금액 표시
  const formattedAmount = () => {
    if (!amount) return "";
    return Number(amount).toLocaleString("ko-KR");
  };

  // 선택된 카테고리 정보 가져오기
  const selectedCategory = categories.find((cat) => cat.id === categoryId);

  // 날짜 포맷팅 함수 (YYYY-MM-DD를 YYYY/MM/DD로 변환)
  const formatDateWithSlash = (dateString) => {
    if (!dateString) return "";

    // '-' 형식으로 들어온 날짜를 '/' 형식으로 변환
    const cleanDate = dateString.replace(/\//g, "-");

    try {
      // 날짜 객체로 변환한 후 다시 포맷팅
      const dateObj = new Date(cleanDate);
      if (isNaN(dateObj.getTime())) return dateString; // 유효하지 않은 날짜인 경우

      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, "0");
      const day = String(dateObj.getDate()).padStart(2, "0");

      return `${year}/${month}/${day}`;
    } catch (error) {
      console.error("날짜 포맷팅 오류:", error);
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen bg-white">
        <TopBar />
        <div className="flex items-center justify-center flex-1">
          <div className="text-gray-500">로딩 중...</div>
        </div>
        <BottomBar />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      <TopBar />

      {/* 거래 내역 수정 제목 블록 */}
      <div className="bg-[#11ABFF] text-white px-4 py-2 flex items-center">
        <h1 className="text-xl font-light">개인 거래 내역 수정</h1>
      </div>

      {/* 거래 유형 선택 */}
      <div className="flex px-6 pt-3">
        <button
          className={`flex-1 cursor-pointer py-2 rounded-[10px] mr-7 ${
            transactionType === "EXPENSE"
              ? "bg-[#FF005E] text-white"
              : "bg-[#D4D4D4] text-white"
          }`}
          onClick={() => handleTransactionTypeChange("EXPENSE")}
        >
          지출
        </button>
        <button
          className={`flex-1 cursor-pointer py-2 rounded-[10px] ${
            transactionType === "INCOME"
              ? "bg-[#0E5EFF] text-white"
              : "bg-[#D4D4D4] text-white"
          }`}
          onClick={() => handleTransactionTypeChange("INCOME")}
        >
          수입
        </button>
      </div>

      {/* 금액 입력 */}
      <div className="px-4 py-4">
        <label className="block font-medium text-md mb-1">
          금액<span className="text-[#FF005E]">*</span>
        </label>
        <div className="relative">
          <input
            type="text"
            className="w-full p-2 border-b border-gray-300 focus:border-blue-500 text-sm outline-none"
            placeholder="15,000"
            value={formattedAmount()}
            onChange={handleAmountChange}
            onBlur={(e) => {
              if (e.target.value.trim() === "") {
                setAmountError(true);
              } else {
                setAmountError(false);
              }
            }}
            onFocus={() => setAmountTouched(true)}
            inputMode="numeric"
          />
        </div>
        {amountError && amountTouched && (
          <p className="text-red-500 text-xs mt-1">금액을 입력해 주세요.</p>
        )}
      </div>

      {/* 내용 입력 */}
      <div className="px-4">
        <label className="block font-medium text-md mb-1">내용</label>
        <input
          type="text"
          className="w-full p-2 border-b border-gray-300 focus:border-blue-500 text-sm outline-none"
          placeholder="파스타"
          value={content}
          onChange={handleContentChange}
        />
      </div>

      {/* 날짜 입력 */}
      <div className="px-4 py-3">
        <label className="block font-medium text-md mb-1">날짜</label>
        <div className="relative">
          <input
            type="text"
            className="w-full p-2 border-b border-gray-300 focus:border-blue-500 text-sm outline-none"
            placeholder="YYYY/MM/DD"
            value={formatDateWithSlash(date)}
            readOnly
            onClick={() =>
              document.getElementById("hidden-date-input")?.showPicker()
            }
          />
          <input
            id="hidden-date-input"
            type="date"
            className="opacity-0 absolute w-0 h-0"
            value={date.replace(/\//g, "-")}
            onChange={handleDateChange}
          />
          <div className="absolute right-3 bottom-2">
            <button
              onClick={() =>
                document.getElementById("hidden-date-input")?.showPicker()
              }
              className="bg-transparent border-0 p-0 cursor-pointer"
            >
              📅
            </button>
          </div>
        </div>
      </div>

      {/* 카테고리 선택 */}
      <div className="px-4 py-1">
        <label className="block font-medium text-md">카테고리</label>
        <div className="flex">
          <button
            className="px-10 py-1 border-2 border-[#808080] rounded-[10px] text-sm text-[#808080] cursor-pointer"
            onClick={() => setShowCategoryModal(true)}
          >
            선택
          </button>
        </div>
      </div>

      {/* 선택된 카테고리 아이콘 */}
      {selectedCategory && (
        <div className="flex justify-left px-4">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-gray-200">
              <Image
                src={selectedCategory.iconUrl}
                alt={selectedCategory.name}
                width={24}
                height={24}
              />
            </div>
            <span className="text-sm text-gray-600">
              {selectedCategory.name}
            </span>
          </div>
        </div>
      )}

      {/* 수정/삭제 버튼 */}
      <div className="px-10 pb-7 mt-auto">
        <div className="flex gap-3">
          <button
            className="flex-1 py-3 rounded-md font-medium transition-colors bg-red-500 hover:bg-red-600 text-white cursor-pointer"
            onClick={handleDelete}
          >
            삭제
          </button>
          <button
            className={`flex-1 py-3 rounded-md font-medium transition-colors ${
              isFormValid && !isSubmitting
                ? "bg-[#0EABFF] hover:bg-blue-500 cursor-pointer text-white"
                : isSubmitting
                ? "bg-[#0EABFF] opacity-50 cursor-not-allowed text-white"
                : "bg-gray-300 text-white cursor-not-allowed"
            }`}
            onClick={handleSubmit}
            disabled={!isFormValid || isSubmitting}
            style={{ pointerEvents: isSubmitting ? "none" : "auto" }}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center cursor-not-allowed">
                <svg
                  className="animate-spin h-5 w-5 mr-2"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                처리 중...
              </span>
            ) : (
              "수정 완료"
            )}
          </button>
        </div>
      </div>

      {/* 카테고리 선택 모달 */}
      {showCategoryModal && (
        <>
          {/* 반투명 오버레이 */}
          <div
            className="absolute top-0 left-0 right-0 bottom-0 bg-[#d9d9d9] opacity-50 flex h-screen items-center justify-center z-50"
            onClick={() => setShowCategoryModal(false)}
          ></div>

          {/* 카테고리 선택 모달 (완전 불투명) */}
          <div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-[10px] p-4 w-[90%] shadow-lg z-50"
            onClick={(e) => e.stopPropagation()}
          >
            {isLoadingCategories ? (
              <div className="flex justify-center items-center h-32">
                <div className="text-gray-500">카테고리 로딩 중...</div>
              </div>
            ) : (
              <div className="grid grid-cols-5 gap-5">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex flex-col items-center cursor-pointer"
                    onClick={() => handleCategoryChange(category.id)}
                  >
                    <div className="w-10 h-10 rounded-[15px] flex items-center justify-center bg-gray-200">
                      <Image
                        src={category.iconUrl}
                        alt={category.name}
                        width={24}
                        height={24}
                      />
                    </div>
                    <span className="text-xs text-center">{category.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <BottomBar />
    </div>
  );
}
