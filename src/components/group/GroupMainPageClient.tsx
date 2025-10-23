// components/group/GroupMainPageClient.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  getGroups,
  Group,
  updateGroupOrder,
} from "@/services/groupService";
import TopBar from "@/components/ui/TopBar";
import BottomBar from "@/components/ui/BottomBar";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import { restrictToVerticalAxis, restrictToFirstScrollableAncestor } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export default function GroupPageClient() {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const groupListRef = useRef<HTMLDivElement>(null);

  // 드래그&드롭 센서 설정
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  // 편집 모드 토글
  const handleEditModeToggle = () => {
    setIsEditMode(!isEditMode);
  };

  // 편집 완료 (순서 저장)
  const handleSaveOrder = async () => {
    try {
      // 🔥 백엔드 API 연동
      await updateGroupOrder(
        groups.map((g, idx) => ({ teamId: g.teamId, displayOrder: idx }))
      );

      setIsEditMode(false);
      alert("그룹 순서가 저장되었습니다.");
    } catch (error) {
      alert("그룹 순서 저장에 실패했습니다.");
      console.error(error);
    }
  };

  // 커스텀 modifier: 그룹 리스트 영역으로만 드래그 제한
  const restrictToGroupList = ({ transform, draggingNodeRect, containerNodeRect }: any) => {
    if (!groupListRef.current || !draggingNodeRect) {
      return transform;
    }

    const listRect = groupListRef.current.getBoundingClientRect();

    return {
      ...transform,
      y: Math.max(
        listRect.top - draggingNodeRect.top,
        Math.min(transform.y, listRect.bottom - draggingNodeRect.bottom)
      ),
    };
  };

  // 드래그 시작 핸들러
  const handleDragStart = (event: DragStartEvent) => {
    setIsDragging(true);
  };

  // 드래그 종료 핸들러
  const handleDragEnd = (event: DragEndEvent) => {
    setIsDragging(false);

    const { active, over } = event;

    if (over && active.id !== over.id) {
      setGroups((items) => {
        const oldIndex = items.findIndex((item) => item.teamId === active.id);
        const newIndex = items.findIndex((item) => item.teamId === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden">
      <TopBar />

      {/* 메인 컨텐츠 영역 */}
      <div className="flex-1 px-3 py-3 overflow-y-auto">
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
        <div className="flex items-center justify-between px-2 mb-2">
          <h2 className="text-lg font-medium text-[#0A0A0A]">그룹 목록</h2>
          {groups.length > 0 && (
            <button
              onClick={isEditMode ? handleSaveOrder : handleEditModeToggle}
              className="text-sm font-medium text-[#0EABFF] px-3 py-1 rounded-md hover:bg-blue-50 transition-colors cursor-pointer"
            >
              {isEditMode ? "완료" : "편집"}
            </button>
          )}
        </div>

        {/* 그룹 리스트 또는 빈 상태 */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-gray-500">로딩 중...</div>
          </div>
        ) : groups.length > 0 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis, restrictToGroupList]}
          >
            <SortableContext
              items={groups.map((g) => g.teamId)}
              strategy={verticalListSortingStrategy}
            >
              <div ref={groupListRef} className="space-y-2">
                {groups.map((group) => (
                  <SortableItem
                    key={group.teamId}
                    id={group.teamId}
                    group={group}
                    isEditMode={isEditMode}
                    onClick={() => handleGroupClick(group.teamId)}
                    onInfoClick={(e) => handleGroupInfoClick(e, group.teamId)}
                    getMemberCountColor={getMemberCountColor}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
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

// Sortable Item 컴포넌트
interface SortableItemProps {
  id: string;
  group: Group;
  isEditMode: boolean;
  onClick: () => void;
  onInfoClick: (e: React.MouseEvent) => void;
  getMemberCountColor: (memberCount: number, memberLimit: number) => string;
}

function SortableItem({
  id,
  group,
  isEditMode,
  onClick,
  onInfoClick,
  getMemberCountColor,
}: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id, disabled: !isEditMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => !isEditMode && onClick()}
      className={`bg-[#F5F7FE] rounded-[10px] p-4 transition-colors ${
        isEditMode ? "cursor-default" : "hover:bg-blue-200 cursor-pointer"
      }`}
    >
      <div className="flex items-center justify-between">
        {/* 드래그 핸들 (편집 모드에만 표시) */}
        {isEditMode && (
          <div
            {...attributes}
            {...listeners}
            className="mr-3 text-gray-400 cursor-move"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="9" cy="5" r="1.5" fill="currentColor" />
              <circle cx="9" cy="12" r="1.5" fill="currentColor" />
              <circle cx="9" cy="19" r="1.5" fill="currentColor" />
              <circle cx="15" cy="5" r="1.5" fill="currentColor" />
              <circle cx="15" cy="12" r="1.5" fill="currentColor" />
              <circle cx="15" cy="19" r="1.5" fill="currentColor" />
            </svg>
          </div>
        )}

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

        {/* 더보기 아이콘 (일반 모드에만 표시) */}
        {!isEditMode && (
          <div
            className="text-[#515968] p-2 cursor-pointer transition-colors"
            onClick={onInfoClick}
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
        )}
      </div>
    </div>
  );
}
