// app/transaction/group/add/receipt/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AddReceiptGroupTransactionPageClient from "@/components/transaction/group/AddReceiptGroupTransactionPageClient";

export const metadata = {
  title: "그룹 거래 내역 영수증 작성",
};

export default async function AddReceiptGroupTransactionPage() {
  // 서버에서 인증 확인
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken");

  if (!accessToken) {
    redirect("/");
  }

  return <AddReceiptGroupTransactionPageClient />;
}
