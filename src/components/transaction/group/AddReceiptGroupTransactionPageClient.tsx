// components/transaction/group/AddReceiptGroupTransactionPageClient.tsx
"use client";

import { useState, useEffect, useRef } from "react";
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
import { formatDateToDisplay, parseDisplayDate } from "@/utils/dateUtils";
import { useToastStore } from "@/stores/useToastStore";

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
  const addToast = useToastStore((state) => state.addToast);

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

  // 🔥 중복 로딩 방지를 위한 ref
  const hasLoadedRef = useRef(false);

  // 초기 그룹 정보, 카테고리 로드
  useEffect(() => {
    if (!teamId) {
      router.replace("/group");
      return;
    }

    // 이미 로드했으면 리턴
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    const timeoutId = setTimeout(() => {
      const fetchGroupInfo = async () => {
        try {
          const response = await getGroupInfo(teamId);
          setGroupInfo(response);
        } catch (error) {
          addToast("error", String(error) || "그룹 정보를 불러올 수 없습니다.");
          router.replace("/group");
          hasLoadedRef.current = false;
        }
      };

      const loadCategories = async () => {
        setIsLoadingCategories(true);

        try {
          const categoryList = await getTeamCategories(
            parseInt(teamId),
            "EXPENSE"
          );
          setCategories(categoryList);
        } catch (error) {
          addToast("error", String(error));
          setCategories([]);
          hasLoadedRef.current = false;
        } finally {
          setIsLoadingCategories(false);
        }
      };

      fetchGroupInfo();
      loadCategories();
    }, 100);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [teamId, router]); // teamId와 router를 의존성에 포함

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
      addToast("error", "이미지 파일만 업로드 가능합니다.");
      return;
    }

    // 파일 크기 검증 (10MB 제한)
    if (file.size > 10 * 1024 * 1024) {
      addToast("error", "파일 크기는 10MB 이하여야 합니다.");
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
          transactionDate: formatDateToDisplay(item.transactionDate), // YY/MM/DD 형식으로 변환
          categoryName: item.categoryName,
          content: item.content,
          amount: item.amount.toLocaleString("ko-KR"),
        })
      );

      setReceiptItems(convertedItems);
      setHasUploadedReceipt(true);
    } catch (error) {
      addToast(
        "error",
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
          // 내용 필드인 경우 최대 50자 제한
          if (field === "content") {
            if (value.length <= 50) {
              return { ...item, [field]: value };
            }
            return item; // 50자 초과 시 변경하지 않음
          }
          // 날짜 필드인 경우 자동 슬래시 입력
          if (field === "transactionDate") {
            // 숫자만 추출
            const cleaned = value.replace(/[^\d]/g, "");
            let formatted = "";

            if (cleaned.length > 0) {
              // 연도 (YY)
              formatted = cleaned.substring(0, Math.min(2, cleaned.length));

              // 월 (MM)
              if (cleaned.length > 2) {
                formatted +=
                  "/" + cleaned.substring(2, Math.min(4, cleaned.length));
              }

              // 일 (DD)
              if (cleaned.length > 4) {
                formatted +=
                  "/" + cleaned.substring(4, Math.min(6, cleaned.length));
              }
            }

            return { ...item, [field]: formatted };
          }
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  // 항목 삭제 핸들러
  const handleDeleteItem = (id: number) => {
    setReceiptItems((prev) => prev.filter((item) => item.id !== id));
  };

  // 항목 추가 핸들러
  const handleAddItem = () => {
    const newId =
      receiptItems.length > 0
        ? Math.max(...receiptItems.map((item) => item.id)) + 1
        : 1;

    const newItem: ReceiptItem = {
      id: newId,
      transactionDate: "",
      categoryName: "",
      content: "",
      amount: "",
    };

    setReceiptItems((prev) => [...prev, newItem]);
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

  // 날짜 유효성 검증 함수
  const validateDate = (dateStr: string): boolean => {
    if (!dateStr.trim()) {
      return false;
    }

    // YY/MM/DD 형식 확인
    const dateRegex = /^\d{2}\/\d{2}\/\d{2}$/;
    if (!dateRegex.test(dateStr)) {
      return false;
    }

    // 날짜 분해
    const [yy, mm, dd] = dateStr.split("/").map(Number);

    // 2000년대로 가정 (YY -> YYYY)
    const currentCentury = Math.floor(new Date().getFullYear() / 100) * 100;
    const year = currentCentury + yy;
    const month = mm;
    const day = dd;

    // Date 객체로 변환하여 유효성 검증
    const date = new Date(year, month - 1, day);

    // 유효한 날짜인지 확인 (입력한 값과 Date 객체의 값이 같은지 확인)
    if (
      date.getFullYear() !== year ||
      date.getMonth() + 1 !== month ||
      date.getDate() !== day
    ) {
      return false;
    }

    return true;
  };

  // 저장 핸들러 - 벌크 API 사용
  const handleSubmit = async () => {
    if (isSubmitting) return;

    // 금액이 입력되지 않은 항목 체크
    const emptyAmountItems = receiptItems.filter((item) => !item.amount.trim());

    if (emptyAmountItems.length > 0) {
      addToast("error", "모든 항목의 금액을 입력해주세요. 금액은 필수입니다.");
      return;
    }

    // 날짜 유효성 검증
    const invalidDateItems = receiptItems.filter(
      (item) => item.transactionDate && !validateDate(item.transactionDate)
    );

    if (invalidDateItems.length > 0) {
      addToast(
        "error",
        "유효하지 않은 날짜가 있습니다. 날짜를 확인해주세요. (YY/MM/DD 형식)"
      );
      return;
    }

    // 입력된 항목들만 필터링
    const validItems = receiptItems.filter((item) => item.amount.trim());

    if (validItems.length === 0) {
      addToast("error", "최소 하나의 항목을 입력해주세요.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 거래 데이터 구성
      const transactions: TransactionRequest[] = validItems.map((item) => {
        // 카테고리 찾기 (없으면 기본 카테고리 사용)
        const category = categories.find(
          (cat) => cat.name === item.categoryName
        );
        const categoryId = category?.id || categories[0]?.id;

        if (!categoryId) {
          throw new Error("카테고리를 찾을 수 없습니다.");
        }

        // 날짜 처리 - YY/MM/DD 형식을 YYYY-MM-DD로 변환 후 Date 객체 생성
        let transactionDateTime: Date;

        if (item.transactionDate) {
          // YY/MM/DD 형식을 YYYY-MM-DD로 변환
          const isoDate = parseDisplayDate(item.transactionDate);
          transactionDateTime = new Date(isoDate);

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
          synchronizeTransaction: false,
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
      addToast("error", String(error) || "영수증 등록 중 오류가 발생했습니다.");
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
      <div className="flex-1 flex flex-col min-h-0 relative">
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
              <Image
                src="/images/transaction/영수증_AI_등록.svg"
                alt="영수증"
                width={30}
                height={30}
                className="-ml-1 mr-3"
              />
              <span>영수증 사진 업로드하기</span>
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
              <div className="grid grid-cols-13 text-sm text-black">
                <div className="col-span-1 text-left">No.</div>
                <div className="col-span-3 text-center mr-3">날짜</div>
                <div className="col-span-2 text-left">카테고리</div>
                <div className="col-span-3 text-center mr-4">내용</div>
                <div className="col-span-3 text-center ml-4">
                  금액<span className="text-red-500">*</span>
                </div>
                <div className="col-span-1"></div>
              </div>
            </div>

            {/* 스크롤 가능한 테이블 영역 - flex-1으로 남은 공간 차지 */}
            <div className="flex-1 overflow-y-auto px-3 min-h-0">
              {receiptItems.map((item, index) => (
                <div
                  key={item.id}
                  className="grid grid-cols-13 gap-2 py-0.5 items-center"
                >
                  {/* 인덱스 번호 */}
                  <div className="col-span-1 text-center">
                    <span className="text-sm text-gray-600">{index + 1}</span>
                  </div>

                  {/* 날짜 */}
                  <div className="col-span-3">
                    <input
                      type="text"
                      className="w-full text-xs border border-gray-200 rounded focus:border-[#11ABFF] outline-none"
                      value={item.transactionDate}
                      onChange={(e) =>
                        handleItemChange(
                          item.id,
                          "transactionDate",
                          e.target.value
                        )
                      }
                      placeholder="01/01/01"
                      maxLength={8}
                      inputMode="numeric"
                    />
                  </div>

                  {/* 카테고리 */}
                  <div className="col-span-2">
                    <button
                      type="button"
                      className="w-full py-1 text-xs border border-gray-200 rounded text-center focus:border-[#11ABFF] outline-none hover:bg-gray-50 cursor-pointer"
                      onClick={() => openCategoryModal(item.id)}
                    >
                      {item.categoryName || "선택"}
                    </button>
                  </div>

                  {/* 내용 */}
                  <div className="col-span-3">
                    <input
                      type="text"
                      className="w-full text-sm border border-gray-200 rounded focus:border-[#11ABFF] outline-none"
                      value={item.content}
                      onChange={(e) =>
                        handleItemChange(item.id, "content", e.target.value)
                      }
                      placeholder="최대 50자"
                      inputMode="text"
                      autoComplete="off"
                      enterKeyHint="done"
                      maxLength={50}
                    />
                  </div>

                  {/* 금액 */}
                  <div className="col-span-3">
                    <input
                      type="text"
                      className="w-full text-sm border border-gray-200 rounded focus:border-[#11ABFF] outline-none text-right"
                      value={item.amount}
                      onChange={(e) =>
                        handleItemChange(item.id, "amount", e.target.value)
                      }
                      placeholder="금액 필수"
                      inputMode="numeric"
                      autoComplete="off"
                      enterKeyHint="done"
                    />
                  </div>

                  {/* 삭제 버튼 */}
                  <div className="col-span-1 flex justify-center">
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="text-red-500 hover:text-red-600 text-lg cursor-pointer"
                      type="button"
                    >
                      —
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* 항목 추가 버튼 */}
            <div className="px-3 py-2 flex-shrink-0 flex justify-center">
              <button
                onClick={handleAddItem}
                className="w-[120px] py-2 border-2 border-[#11ABFF] text-[#11ABFF] rounded-lg text-sm hover:bg-blue-50 transition-colors cursor-pointer"
                type="button"
              >
                + 거래 내역 추가
              </button>
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
              <p className="text-sm">AI가 자동으로 내역을 분석해 드려요</p>
            </div>
          </div>
        )}

        {/* 업로드 중 오버레이 */}
        {isUploading && (
          <>
            {/* 반투명 오버레이 */}
            <div className="absolute top-0 left-0 right-0 bottom-0 bg-[#d9d9d9] opacity-50 flex items-center justify-center z-50" />

            {/* 로딩 모달 */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-8 flex flex-col items-center z-50">
              <svg
                className="animate-spin h-12 w-12 text-[#11ABFF] mb-4"
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
              <p className="text-lg font-medium text-gray-800">
                영수증 분석 중...
              </p>
              <p className="text-sm text-gray-500 mt-2">잠시만 기다려주세요</p>
            </div>
          </>
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
