// services/groupService.ts
import { get, post, del, patch } from "@/utils/apiClient";
import { useToastStore } from "@/stores/useToastStore";

let pendingGroupsRequest: Promise<GetMyTeamsResponse> | null = null;
const pendingGroupInfoRequests = new Map<string, Promise<GroupInfo>>();

export interface Group {
  teamId: string;
  title: string;
  memberCount: number;
  memberLimit: number;
  label: string;
  isLeader?: boolean;
}

export interface GetMyTeamsResponse {
  groups: Group[];
}

export interface GroupInfo {
  teamId: string;
  title: string;
  invitationCode: string;
  memberLimit: number;
  purpose: string;
  leaderNickname: string;
  members: GroupMember[];
  label: string;
  isLeader?: boolean;
}

export interface GroupMember {
  nickname: string;
  profileImageUrl: string;
}

export interface GroupRequestDto {
  teamId: string | null;
  title: string;
  memberLimit: number;
  purpose: string | null;
  label: string;
}

export const createGroup = async (
  groupData: Omit<GroupRequestDto, "teamId">,
) => {
  const requestData: GroupRequestDto = {
    teamId: null,
    ...groupData,
  };
  return post("/api/teams", requestData);
};

export const joinGroup = async (
  invitationCode: string,
): Promise<{ teamId: string; title: string }> => {
  return post(`/api/teams/join/${invitationCode}`, {});
};

export const getGroups = async (): Promise<GetMyTeamsResponse> => {
  if (pendingGroupsRequest) {
    return pendingGroupsRequest;
  }

  pendingGroupsRequest = (async () => {
    try {
      const response = await get("/api/teams");
      return response;
    } catch (error) {
      useToastStore.getState().addToast("error", String(error));
      return {
        groups: [],
      };
    } finally {
      setTimeout(() => {
        pendingGroupsRequest = null;
      }, 50);
    }
  })();

  return pendingGroupsRequest;
};

export const getGroupInfo = async (teamId: string): Promise<GroupInfo> => {
  const url = `/api/teams/${teamId}`;

  if (pendingGroupInfoRequests.has(url)) {
    return pendingGroupInfoRequests.get(url)!;
  }

  const requestPromise = (async () => {
    try {
      const response = await get(url);
      return response;
    } finally {
      setTimeout(() => {
        pendingGroupInfoRequests.delete(url);
      }, 50);
    }
  })();

  pendingGroupInfoRequests.set(url, requestPromise);
  return requestPromise;
};

export const updateGroup = async (groupData: GroupRequestDto): Promise<void> => {
  await patch("/api/teams", groupData);
};

export const leaveGroup = async (
  teamId: string,
  nextLeaderNickname?: string,
): Promise<void> => {
  try {
    const requestBody = {
      teamId: Number(teamId),
      nextLeaderNickname: nextLeaderNickname || null,
    };

    await del(`/api/teams/leave`, requestBody);
  } catch (error) {
    useToastStore.getState().addToast("error", String(error));
    throw error;
  }
};

export interface GroupOrderItem {
  teamId: string;
  displayOrder: number;
}

export const updateGroupOrder = async (
  orders: GroupOrderItem[],
): Promise<void> => {
  await patch("/api/teams/order", { orders });
};
