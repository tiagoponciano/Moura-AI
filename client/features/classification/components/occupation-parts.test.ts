import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { Facts } from "../lib/engine/types";
import { classifyWithParts } from "../lib/mixed-parts";
import type { OccupationPart } from "../lib/mixed-occupancy";
import { ClassificationPanel } from "./classification-panel";
import { OccupationParts } from "./occupation-parts";

const DATE = "2026-11-12";
const answers: Facts = {
  fire_load_class: "medium",
  special_risks: false,
  risk_exempt: false,
  has_basement: false,
  storage_over_3_5m: false,
  single_block: true,
  single_use: false,
  only_subsidiary: false,
};
const part = (division: string, area_m2: number): OccupationPart => ({
  division,
  area_m2,
  top_height_m: 8,
  storeys: 3,
  separation: "open",
});
const render = (parts: OccupationPart[]) =>
  renderToStaticMarkup(createElement(OccupationParts, { parts }));

describe("OccupationParts", () => {
  it("shows nothing without occupations", () => {
    expect(render([])).toBe("");
  });

  it("lists each occupation, marks the predominant one and names the reading as provisional", () => {
    const html = render([part("A-2", 500), part("C-2", 1500)]);
    expect(html).toContain("A-2");
    expect(html).toContain("(predominante)");
    expect(html).toContain("1.500 m²");
    expect(html).toContain("Ocupação mista (art. 11)");
    expect(html).toContain("ainda não confirmada");
  });

  it("names the secondary case when the other areas are 10% or less", () => {
    expect(render([part("A-2", 900), part("C-2", 100)])).toContain(
      "Ocupações secundárias (art. 12)",
    );
  });
});

describe("ClassificationPanel with occupations", () => {
  it("asks for the occupations in the panel when the property mixes uses and none is recorded", () => {
    const html = renderToStaticMarkup(
      createElement(ClassificationPanel, {
        answers,
        sources: {},
        classification: classifyWithParts(answers, [], DATE),
        onChange: () => {},
        onReset: () => {},
      }),
    );
    expect(html).toContain("Quais são as ocupações");
    expect(html).not.toContain("Ocupações da edificação");
  });

  it("names the podium and the towers, and does not call the podium the predominant one", () => {
    const html = render([
      { ...part("C-2", 800), role: "podium" },
      { ...part("A-2", 300), role: "tower" },
    ]);
    expect(html).toContain("(embasamento)");
    expect(html).toContain("(torre)");
    expect(html).not.toContain("(predominante)");
  });
});
