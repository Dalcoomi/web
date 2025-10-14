// app/transaction/group/update/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import UpdateGroupTransactionPageClient from "@/components/transaction/group/UpdateGroupTransactionPageClient";

export const metadata = {
  title: "그룹 거래 내역 추가",
};

export default async function UpdateGroupTransactionPage() {
  // 서버에서 인증 확인
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refreshToken");

  // 🔥 리프레시 토큰이 없으면 로그인 페이지로
  if (!refreshToken) {
    redirect("/");
  }

  return <UpdateGroupTransactionPageClient />;
}
