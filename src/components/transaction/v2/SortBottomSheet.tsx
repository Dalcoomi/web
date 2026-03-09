"use client";

import Image from "next/image";
import BottomModal from "@/components/ui/BottomModal";

export type SortOption =
  | "최신순"
  | "오래된 순"
  | "높은 금액 순"
  | "낮은 금액 순";

interface SortBottomSheetProps {
  isMounted: boolean;
  isOpen: boolean;
  selectedSort: SortOption;
  onClose: () => void;
  onSelect: (sort: SortOption) => void;
}

const SORT_OPTIONS: SortOption[] = [
  "최신순",
  "오래된 순",
  "높은 금액 순",
  "낮은 금액 순",
];

export default function SortBottomSheet({
  isMounted,
  isOpen,
  selectedSort,
  onClose,
  onSelect,
}: SortBottomSheetProps) {
  return (
    <BottomModal isMounted={isMounted} isOpen={isOpen} onClose={onClose}>
      <p className="px-5 text-subtitle text-gray-900 mb-4">정렬</p>

      <div className="border-t border-gray-100" />

      <div className="pt-6 pb-7 flex flex-col gap-5">
        {SORT_OPTIONS.map((option) => {
          const isSelected = option === selectedSort;

          return (
            <button
              key={option}
              onClick={() => onSelect(option)}
              className="w-full px-5 flex items-center gap-3 cursor-pointer"
            >
              <Image
                src="/images/transaction/v2/체크_블랙.svg"
                alt={isSelected ? "선택됨" : "선택 가능"}
                width={24}
                height={24}
                className={isSelected ? "opacity-100" : "opacity-20"}
              />
              <span
                className={
                  isSelected
                    ? "text-body1-semibold text-gray-900"
                    : "text-body1-regular text-gray-600"
                }
              >
                {option}
              </span>
            </button>
          );
        })}
      </div>
    </BottomModal>
  );
}

