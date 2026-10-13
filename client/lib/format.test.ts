import { describe, expect, it } from "vitest";
import { getInitials } from "./format";

describe("getInitials", () => {
  it("takes the first letter of the first two words, uppercased", () => {
    expect(getInitials("ana maria souza")).toBe("AM");
  });

  it("uses one letter for a single word, such as an e-mail", () => {
    expect(getInitials("ana@moura.com")).toBe("A");
  });

  it("ignores surrounding and repeated whitespace", () => {
    expect(getInitials("  Ana   Souza ")).toBe("AS");
  });

  it("returns an empty string for a blank name", () => {
    expect(getInitials("   ")).toBe("");
  });
});
