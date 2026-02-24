import { getRefreshToken } from "@/utils/tokenManager";

export const isDemoMode = () => {
  if (typeof window === "undefined") {
    return false;
  }

  return !getRefreshToken();
};
