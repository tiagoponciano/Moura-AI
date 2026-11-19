import { ProjectDetail } from "@/features/projects";

export default async function ProjectPage({
  params,
}: PageProps<"/projects/[id]">) {
  const { id } = await params;
  return <ProjectDetail id={id} />;
}
