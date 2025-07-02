// app/transaction/my/add/writing/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AddMyTransactionPageClient from "@/components/transaction/my/AddWritingMyTransactionPageClient";

export const metadata = {
  title: "내 거래 내역 작성",
};

export default async function AddWritingMyTransactionPage() {
  // 서버에서 인증 확인
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken");

  if (!accessToken) {
    redirect("/");
  }

  return <AddMyTransactionPageClient />;
}
