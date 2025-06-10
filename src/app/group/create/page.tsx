// app/group/create/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import CreateGroupPageClient from "@/components/group/CreateGroupPageClient";

export const metadata = {
  title: "그룹 생성",
};

export default async function CreateGroupPage() {
  // 서버에서 인증 확인
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken");

  if (!accessToken) {
    redirect("/");
  }

  return <CreateGroupPageClient />;
}
