// components/group/GroupInfoPageClient.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  getGroupInfo,
  leaveGroup,
  updateGroup,
  GroupInfo,
} from "@/services/groupService";
import { useMemberStore } from "@/stores/useMemberStore";
import Image from "next/image";
import TopBar from "@/components/ui/TopBar";
import BottomBar from "@/components/ui/BottomBar";

export default function GroupInfoPageClient() {
  const router = useRouter();
  const params = useParams();
  const teamId = params.teamId as string;
  const { member: memberInfo, fetchMember } = useMemberStore();

  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showLeaderSelectModal, setShowLeaderSelectModal] = useState(false);
  const [selectedNewLeader, setSelectedNewLeader] = useState<string>("");

  // 수정 모드 상태
  const [isEditMode, setIsEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editPurpose, setEditPurpose] = useState("");
  const [editMemberLimit, setEditMemberLimit] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // 회원 정보가 없으면 가져오기
  useEffect(() => {
    if (!memberInfo) {
      fetchMember();
    }
  }, [memberInfo, fetchMember]);

  // 그룹 정보 로드
  useEffect(() => {
    // 100ms 후에 실행
    const timeoutId = setTimeout(async () => {
      if (!teamId) {
        router.replace("/group");
        return;
      }

      try {
        const response = await getGroupInfo(teamId);

        setGroupInfo(response);
        // 수정 폼 초기값 설정
        setEditTitle(response.title);
        setEditPurpose(response.purpose || "");
        setEditMemberLimit(response.memberLimit.toString());
      } catch (error) {
        alert(error || "그룹 정보를 불러올 수 없습니다.");

        router.replace("/group");
      }
    }, 100);

    // cleanup: 다음 effect 실행 전에 이전 timeout 취소
    return () => {
      clearTimeout(timeoutId);
    };
  }, [teamId, router]);

  // 초대 코드 복사
  const handleCopyInviteCode = async () => {
    if (!groupInfo?.invitationCode) {
      alert("초대 코드가 없습니다.");
      return;
    }

    try {
      await navigator.clipboard.writeText(groupInfo.invitationCode);
      alert("초대 코드가 복사되었습니다!");
    } catch (error) {
      alert(error || "복사에 실패했습니다. 다시 시도해 주세요.");
    }
  };

  // 수정 모드 진입
  const handleEditClick = () => {
    setIsEditMode(true);
  };

  // 수정 취소
  const handleCancelEdit = () => {
    setIsEditMode(false);
    // 원래 값으로 되돌리기
    if (groupInfo) {
      setEditTitle(groupInfo.title);
      setEditPurpose(groupInfo.purpose || "");
      setEditMemberLimit(groupInfo.memberLimit.toString());
    }
  };

  // 그룹명 입력 핸들러
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length <= 20) {
      setEditTitle(value);
    }
  };

  // 목표 입력 핸들러
  const handlePurposeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length <= 30) {
      setEditPurpose(value);
    }
  };

  // 최대 인원 입력 핸들러
  const handleMemberLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d]/g, ""); // 숫자만 허용

    if (!groupInfo) return;

    const currentMemberCount = groupInfo.members.length;
    const newLimit = Number(value);

    // 빈 값이거나 현재 인원 이상 10 이하인 경우만 허용
    if (value === "" || (newLimit >= currentMemberCount && newLimit <= 10)) {
      setEditMemberLimit(value);
    }
  };

  // 그룹 정보 수정 완료
  const handleUpdateGroup = async () => {
    if (!groupInfo) return;

    if (editTitle.trim().length === 0) {
      alert("그룹명을 입력해주세요.");
      return;
    }

    if (editMemberLimit.trim() === "") {
      alert("최대 인원을 입력해주세요.");
      return;
    }

    const newMemberLimit = Number(editMemberLimit);
    const currentMemberCount = groupInfo.members.length;

    if (newMemberLimit < currentMemberCount) {
      alert(
        `최대 인원은 현재 인원(${currentMemberCount}명)보다 작을 수 없습니다.`
      );
      return;
    }

    if (newMemberLimit < 1 || newMemberLimit > 10) {
      alert("최대 인원은 1명에서 10명 사이여야 합니다.");
      return;
    }

    setIsUpdating(true);

    try {
      await updateGroup({
        teamId: teamId,
        title: editTitle.trim(),
        memberLimit: newMemberLimit,
        purpose: editPurpose.trim() || null,
      });

      // 성공 시 그룹 정보 다시 로드
      const response = await getGroupInfo(teamId);
      setGroupInfo(response);
      setEditMemberLimit(response.memberLimit.toString());
      setIsEditMode(false);
    } catch (error) {
      alert(error || "그룹 정보 수정 중 오류가 발생했습니다.");
    } finally {
      setIsUpdating(false);
    }
  };

  // 그룹 떠나기 모달 열기
  const handleLeaveGroupClick = () => {
    setShowLeaveModal(true);
  };

  // 첫 번째 모달에서 '네' 클릭
  const handleFirstConfirm = () => {
    if (isCurrentUserLeader()) {
      // 리더인 경우 두 번째 모달로 이동
      setShowLeaveModal(false);
      setShowLeaderSelectModal(true);
    } else {
      // 일반 멤버인 경우 바로 떠나기
      handleFinalLeave();
    }
  };

  // 최종 그룹 나가기 실행
  const handleFinalLeave = async () => {
    if (
      isCurrentUserLeader() &&
      !selectedNewLeader &&
      groupInfo &&
      groupInfo.members.length > 1
    ) {
      alert("새 그룹장을 선택해 주세요.");
      return;
    }

    try {
      if (isCurrentUserLeader() && selectedNewLeader) {
        // 그룹장인 경우 새 그룹장과 함께 떠나기 요청
        await leaveGroup(teamId, selectedNewLeader);
      } else {
        // 일반 멤버인 경우
        await leaveGroup(teamId);
      }

      alert("그룹을 떠났습니다.");
      router.replace("/group");
    } catch (error) {
      alert(error || "그룹 떠나기 중 오류가 발생했습니다.");
    }
  };

  // 모달 닫기
  const handleCloseModal = () => {
    setShowLeaveModal(false);
    setShowLeaderSelectModal(false);
    setSelectedNewLeader("");
  };

  // 멤버 아이콘 색상 (순서대로)
  const getMemberIconColor = (index: number) => {
    const colors = [
      "#F9F90C", // 노란색
      "#94A7EF", // 보라색
      "#FCC9EC", // 연분홍
      "#45D076", // 연녹색
    ];
    return colors[index % colors.length];
  };

  // 리더인지 확인하는 함수
  const isLeader = (nickname: string) => {
    return nickname === groupInfo?.leaderNickname;
  };

  // 현재 사용자가 그룹장인지 확인
  const isCurrentUserLeader = () => {
    // 그룹장 여부를 확인하는 로직
    return groupInfo?.leaderNickname === memberInfo?.nickname;
  };

  // 새 그룹장 후보자 목록 (현재 그룹장 제외)
  const getNewLeaderCandidates = () => {
    return (
      groupInfo?.members.filter(
        (member) => member.nickname !== groupInfo.leaderNickname
      ) || []
    );
  };

  if (!groupInfo) {
    return (
      <div className="flex flex-col h-screen bg-white">
        <TopBar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">그룹 정보를 찾을 수 없습니다.</div>
        </div>
        <BottomBar />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      <TopBar />

      {/* 그룹 정보 제목 블록 */}
      <div className="bg-[#11ABFF] text-white px-4 py-2 flex items-center">
        <h1 className="text-xl font-light">그룹 정보</h1>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="flex-1 px-5 py-5 space-y-3">
        {/* 그룹명 */}
        <div>
          <h3 className="text-md font-medium py-1">
            그룹명
            {isEditMode && (
              <span className="text-xs text-gray-500 ml-2">
                ({editTitle.length}/20)
              </span>
            )}
          </h3>
          {isEditMode ? (
            <input
              type="text"
              className="w-full text-sm border-b border-blue-500 text-gray-700 px-1 py-1 focus:outline-none"
              value={editTitle}
              onChange={handleTitleChange}
              maxLength={20}
              placeholder="그룹명을 입력해 주세요"
            />
          ) : (
            <p className="text-sm border-b border-gray-300 text-gray-400 px-1">
              {groupInfo.title}
            </p>
          )}
        </div>

        {/* 초대 코드 */}
        <div>
          <h3 className="text-md font-medium py-1">초대 코드</h3>
          <div className="relative">
            <span className="text-sm border-b border-gray-300 text-gray-400 px-1 block pr-20">
              {groupInfo.invitationCode}
            </span>
            <button
              onClick={handleCopyInviteCode}
              className="absolute right-1 bottom-1 px-5 py-1 ml-4 border-3 border-[#11ABFF] rounded-[5px] cursor-pointer text-[#11ABFF] text-sm hover:bg-blue-50 transition-colors"
            >
              복사하기
            </button>
          </div>
        </div>

        {/* 목표 */}
        <div>
          <h3 className="text-md font-medium py-1">
            목표
            {isEditMode && (
              <span className="text-xs text-gray-500 ml-2">
                ({editPurpose.length}/30)
              </span>
            )}
          </h3>
          {isEditMode ? (
            <input
              type="text"
              className="w-full text-sm border-b border-blue-500 text-gray-700 px-1 py-1 focus:outline-none"
              value={editPurpose}
              onChange={handlePurposeChange}
              maxLength={30}
              placeholder="목표를 입력해 주세요"
            />
          ) : (
            <p className="text-sm border-b border-gray-300 text-gray-400 px-1">
              {groupInfo.purpose || "-"}
            </p>
          )}
        </div>

        {/* 인원 수 */}
        <div>
          <h3 className="text-md font-medium py-1">
            인원 수
            {isEditMode && (
              <span className="text-xs text-gray-500 ml-2">
                (현재 {groupInfo.members.length}명)
              </span>
            )}
          </h3>
          {isEditMode ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700">
                {groupInfo.members.length} /
              </span>
              <input
                type="text"
                className="w-20 text-xs border-b border-blue-500 text-gray-700 px-1 py-1 focus:outline-none text-center"
                value={editMemberLimit}
                onChange={handleMemberLimitChange}
                maxLength={2}
                placeholder="최대 10명"
                inputMode="numeric"
              />
            </div>
          ) : (
            <p className="text-sm border-b border-gray-300 text-gray-400 px-1">
              {groupInfo.members.length} / {groupInfo.memberLimit}
            </p>
          )}
        </div>

        {/* 참여자 */}
        <div>
          <h3 className="text-md font-medium">참여자</h3>
          <div className="grid grid-cols-2">
            {groupInfo.members.map((member, index) => (
              <div
                key={member.nickname}
                className="flex items-center space-x-3 p-1"
              >
                {/* 멤버 아이콘 */}
                <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden">
                  {member.profileImageUrl ? (
                    <Image
                      src={member.profileImageUrl}
                      alt={member.nickname}
                      width={24}
                      height={24}
                      className="w-full h-full"
                      quality={100}
                      unoptimized={true}
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center text-white text-sm font-light"
                      style={{ backgroundColor: getMemberIconColor(index) }}
                    >
                      {member.nickname.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* 멤버 정보 */}
                <div className="flex items-center">
                  <span className="text-sm text-gray-400 -translate-x-1.5">
                    {member.nickname}
                  </span>
                  {isLeader(member.nickname) && (
                    <Image
                      src="/images/group/그룹장_왕관.svg"
                      alt="그룹장"
                      width={20}
                      height={20}
                      className="-translate-y-0.5"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 하단 버튼 영역 - 바텀 시트로부터 고정 위치 */}
      <div className="absolute bottom-18 left-5 right-5 flex items-center justify-between">
        {/* 그룹 떠나기 버튼 */}
        <button
          onClick={handleLeaveGroupClick}
          className="cursor-pointer hover:opacity-50 transition-opacity"
          disabled={isEditMode}
        >
          <Image
            src="/images/group/그룹_떠나기.svg"
            alt="그룹 떠나기"
            width={100}
            height={40}
            priority
          />
        </button>

        {/* 수정 버튼 영역 - 그룹장만 보임 */}
        {isCurrentUserLeader() && (
          <div className="flex gap-2">
            {isEditMode ? (
              <>
                {/* 수정 취소 버튼 */}
                <button
                  onClick={handleCancelEdit}
                  disabled={isUpdating}
                  className="px-4 py-2 bg-gray-300 text-white rounded-lg text-sm font-medium hover:bg-gray-400 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  취소
                </button>
                {/* 수정 완료 버튼 */}
                <button
                  onClick={handleUpdateGroup}
                  disabled={
                    isUpdating ||
                    editTitle.trim().length === 0 ||
                    editMemberLimit.trim().length === 0
                  }
                  className="px-4 py-2 bg-[#0EABFF] text-white rounded-lg text-sm font-medium hover:bg-blue-600 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? "처리 중..." : "완료"}
                </button>
              </>
            ) : (
              /* 수정 버튼 */
              <button
                onClick={handleEditClick}
                className="px-4 py-2 bg-[#0EABFF] text-white rounded-lg text-sm font-medium hover:bg-blue-600 cursor-pointer transition-colors"
              >
                수정
              </button>
            )}
          </div>
        )}
      </div>

      {/* 첫 번째 모달: 그룹 떠나기 확인 */}
      {showLeaveModal && (
        <>
          {/* 배경 오버레이 */}
          <div
            className="absolute top-0 left-0 right-0 bottom-0 bg-[#d9d9d9] opacity-50 flex h-screen items-center justify-center z-50"
            onClick={handleCloseModal}
          ></div>

          {/* 모달 컨텐츠 */}
          <div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white border-2 border-[#C7C3C3] rounded-[10px] p-2 w-[80%] z-50"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 모달 메시지 */}
            <div className="px-5 py-7 text-center">
              <p className="text-lg leading-relaxed">그룹을 떠나시겠습니까?</p>
            </div>

            {/* 버튼들 */}
            <div className="flex">
              <button
                onClick={handleFirstConfirm}
                className="flex-1 mx-3 mb-4 py-3 text-white text-base font-light border rounded-[10px] bg-pink-500 hover:bg-pink-600 cursor-pointer transition-colors"
              >
                떠나기
              </button>
              <button
                onClick={handleCloseModal}
                className="flex-1 mx-3 mb-4 py-3 text-white text-base font-light border rounded-[10px] bg-[#D4D4D4] hover:bg-gray-400 cursor-pointer transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        </>
      )}

      {/* 두 번째 모달: 새 그룹장 선택 (리더인 경우만) */}
      {showLeaderSelectModal && (
        <>
          {/* 배경 오버레이 */}
          <div
            className="absolute top-0 left-0 right-0 bottom-0 bg-[#d9d9d9] opacity-50 flex h-screen items-center justify-center z-50"
            onClick={handleCloseModal}
          ></div>

          {/* 모달 컨텐츠 */}
          <div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white border-2 border-[#C7C3C3] rounded-[10px] w-[80%] max-w-md z-50"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 모달 헤더 */}
            <div className="text-center py-5 px-6">
              {groupInfo && groupInfo.members.length === 1 ? (
                <>
                  <p className="text-lg">⚠️마지막 그룹원이 떠날 경우</p>
                  <p className="text-lg">그룹이 삭제됩니다</p>
                  <br></br>
                  <p className="text-lg text-red-500">그래도 떠나시겠습니까?</p>
                </>
              ) : (
                <>
                  <p className="text-lg">그룹을 떠나기 전에</p>
                  <p className="text-lg">새 그룹장을 지정해 주세요</p>
                </>
              )}
            </div>

            {/* 멤버 목록 - 마지막 멤버가 아닌 경우만 표시 */}
            {groupInfo && groupInfo.members.length > 1 && (
              <div className="px-6 pb-6">
                <div className="max-h-80 overflow-y-auto">
                  {getNewLeaderCandidates().map((member, index) => (
                    <div
                      key={member.nickname}
                      onClick={() => setSelectedNewLeader(member.nickname)}
                      className={`flex items-center space-x-2 p-2 rounded-[10px] cursor-pointer transition-colors border-white ${
                        selectedNewLeader === member.nickname
                          ? "border-4 border-yellow-300"
                          : "hover:bg-yellow-100"
                      }`}
                    >
                      {/* 멤버 아이콘 */}
                      <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden">
                        {member.profileImageUrl ? (
                          <Image
                            src={member.profileImageUrl}
                            alt={member.nickname}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                            quality={100}
                            unoptimized={true}
                          />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center text-white text-sm font-light"
                            style={{
                              backgroundColor: getMemberIconColor(index),
                            }}
                          >
                            {member.nickname.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      {/* 멤버 정보 */}
                      <div className="flex-1">
                        <span className="text-sm text-gray-400">
                          {member.nickname}
                        </span>
                      </div>

                      {/* 선택 표시 */}
                      {selectedNewLeader === member.nickname && (
                        <Image
                          src="/images/group/그룹장_왕관.svg"
                          alt="그룹장"
                          width={20}
                          height={20}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 버튼들 */}
            <div className="flex px-6 pb-6 space-x-7">
              {groupInfo && groupInfo.members.length === 1 ? (
                // 마지막 멤버인 경우: 떠나기/취소 버튼
                <>
                  <button
                    onClick={handleFinalLeave}
                    className="flex-1 py-3 px-4 bg-pink-500 text-white rounded-[10px] font-light hover:bg-pink-600 cursor-pointer transition-colors"
                  >
                    떠나기
                  </button>
                  <button
                    onClick={handleCloseModal}
                    className="flex-1 py-3 px-4 bg-[#D4D4D4] text-white rounded-[10px] font-light hover:bg-gray-400 cursor-pointer transition-colors"
                  >
                    취소
                  </button>
                </>
              ) : (
                // 다른 멤버가 있는 경우: 지정/취소 버튼
                <>
                  <button
                    onClick={handleFinalLeave}
                    className={`flex-1 py-3 px-4 rounded-[10px] font-light transition-colors ${
                      selectedNewLeader
                        ? "bg-[#0EABFF] text-white hover:bg-blue-600 cursor-pointer"
                        : "bg-[#D4D4D4] text-white cursor-not-allowed"
                    }`}
                    disabled={!selectedNewLeader}
                  >
                    지정
                  </button>
                  <button
                    onClick={handleCloseModal}
                    className="flex-1 py-3 px-4 bg-[#D4D4D4] text-white rounded-[10px] font-light hover:bg-gray-400 cursor-pointer transition-colors"
                  >
                    취소
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}

      <BottomBar />
    </div>
  );
}
