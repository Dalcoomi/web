"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SignUpInfo() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [userInfo, setUserInfo] = useState({
    name: "",
    nickname: "",
    birthdate: "",
    gender: "",
  });
  const [nameError, setNameError] = useState(false);
  const [birthdateError, setBirthdateError] = useState(false);
  const [birthdateErrorMessage, setBirthdateErrorMessage] = useState("");

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
  const validateBirthdate = (birthdate: string): boolean => {
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
  };

  const handleSubmit = async () => {
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

    try {
      setIsSubmitting(true);

      // 서버로 전송할 데이터 준비
      const userData = {
        name: userInfo.name.trim(),
        nickname: userInfo.nickname.trim(),
        birthdate: userInfo.birthdate.trim(),
        gender: userInfo.gender,
      };

      // API 엔드포인트로 POST 요청 보내기
      // 실제 API URL로 변경 필요
      const response = await fetch("/api/sign-up", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error("회원가입 처리 중 오류가 발생했습니다.");
      }

      const data = await response.json();
      console.log("회원가입 성공:", data);

      // 회원가입 성공 페이지로 이동
      router.push("/sign-up/success");
    } catch (error) {
      console.error("회원가입 오류:", error);
      alert("회원가입 처리 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 상단 단계 표시 */}
      <div className="flex justify-center mt-6 mb-6">
        <div className="flex space-x-2">
          <div className="w-8 h-8 rounded-full bg-[#DDECFF] text-[#D4D4D4] flex items-center justify-center">
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
                onClick={() => handleGenderSelect("male")}
                className={`flex-1 py-2 border-2 rounded-[10px] transition-colors cursor-pointer ${
                  userInfo.gender === "male"
                    ? "border-[#2FA5FF] text-[#2FA5FF] bg-[#DDECFF]"
                    : "border-[#808080] bg-white text-[#808080]"
                }`}
              >
                남
              </button>
              <button
                type="button"
                onClick={() => handleGenderSelect("female")}
                className={`flex-1 py-2 border-2 rounded-[10px] transition-colors cursor-pointer ${
                  userInfo.gender === "female"
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
            isFormValid
              ? isSubmitting
                ? "bg-[#0EABFF] opacity-70 cursor-not-allowed text-white"
                : "bg-[#0EABFF] hover:bg-blue-500 cursor-pointer text-white"
              : "bg-gray-300 text-white cursor-not-allowed"
          }`}
          onClick={handleSubmit}
          disabled={!isFormValid || isSubmitting}
        >
          {isSubmitting ? "처리 중..." : "완료"}
        </button>
      </div>
    </div>
  );
}
