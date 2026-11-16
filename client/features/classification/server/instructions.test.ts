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
        has_basement: false,
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

  it("teaches the occupations tool, and says each call replaces the list", () => {
    const text = buildInstructions({}, DATE);
    expect(text).toContain("`record_parts`");
    expect(text).toContain("replaces the previous list");
  });

  it("carries the recorded occupations and asks for them when the property mixes uses", () => {
    const state = { single_use: false, only_subsidiary: false };
    expect(buildInstructions(state, DATE)).toContain("Quais são as ocupações");
    const text = buildInstructions(state, DATE, [
      {
        division: "C-2",
        area_m2: 1500,
        top_height_m: 8,
        storeys: 3,
        separation: "open",
      },
      {
        division: "A-2",
        area_m2: 500,
        top_height_m: 8,
        storeys: 3,
        separation: "open",
      },
    ]);
    expect(text).toContain("- C-2: 1500 m2");
    expect(text).toContain("- A-2: 500 m2");
    expect(text).not.toContain("Quais são as ocupações");
  });

  it("teaches the enlargement tool and carries the recorded enlargement", () => {
    const text = buildInstructions({}, DATE);
    expect(text).toContain("`record_enlargement`");
    expect(text).toContain("Enlargement already recorded");
    const recorded = buildInstructions({}, DATE, [], {
      originalAreaM2: 700,
      addedAreaM2: 105,
      originalRegularized: true,
      compartmented: true,
      newIsolatedBlock: false,
      graceYearsMet: true,
      raisesRigor: false,
    });
    expect(recorded).toContain('"addedAreaM2":105');
  });

  it("teaches the faults tool with every row to choose from, and carries the recorded ones", () => {
    const text = buildInstructions({}, DATE);
    expect(text).toContain("`record_faults`");
    expect(text).toContain("- D1:");
    expect(text).toContain("- D15:");
    expect(text).toContain("none yet");
    const recorded = buildInstructions({}, DATE, [], undefined, ["D5", "D6"]);
    expect(recorded).toContain(
      "recorded (Annex D of IN 5, for new buildings):\nD5, D6",
    );
  });

  it("keeps the next question for after the subject the user is on", () => {
    const text = buildInstructions({}, DATE);
    expect(text).toContain("Stay on the subject of the last message");
    expect(text).toContain("occupations of a mixed building");
    expect(text).toContain("do not add the next question above");
  });

  it("tells the model how to record towers over a podium", () => {
    expect(buildInstructions({}, DATE)).toContain("role podium");
    const text = buildInstructions({}, DATE, [
      {
        division: "C-2",
        area_m2: 800,
        top_height_m: 8,
        storeys: 2,
        separation: "open",
        role: "podium",
      },
      {
        division: "A-2",
        area_m2: 300,
        top_height_m: 30,
        storeys: 10,
        separation: "open",
        role: "tower",
      },
    ]);
    expect(text).toContain(
      "- A-2: 300 m2, last floor at 30 m, 10 storeys, open, tower",
    );
  });
});
