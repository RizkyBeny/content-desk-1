import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { AppShell } from "@/components/layout/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (process.env.AUTH_DISABLED === "true") {
    return (
      <AppShell user={{ id: "dev", name: "Dev User", email: "dev@platform.local", role: "admin" }}>
        {children}
      </AppShell>
    );
  }
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return (
    <AppShell user={{ id: user.id, name: user.name, email: user.email, role: user.role }}>
      {children}
    </AppShell>
  );
}
