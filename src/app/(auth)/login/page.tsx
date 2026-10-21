import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  if (process.env.AUTH_DISABLED === "true") {
    redirect("/overview");
  }
  const user = await getSessionUser();
  if (user) redirect("/overview");
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Suspense fallback={<div className="h-[360px] w-full max-w-[420px] rounded-2xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
