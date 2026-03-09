"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ChangeEvent } from "react";
import { BRAND_COLORS } from "@/constants/brandColors";
import BottomButton from "@/components/ui/BottomButton";
import { createGroup, getGroups } from "@/services/groupService";
import { useToastStore } from "@/stores/useToastStore";

const LABEL_COLORS = [
  { id: "gray", value: BRAND_COLORS.gray },
  { id: "green", value: BRAND_COLORS.green },
  { id: "blue", value: BRAND_COLORS.blue },
  { id: "red", value: BRAND_COLORS.red },
  { id: "yellow", value: BRAND_COLORS.yellow },
] as const;

const MIN_MEMBER_LIMIT = 1;
const MAX_MEMBER_LIMIT = 10;
const MAX_GROUPS_PER_MEMBER = 3;

const TEXT = {
  back: "뒤로가기",
  title: "그룹 생성",
  groupName: "그룹명",
  memberLimit: "인원수",
  labelColor: "라벨 컬러",
  goal: "목표",
  memberUnit: "명",
  memberHelper:
    "최대 10명까지 가능해요. 이후 수정은 불가능해요.",
  groupNamePlaceholder: "ex. 2026 오사카 여행",
  goalPlaceholder: "ex. 하루 10만원으로 여행하기",
  submit: "그룹 생성하기",
  submitting: "생성 중..",
  maxGroupsReached:
    "이미 최대 3개 그룹에 참여 중이어서 새 그룹을 만들 수 없어요.",
  error:
    "그룹 생성 중 오류가 발생했습니다.",
} as const;

const ICONS = {
  back: "/images/transaction/v2/뒤로가기_버튼.svg",
  decreaseEnabled: "/images/transaction/v2/감소_가능.svg",
  decreaseDisabled: "/images/transaction/v2/감소_불가.svg",
  increaseEnabled: "/images/transaction/v2/증가_가능.svg",
  increaseDisabled: "/images/transaction/v2/증가_불가.svg",
} as const;

function clampMemberLimit(value: number) {
  return Math.min(MAX_MEMBER_LIMIT, Math.max(MIN_MEMBER_LIMIT, value));
}

