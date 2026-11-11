import { describe, expect, it } from "vitest";
import { startedForms } from "./started-forms";
import type { TemplateEntry } from "./templates";

const template = (id: string, name: string): TemplateEntry => ({
  id,
  name,
  type: "docx",
  file: "",
  schema: "",
});

const filling = (template_id: string, updated_at: string) => ({
  template_id,
  values: {},
  updated_at,
});

describe("startedForms", () => {
  const templates = [template("a", "Anexo A"), template("b", "Anexo B")];

  it("lists the newest saved form first", () => {
    const list = startedForms(
      [
        filling("a", "2026-11-01T10:00:00Z"),
        filling("b", "2026-11-02T10:00:00Z"),
      ],
      templates,
    );
    expect(list.map((form) => form.templateId)).toEqual(["b", "a"]);
  });

  it("skips a saved form whose template no longer exists", () => {
    const list = startedForms(
      [filling("gone", "2026-11-01T10:00:00Z")],
      templates,
    );
    expect(list).toEqual([]);
  });

  it("names each form after its template", () => {
    const [form] = startedForms(
      [filling("a", "2026-11-01T10:00:00Z")],
      templates,
    );
    expect(form.name).toBe("Anexo A");
  });
});
