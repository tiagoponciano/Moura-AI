import { describe, expect, it } from "vitest";
import type { ProjectFile } from "@/lib/projects/files";
import type { Filling } from "./fillings";
import { projectDocuments } from "./project-documents";
import type { TemplateEntry } from "./templates";

const template = (id: string, name: string): TemplateEntry => ({
  id,
  name,
  type: "docx",
  file: `/templates/${id}.docx`,
  schema: `/templates/${id}.schema.json`,
});

const filling = (templateId: string, updatedAt: string): Filling => ({
  template_id: templateId,
  values: { company_name: "Moura" },
  updated_at: updatedAt,
});

const file = (
  id: string,
  kind: ProjectFile["kind"],
  fileName: string,
  createdAt: string,
): ProjectFile => ({
  id,
  kind,
  file_name: fileName,
  mime_type: "application/octet-stream",
  size_bytes: 10,
  storage_path: `project/${id}-${fileName}`,
  created_at: createdAt,
});

const TEMPLATES = [
  template("in-1-anexo-c", "IN 1 – Anexo C"),
  template("in-1-anexo-b", "IN 1 – Anexo B"),
];

describe("projectDocuments", () => {
  it("lists the started forms newest first, with their names", () => {
    const result = projectDocuments(
      [
        filling("in-1-anexo-b", "2026-11-18T10:00:00Z"),
        filling("in-1-anexo-c", "2026-11-19T10:00:00Z"),
      ],
      TEMPLATES,
      [],
    );

    expect(result.forms.map((form) => [form.templateId, form.name])).toEqual([
      ["in-1-anexo-c", "IN 1 – Anexo C"],
      ["in-1-anexo-b", "IN 1 – Anexo B"],
    ]);
  });

  it("leaves out a filling whose template no longer exists", () => {
    const result = projectDocuments(
      [filling("removed-form", "2026-11-19T10:00:00Z")],
      TEMPLATES,
      [],
    );

    expect(result.forms).toEqual([]);
  });

  it("gives each form its latest generated document, named with or without the company", () => {
    const result = projectDocuments(
      [
        filling("in-1-anexo-c", "2026-11-19T10:00:00Z"),
        filling("in-1-anexo-b", "2026-11-18T10:00:00Z"),
      ],
      TEMPLATES,
      [
        file("1", "form", "in-1-anexo-c.docx", "2026-11-19T09:00:00Z"),
        file("2", "form", "in-1-anexo-c_Moura.docx", "2026-11-19T11:00:00Z"),
      ],
    );

    expect(result.forms[0].document?.id).toBe("2");
    expect(result.forms[1].document).toBeUndefined();
  });

  it("gives a document to the template with the longest matching id", () => {
    const result = projectDocuments(
      [
        filling("form", "2026-11-19T10:00:00Z"),
        filling("form_b", "2026-11-18T10:00:00Z"),
      ],
      [template("form", "Form"), template("form_b", "Form B")],
      [file("1", "form", "form_b.docx", "2026-11-19T09:00:00Z")],
    );

    expect(
      result.forms.find((form) => form.templateId === "form_b")?.document?.id,
    ).toBe("1");
    expect(
      result.forms.find((form) => form.templateId === "form")?.document,
    ).toBeUndefined();
  });

  it("ignores files that are not forms", () => {
    const result = projectDocuments(
      [filling("in-1-anexo-c", "2026-11-19T10:00:00Z")],
      TEMPLATES,
      [file("1", "other", "in-1-anexo-c.docx", "2026-11-19T11:00:00Z")],
    );

    expect(result.forms[0].document).toBeUndefined();
  });

  it("keeps the latest proposal", () => {
    const result = projectDocuments([], TEMPLATES, [
      file("1", "proposal", "proposta.pptx", "2026-11-18T10:00:00Z"),
      file("2", "proposal", "proposta.pptx", "2026-11-19T10:00:00Z"),
    ]);

    expect(result.proposal?.id).toBe("2");
  });
});
