import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import RootPageClient from "@/components/auth/RootPageClient";

export default async function LoginPage() {
  const cookieStore = await cookies();
  const isLoggedIn = !!cookieStore.get("refreshToken");

  if (isLoggedIn) {
    redirect("/transaction/my");
  }

  return <RootPageClient isLoggedIn={false} />;
}
