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

  if (!accessToken) {
    redirect("/");
  }

  return <ProfilePageClient />;
}
