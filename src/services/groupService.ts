// services/groupService.ts
import { get, post, put, del } from "@/utils/apiClient";

// 그룹 타입 정의
export interface Group {
  teamId: string; // Long을 string으로 처리
  title: string;
  memberCount: number;
  memberLimit: number;
}

export interface GetMyTeamsResponse {
  groups: Group[];
}

// 그룹 정보 타입 (백엔드 응답에 맞게 수정)
export interface GroupInfo {
  teamId: string;
  title: string;
  invitationCode: string;
  memberLimit: number;
  purpose: string;
  leaderNickname: string;
  members: GroupMember[];
}

export interface GroupMember {
  nickname: string;
  profileImageUrl: string;
}

// 그룹 생성 API
export const createGroup = async (groupData: any) => {
  return post("/api/team", groupData);
};

// 그룹 참가 API
export const joinGroup = async (invitationCode: string) => {
  return post(`/api/team/join/${invitationCode}`, {});
};

// 내 그룹 리스트 조회 API
export const getGroups = async (): Promise<GetMyTeamsResponse> => {
  try {
    const response = await get("/api/team");

    return response;
  } catch (error) {
    alert(error);

    return {
      groups: [],
    };
  }
};

// 그룹 정보 조회 API
export const getGroupInfo = async (teamId: string): Promise<GroupInfo> => {
  try {
    const response = await get(`/api/team/${teamId}`);

    return response;
  } catch (error) {
    throw error;
  }
};

// 그룹 나가기 API
export const leaveGroup = async (
  teamId: string,
  nextLeaderNickname?: string
): Promise<void> => {
  try {
    const requestBody = {
      teamId: Number(teamId),
      nextLeaderNickname: nextLeaderNickname || null,
    };

    await del(`/api/team/leave`, requestBody);
  } catch (error) {
    alert(error);

    throw error;
  }
};
