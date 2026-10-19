import { handle, ok, currentUser } from "@/lib/api";
import { getProjectForUser } from "@/lib/services/projects";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await currentUser();
    const { id } = await ctx.params;
    const project = await getProjectForUser(user, id);
    const brief = await prisma.contentBrief.findUnique({ where: { projectId: id } });
    return ok({
      project: {
        ...project,
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
      },
      hasBrief: !!brief,
    });
  });
}
