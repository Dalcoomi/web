// app/profile/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import ProfilePageClient from "@/components/profile/ProfilePageClient";

export const metadata = {
  title: "마이페이지",
};

// 서버 컴포넌트
export default async function ProfilePage() {
  // 서버에서 인증 확인
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken");
  const refreshToken = cookieStore.get("refreshToken");

  // 🔥 리프레시 토큰이 없으면 로그인 페이지로
  if (!refreshToken) {
    redirect("/");
  }

  return <ProfilePageClient />;
}
