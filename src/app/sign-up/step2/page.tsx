// app/sign-up/step2/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import SignUpInfoClient from "@/components/auth/SignUpInfoClient";

export const metadata = {
  title: "회원가입",
};

export default async function SignUpInfoPage() {
  // 서버에서 인증 확인
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refreshToken");

  // 이미 로그인된 경우 메인으로 리다이렉트
  if (refreshToken) {
    redirect("/transaction/my");
  }

  return <SignUpInfoClient />;
}
