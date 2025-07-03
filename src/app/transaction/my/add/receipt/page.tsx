// app/transaction/my/add/receipt/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AddReceiptMyTransactionPageClient from "@/components/transaction/my/AddReceiptMyTransactionPageClient";

export const metadata = {
  title: "개인 거래 내역 영수증 작성",
};

export default async function AddReceiptMyTransactionPage() {
  // 서버에서 인증 확인
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken");

  if (!accessToken) {
    redirect("/");
  }

  return <AddReceiptMyTransactionPageClient />;
}
