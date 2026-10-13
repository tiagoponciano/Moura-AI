import { describe, expect, it } from "vitest";
import { recordSources, sourceTag } from "./field-sources";

describe("recordSources", () => {
  it("marks the given fields and keeps the others", () => {
    const sources = recordSources(
      { company_name: "assistant" },
      ["area_m2"],
      "user",
    );
    expect(sources).toEqual({ company_name: "assistant", area_m2: "user" });
  });

  it("overwrites a manual edit when the assistant fills the field again", () => {
    expect(
      recordSources({ area_m2: "user" }, ["area_m2"], "assistant"),
    ).toEqual({ area_m2: "assistant" });
  });

  it("does not mutate the previous record", () => {
    const previous = { company_name: "assistant" } as const;
    recordSources(previous, ["company_name"], "user");
    expect(previous).toEqual({ company_name: "assistant" });
  });
});

describe("sourceTag", () => {
  it("tags a value written by the assistant as IA", () => {
    expect(sourceTag("assistant", "Padaria Silva")).toBe("IA");
  });

  it("tags a value written by the user as editado", () => {
    expect(sourceTag("user", 750)).toBe("editado");
  });

  it("tags a boolean set to false, since false is a value", () => {
    expect(sourceTag("user", false)).toBe("editado");
  });

  it.each([undefined, "", "   "])(
    "shows no tag when the value is %j, even if someone wrote it",
    (value) => {
      expect(sourceTag("user", value)).toBeUndefined();
    },
  );

  it("shows no tag for a value nobody wrote", () => {
    expect(sourceTag(undefined, "Padaria Silva")).toBeUndefined();
  });
});
