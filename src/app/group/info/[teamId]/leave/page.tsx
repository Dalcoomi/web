import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import GroupLeavePageClient from "@/components/group/GroupLeavePageClient";

export const metadata = {
  title: "그룹 떠나기",
};

export default async function GroupLeavePage() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refreshToken");

  if (!refreshToken) {
    redirect("/");
  }

  return <GroupLeavePageClient />;
}
