import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col bg-gray-30">
      <div className="flex flex-1 px-5">
        <div className="mx-auto flex w-full max-w-[390px] -translate-y-6 flex-col items-center justify-center">
          <Image
            src="/images/transaction/v2/실패_캐릭터.svg"
            alt="페이지를 찾을 수 없음"
            width={132}
            height={132}
            priority
          />

          <p className="mt-10 text-center text-title1 text-gray-900">
            요청하신 페이지를
            <br />
            찾을 수 없어요.
          </p>

          <p className="mt-6 text-center text-body2-regular text-gray-400">
            페이지가 존재하지 않거나, 사용할 수 없는 페이지예요.
          </p>
        </div>
      </div>

      <div className="bg-gray-30 px-5 py-4 pb-4">
        <Link
          href="/"
          className="flex h-14 w-full items-center justify-center rounded-xl bg-gray-900 text-subtitle text-white transition-colors hover:bg-gray-800"
        >
          메인으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
