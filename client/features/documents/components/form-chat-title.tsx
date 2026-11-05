import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

type FormChatTitleProps = {
  name: string;
  onBack: () => void;
};

/** Chat title of an official form: its name and the way back to the gallery. */
export function FormChatTitle({ name, onBack }: FormChatTitleProps) {
  return (
    <div className="-ml-2 flex min-w-0 items-center gap-1">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onBack}
        aria-label="Voltar aos modelos"
      >
        <ArrowLeft />
      </Button>
      <span className="truncate text-sm font-medium">{name}</span>
    </div>
  );
}
