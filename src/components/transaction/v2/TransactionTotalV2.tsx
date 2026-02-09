import React from "react";

interface TransactionTotalV2Props {
  total: number;
  isSticky: boolean;
}

export default function TransactionTotalV2({
  total,
  isSticky,
}: TransactionTotalV2Props) {
  const formatNumber = (num: number): string => {
    return num.toLocaleString("ko-KR");
  };

  return (
    <div
      className={`bg-white pt-[20px] px-[16px] pb-[16px] flex flex-col items-center transition-all duration-300 ${
        isSticky ? "rounded-[18px] shadow-xs" : "rounded-b-[18px] shadow-xs"
      }`}
    >
      <div className="w-full bg-gray-50 rounded-xl py-[12px] px-[16px] flex items-center justify-between">
        <div className="bg-gray-900 text-white px-2 pb-0.5 rounded-lg">
          <span className="text-caption2-semibold">총액</span>
        </div>
        <span className="text-gray-900 text-body1-semibold">
          {total > 0 ? "+" : ""}
          {formatNumber(total)}원
        </span>
      </div>
    </div>
  );
}
