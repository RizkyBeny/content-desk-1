import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  if (process.env.AUTH_DISABLED === "true") {
    redirect("/ai-studio/image");
  }
  const user = await getSessionUser();
  if (user) redirect("/ai-studio/image");
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <LoginForm />
    </div>
  );
}
