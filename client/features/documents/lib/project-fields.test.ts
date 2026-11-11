import { describe, expect, it } from "vitest";
import {
  changedProjectData,
  fieldChange,
  groupProgress,
  isProjectFieldKey,
  mergeProjectData,
  PROJECT_FIELD_GROUPS,
  PROJECT_FIELD_KEYS,
  valuesFromProject,
} from "./project-fields";
import type { TemplateSchema } from "./templates";

const schema: TemplateSchema = {
  fields: [
    {
      name: "street",
      type: "string",
      label: "Logradouro",
      description: "",
      projectKey: "property_street",
    },
    {
      name: "owner",
      type: "string",
      label: "Nome",
      description: "",
      projectKey: "owner_name",
    },
    { name: "question", type: "string", label: "Consulta", description: "" },
  ],
};

describe("valuesFromProject", () => {
  it("fills only the fields tied to a project key that has data", () => {
    expect(
      valuesFromProject(schema, { property_street: "Rua X", city: "ignored" }),
    ).toEqual({ street: "Rua X" });
  });

  it("returns nothing for an empty project", () => {
    expect(valuesFromProject(schema, {})).toEqual({});
  });
});

describe("changedProjectData", () => {
  it("returns only keys whose value differs from the project", () => {
    expect(
      changedProjectData(
        schema,
        { street: "Rua Y", owner: "Ana", question: "x" },
        { property_street: "Rua X", owner_name: "Ana" },
      ),
    ).toEqual({ property_street: "Rua Y" });
  });

  it("trims values and never erases project data with a blank field", () => {
    expect(
      changedProjectData(
        schema,
        { street: "  ", owner: " Ana " },
        { property_street: "Rua X" },
      ),
    ).toEqual({ owner_name: "Ana" });
  });
});

describe("isProjectFieldKey", () => {
  it("knows the shared keys and nothing else", () => {
    expect(isProjectFieldKey("technical_registry")).toBe(true);
    expect(isProjectFieldKey("question")).toBe(false);
  });
});

describe("PROJECT_FIELD_GROUPS", () => {
  it("lists each key in one group only", () => {
    expect(new Set(PROJECT_FIELD_KEYS).size).toBe(PROJECT_FIELD_KEYS.length);
  });
});

describe("mergeProjectData", () => {
  it("adds and replaces keys, keeping the others", () => {
    expect(mergeProjectData({ a: "1", b: "2" }, { b: "3", c: "4" })).toEqual({
      a: "1",
      b: "3",
      c: "4",
    });
  });

  it("removes a key set to null", () => {
    expect(mergeProjectData({ a: "1", b: "2" }, { a: null })).toEqual({
      b: "2",
    });
  });
});

describe("groupProgress", () => {
  it("counts the group's filled fields", () => {
    const [property] = PROJECT_FIELD_GROUPS;
    expect(
      groupProgress(property, { property_city: "X", owner_name: "Y" }),
    ).toEqual({ filled: 1, total: property.fields.length });
  });
});

describe("fieldChange", () => {
  it("is empty when the trimmed value is what the project has", () => {
    expect(fieldChange("a", " 1 ", { a: "1" })).toBeUndefined();
    expect(fieldChange("a", "  ", {})).toBeUndefined();
  });

  it("saves a new value, trimmed", () => {
    expect(fieldChange("a", " 2 ", { a: "1" })).toEqual({ a: "2" });
  });

  it("clears a field the user emptied here", () => {
    expect(fieldChange("a", "", { a: "1" })).toEqual({ a: null });
  });
});
