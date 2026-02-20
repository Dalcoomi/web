import React from "react";
import Image from "next/image";

interface TransactionFilterProps {
  onSortToggle?: () => void;
  onAllToggle?: () => void;
  selectedSort?: string;
  selectedAll?: string;
  bgColor?: string;
  stickyTopClass?: string;
}

export default function TransactionFilter({
  onSortToggle,
  onAllToggle,
  selectedSort = "최신순",
  selectedAll = "필터",
  bgColor = "bg-white",
  stickyTopClass = "top-[102px]",
}: TransactionFilterProps) {
  return (
    <div
      className={`sticky ${stickyTopClass} z-20 ${bgColor} pt-5 pb-4 px-5 flex items-center justify-between`}
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

      {/* 우측: 필터 */}
      <div className="flex items-center">
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

