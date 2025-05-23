// components/group/GroupPageClient.tsx
"use client";

import { useRouter } from "next/navigation";
import TopBar from "@/components/ui/TopBar";
import BottomBar from "@/components/ui/BottomBar";

export default function GroupPageClient() {
  const router = useRouter();

  // 그룹 생성 버튼 클릭 핸들러
  const handleCreateGroup = () => {
    router.push("/group/create");
  };

  // 그룹 참가 버튼 클릭 핸들러
  const handleJoinGroup = () => {
    router.push("/group/join");
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      <TopBar />

      {/* 메인 컨텐츠 영역 */}
      <div className="flex-1 px-3 py-3">
        {/* 그룹 생성/참가 버튼들 */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          {/* 그룹 생성 버튼 */}
          <button
            onClick={handleCreateGroup}
            className="flex flex-col items-center justify-center p-1 border-3 border-[#0EABFF] rounded-[10px] bg-white hover:bg-blue-50 transition-colors cursor-pointer"
          >
            <div className="w-11 h-11 mt-1 flex items-center justify-center border-3 border-[#0EABFF] rounded-full">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 5V19M5 12H19"
                  stroke="#0EABFF"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="text-md font-medium text-[#0EABFF]">
              그룹 생성
            </span>
          </button>

          {/* 그룹 참가 버튼 */}
          <button
            onClick={handleJoinGroup}
            className="flex flex-col items-center justify-center p-1 border-3 border-[#0EABFF] rounded-[10px] bg-white hover:bg-blue-50 transition-colors cursor-pointer"
          >
            <div className="w-11 h-11 mt-1 flex items-center justify-center ">
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21M20 8V14M23 11H17M12.5 7C12.5 9.20914 10.7091 11 8.5 11C6.29086 11 4.5 9.20914 4.5 7C4.5 4.79086 6.29086 3 8.5 3C10.7091 3 12.5 4.79086 12.5 7Z"
                  stroke="#0EABFF"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="text-md font-medium text-[#0EABFF]">
              그룹 참가
            </span>
          </button>
        </div>

        {/* 그룹 목록 섹션 */}
        <div className="px-2 mb-4">
          <h2 className="text-lg font-medium text-[#0A0A0A] mb-5">그룹 목록</h2>
        </div>

        {/* 빈 상태 메시지 */}
        <div className="flex-1 flex flex-col items-center justify-center text-center mt-20">
          <div className="text-[#777777] text-base mb-2">
            참여하고 있는 그룹이 없습니다.
          </div>
          <div className="text-gray-400 text-sm">
            그룹을 생성하거나 참가해보세요.
          </div>
        </div>
      </div>

      <BottomBar />
    </div>
  );
}
