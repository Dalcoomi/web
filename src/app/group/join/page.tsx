// app/group/join/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import JoinGroupPageClient from "@/components/group/JoinGroupPageClient";

export const metadata = {
  title: "그룹 참가",
};

export default async function JoinGroupPage() {
  // 서버에서 인증 확인
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refreshToken");

  // 🔥 리프레시 토큰이 없으면 로그인 페이지로
  if (!refreshToken) {
    redirect("/");
  }

  return <JoinGroupPageClient />;
}
