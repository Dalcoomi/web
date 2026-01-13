// app/group/create/success/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import SuccessGroupPageClient from "@/components/group/SuccessGroupPageClient";
import SuccessGroupPageClientV2 from "@/components/group/SuccessGroupPageClientV2";

export const metadata = {
  title: "그룹 생성 성공",
};

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function SuccessGroupPage({ searchParams }: Props) {
  // 서버에서 인증 확인
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refreshToken");
  const params = await searchParams;

  // 🔥 리프레시 토큰이 없으면 로그인 페이지로
  if (!refreshToken) {
    redirect("/");
  }

  // V2 파라미터(title)가 있으면 V2 컴포넌트 렌더링
  if (params.title) {
    return <SuccessGroupPageClientV2 />;
  }

  return <SuccessGroupPageClient />;
}
