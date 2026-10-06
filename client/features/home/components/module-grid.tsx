import { MODULES } from "@/lib/modules";
import { ModuleCard } from "./module-card";

type ModuleGridProps = {
  onFocus: (href: string | null) => void;
};

export function ModuleGrid({ onFocus }: ModuleGridProps) {
  return (
    <nav
      aria-label="Módulos"
      className="mx-auto grid w-full max-w-5xl gap-4 md:grid-cols-3 lg:gap-5"
    >
      {MODULES.map((module) => (
        <ModuleCard key={module.href} module={module} onFocus={onFocus} />
      ))}
    </nav>
  );
}
