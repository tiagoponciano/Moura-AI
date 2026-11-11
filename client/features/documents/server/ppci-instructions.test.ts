import { describe, expect, it } from "vitest";
import type { ChecklistGroup } from "../lib/ppci-answers";
import { buildPpciInstructions } from "./ppci-instructions";

const group: ChecklistGroup = {
  position: 1,
  name: "Extintores",
  items: [
    { position: 1, section: null, text: "Definir o agente", reference: null },
    {
      position: 2,
      section: "Rodas",
      text: "Prever extintores",
      reference: null,
    },
  ],
};

describe("buildPpciInstructions", () => {
  it("names the group and lists only the items it is given", () => {
    const prompt = buildPpciInstructions(group, [group.items[1]], 1);
    expect(prompt).toContain(
      'Current group: "Extintores" (1 of 2 items already answered)',
    );
    expect(prompt).toContain("2. [Rodas] Prever extintores");
    expect(prompt).not.toContain("Definir o agente");
  });

  it("says so when nothing is left in the group", () => {
    expect(buildPpciInstructions(group, [], 2)).toContain(
      "every item of this group is answered",
    );
  });

  it("tells the model to wait for confirmation of anything inferred", () => {
    expect(buildPpciInstructions(group, [], 0)).toContain(
      "wait for the user to confirm",
    );
  });
});
