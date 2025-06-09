// components/group/GroupInfoPageClient.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { getGroupInfo, leaveGroup, GroupInfo } from "@/services/groupService";
import { getMember, Member } from "@/services/memberService";
import Image from "next/image";
import TopBar from "@/components/ui/TopBar";
import BottomBar from "@/components/ui/BottomBar";

export default function GroupInfoPageClient() {
  const router = useRouter();
  const params = useParams();
  const teamId = params.teamId as string;

  const [memberInfo, setMemberInfo] = useState<Member | null>(null);
  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showLeaderSelectModal, setShowLeaderSelectModal] = useState(false);
  const [selectedNewLeader, setSelectedNewLeader] = useState<string>("");

  // 그룹 정보 로드
  useEffect(() => {
    // 100ms 후에 실행
    const timeoutId = setTimeout(async () => {
      if (!teamId) {
        router.replace("/group");
        return;
      }

      try {
        setIsLoading(true);
        console.log(`그룹 정보 조회 요청: ${teamId}`);

        const response = await getGroupInfo(teamId);

        setGroupInfo(response);
      } catch (error) {
        console.error("그룹 정보 로드 오류:", error);
        alert("그룹 정보를 불러올 수 없습니다.");

        router.replace("/group");
      } finally {
        setIsLoading(false);
      }
    }, 100);

    const timeoutId2 = setTimeout(async () => {
      try {
        setIsLoading(true);
        console.log("회원 조회 요청");

        const response = await getMember();

        setMemberInfo(response);
      } catch (error) {
        console.error("회원 정보 로드 오류:", error);
        alert("회원 정보를 불러올 수 없습니다.");

        router.replace("/group");
      } finally {
        setIsLoading(false);
      }
    }, 100);

    // cleanup: 다음 effect 실행 전에 이전 timeout 취소
    return () => {
      clearTimeout(timeoutId);
      clearTimeout(timeoutId2);
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
      console.error("복사 실패:", error);
      alert("복사에 실패했습니다. 다시 시도해 주세요.");
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
      console.error("그룹 떠나기 오류:", error);
      alert(error.message || "그룹 떠나기 중 오류가 발생했습니다.");
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
      "#FFD700", // 노란색
      "#87CEEB", // 하늘색
      "#FFB6C1", // 연분홍
      "#98FB98", // 연녹색
      "#DDA0DD", // 연보라
      "#F0E68C", // 카키색
      "#FFA07A", // 연주황
      "#B0E0E6", // 파우더블루
      "#F5DEB3", // 밀색
      "#D3D3D3", // 연회색
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

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen bg-white">
        <TopBar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">로딩 중...</div>
        </div>
        <BottomBar />
      </div>
    );
  }

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
          <h3 className="text-md font-medium py-1">그룹명</h3>
          <p className="text-sm border-b border-gray-300 text-gray-400 px-1">
            {groupInfo.title}
          </p>
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
          <h3 className="text-md font-medium py-1">목표</h3>
          <p className="text-sm border-b border-gray-300 text-gray-400 px-1">
            {groupInfo.purpose || "-"}
          </p>
        </div>

        {/* 인원 수 */}
        <div>
          <h3 className="text-md font-medium py-1">인원 수</h3>
          <p className="text-sm border-b border-gray-300 text-gray-400 px-1">
            {groupInfo.members.length} / {groupInfo.memberLimit}
          </p>
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
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-light"
                  style={{ backgroundColor: getMemberIconColor(index) }}
                >
                  {member.nickname.charAt(0).toUpperCase()}
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

      {/* 그룹 떠나기 버튼 - 바텀 시트로부터 고정 위치 */}
      <div className="absolute bottom-18 left-5">
        <button
          onClick={handleLeaveGroupClick}
          className="cursor-pointer hover:opacity-50 transition-opacity"
        >
          <Image
            src="/images/group/그룹_떠나기.svg"
            alt="그룹 떠나기"
            width={100}
            height={40}
            priority
          />
        </button>
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
                className="flex-1 mx-3 mb-4 py-3 text-white text-base font-light border rounded-[10px] bg-[#0EABFF] hover:bg-blue-600 cursor-pointer transition-colors"
              >
                네
              </button>
              <button
                onClick={handleCloseModal}
                className="flex-1 mx-3 mb-4 py-3 text-white text-base font-light border rounded-[10px] bg-[#D4D4D4] hover:bg-gray-400 cursor-pointer transition-colors"
              >
                아니오
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
                  <p className="text-lg">마지막 인원이 떠날 경우</p>
                  <p className="text-lg">그룹이 삭제됩니다.</p>
                  <br></br>
                  <p className="text-lg text-red-500">그래도 떠나시겠습니까?</p>
                </>
              ) : (
                <>
                  <p className="text-lg">그룹을 떠나기 전에</p>
                  <p className="text-lg">새 그룹장을 지정해 주세요.</p>
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
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-light"
                        style={{
                          backgroundColor: getMemberIconColor(index + 1),
                        }}
                      >
                        {member.nickname.charAt(0).toUpperCase()}
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
                    className="flex-1 py-3 px-4 bg-[#0EABFF] text-white rounded-[10px] font-light hover:bg-blue-600 cursor-pointer transition-colors"
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
