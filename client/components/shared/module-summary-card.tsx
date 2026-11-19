import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

type ModuleSummaryCardProps = {
  title: string;
  icon: LucideIcon;
  /** The module's page, which opens on the project being looked at. */
  href: string;
  children: ReactNode;
};

/** What one module holds for a project, with the way into the module. */
export function ModuleSummaryCard({
  title,
  icon: Icon,
  href,
  children,
}: ModuleSummaryCardProps) {
  return (
    <section className="flex flex-col gap-3 rounded-lg border p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-medium">
          <Icon className="size-4 text-muted-foreground" /> {title}
        </h2>
        <Button asChild variant="outline" size="sm">
          <Link href={href}>Abrir</Link>
        </Button>
      </div>
      {children}
    </section>
  );
}
