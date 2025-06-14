// components/transaction/GroupTransactionItem.tsx
"use client";

import { useRouter } from "next/navigation";

interface GroupTransactionItemProps {
  teamId: string;
  date: string; // "MM.DD" 형식
  category: string;
  description: string;
  creator: string;
  amount: number; // 양수는 수입, 음수는 지출
  transactionId: string; // 거래 ID 추가
}

export default function GroupTransactionItem({
  teamId,
  date,
  category,
  description,
  creator,
  amount,
  transactionId,
}: GroupTransactionItemProps) {
  const router = useRouter();

  const formatNumber = (num: number): string => {
    return num.toLocaleString("ko-KR");
  };

  const isIncome = amount >= 0;

  // 텍스트 길이에 따른 자르기 함수
  const truncateText = (text: string, maxLength: number): string => {
    if (text == null) text = "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "..";
  };

  // 금액 포맷팅 및 자르기 (10억자리까지 풀 표시)
  const formatAmount = (): string => {
    const absAmount = Math.abs(amount);
    const sign = isIncome ? "+" : "-";
    const formattedAmount = `${sign}${formatNumber(absAmount)}`;

    // 10억 (1,000,000,000) 이하면 풀로 표시
    if (absAmount <= 1000000000) {
      return formattedAmount;
    }

    // 10억 초과면 10억자리까지만 표시하고 ... 추가
    // "+1,000,000,000" = 14자까지는 허용
    if (formattedAmount.length <= 14) {
      return formattedAmount;
    }

    // 15자 이상이면 10자까지만 표시하고 ... 추가
    return formattedAmount.substring(0, 14) + "...";
  };

  // 클릭 핸들러 - 수정 페이지로 이동
  const handleClick = () => {
    if (transactionId) {
      router.push(`/transaction/group/${teamId}/update?id=${transactionId}`);
    }
  };

  return (
    <div
      className="flex items-center py-1 px-4 bg-white cursor-pointer hover:bg-gray-100 transition-colors"
      onClick={handleClick}
    >
      {/* 날짜 (있을 때만 표시) */}
      <div className="w-11 text-xs">{date}</div>

      {/* 카테고리 (4글자까지, 넘으면 ...) */}
      <div className="flex-1 text-left text-sm truncate max-w-[63px]">
        <span className="block w-full" title={category}>
          {truncateText(category, 4)}
        </span>
      </div>

      {/* 내용 (5글자까지, 넘으면 ...) */}
      <div className="flex-1 text-left text-sm truncate max-w-[77px]">
        <span className="block w-full" title={description}>
          {truncateText(description, 5)}
        </span>
      </div>

      {/* 작성자 (3글자까지, 넘으면 ...) */}
      <div className="flex-1 text-left text-sm truncate max-w-[65px]">
        <span className="block w-full" title={creator}>
          {truncateText(creator, 5)}
        </span>
      </div>

      {/* 금액 (10억자리까지, 넘으면 ...) */}
      <div
        className={`flex-1 text-right text-sm font-medium truncate ${
          isIncome ? "text-[#0E7AFF]" : "text-[#FF005E]"
        }`}
      >
        <span
          className="block w-full"
          title={`${isIncome ? "+" : "-"}${formatNumber(Math.abs(amount))}`}
        >
          {formatAmount()}
        </span>
      </div>
    </div>
  );
}
