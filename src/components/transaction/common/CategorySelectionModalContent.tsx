"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

interface CategoryOption {
  id: number;
  name: string;
}

interface CategorySelectionModalContentProps {
  categories: CategoryOption[];
  selectedCategoryId: number | null;
  isLoading: boolean;
  onSelect: (categoryId: number) => void;
  onAddCategory?: () => void;
}

const TEXT = {
  title: "카테고리",
  searchAlt: "검색",
  searchPlaceholder: "카테고리 검색",
  loading: "카테고리 불러오는 중...",
  empty: "검색 결과가 없어요.",
  add: "추가",
} as const;

const SEARCH_ICON_SRC = "/images/transaction/v2/돋보기_회색.svg";

export default function CategorySelectionModalContent({
  categories,
  selectedCategoryId,
  isLoading,
  onSelect,
  onAddCategory,
}: CategorySelectionModalContentProps) {
  const [searchKeyword, setSearchKeyword] = useState("");

  const filteredCategories = useMemo(() => {
    const normalizedKeyword = searchKeyword.trim().toLowerCase();
    if (!normalizedKeyword) {
      return categories;
    }

    return categories.filter((category) =>
      category.name.toLowerCase().includes(normalizedKeyword),
    );
  }, [categories, searchKeyword]);

  return (
    <div className="max-h-[72vh] flex flex-col">
      <div className="overflow-y-auto scrollbar-hide px-5 pb-5">
        <p className="mb-4 text-subtitle text-gray-900">{TEXT.title}</p>

        <div className="mb-5 flex h-14 items-center gap-2 rounded-[14px] border border-gray-100 bg-gray-50 px-4">
          <Image src={SEARCH_ICON_SRC} alt={TEXT.searchAlt} width={20} height={20} />
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder={TEXT.searchPlaceholder}
            autoComplete="off"
            enterKeyHint="search"
            className="w-full bg-transparent text-body2-regular text-gray-900 outline-none placeholder:text-gray-300"
          />
        </div>

        {isLoading ? (
          <p className="py-12 text-center text-body2-regular text-gray-500">
            {TEXT.loading}
          </p>
        ) : (
          <>
            {filteredCategories.length === 0 ? (
              <p className="py-12 text-center text-body2-regular text-gray-500">
                {TEXT.empty}
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {filteredCategories.map((category) => {
                  const isSelected = category.id === selectedCategoryId;
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => onSelect(category.id)}
                      className={`h-12 rounded-[100px] border px-5 cursor-pointer ${
                        isSelected
                          ? "border-gray-900 bg-white text-body2-semibold text-gray-900"
                          : "border-gray-100 bg-white text-body2-regular text-gray-700"
                      }`}
                    >
                      {category.name}
                    </button>
                  );
                })}
              </div>
            )}

            <button
              type="button"
              onClick={() => onAddCategory?.()}
              className="mt-3 flex h-12 items-center gap-2 rounded-[100px] border border-dashed border-gray-200 bg-white px-5 text-gray-500 cursor-pointer"
            >
              <span className="text-[22px] leading-none">+</span>
              <span className="text-body2-regular">{TEXT.add}</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
