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
  const accessToken = cookieStore.get("accessToken");

  if (!accessToken) {
    redirect("/");
  }

  return <ProfileUpdatePageClient />;
}
