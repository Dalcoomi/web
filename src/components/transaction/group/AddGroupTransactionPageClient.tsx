// components/transaction/group/AddGroupTransactionPageClient.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { addTransaction } from "@/services/transactionService";
import Image from "next/image";
import TopBar from "@/components/ui/TopBar";
import BottomBar from "@/components/ui/BottomBar";
import { getGroupInfo, GroupInfo } from "@/services/groupService";

// 지출 카테고리 목록
const expenseCategories = [
  {
    id: "식비",
    name: "식비",
    icon: "/images/카테고리/식비.svg",
    color: "#FF6B6B",
  },
  {
    id: "카페",
    name: "카페",
    icon: "/images/카테고리/카페.svg",
    color: "#4CAF50",
  },
  { id: "술", name: "술", icon: "/images/카테고리/술.svg", color: "#9C27B0" },
  {
    id: "마트",
    name: "마트",
    icon: "/images/카테고리/마트.svg",
    color: "#2196F3",
  },
  {
    id: "주거",
    name: "주거",
    icon: "/images/카테고리/주거.svg",
    color: "#00BCD4",
  },
  {
    id: "통신",
    name: "통신",
    icon: "/images/카테고리/통신.svg",
    color: "#FF9800",
  },
  {
    id: "교통",
    name: "교통",
    icon: "/images/카테고리/교통.svg",
    color: "#673AB7",
  },
  {
    id: "쇼핑",
    name: "쇼핑",
    icon: "/images/카테고리/쇼핑.svg",
    color: "#E91E63",
  },
  {
    id: "의류",
    name: "의류",
    icon: "/images/카테고리/의류.svg",
    color: "#3F51B5",
  },
  {
    id: "여행",
    name: "여행",
    icon: "/images/카테고리/여행.svg",
    color: "#8BC34A",
  },
  {
    id: "운동",
    name: "운동",
    icon: "/images/카테고리/운동.svg",
    color: "#FF5722",
  },
  {
    id: "취미",
    name: "취미",
    icon: "/images/카테고리/취미.svg",
    color: "#03A9F4",
  },
  {
    id: "반려동물",
    name: "반려동물",
    icon: "/images/카테고리/반려동물.svg",
    color: "#FFC107",
  },
  {
    id: "교육",
    name: "교육",
    icon: "/images/카테고리/교육.svg",
    color: "#607D8B",
  },
  {
    id: "외료",
    name: "외료",
    icon: "/images/카테고리/외료.svg",
    color: "#9C27B0",
  },
  {
    id: "보험",
    name: "보험",
    icon: "/images/카테고리/보험.svg",
    color: "#4CAF50",
  },
  {
    id: "선물",
    name: "선물",
    icon: "/images/카테고리/선물.svg",
    color: "#E91E63",
  },
  {
    id: "모임",
    name: "모임",
    icon: "/images/카테고리/모임.svg",
    color: "#FF9800",
  },
  {
    id: "저축",
    name: "저축",
    icon: "/images/카테고리/저축.svg",
    color: "#673AB7",
  },
  {
    id: "투자",
    name: "투자",
    icon: "/images/카테고리/투자.svg",
    color: "#2196F3",
  },
  {
    id: "대출",
    name: "대출",
    icon: "/images/카테고리/대출.svg",
    color: "#00BCD4",
  },
  {
    id: "카드대금",
    name: "카드대금",
    icon: "/images/카테고리/카드대금.svg",
    color: "#607D8B",
  },
  {
    id: "기타",
    name: "기타",
    icon: "/images/카테고리/기타.svg",
    color: "#FF5722",
  },
];

// 수입 카테고리 목록
const incomeCategories = [
  {
    id: "급여",
    name: "급여",
    icon: "/images/카테고리/수입/급여.svg",
    color: "#4CAF50",
  },
  {
    id: "용돈",
    name: "용돈",
    icon: "/images/카테고리/수입/용돈.svg",
    color: "#E91E63",
  },
  {
    id: "이체",
    name: "이체",
    icon: "/images/카테고리/수입/이체.svg",
    color: "#FF9800",
  },
  {
    id: "금융수익",
    name: "금융수익",
    icon: "/images/카테고리/수입/금융수익.svg",
    color: "#2196F3",
  },
  {
    id: "기타",
    name: "기타",
    icon: "/images/카테고리/수입/기타.svg",
    color: "#03A9F4",
  },
];

