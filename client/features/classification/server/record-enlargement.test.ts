import { describe, expect, it } from "vitest";
import {
  recordEnlargement,
  recordEnlargementInput,
} from "./record-enlargement";

const input = {
  originalAreaM2: 700,
  addedAreaM2: 105,
  originalRegularized: true,
  compartmented: true,
  newIsolatedBlock: false,
  graceYearsMet: true,
  raisesRigor: false,
};

describe("recordEnlargementInput", () => {
  it("needs every field", () => {
    expect(recordEnlargementInput.safeParse(input).success).toBe(true);
    const { raisesRigor: _omit, ...partial } = input;
    void _omit;
    expect(recordEnlargementInput.safeParse(partial).success).toBe(false);
  });

  it("describes every field without accents, since the model reads it", () => {
    expect(JSON.stringify(recordEnlargementInput.toJSONSchema())).not.toMatch(
      /[À-ÿ]/,
    );
  });
});

describe("recordEnlargement", () => {
  it("echoes the validated enlargement for the client to keep", () => {
    const result = recordEnlargement(input, { division: "A-2" });
    expect(result.enlargement).toEqual(input);
    expect(result.status).toBe("recorded");
    expect(result.summary).toBe("Ampliação registrada: 105 m² sobre 700 m²");
  });

  it("is the same result when sent again, so a replayed chat settles", () => {
    expect(recordEnlargement(input, { division: "A-2" })).toEqual(
      recordEnlargement(input, { division: "A-2" }),
    );
  });

  it("tells the model to ask for the activity when the division is not known", () => {
    const result = recordEnlargement(input, {});
    expect(result.status).toBe("needs_division");
    expect(result.note).toContain("division is not known");
  });

  it("records nothing for an invalid enlargement", () => {
    const result = recordEnlargement({ ...input, addedAreaM2: -5 }, {});
    expect(result.enlargement).toBeUndefined();
    expect(result.status).toBe("invalid");
  });
});
