import { Info } from "lucide-react";
import type { ReactNode } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
};

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="flex items-center gap-1.5">
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <Tooltip>
            <TooltipTrigger
              aria-label="Sobre esta página"
              className="rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <Info className="size-4" />
            </TooltipTrigger>
            <TooltipContent side="right">{description}</TooltipContent>
          </Tooltip>
        )}
      </div>
      {actions}
    </div>
  );
}
