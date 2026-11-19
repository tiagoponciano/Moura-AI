/** Characters a file name cannot hold on the common systems, and control characters. */
const FORBIDDEN = /[\\/:*?"<>|\u0000-\u001f]+/g;

/** The longest `<name> - <project>` kept, extension apart, so a path stays short. */
const MAX_BASE_LENGTH = 120;

const clean = (text: string) =>
  text.replace(FORBIDDEN, " ").replace(/\s+/g, " ").trim();

/**
 * `Anexo C.docx` as `Anexo C - Loja Centro.docx`: the file's own name first, then the
 * project's. Without a project the name is left as it is. Characters a file name cannot
 * hold are replaced by a space, and the project's part is cut first when the name is long.
 */
export function nameWithProject(
  fileName: string,
  projectName: string | undefined,
): string {
  const project = clean(projectName ?? "");
  if (!project) return fileName;
  const dot = fileName.lastIndexOf(".");
  const hasExtension = dot > 0 && fileName.length - dot <= 6;
  const base =
    clean(hasExtension ? fileName.slice(0, dot) : fileName) || "arquivo";
  const extension = hasExtension ? fileName.slice(dot) : "";
  const room = Math.max(MAX_BASE_LENGTH - base.length - 3, 10);
  return `${base} - ${project.slice(0, room).trim()}${extension}`;
}
