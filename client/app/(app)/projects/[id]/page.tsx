import { ProjectClassificationSummary } from "@/features/classification";
import { ProjectDocumentsSummary } from "@/features/documents";
import { ProjectFloorPlansSummary } from "@/features/floor-plans";
import { ProjectDetail } from "@/features/projects";

export default async function ProjectPage({
  params,
}: PageProps<"/projects/[id]">) {
  const { id } = await params;
  return (
    <ProjectDetail id={id}>
      <ProjectClassificationSummary projectId={id} />
      <ProjectDocumentsSummary projectId={id} />
      <ProjectFloorPlansSummary projectId={id} />
    </ProjectDetail>
  );
}
