// app/group/info/[teamId]/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import GroupInfoPageClient from "@/components/group/GroupInfoPageClient";

export const metadata = {
  title: "그룹 정보 수정",
};

export default async function GroupInfoPage() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refreshToken");

  if (!refreshToken) {
    redirect("/");
  }

  return <GroupInfoPageClient />;
}
