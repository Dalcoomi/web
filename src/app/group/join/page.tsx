// app/group/join/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import JoinGroupPageClient from "@/components/group/JoinGroupPageClient";

export default async function JoinGroupPage() {
  // 서버에서 인증 확인
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken");

  if (!accessToken) {
    redirect("/");
  }

  return <JoinGroupPageClient />;
}
