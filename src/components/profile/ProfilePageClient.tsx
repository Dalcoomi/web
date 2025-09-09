// components/profile/ProfilePageClient.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import TopBar from "@/components/ui/TopBar";
import BottomBar from "@/components/ui/BottomBar";
import { useMemberStore } from "@/stores/useMemberStore";
import { useAuth } from "@/hooks/useAuth";
import { withdrawMember, WithdrawalType } from "@/services/memberService";
import {
  getGroups,
  getGroupInfo,
  Group,
  GroupInfo,
} from "@/services/groupService";

export default function ProfilePageClient() {
  const router = useRouter();
  const { member, fetchMember } = useMemberStore();
  const { logout, isLoggedIn } = useAuth();

  // 모달 상태들
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showGroupLeaveModal, setShowGroupLeaveModal] = useState(false);
  const [showLeaderSelectModal, setShowLeaderSelectModal] = useState(false);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState<WithdrawalType | null>(
    null
  );
  const [otherReason, setOtherReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // 그룹 관련 상태
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [currentGroupInfo, setCurrentGroupInfo] = useState<GroupInfo | null>(
    null
  );
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [leaderTransferInfos, setLeaderTransferInfos] = useState<
    Array<{ teamId: number; nextLeaderNickname: string }>
  >([]);
  const [selectedNewLeader, setSelectedNewLeader] = useState<string>("");

  // 회원 정보가 없으면 가져오기 (단, 로그인된 상태에서만)
  useEffect(() => {
    if (!member && isLoggedIn) {
      fetchMember();
    }
  }, [member, isLoggedIn, fetchMember]);

  // 현재 그룹이 변경될 때마다 그룹 정보 조회
  useEffect(() => {
    const loadCurrentGroupInfo = async () => {
      if (
        showGroupLeaveModal &&
        myGroups.length > 0 &&
        currentGroupIndex < myGroups.length
      ) {
        const currentGroup = myGroups[currentGroupIndex];
        try {
          const groupInfo = await getGroupInfo(currentGroup.teamId);
          setCurrentGroupInfo(groupInfo);
        } catch (error) {
          console.error(`그룹 ${currentGroup.title} 정보 조회 실패:`, error);
          setCurrentGroupInfo(null);
        }
      }
    };

    loadCurrentGroupInfo();
  }, [showGroupLeaveModal, myGroups, currentGroupIndex]);

  const handleProfileUpdate = () => {
    router.push("/profile/update");
  };

  const handlePrivacyPolicy = () => {
    window.open(
      "https://dalcoomi.notion.site/2326ea725ec881628880db9f9f487680",
      "_blank"
    );
  };

  const handleTermsOfService = () => {
    window.open(
      "https://dalcoomi.notion.site/2326ea725ec880d69db1ecccb049bcf9",
      "_blank"
    );
  };

  const handleLogout = () => {
    logout();
  };

  // 회원탈퇴 버튼 클릭
  const handleWithdrawalClick = () => {
    setShowWithdrawModal(true);
  };

  // 첫 번째 모달에서 '네' 클릭 - 그룹 조회 및 그룹 탈퇴 모달로 이동
  const handleFirstConfirm = async () => {
    setIsLoadingGroups(true);

    try {
      const groupsResponse = await getGroups();
      setMyGroups(groupsResponse.groups);
      setCurrentGroupIndex(0);

      setShowWithdrawModal(false);

      if (groupsResponse.groups.length > 0) {
        // 속한 그룹이 있으면 그룹 탈퇴 모달 표시
        setShowGroupLeaveModal(true);
      } else {
        // 속한 그룹이 없으면 바로 탈퇴 사유 선택으로
        setShowReasonModal(true);
      }
    } catch (error) {
      alert("그룹 정보를 불러오는데 실패했습니다.");
      console.error("그룹 조회 실패:", error);
    } finally {
      setIsLoadingGroups(false);
    }
  };

  // 그룹 탈퇴 처리 완료 후 탈퇴 사유 선택 모달로 이동
  const handleGroupLeaveComplete = () => {
    setShowGroupLeaveModal(false);
    setShowReasonModal(true);
  };

  // 개별 그룹 처리 (그룹장이면 권한 이양 모달, 아니면 바로 다음 그룹)
  const handleProcessCurrentGroup = () => {
    if (!currentGroupInfo || currentGroupIndex >= myGroups.length) return;

    const isLeader = currentGroupInfo.leaderNickname === member?.nickname;
    const isLastMember = currentGroupInfo.members.length === 1;

    if (isLeader && !isLastMember) {
      // 그룹장이고 다른 멤버가 있는 경우 - 권한 이양 모달 표시
      setShowLeaderSelectModal(true);
    } else {
      // 일반 멤버이거나 마지막 멤버인 경우 - 다음 그룹으로
      moveToNextGroup();
    }
  };

  // 그룹장 권한 이양 정보 저장 후 다음 그룹으로
  const handleLeaderTransfer = (nextLeaderNickname: string) => {
    if (!currentGroupInfo || !selectedNewLeader) return;

    // 권한 이양 정보 저장
    setLeaderTransferInfos((prev) => [
      ...prev,
      {
        teamId: Number(currentGroupInfo.teamId),
        nextLeaderNickname,
      },
    ]);

    setShowLeaderSelectModal(false);
    setSelectedNewLeader("");
    moveToNextGroup();
  };

  // 다음 그룹으로 이동하거나 완료 처리
  const moveToNextGroup = () => {
    setCurrentGroupInfo(null);
    if (currentGroupIndex < myGroups.length - 1) {
      setCurrentGroupIndex((prev) => prev + 1);
    } else {
      // 모든 그룹 처리 완료
      handleGroupLeaveComplete();
    }
  };

  // 최종 회원탈퇴 실행
  const handleFinalWithdraw = async () => {
    if (!selectedReason) {
      alert("탈퇴 사유를 선택해 주세요.");
      return;
    }

    if (selectedReason === WithdrawalType.OTHER && !otherReason.trim()) {
      alert("기타 사유를 입력해 주세요.");
      return;
    }

    setIsProcessing(true);

    try {
      // 회원탈퇴 API 호출 (그룹 탈퇴도 함께 처리됨)
      await withdrawMember({
        withdrawalType: selectedReason,
        otherReason:
          selectedReason === WithdrawalType.OTHER ? otherReason : undefined,
        leaderTransferInfos,
      });

      alert("회원탈퇴가 완료되었습니다.");
      logout(); // 로그아웃 처리
    } catch (error) {
      alert(error || "회원탈퇴 중 오류가 발생했습니다.");
    } finally {
      setIsProcessing(false);
    }
  };

  // 모달 닫기
  const handleCloseModal = () => {
    setShowWithdrawModal(false);
    setShowGroupLeaveModal(false);
    setShowLeaderSelectModal(false);
    setShowReasonModal(false);
    setSelectedReason(null);
    setOtherReason("");
    setMyGroups([]);
    setCurrentGroupIndex(0);
    setCurrentGroupInfo(null);
    setLeaderTransferInfos([]);
  };

  // 탈퇴 사유 옵션들 (백엔드 enum과 일치)
  const withdrawalReasons = [
    { type: WithdrawalType.LOW_USAGE_FREQUENCY, label: "사용 빈도가 낮아요" },
    {
      type: WithdrawalType.LACK_OF_FEATURES,
      label: "기능이 부족하거나 불편했어요",
    },
    {
      type: WithdrawalType.USING_OTHER_SERVICE,
      label: "다른 가계부 서비스를 이용하고 있어요",
    },
    {
      type: WithdrawalType.DIFFICULT_UI_UX,
      label: "UI/UX가 복잡하거나 어려웠어요",
    },
    {
      type: WithdrawalType.FREQUENT_BUGS,
      label: "오류나 버그가 자주 발생했어요",
    },
    { type: WithdrawalType.PRIVACY_CONCERN, label: "개인 정보가 걱정돼요" },
    { type: WithdrawalType.OTHER, label: "기타(직접 입력)" },
  ];

  // 멤버 아이콘 색상 (그룹 정보 페이지와 동일)
  const getMemberIconColor = (index: number) => {
    const colors = [
      "#F9F90C", // 노란색
      "#94A7EF", // 보라색
      "#FCC9EC", // 연분홍
      "#45D076", // 연녹색
    ];
    return colors[index % colors.length];
  };

  // 새 그룹장 후보자 목록 (현재 그룹장 제외)
  const getNewLeaderCandidates = () => {
    if (!currentGroupInfo) return [];
    return currentGroupInfo.members.filter(
      (member) => member.nickname !== currentGroupInfo.leaderNickname
    );
  };

  // 로그인 상태가 아니거나 회원 정보가 없는 경우
  if (!member) {
    return <div className="h-screen bg-white flex flex-col"></div>;
  }

  return (
    <div className="h-screen bg-white flex flex-col">
      <TopBar />

      <main className="flex-1 px-6 py-4 overflow-y-auto">
        {/* Profile Section */}
        <div className="text-center mb-6">
          <h1 className="text-2xl text-black mb-4">
            {member?.nickname || "사용자"}
          </h1>

          <div className="w-24 h-24 mx-auto mb-6 relative">
            {member?.profileImageUrl ? (
              <Image
                src={member.profileImageUrl}
                alt={`${member.nickname}`}
                width={96}
                height={96}
                quality={100}
                unoptimized={true}
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center"></div>
            )}
          </div>
        </div>

        {/* Menu Section */}
        <div className="bg-gray-50 rounded-lg shadow-sm">
          <div className="divide-y divide-gray-100">
            <button
              onClick={handleProfileUpdate}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-100 cursor-pointer transition-colors"
            >
              <span className="text-gray-600">프로필 수정</span>
              <span className="text-gray-400">›</span>
            </button>
          </div>
        </div>

        {/* Policy & Help Section */}
        <div className="bg-gray-50 rounded-lg text-sm shadow-sm mt-4">
          <div className="divide-y divide-gray-100">
            <button
              onClick={handlePrivacyPolicy}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-100 cursor-pointer transition-colors"
            >
              <span className="text-gray-600">개인정보 처리방침</span>
              <span className="text-gray-400">›</span>
            </button>

            <button
              onClick={handleTermsOfService}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-100 cursor-pointer transition-colors"
            >
              <span className="text-gray-600">서비스 이용약관</span>
              <span className="text-gray-400">›</span>
            </button>
          </div>
        </div>

        {/* Logout & Withdrawal Buttons */}
        <div className="mt-6 space-y-3">
          <button
            onClick={handleLogout}
            className="w-full bg-red-50 text-red-600 py-3 px-4 rounded-lg text-sm font-medium hover:bg-red-100 cursor-pointer transition-colors"
          >
            로그아웃
          </button>
          <button
            onClick={handleWithdrawalClick}
            className="w-full text-gray-400 py-3 px-4 rounded-lg text-sm font-medium hover:bg-gray-100 cursor-pointer transition-colors"
          >
            회원탈퇴
          </button>
        </div>
      </main>

      {/* 첫 번째 모달: 회원탈퇴 확인 */}
      {showWithdrawModal && (
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
              <p className="text-lg leading-relaxed">
                회원탈퇴를 하시겠습니까?
              </p>
            </div>

            {/* 버튼들 */}
            <div className="flex">
              <button
                onClick={handleFirstConfirm}
                disabled={isLoadingGroups}
                className="flex-1 mx-3 mb-4 py-3 text-white text-base font-light border rounded-[10px] bg-[#0EABFF] hover:bg-blue-600 cursor-pointer transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoadingGroups ? "처리 중..." : "네"}
              </button>
              <button
                onClick={handleCloseModal}
                disabled={isLoadingGroups}
                className="flex-1 mx-3 mb-4 py-3 text-white text-base font-light border rounded-[10px] bg-[#D4D4D4] hover:bg-gray-400 cursor-pointer transition-colors disabled:cursor-not-allowed"
              >
                아니오
              </button>
            </div>
          </div>
        </>
      )}

      {/* 두 번째 모달: 그룹 탈퇴 처리 */}
      {showGroupLeaveModal && (
        <>
          {/* 배경 오버레이 */}
          <div className="absolute top-0 left-0 right-0 bottom-0 bg-[#d9d9d9] opacity-50 flex h-screen items-center justify-center z-50"></div>

          {/* 모달 컨텐츠 */}
          <div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white border-2 border-[#C7C3C3] rounded-[10px] w-[85%] max-w-md z-50"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 모달 헤더 */}
            <div className="text-center py-5 px-6 border-b border-gray-200">
              <p className="text-lg font-medium">그룹 떠나기</p>
              <p className="text-sm text-gray-500 mt-2">
                탈퇴 전에 모든 그룹을 떠나야 합니다
              </p>
            </div>

            {/* 그룹 목록 또는 완료 메시지 */}
            <div className="px-6 py-6">
              {currentGroupIndex >= myGroups.length ? (
                <div className="text-center py-8">
                  <p className="text-green-600 font-medium">
                    모든 그룹 처리 완료
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    이제 탈퇴 사유를 선택해 주세요
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-gray-600 mb-4">
                    {currentGroupIndex + 1} / {myGroups.length}
                  </p>
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <p className="font-medium text-gray-800">
                      {myGroups[currentGroupIndex]?.title}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      현재 인원: {myGroups[currentGroupIndex]?.memberCount}명
                    </p>
                  </div>

                  {/* 그룹 정보에 따른 메시지 */}
                  {!currentGroupInfo ? (
                    <p className="text-sm text-gray-600">
                      그룹 정보를 확인하고 있습니다...
                    </p>
                  ) : (
                    <div>
                      {currentGroupInfo.leaderNickname === member?.nickname ? (
                        currentGroupInfo.members.length === 1 ? (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-md mt-1">
                              ⚠️ 마지막 그룹원이 떠날 경우
                            </p>
                            <p className="text-md text-red-600 mt-1">
                              그룹이 삭제됩니다
                            </p>
                          </div>
                        ) : (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <p className="text-sm text-yellow-600 mt-1">
                              새 그룹장을 지정해 주세요
                            </p>
                          </div>
                        )
                      ) : (
                        <p className="text-sm text-red-500">
                          위 그룹을 떠나시겠습니까?
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 버튼들 */}
            <div className="flex px-6 pb-6 space-x-3 border-t border-gray-200 pt-4">
              {currentGroupIndex >= myGroups.length ? (
                <button
                  onClick={handleGroupLeaveComplete}
                  className="w-full py-3 px-4 bg-[#0EABFF] text-white rounded-[10px] font-light hover:bg-blue-600 cursor-pointer transition-colors"
                >
                  다음
                </button>
              ) : (
                <>
                  <button
                    onClick={handleProcessCurrentGroup}
                    disabled={!currentGroupInfo}
                    className={`flex-1 py-3 px-4 rounded-[10px] font-light transition-colors ${
                      currentGroupInfo
                        ? "bg-[#0EABFF] text-white hover:bg-blue-600 cursor-pointer"
                        : "bg-[#D4D4D4] text-white cursor-not-allowed"
                    }`}
                  >
                    다음
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

      {/* 세 번째 모달: 그룹장 선택 (권한 이양이 필요한 경우만) */}
      {showLeaderSelectModal && currentGroupInfo && (
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
              <p className="text-lg">새 그룹장을 지정해 주세요</p>
              <p className="text-sm text-gray-500 mt-2">
                그룹명: {currentGroupInfo.title}
              </p>
            </div>

            {/* 멤버 목록 */}
            <div className="px-6 pb-6">
              <div className="max-h-80 overflow-y-auto">
                {getNewLeaderCandidates().map((memberItem, index) => (
                  <div
                    key={memberItem.nickname}
                    onClick={() => setSelectedNewLeader(memberItem.nickname)}
                    className={`flex items-center space-x-2 p-2 rounded-[10px] cursor-pointer transition-colors border-white ${
                      selectedNewLeader === memberItem.nickname
                        ? "border-4 border-yellow-300"
                        : "hover:bg-yellow-100"
                    }`}
                  >
                    {/* 멤버 아이콘 */}
                    <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden">
                      {memberItem.profileImageUrl ? (
                        <Image
                          src={memberItem.profileImageUrl}
                          alt={memberItem.nickname}
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
                          {memberItem.nickname.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* 멤버 정보 */}
                    <div className="flex-1">
                      <span className="text-sm text-gray-700">
                        {memberItem.nickname}
                      </span>
                    </div>

                    {/* 선택 표시 */}
                    {selectedNewLeader === memberItem.nickname && (
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

            {/* 버튼들 */}
            <div className="flex px-6 pb-6 space-x-3">
              <button
                onClick={() => handleLeaderTransfer(selectedNewLeader)}
                disabled={!selectedNewLeader}
                className={`flex-1 py-3 px-4 rounded-[10px] font-light transition-colors ${
                  selectedNewLeader
                    ? "bg-[#0EABFF] text-white hover:bg-blue-600 cursor-pointer"
                    : "bg-[#D4D4D4] text-white cursor-not-allowed"
                }`}
              >
                지정
              </button>
              <button
                onClick={() => {
                  setShowLeaderSelectModal(false);
                  setSelectedNewLeader("");
                }}
                className="flex-1 py-3 px-4 bg-[#D4D4D4] text-white rounded-[10px] font-light hover:bg-gray-400 cursor-pointer transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        </>
      )}

      {/* 네 번째 모달: 탈퇴 사유 선택 */}
      {showReasonModal && (
        <>
          {/* 배경 오버레이 */}
          <div
            className="absolute top-0 left-0 right-0 bottom-0 bg-[#d9d9d9] opacity-50 flex h-screen items-center justify-center z-50"
            onClick={handleCloseModal}
          ></div>

          {/* 모달 컨텐츠 */}
          <div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white border-2 border-[#C7C3C3] rounded-[10px] w-[85%] max-w-md z-50 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 모달 헤더 */}
            <div className="text-center py-5 px-6">
              <p className="text-lg">탈퇴 사유를 선택해 주세요</p>
              <p className="text-sm text-[#11ABFF] mt-1">
                이용 중 불편하셨던 점이 있다면 알려주세요
              </p>
              <p className="text-sm text-[#11ABFF] mt-1">
                더 나은 서비스로 보답하겠습니다
              </p>
            </div>

            {/* 탈퇴 사유 목록 */}
            <div className="px-4">
              <div className="space-y-1">
                {withdrawalReasons.map((reason) => (
                  <div key={reason.type}>
                    <button
                      onClick={() => setSelectedReason(reason.type)}
                      className={`w-full text-left p-3 rounded-lg transition-colors text-sm cursor-pointer ${
                        selectedReason === reason.type
                          ? "bg-blue-50 border-2 border-[#0EABFF]"
                          : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent"
                      }`}
                    >
                      <div className="flex items-center">
                        <div
                          className={`w-4 h-4 rounded-full border-2 mr-2 flex items-center justify-center ${
                            selectedReason === reason.type
                              ? "border-[#0EABFF] bg-[#0EABFF]"
                              : "border-gray-300"
                          }`}
                        >
                          {selectedReason === reason.type && (
                            <div className="w-2 h-2 rounded-full bg-white"></div>
                          )}
                        </div>
                        <span className="text-gray-700">{reason.label}</span>
                      </div>
                    </button>

                    {/* 기타 사유 입력란 */}
                    {selectedReason === WithdrawalType.OTHER &&
                      reason.type === WithdrawalType.OTHER && (
                        <div className="mt-2 ml-7">
                          <textarea
                            value={otherReason}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value.length <= 50) {
                                setOtherReason(value);
                              }
                            }}
                            placeholder="구체적인 사유를 입력해 주세요 (최대 50자)"
                            maxLength={50}
                            className="w-full p-2 border border-gray-300 rounded-lg resize-none text-xs"
                            rows={2}
                          />
                          <div className="text-right text-xs text-gray-500">
                            {otherReason.length}/50
                          </div>
                        </div>
                      )}
                  </div>
                ))}
              </div>
            </div>

            {/* 버튼들 */}
            <div className="flex px-6 pb-6 space-x-3 pt-3">
              <button
                onClick={handleFinalWithdraw}
                disabled={isProcessing || !selectedReason}
                className={`flex-1 py-3 px-4 rounded-[10px] font-light transition-colors ${
                  selectedReason && !isProcessing
                    ? "bg-[#0EABFF] text-white hover:bg-blue-600 cursor-pointer"
                    : "bg-[#D4D4D4] text-white cursor-not-allowed"
                }`}
              >
                {isProcessing ? "탈퇴 처리중..." : "탈퇴하기"}
              </button>
              <button
                onClick={handleCloseModal}
                disabled={isProcessing}
                className="flex-1 py-3 px-4 bg-[#D4D4D4] text-white rounded-[10px] font-light hover:bg-gray-400 cursor-pointer transition-colors disabled:cursor-not-allowed"
              >
                취소
              </button>
            </div>
          </div>
        </>
      )}

      <BottomBar />
    </div>
  );
}
