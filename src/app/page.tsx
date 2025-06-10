// app/page.tsx (루트 페이지 - 로그인)
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import LoginPageClient from "@/components/auth/LoginPageClient";

export const metadata = {
  title: "로그인 | 달쿠미",
};

export default async function RootPage() {
  // 서버에서 인증 확인
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken");

  // 이미 로그인된 경우 내 거래 페이지로 리다이렉트
  if (accessToken) {
    redirect("/transaction/my");
  }

  // 로그인되지 않은 경우 로그인 페이지 표시
  return <LoginPageClient />;
}
