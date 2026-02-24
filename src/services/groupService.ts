// services/groupService.ts
import { get, post, del, patch } from "@/utils/apiClient";
import { useToastStore } from "@/stores/useToastStore";
import { isDemoMode } from "@/utils/demoMode";
import {
  createDemoGroup,
  getDemoSelfMember,
  getDemoGroupInfo,
  getDemoGroups,
  joinDemoGroup,
  leaveDemoGroup,
  updateDemoGroup,
  updateDemoGroupOrder,
} from "@/services/demoData";

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
  if (isDemoMode()) {
    return createDemoGroup(groupData);
  }

  const requestData: GroupRequestDto = {
    teamId: null,
    ...groupData,
  };
  return post("/api/teams", requestData);
};

export const joinGroup = async (
  invitationCode: string,
): Promise<{ teamId: string; title: string }> => {
  if (isDemoMode()) {
    return joinDemoGroup(invitationCode);
  }
  return post(`/api/teams/join/${invitationCode}`, {});
};

export const getGroups = async (): Promise<GetMyTeamsResponse> => {
  if (isDemoMode()) {
    const demoSelf = getDemoSelfMember();
    const groups = getDemoGroups().map((group) => ({
      teamId: group.teamId,
      title: group.title,
      memberCount: group.members.length,
      memberLimit: group.memberLimit,
      label: group.label,
      isLeader: group.leaderNickname === demoSelf.nickname,
    }));
    return { groups };
  }

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
  if (isDemoMode()) {
    const demoSelf = getDemoSelfMember();
    const target = getDemoGroupInfo(teamId);
    if (!target) {
      throw new Error("그룹 정보를 찾을 수 없습니다.");
    }
    return {
      teamId: target.teamId,
      title: target.title,
      invitationCode: target.invitationCode,
      memberLimit: target.memberLimit,
      purpose: target.purpose,
      leaderNickname: target.leaderNickname,
      members: target.members.map((member) => ({
        nickname: member.nickname,
        profileImageUrl: member.profileImageUrl,
      })),
      label: target.label,
      isLeader: target.leaderNickname === demoSelf.nickname,
    };
  }

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
  if (isDemoMode()) {
    updateDemoGroup({
      teamId: String(groupData.teamId),
      title: groupData.title,
      memberLimit: groupData.memberLimit,
      purpose: groupData.purpose,
      label: groupData.label,
    });
    return;
  }
  await patch("/api/teams", groupData);
};

export const leaveGroup = async (
  teamId: string,
  nextLeaderNickname?: string,
): Promise<void> => {
  if (isDemoMode()) {
    leaveDemoGroup(teamId, nextLeaderNickname);
    return;
  }

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
  if (isDemoMode()) {
    updateDemoGroupOrder(orders);
    return;
  }
  await patch("/api/teams/order", { orders });
};
