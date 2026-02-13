// app/transaction/group/[teamId]/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import GroupTransactionPageClient from "@/components/transaction/group/GroupTransactionPageClient";

export const metadata = {
  title: "그룹 거래 내역",
};

export default async function GroupTransactionPage() {
  // 서버에서 인증 확인
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refreshToken");

  // 🔥 리프레시 토큰이 없으면 로그인 페이지로
  if (!refreshToken) {
    redirect("/");
  }

  return <GroupTransactionPageClient />;
}
