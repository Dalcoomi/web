// app/transaction/my/add/writing/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AddMyTransactionPageClient from "@/components/transaction/my/AddWritingMyTransactionPageClient";

export const metadata = {
  title: "개인 거래 내역 직접 작성",
};

export default async function AddWritingMyTransactionPage() {
  // 서버에서 인증 확인
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refreshToken");

  // 🔥 리프레시 토큰이 없으면 로그인 페이지로
  if (!refreshToken) {
    redirect("/");
  }

  return <AddMyTransactionPageClient />;
}
