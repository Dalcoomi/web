// components/group/JoinGroupPageClient.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { joinGroup } from "@/services/groupService";
import TopBar from "@/components/ui/TopBar";
import BottomBar from "@/components/ui/BottomBar";

export default function JoinGroupPageClient() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);

  // 폼 상태
  const [inviteCode, setInviteCode] = useState<string>("");

  // 에러 상태
  const [inviteCodeError, setInviteCodeError] = useState(false);
  const [inviteCodeTouched, setInviteCodeTouched] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // 폼 유효성 검사
  useEffect(() => {
    // 초대 코드가 8자리인지 확인
    setIsFormValid(inviteCode.trim().length === 8);
  }, [inviteCode]);

  // 초대 코드 입력 핸들러
  const handleInviteCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 영문자와 숫자만 허용, 대문자로 변환
    const value = e.target.value.replace(/[^A-Za-z0-9]/g, "").toUpperCase();

    // 최대 8자리까지만 허용
    if (value.length <= 8) {
      setInviteCode(value);
      // 입력하는 동안 에러 상태 해제
      if (value.length > 0) {
        setInviteCodeError(false);
        setErrorMessage("");
      }
    }
  };

  // 초대 코드 유효성 검사
  const validateInviteCode = (value: string) => {
    if (value.trim() === "") {
      return "초대 코드를 입력해 주세요.";
    }
    if (value.length !== 8) {
      return "초대 코드는 8자리여야 합니다.";
    }
    return "";
  };

  // 그룹 참가 핸들러
  const handleSubmit = async () => {
    // 이미 제출 중이면 무시
    if (isSubmitting) {
      console.log("이미 처리 중입니다.");
      return;
    }

    if (!isFormValid) return;

    // 제출 시작
    console.log("그룹 참가 시작");
    setIsSubmitting(true);

    try {
      console.log("전송할 초대 코드:", inviteCode);

      const response = await joinGroup(inviteCode);

      console.log("그룹 참가 성공", response);

      // 성공 시 그룹 메인 페이지로 이동
      router.push("/group");
    } catch (error) {
      console.error("그룹 참가 오류:", error);

      // 에러 메시지 설정
      if (
        error.message.includes("404") ||
        error.message.includes("찾을 수 없습니다")
      ) {
        setErrorMessage("존재하지 않는 초대 코드입니다.");
      } else if (
        error.message.includes("400") ||
        error.message.includes("이미")
      ) {
        setErrorMessage("이미 참가한 그룹이거나 잘못된 코드입니다.");
      } else {
        setErrorMessage(error.message || "그룹 참가 중 오류가 발생했습니다.");
      }

      setInviteCodeError(true);

      // 에러 발생 시에만 다시 활성화
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      <TopBar />

      {/* 그룹 참가 제목 블록 */}
      <div className="bg-[#11ABFF] text-white px-4 py-2 flex items-center">
        <h1 className="text-xl font-light">그룹 참가</h1>
      </div>

      {/* 폼 내용 */}
      <div className="flex-1 px-4 py-6">
        {/* 초대 코드 입력 */}
        <div className="mb-6">
          <label className="block font-medium text-md mb-1">
            초대 코드<span className="text-[#FF472F]">*</span>
          </label>
          <input
            type="text"
            className={`w-full p-2 border-b-2 focus:outline-none text-sm transition-colors ${
              (inviteCodeError && inviteCodeTouched) || errorMessage
                ? "border-red-500 focus:border-red-500"
                : "border-gray-300 focus:border-blue-500"
            }`}
            placeholder="그룹 초대 코드 8자리를 입력해 주세요."
            value={inviteCode}
            onChange={handleInviteCodeChange}
            onBlur={(e) => {
              const errorMsg = validateInviteCode(e.target.value);
              setInviteCodeError(errorMsg !== "");
              if (errorMsg) {
                setErrorMessage(errorMsg);
              }
            }}
            onFocus={() => {
              setInviteCodeTouched(true);
              setErrorMessage("");
            }}
            maxLength={8}
            autoCapitalize="characters"
          />
          {((inviteCodeError && inviteCodeTouched) || errorMessage) && (
            <p className="text-red-500 text-xs mt-1 ml-2">
              {errorMessage || validateInviteCode(inviteCode)}
            </p>
          )}
        </div>
      </div>

      {/* 완료 버튼 */}
      <div className="px-10 pb-7">
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
