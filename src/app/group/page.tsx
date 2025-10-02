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
  const refreshToken = cookieStore.get("refreshToken");

  // 🔥 리프레시 토큰이 없으면 로그인 페이지로
  if (!refreshToken) {
    redirect("/");
  }

  return <GroupMainPageClient />;
}
