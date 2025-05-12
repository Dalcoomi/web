"use client";

export default function EmptyTransactionList() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 bg-white text-gray-500">
      <div className="text-center mb-2">거래 내역이 없습니다.</div>
      <div className="text-center">거래 내역을 작성해주세요.</div>
    </div>
  );
}
