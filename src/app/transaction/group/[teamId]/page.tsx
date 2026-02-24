import { redirect } from "next/navigation";
import GroupTransactionPageClient from "@/components/transaction/group/GroupTransactionPageClient";

export const metadata = {
  title: "그룹 거래 내역",
};

export default async function GroupTransactionPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;

  if (!/^\d+$/.test(teamId)) {
    redirect("/transaction/group");
  }

  return <GroupTransactionPageClient />;
}
