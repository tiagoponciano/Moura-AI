import { describe, expect, it } from "vitest";
import { classifyEnlargement, type EnlargementInput } from "./enlargement";

const base: EnlargementInput = {
  division: "A-2",
  originalAreaM2: 700,
  addedAreaM2: 105,
  originalRegularized: true,
  compartmented: true,
  newIsolatedBlock: false,
  graceYearsMet: true,
  raisesRigor: false,
};
const run = (o: Partial<EnlargementInput>) =>
  classifyEnlargement({ ...base, ...o });

describe("classifyEnlargement: the conditions before the percentages", () => {
  it("sends the whole building to IN 1 without the 5 years of grace (art. 12, § 1º)", () => {
    const r = run({ graceYearsMet: false });
    expect(r.regime).toBe("in1_all");
    expect(r.articles).toEqual(["art. 12, § 1º"]);
  });

  it("makes a new isolated block follow IN 1 in full (art. 13)", () => {
    const r = run({ newIsolatedBlock: true });
    expect(r.regime).toBe("in1_all");
    expect(r.articles).toEqual(["art. 13"]);
  });

  it("rejects an original area that is not positive", () => {
    expect(() => run({ originalAreaM2: 0 })).toThrow(RangeError);
  });

  it("always repeats that the areas add up (art. 14) and that the original systems get no waiver (art. 12, § 2º)", () => {
    const r = run({});
    expect(r.notes.join(" ")).toContain("art. 14");
    expect(r.notes.join(" ")).toContain("art. 12, § 2º");
  });
});

describe("classifyEnlargement: up to 20% without more rigor (arts. 15 and 16)", () => {
  it("keeps and extends the systems of a regularized building (A-2, 700 to 805 m²)", () => {
    const r = run({});
    expect(r.ratio).toBeCloseTo(0.15);
    expect(r.regime).toBe("keep_and_extend");
    expect(r.articles).toContain("art. 15, I");
  });

  it("regularizes the whole building by IN 5 when the original is not regularized", () => {
    const r = run({ originalRegularized: false });
    expect(r.regime).toBe("in5_all");
    expect(r.articles).toEqual(["art. 15, II"]);
  });

  it("treats exactly 20% as up to 20%", () => {
    expect(run({ addedAreaM2: 140 }).regime).toBe("keep_and_extend");
  });

  it("does not count crossing the threshold as more rigor for a regularized building (art. 16)", () => {
    const r = run({ raisesRigor: true });
    expect(r.regime).toBe("keep_and_extend");
    expect(r.articles).toContain("art. 16");
  });

  it("does not give the art. 16 exception to the excluded divisions (§ 1º)", () => {
    const r = run({ division: "F-6", raisesRigor: true });
    expect(r.regime).toBe("in1_enlarged_only");
  });

  it("does not give the art. 16 exception to a building that is not regularized", () => {
    const r = run({ originalRegularized: false, raisesRigor: true });
    expect(r.regime).toBe("in1_enlarged_only");
  });
});

describe("classifyEnlargement: 20% to 50% (arts. 17 and 18)", () => {
  it("admits IN 5 for an enlargement without more rigor (art. 17)", () => {
    const r = run({ addedAreaM2: 210 });
    expect(r.regime).toBe("in5_all");
    expect(r.articles).toEqual(["art. 17"]);
  });

  it("puts 20.01% in the 20 to 50% band", () => {
    expect(run({ addedAreaM2: 140.1 }).articles).toEqual(["art. 17"]);
  });

  it("applies IN 1 to the enlarged area only, when compartmented and the rigor rises (A-2, 700 to 1000 m²)", () => {
    const r = run({ addedAreaM2: 300, raisesRigor: true });
    expect(r.regime).toBe("in1_enlarged_only");
    expect(r.original).toContain("mantém");
  });

  it("lets the original area use IN 5 when it is not regularized", () => {
    const r = run({
      addedAreaM2: 300,
      raisesRigor: true,
      originalRegularized: false,
    });
    expect(r.original).toContain("IN 5");
  });

  it("applies IN 1 to the whole building without compartmentation, except unfeasible adaptables", () => {
    const r = run({
      addedAreaM2: 300,
      raisesRigor: true,
      compartmented: false,
    });
    expect(r.regime).toBe("in1_all_unless_unfeasible");
  });

  it("treats exactly 50% as up to 50%", () => {
    expect(run({ addedAreaM2: 350, raisesRigor: true }).articles).toContain(
      "art. 18, I e parágrafo único",
    );
  });
});

describe("classifyEnlargement: over 50% (art. 19)", () => {
  it("applies IN 1 to the enlarged area only when compartmented (C-1, 600 to 1300 m²)", () => {
    const r = run({ division: "C-1", originalAreaM2: 600, addedAreaM2: 700 });
    expect(r.regime).toBe("in1_enlarged_only");
    expect(r.articles).toEqual(["art. 19, I"]);
  });

  it("applies IN 1 to the whole building without compartmentation, with no adaptations", () => {
    const r = run({ addedAreaM2: 400, compartmented: false });
    expect(r.regime).toBe("in1_all");
    expect(r.articles).toEqual(["art. 19, II"]);
  });

  it("applies it whether or not the rigor rises", () => {
    expect(run({ addedAreaM2: 400, raisesRigor: false }).articles).toEqual([
      "art. 19, I",
    ]);
  });

  it("sums the enlargements, as the example of Nota 1 does (40% + 60% + 20% = 120%)", () => {
    const r = run({ originalAreaM2: 1000, addedAreaM2: 1200 });
    expect(r.ratio).toBeCloseTo(1.2);
    expect(r.articles).toEqual(["art. 19, I"]);
  });
});
