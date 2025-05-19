// components/transaction/EmptyTransactionList.tsx
"use client";

export default function EmptyTransactionList() {
  return (
    <div className="flex flex-col items-center justify-center h-[70%] bg-white">
      <div className="text-[#777777] text-base">거래 내역이 없습니다.</div>
      <div className="text-[#777777] text-base">거래 내역을 작성해주세요.</div>
    </div>
  );
}
