"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";

interface GroupTransactionItemProps {
  teamId: string;
  date: string; // "MM.DD" 형식 (없으면 빈 문자열)
  category: string;
  description: string;
  creator: string;
  creatorProfileImageUrl?: string | null;
  amount: number; // 양수는 수입, 음수는 지출
  transactionId: string;
  showSeparator?: boolean;
}

export default function GroupTransactionItem({
  teamId,
  date,
  category,
  description,
  creator,
  creatorProfileImageUrl,
  amount,
  transactionId,
  showSeparator = false,
}: GroupTransactionItemProps) {
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
      className={`flex items-start justify-between py-3 px-5 bg-white cursor-pointer transaction-item-hover ${
        showSeparator ? "border-t border-gray-50" : ""
      }`}
      onClick={handleClick}
    >
      {/* 좌측: 날짜 */}
      <div className="w-12 shrink-0 text-left pt-0.5">
        <span className="text-body2-semibold text-gray-400">{date}</span>
      </div>

      {/* 중앙: 내용 + 카테고리 */}
      <div className="flex-1 flex flex-col gap-0.5 overflow-hidden pl-4 pr-2">
        <span className="text-body1-semibold text-gray-900 truncate">
          {description || "(내용 없음)"}
        </span>
        <span className="text-body2-regular text-gray-600 truncate">
          {category}
        </span>
      </div>

      {/* 우측: 금액 + 작성자 */}
      <div className="shrink-0 flex flex-col items-end gap-0.5">
        <span
          className={`text-body1-semibold ${
            isIncome ? "text-blue-600" : "text-red-600"
          }`}
        >
          {formatAmount()}
        </span>
        <div className="flex items-center gap-1">
          <span className="text-body2-regular text-gray-600">{creator}</span>
          {creatorProfileImageUrl ? (
            <Image
              src={creatorProfileImageUrl}
              alt={creator}
              width={20}
              height={20}
              className="rounded-full object-cover"
              unoptimized
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-gray-200" />
          )}
        </div>
      </div>
    </div>
  );
}
