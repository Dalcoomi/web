// app/transaction/group/add/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AddGroupTransactionPageClient from "@/components/transaction/group/AddGroupTransactionPageClient";

export default async function AddGroupTransactionPage() {
  // 서버에서 인증 확인
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken");

  if (!accessToken) {
    redirect("/");
  }

  return <AddGroupTransactionPageClient />;
}
