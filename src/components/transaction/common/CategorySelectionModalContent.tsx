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
  title: "\uCE74\uD14C\uACE0\uB9AC",
  searchAlt: "\uAC80\uC0C9",
  searchPlaceholder: "\uCE74\uD14C\uACE0\uB9AC \uAC80\uC0C9",
  loading: "\uCE74\uD14C\uACE0\uB9AC \uBD88\uB7EC\uC624\uB294 \uC911...",
  empty: "\uAC80\uC0C9 \uACB0\uACFC\uAC00 \uC5C6\uC5B4\uC694.",
  add: "\uCD94\uAC00",
} as const;

const SEARCH_ICON_SRC =
  "/images/transaction/v2/\uB3CB\uBCF4\uAE30_\uD68C\uC0C9.svg";

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
