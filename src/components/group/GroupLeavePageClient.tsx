"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import BottomButton from "@/components/ui/BottomButton";
import {
  getGroupInfo,
  getGroups,
  GroupInfo,
  leaveGroup,
} from "@/services/groupService";
import { useMemberStore } from "@/stores/useMemberStore";
import { useToastStore } from "@/stores/useToastStore";

export default function GroupLeavePageClient() {
  const router = useRouter();
  const params = useParams();
  const teamId = params.teamId as string;

  const { member, fetchMember } = useMemberStore();
  const addToast = useToastStore((state) => state.addToast);

  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!member) {
      fetchMember();
    }
  }, [member, fetchMember]);

  useEffect(() => {
    if (!teamId) {
      router.replace("/group");
      return;
    }

    const loadGroupInfo = async () => {
      setIsLoading(true);
      try {
        const info = await getGroupInfo(teamId);
        setGroupInfo(info);
      } catch (error) {
        addToast("error", String(error) || "그룹 정보를 불러올 수 없습니다.");
        router.replace(`/group/info/${teamId}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadGroupInfo();
  }, [teamId, router, addToast]);

  const isCurrentUserLeader = useMemo(() => {
    if (!groupInfo) {
      return false;
    }

    if (typeof groupInfo.isLeader === "boolean") {
      return groupInfo.isLeader;
    }

    return groupInfo.leaderNickname === member?.nickname;
  }, [groupInfo, member?.nickname]);
  const isLastMemberLeader = isCurrentUserLeader && groupInfo.members.length === 1;

  const handleBackToGroupInfo = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.replace(`/group/info/${teamId}`);
  };

  const handleFirstLeaveConfirm = () => {
    if (!groupInfo || isSubmitting) {
      return;
    }

    if (isCurrentUserLeader && groupInfo.members.length > 1) {
      router.push(`/group/info/${teamId}/leave/leader`);
      return;
    }

    void handleFinalLeave();
  };

  const handleFinalLeave = async () => {
    if (!groupInfo || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      await leaveGroup(teamId);

      const groupsResponse = await getGroups();
      const remainGroups = groupsResponse.groups ?? [];

      addToast("success", "그룹을 떠났어요.");
      if (remainGroups.length > 0) {
        router.replace(`/transaction/group/${remainGroups[0].teamId}`);
      } else {
        router.replace("/transaction/group");
      }
    } catch (error) {
      addToast("error", String(error) || "그룹 떠나기 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-body2-medium text-gray-500">
          그룹 정보를 불러오는 중...
        </p>
      </div>
    );
  }

  if (!groupInfo) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-body2-medium text-gray-500">
          그룹 정보를 찾을 수 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <div className="z-50 bg-white">
        <div className="flex h-[48px] items-center px-0">
          <button
            onClick={handleBackToGroupInfo}
            className="ml-5 flex cursor-pointer items-center justify-center"
            aria-label="뒤로가기"
          >
            <Image
              src="/images/transaction/v2/뒤로가기_버튼.svg"
              alt="뒤로가기"
              width={24}
              height={24}
            />
          </button>
        </div>
      </div>

      <div className="flex-1 px-5">
        <div className="mx-auto flex h-full max-w-[390px] translate-y-30 flex-col items-center justify-center">
          <Image
            src="/images/transaction/v2/우는_캐릭터.svg"
            alt="우는 캐릭터"
            width={132}
            height={132}
            priority
          />
          <div className="mt-10 text-center">
            <p className="text-title1 text-green-600">{groupInfo.title}</p>
            <p className="mt-1 text-title1 text-gray-900">
              그룹 가계부를 떠나시겠어요?
            </p>
            {isLastMemberLeader ? (
              <p className="mt-6 text-body2-regular text-gray-500 whitespace-pre-line">
                해당 가계부가 영구적으로 삭제되고,
                {"\n"}
                다시 복구할 수 없어요.
              </p>
            ) : (
              <p className="mt-6 text-body2-regular text-gray-500">
                더 이상 해당 가계부를 사용할 수 없어요.
              </p>
            )}
          </div>
        </div>
      </div>

      <BottomButton
        text={isSubmitting ? "처리 중..." : "떠나기"}
        onClick={handleFirstLeaveConfirm}
        disabled={isSubmitting}
        className="pb-4"
      />
    </div>
  );
}
