"use client";

import { useRouter } from "next/navigation";

interface GroupTransactionItemV2Props {
  teamId: string;
  date: string; // "MM.DD" 형식 (없으면 빈 문자열)
  category: string;
  description: string;
  creator: string;
  amount: number; // 양수는 수입, 음수는 지출
  transactionId: string;
  showSeparator?: boolean;
}

export default function GroupTransactionItemV2({
  teamId,
  date,
  category,
  description,
  creator,
  amount,
  transactionId,
  showSeparator = false,
}: GroupTransactionItemV2Props) {
  const router = useRouter();

  const formatNumber = (num: number): string => {
    return num.toLocaleString("ko-KR");
  };

  const isIncome = amount >= 0;

  // 금액 포맷팅
  const formatAmount = (): string => {
    const absAmount = Math.abs(amount);
    const sign = isIncome ? "+" : "-";
    return `${sign}${formatNumber(absAmount)}원`;
  };

  // 클릭 핸들러 - 수정 페이지로 이동
  const handleClick = () => {
    if (transactionId) {
      router.push(`/transaction/group/${teamId}/update?id=${transactionId}`);
    }
  };

  return (
    <div
      className={`flex items-baseline justify-between py-3 px-5 bg-white cursor-pointer transition-colors hover:bg-[radial-gradient(circle_at_bottom,_#FFF7F8_0%,_#F5F8FF_70%,_#FFFFFF_100%)] ${
        showSeparator ? "border-t border-gray-50" : ""
      }`}
      onClick={handleClick}
    >
        {/* 좌측: 날짜 */}
        <div className="w-12 flex-shrink-0 text-left">
          <span className="text-body2-semibold text-gray-400">{date}</span>
        </div>

        {/* 중앙: 내용 + 카테고리 · 작성자 */}
        <div className="flex-1 flex flex-col gap-0.5 overflow-hidden pl-4 pr-2">
          <span className="text-body1-semibold text-gray-900 truncate">
            {description || "내용 없음"}
          </span>
          <span className="text-body2-regular text-gray-600 truncate">
            {category} · {creator}
          </span>
        </div>

        {/* 우측: 금액 */}
        <div className="flex-shrink-0 text-right">
          <span
            className={`text-body1-semibold ${
              isIncome ? "text-blue-600" : "text-red-600"
            }`}
          >
            {formatAmount()}
          </span>
        </div>
      </div>
  );
}
