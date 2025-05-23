// components/ui/BottomBar.tsx
"use client";

import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import Image from "next/image";

export default function BottomBar() {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(path);
  };

  return (
    <div className="bg-white border-t border-gray-200 h-13 flex items-center">
      {/* 개인 버튼 */}
      <button
        onClick={() => router.push("/transaction/my")}
        className="flex flex-col items-center justify-center w-1/2 h-full hover:bg-gray-50 transition-colors cursor-pointer"
      >
        <div className="w-6 h-6">
          <Image
            src={
              isActive("/transaction/my")
                ? "/images/개인_활성.svg"
                : "/images/개인_비활성.svg"
            }
            alt="개인"
            width={24}
            height={24}
            className="w-full h-full"
          />
        </div>
        <span
          className={`text-xs ${
            isActive("/transaction/my") ? "text-[#11ABFF]" : "text-[#D4D4D4]"
          }`}
        >
          개인
        </span>
      </button>

      {/* 그룹 버튼 */}
      <button
        onClick={() => router.push("/group")}
        className="flex flex-col items-center justify-center w-1/2 h-full hover:bg-gray-50 transition-colors cursor-pointer"
      >
        <div className="w-6 h-6">
          <Image
            src={
              isActive("/group")
                ? "/images/그룹_활성.svg"
                : "/images/그룹_비활성.svg"
            }
            alt="그룹"
            width={24}
            height={24}
            className="w-full h-full"
          />
        </div>
        <span
          className={`text-xs ${
            isActive("/group") ? "text-[#11ABFF]" : "text-[#D4D4D4]"
          }`}
        >
          그룹
        </span>
      </button>
    </div>
  );
}
