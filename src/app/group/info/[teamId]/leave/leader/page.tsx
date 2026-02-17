import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import GroupLeaveLeaderTransferPageClient from "@/components/group/GroupLeaveLeaderTransferPageClient";

export const metadata = {
  title: "그룹장 위임",
};

export default async function GroupLeaveLeaderTransferPage() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refreshToken");

  if (!refreshToken) {
    redirect("/");
  }

  return <GroupLeaveLeaderTransferPageClient />;
}
