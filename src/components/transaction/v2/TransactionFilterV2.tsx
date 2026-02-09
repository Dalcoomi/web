import React from "react";
import Image from "next/image";

interface TransactionFilterV2Props {
  showCategoryFilter: boolean;
  onCategoryToggle: () => void;
  onSortToggle?: () => void;
  onAllToggle?: () => void;
  selectedSort?: string;
  selectedCategory?: string;
  selectedAll?: string;
  bgColor?: string;
}

export default function TransactionFilterV2({
  showCategoryFilter,
  onCategoryToggle,
  onSortToggle,
  onAllToggle,
  selectedSort = "최신순",
  selectedCategory = "카테고리",
  selectedAll = "전체",
  bgColor = "bg-white",
}: TransactionFilterV2Props) {
  return (
    <div
      className={`sticky top-[90px] z-20 ${bgColor} pt-5 pb-4 px-5 flex items-center justify-between`}
    >
      {/* 좌측: 최신순 */}
      <button
        onClick={onSortToggle}
        className="flex items-center gap-1 rounded-[100px] border border-gray-200 bg-white cursor-pointer pt-[6px] pb-[6px] pl-[14px] pr-[10px]"
      >
        <span className="text-body2-regular text-gray-900">{selectedSort}</span>
        <Image
          src="/images/transaction/v2/필터_드롭다운.svg"
          alt="드롭다운"
          width={16}
          height={16}
        />
      </button>

      {/* 우측: 카테고리, 전체 */}
      <div className="flex items-center gap-2">
        <button
          onClick={onCategoryToggle}
          className="flex items-center gap-1 rounded-[100px] border border-gray-200 bg-white cursor-pointer pt-[6px] pb-[6px] pl-[14px] pr-[10px]"
        >
          <span className="text-body2-regular text-gray-900">
            {selectedCategory}
          </span>
          <Image
            src="/images/transaction/v2/필터_드롭다운.svg"
            alt="드롭다운"
            width={16}
            height={16}
            className={`transform transition-transform duration-200 ${
              showCategoryFilter ? "rotate-180" : ""
            }`}
          />
        </button>

        <button
          onClick={onAllToggle}
          className="flex items-center gap-1 rounded-[100px] border border-gray-200 bg-white cursor-pointer pt-[6px] pb-[6px] pl-[14px] pr-[10px]"
        >
          <span className="text-body2-regular text-gray-900">
            {selectedAll}
          </span>
          <Image
            src="/images/transaction/v2/필터_드롭다운.svg"
            alt="드롭다운"
            width={16}
            height={16}
          />
        </button>
      </div>
    </div>
  );
}
