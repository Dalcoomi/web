// app/transaction/my/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import MyTransactionPageClient from "@/components/transaction/my/MyTransactionPageClient";

export const metadata = {
  title: "내 거래 내역",
};

// 서버 컴포넌트
export default async function MyTransactionPage() {
  // 서버에서 인증 확인
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken");

  if (!accessToken) {
    redirect("/");
  }

  return <MyTransactionPageClient />;
}
