"use client";

import Image from "next/image";
import { useMemo, useState, useEffect } from "react";
import BottomModal from "@/components/ui/BottomModal";
import type {
  CreatorFilterOption,
  TransactionCategoriesByType,
  TransactionFilterState,
  TransactionTypeFilter,
} from "@/features/transaction/model/transactionFilter";

interface FilterBottomSheetProps {
  isMounted: boolean;
  isOpen: boolean;
  isGroup: boolean;
  categoriesByType: TransactionCategoriesByType;
  creators?: CreatorFilterOption[];
  draft: TransactionFilterState;
  onChangeDraft: (next: TransactionFilterState) => void;
  onReset: () => void;
  onApply: () => void;
  onClose: () => void;
}

export default function FilterBottomSheet({
  isMounted,
  isOpen,
  isGroup,
  categoriesByType,
  creators = [],
  draft,
  onChangeDraft,
  onReset,
  onApply,
  onClose,
}: FilterBottomSheetProps) {
  const [categorySearch, setCategorySearch] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setCategorySearch("");
    }
  }, [isOpen]);

  const filteredExpenseCategories = useMemo(() => {
    const keyword = categorySearch.trim();
    if (!keyword) return categoriesByType.EXPENSE;
    return categoriesByType.EXPENSE.filter((name) => name.includes(keyword));
  }, [categoriesByType.EXPENSE, categorySearch]);

  const filteredIncomeCategories = useMemo(() => {
    const keyword = categorySearch.trim();
    if (!keyword) return categoriesByType.INCOME;
    return categoriesByType.INCOME.filter((name) => name.includes(keyword));
  }, [categoriesByType.INCOME, categorySearch]);

  const visibleCategories = useMemo(() => {
    if (draft.type === "EXPENSE") return filteredExpenseCategories;
    if (draft.type === "INCOME") return filteredIncomeCategories;
    return Array.from(
      new Set([...filteredExpenseCategories, ...filteredIncomeCategories]),
    );
  }, [draft.type, filteredExpenseCategories, filteredIncomeCategories]);

  const isAllCreatorsSelected =
    creators.length > 0 &&
    creators.every((creator) => draft.creatorNicknames.includes(creator.nickname));

  const categoryScope = categoriesByType[draft.type];
  const isAllCategoriesSelected =
    categoryScope.length > 0 &&
    categoryScope.every((category) => draft.categoryNames.includes(category));

  const toggleType = (type: TransactionTypeFilter) => {
    onChangeDraft({
      ...draft,
      type,
    });
  };

  const toggleCreator = (nickname: string) => {
    const isSelected = draft.creatorNicknames.includes(nickname);
    onChangeDraft({
      ...draft,
      creatorNicknames: isSelected
        ? draft.creatorNicknames.filter((item) => item !== nickname)
        : [...draft.creatorNicknames, nickname],
    });
  };

  const toggleAllCreators = () => {
    onChangeDraft({
      ...draft,
      creatorNicknames: isAllCreatorsSelected
        ? []
        : creators.map((creator) => creator.nickname),
    });
  };

  const toggleCategory = (name: string) => {
    const isSelected = draft.categoryNames.includes(name);
    onChangeDraft({
      ...draft,
      categoryNames: isSelected
        ? draft.categoryNames.filter((item) => item !== name)
        : [...draft.categoryNames, name],
    });
  };

  const toggleAllCategories = () => {
    if (isAllCategoriesSelected) {
      onChangeDraft({
        ...draft,
        categoryNames: draft.categoryNames.filter(
          (name) => !categoryScope.includes(name),
        ),
      });
      return;
    }

    const merged = new Set([...draft.categoryNames, ...categoryScope]);
    onChangeDraft({
      ...draft,
      categoryNames: Array.from(merged),
    });
  };

  return (
    <BottomModal isMounted={isMounted} isOpen={isOpen} onClose={onClose}>
      <p className="px-4 text-subtitle text-gray-900 mb-4">필터</p>
      <div className="border-t border-gray-100" />

      <div className="max-h-[720px] flex flex-col">
        <div className="overflow-y-auto px-4 pt-4 pb-4 flex-1 min-h-0">
          <div className="flex items-center gap-2 mb-4">
            {[
              { key: "ALL", label: "전체" },
              { key: "EXPENSE", label: "지출만" },
              { key: "INCOME", label: "수입만" },
            ].map((type) => {
              const isSelected = draft.type === type.key;
              return (
                <button
                  key={type.key}
                  onClick={() => toggleType(type.key as TransactionTypeFilter)}
                  className={`h-8 px-4 rounded-[100px] border cursor-pointer ${
                    isSelected
                      ? "border-gray-900 bg-white text-gray-900 text-body2-semibold"
                      : "border-gray-100 bg-gray-50 text-gray-500 text-body2-regular"
                  }`}
                >
                  {type.label}
                </button>
              );
            })}
          </div>

          {isGroup && creators.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-3">
                <p className="text-body1-semibold text-gray-900">작성자</p>
                <button
                  onClick={toggleAllCreators}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <span
                    className={`w-[18px] h-[18px] rounded-[6px] flex items-center justify-center text-[12px] leading-none ${
                      isAllCreatorsSelected
                        ? "bg-gray-900 text-white"
                        : "border border-gray-200 text-transparent"
                    }`}
                  >
                    ✓
                  </span>
                  <span className="text-body2-regular text-gray-700">전체선택</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {creators.map((creator) => {
                  const isSelected = draft.creatorNicknames.includes(
                    creator.nickname,
                  );
                  return (
                    <button
                      key={creator.nickname}
                      onClick={() => toggleCreator(creator.nickname)}
                      className={`h-11 pl-1 pr-4 rounded-[100px] border flex items-center gap-2 cursor-pointer ${
                        isSelected
                          ? "border-gray-900 bg-white"
                          : "border-gray-300 bg-white"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center">
                        {creator.profileImageUrl ? (
                          <Image
                            src={creator.profileImageUrl}
                            alt={creator.nickname}
                            width={32}
                            height={32}
                            className="h-8 w-8 rounded-full object-cover"
                            unoptimized
                          />
                        ) : (
                          <span className="text-caption1 text-gray-500">
                            {creator.nickname.slice(0, 1)}
                          </span>
                        )}
                      </div>
                      <span className="text-body2-regular text-gray-900">
                        {creator.nickname}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          <div className="flex items-center justify-between mb-3">
            <p className="text-body1-semibold text-gray-900">카테고리</p>
            <button
              onClick={toggleAllCategories}
              className="flex items-center gap-2 cursor-pointer"
            >
              <span
                className={`w-[18px] h-[18px] rounded-[6px] flex items-center justify-center text-[12px] leading-none ${
                  isAllCategoriesSelected
                    ? "bg-gray-900 text-white"
                    : "border border-gray-200 text-transparent"
                }`}
              >
                ✓
              </span>
              <span className="text-body2-regular text-gray-700">전체선택</span>
            </button>
          </div>

          <div className="h-11 rounded-[12px] bg-gray-50 border border-gray-100 px-4 flex items-center gap-2 mb-4">
            <Image
              src="/images/transaction/v2/돋보기_회색.svg"
              alt="검색"
              width={20}
              height={20}
            />
            <input
              value={categorySearch}
              onChange={(e) => setCategorySearch(e.target.value)}
              placeholder="카테고리 검색"
              className="w-full bg-transparent outline-none text-body2-regular text-gray-900 placeholder:text-gray-300"
            />
          </div>

          {draft.type === "ALL" ? (
            <>
              <div className="flex flex-wrap gap-2">
                {filteredExpenseCategories.map((name) => {
                  const isSelected = draft.categoryNames.includes(name);
                  return (
                    <button
                      key={`expense-${name}`}
                      onClick={() => toggleCategory(name)}
                      className={`h-10 px-4 rounded-[100px] border cursor-pointer ${
                        isSelected
                          ? "border-gray-900 bg-white text-gray-900 text-body2-semibold"
                          : "border-gray-300 bg-white text-gray-800 text-body2-regular"
                      }`}
                    >
                      {name}
                    </button>
                  );
                })}
              </div>

              {filteredExpenseCategories.length > 0 &&
                filteredIncomeCategories.length > 0 && (
                  <div className="border-t border-gray-100 my-4" />
                )}

              <div className="flex flex-wrap gap-2">
                {filteredIncomeCategories.map((name) => {
                  const isSelected = draft.categoryNames.includes(name);
                  return (
                    <button
                      key={`income-${name}`}
                      onClick={() => toggleCategory(name)}
                      className={`h-10 px-4 rounded-[100px] border cursor-pointer ${
                        isSelected
                          ? "border-gray-900 bg-white text-gray-900 text-body2-semibold"
                          : "border-gray-300 bg-white text-gray-800 text-body2-regular"
                      }`}
                    >
                      {name}
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="flex flex-wrap gap-2">
              {visibleCategories.map((name) => {
                const isSelected = draft.categoryNames.includes(name);
                return (
                  <button
                    key={name}
                    onClick={() => toggleCategory(name)}
                    className={`h-10 px-4 rounded-[100px] border cursor-pointer ${
                      isSelected
                        ? "border-gray-900 bg-white text-gray-900 text-body2-semibold"
                        : "border-gray-300 bg-white text-gray-800 text-body2-regular"
                    }`}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 px-3 py-3 flex gap-2 bg-gray-30">
          <button
            onClick={onReset}
            className="flex-1 h-[52px] rounded-[12px] border border-gray-300 bg-white text-subtitle text-gray-900 cursor-pointer"
          >
            초기화
          </button>
          <button
            onClick={onApply}
            className="flex-[1.6] h-[52px] rounded-[12px] bg-gray-900 text-subtitle text-white cursor-pointer"
          >
            선택 완료
          </button>
        </div>
      </div>
    </BottomModal>
  );
}
