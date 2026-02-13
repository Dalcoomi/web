// app/group/create/success/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import SuccessGroupPageClient from "@/components/group/SuccessGroupPageClient";

export const metadata = {
  title: "그룹 생성 성공",
};

export default async function SuccessGroupPage() {
  // 서버에서 인증 확인
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refreshToken");

  // 🔥 리프레시 토큰이 없으면 로그인 페이지로
  if (!refreshToken) {
    redirect("/");
  }

  return <SuccessGroupPageClient />;
}
