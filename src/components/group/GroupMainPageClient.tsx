// components/group/GroupMainPageClient.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getGroups, Group } from "@/services/groupService";
import TopBar from "@/components/ui/TopBar";
import BottomBar from "@/components/ui/BottomBar";

export default function GroupPageClient() {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 그룹 리스트 로드
  useEffect(() => {
    const loadGroups = setTimeout(async () => {
      try {
        setIsLoading(true);
        const response = await getGroups();
        setGroups(response.groups);
      } catch (error) {
        alert(error);

        setGroups([]);
      } finally {
        setIsLoading(false);
      }
    }, 100);

    // cleanup: 다음 effect 실행 전에 이전 timeout 취소
    return () => {
      clearTimeout(loadGroups);
    };
  }, []);

  // 그룹 생성 버튼 클릭 핸들러
  const handleCreateGroup = () => {
    router.push("/group/create");
  };

  // 그룹 참가 버튼 클릭 핸들러
  const handleJoinGroup = () => {
    router.push("/group/join");
  };

  // 그룹 클릭 핸들러 (그룹 거래 내역 조회 페이지로 이동)
  const handleGroupClick = (teamId: string) => {
    router.push(`/transaction/group/${teamId}`);
  };

  // 그룹 정보 페이지로 이동
  const handleGroupInfoClick = (e: React.MouseEvent, teamId: string) => {
    e.stopPropagation(); // 부모 클릭 이벤트 방지
    router.push(`/group/info/${teamId}`);
  };

  // 멤버 수 색상 결정 (정원에 따라)
  const getMemberCountColor = (memberCount: number, memberLimit: number) => {
    const ratio = memberCount / memberLimit;
    if (ratio >= 1) return "text-green-500"; // 정원 달성
    if (ratio >= 0.5) return "text-yellow-400"; // 80% 이상
    return "text-[#FF472F]"; // 그 외
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
            <div className="w-11 h-11 mt-1 flex items-center justify-center">
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
        <div className="px-2 mb-2">
          <h2 className="text-lg font-medium text-[#0A0A0A]">그룹 목록</h2>
        </div>

        {/* 그룹 리스트 또는 빈 상태 */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-gray-500">로딩 중...</div>
          </div>
        ) : groups.length > 0 ? (
          <div className="space-y-2">
            {groups.map((group) => (
              <div
                key={group.teamId}
                onClick={() => handleGroupClick(group.teamId)}
                className="bg-[#F5F7FE] rounded-[10px] p-4 hover:bg-blue-200 transition-colors"
              >
                <div className="flex items-center justify-between">
                  {/* 그룹 정보 */}
                  <div className="flex-1">
                    <h3 className="text-md font-medium text-[#515968] px-1">
                      {group.title}
                    </h3>
                    <p
                      className={`text-sm font-medium px-1.5 ${getMemberCountColor(
                        group.memberCount,
                        group.memberLimit
                      )}`}
                    >
                      {group.memberCount} / {group.memberLimit}
                    </p>
                  </div>

                  {/* 더보기 아이콘 */}
                  <div
                    className="text-[#515968] p-2 cursor-pointer transition-colors"
                    onClick={(e) => handleGroupInfoClick(e, group.teamId)}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle cx="12" cy="2" r="2" fill="currentColor" />
                      <circle cx="12" cy="12" r="2" fill="currentColor" />
                      <circle cx="12" cy="22" r="2" fill="currentColor" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center mt-20">
            <div className="text-[#777777] text-base mb-2">
              참여하고 있는 그룹이 없습니다.
            </div>
            <div className="text-gray-400 text-sm">
              그룹을 생성하거나 참가해보세요.
            </div>
          </div>
        )}
      </div>

      <BottomBar />
    </div>
  );
}
