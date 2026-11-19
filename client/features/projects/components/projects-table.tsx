import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Project } from "@/lib/projects/project";
import { formatArea, summarizeProject } from "../lib/project-summary";

type ProjectsTableProps = { projects: Project[] };

/** One row per project: name with its city, occupation and area. */
export function ProjectsTable({ projects }: ProjectsTableProps) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Projeto</TableHead>
            <TableHead>Ocupação</TableHead>
            <TableHead>Área</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => {
            const { city, occupancy, area } = summarizeProject(project);
            return (
              <TableRow key={project.id}>
                <TableCell>
                  <Link
                    href={`/projects/${project.id}`}
                    className="flex flex-col font-medium outline-none hover:underline focus-visible:underline"
                  >
                    {project.name}
                    {city && (
                      <span className="text-xs font-normal text-muted-foreground">
                        {city}
                      </span>
                    )}
                  </Link>
                </TableCell>
                <TableCell>
                  {occupancy ? (
                    <Badge variant="secondary">{occupancy}</Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatArea(area) ?? "—"}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
