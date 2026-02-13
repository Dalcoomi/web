import React from "react";
import Image from "next/image";

interface TransactionSummaryProps {
  income: number;
  expense: number;
  showCharacter?: boolean;
}

export default function TransactionSummary({
  income,
  expense,
  showCharacter = true,
}: TransactionSummaryProps) {
  const isExpenseDay = expense > income;
  const isIncomeDay = income > expense;

  const formatNumber = (num: number): string => {
    return num.toLocaleString("ko-KR");
  };

  return (
    <div
      className={`rounded-t-[18px] px-4 flex flex-col items-center relative z-40 ${
        showCharacter ? "pt-3" : "pt-4 bg-white"
      }`}
      style={
        showCharacter
          ? {
              background:
                "radial-gradient(circle at top, #FFEDF0 0%, #EDF3FF 30%, #FFFFFF 60%)",
            }
          : undefined
      }
    >
      {isExpenseDay && (
        <div className="bg-white px-3 py-1.5 rounded-full mb-4">
          <span className="text-red-600 text-caption1-semibold">
            지출이 더 많은 달
          </span>
        </div>
      )}
      {isIncomeDay && (
        <div className="bg-white px-3 py-1.5 rounded-full mb-4">
          <span className="text-blue-600 text-caption1-semibold">
            수입이 더 많은 달
          </span>
        </div>
      )}

      {showCharacter && (
        <div className="mb-[20px]">
          <Image
            src="/images/transaction/v2/요약_카드_캐릭터.svg"
            alt="캐릭터"
            width={100}
            height={100}
          />
        </div>
      )}

      <div className="flex w-full divide-x divide-gray-100">
        <div className="flex-1 flex flex-col items-start pl-2 pr-2.5">
          <div className="text-gray-400 mb-1 text-caption1-medium">수입</div>
          <div className="text-blue-600 text-body1-semibold">
            +{formatNumber(income)}원
          </div>
        </div>
        <div className="flex-1 flex flex-col items-start pl-2.5 pr-2">
          <div className="text-gray-400 mb-1 text-caption1-medium">지출</div>
          <div className="text-red-600 text-body1-semibold">
            -{formatNumber(expense)}원
          </div>
        </div>
      </div>
    </div>
  );
}
