// app/profile/update/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import ProfileUpdatePageClient from "@/components/profile/ProfileUpdatePageClient";

export const metadata = {
  title: "프로필 수정",
};

// 서버 컴포넌트
export default async function ProfileUpdatePage() {
  // 서버에서 인증 확인
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refreshToken");

  // 🔥 리프레시 토큰이 없으면 로그인 페이지로
  if (!refreshToken) {
    redirect("/");
  }

  return <ProfileUpdatePageClient />;
}
