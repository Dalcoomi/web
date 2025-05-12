"use client";

interface TransactionItemProps {
  date: string; // "MM.DD" 형식
  category: string;
  description: string;
  amount: number; // 양수는 수입, 음수는 지출
}

export default function TransactionItem({
  date,
  category,
  description,
  amount,
}: TransactionItemProps) {
  // 숫자 형식화 (천 단위 콤마)
  const formatNumber = (num: number): string => {
    return num.toLocaleString("ko-KR");
  };

  const isIncome = amount > 0;

  return (
    <div className="flex items-center justify-between py-3 px-4 border-b border-gray-100">
      <div className="flex-1 min-w-0">
        <div className="text-xs text-gray-400 mb-1">{date}</div>
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium text-gray-900">{category}</div>
          <div className="text-sm text-gray-600">{description}</div>
        </div>
      </div>
      <div
        className={`text-sm font-medium ${
          isIncome ? "text-blue-500" : "text-pink-500"
        }`}
      >
        {isIncome ? "+" : "-"}
        {formatNumber(Math.abs(amount))}
      </div>
    </div>
  );
}
