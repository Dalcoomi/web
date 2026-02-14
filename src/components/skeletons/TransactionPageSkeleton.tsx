import React from "react";
import Image from "next/image";
import Skeleton from "./Skeleton";
import TransactionFilter from "@/components/transaction/v2/TransactionFilter";

// 거래내역 아이템 스켈레톤 - 실제 MyTransactionItem/GroupTransactionItem와 동일한 레이아웃
function TransactionItemSkeleton() {
  return (
    <div className="flex items-baseline justify-between py-3 px-5 bg-white">
      {/* 좌측: 날짜 56x20 */}
      <div className="w-12 shrink-0 text-left">
        <Skeleton className="h-5 w-14 rounded-md" />
      </div>

      {/* 중앙: 내용+금액 / 카테고리명 */}
      <div className="flex-1 flex flex-col gap-0.5 pl-4">
        {/* 내용+금액: 271x20 */}
        <Skeleton className="h-5 w-[271px] rounded-md" />
        {/* 카테고리명: 135.5x20 */}
        <Skeleton className="h-5 w-[135.5px] rounded-md" />
      </div>
    </div>
  );
}

export default function TransactionPageSkeleton() {
  return (
    <>
      {/* 요약 카드 - TransactionSummary와 동일한 레이아웃 */}
      <div className="px-5 pt-1 bg-gray-30">
        <div
          className="rounded-t-[18px] px-4 pt-3 flex flex-col items-center relative z-40"
          style={{
            background:
              "radial-gradient(circle at top, #FFEDF0 0%, #EDF3FF 30%, #FFFFFF 60%)",
          }}
        >
          {/* 뱃지 스켈레톤: 120x20 */}
          <Skeleton className="h-5 w-[120px] rounded-full mb-4" />

          {/* 캐릭터 */}
          <div className="mb-[20px]">
            <Image
              src="/images/transaction/v2/메인_캐릭터.svg"
              alt="캐릭터"
              width={100}
              height={100}
            />
          </div>

          <div className="flex w-full divide-x divide-gray-100">
            <div className="flex-1 flex flex-col items-start pl-2 pr-2.5">
              <div className="text-gray-400 mb-1 text-caption1-medium">수입</div>
              <Skeleton className="h-5 w-[123.5px] rounded-md" />
            </div>
            <div className="flex-1 flex flex-col items-start pl-2.5 pr-2">
              <div className="text-gray-400 mb-1 text-caption1-medium">지출</div>
              <Skeleton className="h-5 w-[123.5px] rounded-md" />
            </div>
          </div>
        </div>
      </div>

      {/* 총액 카드 - TransactionTotal와 동일한 레이아웃 */}
      <div className="sticky top-0 z-30 px-5 pb-3 bg-gray-30 -mt-px">
        <div className="bg-white pt-5 px-4 pb-4 rounded-b-[18px] shadow-xs">
          <div className="w-full bg-gray-50 rounded-xl py-3 px-4 flex items-center justify-between">
            <div className="bg-gray-900 text-white px-2 pb-0.5 rounded-lg">
              <span className="text-caption2-semibold">총액</span>
            </div>
            <Skeleton className="h-5 w-56.5 rounded-md" />
          </div>
        </div>
      </div>

      {/* 거래 내역 목록 영역 */}
      <div className="bg-white flex-1">
        <TransactionFilter
          showCategoryFilter={false}
          onCategoryToggle={() => {}}
        />
        {Array.from({ length: 3 }).map((_, index) => (
          <TransactionItemSkeleton key={index} />
        ))}
      </div>
    </>
  );
}
