import { Suspense } from "react";
import { getSessionUser } from "@/lib/auth/session";
import { SpinnerBlock } from "@/components/ui/states";
import { CreateStudio } from "@/components/create/create-studio";

export default async function CreateVideoPage() {
  const user = await getSessionUser();
  return (
    <Suspense fallback={<SpinnerBlock label="Memuat…" />}>
      <CreateStudio type="video" canModerate={user?.role === "admin"} />
    </Suspense>
  );
}
