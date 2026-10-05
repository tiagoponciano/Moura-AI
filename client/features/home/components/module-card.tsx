import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { MODULE_STATUS_LABEL, type AppModule } from "@/lib/modules";
import { cn } from "@/lib/utils";

export function ModuleCard({ module }: { module: AppModule }) {
  const { href, label, summary, icon: Icon, status } = module;
  const soon = status === "soon";

  return (
    <Link
      href={href}
      className={cn(
        "group flex flex-col gap-4 rounded-xl border bg-card p-5 transition-colors",
        "hover:border-primary/40 hover:bg-accent/40 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
      )}
    >
      <div className="flex items-start justify-between">
        <div
          className={cn(
            "flex size-10 items-center justify-center rounded-lg",
            soon
              ? "bg-muted text-muted-foreground"
              : "bg-primary/10 text-primary",
          )}
        >
          <Icon className="size-5" />
        </div>
        <Badge variant={soon ? "outline" : "secondary"}>
          {MODULE_STATUS_LABEL[status]}
        </Badge>
      </div>
      <div className="flex flex-1 flex-col gap-1.5">
        <h2 className="font-medium">{label}</h2>
        <p className="text-sm text-muted-foreground">{summary}</p>
      </div>
      <span className="flex items-center gap-1 text-sm font-medium text-primary">
        {soon ? "Ver detalhes" : "Abrir"}
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
