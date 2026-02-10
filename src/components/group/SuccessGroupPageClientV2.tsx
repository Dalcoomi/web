"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { getGroups, getGroupInfo } from "@/services/groupService";
import { useToastStore } from "@/stores/useToastStore";

export default function SuccessGroupPageClientV2() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const addToast = useToastStore((state) => state.addToast);
  const [inviteCode, setInviteCode] = useState("");
  const [title, setTitle] = useState("");
  const [targetTeamId, setTargetTeamId] = useState<string | null>(null);

  // URL에서 초대 코드와 그룹명 가져오기
  useEffect(() => {
    const code = searchParams.get("code");
    const groupTitle = searchParams.get("title");

    if (code) {
      setInviteCode(code);
    } else {
      router.replace("/group");
    }

    if (groupTitle) {
      setTitle(groupTitle);
    }
  }, [searchParams, router]);

  // 그룹 ID 찾기
  useEffect(() => {
    const findGroupId = async () => {
      if (!inviteCode || !title) return;

      try {
        const response = await getGroups();
        const groups = response.groups || [];

        // 제목이 일치하는 그룹 필터링
        const candidates = groups.filter((g) => g.title === title);

        if (candidates.length === 1) {
          // 일치하는 그룹이 하나면 해당 ID 사용
          setTargetTeamId(candidates[0].teamId);
        } else if (candidates.length > 1) {
          // 일치하는 그룹이 여러 개면 상세 정보 조회하여 초대 코드로 확인
          for (const group of candidates) {
            try {
              const info = await getGroupInfo(group.teamId);
              if (info.invitationCode === inviteCode) {
                setTargetTeamId(group.teamId);
                break;
              }
            } catch (e) {
              console.error(`그룹 정보 조회 실패 (${group.teamId}):`, e);
            }
          }
        }
      } catch (error) {
        console.error("그룹 목록 조회 실패:", error);
      }
    };

    findGroupId();
  }, [inviteCode, title]);

  // 초대 코드 복사하기
  const handleCopyCode = async () => {
    if (!inviteCode) return;
    try {
      await navigator.clipboard.writeText(inviteCode);
      addToast("success", "초대 코드가 복사되었습니다.");
    } catch (error) {
      console.error("복사 실패:", error);
    }
  };

  // 공유하기
  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `[달꾸미] ${title} 그룹 초대`,
          text: `${title} 그룹에 초대합니다!\n초대코드: ${inviteCode}`,
        });
      } catch (error) {
        console.log("공유 취소 또는 실패:", error);
      }
    } else {
      handleCopyCode();
      addToast("info", "공유하기가 지원되지 않아 초대 코드가 복사되었습니다.");
    }
  };

  // 닫기 버튼 핸들러
  const handleClose = () => {
    if (targetTeamId) {
      router.push(`/transaction/group/${targetTeamId}`);
    } else {
      router.push("/group");
    }
  };

  if (!inviteCode) return null;

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* 메인 콘텐츠 - 상단 영역 중앙 정렬 */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <Image
          src="/images/transaction/v2/생성_성공_체크.svg"
          alt="생성 완료"
          width={60}
          height={60}
          className="mb-4"
        />
        <div className="flex flex-col items-center gap-0.5">
          <h1 className="text-title1 text-green-600">{title}</h1>
          <h2 className="text-title1 text-gray-900">그룹이 만들어졌어요!</h2>
        </div>

        <div className="relative mt-14">
          <div className="w-55.25 h-12 bg-gray-30 border border-gray-100 rounded-xl flex items-center pl-4 pr-2">
            <span className="text-body1-regular text-gray-500 whitespace-nowrap">
              초대코드
            </span>
            <span className="ml-2 text-body1-semibold text-gray-900 flex-1 truncate">
              {inviteCode}
            </span>
            <button
              onClick={handleCopyCode}
              className="shrink-0 cursor-pointer"
            >
              <Image
                src="/images/transaction/v2/복사_버튼.svg"
                alt="복사"
                width={32}
                height={32}
              />
            </button>
          </div>
        </div>

        <p className="mt-3 text-body2-regular text-gray-500">
          초대코드로 친구를 초대해보세요
        </p>
      </div>

      {/* 하단 버튼 영역 */}
      <div className="flex justify-center gap-2 px-5 pb-5">
        <button
          onClick={handleClose}
          className="w-30 h-14 bg-gray-200 text-white rounded-xl text-subtitle cursor-pointer flex items-center justify-center"
        >
          닫기
        </button>
        <button
          onClick={handleShare}
          className="w-51.75 h-14 bg-gray-900 text-white rounded-xl text-subtitle cursor-pointer flex items-center justify-center"
        >
          초대하기
        </button>
      </div>
    </div>
  );
}
