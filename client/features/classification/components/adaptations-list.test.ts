import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { classify } from "../lib/classify";
import type { Facts } from "../lib/engine/types";
import { adaptationsFor } from "../lib/in5-adaptations";
import { AdaptationsList } from "./adaptations-list";
import { RequirementRow } from "./requirement-row";

describe("AdaptationsList", () => {
  it("shows each section with its items and the norm it comes from", () => {
    const adaptations = adaptationsFor("hydraulic_preventive", "adaptable")!;
    const html = renderToStaticMarkup(
      createElement(AdaptationsList, { adaptations }),
    );
    expect(html).toContain("IN 7");
    expect(html).toContain("Adequações");
    expect(html).toContain("Substituições");
    expect(html).toContain("mangueiras com comprimento superior");
  });
});

describe("RequirementRow with an IN 5 class", () => {
  const existing: Facts = {
    division: "C-2",
    area_m2: 2500,
    storeys: 3,
    height_m: 9,
    single_block: true,
    single_use: true,
    storage_over_3_5m: false,
    special_risks: false,
    risk_exempt: false,
    has_basement: false,
    fire_load_class: "medium",
    building_condition: "existing",
  };

  it("lists the Annex C adaptations of a required system that has a table", () => {
    const system = classify(existing, "2026-11-12").groups.required.find(
      (s) => s.adaptations,
    );
    expect(system).toBeDefined();
    const html = renderToStaticMarkup(
      createElement(RequirementRow, { system: system! }),
    );
    expect(html).toContain("Adaptações admitidas");
  });

  it("lists none for a new building", () => {
    const html = classify(
      { ...existing, building_condition: "new" },
      "2026-11-12",
    ).groups.required.some((s) => s.adaptations);
    expect(html).toBe(false);
  });
});
