// app/transaction/my/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import MyTransactionPageClient from "@/components/transaction/my/MyTransactionPageClient";

export const metadata = {
  title: "개인 거래 내역",
};

// 서버 컴포넌트
export default async function MyTransactionPage() {
  // 서버에서 인증 확인
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refreshToken");

  // 🔥 리프레시 토큰이 없으면 로그인 페이지로
  if (!refreshToken) {
    redirect("/");
  }

  return <MyTransactionPageClient />;
}
