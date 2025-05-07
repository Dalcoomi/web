"use client";

import Image from "next/image";

// 카카오 로그인 페이지 컴포넌트
export default function LoginPage() {
  // 카카오 로그인 처리 함수 - SDK 사용하지 않고 직접 URL 열기
  const handleKakaoLogin = () => {
    const KAKAO_REST_API_KEY = "79c681149b318adcf857208b02581d0e";
    const REDIRECT_URI = "http://localhost:3000/api/auth/kakao/callback";

    // 팝업 창 크기 설정
    const width = 500;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    // 카카오 인증 URL
    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_REST_API_KEY}&redirect_uri=${REDIRECT_URI}&response_type=code`;

    // 팝업 창 열기
    const popup = window.open(
      kakaoAuthUrl,
      "kakaoLogin",
      `width=${width},height=${height},left=${left},top=${top}`
    );

    // 팝업 창 모니터링
    const checkPopup = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(checkPopup);
        console.log("카카오 로그인 창이 닫혔습니다.");
      }
    }, 1000);

    // 팝업 창에서 메시지 수신 설정
    window.addEventListener("message", receiveMessage, false);

    // 팝업 창으로부터 메시지 수신 처리
    function receiveMessage(event) {
      // 메시지 출처 확인 (보안)
      if (event.origin !== window.location.origin) return;

      if (event.data.type === "kakaoLogin" && event.data.success) {
        // 로그인 성공 처리
        console.log("카카오 로그인 성공:", event.data.userData);

        // 백엔드로 데이터 전송
        sendToBackend(event.data.userData);

        // 더 이상 메시지를 받지 않음
        window.removeEventListener("message", receiveMessage, false);
      }
    }
  };

  // 백엔드로 데이터 전송
  const sendToBackend = async (userData) => {
    try {
      const response = await fetch("http://your-backend-url/api/auth/kakao", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error("서버 응답 오류");
      }

      const data = await response.json();
      console.log("백엔드 응답:", data);

      // 로그인 성공 후 처리
      localStorage.setItem("token", data.token);
      window.location.href = "/";
    } catch (error) {
      console.error("백엔드 요청 오류:", error);
      alert("로그인 처리 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="relative w-full h-full">
      {/* 배경 이미지 */}
      <div className="inset-0 w-full h-full z-0">
        <Image
          src="/images/login-background.svg"
          alt="로그인 배경"
          width={390}
          height={700}
        />
      </div>

      {/* 로그인 버튼들 */}
      <div className="absolute w-full bottom-7 flex flex-col items-center space-y-4 z-10">
        {/* 네이버 로그인 버튼 (비활성화) */}
        <button className="w-[180px] cursor-pointer">
          <Image
            src="/images/네이버 버튼1.svg"
            alt="네이버 로그인"
            width={160}
            height={40}
            className="w-full"
          />
        </button>

        {/* 카카오 로그인 버튼 */}
        <button className="w-[180px] cursor-pointer" onClick={handleKakaoLogin}>
          <Image
            src="/images/카카오 버튼1.svg"
            alt="카카오 로그인"
            width={160}
            height={41}
            className="w-full"
          />
        </button>
      </div>
    </div>
  );
}
