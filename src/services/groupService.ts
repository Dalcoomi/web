// services/groupService.ts
import { get, post, put, del, patch } from "@/utils/apiClient";

// 🔥 중복 요청 방지를 위한 Promise 캐시
let pendingGroupsRequest: Promise<GetMyTeamsResponse> | null = null;
const pendingGroupInfoRequests = new Map<string, Promise<GroupInfo>>();

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

// 그룹 생성/수정 요청 DTO
export interface GroupRequestDto {
  teamId: string | null; // 생성 시 null, 수정 시 teamId
  title: string;
  memberLimit: number;
  purpose: string | null;
}

// 그룹 생성 API
export const createGroup = async (groupData: Omit<GroupRequestDto, 'teamId'>) => {
  const requestData: GroupRequestDto = {
    teamId: null, // 생성 시 null
    ...groupData,
  };
  return post("/api/teams", requestData);
};

// 그룹 참가 API
export const joinGroup = async (invitationCode: string) => {
  return post(`/api/teams/join/${invitationCode}`, {});
};

// 내 그룹 리스트 조회 API
export const getGroups = async (): Promise<GetMyTeamsResponse> => {
  // 🔥 이미 동일한 요청이 진행 중이면 기존 Promise 반환
  if (pendingGroupsRequest) {
    console.log("[getGroups] 중복 요청 방지");
    return pendingGroupsRequest;
  }

  // 🔥 새로운 요청 시작
  pendingGroupsRequest = (async () => {
    try {
      console.log("[getGroups] 새 요청 시작");
      const response = await get("/api/teams");
      return response;
    } catch (error) {
      alert(error);
      return {
        groups: [],
      };
    } finally {
      // 🔥 요청 완료 후 캐시에서 제거 (50ms 후)
      setTimeout(() => {
        pendingGroupsRequest = null;
        console.log("[getGroups] 캐시 정리 완료");
      }, 50);
    }
  })();

  return pendingGroupsRequest;
};

// 그룹 정보 조회 API
export const getGroupInfo = async (teamId: string): Promise<GroupInfo> => {
  const url = `/api/teams/${teamId}`;

  // 🔥 이미 동일한 요청이 진행 중이면 기존 Promise 반환
  if (pendingGroupInfoRequests.has(url)) {
    console.log(`[getGroupInfo] 중복 요청 방지: ${url}`);
    return pendingGroupInfoRequests.get(url)!;
  }

  // 🔥 새로운 요청 시작
  const requestPromise = (async () => {
    try {
      console.log(`[getGroupInfo] 새 요청 시작: ${url}`);
      const response = await get(url);
      return response;
    } catch (error) {
      throw error;
    } finally {
      // 🔥 요청 완료 후 캐시에서 제거 (50ms 후)
      setTimeout(() => {
        pendingGroupInfoRequests.delete(url);
        console.log(`[getGroupInfo] 캐시 정리 완료: ${url}`);
      }, 50);
    }
  })();

  pendingGroupInfoRequests.set(url, requestPromise);
  return requestPromise;
};

// 그룹 수정 API
export const updateGroup = async (groupData: GroupRequestDto): Promise<void> => {
  try {
    await patch("/api/teams", groupData);
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

    await del(`/api/teams/leave`, requestBody);
  } catch (error) {
    alert(error);

    throw error;
  }
};

// 🔥 그룹 순서 변경 API
export interface GroupOrderItem {
  teamId: string;
  displayOrder: number;
}

export const updateGroupOrder = async (
  orders: GroupOrderItem[]
): Promise<void> => {
  try {
    await patch("/api/teams/order", { orders });
  } catch (error) {
    throw error;
  }
};