export default function CreateGroupPageClient() {
  const router = useRouter();
  const addToast = useToastStore((state) => state.addToast);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [title, setTitle] = useState("");
  const [memberLimit, setMemberLimit] = useState(MIN_MEMBER_LIMIT);
  const [memberLimitInput, setMemberLimitInput] = useState(
    String(MIN_MEMBER_LIMIT),
  );
  const [selectedColor, setSelectedColor] = useState(LABEL_COLORS[0].id);
  const [purpose, setPurpose] = useState("");

  useEffect(() => {
    setIsFormValid(
      title.trim().length > 0 &&
        memberLimit >= MIN_MEMBER_LIMIT &&
        memberLimit <= MAX_MEMBER_LIMIT,
    );
  }, [title, memberLimit]);

  const handleTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length <= 20) {
      setTitle(value);
    }
  };

  const syncMemberLimit = (next: number) => {
    const clamped = clampMemberLimit(next);
    setMemberLimit(clamped);
    setMemberLimitInput(String(clamped));
  };

  const handleIncreaseMember = () => {
    syncMemberLimit(memberLimit + 1);
  };

  const handleDecreaseMember = () => {
    syncMemberLimit(memberLimit - 1);
  };

  const handleMemberLimitChange = (e: ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 2);

    setMemberLimitInput(digitsOnly);

    if (!digitsOnly) {
      setMemberLimit(0);
      return;
    }

    const parsed = Number(digitsOnly);
    if (Number.isNaN(parsed)) {
      setMemberLimit(0);
      return;
    }

    setMemberLimit(parsed);
  };

  const handleMemberLimitBlur = () => {
    syncMemberLimit(memberLimit);
  };

  const handlePurposeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length <= 30) {
      setPurpose(value);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting || !isFormValid) return;

    setIsSubmitting(true);
    try {
      const groupsResponse = await getGroups();
      const groupCount = groupsResponse.groups?.length ?? 0;

      if (groupCount >= MAX_GROUPS_PER_MEMBER) {
        addToast("info", TEXT.maxGroupsReached);
        setIsSubmitting(false);
        return;
      }

      const groupData = {
        title: title.trim(),
        memberLimit,
        purpose: purpose.trim() || null,
        label: selectedColor,
      };

      const inviteCode = await createGroup(groupData);
      router.push(
        `/group/create/success?code=${inviteCode}&title=${encodeURIComponent(title)}`,
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : TEXT.error;
      addToast("error", message || TEXT.error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white">
      <div className="z-50 bg-white">
        <div className="flex h-[48px] items-center px-0">
          <button
            type="button"
            onClick={() => router.back()}
            className="ml-5 flex cursor-pointer items-center justify-center"
          >
            <Image src={ICONS.back} alt={TEXT.back} width={24} height={24} />
          </button>
          <h1 className="ml-3 text-subtitle text-gray-900">{TEXT.title}</h1>
        </div>
      </div>

      <div className="scrollbar-hide flex-1 overflow-y-auto px-5 pt-6 pb-6">
        <div className="mb-8">
          <label className="mb-2 flex h-[21px] items-start gap-1">
            <span className="text-body2-semibold leading-[21px] text-gray-600">
              {TEXT.groupName}
            </span>
            <div className="mt-1 h-1 w-1 rounded-full bg-red-500" />
          </label>
          <input
            type="text"
            className="w-full rounded-[12px] border border-gray-100 bg-white px-4 py-3 text-body1-regular text-gray-900 placeholder:text-gray-400 transition-colors focus:border-gray-850 focus:outline-none"
            placeholder={TEXT.groupNamePlaceholder}
            value={title}
            onChange={handleTitleChange}
            maxLength={20}
          />
        </div>

        <div className="mb-8">
          <label className="mb-2 flex h-[21px] items-start gap-1">
            <span className="text-body2-semibold leading-[21px] text-gray-600">
              {TEXT.memberLimit}
            </span>
            <div className="mt-1 h-1 w-1 rounded-full bg-red-500" />
          </label>
          <div className="flex w-full items-center justify-between rounded-[12px] border border-gray-100 bg-white px-4 py-3">
            <button
              type="button"
              onClick={handleDecreaseMember}
              disabled={memberLimit <= MIN_MEMBER_LIMIT}
              className="flex h-5 w-5 cursor-pointer items-center justify-center disabled:cursor-not-allowed"
            >
              <Image
                src={
                  memberLimit <= MIN_MEMBER_LIMIT
                    ? ICONS.decreaseDisabled
                    : ICONS.decreaseEnabled
                }
                alt="-"
                width={20}
                height={20}
              />
            </button>

            <div className="flex items-baseline gap-[2px]">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={memberLimitInput}
                onChange={handleMemberLimitChange}
                onBlur={handleMemberLimitBlur}
                className="w-[2ch] min-w-[20px] bg-transparent text-right text-body1-regular text-gray-900 outline-none"
              />
              <span className="text-body1-regular text-gray-900">
                {TEXT.memberUnit}
              </span>
            </div>

            <button
              type="button"
              onClick={handleIncreaseMember}
              disabled={memberLimit >= MAX_MEMBER_LIMIT}
              className="flex h-5 w-5 cursor-pointer items-center justify-center disabled:cursor-not-allowed"
            >
              <Image
                src={
                  memberLimit >= MAX_MEMBER_LIMIT
                    ? ICONS.increaseDisabled
                    : ICONS.increaseEnabled
                }
                alt="+"
                width={20}
                height={20}
              />
            </button>
          </div>
          <p className="mt-2 text-left text-caption1-medium text-gray-400">
            {TEXT.memberHelper}
          </p>
        </div>

        <div className="mb-8">
          <label className="mb-2 flex h-[21px] items-start gap-1">
            <span className="text-body2-semibold leading-[21px] text-gray-600">
              {TEXT.labelColor}
            </span>
            <div className="mt-1 h-1 w-1 rounded-full bg-red-500" />
          </label>
          <div className="flex items-center gap-4">
            {LABEL_COLORS.map((color) => (
              <button
                key={color.id}
                type="button"
                onClick={() => setSelectedColor(color.id)}
                className={`flex h-[44px] w-[44px] cursor-pointer items-center justify-center rounded-full ${
                  selectedColor === color.id
                    ? "border-2 border-gray-900"
                    : "border border-gray-100"
                }`}
              >
                <div
                  className="h-[36px] w-[36px] rounded-full"
                  style={{ backgroundColor: color.value }}
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 flex h-[21px] items-start gap-1">
            <span className="text-body2-semibold leading-[21px] text-gray-600">
              {TEXT.goal}
            </span>
          </label>
          <input
            type="text"
            className="w-full rounded-[12px] border border-gray-100 bg-white px-4 py-3 text-body1-regular text-gray-900 placeholder:text-gray-400 transition-colors focus:border-gray-850 focus:outline-none"
            placeholder={TEXT.goalPlaceholder}
            value={purpose}
            onChange={handlePurposeChange}
            maxLength={30}
          />
        </div>
      </div>

      <BottomButton
        text={isSubmitting ? TEXT.submitting : TEXT.submit}
        onClick={handleSubmit}
        disabled={!isFormValid || isSubmitting}
        className="pb-4"
      />
    </div>
  );
}
