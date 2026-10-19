import { handle, ok, currentUser, ApiError } from "@/lib/api";
import { profileSchema } from "@/lib/validators/invite";
import { updateProfile } from "@/lib/services/users";

function serialize(user: {
  id: string;
  name: string;
  email: string;
  role: string;
  theme: string;
  contentLang: string;
  niche: string | null;
  nicheCategories: unknown;
  avatarUrl: string | null;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    theme: user.theme,
    contentLang: user.contentLang,
    niche: user.niche,
    nicheCategories: Array.isArray(user.nicheCategories) ? user.nicheCategories : [],
    avatarUrl: user.avatarUrl,
  };
}

export async function GET() {
  return handle(async () => {
    const user = await currentUser();
    return ok({ user: serialize(user) });
  });
}

export async function PATCH(req: Request) {
  return handle(async () => {
    const user = await currentUser();
    const body = await req.json().catch(() => null);
    const parsed = profileSchema.safeParse(body);
    if (!parsed.success) throw new ApiError("Data pengaturan tidak valid.", 400);
    const updated = await updateProfile(user, parsed.data);
    return ok({ user: serialize(updated) });
  });
}
