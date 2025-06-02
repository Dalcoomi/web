// app/transaction/my/add/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AddMyTransactionPageClient from "@/components/transaction/my/AddMyTransactionPageClient";

export default async function AddMyTransactionPage() {
  // 서버에서 인증 확인
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken");

  if (!accessToken) {
    redirect("/");
  }

  return <AddMyTransactionPageClient />;
}
