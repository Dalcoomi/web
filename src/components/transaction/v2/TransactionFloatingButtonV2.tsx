"use client";

import Image from "next/image";

interface TransactionFloatingButtonV2Props {
  isOpen: boolean;
  onToggle: () => void;
  onWriteDirect?: () => void;
  onWriteReceipt?: () => void;
  onEnterInviteCode?: () => void;
  onCreateGroup?: () => void;
  className?: string;
}

export default function TransactionFloatingButtonV2({
  isOpen,
  onToggle,
  onWriteDirect,
  onWriteReceipt,
  onEnterInviteCode,
  onCreateGroup,
  className = "",
}: TransactionFloatingButtonV2Props) {
  const showWriteButtons = onWriteDirect || onWriteReceipt;
  const showGroupButtons = onEnterInviteCode || onCreateGroup;

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
        <div className="absolute right-4 bottom-24 bg-white border border-[#E0E0E0] rounded-[20px] shadow-lg flex flex-col z-50 min-w-max pt-4 pb-4 pl-4 pr-6 animate-slide-up pointer-events-auto">
          {onWriteDirect && (
            <button
              onClick={onWriteDirect}
              className="text-left text-gray-900 flex items-center gap-2 cursor-pointer mb-4 hover:opacity-70 transition-opacity"
            >
              <Image
                src="/images/transaction/v2/직접_작성_아이콘.svg"
                alt="직접 작성"
                width={20}
                height={20}
              />
              <span className="text-body1-semibold whitespace-nowrap">
                직접 작성하기
              </span>
            </button>
          )}
          {onWriteReceipt && (
            <button
              onClick={onWriteReceipt}
              className={`text-left text-gray-900 flex items-center gap-2 cursor-pointer hover:opacity-70 transition-opacity ${
                showGroupButtons ? "mb-3" : ""
              }`}
            >
              <Image
                src="/images/transaction/v2/영수증_작성_아이콘.svg"
                alt="영수증"
                width={20}
                height={20}
              />
              <span className="text-body1-semibold whitespace-nowrap">
                영수증으로 작성하기
              </span>
            </button>
          )}

          {showWriteButtons && showGroupButtons && (
            <div className="h-px bg-gray-50 w-full mb-3" />
          )}

          {onEnterInviteCode && (
            <button
              onClick={onEnterInviteCode}
              className={`text-left text-gray-900 flex items-center gap-2 cursor-pointer hover:opacity-70 transition-opacity ${
                onCreateGroup ? "mb-4" : ""
              }`}
            >
              <Image
                src="/images/transaction/v2/초대코드_입력_아이콘.svg"
                alt="초대코드"
                width={20}
                height={20}
              />
              <span className="text-body1-semibold whitespace-nowrap">
                초대코드 입력하기
              </span>
            </button>
          )}

          {onCreateGroup && (
            <button
              onClick={onCreateGroup}
              className="text-left text-gray-900 flex items-center gap-2 cursor-pointer hover:opacity-70 transition-opacity"
            >
              <Image
                src="/images/transaction/v2/그룹_생성_아이콘.svg"
                alt="그룹 생성"
                width={20}
                height={20}
              />
              <span className="text-body1-semibold whitespace-nowrap">
                그룹 새로 만들기
              </span>
            </button>
          )}
        </div>
      )}
    </>
  );
}
