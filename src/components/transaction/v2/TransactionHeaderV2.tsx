"use client";

import Image from "next/image";

interface TransactionHeaderV2Props {
  title: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onMenuClick: () => void;
  className?: string;
}

export default function TransactionHeaderV2({
  title,
  onPrevMonth,
  onNextMonth,
  onMenuClick,
  className = "",
}: TransactionHeaderV2Props) {
  return (
    <div
      className={`flex items-center justify-start px-[24px] py-4 bg-transparent relative z-10 ${className}`}
    >
      <button onClick={onPrevMonth} className="cursor-pointer">
        <Image
          src="/images/transaction/v2/좌측_화살표_회색.svg"
          alt="이전 달"
          width={10}
          height={16}
        />
      </button>

      <div className="text-black mx-3 text-subtitle">{title}</div>

      <button onClick={onNextMonth} className="cursor-pointer">
        <Image
          src="/images/transaction/v2/우측_화살표_회색.svg"
          alt="다음 달"
          width={10}
          height={16}
        />
      </button>

      <button
        onClick={onMenuClick}
        className="absolute right-6 cursor-pointer"
      >
        <Image
          src="/images/transaction/v2/햄버거_메뉴.svg"
          alt="메뉴"
          width={24}
          height={24}
        />
      </button>
    </div>
  );
}
