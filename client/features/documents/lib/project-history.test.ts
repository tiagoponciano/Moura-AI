import { describe, expect, it } from "vitest";
import { describeChange, fieldLabel } from "./project-history";

describe("fieldLabel", () => {
  it("names a shared field with its group", () => {
    expect(fieldLabel("owner_name")).toMatch(/Nome ou razão social/);
  });

  it("names the project's own name", () => {
    expect(fieldLabel("name")).toBe("Nome do projeto");
  });

  it("shows an unknown key as it is", () => {
    expect(fieldLabel("something_else")).toBe("something_else");
  });
});

describe("describeChange", () => {
  const base = { field: "name" };

  it("says a value was filled when there was none", () => {
    expect(
      describeChange({ ...base, old_value: null, new_value: "Obra 7" }),
    ).toBe("Nome do projeto: preenchido com “Obra 7”");
  });

  it("says a value was cleared and what it was", () => {
    expect(
      describeChange({ ...base, old_value: "Obra 7", new_value: null }),
    ).toBe("Nome do projeto: apagado (era “Obra 7”)");
  });

  it("shows the old and the new value of a change", () => {
    expect(describeChange({ ...base, old_value: "A", new_value: "B" })).toBe(
      "Nome do projeto: “A” → “B”",
    );
  });
});
