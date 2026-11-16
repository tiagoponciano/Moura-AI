import annexJson from "../norms/in-5/annex-c.json";

export type AdaptationKind =
  "adaptations" | "compensations" | "exemptions" | "substitutions";

export type AdaptationSection = {
  kind: AdaptationKind;
  title: string;
  intro: string;
  items: { text: string; group?: string }[];
};

export type Adaptations = { norm: string; sections: AdaptationSection[] };

type Class = "vital" | "indispensable" | "adaptable";

const TITLES: Record<AdaptationKind, string> = {
  adaptations: "Adequações",
  compensations: "Compensações",
  exemptions: "Isenções",
  substitutions: "Substituições",
};

/** The table of Annex C for each system, and the group of its adaptations when the table splits them. */
const TABLE_OF: Record<string, { norm: string; group?: string }> = {
  hydraulic_preventive: { norm: "IN 7" },
  emergency_exits: { norm: "IN 9" },
  fire_alarm: { norm: "IN 12" },
  automatic_detection: { norm: "IN 12" },
  low_voltage_installations: { norm: "IN 19" },
  combustible_gas: { norm: "IN 8" },
  horizontal_compartmentation: {
    norm: "IN 14",
    group: "Compartimentação Horizontal",
  },
  vertical_compartmentation: {
    norm: "IN 14",
    group: "Compartimentação Vertical",
  },
};

/**
 * Arts. 21 and 23: a vital or indispensable system gets the adaptations (and their
 * compensations), never the substitutions or exemptions of the annex. Art. 25: an
 * adaptable one gets all of them.
 */
const KINDS: Record<Class, AdaptationKind[]> = {
  vital: ["adaptations", "compensations"],
  indispensable: ["adaptations", "compensations"],
  adaptable: ["adaptations", "compensations", "exemptions", "substitutions"],
};

type Section = {
  intro: string;
  applicable: boolean;
  items: { text: string; group?: string }[];
};

/** What Annex C allows for a system of that class; `undefined` when the annex has no table for it. */
export function adaptationsFor(
  systemId: string,
  treatment: Class,
): Adaptations | undefined {
  const table = TABLE_OF[systemId];
  const system = annexJson.systems.find((s) => s.norm === table?.norm);
  if (!table || !system) return undefined;
  const sections: AdaptationSection[] = [];
  for (const kind of KINDS[treatment]) {
    const section = system.sections[kind] as Section;
    const items =
      kind === "adaptations" && table.group
        ? section.items.filter((item) => item.group === table.group)
        : section.items;
    const applicable =
      section.applicable &&
      items.some((item) => !/^n[ãa]o aplic/i.test(item.text));
    if (!applicable) continue;
    sections.push({
      kind,
      title: TITLES[kind],
      intro: section.intro,
      items,
    });
  }
  return sections.length > 0 ? { norm: system.norm, sections } : undefined;
}
