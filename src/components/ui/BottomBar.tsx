// components/ui/BottomBar.tsx
"use client";

import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";

export default function BottomBar() {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(path);
  };

  return (
    <div className="bg-white border-t border-gray-200 h-14 fixed bottom-0 left-0 right-0 flex items-center justify-around">
      {/* 개인 버튼 */}
      <button
        onClick={() => router.push("/transaction/my")}
        className="flex flex-col items-center justify-center w-1/2"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z"
            fill={isActive("/transaction/my") ? "#0EABFF" : "#757575"}
          />
        </svg>
        <span
          className={`text-xs mt-1 ${
            isActive("/transaction/my") ? "text-[#0EABFF]" : "text-gray-500"
          }`}
        >
          개인
        </span>
      </button>

      {/* 그룹 버튼 */}
      <button
        onClick={() => router.push("/transaction/group")}
        className="flex flex-col items-center justify-center w-1/2"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M16 11C17.66 11 18.99 9.66 18.99 8C18.99 6.34 17.66 5 16 5C14.34 5 13 6.34 13 8C13 9.66 14.34 11 16 11ZM8 11C9.66 11 10.99 9.66 10.99 8C10.99 6.34 9.66 5 8 5C6.34 5 5 6.34 5 8C5 9.66 6.34 11 8 11ZM8 13C5.67 13 1 14.17 1 16.5V19H15V16.5C15 14.17 10.33 13 8 13ZM16 13C15.71 13 15.38 13.02 15.03 13.05C16.19 13.89 17 15.02 17 16.5V19H23V16.5C23 14.17 18.33 13 16 13Z"
            fill={isActive("/transaction/group") ? "#0EABFF" : "#757575"}
          />
        </svg>
        <span
          className={`text-xs mt-1 ${
            isActive("/transaction/group") ? "text-[#0EABFF]" : "text-gray-500"
          }`}
        >
          그룹
        </span>
      </button>
    </div>
  );
}
