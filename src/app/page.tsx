import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";

export default async function Home() {
  if (process.env.AUTH_DISABLED === "true") {
    redirect("/overview");
    return;
  }
  const user = await getSessionUser();
  redirect(user ? "/overview" : "/login");
}
