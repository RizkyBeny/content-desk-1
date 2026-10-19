import { Suspense } from "react";
import { getSessionUser } from "@/lib/auth/session";
import { SpinnerBlock } from "@/components/ui/states";
import { CreateStudio } from "@/components/create/create-studio";

export default async function CreateImagePage() {
  const user = await getSessionUser();
  return (
    <Suspense fallback={<SpinnerBlock label="Memuat…" />}>
      <CreateStudio type="image" canModerate={user?.role === "admin"} />
    </Suspense>
  );
}
