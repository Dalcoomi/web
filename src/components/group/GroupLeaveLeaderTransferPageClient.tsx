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

export default function GroupLeaveLeaderTransferPageClient() {
  const router = useRouter();
  const params = useParams();
  const teamId = params.teamId as string;

  const { member, fetchMember } = useMemberStore();
  const addToast = useToastStore((state) => state.addToast);

  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNewLeader, setSelectedNewLeader] = useState("");
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
        router.replace(`/group/info/${teamId}/leave`);
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

  const newLeaderCandidates = useMemo(() => {
    if (!groupInfo) {
      return [];
    }

    return groupInfo.members.filter(
      (groupMember) => groupMember.nickname !== groupInfo.leaderNickname,
    );
  }, [groupInfo]);

  useEffect(() => {
    if (isLoading || !groupInfo) {
      return;
    }

    if (!isCurrentUserLeader || groupInfo.members.length <= 1) {
      router.replace(`/group/info/${teamId}/leave`);
    }
  }, [isLoading, groupInfo, isCurrentUserLeader, router, teamId]);

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.replace(`/group/info/${teamId}/leave`);
  };

  const handleTransferAndLeave = async () => {
    if (!selectedNewLeader || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      await leaveGroup(teamId, selectedNewLeader);
      const groupsResponse = await getGroups();
      const remainGroups = groupsResponse.groups ?? [];

      addToast("success", "그룹장 위임 후 그룹을 떠났어요.");
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
      <div className="flex min-h-screen items-center justify-center bg-gray-30">
        <p className="text-body2-medium text-gray-500">그룹 정보를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-gray-30">
      <div className="z-50 bg-gray-30">
        <div className="flex h-[48px] items-center px-0">
          <button
            onClick={handleBack}
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

      <div className="flex-1 overflow-y-auto px-5 pb-6 pt-4">
        <div className="w-full">
          <p className="text-title2 text-gray-900 leading-tight">
            그룹장을 위임할 멤버를
            <br />
            선택한 후 떠날 수 있어요.
          </p>

          <div className="mt-10 space-y-6">
            {newLeaderCandidates.map((candidate) => {
              const isSelected = selectedNewLeader === candidate.nickname;

              return (
                <button
                  key={candidate.nickname}
                  onClick={() =>
                    setSelectedNewLeader((prev) =>
                      prev === candidate.nickname ? "" : candidate.nickname,
                    )
                  }
                  className="flex w-full items-center gap-3 text-left cursor-pointer"
                >
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 bg-white ${
                      isSelected ? "border-gray-900" : "border-gray-100"
                    }`}
                  >
                    {candidate.profileImageUrl ? (
                      <Image
                        src={candidate.profileImageUrl}
                        alt={candidate.nickname}
                        width={36}
                        height={36}
                        className="h-9 w-9 rounded-full object-cover"
                        quality={100}
                        unoptimized
                      />
                    ) : (
                      <span className="h-9 w-9 rounded-full bg-gray-200" />
                    )}
                  </span>
                  <span className="text-body1-semibold text-gray-900">
                    {candidate.nickname}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <BottomButton
        text={isSubmitting ? "처리 중..." : "위임하고 떠나기"}
        onClick={handleTransferAndLeave}
        disabled={!selectedNewLeader || isSubmitting}
        className="pb-4"
      />
    </div>
  );
}
