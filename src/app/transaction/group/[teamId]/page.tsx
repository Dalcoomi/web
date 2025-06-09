// app/transaction/group/[teamId]/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import GroupTransactionPageClient from "@/components/transaction/group/GroupTransactionPageClient";

export default async function GroupTransactionPage() {
  // 서버에서 인증 확인
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken");

  if (!accessToken) {
    redirect("/");
  }

  return <GroupTransactionPageClient />;
}