export default function AddGroupTransactionPageClient() {
  const router = useRouter();
  const params = useParams();
  const teamId = params.teamId as string; // URL에서 teamId 추출

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [transactionType, setTransactionType] = useState<"EXPENSE" | "INCOME">(
    "EXPENSE"
  );
  const [amount, setAmount] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [date, setDate] = useState<string>(
    new Date().toISOString().split("T")[0].replace(/-/g, "/")
  );
  const [category, setCategory] = useState<string>("기타");
  const [showCategoryModal, setShowCategoryModal] = useState<boolean>(false);
  const [amountError, setAmountError] = useState(false);
  const [amountTouched, setAmountTouched] = useState(false);
  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);

  // teamId 유효성 검사
  useEffect(() => {
    if (!teamId) {
      console.error("teamId가 없습니다.");
      router.replace("/group"); // teamId가 없으면 그룹 목록으로 리다이렉트
      return;
    }

    const timeoutId = setTimeout(async () => {
      if (!teamId) {
        router.replace("/group");
        return;
      }

      try {
        console.log(`그룹 정보 조회 요청: ${teamId}`);

        const response = await getGroupInfo(teamId);

        setGroupInfo(response);
      } catch (error) {
        console.error("그룹 정보 로드 오류:", error);
        alert("그룹 정보를 불러올 수 없습니다.");

        router.replace("/group");
      }
    }, 100);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [teamId, router]);

  // 폼 유효성 검사
  useEffect(() => {
    // 금액이 입력되었는지 확인
    setIsFormValid(amount.trim().length > 0);
  }, [amount]);

  // 금액 입력 핸들러
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 숫자만 허용
    const value = e.target.value.replace(/[^\d]/g, "");
    setAmount(value);
  };

  // 내용 입력 핸들러
  const handleContentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContent(e.target.value);
  };

  // 날짜 입력 핸들러
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDate(e.target.value);
  };

  // 카테고리 선택 핸들러
  const handleCategoryChange = (categoryId: string) => {
    setCategory(categoryId);
    setShowCategoryModal(false);
  };

  // 거래 유형 변경 핸들러
  const handleTransactionTypeChange = (type: "EXPENSE" | "INCOME") => {
    setTransactionType(type);
    setCategory(getDefaultCategory(type));
  };

  // 저장 핸들러
  const handleSubmit = async () => {
    // 이미 제출 중이면 무시
    if (isSubmitting) {
      console.log("이미 처리 중입니다.");
      return;
    }

    if (!isFormValid || !teamId) return;

    // 제출 시작
    console.log("그룹 거래 내역 저장 시작");
    setIsSubmitting(true);

    try {
      // 카테고리 ID를 문자열에서 숫자로 변환
      // 참고: 실제로는 API에서 카테고리 ID가 Long 타입이므로 숫자로 매핑해야 함
      const categoryIdMap = {
        // 지출 카테고리 매핑
        식비: 1,
        카페: 2,
        술: 3,
        마트: 4,
        주거: 5,
        통신: 6,
        교통: 7,
        쇼핑: 8,
        의류: 9,
        여행: 10,
        운동: 11,
        취미: 12,
        반려동물: 13,
        교육: 14,
        외료: 15,
        보험: 16,
        선물: 17,
        모임: 18,
        저축: 19,
        투자: 20,
        대출: 21,
        카드대금: 22,
        기타: 23,
        // 수입 카테고리 매핑
        급여: 101,
        용돈: 102,
        이체: 103,
        금융수익: 104,
        기타수입: 105,
      };

      // 날짜 형식 변환 (YYYY/MM/DD -> ISO 문자열)
      const dateStr = date.replace(/\//g, "-");
      const transactionDateTime = new Date(dateStr);
      // 시간을 현재 시간으로 설정 (선택사항)
      transactionDateTime.setHours(new Date().getHours());
      transactionDateTime.setMinutes(new Date().getMinutes());
      transactionDateTime.setSeconds(new Date().getSeconds());

      // API 요청을 위한, 데이터 구조화
      const transactionData = {
        categoryId: categoryIdMap[category] || 0, // 카테고리 ID 매핑
        teamId: parseInt(teamId), // teamId를 숫자로 변환하여 포함
        amount: Number(amount), // 문자열을 숫자로 변환
        content: content || null, // 내용이 없으면 null
        transactionDate: transactionDateTime.toISOString(), // ISO 형식으로 변환 (YYYY-MM-DDTHH:mm:ss.sssZ)
        transactionType: transactionType, // "EXPENSE" 또는 "INCOME"
      };

      console.log("전송할 데이터:", transactionData);

      // API 서비스로 그룹 거래 내역 저장 요청
      const response = await addTransaction(transactionData);

      await new Promise((resolve) => setTimeout(resolve, 2000));

      console.log("그룹 거래 내역 저장 성공:", response);

      // 성공 시 그룹 거래 내역 조회 페이지로 이동
      router.push(`/transaction/group/${teamId}`);
    } catch (error) {
      console.error("그룹 거래 내역 저장 오류:", error);
      alert(error.message || "그룹 거래 내역 저장 중 오류가 발생했습니다.");

      // 에러 발생 시에만 다시 활성화
      setIsSubmitting(false);
    }
  };

  // 포맷된 금액 표시
  const formattedAmount = () => {
    if (!amount) return "";
    return Number(amount).toLocaleString("ko-KR");
  };

  // 거래 유형에 따른 카테고리 목록 가져오기
  const getCategoriesByType = () => {
    return transactionType === "EXPENSE" ? expenseCategories : incomeCategories;
  };

  // 거래 유형에 따른 기본 카테고리 설정
  const getDefaultCategory = (type: "EXPENSE" | "INCOME") => {
    return "기타"; // 지출과 수입 모두 "기타"
  };

  // 선택된 카테고리 정보 가져오기
  const selectedCategory = getCategoriesByType().find(
    (cat) => cat.id === category
  );

  // 날짜 포맷팅 함수 (YYYY-MM-DD를 YYYY/MM/DD로 변환)
  const formatDateWithSlash = (dateString) => {
    if (!dateString) return "";

    // '-' 형식으로 들어온 날짜를 '/' 형식으로 변환
    const cleanDate = dateString.replace(/\//g, "-");

    try {
      // 날짜 객체로 변환한 후 다시 포맷팅
      const dateObj = new Date(cleanDate);
      if (isNaN(dateObj.getTime())) return dateString; // 유효하지 않은 날짜인 경우

      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, "0");
      const day = String(dateObj.getDate()).padStart(2, "0");

      return `${year}/${month}/${day}`;
    } catch (error) {
      console.error("날짜 포맷팅 오류:", error);
      return dateString;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      <TopBar />

      {/* 거래 내역 작성 제목 블록 */}
      <div className="bg-[#11ABFF] text-white px-4 py-2 items-center">
        <h1 className="text-xl font-light">
          [{groupInfo?.title}] 거래 내역 작성
        </h1>
      </div>

      {/* 거래 유형 선택 */}
      <div className="flex px-6 pt-3">
        <button
          className={`flex-1 cursor-pointer py-2 rounded-[10px] mr-7 ${
            transactionType === "EXPENSE"
              ? "bg-[#FF005E] text-white"
              : "bg-[#D4D4D4] text-white"
          }`}
          onClick={() => handleTransactionTypeChange("EXPENSE")}
        >
          지출
        </button>
        <button
          className={`flex-1 cursor-pointer py-2 rounded-[10px] ${
            transactionType === "INCOME"
              ? "bg-[#0E5EFF] text-white"
              : "bg-[#D4D4D4] text-white"
          }`}
          onClick={() => handleTransactionTypeChange("INCOME")}
        >
          수입
        </button>
      </div>

      {/* 금액 입력 */}
      <div className="px-4 py-4">
        <label className="block font-medium text-md mb-1">
          금액<span className="text-[#FF472F]">*</span>
        </label>
        <div className="relative">
          <input
            type="text"
            className="w-full p-2 border-b border-gray-300 focus:border-blue-500 text-sm outline-none"
            placeholder="15,000"
            value={formattedAmount()}
            onChange={handleAmountChange}
            onBlur={(e) => {
              if (e.target.value.trim() === "") {
                setAmountError(true);
              } else {
                setAmountError(false);
              }
            }}
            onFocus={() => setAmountTouched(true)}
            inputMode="numeric"
          />
        </div>
        {amountError && amountTouched && (
          <p className="text-red-500 text-xs mt-1">금액을 입력해 주세요.</p>
        )}
      </div>

      {/* 내용 입력 */}
      <div className="px-4">
        <label className="block font-medium text-md mb-1">내용</label>
        <input
          type="text"
          className="w-full p-2 border-b border-gray-300 focus:border-blue-500 text-sm outline-none"
          placeholder="파스타"
          value={content}
          onChange={handleContentChange}
        />
      </div>

      {/* 날짜 입력 */}
      <div className="px-4 py-3">
        <label className="block font-medium text-md mb-1">날짜</label>
        <div className="relative">
          <input
            type="text"
            className="w-full p-2 border-b border-gray-300 focus:border-blue-500 text-sm outline-none"
            placeholder="YYYY/MM/DD"
            value={formatDateWithSlash(date)} // 포맷팅 함수 사용
            readOnly // 직접 편집을 방지
            onClick={() =>
              document.getElementById("hidden-date-input").showPicker()
            }
          />
          <input
            id="hidden-date-input"
            type="date"
            className="opacity-0 absolute w-0 h-0"
            value={date.replace(/\//g, "-")}
            onChange={handleDateChange}
          />
          <div className="absolute right-3 bottom-2">
            <button
              onClick={() =>
                document.getElementById("hidden-date-input").showPicker()
              }
              className="bg-transparent border-0 p-0 cursor-pointer"
            >
              📅
            </button>
          </div>
        </div>
      </div>

      {/* 카테고리 선택 */}
      <div className="px-4 py-1">
        <label className="block font-medium text-md">카테고리</label>
        <div className="flex">
          <button
            className="px-10 py-1 border-2 border-[#808080] rounded-[10px] text-sm text-[#808080] cursor-pointer"
            onClick={() => setShowCategoryModal(true)}
          >
            선택
          </button>
        </div>
      </div>

      {/* 선택된 카테고리 아이콘 */}
      {selectedCategory && (
        <div className="flex justify-left px-4">
          <div className="flex flex-col items-center">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: selectedCategory.color }}
            >
              <Image
                src={selectedCategory.icon}
                alt={selectedCategory.name}
                width={24}
                height={24}
              />
            </div>
            <span className="text-sm text-gray-600">
              {selectedCategory.name}
            </span>
          </div>
        </div>
      )}

      {/* 저장 버튼 */}
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

      {/* 카테고리 선택 모달 */}
      {showCategoryModal && (
        <>
          {/* 반투명 오버레이 */}
          <div
            className="absolute top-0 left-0 right-0 bottom-0 bg-[#d9d9d9] opacity-50 flex h-screen items-center justify-center z-50"
            onClick={() => setShowCategoryModal(false)}
          ></div>

          {/* 카테고리 선택 모달 (완전 불투명) */}
          <div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-[10px] p-2 w-[90%] shadow-lg z-50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid grid-cols-5 gap-5">
              {getCategoriesByType().map((cat) => (
                <div
                  key={cat.id}
                  className="flex flex-col items-center cursor-pointer"
                  onClick={() => handleCategoryChange(cat.id)}
                >
                  <div
                    className="w-10 h-10 rounded-[15px] flex items-center justify-center"
                    style={{ backgroundColor: cat.color }}
                  >
                    <Image
                      src={cat.icon}
                      alt={cat.name}
                      width={24}
                      height={24}
                    />
                  </div>
                  <span className="text-xs text-center">{cat.name}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <BottomBar />
    </div>
  );
}
