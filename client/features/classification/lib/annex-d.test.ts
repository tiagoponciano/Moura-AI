import { describe, expect, it } from "vitest";
import {
  ANNEX_D_NOTES,
  CONSTRUCTION_FAULTS,
  FAULT_IDS,
  faultChoices,
  faultsById,
  pickFaults,
} from "./annex-d";

describe("CONSTRUCTION_FAULTS", () => {
  it("has the 15 rows of the annex with ids D1 to D15 in the printed order", () => {
    expect(CONSTRUCTION_FAULTS.map((f) => f.id)).toEqual(
      Array.from({ length: 15 }, (_, i) => `D${i + 1}`),
    );
    expect(CONSTRUCTION_FAULTS[0]).toMatchObject({ sigla: "AVtr", id: "D1" });
    expect(CONSTRUCTION_FAULTS[14].parameter).toBe("Área interna");
  });

  it("marks only the errors the norm does not admit as refused", () => {
    expect(
      CONSTRUCTION_FAULTS.filter((f) => f.refused).map((f) => f.parameter),
    ).toEqual(["L > 35%", "h ou b > 15%"]);
  });

  it("keeps the notes of the table", () => {
    expect(ANNEX_D_NOTES).toHaveLength(2);
  });
});

describe("pickFaults", () => {
  it("keeps known ids once each", () => {
    expect(pickFaults(["D5", "D2", "D5"])).toEqual(["D5", "D2"]);
  });

  it("drops the whole list when one id is unknown", () => {
    expect(pickFaults(["D5", "D99"])).toEqual([]);
    expect(pickFaults("D5")).toEqual([]);
  });

  it("accepts every id", () => {
    expect(pickFaults(FAULT_IDS)).toHaveLength(15);
  });
});

describe("faultsById", () => {
  it("returns the rows in the printed order, whatever the order asked", () => {
    expect(faultsById(["D8", "D3"]).map((f) => f.id)).toEqual(["D3", "D8"]);
  });
});

describe("faultChoices", () => {
  it("lists one line per row without accents in the ids", () => {
    const lines = faultChoices().split("\n");
    expect(lines).toHaveLength(15);
    expect(lines[0]).toContain("- D1:");
    expect(lines[0]).toContain("no parameter");
  });
});
