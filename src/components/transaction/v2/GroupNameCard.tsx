import React from "react";
import Image from "next/image";
import { BRAND_COLORS } from "@/constants/brandColors";

interface GroupNameCardProps {
  groupName?: string;
  label?: string;
  profileImageUrl?: string | null;
  onInfoClick: () => void;
}

export default function GroupNameCard({
  groupName,
  label,
  profileImageUrl,
  onInfoClick,
}: GroupNameCardProps) {
  // 라벨에 해당하는 색상 가져오기 (기본값: gray)
  const labelColor =
    label && label in BRAND_COLORS
      ? BRAND_COLORS[label as keyof typeof BRAND_COLORS]
      : BRAND_COLORS.gray;

  return (
    <div className="bg-white rounded-[18px] pl-5 pr-4 h-[56px] flex items-center justify-between shadow-xs gap-2">
      <div className="flex items-center gap-3 overflow-hidden">
        {profileImageUrl ? (
          <div className="relative w-9 h-9 flex-shrink-0">
            <Image
              src={profileImageUrl}
              alt={groupName || "그룹"}
              fill
              className="rounded-full object-cover"
            />
          </div>
        ) : (
          /* 라벨 컬러 인디케이터 (10x10) */
          <div
            className="w-[10px] h-[10px] rounded-full flex-shrink-0"
            style={{ backgroundColor: labelColor }}
          />
        )}
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
