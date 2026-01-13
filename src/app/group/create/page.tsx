// app/group/create/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import CreateGroupPageClientV2 from "@/components/group/CreateGroupPageClientV2";

export const metadata = {
  title: "그룹 생성",
};

export default async function CreateGroupPage() {
  // 서버에서 인증 확인
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refreshToken");

  // 🔥 리프레시 토큰이 없으면 로그인 페이지로
  if (!refreshToken) {
    redirect("/");
  }

  return <CreateGroupPageClientV2 />;
}
