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

  it("teaches the model to search the activity, confirm it with the user and not ask what it sets", () => {
    const text = buildInstructions({}, DATE);
    expect(text).toContain("`search_activity`");
    expect(text).toContain("even when only one matches");
    expect(text).toContain("never invent an id");
    expect(text).toContain("so do not ask for those");
    expect(text).toContain("not listed in the norm");
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

  it("asks the open scope confirmations together and says how to record a plain yes", () => {
    const text = buildInstructions(
      {
        division: "C-2",
        area_m2: 1800,
        storeys: 2,
        height_m: 9,
        fire_load_class: "medium",
      },
      DATE,
    );
    expect(text).toContain('Next question to ask: "O imóvel é um bloco só');
    expect(text).toContain("single_block = true when the user confirms");
    expect(text).toContain(
      "storage_over_3_5m = false when the user confirms that the building não tem armazenamento acima de 3,5 m",
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
        special_risks: false,
        risk_exempt: false,
        fire_load_class: "medium",
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
