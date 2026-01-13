"use client";

import Image from "next/image";

export type ViewMode = "personal" | "group";

interface TransactionTypeToggleV2Props {
  viewMode: ViewMode;
  onToggle: (mode: ViewMode) => void;
  className?: string;
}

export default function TransactionTypeToggleV2({
  viewMode,
  onToggle,
  className = "",
}: TransactionTypeToggleV2Props) {
  return (
    <div
      className={`bg-white/80 backdrop-blur-md rounded-full flex items-center shadow-lg p-1 pointer-events-auto z-30 relative ${className}`}
    >
      {/* 이동하는 검은색 배경 */}
      <div
        className={`absolute top-1 bottom-1 rounded-full bg-black transition-all duration-300 ease-in-out ${
          viewMode === "personal"
            ? "left-1 w-[78px]"
            : "left-[86px] w-[78px]"
        }`}
      />

      <button
        onClick={() => onToggle("personal")}
        className={`px-2 pr-4 py-2 rounded-full transition-colors flex items-center gap-1.5 cursor-pointer relative z-10 ${
          viewMode === "personal" ? "text-white" : "text-[#534E4E]"
        }`}
      >
        <Image
          src={
            viewMode === "personal"
              ? "/images/transaction/v2/내비_개인_선택_아이콘.svg"
              : "/images/transaction/v2/내비_개인_선택X_아이콘.svg"
          }
          alt="개인"
          width={24}
          height={24}
        />
        <span className="text-body1-semibold">개인</span>
      </button>
      <button
        onClick={() => onToggle("group")}
        className={`px-3 py-2 rounded-full transition-colors flex items-center gap-1.5 cursor-pointer relative z-10 ${
          viewMode === "group" ? "text-white" : "text-[#534E4E]"
        }`}
      >
        <Image
          src={
            viewMode === "group"
              ? "/images/transaction/v2/내비_그룹_선택_아이콘.svg"
              : "/images/transaction/v2/내비_그룹_선택X_아이콘.svg"
          }
          alt="그룹"
          width={24}
          height={24}
        />
        <span className="text-body1-semibold">그룹</span>
      </button>
    </div>
  );
}