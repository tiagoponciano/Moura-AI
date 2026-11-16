import type { Adaptations } from "../lib/in5-adaptations";

/** What Annex C of IN 5 allows for a system, section by section, as printed. */
export function AdaptationsList({ adaptations }: { adaptations: Adaptations }) {
  return (
    <details className="flex flex-col gap-2 text-xs">
      <summary className="cursor-pointer font-medium">
        Adaptações admitidas (IN 5, Anexo C, {adaptations.norm})
      </summary>
      <div className="mt-2 flex flex-col gap-2.5">
        {adaptations.sections.map((section) => (
          <section key={section.kind} className="flex flex-col gap-1">
            <h3 className="font-medium">{section.title}</h3>
            {section.intro && (
              <p className="text-muted-foreground">{section.intro}</p>
            )}
            <ul className="flex flex-col gap-1 text-muted-foreground">
              {section.items.map((item) => (
                <li key={`${item.group}-${item.text}`}>
                  {item.group && (
                    <span className="font-medium text-foreground">
                      {item.group}:{" "}
                    </span>
                  )}
                  {item.text}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </details>
  );
}
