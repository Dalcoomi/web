"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

interface PageBackHeaderProps {
  title: string;
  onBack?: () => void;
  className?: string;
}

export default function PageBackHeader({
  title,
  onBack,
  className = "px-5 pt-5 pb-8",
}: PageBackHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }

    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/");
  };

  return (
    <header className={`${className} flex items-center gap-3`}>
      <button
        type="button"
        onClick={handleBack}
        className="w-6 h-6 flex items-center justify-center cursor-pointer"
        aria-label="뒤로가기"
      >
        <Image
          src="/images/transaction/v2/뒤로가기_버튼.svg"
          alt=""
          width={24}
          height={24}
        />
      </button>
      <h1 className="text-subtitle text-gray-900">{title}</h1>
    </header>
  );
}
