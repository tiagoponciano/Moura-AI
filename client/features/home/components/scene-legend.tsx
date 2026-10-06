import { cn } from "@/lib/utils";
import type { SceneSystem } from "../scene/materials";

const SYSTEMS: { id: SceneSystem; label: string }[] = [
  { id: "hydrant", label: "Hidrantes" },
  { id: "extinguisher", label: "Extintores" },
  { id: "route", label: "Rotas de fuga" },
];

type SceneLegendProps = {
  active: SceneSystem | null;
  onFocus: (system: SceneSystem | null) => void;
  className?: string;
};

/** Fire protection systems shown in the scene; hovering one highlights it there. */
export function SceneLegend({ active, onFocus, className }: SceneLegendProps) {
  return (
    <div
      data-animate="legend"
      className={cn(
        "flex flex-col items-start gap-1.5 motion-safe:opacity-0",
        className,
      )}
    >
      {SYSTEMS.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          onPointerEnter={() => onFocus(id)}
          onPointerLeave={() => onFocus(null)}
          onFocus={() => onFocus(id)}
          onBlur={() => onFocus(null)}
          className={cn(
            "flex items-center gap-2 rounded-full border bg-card/80 py-1 pr-3 pl-2 text-xs font-medium backdrop-blur-md transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
            active === id && "border-primary/50 text-primary",
          )}
        >
          <span className="size-2 rounded-full bg-primary" />
          {label}
        </button>
      ))}
      <span className="px-1 pt-1 font-mono text-[11px] text-muted-foreground">
        arraste para girar
      </span>
    </div>
  );
}
