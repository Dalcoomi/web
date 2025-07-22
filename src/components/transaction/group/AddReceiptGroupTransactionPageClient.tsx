// components/transaction/group/AddReceiptGroupTransactionPageClient.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  addReceiptsTransactions,
  uploadReceipt,
  UploadReceiptResponse,
  ReceiptsTransactionRequest,
  TransactionRequest,
} from "@/services/transactionService";
import { getTeamCategories, Category } from "@/services/categoryService";
import { getGroupInfo, GroupInfo } from "@/services/groupService";
import Image from "next/image";
import TopBar from "@/components/ui/TopBar";
import BottomBar from "@/components/ui/BottomBar";

interface ReceiptItem {
  id: number;
  transactionDate: string;
  categoryName: string;
  content: string;
  amount: string;
}

export default function AddReceiptMyTransactionPageClient() {
  const router = useRouter();
  const params = useParams();
  const teamId = params.teamId as string; // URL에서 teamId 추출

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [receiptItems, setReceiptItems] = useState<ReceiptItem[]>([]);
  const [hasUploadedReceipt, setHasUploadedReceipt] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null); // 🔥 taskId 상태 추가
  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);

  // 카테고리 관련 상태
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState<boolean>(false);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);

  // 🔥 디바운스를 위한 ref
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 🔥 디바운스가 적용된 카테고리 로드 함수
  const loadCategories = useCallback(async () => {
    if (!teamId) return;

    setIsLoadingCategories(true);

    try {
      const categoryList = await getTeamCategories(parseInt(teamId), "EXPENSE");
      setCategories(categoryList);
    } catch (error) {
      alert(error);
      setCategories([]);
    } finally {
      setIsLoadingCategories(false);
    }
  }, [teamId]);

  // 🔥 디바운스가 적용된 카테고리 로드
  const debouncedLoadCategories = useCallback(() => {
    // 기존 타이머 클리어
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // 새 타이머 설정 (300ms 디바운스)
    debounceTimeoutRef.current = setTimeout(() => {
      loadCategories();
    }, 300);
  }, [loadCategories]);

  // 초기 그룹 정보, 카테고리 로드 (디바운스 적용)
  useEffect(() => {
    if (!teamId) {
      router.replace("/group"); // teamId가 없으면 그룹 목록으로 리다이렉트
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

    debouncedLoadCategories();

    // 클린업 함수
    return () => {
      clearTimeout(timeoutId);

      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [teamId, router, debouncedLoadCategories]);

  // 총 금액 계산
  const totalAmount = receiptItems.reduce((sum, item) => {
    const amount = parseInt(item.amount.replace(/[^\d]/g, "")) || 0;
    return sum + amount;
  }, 0);

  // 영수증 업로드 API 호출 - 서비스 사용
  const uploadReceiptToAPI = async (
    file: File
  ): Promise<UploadReceiptResponse> => {
    return uploadReceipt(file, parseInt(teamId));
  };

  // 영수증 업로드 핸들러
  const handleReceiptUpload = () => {
    fileInputRef.current?.click();
  };

  // 파일 선택 핸들러
  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 파일 타입 검증
    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 업로드 가능합니다.");
      return;
    }

    // 파일 크기 검증 (10MB 제한)
    if (file.size > 10 * 1024 * 1024) {
      alert("파일 크기는 10MB 이하여야 합니다.");
      return;
    }

    setIsUploading(true);

    try {
      const response = await uploadReceiptToAPI(file);

      // 🔥 taskId 저장
      setTaskId(response.taskId);

      // 백엔드 응답을 프론트엔드 형식으로 변환
      const convertedItems: ReceiptItem[] = response.transactions.map(
        (item, index) => ({
          id: index + 1,
          transactionDate: item.transactionDate,
          categoryName: item.categoryName,
          content: item.content,
          amount: item.amount.toLocaleString("ko-KR"),
        })
      );

      setReceiptItems(convertedItems);
      setHasUploadedReceipt(true);
    } catch (error) {
      console.error("영수증 업로드 오류:", error);
      alert(
        error instanceof Error
          ? error.message
          : "영수증 업로드 중 오류가 발생했습니다."
      );
    } finally {
      setIsUploading(false);
      // 파일 input 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // 입력 핸들러들
  const handleItemChange = (
    id: number,
    field: keyof ReceiptItem,
    value: string
  ) => {
    setReceiptItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          // 금액 필드인 경우 숫자만 허용하고 포맷팅
          if (field === "amount") {
            const numericValue = value.replace(/[^\d]/g, "");
            const formattedValue = numericValue
              ? parseInt(numericValue).toLocaleString("ko-KR")
              : "";
            return { ...item, [field]: formattedValue };
          }
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  // 카테고리 선택 모달 열기
  const openCategoryModal = (itemId: number) => {
    setSelectedItemId(itemId);
    setShowCategoryModal(true);
  };

  // 카테고리 선택 핸들러
  const handleCategorySelect = (categoryName: string) => {
    if (selectedItemId) {
      handleItemChange(selectedItemId, "categoryName", categoryName);
    }
    setShowCategoryModal(false);
    setSelectedItemId(null);
  };

  // 저장 핸들러 - 벌크 API 사용
  const handleSubmit = async () => {
    if (isSubmitting) return;

    // 금액이 입력되지 않은 항목 체크
    const emptyAmountItems = receiptItems.filter((item) => !item.amount.trim());

    if (emptyAmountItems.length > 0) {
      alert("모든 항목의 금액을 입력해주세요. 금액은 필수입니다.");
      return;
    }

    // 입력된 항목들만 필터링
    const validItems = receiptItems.filter((item) => item.amount.trim());

    if (validItems.length === 0) {
      alert("최소 하나의 항목을 입력해주세요.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 벌크 거래 데이터 구성
      const transactions: TransactionRequest[] = validItems.map((item) => {
        // 카테고리 찾기 (없으면 기본 카테고리 사용)
        const category = categories.find(
          (cat) => cat.name === item.categoryName
        );
        const categoryId = category?.id || categories[0]?.id;

        if (!categoryId) {
          throw new Error("카테고리를 찾을 수 없습니다.");
        }

        // 날짜 처리 - 백엔드에서 받은 날짜 사용
        let transactionDateTime: Date;

        if (item.transactionDate) {
          // 백엔드에서 받은 날짜를 사용
          transactionDateTime = new Date(item.transactionDate);

          // 시간 정보가 없으면 현재 시간 설정
          if (
            transactionDateTime.getHours() === 0 &&
            transactionDateTime.getMinutes() === 0 &&
            transactionDateTime.getSeconds() === 0
          ) {
            const now = new Date();
            const seoulNow = new Date(
              now.toLocaleString("en-US", { timeZone: "Asia/Seoul" })
            );
            transactionDateTime.setHours(seoulNow.getHours());
            transactionDateTime.setMinutes(seoulNow.getMinutes());
            transactionDateTime.setSeconds(seoulNow.getSeconds());
          }
        } else {
          // 날짜가 없으면 현재 날짜/시간 사용
          const now = new Date();
          transactionDateTime = new Date(
            now.toLocaleString("en-US", { timeZone: "Asia/Seoul" })
          );
        }

        return {
          categoryId: categoryId,
          teamId: parseInt(teamId),
          amount: parseInt(item.amount.replace(/[^\d]/g, "")),
          content: item.content || null,
          transactionDate:
            transactionDateTime.toLocaleDateString("sv-SE") +
            "T" +
            transactionDateTime.toLocaleTimeString("sv-SE"),
          transactionType: "EXPENSE" as const,
        };
      });

      // 🔥 영수증 업로드에서 받은 taskId 사용
      if (!taskId) {
        throw new Error("영수증 업로드 정보가 없습니다. 다시 업로드해주세요.");
      }

      // 영수증 데이터 구성
      const receiptsData: ReceiptsTransactionRequest = {
        taskId: taskId, // 🔥 영수증 업로드에서 받은 taskId 사용
        transactions: transactions,
      };

      // 영수증 등록 API 호출
      await addReceiptsTransactions(receiptsData);

      await new Promise((resolve) => setTimeout(resolve, 1000));

      // 성공 시 개인 거래 내역 조회 페이지로 이동
      router.push(`/transaction/group/${teamId}`);
    } catch (error) {
      alert(error || "영수증 등록 중 오류가 발생했습니다.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      <TopBar />

      {/* 영수증 등록 제목 블록 */}
      <div className="bg-[#11ABFF] text-white px-4 py-2 items-center">
        <h1 className="text-xl font-light">
          [{groupInfo?.title}] 거래 내역 영수증 작성
        </h1>
      </div>

      {/* 메인 컨텐츠 영역 - flex-1으로 남은 공간 차지 */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* 영수증 사진 업로드 버튼 */}
        <div className="px-22 py-3 flex-shrink-0">
          <button
            onClick={handleReceiptUpload}
            disabled={isUploading}
            className={`w-full text-[#11ABFF] border-2 border-[#11ABFF] rounded-[10px] py-1 text-md flex flex-col items-center justify-center ${
              isUploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
            }`}
          >
            <div className="flex items-center">
              {isUploading ? (
                <svg
                  className="animate-spin h-6 w-6 mr-3"
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
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              ) : (
                <Image
                  src="/images/transaction/영수증_AI_등록.svg"
                  alt="영수증"
                  width={30}
                  height={30}
                  className="-ml-1 mr-3"
                />
              )}
              <span>
                {isUploading ? "영수증 분석 중..." : "영수증 사진 업로드하기"}
              </span>
            </div>
          </button>

          {/* 숨겨진 파일 input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* 영수증이 업로드된 경우에만 테이블 표시 */}
        {hasUploadedReceipt && (
          <>
            {/* 테이블 헤더 */}
            <div className="px-3 py-2 flex-shrink-0">
              <div className="grid grid-cols-12 text-sm text-black">
                <div className="col-span-1 text-left">No.</div>
                <div className="col-span-3 text-center mr-3">날짜</div>
                <div className="col-span-2 text-left">카테고리</div>
                <div className="col-span-3 text-center mr-4">내용</div>
                <div className="col-span-3 text-center ml-4">
                  금액<span className="text-red-500">*</span>
                </div>
              </div>
            </div>

            {/* 스크롤 가능한 테이블 영역 - flex-1으로 남은 공간 차지 */}
            <div className="flex-1 overflow-y-auto px-3 min-h-0">
              {receiptItems.map((item, index) => (
                <div
                  key={item.id}
                  className="grid grid-cols-12 gap-2 py-0.5 items-center"
                >
                  {/* 인덱스 번호 */}
                  <div className="col-span-1 text-center">
                    <span className="text-sm text-gray-600">{index + 1}</span>
                  </div>

                  {/* 날짜 */}
                  <div className="col-span-3 -mr-1">
                    <input
                      type="date"
                      className="w-full p-1 text-xs border border-gray-200 rounded focus:border-[#11ABFF] outline-none"
                      value={item.transactionDate}
                      onChange={(e) =>
                        handleItemChange(
                          item.id,
                          "transactionDate",
                          e.target.value
                        )
                      }
                    />
                  </div>

                  {/* 카테고리 */}
                  <div className="col-span-2 -mr-1">
                    <button
                      type="button"
                      className="w-full p-1 text-xs border border-gray-200 rounded text-center focus:border-[#11ABFF] outline-none hover:bg-gray-50 cursor-pointer"
                      onClick={() => openCategoryModal(item.id)}
                    >
                      {item.categoryName || "선택"}
                    </button>
                  </div>

                  {/* 내용 */}
                  <div className="col-span-3 -mr-1">
                    <input
                      type="text"
                      className="w-full p-1 text-xs border border-gray-200 rounded focus:border-[#11ABFF] outline-none"
                      value={item.content}
                      onChange={(e) =>
                        handleItemChange(item.id, "content", e.target.value)
                      }
                      placeholder="내용 입력하기"
                    />
                  </div>

                  {/* 금액 */}
                  <div className="col-span-3">
                    <input
                      type="text"
                      className="w-full p-1 text-xs border border-gray-200 rounded focus:border-[#11ABFF] outline-none text-right"
                      value={item.amount}
                      onChange={(e) =>
                        handleItemChange(item.id, "amount", e.target.value)
                      }
                      placeholder="금액은 필수입니다"
                      inputMode="numeric"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* 합계 및 완료 버튼 - 하단 고정 */}
            <div className="flex-shrink-0 bg-white">
              {/* 합계 - 고정 크기 박스 */}
              <div className="px-10 py-4">
                <div className="flex items-center text-lg">
                  <span className="mr-8">합계</span>
                  <div className="w-60 h-10 border-2 border-[#D4D4D4] rounded-[10px] flex items-center justify-center text-black bg-white">
                    <span className="text-lg font-medium">
                      {totalAmount.toLocaleString("ko-KR")}
                    </span>
                  </div>
                </div>
              </div>

              {/* 완료 버튼 */}
              <div className="px-10 pb-7">
                <button
                  className={`w-full py-3 rounded-md font-medium transition-colors ${
                    totalAmount > 0 && !isSubmitting
                      ? "bg-[#0EABFF] hover:bg-blue-500 cursor-pointer text-white"
                      : isSubmitting
                      ? "bg-[#0EABFF] opacity-50 cursor-not-allowed text-white"
                      : "bg-gray-300 text-white cursor-not-allowed"
                  }`}
                  onClick={handleSubmit}
                  disabled={totalAmount === 0 || isSubmitting}
                  style={{ pointerEvents: isSubmitting ? "none" : "auto" }}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
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
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      처리 중...
                    </span>
                  ) : (
                    "완료"
                  )}
                </button>
              </div>
            </div>
          </>
        )}

        {/* 영수증이 업로드되지 않은 경우 안내 메시지 */}
        {!hasUploadedReceipt && !isUploading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500 mb-50">
              <p className="text-lg mb-2">영수증을 업로드해 주세요</p>
              <p className="text-sm">AI가 자동으로 내역을 분석해드립니다</p>
            </div>
          </div>
        )}
      </div>

      {/* 카테고리 선택 모달 */}
      {showCategoryModal && (
        <>
          {/* 반투명 오버레이 */}
          <div
            className="absolute top-0 left-0 right-0 bottom-0 bg-[#d9d9d9] opacity-50 flex h-screen items-center justify-center z-50"
            onClick={() => setShowCategoryModal(false)}
          />

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
                    onClick={() => handleCategorySelect(category.name)}
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
