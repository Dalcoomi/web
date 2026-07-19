"use client";

type PreviewType = "my-writing" | "group-writing" | "receipt";

interface LandingFeaturePreviewProps {
  type: PreviewType;
}

function WritingPreview({ isGroup }: { isGroup: boolean }) {
  return (
    <div className="w-40 rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden pointer-events-none select-none">
      <div className="h-8 bg-gray-50 px-2 flex items-center">
        <p className="text-[9px] font-medium text-gray-700 truncate">
          {isGroup ? "그룹 거래 내역 작성" : "개인 거래 내역 작성"}
        </p>
      </div>

      <div className="p-2.5">
        {isGroup && (
          <div className="mb-2.5 h-7 rounded-[10px] border border-gray-100 bg-gray-30 px-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 min-w-0">
              <span className="w-1.5 h-1.5 rounded-full bg-[#11ABFF]" />
              <span className="text-[9px] text-gray-800 truncate">오사카 여행 경비</span>
            </span>
            <span className="text-[9px] text-gray-400">{">"}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-1 mb-2.5">
          <button
            type="button"
            className="h-7 rounded-[8px] border border-gray-800 text-[9px] font-medium text-gray-900 bg-white"
          >
            지출
          </button>
          <button
            type="button"
            className="h-7 rounded-[8px] border border-gray-100 text-[9px] font-medium text-gray-500 bg-white"
          >
            수입
          </button>
        </div>

        <div className="space-y-2">
          <div>
            <p className="text-[8px] text-gray-500 mb-1">금액</p>
            <div className="h-7 rounded-[8px] border border-gray-100 px-2 flex items-center justify-between">
              <span className="text-[9px] text-gray-700">15,000</span>
              <span className="text-[9px] text-gray-700">원</span>
            </div>
          </div>

          <div>
            <p className="text-[8px] text-gray-500 mb-1">내용</p>
            <div className="h-7 rounded-[8px] border border-gray-100 px-2 flex items-center">
              <span className="text-[9px] text-gray-700 truncate">간식 구매</span>
            </div>
          </div>

          <div>
            <p className="text-[8px] text-gray-500 mb-1">날짜</p>
            <div className="h-7 rounded-[8px] border border-gray-100 px-2 flex items-center">
              <span className="text-[9px] text-gray-700 truncate">2026.03.18 (수)</span>
            </div>
          </div>

          <div>
            <p className="text-[8px] text-gray-500 mb-1">카테고리</p>
            <div className="h-7 rounded-full border border-gray-100 px-2 flex items-center justify-between">
              <span className="text-[9px] text-gray-700">식비</span>
              <span className="text-[9px] text-gray-400">{">"}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-2.5 pb-2.5">
        {isGroup && (
          <div className="mb-2 flex items-center justify-center gap-1.5">
            <span className="flex h-3.5 w-3.5 items-center justify-center rounded-[4px] border border-gray-900 bg-gray-900">
              <svg viewBox="0 0 20 20" fill="none" className="h-2.5 w-2.5 text-white">
                <path
                  d="M4.5 10.5L8.3 14.1L15.5 6.9"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="text-[8px] text-gray-700">개인 가계부에도 추가하기</span>
          </div>
        )}

        <button
          type="button"
          className="w-full h-8 rounded-[10px] bg-gray-900 text-white text-[10px] font-medium"
        >
          작성 완료
        </button>
      </div>
    </div>
  );
}

function ReceiptPreview() {
  return (
    <div className="w-40 rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden pointer-events-none select-none">
      <div className="h-8 bg-[#11ABFF] px-2 flex items-center">
        <p className="text-[9px] font-medium text-white truncate">영수증 거래 내역 작성</p>
      </div>

      <div className="p-2.5">
        <button
          type="button"
          className="w-full h-7 rounded-[8px] border border-[#11ABFF] text-[9px] font-medium text-[#11ABFF]"
        >
          영수증 사진 업로드
        </button>

        <div className="mt-2.5 rounded-[10px] border border-gray-100 p-1.5">
          <div className="grid grid-cols-4 gap-1 text-[7px] text-gray-500 mb-1">
            <span className="text-center">날짜</span>
            <span className="text-center">카테고리</span>
            <span className="text-center">내용</span>
            <span className="text-right">금액</span>
          </div>

          <div className="space-y-1">
            <div className="grid grid-cols-4 gap-1 text-[8px] text-gray-700">
              <span className="text-center">03/18</span>
              <span className="text-center">식비</span>
              <span className="text-center truncate">카페</span>
              <span className="text-right">4,500</span>
            </div>
            <div className="grid grid-cols-4 gap-1 text-[8px] text-gray-700">
              <span className="text-center">03/18</span>
              <span className="text-center">생활</span>
              <span className="text-center truncate">마트</span>
              <span className="text-right">12,300</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-2.5 pb-2.5">
        <div className="mb-2 h-7 rounded-[8px] border border-gray-200 px-2 flex items-center justify-between">
          <span className="text-[9px] text-gray-500">합계</span>
          <span className="text-[10px] font-medium text-gray-900">16,800원</span>
        </div>

        <button
          type="button"
          className="w-full h-8 rounded-[10px] bg-[#11ABFF] text-white text-[10px] font-medium"
        >
          완료
        </button>
      </div>
    </div>
  );
}

export default function LandingFeaturePreview({
  type,
}: LandingFeaturePreviewProps) {
  if (type === "my-writing") {
    return <WritingPreview isGroup={false} />;
  }

  if (type === "group-writing") {
    return <WritingPreview isGroup={true} />;
  }

  return <ReceiptPreview />;
}
