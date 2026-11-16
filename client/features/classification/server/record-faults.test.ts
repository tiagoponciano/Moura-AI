import { describe, expect, it } from "vitest";
import { recordFaults, recordFaultsInput } from "./record-faults";

describe("recordFaultsInput", () => {
  it("accepts known ids and an empty list", () => {
    expect(recordFaultsInput.safeParse({ faults: ["D5", "D9"] }).success).toBe(
      true,
    );
    expect(recordFaultsInput.safeParse({ faults: [] }).success).toBe(true);
  });

  it("rejects an id that is not a row of the annex", () => {
    expect(recordFaultsInput.safeParse({ faults: ["D99"] }).success).toBe(
      false,
    );
  });

  it("describes the field without accents, since the model reads it", () => {
    expect(JSON.stringify(recordFaultsInput.toJSONSchema())).not.toMatch(
      /[À-ÿ]/,
    );
  });
});

describe("recordFaults", () => {
  it("echoes the ids once each for the client to keep", () => {
    const result = recordFaults({ faults: ["D5", "D5", "D2"] });
    expect(result.faults).toEqual(["D5", "D2"]);
    expect(result.summary).toBe("Erros de execução registrados: D5, D2");
  });

  it("is the same result when sent again, so a replayed chat settles", () => {
    expect(recordFaults({ faults: ["D5"] })).toEqual(
      recordFaults({ faults: ["D5"] }),
    );
  });

  it("tells the model when a recorded error is one the norm does not admit", () => {
    expect(recordFaults({ faults: ["D9"] }).note).toContain("not admitted");
    expect(recordFaults({ faults: ["D5"] }).note).not.toContain("not admitted");
  });

  it("records nothing for an invalid list", () => {
    const result = recordFaults({ faults: ["D99"] });
    expect(result.faults).toEqual([]);
    expect(result.summary).toBe("Nenhum erro de execução registrado");
  });
});
