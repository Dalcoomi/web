"use client";

import Image from "next/image";
import type {
  CSSProperties,
  PointerEventHandler,
} from "react";
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  restrictToParentElement,
  restrictToVerticalAxis,
} from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import { BRAND_COLORS } from "@/constants/brandColors";
import type { Group } from "@/services/groupService";

interface GroupSwitcherModalProps {
  isMounted: boolean;
  isOpen: boolean;
  isDragging: boolean;
  dragOffset: number;
  groups: Group[];
  editableGroups: Group[];
  selectedTeamId: string;
  isEditMode: boolean;
  isSavingOrder: boolean;
  infoActionLabel: string;
  onClose: () => void;
  onHandlePointerDown: PointerEventHandler<HTMLDivElement>;
  onHandlePointerMove: PointerEventHandler<HTMLDivElement>;
  onHandlePointerUp: PointerEventHandler<HTMLDivElement>;
  onToggleOrderEdit: () => void;
  onCompleteOrderEdit: () => void;
  onReorder: (activeTeamId: string, overTeamId: string) => void;
  onSelectGroup: (teamId: string) => void;
  onCreateGroup: () => void;
  onOpenGroupInfo: () => void;
  onInviteGroup: () => void;
}

export default function GroupSwitcherModal({
  isMounted,
  isOpen,
  isDragging,
  dragOffset,
  groups,
  editableGroups,
  selectedTeamId,
  isEditMode,
  isSavingOrder,
  infoActionLabel,
  onClose,
  onHandlePointerDown,
  onHandlePointerMove,
  onHandlePointerUp,
  onToggleOrderEdit,
  onCompleteOrderEdit,
  onReorder,
  onSelectGroup,
  onCreateGroup,
  onOpenGroupInfo,
  onInviteGroup,
}: GroupSwitcherModalProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 120,
        tolerance: 8,
      },
    }),
  );

  if (!isMounted) return null;

  const visibleGroups = isEditMode ? editableGroups : groups;
  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    onReorder(String(active.id), String(over.id));
  };

  return (
    <>
      <div
        className={`absolute inset-0 z-40 transition-opacity duration-200 ${
          isOpen
            ? "bg-[#d9d9d9] opacity-50"
            : "bg-[#d9d9d9] opacity-0"
        }`}
        onClick={onClose}
      />
      <div
        className={`absolute left-0 right-0 bottom-0 z-50 bg-gray-30 rounded-t-[20px] rounded-b-none px-5 pt-3 pb-0 ${
          isDragging ? "" : "transition-transform duration-200 ease-out"
        }`}
        style={{
          transform: isOpen
            ? `translateY(${dragOffset}px)`
            : "translateY(100%)",
        }}
      >
        <div
          className="w-16 h-[5px] bg-gray-100 rounded-[100px] mx-auto mb-5 cursor-grab active:cursor-grabbing touch-none"
          onPointerDown={onHandlePointerDown}
          onPointerMove={onHandlePointerMove}
          onPointerUp={onHandlePointerUp}
          onPointerCancel={onHandlePointerUp}
        />

        <div className="mt-2 mb-3 flex items-center justify-between">
          <p className="text-body2-semibold text-gray-500">그룹 목록</p>
          {groups.length > 0 && (
            <button
              type="button"
              disabled={isSavingOrder}
              onClick={isEditMode ? onCompleteOrderEdit : onToggleOrderEdit}
              className={`text-body2-semibold cursor-pointer ${
                isSavingOrder ? "opacity-60" : ""
              }`}
              style={{
                color: isEditMode ? BRAND_COLORS.red : BRAND_COLORS.gray,
              }}
            >
              {isEditMode ? "편집 완료" : "순서 편집"}
            </button>
          )}
        </div>

        <div className="space-y-0 mb-3 max-h-[220px] overflow-y-auto">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis, restrictToParentElement]}
          >
            <SortableContext
              items={visibleGroups.map((group) => group.teamId)}
              strategy={verticalListSortingStrategy}
            >
              {visibleGroups.map((group) => (
                <SortableGroupItem
                  key={group.teamId}
                  group={group}
                  isSelected={String(group.teamId) === String(selectedTeamId)}
                  isEditMode={isEditMode}
                  onSelect={onSelectGroup}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>

        <button
          type="button"
          onClick={onCreateGroup}
          className="w-full h-12 px-5 py-3 rounded-[100px] bg-gray-50 border border-gray-100 cursor-pointer mb-2 flex items-center justify-center gap-2"
        >
          <Image
            src="/images/transaction/v2/증가_가능.svg"
            alt="그룹 추가"
            width={24}
            height={24}
          />
          <span className="text-body1-semibold text-gray-900">
            그룹 새로 만들기
          </span>
        </button>

        <div className="-mx-5 py-4">
          <div className="border-t border-gray-100" />
        </div>

        <div className="mt-2 space-y-0">
          <button
            type="button"
            onClick={onOpenGroupInfo}
            className="w-full h-[46px] py-3 text-left text-body1-semibold text-gray-900 cursor-pointer"
          >
            {infoActionLabel}
          </button>
          <button
            type="button"
            onClick={onInviteGroup}
            className="w-full h-[46px] py-3 text-left text-body1-semibold text-gray-900 cursor-pointer mb-8"
          >
            그룹 초대하기
          </button>
        </div>
      </div>
    </>
  );
}

interface SortableGroupItemProps {
  group: Group;
  isSelected: boolean;
  isEditMode: boolean;
  onSelect: (teamId: string) => void;
}

function SortableGroupItem({
  group,
  isSelected,
  isEditMode,
  onSelect,
}: SortableGroupItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: group.teamId,
      disabled: !isEditMode,
    });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const labelColor =
    group.label && group.label in BRAND_COLORS
      ? BRAND_COLORS[group.label as keyof typeof BRAND_COLORS]
      : BRAND_COLORS.gray;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`w-full h-[46px] px-2 py-3 flex items-center ${
        isEditMode ? "cursor-default" : "cursor-pointer"
      } ${isDragging ? "opacity-80" : ""}`}
    >
      <button
        type="button"
        onClick={() => onSelect(group.teamId)}
        disabled={isEditMode}
        className="min-w-0 flex-1 flex items-center gap-4 text-left disabled:cursor-default"
      >
        <span
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: labelColor }}
        />
        <span className="text-body1-semibold text-gray-900 truncate">
          {group.title}
        </span>
      </button>

      {isEditMode ? (
        <button
          type="button"
          aria-label={`${group.title} 순서 이동`}
          className="ml-4 flex-shrink-0 p-0.5 cursor-grab active:cursor-grabbing touch-none"
          {...attributes}
          {...listeners}
        >
          <Image
            src="/images/transaction/v2/햄버거_메뉴.svg"
            alt=""
            aria-hidden
            width={20}
            height={20}
          />
        </button>
      ) : (
        isSelected && (
          <Image
            src="/images/transaction/v2/체크_블랙.svg"
            alt="선택됨"
            width={24}
            height={24}
            className="ml-4 flex-shrink-0"
          />
        )
      )}
    </div>
  );
}
