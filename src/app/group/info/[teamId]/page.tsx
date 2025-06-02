// app/group/info/[teamId]/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import GroupInfoPageClient from "@/components/group/GroupInfoPageClient";

export default async function GroupInfoPage() {
  // 서버에서 인증 확인
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken");

  if (!accessToken) {
    redirect("/");
  }

  return <GroupInfoPageClient />;
}
