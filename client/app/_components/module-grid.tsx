import { MODULES } from "@/lib/modules";
import { ModuleCard } from "./module-card";

export function ModuleGrid() {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      {MODULES.map((module) => (
        <ModuleCard key={module.href} module={module} />
      ))}
    </section>
  );
}
