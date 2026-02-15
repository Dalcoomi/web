"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import BottomButton from "@/components/ui/BottomButton";
import { BRAND_COLORS } from "@/constants/brandColors";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import {
  getGroupInfo,
  GroupInfo,
  leaveGroup,
  updateGroup,
} from "@/services/groupService";
import { useMemberStore } from "@/stores/useMemberStore";
import { useToastStore } from "@/stores/useToastStore";

type TabKey = "group" | "member";

const LABEL_COLORS = [
  { id: "gray", value: BRAND_COLORS.gray },
  { id: "green", value: BRAND_COLORS.green },
  { id: "blue", value: BRAND_COLORS.blue },
  { id: "red", value: BRAND_COLORS.red },
  { id: "yellow", value: BRAND_COLORS.yellow },
] as const;

export default function GroupInfoPageClient() {
  const router = useRouter();
  const params = useParams();
  const teamId = params.teamId as string;

  const { member, fetchMember } = useMemberStore();
  const addToast = useToastStore((state) => state.addToast);
  const copyToClipboard = useCopyToClipboard();

  const [activeTab, setActiveTab] = useState<TabKey>("group");
  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [purpose, setPurpose] = useState("");
  const [selectedColor, setSelectedColor] = useState<string>(
    LABEL_COLORS[0].id,
  );

  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showLeaderSelectModal, setShowLeaderSelectModal] = useState(false);
  const [selectedNewLeader, setSelectedNewLeader] = useState("");

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
        setTitle(info.title);
        setPurpose(info.purpose || "");
        setSelectedColor(info.label || LABEL_COLORS[0].id);
      } catch (error) {
        addToast("error", String(error) || "그룹 정보를 불러올 수 없습니다.");
        router.replace("/group");
      } finally {
        setIsLoading(false);
      }
    };

    loadGroupInfo();
  }, [teamId, router, addToast]);

  const isCurrentUserLeader = useMemo(() => {
    return groupInfo?.leaderNickname === member?.nickname;
  }, [groupInfo?.leaderNickname, member?.nickname]);
  const canEditGroupInfo = isCurrentUserLeader;

  const isFormValid = title.trim().length > 0;

  const handleCopyInviteCode = async () => {
    if (!groupInfo?.invitationCode) {
      addToast("error", "초대코드를 찾을 수 없습니다.");
      return;
    }

    await copyToClipboard(groupInfo.invitationCode, "초대코드를 복사했어요.");
  };

  const handleSubmit = async () => {
    if (!groupInfo || !isCurrentUserLeader || !isFormValid || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      await updateGroup({
        teamId,
        title: title.trim(),
        memberLimit: groupInfo.memberLimit,
        purpose: purpose.trim() || null,
        label: selectedColor,
      });

      const updated = await getGroupInfo(teamId);
      setGroupInfo(updated);
      setTitle(updated.title);
      setPurpose(updated.purpose || "");
      setSelectedColor(updated.label || LABEL_COLORS[0].id);
      addToast("success", "그룹 정보를 수정했어요.");
    } catch (error) {
      addToast(
        "error",
        String(error) || "그룹 정보 수정 중 오류가 발생했습니다.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMemberIconColor = (index: number) => {
    const colors = ["#F9F90C", "#94A7EF", "#FCC9EC", "#45D076"];
    return colors[index % colors.length];
  };

  const handleLeaveGroupClick = () => {
    setShowLeaveModal(true);
  };

  const handleCloseModals = () => {
    setShowLeaveModal(false);
    setShowLeaderSelectModal(false);
    setSelectedNewLeader("");
  };

  const handleFirstLeaveConfirm = () => {
    if (!groupInfo) {
      return;
    }

    if (isCurrentUserLeader && groupInfo.members.length > 1) {
      setShowLeaveModal(false);
      setShowLeaderSelectModal(true);
      return;
    }

    void handleFinalLeave();
  };

  const handleFinalLeave = async () => {
    if (!groupInfo) {
      return;
    }

    if (
      isCurrentUserLeader &&
      groupInfo.members.length > 1 &&
      !selectedNewLeader
    ) {
      addToast("error", "새 그룹장을 선택해 주세요.");
      return;
    }

    try {
      if (isCurrentUserLeader && selectedNewLeader) {
        await leaveGroup(teamId, selectedNewLeader);
      } else {
        await leaveGroup(teamId);
      }

      addToast("success", "그룹을 떠났어요.");
      router.replace("/group");
    } catch (error) {
      addToast("error", String(error) || "그룹 떠나기 중 오류가 발생했습니다.");
    }
  };

  const newLeaderCandidates = useMemo(() => {
    if (!groupInfo) {
      return [];
    }

    return groupInfo.members.filter(
      (groupMember) => groupMember.nickname !== groupInfo.leaderNickname,
    );
  }, [groupInfo]);

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
    <div className="flex min-h-screen flex-col bg-white">
      <div className="z-50 bg-white">
        <div className="flex items-center h-[48px] px-0">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center ml-5 cursor-pointer"
            aria-label="뒤로가기"
          >
            <Image
              src="/images/transaction/v2/뒤로가기_버튼.svg"
              alt="뒤로가기"
              width={24}
              height={24}
            />
          </button>
          <h1 className="ml-3 text-subtitle text-gray-900">
            그룹 정보 수정하기
          </h1>
        </div>
      </div>

      <div className="border-b border-gray-100 px-5">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab("group")}
            className={`relative pb-2 pt-3 text-body1-semibold cursor-pointer ${
              activeTab === "group" ? "text-gray-900" : "text-gray-300"
            }`}
          >
            그룹 정보
            {activeTab === "group" && (
              <span className="absolute bottom-0 left-0 h-[2px] w-full bg-gray-900" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("member")}
            className={`relative pb-2 pt-3 text-body1-semibold cursor-pointer ${
              activeTab === "member" ? "text-gray-900" : "text-gray-300"
            }`}
          >
            멤버 정보
            {activeTab === "member" && (
              <span className="absolute bottom-0 left-0 h-[2px] w-full bg-gray-900" />
            )}
          </button>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto px-5 pb-6 pt-8 scrollbar-hide">
        {activeTab === "group" ? (
          <div className="space-y-8">
            <div>
              <label className="mb-2 flex items-start gap-1">
                <span className="text-body2-semibold text-gray-600">
                  그룹명
                </span>
                {canEditGroupInfo && (
                  <span className="mt-[1px] h-1 w-1 rounded-full bg-red-500" />
                )}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  if (!canEditGroupInfo) return;
                  if (e.target.value.length <= 20) {
                    setTitle(e.target.value);
                  }
                }}
                disabled={!canEditGroupInfo}
                className={`h-12 w-full rounded-xl border border-gray-100 px-4 text-body1-regular transition-colors ${
                  canEditGroupInfo
                    ? "bg-white text-gray-900 outline-none focus:border-gray-850"
                    : "bg-gray-30 text-gray-400 cursor-not-allowed"
                }`}
              />
            </div>

            <div>
              <label className="mb-2 flex items-start gap-1">
                <span className="text-body2-semibold text-gray-600">
                  라벨 컬러
                </span>
                {canEditGroupInfo && (
                  <span className="mt-[1px] h-1 w-1 rounded-full bg-red-500" />
                )}
              </label>
              <div className="overflow-x-auto scrollbar">
                <div className="flex items-center gap-4 w-max min-w-full">
                  {LABEL_COLORS.map((color) => (
                    <button
                      key={color.id}
                      onClick={() => setSelectedColor(color.id)}
                      disabled={!canEditGroupInfo}
                      className={`shrink-0 flex h-11 w-11 items-center justify-center rounded-full ${
                        selectedColor === color.id
                          ? "border-2 border-gray-900"
                          : "border border-gray-100"
                      } ${canEditGroupInfo ? "cursor-pointer" : "cursor-not-allowed"}`}
                      aria-label={`${color.id} 컬러 선택`}
                    >
                      <span
                        className="h-9 w-9 rounded-full"
                        style={{ backgroundColor: color.value }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-body2-semibold text-gray-600">
                초대코드
              </label>
              <div className="flex flex-col gap-2 min-[360px]:flex-row min-[360px]:items-center">
                <input
                  type="text"
                  value={groupInfo.invitationCode}
                  readOnly
                  aria-readonly
                  onClick={() => {
                    void handleCopyInviteCode();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      void handleCopyInviteCode();
                    }
                  }}
                  className="h-12 min-w-0 flex-1 rounded-xl border border-gray-100 bg-gray-30 px-4 text-body1-regular text-gray-400 outline-none cursor-pointer"
                />
                <button
                  onClick={handleCopyInviteCode}
                  className="h-12 w-full min-[360px]:w-auto min-[360px]:min-w-[96px] shrink-0 whitespace-nowrap rounded-xl border border-gray-800 bg-white px-5 text-body1-semibold text-gray-900 cursor-pointer"
                >
                  복사하기
                </button>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-body2-semibold text-gray-600">
                목표
              </label>
              <input
                type="text"
                value={purpose}
                onChange={(e) => {
                  if (!canEditGroupInfo) return;
                  if (e.target.value.length <= 30) {
                    setPurpose(e.target.value);
                  }
                }}
                disabled={!canEditGroupInfo}
                className={`h-12 w-full rounded-xl border border-gray-100 px-4 text-body1-regular transition-colors ${
                  canEditGroupInfo
                    ? "bg-white text-gray-900 outline-none focus:border-gray-850"
                    : "bg-gray-30 text-gray-400 cursor-not-allowed"
                }`}
              />
            </div>

            <button
              onClick={handleLeaveGroupClick}
              className="text-body1-semibold text-red-500 cursor-pointer"
            >
              그룹 떠나기
            </button>
          </div>
        ) : (
          <div className="space-y-0">
            {groupInfo.members.map((groupMember) => {
              const isLeader =
                groupMember.nickname === groupInfo.leaderNickname;
              const isMe = groupMember.nickname === member?.nickname;

              return (
                <div
                  key={groupMember.nickname}
                  className="flex items-center justify-between pb-6"
                >
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 overflow-hidden rounded-full bg-gray-100">
                      {groupMember.profileImageUrl ? (
                        <Image
                          src={groupMember.profileImageUrl}
                          alt={groupMember.nickname}
                          width={36}
                          height={36}
                          className="h-full w-full object-cover"
                          quality={100}
                          unoptimized
                        />
                      ) : (
                        <div className="h-full w-full" />
                      )}
                    </div>
                    <p className="text-body1-semibold text-gray-900">
                      {groupMember.nickname}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {isMe && (
                      <span className="rounded-[6px] bg-gray-50 px-2 py-1 text-caption1-semibold text-gray-700">
                        나
                      </span>
                    )}
                    {isLeader && (
                      <span className="rounded-[6px] bg-blue-50 px-2 py-1 text-caption1-semibold text-blue-600">
                        그룹장
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {activeTab === "group" && isCurrentUserLeader && (
        <BottomButton
          text={isSubmitting ? "수정 중..." : "수정 완료"}
          onClick={handleSubmit}
          disabled={isSubmitting || !isFormValid}
          className="pb-4"
        />
      )}

      {showLeaveModal && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40"
            onClick={handleCloseModals}
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-[88%] max-w-[340px] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-5">
            <p className="text-center text-body1-medium text-gray-900">
              그룹을 떠나시겠어요?
            </p>
            <div className="mt-5 flex gap-2">
              <button
                onClick={handleFirstLeaveConfirm}
                className="h-12 flex-1 rounded-xl bg-red-500 text-body2-semibold text-white cursor-pointer"
              >
                떠나기
              </button>
              <button
                onClick={handleCloseModals}
                className="h-12 flex-1 rounded-xl bg-gray-200 text-body2-semibold text-gray-700 cursor-pointer"
              >
                취소
              </button>
            </div>
          </div>
        </>
      )}

      {showLeaderSelectModal && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40"
            onClick={handleCloseModals}
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-[88%] max-w-[340px] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-5">
            <p className="text-center text-body1-medium text-gray-900">
              새 그룹장을 선택해 주세요.
            </p>
            <div className="mt-4 max-h-60 space-y-2 overflow-y-auto">
              {newLeaderCandidates.map((candidate, index) => (
                <button
                  key={candidate.nickname}
                  onClick={() => setSelectedNewLeader(candidate.nickname)}
                  className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left cursor-pointer ${
                    selectedNewLeader === candidate.nickname
                      ? "border-gray-900"
                      : "border-gray-100"
                  }`}
                >
                  <div className="h-8 w-8 overflow-hidden rounded-full">
                    {candidate.profileImageUrl ? (
                      <Image
                        src={candidate.profileImageUrl}
                        alt={candidate.nickname}
                        width={32}
                        height={32}
                        className="h-full w-full object-cover"
                        quality={100}
                        unoptimized
                      />
                    ) : (
                      <div
                        className="flex h-full w-full items-center justify-center text-caption1-medium text-white"
                        style={{ backgroundColor: getMemberIconColor(index) }}
                      >
                        {candidate.nickname.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <span className="text-body2-medium text-gray-900">
                    {candidate.nickname}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-5 flex gap-2">
              <button
                onClick={handleFinalLeave}
                disabled={!selectedNewLeader}
                className="h-12 flex-1 rounded-xl bg-gray-900 text-body2-semibold text-white cursor-pointer disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed"
              >
                확정
              </button>
              <button
                onClick={handleCloseModals}
                className="h-12 flex-1 rounded-xl bg-gray-200 text-body2-semibold text-gray-700 cursor-pointer"
              >
                취소
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
