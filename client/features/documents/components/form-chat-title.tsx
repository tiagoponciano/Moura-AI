import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

type FormChatTitleProps = {
  name: string;
  project?: string;
  onBack: () => void;
};

/** Chat title of a form: its name, the project and the way back to the forms. */
export function FormChatTitle({ name, project, onBack }: FormChatTitleProps) {
  return (
    <div className="-ml-2 flex min-w-0 items-center gap-1">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onBack}
        aria-label="Voltar aos formulários"
      >
        <ArrowLeft />
      </Button>
      <span className="truncate text-sm font-medium">{name}</span>
      {project && (
        <span className="truncate text-sm text-muted-foreground">
          · {project}
        </span>
      )}
    </div>
  );
}
