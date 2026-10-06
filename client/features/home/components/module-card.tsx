import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { SpotlightCard } from "@/components/shared/spotlight-card";
import { MODULE_STATUS_LABEL, type AppModule } from "@/lib/modules";
import { cn } from "@/lib/utils";

type ModuleCardProps = {
  module: AppModule;
  onFocus: (href: string | null) => void;
};

/** Link to a module; hovering or focusing it tells the scene which part to emphasize. */
export function ModuleCard({ module, onFocus }: ModuleCardProps) {
  const { href, label, summary, icon: Icon, status } = module;
  const soon = status === "soon";

  return (
    <Link
      href={href}
      data-animate="card"
      onPointerEnter={() => onFocus(href)}
      onPointerLeave={() => onFocus(null)}
      onFocus={() => onFocus(href)}
      onBlur={() => onFocus(null)}
      className="group block rounded-xl focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none motion-safe:opacity-0"
    >
      <SpotlightCard className="h-full bg-card/80 p-5 backdrop-blur-md transition-[border-color,translate] duration-300 group-hover:-translate-y-0.5 group-hover:border-primary/45">
        <div className="flex items-start justify-between">
          <div
            className={cn(
              "flex size-10 items-center justify-center rounded-lg",
              soon
                ? "bg-muted text-muted-foreground"
                : "bg-primary text-primary-foreground",
            )}
          >
            <Icon className="size-5" />
          </div>
          <ArrowRight className="size-4 text-muted-foreground transition-[color,translate] group-hover:translate-x-0.5 group-hover:text-primary" />
        </div>
        <h2 className="mt-4 flex items-center gap-2 font-medium">
          {label}
          {status !== "available" && (
            <Badge variant={soon ? "outline" : "secondary"}>
              {MODULE_STATUS_LABEL[status]}
            </Badge>
          )}
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">{summary}</p>
      </SpotlightCard>
    </Link>
  );
}
