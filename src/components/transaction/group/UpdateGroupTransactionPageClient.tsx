// components/transaction/group/UpdateGroupTransactionPageClient.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import {
  getTransactionById,
  updateTransaction,
  deleteTransaction,
} from "@/services/transactionService";
import { Transaction } from "@/services/transactionService";
import { getTeamCategories, Category } from "@/services/categoryService";
import { useMemberStore } from "@/stores/useMemberStore";
import { getGroupInfo, GroupInfo } from "@/services/groupService";
import Image from "next/image";
import TopBar from "@/components/ui/TopBar";
import BottomBar from "@/components/ui/BottomBar";

export default function UpdateGroupTransactionPageClient() {
  const getTodayInSeoul = (): string => {
    const today = new Date();
    const seoulDate = new Date(
      today.toLocaleString("en-US", { timeZone: "Asia/Seoul" })
    );

    const year = seoulDate.getFullYear();
    const month = String(seoulDate.getMonth() + 1).padStart(2, "0");
    const day = String(seoulDate.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { member: currentUser, fetchMember } = useMemberStore();

  const teamId = params.teamId as string;
  const transactionId = searchParams.get("id");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [transactionType, setTransactionType] = useState<"EXPENSE" | "INCOME">(
    "EXPENSE"
  );
  const [amount, setAmount] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [date, setDate] = useState<string>(getTodayInSeoul());
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState<boolean>(false);
  const [amountError, setAmountError] = useState(false);
  const [amountTouched, setAmountTouched] = useState(false);
  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);

  // 카테고리 관련 상태
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [originalTransaction, setOriginalTransaction] =
    useState<Transaction | null>(null);

  // 회원 정보가 없으면 가져오기
  useEffect(() => {
    if (!currentUser) {
      fetchMember();
    }
  }, [currentUser, fetchMember]);

  // 기존 거래 내역 로드
  useEffect(() => {
    if (!teamId) {
      router.replace("/group"); // teamId가 없으면 그룹 목록으로 리다이렉트
      return;
    }

    const loadTransaction = async () => {
      if (!transactionId) {
        router.replace(`/transaction/group/${teamId}`);

        return;
      }

      try {
        const transaction = await getTransactionById(transactionId, teamId);

        // 원본 거래 데이터 저장
        setOriginalTransaction(transaction);

        // 기존 데이터로 폼 초기화
        setTransactionType(transaction.transactionType);
        setAmount(transaction.amount.toString());
        setContent(transaction.content || "");
        setDate(
          new Date(transaction.transactionDate).toLocaleDateString("sv-SE", {
            timeZone: "Asia/Seoul",
          })
        );
        setCategoryId(transaction.categoryId);

        setIsLoadingCategories(true);
        const categoryList = await getTeamCategories(
          parseInt(teamId),
          transaction.transactionType
        );
        setCategories(categoryList);
        setIsLoadingCategories(false);
      } catch (error) {
        alert(error || "거래 내역을 불러올 수 없습니다.");

        router.replace(`/transaction/group/${teamId}`);
      }
    };

    const timeoutId1 = setTimeout(async () => {
      try {
        const response = await getGroupInfo(teamId);

        setGroupInfo(response);
      } catch (error) {
        alert(error || "그룹 정보를 불러올 수 없습니다.");
        router.replace("/group");
      }
    }, 100);

    const timeoutId2 = setTimeout(() => {
      loadTransaction();
    }, 100);

    return () => {
      clearTimeout(timeoutId1);
      clearTimeout(timeoutId2);
    };
  }, [transactionId, router, teamId]);

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
  const handleTransactionTypeChange = async (type: "EXPENSE" | "INCOME") => {
    setTransactionType(type);

    setIsLoadingCategories(true);
    try {
      const categoryList = await getTeamCategories(parseInt(teamId), type);
      setCategories(categoryList);

      // 원래 거래 유형으로 돌아왔는지 확인
      if (originalTransaction && type === originalTransaction.transactionType) {
        // 원래 거래 유형이면 원래 카테고리 복원
        setCategoryId(originalTransaction.categoryId);
      } else {
        // 첫 번째 카테고리를 기본값으로 설정
        if (categoryList.length > 0) {
          const defaultCategory =
            categoryList.find((cat) => cat.name === "기타") || categoryList[0];

          setCategoryId(defaultCategory.id);
        }
      }
    } catch (error) {
      alert(error);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  // 저장 핸들러 (수정용)
  const handleSubmit = async () => {
    if (isSubmitting || !transactionId) {
      return;
    }

    if (!isFormValid || !categoryId) return;

    setIsSubmitting(true);

    try {
      const [year, month, day] = date.split("-").map(Number);

      // Asia/Seoul 시간대로 현재 시간 생성
      const now = new Date();
      const seoulNow = new Date(
        now.toLocaleString("en-US", { timeZone: "Asia/Seoul" })
      );

      // 선택한 날짜에 Seoul 시간대의 현재 시간 적용
      const transactionDateTime = new Date(year, month - 1, day);
      transactionDateTime.setHours(seoulNow.getHours());
      transactionDateTime.setMinutes(seoulNow.getMinutes());
      transactionDateTime.setSeconds(seoulNow.getSeconds());

      // API 요청을 위한 데이터 구조화
      const transactionData = {
        categoryId: categoryId,
        teamId: null,
        amount: Number(amount),
        content: content || null,
        transactionDate:
          transactionDateTime.toLocaleDateString("sv-SE") +
          "T" +
          transactionDateTime.toLocaleTimeString("sv-SE"),
        transactionType: transactionType,
      };

      // API 서비스로 거래 내역 수정 요청
      await updateTransaction(transactionId, transactionData);

      // 성공 시 거래 내역 조회 페이지로 이동
      router.push(`/transaction/group/${teamId}`);
    } catch (error) {
      alert(error || "그룹 거래 내역 수정 중 오류가 발생했습니다.");
      setIsSubmitting(false);
    }
  };

  // 삭제 핸들러
  const handleDelete = async () => {
    if (!transactionId) {
      return;
    }

    if (!confirm("정말로 이 거래 내역을 삭제하시겠습니까?")) {
      return;
    }

    try {
      await deleteTransaction(transactionId);

      router.push(`/transaction/group/${teamId}`);
    } catch (error) {
      alert(error || "그룹 거래 내역 삭제 중 오류가 발생했습니다.");
    }
  };

  // 포맷된 금액 표시
  const formattedAmount = () => {
    if (!amount) return "";
    return Number(amount).toLocaleString("ko-KR");
  };

  // 선택된 카테고리 정보 가져오기
  const selectedCategory = categories.find((cat) => cat.id === categoryId);

  // 현재 사용자가 작성자인지 확인
  const isOwner =
    currentUser?.nickname === originalTransaction?.creatorNickname;

  return (
    <div className="flex flex-col h-screen bg-white">
      <TopBar />

      {/* 메인 컨텐츠 영역 - flex-1으로 남은 공간 차지 */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* 거래 내역 수정 제목 블록 */}
        <div className="bg-[#11ABFF] text-white px-4 py-2 items-center">
          <h1 className="text-xl font-light">
            [{groupInfo?.title}] 거래 내역 수정
          </h1>
        </div>

        {/* 스크롤 가능한 콘텐츠 영역 */}
        <div className="flex-1 overflow-y-auto">
          {/* 거래 유형 선택 */}
          <div className="flex px-6 pt-3">
            <button
              className={`flex-1 py-2 rounded-[10px] mr-7 ${
                transactionType === "EXPENSE"
                  ? "bg-[#FF005E] text-white"
                  : "bg-[#D4D4D4] text-white"
              } ${isOwner ? "cursor-pointer" : "cursor-not-allowed"}`}
              onClick={() => isOwner && handleTransactionTypeChange("EXPENSE")}
              disabled={!isOwner}
            >
              지출
            </button>
            <button
              className={`flex-1 py-2 rounded-[10px] ${
                transactionType === "INCOME"
                  ? "bg-[#0E5EFF] text-white"
                  : "bg-[#D4D4D4] text-white"
              } ${isOwner ? "cursor-pointer" : "cursor-not-allowed"}`}
              onClick={() => isOwner && handleTransactionTypeChange("INCOME")}
              disabled={!isOwner}
            >
              수입
            </button>
          </div>

          {/* 작성자 정보 */}
          {originalTransaction?.creatorNickname && (
            <div className="px-4 py-3 border-b border-gray-100">
              <span className="text-sm text-gray-600">작성자: </span>
              <span className="text-sm font-medium text-gray-800">
                {originalTransaction.creatorNickname}
              </span>
            </div>
          )}

          {/* 금액 입력 */}
          <div className="px-4 py-3">
            <label className="block font-medium text-md mb-1">
              금액<span className="text-[#FF005E]">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                className="w-full p-2 border-b border-gray-300 focus:border-blue-500 text-sm outline-none"
                placeholder="금액을 입력해주세요"
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
                disabled={!isOwner}
              />
            </div>
            {amountError && amountTouched && (
              <p className="text-red-500 text-xs mt-1">금액을 입력해 주세요</p>
            )}
          </div>

          {/* 내용 입력 */}
          <div className="px-4">
            <label className="block font-medium text-md mb-1">내용</label>
            <input
              type="text"
              className="w-full p-2 border-b border-gray-300 focus:border-blue-500 text-sm outline-none"
              placeholder="내용을 입력해주세요"
              value={content}
              onChange={handleContentChange}
              disabled={!isOwner}
            />
          </div>

          {/* 날짜 입력*/}
          <div className="px-4 py-3">
            <label className="block font-medium text-md mb-1">날짜</label>
            <div className="date-input-wrapper">
              <input
                type="date"
                className="px-2 py-1 border rounded-[10px] border-gray-300 text-sm hover:border-blue-500 focus:border-blue-500 outline-none transition-colors"
                value={date.replace(/\//g, "-")}
                onChange={handleDateChange}
                disabled={!isOwner}
              />
            </div>
          </div>

          {/* 카테고리 선택 */}
          <div className="px-4 py-1">
            <label className="block font-medium text-md">카테고리</label>
          </div>

          {/* 선택된 카테고리 아이콘 */}
          {selectedCategory && (
            <div className="flex justify-left px-4 pb-4">
              <button
                className="flex flex-col items-center cursor-pointer bg-transparent border-none p-0"
                onClick={() => isOwner && setShowCategoryModal(true)}
                disabled={isLoadingCategories || !isOwner}
              >
                <Image
                  src={selectedCategory.iconUrl}
                  alt={selectedCategory.name}
                  width={48}
                  height={48}
                  className="rounded-lg"
                  quality={100}
                  unoptimized={true}
                />
                <span className="text-sm">{selectedCategory.name}</span>
              </button>
            </div>
          )}
        </div>

        {/* 하단 고정 버튼 영역 */}
        <div className="flex-shrink-0 bg-white">
          {/* 현재 사용자가 작성자인 경우만 수정/삭제 버튼 표시 */}
          {isOwner && (
            <div className="px-10 py-7">
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
          )}
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
                    <Image
                      src={category.iconUrl}
                      alt={category.name}
                      width={40}
                      height={40}
                      quality={100}
                      unoptimized={true}
                    />
                    <span className="text-xs text-center">{category.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* BottomBar - 최하단 고정 */}
      <BottomBar />
    </div>
  );
}
