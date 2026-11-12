import { describe, expect, it } from "vitest";
import { buildInstructions } from "./instructions";

const DATE = "2026-11-12";

describe("buildInstructions", () => {
  it("lists every fact and names the tool", () => {
    const text = buildInstructions({}, DATE);
    for (const fact of [
      "division",
      "area_m2",
      "storeys",
      "height_m",
      "fire_load_class",
      "single_block",
      "single_use",
      "storage_over_3_5m",
    ]) {
      expect(text).toContain(`- ${fact}:`);
    }
    expect(text).toContain("`record_answers`");
  });

  it("says nothing is recorded yet and asks the division first", () => {
    const text = buildInstructions({}, DATE);
    expect(text).toContain("none yet");
    expect(text).toContain(
      'Next question to ask: "Qual é a atividade do imóvel?',
    );
  });

  it("carries what the panel already holds, with não sei, and asks the next thing", () => {
    const text = buildInstructions(
      { division: "C-2", area_m2: 3200, fire_load_class: null },
      DATE,
    );
    expect(text).toContain("- division: C-2");
    expect(text).toContain("- area_m2: 3200");
    expect(text).toContain("- fire_load_class: não sei");
    expect(text).toContain(
      'Next question to ask: "Quantos pavimentos tem o imóvel?"',
    );
  });

  it("says there is nothing to ask once every needed answer is in", () => {
    const text = buildInstructions(
      {
        division: "C-2",
        area_m2: 700,
        storeys: 1,
        single_block: true,
        single_use: true,
        storage_over_3_5m: false,
      },
      DATE,
    );
    expect(text).toContain("Next question to ask: none");
  });

  it("forbids stating requirements or citing norms, and keeps the reply in Portuguese", () => {
    const text = buildInstructions({}, DATE);
    expect(text).toContain(
      "Do NOT say which systems are required, cite norms or tables",
    );
    expect(text).toContain("Brazilian Portuguese");
    expect(text).toContain("NEVER invent or estimate data");
  });

  it("ignores a stored fact it does not know", () => {
    expect(buildInstructions({ colour: "red" }, DATE)).not.toContain("colour");
  });
});
