// app/transaction/update/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import UpdateMyTransactionPageClient from "@/components/transaction/my/UpdateMyTransactionPageClient";

export default async function UpdateMyTransactionPage() {
  // 서버에서 인증 확인
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken");

  if (!accessToken) {
    redirect("/");
  }

  return <UpdateMyTransactionPageClient />;
}
