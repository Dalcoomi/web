// components/auth/SignUpInfoClient.tsx
"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { signUp } from "@/services/authService";

export default function SignUpInfoClient() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userInfo, setUserInfo] = useState({
    name: "",
    nickname: "",
    birthdate: "",
    gender: "",
  });
  const [nameError, setNameError] = useState(false);
  const [birthdateError, setBirthdateError] = useState(false);
  const [birthdateErrorMessage, setBirthdateErrorMessage] = useState("");
  const [socialData, setSocialData] = useState<{
    socialId?: string;
    socialType?: string;
    email?: string;
  }>({});

  // 접근 권한 확인
  useEffect(() => {
    // step1 완료 여부 확인
    const step1Completed = sessionStorage.getItem("signupStep1Completed");
    if (!step1Completed) {
      console.log("Step1이 완료되지 않았습니다. Step1으로 이동합니다.");
      router.replace("/sign-up/step1");
      return;
    }

    // 소셜 로그인 데이터 가져오기
    const socialDataJson = sessionStorage.getItem("socialLoginData");
    if (!socialDataJson) {
      console.log("소셜 로그인 데이터가 없습니다. 로그인 페이지로 이동합니다.");
      router.replace("/");
      return;
    }

    try {
      const parsedSocialData = JSON.parse(socialDataJson);
      setSocialData(parsedSocialData);

      // 이름 설정
      if (parsedSocialData.nickname) {
        setUserInfo((prev) => ({
          ...prev,
          name: parsedSocialData.nickname,
        }));
      }

      // 모든 초기화가 완료된 후에 로딩 상태 해제
      setIsLoading(false);
    } catch (error) {
      console.error("소셜 로그인 데이터 파싱 오류:", error);
      router.replace("/");
    }
  }, [router]);

  // 폼 유효성 검사
  useEffect(() => {
    // 이름이 유효한지 확인 (2자 이상, 한글/영문)
    const nameRegex = /^[가-힣a-zA-Z\s]{2,15}$/;
    const isNameValid =
      userInfo.name.trim().length >= 2 && nameRegex.test(userInfo.name.trim());

    // 폼 유효성 업데이트
    setIsFormValid(isNameValid);
  }, [userInfo.name]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // 이름 필드에 대한 처리
    if (name === "name") {
      // 15자 제한
      if (value.length > 15) {
        return;
      }

      // 실시간 유효성 검사 (2자 이상인지 확인)
      setNameError(value.trim().length > 0 && value.trim().length < 2);
    }

    // 생년월일 필드에 대한 처리
    if (name === "birthdate") {
      // YYYY/MM/DD 형식만 허용 (자동 포맷팅)
      const cleaned = value.replace(/[^\d]/g, ""); // 숫자만 남김
      let formatted = "";

      if (cleaned.length > 0) {
        // 연도 (YYYY)
        formatted = cleaned.substring(0, Math.min(4, cleaned.length));

        // 월 (MM)
        if (cleaned.length > 4) {
          formatted += "/" + cleaned.substring(4, Math.min(6, cleaned.length));
        }

        // 일 (DD)
        if (cleaned.length > 6) {
          formatted += "/" + cleaned.substring(6, Math.min(8, cleaned.length));
        }
      }

      // 유효성 검사 초기화 (입력 중에는 오류 표시 안 함)
      setBirthdateError(false);
      setBirthdateErrorMessage("");

      // 상태 업데이트
      setUserInfo((prev) => ({
        ...prev,
        [name]: formatted,
      }));
      return;
    }

    // 다른 필드 업데이트
    setUserInfo((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleGenderSelect = (gender: string) => {
    setUserInfo((prev) => ({
      ...prev,
      gender: prev.gender === gender ? "" : gender, // 같은 버튼 클릭 시 취소 기능
    }));
  };

  // 생년월일 유효성 검사 함수
  const validateBirthdate = useCallback((birthdate: string): boolean => {
    // 비어있으면 유효 (필수 항목 아님)
    if (!birthdate.trim()) {
      return true;
    }

    // YYYY/MM/DD 형식 확인
    const birthdateRegex = /^\d{4}\/\d{2}\/\d{2}$/;
    if (!birthdateRegex.test(birthdate)) {
      setBirthdateErrorMessage("올바른 형식(YYYY/MM/DD)으로 입력해주세요");
      return false;
    }

    // 날짜 객체로 변환
    const [year, month, day] = birthdate.split("/").map(Number);
    const date = new Date(year, month - 1, day);

    // 유효한 날짜인지 확인
    if (
      date.getFullYear() !== year ||
      date.getMonth() + 1 !== month ||
      date.getDate() !== day
    ) {
      setBirthdateErrorMessage("유효하지 않은 날짜입니다");
      return false;
    }

    // 미래 날짜인지 확인
    if (date > new Date()) {
      setBirthdateErrorMessage("미래 날짜는 입력할 수 없습니다");
      return false;
    }

    // 1900년 이전인지 확인
    if (year < 1900) {
      setBirthdateErrorMessage("1900년 이후 날짜를 입력해주세요");
      return false;
    }

    return true;
  }, []);

  // 폼 제출 처리
  const handleSubmit = async () => {
    // 이미 제출 중이면 무시
    if (isSubmitting) {
      console.log("이미 처리 중입니다.");
      return;
    }

    let isValid = true;

    // 이름 유효성 검사
    if (!userInfo.name || userInfo.name.trim().length < 2) {
      setNameError(true);
      setTimeout(() => {
        alert("이름을 다시 입력해주세요. (2자 이상 15자 이하)");
      }, 10);
      isValid = false;
      return;
    }

    // 한글, 영문만 포함하는지 확인
    const nameRegex = /^[가-힣a-zA-Z\s]{2,15}$/;
    if (!nameRegex.test(userInfo.name.trim())) {
      setNameError(true);
      setTimeout(() => {
        alert("이름은 한글, 영문만 입력 가능합니다.");
      }, 10);
      isValid = false;
      return;
    }

    // 생년월일 유효성 검사
    const isBirthdateValid = validateBirthdate(userInfo.birthdate);
    if (!isBirthdateValid) {
      setBirthdateError(true);
      setTimeout(() => {
        alert(birthdateErrorMessage);
      }, 10);
      isValid = false;
      return;
    }

    if (!isValid) return;

    // 제출 시작
    console.log("회원가입 제출 시작");
    setIsSubmitting(true);

    try {
      // 약관 동의 정보 가져오기
      const agreementDataJson = sessionStorage.getItem("agreementData");
      if (!agreementDataJson) {
        throw new Error("약관 동의 정보가 없습니다.");
      }

      const { service: serviceAgreement, privacy: collectionAgreement } =
        JSON.parse(agreementDataJson);

      // 생년월일 형식 변환
      let formattedBirthday = null;
      if (userInfo.birthdate) {
        formattedBirthday = userInfo.birthdate.replace(/\//g, "-");
      }

      // API 요청 데이터 준비
      const signUpData = {
        socialId: socialData.socialId,
        socialType: socialData.socialType,
        email: socialData.email,
        name: userInfo.name.trim(),
        birthday: formattedBirthday,
        gender: userInfo.gender || null,
        serviceAgreement,
        collectionAgreement,
      };

      // API 서비스로 회원가입 요청
      const response = await signUp(signUpData);

      console.log("회원가입 성공:", response);

      // 로그인 토큰을 success 페이지로 전달하기 위해 sessionStorage에 저장
      sessionStorage.setItem("signupResponse", JSON.stringify(response));

      // step2 완료 표시 (success 페이지 접근 권한용)
      sessionStorage.setItem("signupStep2Completed", "true");

      // 성공 페이지로 이동
      router.push("/sign-up/success");
    } catch (error) {
      console.error("회원가입 오류:", error);
      alert(error.message || "회원가입 처리 중 오류가 발생했습니다.");

      if (error.message.includes("약관 동의")) {
        router.push("/sign-up/step1");
      }

      // 에러 발생 시에만 다시 활성화
      setIsSubmitting(false);
    }
  };

  // 이전 단계로 이동
  const handleBack = () => {
    router.push("/sign-up/step1");
  };

  // 로딩 중이면 로딩 표시
  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <div className="text-center">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 상단 단계 표시 */}
      <div className="flex justify-center mt-6 mb-6">
        <div className="flex space-x-2">
          <div
            className="w-8 h-8 rounded-full bg-[#DDECFF] text-[#D4D4D4] flex items-center justify-center cursor-pointer"
            onClick={handleBack}
          >
            1
          </div>
          <div className="w-8 h-8 rounded-full bg-[#0EABFF] text-white flex items-center justify-center">
            2
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 px-5">
        <h1 className="text-xl font-medium text-left mb-6">
          회원 정보를 입력해주세요
        </h1>

        {/* 소셜 로그인 정보 표시 */}
        {socialData.email && (
          <div className="mb-6 p-3 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-600">
              <span className="font-medium">연결된 계정 :</span>{" "}
              {socialData.email}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {socialData.socialType === "KAKAO" ? "카카오" : "소셜"} 계정으로
              가입합니다
            </p>
          </div>
        )}

        {/* 입력 폼 */}
        <div className="space-y-7">
          {/* 이름 */}
          <div>
            <label className="block text-sm font-medium">
              이름<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={userInfo.name}
              onChange={handleInputChange}
              placeholder="달쿠미"
              className={`w-full p-1 border-b ${
                nameError
                  ? "border-red-500 focus:border-red-500"
                  : "border-gray-300 focus:border-blue-500"
              } focus:outline-none`}
            />
            {nameError && (
              <p className="text-red-500 text-xs mt-1">
                2자 ~ 15자 사이의 한글, 영문으로 입력해주세요
              </p>
            )}
          </div>

          {/* 생년월일 */}
          <div>
            <label className="block text-sm font-medium">생년월일</label>
            <input
              type="text"
              name="birthdate"
              value={userInfo.birthdate}
              onChange={handleInputChange}
              placeholder="2001/01/01"
              className={`w-full p-1 border-b ${
                birthdateError
                  ? "border-red-500 focus:border-red-500"
                  : "border-gray-300 focus:border-blue-500"
              } focus:outline-none`}
            />
            {birthdateError && (
              <p className="text-red-500 text-xs mt-1">
                {birthdateErrorMessage}
              </p>
            )}
          </div>

          {/* 성별 */}
          <div>
            <label className="block text-sm font-medium mb-2">성별</label>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => handleGenderSelect("남성")}
                className={`flex-1 py-2 border-2 rounded-[10px] transition-colors cursor-pointer ${
                  userInfo.gender === "남성"
                    ? "border-[#2FA5FF] text-[#2FA5FF] bg-[#DDECFF]"
                    : "border-[#808080] bg-white text-[#808080]"
                }`}
              >
                남
              </button>
              <button
                type="button"
                onClick={() => handleGenderSelect("여성")}
                className={`flex-1 py-2 border-2 rounded-[10px] transition-colors cursor-pointer ${
                  userInfo.gender === "여성"
                    ? "border-[#2FA5FF] text-[#2FA5FF] bg-[#DDECFF]"
                    : "border-[#808080] bg-white text-[#808080]"
                }`}
              >
                여
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 완료 버튼 */}
      <div className="px-7 pb-7 mt-6">
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
            <span className="flex items-center justify-center">
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
    </div>
  );
}
