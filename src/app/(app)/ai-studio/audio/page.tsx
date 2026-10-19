import { Suspense } from "react";
import { getSessionUser } from "@/lib/auth/session";
import { SpinnerBlock } from "@/components/ui/states";
import { CreateStudio } from "@/components/create/create-studio";

export default async function CreateAudioPage() {
  let role: string | undefined;
  if (process.env.AUTH_DISABLED === "true") {
    role = "admin";
  } else {
    const user = await getSessionUser();
    role = user?.role;
  }
  return (
    <Suspense fallback={<SpinnerBlock label="Memuat…" />}>
      <CreateStudio type="audio" canModerate={role === "admin"} />
    </Suspense>
  );
}
