"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import BottomModal from "@/components/ui/BottomModal";
import PageBackHeader from "@/components/ui/PageBackHeader";
import CategorySelectionModalContent from "@/components/transaction/common/CategorySelectionModalContent";
import { addTransaction } from "@/services/transactionService";
import { Category, getTeamCategories } from "@/services/categoryService";
import { Group, getGroups } from "@/services/groupService";
import { useToastStore } from "@/stores/useToastStore";
import { BRAND_COLORS } from "@/constants/brandColors";

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

const isHexColor = (value: string): boolean =>
  /^#(?:[0-9a-fA-F]{3}){1,2}$/.test(value);

const getLabelColor = (label?: string): string => {
  if (!label) {
    return BRAND_COLORS.gray;
  }

  if (label in BRAND_COLORS) {
    return BRAND_COLORS[label as keyof typeof BRAND_COLORS];
  }

  if (isHexColor(label)) {
    return label;
  }

  return BRAND_COLORS.gray;
};

export default function AddWritingGroupTransactionPageClient() {
  const router = useRouter();
  const params = useParams<{ teamId: string }>();
  const routeTeamId = Array.isArray(params.teamId)
    ? params.teamId[0]
    : params.teamId;
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
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [isGroupModalMounted, setIsGroupModalMounted] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);

  const categoryModalCloseTimerRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const groupModalCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const dateInputRef = useRef<HTMLInputElement | null>(null);

  const isValidRouteTeamId = useMemo(
    () => !!routeTeamId && /^\d+$/.test(routeTeamId),
    [routeTeamId],
  );
  const selectedGroup = useMemo(
    () => groups.find((group) => String(group.teamId) === String(routeTeamId)),
    [groups, routeTeamId],
  );

  useEffect(() => {
    return () => {
      if (categoryModalCloseTimerRef.current) {
        clearTimeout(categoryModalCloseTimerRef.current);
      }
      if (groupModalCloseTimerRef.current) {
        clearTimeout(groupModalCloseTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isValidRouteTeamId) {
      router.replace("/transaction/group");
      return;
    }

    let isCancelled = false;

    const loadGroups = async () => {
      setIsLoadingGroups(true);
      try {
        const response = await getGroups();
        if (isCancelled) {
          return;
        }

        const groupList = response.groups ?? [];
        setGroups(groupList);

        if (groupList.length === 0) {
          addToast("error", "참여 중인 그룹이 없어요.");
          router.replace("/transaction/group");
          return;
        }

        const isMemberOfCurrentTeam = groupList.some(
          (group) => String(group.teamId) === String(routeTeamId),
        );

        if (!isMemberOfCurrentTeam) {
          router.replace(
            `/transaction/group/${groupList[0].teamId}/add/writing`,
          );
        }
      } catch (error) {
        if (!isCancelled) {
          addToast("error", String(error));
          router.replace("/transaction/group");
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingGroups(false);
        }
      }
    };

    void loadGroups();

    return () => {
      isCancelled = true;
    };
  }, [addToast, isValidRouteTeamId, routeTeamId, router]);

  useEffect(() => {
    if (!isValidRouteTeamId || !routeTeamId) {
      return;
    }

    const loadCategories = async () => {
      setIsLoadingCategories(true);
      try {
        const categoryList = await getTeamCategories(
          Number(routeTeamId),
          transactionType,
        );
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
  }, [addToast, isValidRouteTeamId, routeTeamId, transactionType]);

  const isFormValid = useMemo(() => Number(amount) > 0, [amount]);
  const selectedCategory =
    categories.find((category) => category.id === categoryId) ?? null;
  const selectedCategoryName =
    selectedCategory?.name ?? categories[0]?.name ?? "카테고리";
  const formattedAmount = amount ? Number(amount).toLocaleString("ko-KR") : "";
  const selectedGroupName = selectedGroup?.title ?? "그룹 선택";
  const selectedGroupColor = getLabelColor(selectedGroup?.label);

  const openGroupModal = () => {
    if (isLoadingGroups || groups.length === 0) {
      return;
    }
    if (groupModalCloseTimerRef.current) {
      clearTimeout(groupModalCloseTimerRef.current);
      groupModalCloseTimerRef.current = null;
    }
    setIsGroupModalMounted(true);
    requestAnimationFrame(() => setShowGroupModal(true));
  };

  const closeGroupModal = () => {
    setShowGroupModal(false);
    if (groupModalCloseTimerRef.current) {
      clearTimeout(groupModalCloseTimerRef.current);
    }
    groupModalCloseTimerRef.current = setTimeout(() => {
      setIsGroupModalMounted(false);
    }, 200);
  };

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

  const handleGroupSelect = (selectedTeamId: string) => {
    closeGroupModal();
    if (String(selectedTeamId) === String(routeTeamId)) {
      return;
    }
    router.push(`/transaction/group/${selectedTeamId}/add/writing`);
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

    if (routeTeamId && /^\d+$/.test(routeTeamId)) {
      router.push(`/transaction/group/${routeTeamId}`);
      return;
    }

    router.push("/transaction/group");
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
    if (
      isSubmitting ||
      !isFormValid ||
      !date ||
      !routeTeamId ||
      !isValidRouteTeamId
    ) {
      return;
    }

    const resolvedCategoryId =
      categoryId ??
      findDefaultCategory(categories, transactionType)?.id ??
      categories[0]?.id ??
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
        teamId: Number(routeTeamId),
        amount: Number(amount),
        content: content.trim() || null,
        transactionDate,
        transactionType,
      });

      const [year, month, day] = date.split("-").map(Number);
      sessionStorage.setItem(
        `group-transaction-date-${routeTeamId}`,
        new Date(year, month - 1, day).toISOString(),
      );
      sessionStorage.setItem(`group-transaction-scroll-${routeTeamId}`, "0");
      router.push(`/transaction/group/${routeTeamId}`);
    } catch (error) {
      addToast("error", String(error));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative h-full bg-white flex flex-col">
      <PageBackHeader title="그룹 거래 내역 작성" onBack={handleBack} />

      <main className="flex-1 px-5 pb-4 flex flex-col">
        <section className="mb-8">
          <button
            type="button"
            onClick={openGroupModal}
            disabled={isLoadingGroups || groups.length === 0}
            className="w-full h-[52px] rounded-[14px] border border-gray-100 bg-gray-30 pl-5 pr-4 flex items-center justify-between gap-3 cursor-pointer disabled:cursor-not-allowed"
          >
            <span className="flex items-center gap-3 min-w-0">
              <span
                className="w-[10px] h-[10px] rounded-full flex-shrink-0"
                style={{ backgroundColor: selectedGroupColor }}
              />
              <span className="text-body1-semibold text-gray-900 truncate">
                {isLoadingGroups ? "그룹 불러오는 중.." : selectedGroupName}
              </span>
            </span>
            <Image
              src="/images/transaction/v2/오른쪽_기본_화살표_회색.svg"
              alt=""
              width={24}
              height={24}
            />
          </button>
        </section>

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

        <section className="">
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

        {!showGroupModal && !showCategoryModal && (
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
        )}
      </main>

      <BottomModal
        isMounted={isGroupModalMounted}
        isOpen={showGroupModal}
        onClose={closeGroupModal}
        sheetClassName="bg-white rounded-t-[20px] rounded-b-none pt-3"
      >
        <p className="px-5 text-subtitle text-gray-900">
          어떤 그룹의 거래 내역을 작성할까요?
        </p>
        <div className="max-h-[58vh] overflow-y-auto py-5">
          {groups.length === 0 ? (
            <p className="px-5 py-10 text-body2-regular text-gray-500 text-center">
              선택 가능한 그룹이 없어요.
            </p>
          ) : (
            groups.map((group) => {
              const isSelected =
                String(group.teamId) === String(routeTeamId ?? "");

              return (
                <button
                  key={group.teamId}
                  type="button"
                  onClick={() => handleGroupSelect(group.teamId)}
                  className="w-full px-5 py-3 flex items-center justify-between cursor-pointer bg-white"
                >
                  <span className="flex items-center gap-4 min-w-0">
                    <span
                      className="w-[10px] h-[10px] rounded-full flex-shrink-0"
                      style={{ backgroundColor: getLabelColor(group.label) }}
                    />
                    <span className="text-body1-regular text-gray-900 truncate">
                      {group.title}
                    </span>
                  </span>
                  {isSelected && (
                    <Image
                      src="/images/transaction/v2/체크_블랙.svg"
                      alt="선택됨"
                      width={24}
                      height={24}
                    />
                  )}
                </button>
              );
            })
          )}
        </div>
      </BottomModal>

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


