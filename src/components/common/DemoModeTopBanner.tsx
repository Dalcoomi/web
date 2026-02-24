"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { isDemoMode } from "@/utils/demoMode";

export default function DemoModeTopBanner() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setShowBanner(isDemoMode());
  }, []);

  if (!isMounted || !showBanner) {
    return null;
  }

  return (
    <>
      <div className="sticky top-0 z-40 bg-gray-30/95 backdrop-blur px-4 pt-2 pb-1">
        <div className="rounded-xl border border-sky-100 bg-white px-3 py-2 shadow-[0_1px_8px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="demo-dot inline-block h-2 w-2 rounded-full bg-sky-500" />
                <p className="text-[12px] font-semibold leading-4 text-slate-800">
                  체험 모드
                </p>
              </div>
              <p className="mt-1 text-[11px] leading-4 text-slate-500">
                체험 데이터는 저장되지 않아요
              </p>
            </div>

            <button
              onClick={() => router.push("/?panel=login")}
              className="shrink-0 rounded-lg bg-slate-900 px-3 py-1.5 text-[11px] font-semibold leading-4 text-white transition-colors hover:bg-slate-800 cursor-pointer"
            >
              로그인하고 실제로 사용하기
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes demoDotBounce {
          0%,
          100% {
            box-shadow: 0 0 0 0 rgba(14, 165, 233, 0.28);
          }
          40% {
            box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.08);
          }
        }

        .demo-dot {
          animation: demoDotBounce 1.4s ease-in-out infinite;
        }
      `}</style>
    </>
  );
}
