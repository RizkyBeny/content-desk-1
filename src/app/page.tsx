import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";

export default async function Home() {
  if (process.env.AUTH_DISABLED === "true") {
    redirect("/ai-studio/image");
    return;
  }
  const user = await getSessionUser();
  redirect(user ? "/ai-studio/image" : "/login");
}
