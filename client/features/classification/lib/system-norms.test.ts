import { describe, expect, it } from "vitest";
import { listNormSources } from "./norm-sources";
import { SYSTEMS } from "./rulesets/systems";
import { SYSTEMS_WITH_NORM, systemNorm } from "./system-norms";

describe("systemNorm", () => {
  it("names the instruction of a system and links its Drive file", () => {
    expect(systemNorm("extinguishers")).toMatchObject({
      doc: "IN-6",
      label: "IN 6",
    });
    expect(systemNorm("extinguishers")?.url).toContain(
      "drive.google.com/file/d/",
    );
  });

  it("gives alarm and detection the same instruction", () => {
    expect(systemNorm("fire_alarm")?.doc).toBe("IN-12");
    expect(systemNorm("automatic_detection")?.doc).toBe("IN-12");
  });

  it("has nothing for a system without an instruction of its own, or an unknown id", () => {
    expect(systemNorm("foam")).toBeUndefined();
    expect(systemNorm("nope")).toBeUndefined();
  });

  it("only maps systems of the catalog, to instructions that were extracted", () => {
    const docs = new Set(listNormSources().map((s) => s.doc));
    for (const id of SYSTEMS_WITH_NORM) {
      expect(Object.keys(SYSTEMS), id).toContain(id);
      expect(docs.has(systemNorm(id)!.doc), id).toBe(true);
    }
  });
});
