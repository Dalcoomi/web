// app/group/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import GroupMainPageClient from "@/components/group/GroupMainPageClient";

export const metadata = {
  title: "그룹 메인",
};

export default async function GroupPage() {
  // 서버에서 인증 확인
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken");

  if (!accessToken) {
    redirect("/");
  }

  return <GroupMainPageClient />;
}
