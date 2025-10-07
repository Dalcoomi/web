// components/group/CreateGroupPageClient.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createGroup } from "@/services/groupService";
import TopBar from "@/components/ui/TopBar";
import BottomBar from "@/components/ui/BottomBar";

export default function CreateGroupPageClient() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);

  // 폼 상태
  const [title, setTitle] = useState<string>("");
  const [memberLimit, setMemberLimit] = useState<string>("");
  const [purpose, setPurpose] = useState<string>("");

  // 에러 상태
  const [groupNameError, setGroupNameError] = useState(false);
  const [groupNameTouched, setGroupNameTouched] = useState(false);
  const [memberLimitError, setMemberLimitError] = useState(false);
  const [memberLimitTouched, setMemberLimitTouched] = useState(false);

  // 폼 유효성 검사
  useEffect(() => {
    // 그룹명과 인원 수가 모두 입력되고, 인원 수가 1-10 범위에 있는지 확인
    const memberCount = Number(memberLimit);
    const isValidMemberCount = memberCount >= 1 && memberCount <= 10;
    setIsFormValid(
      title.trim().length > 0 &&
        memberLimit.trim().length > 0 &&
        isValidMemberCount
    );
  }, [title, memberLimit]);

  // 그룹명 입력 핸들러
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    // 입력하는 동안 에러 상태 해제
    if (e.target.value.trim().length > 0) {
      setGroupNameError(false);
    }
  };

  // 인원 수 입력 핸들러
  const handleMemberLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 숫자만 허용
    const value = e.target.value.replace(/[^\d]/g, "");

    // 빈 값이거나 1-10 범위의 숫자만 허용
    if (value === "" || (Number(value) >= 1 && Number(value) <= 10)) {
      setMemberLimit(value);
      // 유효한 값을 입력하는 동안 에러 상태 해제
      if (value !== "" && Number(value) >= 1 && Number(value) <= 10) {
        setMemberLimitError(false);
      }
    }
  };

  // 목표 입력 핸들러
  const handlePurposeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPurpose(e.target.value);
  };

  // 인원 수 유효성 검사
  const validateMemberLimit = (value: string) => {
    if (value.trim() === "") {
      return "인원 수를 입력해 주세요.";
    }
    const memberCount = Number(value);
    if (memberCount < 1 || memberCount > 10) {
      return "인원 수는 1명에서 10명 사이여야 합니다.";
    }
    return "";
  };

  // 그룹 생성 핸들러
  const handleSubmit = async () => {
    // 이미 제출 중이면 무시
    if (isSubmitting) {
      return;
    }

    if (!isFormValid) return;

    // 제출 시작
    setIsSubmitting(true);

    try {
      // API 요청을 위한 데이터 구조화
      const groupData = {
        title: title.trim(),
        memberLimit: Number(memberLimit),
        purpose: purpose.trim() || null,
      };

      const response = await createGroup(groupData);

      // 성공 시 초대 코드와 함께 성공 페이지로 이동
      const inviteCode = response;
      router.push(`/group/create/success?code=${inviteCode}`);
    } catch (error) {
      alert(error.message || "그룹 생성 중 오류가 발생했습니다.");

      // 에러 발생 시에만 다시 활성화
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      <TopBar />

      {/* 그룹 생성 제목 블록 */}
      <div className="bg-[#11ABFF] text-white px-4 py-2 flex items-center">
        <h1 className="text-xl font-light">그룹 생성</h1>
      </div>

      {/* 폼 내용 */}
      <div className="flex-1 px-4 py-6">
        {/* 그룹명 입력 */}
        <div className="mb-6">
          <label className="block font-medium text-md mb-1">
            그룹명<span className="text-[#FF472F]">*</span>
          </label>
          <input
            type="text"
            className={`w-full p-2 border-b focus:outline-none text-sm transition-colors ${
              groupNameError && groupNameTouched
                ? "border-red-500 focus:border-red-500"
                : "border-gray-300 focus:border-blue-500"
            }`}
            placeholder="그룹명을 입력해주세요"
            value={title}
            onChange={handleTitleChange}
            onBlur={(e) => {
              if (e.target.value.trim() === "") {
                setGroupNameError(true);
              } else {
                setGroupNameError(false);
              }
            }}
            onFocus={() => setGroupNameTouched(true)}
            inputMode="text"
            autoComplete="off"
            enterKeyHint="done"
          />
          {groupNameError && groupNameTouched && (
            <p className="text-red-500 text-xs mt-1 ml-2">
              그룹명을 입력해주세요
            </p>
          )}
        </div>

        {/* 인원 수 입력 */}
        <div className="mb-6">
          <label className="block font-medium text-md mb-1">
            인원 수<span className="text-[#FF472F]">*</span>
            <span className="text-sm ml-1">(최대 10명, 수정 불가)</span>
          </label>
          <input
            type="text"
            className={`w-full p-2 border-b focus:outline-none text-sm transition-colors ${
              memberLimitError && memberLimitTouched
                ? "border-red-500 focus:border-red-500"
                : "border-gray-300 focus:border-blue-500"
            }`}
            placeholder="인원 수를 입력해주세요"
            value={memberLimit}
            onChange={handleMemberLimitChange}
            onBlur={(e) => {
              const errorMessage = validateMemberLimit(e.target.value);
              setMemberLimitError(errorMessage !== "");
            }}
            onFocus={() => setMemberLimitTouched(true)}
            inputMode="numeric"
            autoComplete="off"
            enterKeyHint="done"
            maxLength={2}
          />
          {memberLimitError && memberLimitTouched && (
            <p className="text-red-500 text-xs mt-1 ml-2">
              {validateMemberLimit(memberLimit)}
            </p>
          )}
        </div>

        {/* 목표 입력 */}
        <div className="mb-6">
          <label className="block font-medium text-md mb-1">목표</label>
          <input
            type="text"
            className="w-full p-2 border-b border-gray-300 focus:border-blue-500 focus:outline-none text-sm transition-colors"
            placeholder="목표를 입력해주세요"
            value={purpose}
            onChange={handlePurposeChange}
            inputMode="text"
            autoComplete="off"
            enterKeyHint="done"
          />
        </div>
      </div>

      {/* 완료 버튼 */}
      <div className="px-10 pb-7 mt-auto">
        <button
          className={`w-full py-3 rounded-md font-medium transition-colors ${
            isFormValid && !isSubmitting
              ? "bg-[#0EABFF] hover:bg-blue-500 cursor-pointer text-white"
              : isSubmitting
              ? "bg-[#0EABFF] opacity-50 cursor-not-allowed text-white"
              : "bg-gray-300 text-white cursor-not-allowed"
          }`}
          onClick={handleSubmit}
          disabled={!isFormValid || isSubmitting}
          style={{ pointerEvents: isSubmitting ? "none" : "auto" }}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center cursor-not-allowed">
              <svg
                className="animate-spin h-5 w-5 mr-2"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              처리 중...
            </span>
          ) : (
            "완료"
          )}
        </button>
      </div>

      <BottomBar />
    </div>
  );
}
