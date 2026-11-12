import { describe, expect, it } from "vitest";
import { DIVISIONS } from "./activities";
import {
  OCCUPATIONS,
  OCCUPATION_BY_DIVISION,
  divisionLabel,
  groupName,
} from "./occupations";

describe("occupation catalog", () => {
  it("has the 63 divisions of Tabela 1, each once", () => {
    expect(OCCUPATIONS).toHaveLength(63);
    expect(OCCUPATION_BY_DIVISION.size).toBe(63);
  });

  it("names every group from A to M", () => {
    const groups = new Map(OCCUPATIONS.map((o) => [o.group, o.occupation]));
    expect([...groups.keys()]).toEqual([
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
      "H",
      "I",
      "J",
      "K",
      "L",
      "M",
    ]);
    expect(groups.get("C")).toBe("Comercial");
    expect(groups.get("I")).toBe("Indústria");
  });

  it("describes the commercial divisions as the norm does", () => {
    expect(divisionLabel("C-1")).toBe(
      "C-1 · Comércio com baixa carga de incêndio",
    );
    expect(divisionLabel("C-3")).toBe("C-3 · Shopping centers");
    expect(groupName("C-2")).toBe("Comercial");
  });

  it("keeps the id alone for a division it does not know", () => {
    expect(divisionLabel("Z-9")).toBe("Z-9");
    expect(groupName("Z-9")).toBeUndefined();
  });

  it("has every division that has an activity in IN 3, Annex A", () => {
    for (const division of DIVISIONS) {
      expect(OCCUPATION_BY_DIVISION.has(division), division).toBe(true);
    }
  });
});
