import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fileExtension, type ProjectFile } from "@/lib/projects/files";

type ProjectFileButtonProps = {
  file: ProjectFile;
  /** What the button says; the file's extension when absent. */
  label?: string;
  onDownload: (file: ProjectFile) => void;
};

/** Downloads one file kept in the project. */
export function ProjectFileButton({
  file,
  label,
  onDownload,
}: ProjectFileButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      aria-label={`Baixar ${file.file_name}`}
      onClick={() => onDownload(file)}
    >
      <Download /> {label ?? fileExtension(file.file_name)}
    </Button>
  );
}
