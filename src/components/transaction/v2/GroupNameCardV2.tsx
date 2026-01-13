import React from "react";

interface GroupNameCardV2Props {
  groupName?: string;
  onInfoClick: () => void;
}

export default function GroupNameCardV2({
  groupName,
  onInfoClick,
}: GroupNameCardV2Props) {
  return (
    <div className="bg-white rounded-[18px] pl-[10px] pr-4 py-[10px] flex items-center justify-between shadow-xs gap-2">
      <div className="flex items-center gap-2 overflow-hidden">
        {/* 그룹 프사 (placeholder) */}
        <div className="w-9 h-9 rounded-full bg-gray-100 flex-shrink-0" />
        <h2 className="text-body1-semibold text-gray-900 truncate">
          {groupName || "그룹"}
        </h2>
      </div>
      <button
        onClick={onInfoClick}
        className="p-1 cursor-pointer rounded hover:bg-gray-50 transition-colors text-gray-300 flex-shrink-0"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="5" cy="12" r="2" fill="currentColor" />
          <circle cx="12" cy="12" r="2" fill="currentColor" />
          <circle cx="19" cy="12" r="2" fill="currentColor" />
        </svg>
      </button>
    </div>
  );
}
