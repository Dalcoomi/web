"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import BottomModal from "@/components/ui/BottomModal";
import PageBackHeader from "@/components/ui/PageBackHeader";
import CategorySelectionModalContent from "@/components/transaction/common/CategorySelectionModalContent";
import { addTransaction } from "@/services/transactionService";
import { Category, getMyCategories } from "@/services/categoryService";
import { useToastStore } from "@/stores/useToastStore";

type TransactionType = "EXPENSE" | "INCOME";

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];
const CATEGORY_HELPER_TEXT = "미선택 시 '기타'로 분류돼요.";

const getTodayInSeoul = (): string => {
  const today = new Date();
  const seoulDate = new Date(
    today.toLocaleString("en-US", { timeZone: "Asia/Seoul" }),
  );

  const year = seoulDate.getFullYear();
  const month = String(seoulDate.getMonth() + 1).padStart(2, "0");
  const day = String(seoulDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDateForDisplay = (isoDate: string): string => {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const weekday = DAY_LABELS[date.getDay()];
  return `${year}. ${String(month).padStart(2, "0")}. ${String(day).padStart(2, "0")} (${weekday})`;
};

const buildTransactionDateTime = (isoDate: string): string => {
  const [year, month, day] = isoDate.split("-").map(Number);
  const now = new Date();
  const seoulNow = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Seoul" }),
  );
  const hours = String(seoulNow.getHours()).padStart(2, "0");
  const minutes = String(seoulNow.getMinutes()).padStart(2, "0");
  const seconds = String(seoulNow.getSeconds()).padStart(2, "0");
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${hours}:${minutes}:${seconds}`;
};

const findDefaultCategory = (
  categoryList: Category[],
  transactionType: TransactionType,
): Category | null => {
  if (categoryList.length === 0) {
    return null;
  }

  const defaultNames =
    transactionType === "EXPENSE"
      ? ["기타지출", "기타", "기타 소비"]
      : ["기타수입", "기타", "기타 수입"];

  return (
    categoryList.find((category) => defaultNames.includes(category.name)) ??
    categoryList[0]
  );
};

export default function AddWritingMyTransactionPageClient() {
  const router = useRouter();
  const addToast = useToastStore((state) => state.addToast);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transactionType, setTransactionType] =
    useState<TransactionType>("EXPENSE");
  const [amount, setAmount] = useState("");
  const [content, setContent] = useState("");
  const [date, setDate] = useState(getTodayInSeoul());
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isCategoryModalMounted, setIsCategoryModalMounted] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const categoryModalCloseTimerRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const dateInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (categoryModalCloseTimerRef.current) {
        clearTimeout(categoryModalCloseTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const loadCategories = async () => {
      setIsLoadingCategories(true);
      try {
        const categoryList = await getMyCategories(transactionType);
        setCategories(categoryList);
        setCategoryId((prev) => {
          if (prev && categoryList.some((category) => category.id === prev)) {
            return prev;
          }
          const defaultCategory = findDefaultCategory(
            categoryList,
            transactionType,
          );
          return defaultCategory?.id ?? null;
        });
      } catch (error) {
        addToast("error", String(error));
        setCategories([]);
        setCategoryId(null);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    void loadCategories();
  }, [transactionType, addToast]);

  const isFormValid = useMemo(() => Number(amount) > 0, [amount]);
  const selectedCategory =
    categories.find((category) => category.id === categoryId) ?? null;
  const fallbackCategoryName =
    transactionType === "EXPENSE" ? "기타지출" : "기타수입";
  const selectedCategoryName = selectedCategory?.name ?? fallbackCategoryName;
  const formattedAmount = amount ? Number(amount).toLocaleString("ko-KR") : "";

  const openCategoryModal = () => {
    if (categoryModalCloseTimerRef.current) {
      clearTimeout(categoryModalCloseTimerRef.current);
      categoryModalCloseTimerRef.current = null;
    }
    setIsCategoryModalMounted(true);
    requestAnimationFrame(() => setShowCategoryModal(true));
  };

  const closeCategoryModal = () => {
    setShowCategoryModal(false);
    if (categoryModalCloseTimerRef.current) {
      clearTimeout(categoryModalCloseTimerRef.current);
    }
    categoryModalCloseTimerRef.current = setTimeout(() => {
      setIsCategoryModalMounted(false);
    }, 200);
  };

  const handleCategoryChange = (selectedCategoryId: number) => {
    setCategoryId(selectedCategoryId);
    closeCategoryModal();
  };

  const handleAddCategory = () => {
    addToast("info", "카테고리 추가 기능은 준비 중이에요.");
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numericValue = e.target.value.replace(/[^\d]/g, "");
    setAmount(numericValue);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    if (next.length <= 50) {
      setContent(next);
    }
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/transaction/my");
  };

  const handleDateFieldClick = () => {
    const dateInput = dateInputRef.current;
    if (!dateInput) {
      return;
    }

    if (typeof dateInput.showPicker === "function") {
      try {
        dateInput.showPicker();
        return;
      } catch {
        // showPicker 미지원 환경에서는 기본 click/focus로 대체한다.
      }
    }

    dateInput.focus();
    dateInput.click();
  };

  const handleSubmit = async () => {
    if (isSubmitting || !isFormValid || !date) {
      return;
    }

    const resolvedCategoryId =
      categoryId ??
      findDefaultCategory(categories, transactionType)?.id ??
      null;

    if (!resolvedCategoryId) {
      addToast(
        "error",
        "카테고리를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const transactionDate = buildTransactionDateTime(date);
      await addTransaction({
        categoryId: resolvedCategoryId,
        teamId: null,
        amount: Number(amount),
        content: content.trim() || null,
        transactionDate,
        transactionType,
      });

      const [year, month, day] = date.split("-").map(Number);
      sessionStorage.setItem(
        "my-transaction-date",
        new Date(year, month - 1, day).toISOString(),
      );
      sessionStorage.setItem("my-transaction-scroll", "0");
      router.push("/transaction/my");
    } catch (error) {
      addToast("error", String(error));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative h-full bg-white flex flex-col">
      <PageBackHeader title="개인 거래 내역 작성" onBack={handleBack} />

      <main className="flex-1 px-5 pb-4 flex flex-col">
        <div className="grid grid-cols-2 gap-2 mb-8">
          <button
            type="button"
            onClick={() => setTransactionType("EXPENSE")}
            className={`h-12 rounded-[12px] border-[1.2px] flex items-center justify-center gap-[6px] cursor-pointer ${
              transactionType === "EXPENSE"
                ? "border-gray-800 bg-white text-gray-900"
                : "border-gray-100 bg-white text-gray-800"
            }`}
          >
            <Image
              src={
                transactionType === "EXPENSE"
                  ? "/images/transaction/v2/지출_활성.svg"
                  : "/images/transaction/v2/지출_비활성.svg"
              }
              alt=""
              width={24}
              height={24}
            />
            <span className="text-label">지출</span>
          </button>
          <button
            type="button"
            onClick={() => setTransactionType("INCOME")}
            className={`h-12 rounded-[12px] border-[1.2px] flex items-center justify-center gap-[6px] cursor-pointer ${
              transactionType === "INCOME"
                ? "border-gray-800 bg-white text-gray-900"
                : "border-gray-100 bg-white text-gray-800"
            }`}
          >
            <Image
              src={
                transactionType === "INCOME"
                  ? "/images/transaction/v2/수입_활성.svg"
                  : "/images/transaction/v2/수입_비활성.svg"
              }
              alt=""
              width={24}
              height={24}
            />
            <span className="text-label">수입</span>
          </button>
        </div>

        <section className="mb-8">
          <label className="mb-2 flex items-start gap-1 h-[21px]">
            <span className="text-body2-semibold text-gray-600 leading-[21px]">
              금액
            </span>
            <div className="w-1 h-1 rounded-full bg-red-500 mt-1" />
          </label>
          <div className="h-[44px] rounded-[12px] border border-gray-100 bg-white px-4 flex items-center gap-3">
            <input
              type="text"
              value={formattedAmount}
              onChange={handleAmountChange}
              placeholder="0"
              inputMode="numeric"
              autoComplete="off"
              enterKeyHint="done"
              className="w-full bg-transparent outline-none text-body1-regular text-gray-900 placeholder:text-gray-300"
            />
            <span className="text-body1-regular text-gray-900">원</span>
          </div>
        </section>

        <section className="mb-8">
          <label className="mb-2 flex items-start gap-1 h-[21px]">
            <span className="text-body2-semibold text-gray-600 leading-[21px]">
              내용
            </span>
          </label>
          <input
            type="text"
            value={content}
            onChange={handleContentChange}
            placeholder="ex. 간식 구매"
            maxLength={50}
            autoComplete="off"
            enterKeyHint="done"
            className="h-[44px] w-full rounded-[12px] border border-gray-100 bg-white px-4 outline-none text-body1-regular text-gray-900 placeholder:text-gray-300"
          />
        </section>

        <section className="mb-8">
          <label className="mb-2 flex items-start gap-1 h-[21px]">
            <span className="text-body2-semibold text-gray-600 leading-[21px]">
              날짜
            </span>
          </label>
          <div className="relative h-[44px] rounded-[12px] border border-gray-100 bg-white px-4 flex items-center">
            <button
              type="button"
              onClick={handleDateFieldClick}
              className="absolute inset-0 z-10 rounded-[12px] cursor-pointer bg-transparent"
              aria-label="거래 날짜 선택"
            />
            <span className="pointer-events-none whitespace-nowrap text-body1-regular text-gray-900">
              {formatDateForDisplay(date)}
            </span>
            <input
              ref={dateInputRef}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="absolute inset-0 h-full w-full opacity-0 pointer-events-none"
              tabIndex={-1}
              aria-label="거래 날짜 선택"
            />
          </div>
        </section>

        <section className="mb-8">
          <div className="flex items-start justify-between gap-3">
            <div>
              <label className="flex items-start gap-1 h-[21px]">
                <span className="text-body2-semibold text-gray-600 leading-[21px]">
                  카테고리
                </span>
              </label>
              <p className="mt-1 text-caption1-medium text-gray-400">
                {CATEGORY_HELPER_TEXT}
              </p>
            </div>
            <button
              type="button"
              onClick={openCategoryModal}
              disabled={isLoadingCategories}
              className="h-[44px] px-4 rounded-full border border-gray-100 bg-white flex items-center gap-0 cursor-pointer disabled:cursor-not-allowed"
            >
              <span className="text-label text-gray-800">
                {isLoadingCategories ? "불러오는 중.." : selectedCategoryName}
              </span>
              <Image
                src="/images/transaction/v2/오른쪽_기본_화살표_회색.svg"
                alt=""
                width={24}
                height={24}
              />
            </button>
          </div>
        </section>

        <div className="mt-auto pt-6 pb-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isFormValid || isSubmitting}
            className={`w-full h-[52px] rounded-[12px] text-subtitle ${
              isFormValid && !isSubmitting
                ? "bg-gray-900 text-white cursor-pointer"
                : "bg-gray-200 text-white cursor-not-allowed"
            }`}
          >
            {isSubmitting ? "작성 중.." : "작성 완료"}
          </button>
        </div>
      </main>

      <BottomModal
        isMounted={isCategoryModalMounted}
        isOpen={showCategoryModal}
        onClose={closeCategoryModal}
        sheetClassName="bg-white rounded-t-[20px] rounded-b-none pt-3 pb-0"
      >
        <CategorySelectionModalContent
          categories={categories}
          selectedCategoryId={categoryId}
          isLoading={isLoadingCategories}
          onSelect={handleCategoryChange}
          onAddCategory={handleAddCategory}
        />
      </BottomModal>
    </div>
  );
}


