// app/group/create/success/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import SuccessGroupPageClient from "@/components/group/SuccessGroupPageClient";

export default async function SuccessGroupPage() {
  // 서버에서 인증 확인
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken");

  if (!accessToken) {
    redirect("/");
  }

  return <SuccessGroupPageClient />;
}
