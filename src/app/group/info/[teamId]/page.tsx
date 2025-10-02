// app/group/info/[teamId]/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import GroupInfoPageClient from "@/components/group/GroupInfoPageClient";

export const metadata = {
  title: "그룹 정보",
};

export default async function GroupInfoPage() {
  // 서버에서 인증 확인
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken");
  const refreshToken = cookieStore.get("refreshToken");

  // 🔥 리프레시 토큰이 없으면 로그인 페이지로
  if (!refreshToken) {
    redirect("/");
  }

  return <GroupInfoPageClient />;
}
