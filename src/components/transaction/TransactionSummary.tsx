"use client";

interface TransactionSummaryProps {
  income: number;
  expense: number;
  total: number;
}

export default function TransactionSummary({
  income,
  expense,
  total,
}: TransactionSummaryProps) {
  // 숫자 형식화 (천 단위 콤마)
  const formatNumber = (num: number): string => {
    return num.toLocaleString("ko-KR");
  };

  return (
    <div className="flex justify-between items-center p-4 bg-white border-b border-gray-100">
      <div className="flex flex-col items-center flex-1">
        <div className="text-xs text-gray-500 mb-1">수입</div>
        <div className="text-sm text-blue-500 font-medium">
          + {formatNumber(income)}
        </div>
      </div>

      <div className="flex flex-col items-center flex-1">
        <div className="text-xs text-gray-500 mb-1">지출</div>
        <div className="text-sm text-red-500 font-medium">
          - {formatNumber(expense)}
        </div>
      </div>

      <div className="flex flex-col items-center flex-1">
        <div className="text-xs text-gray-500 mb-1">총액</div>
        <div className="text-sm font-medium">
          {total >= 0 ? "+" : ""} {formatNumber(total)}
        </div>
      </div>
    </div>
  );
}
