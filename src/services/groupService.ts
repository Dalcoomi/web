// services/groupService.ts
import { get, post, put, del } from "@/utils/apiClient";

// 그룹 생성 API
export const createGroup = async (groupData: any) => {
  return post("/api/team", groupData);
};

// 그룹 참가 API
export const joinGroup = async (invitationCode: string) => {
  return post(`/api/team/join/${invitationCode}`, {});
};
