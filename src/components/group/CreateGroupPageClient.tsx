// components/group/CreateGroupPageClient.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createGroup } from "@/services/groupService";
import { BRAND_COLORS } from "@/constants/brandColors";
import BottomButton from "@/components/ui/BottomButton";
import { useToastStore } from "@/stores/useToastStore";
// 라벨 컬러 옵션
const LABEL_COLORS = [
  { id: "gray", value: BRAND_COLORS.gray },
  { id: "green", value: BRAND_COLORS.green },
  { id: "blue", value: BRAND_COLORS.blue },
  { id: "red", value: BRAND_COLORS.red },
  { id: "yellow", value: BRAND_COLORS.yellow },
];
export default function CreateGroupPageClient() {
  const router = useRouter();
  const addToast = useToastStore((state) => state.addToast);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  // 폼 상태
  const [title, setTitle] = useState<string>("");
  const [memberLimit, setMemberLimit] = useState<number>(1);
  const [selectedColor, setSelectedColor] = useState<string>(
    LABEL_COLORS[0].id
  );
  const [purpose, setPurpose] = useState<string>("");
  // 폼 유효성 검사
  useEffect(() => {
    setIsFormValid(
      title.trim().length > 0 && memberLimit >= 1 && memberLimit <= 10
    );
  }, [title, memberLimit]);
  // 그룹명 입력 핸들러
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length <= 20) {
      setTitle(value);
    }
  };
  // 멤버수 증가
  const handleIncreaseMember = () => {
    if (memberLimit < 10) {
      setMemberLimit((prev) => prev + 1);
    }
  };
  // 멤버수 감소
  const handleDecreaseMember = () => {
    if (memberLimit > 1) {
      setMemberLimit((prev) => prev - 1);
    }
  };
  // 목표 입력 핸들러
  const handlePurposeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length <= 30) {
      setPurpose(value);
    }
  };
  // 그룹 생성 핸들러
  const handleSubmit = async () => {
    if (isSubmitting || !isFormValid) return;
    setIsSubmitting(true);
    try {
      const groupData = {
        title: title.trim(),
        memberLimit: memberLimit,
        purpose: purpose.trim() || null,
        label: selectedColor,
      };
      const response = await createGroup(groupData);
      const inviteCode = response;
      router.push(
        `/group/create/success?code=${inviteCode}&title=${encodeURIComponent(
          title
        )}`
      );
    } catch (error: any) {
      addToast("error", error.message || "그룹 생성 중 오류가 발생했습니다.");
      setIsSubmitting(false);
    }
  };
  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden">
      {/* 헤더 */}
      <div className="z-50 bg-white">
        <div className="flex items-center h-[48px] px-0">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center ml-5 cursor-pointer"
          >
            <Image
              src="/images/transaction/v2/뒤로가기_버튼.svg"
              alt="뒤로가기"
              width={24}
              height={24}
            />
          </button>
          <h1 className="ml-3 text-subtitle text-gray-900">그룹 생성</h1>
        </div>
      </div>
      {/* 폼 내용 */}
      <div className="flex-1 px-5 pt-6 pb-6 overflow-y-auto scrollbar-hide">
        {/* 그룹명 */}
        <div className="mb-8">
          <label className="flex items-start gap-1 mb-2 h-[21px]">
            <span className="text-body2-semibold text-gray-600 leading-[21px]">
              그룹명
            </span>
            <div className="w-1 h-1 rounded-full bg-red-500 mt-1" />
          </label>
          <input
            type="text"
            className="w-full px-4 py-3 text-body1-regular text-gray-900 placeholder:text-gray-400 bg-white rounded-[12px] border border-gray-100 focus:border-gray-850 focus:outline-none transition-colors"
            placeholder="ex. 2026 오사카 여행"
            value={title}
            onChange={handleTitleChange}
            maxLength={20}
          />
        </div>
        {/* 멤버수 */}
        <div className="mb-8">
          <label className="flex items-start gap-1 mb-2 h-[21px]">
            <span className="text-body2-semibold text-gray-600 leading-[21px]">
              멤버수
            </span>
            <div className="w-1 h-1 rounded-full bg-red-500 mt-1" />
          </label>
          <div className="flex items-center justify-between w-full px-4 py-3 bg-white rounded-[12px] border border-gray-100">
            <button
              onClick={handleDecreaseMember}
              disabled={memberLimit <= 1}
              className="flex items-center justify-center w-5 h-5 cursor-pointer disabled:cursor-not-allowed"
            >
              <Image
                src={`/images/transaction/v2/감소_${
                  memberLimit <= 1 ? "불가" : "가능"
                }.svg`}
                alt="감소"
                width={20}
                height={20}
              />
            </button>
            <span className="text-body1-regular text-gray-900">
              {memberLimit}명
            </span>
            <button
              onClick={handleIncreaseMember}
              disabled={memberLimit >= 10}
              className="flex items-center justify-center w-5 h-5 cursor-pointer disabled:cursor-not-allowed"
            >
              <Image
                src={`/images/transaction/v2/증가_${
                  memberLimit >= 10 ? "불가" : "가능"
                }.svg`}
                alt="증가"
                width={20}
                height={20}
              />
            </button>
          </div>
          <p className="mt-2 text-caption1-medium text-gray-400 text-left">
            최대 10명까지 가능해요. 이후 수정은 불가능해요.
          </p>
        </div>
        {/* 라벨 컬러 */}
        <div className="mb-8">
          <label className="flex items-start gap-1 mb-2 h-[21px]">
            <span className="text-body2-semibold text-gray-600 leading-[21px]">
              라벨 컬러
            </span>
            <div className="w-1 h-1 rounded-full bg-red-500 mt-1" />
          </label>
          <div className="flex items-center gap-4">
            {LABEL_COLORS.map((color) => (
              <button
                key={color.id}
                onClick={() => setSelectedColor(color.id)}
                className={`flex items-center justify-center w-[44px] h-[44px] rounded-full cursor-pointer ${
                  selectedColor === color.id
                    ? "border-2 border-gray-900"
                    : "border border-gray-100"
                }`}
              >
                <div
                  className="w-[36px] h-[36px] rounded-full"
                  style={{ backgroundColor: color.value }}
                />
              </button>
            ))}
          </div>
        </div>
        {/* 목표 */}
        <div>
          <label className="flex items-start gap-1 mb-2 h-[21px]">
            <span className="text-body2-semibold text-gray-600 leading-[21px]">
              목표
            </span>
          </label>
          <input
            type="text"
            className="w-full px-4 py-3 text-body1-regular text-gray-900 placeholder:text-gray-400 bg-white rounded-[12px] border border-gray-100 focus:border-gray-850 focus:outline-none transition-colors"
            placeholder="ex. 하루 10만원으로 여행하기"
            value={purpose}
            onChange={handlePurposeChange}
            maxLength={30}
          />
        </div>
      </div>
      {/* 하단 고정 버튼 */}
      <BottomButton
        text={isSubmitting ? "생성 중..." : "그룹 생성하기"}
        onClick={handleSubmit}
        disabled={!isFormValid || isSubmitting}
        className="pb-4" 
      />
    </div>
  );
}
