"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import Image from "next/image";

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

const MODAL_CLOSE_DRAG_THRESHOLD = 160;

export default function SortBottomSheet({
  isMounted,
  isOpen,
  selectedSort,
  onClose,
  onSelect,
}: SortBottomSheetProps) {
  const modalDragStartYRef = useRef<number | null>(null);
  const modalIsDraggingRef = useRef(false);
  const [modalDragOffset, setModalDragOffset] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setModalDragOffset(0);
      modalIsDraggingRef.current = false;
      modalDragStartYRef.current = null;
    }
  }, [isOpen]);

  const handleModalHandlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    modalIsDraggingRef.current = true;
    modalDragStartYRef.current = e.clientY;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleModalHandlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!modalIsDraggingRef.current || modalDragStartYRef.current === null) {
      return;
    }

    const deltaY = Math.max(0, e.clientY - modalDragStartYRef.current);
    setModalDragOffset(deltaY);
  };

  const handleModalHandlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (!modalIsDraggingRef.current) return;

    modalIsDraggingRef.current = false;
    modalDragStartYRef.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);

    if (modalDragOffset > MODAL_CLOSE_DRAG_THRESHOLD) {
      onClose();
      return;
    }

    setModalDragOffset(0);
  };

  if (!isMounted) return null;

  return (
    <>
      <div
        className={`absolute inset-0 z-40 transition-opacity duration-200 ${
          isOpen ? "bg-[#d9d9d9] opacity-50" : "bg-[#d9d9d9] opacity-0"
        }`}
        onClick={onClose}
      />

      <div
        className={`absolute left-0 right-0 bottom-0 z-50 bg-gray-30 rounded-t-[20px] rounded-b-none pt-3 pb-0 ${
          modalIsDraggingRef.current
            ? ""
            : "transition-transform duration-200 ease-out"
        }`}
        style={{
          transform: isOpen
            ? `translateY(${modalDragOffset}px)`
            : "translateY(100%)",
        }}
      >
        <div
          className="w-16 h-[5px] bg-gray-100 rounded-[100px] mx-auto mb-5 cursor-grab active:cursor-grabbing touch-none"
          onPointerDown={handleModalHandlePointerDown}
          onPointerMove={handleModalHandlePointerMove}
          onPointerUp={handleModalHandlePointerUp}
          onPointerCancel={handleModalHandlePointerUp}
        />

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
      </div>
    </>
  );
}
