"use client";

import Image from "next/image";

interface TransactionFloatingButtonV2Props {
  isOpen: boolean;
  onToggle: () => void;
  onWriteDirect: () => void;
  onWriteReceipt: () => void;
  className?: string;
}

export default function TransactionFloatingButtonV2({
  isOpen,
  onToggle,
  onWriteDirect,
  onWriteReceipt,
  className = "",
}: TransactionFloatingButtonV2Props) {
  return (
    <>
      {/* 플로팅 + 버튼 */}
      <button
        onClick={onToggle}
        className={`w-14 h-14 bg-black rounded-full flex items-center justify-center shadow-lg transition-transform p-0 cursor-pointer pointer-events-auto z-50 ${className}`}
      >
        {isOpen ? (
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M18 6L6 18M6 6L18 18"
              stroke="white"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 5V19M5 12H19"
              stroke="white"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      {/* 플로팅 메뉴 */}
      {isOpen && (
        <div className="absolute right-4 bottom-24 bg-white border border-[#E0E0E0] rounded-3xl shadow-lg flex flex-col z-50 min-w-[180px] p-2 gap-2 animate-slide-up">
          <button
            onClick={onWriteReceipt}
            className="w-full text-left px-4 py-3 hover:bg-gray-100 text-gray-900 flex items-center gap-2 cursor-pointer rounded-2xl"
          >
            <Image
              src="/images/transaction/v2/영수증_작성_아이콘.svg"
              alt="영수증"
              width={20}
              height={20}
            />
            <span className="text-body1-semibold">영수증으로 작성하기</span>
          </button>
          <button
            onClick={onWriteDirect}
            className="w-full text-left px-4 py-3 hover:bg-gray-100 text-gray-900 flex items-center gap-2 cursor-pointer rounded-2xl"
          >
            <Image
              src="/images/transaction/v2/직접_작성_아이콘.svg"
              alt="직접 작성"
              width={20}
              height={20}
            />
            <span className="text-body1-semibold">직접 작성하기</span>
          </button>
        </div>
      )}
    </>
  );
}
