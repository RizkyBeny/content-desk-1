import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getProjectForUser } from "@/lib/services/projects";
import { getBriefByProject } from "@/lib/services/briefs";
import { ProjectFlow } from "@/components/project/project-flow";
import type { Angle, BriefDTO, ContentType, RecommendedType } from "@/types";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let user;
  if (process.env.AUTH_DISABLED === "true") {
    user = { id: "dev", role: "admin", email: "dev@platform.local", name: "Dev User" } as any;
  } else {
    user = await getSessionUser();
    if (!user) redirect("/login");
  }

  let project;
  try {
    project = await getProjectForUser(user as any, id);
  } catch {
    notFound();
  }
  const brief = await getBriefByProject(user as any, id);

  return (
    <ProjectFlow
      project={{
        id: project.id,
        topicTitle: project.topicTitle ?? "",
        topicSource: project.topicSource ?? "custom",
        angles: (project.angles as unknown as Angle[]) ?? [],
        selectedAngleId: project.selectedAngleId,
        angleTitle: project.angleTitle,
        recommendedTypes: (project.recommendedTypes as unknown as RecommendedType[]) ?? [],
        contentType: (project.contentType as ContentType | null) ?? null,
      }}
      initialBrief={brief as BriefDTO | null}
    />
  );
}
