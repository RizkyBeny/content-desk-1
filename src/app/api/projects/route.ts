import { handle, ok, currentUser, ApiError } from "@/lib/api";
import { createProjectSchema } from "@/lib/validators/project";
import { createProject } from "@/lib/services/projects";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  return handle(async () => {
    const user = await currentUser();
    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const q = url.searchParams.get("q");
    const projects = await prisma.project.findMany({
      where: {
        userId: user.id,
        ...(status && status !== "all" ? { status } : {}),
        ...(q ? { topicTitle: { contains: q } } : {}),
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
    });
    return ok({
      items: projects.map((p) => ({
        id: p.id,
        origin: p.origin,
        topicTitle: p.topicTitle,
        contentType: p.contentType,
        status: p.status,
        angleTitle: p.angleTitle,
        updatedAt: p.updatedAt.toISOString(),
      })),
    });
  });
}

export async function POST(req: Request) {
  return handle(async () => {
    const user = await currentUser();
    const body = await req.json().catch(() => null);
    const parsed = createProjectSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(parsed.error.issues[0]?.message ?? "Data proyek tidak valid.", 400);
    }
    const project = await createProject(user, {
      origin: parsed.data.origin,
      topicTitle: parsed.data.topicTitle.trim(),
      topicSource: parsed.data.topicSource,
      topicInsight: parsed.data.topicInsight as never,
    });
    return ok({ projectId: project.id }, 201);
  });
}
