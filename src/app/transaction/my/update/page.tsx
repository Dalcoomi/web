// app/transaction/my/update/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import UpdateMyTransactionPageClient from "@/components/transaction/my/UpdateMyTransactionPageClient";

export const metadata = {
  title: "개인 거래 내역 수정",
};

export default async function UpdateMyTransactionPage() {
  // 서버에서 인증 확인
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken");
  const refreshToken = cookieStore.get("refreshToken");

  // 🔥 리프레시 토큰이 없으면 로그인 페이지로
  if (!refreshToken) {
    redirect("/");
  }

  return <UpdateMyTransactionPageClient />;
}
