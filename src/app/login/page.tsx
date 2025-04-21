// app/login/page.tsx
import Image from "next/image";

export default function Login() {
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
      <div className="absolute w-full bottom-10 flex flex-col items-center space-y-4 z-10">
        {/* 네이버 로그인 버튼 */}
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
        <button className="w-[180px] cursor-pointer">
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
