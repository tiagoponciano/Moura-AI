import { describe, expect, it } from "vitest";
import type { ProjectFile, ProjectFileKind } from "@/lib/projects/files";
import { countByFilter, filterFiles, searchFiles } from "./file-filters";

const file = (id: string, kind: ProjectFileKind): ProjectFile => ({
  id,
  kind,
  file_name: `${id}.pdf`,
  mime_type: "application/pdf",
  size_bytes: 1,
  storage_path: `p/${id}`,
  created_at: "2026-11-22T10:00:00Z",
});
const files = [
  file("a", "form"),
  file("b", "conversion"),
  file("c", "plan"),
  file("d", "proposal"),
  file("e", "form"),
  file("f", "classification"),
];

describe("filterFiles", () => {
  it("shows everything for the first toggle, in the order given", () => {
    expect(filterFiles(files, "all").map((f) => f.id)).toEqual([
      "a",
      "b",
      "c",
      "d",
      "e",
      "f",
    ]);
  });

  it("shows only documents under Documentos", () => {
    expect(filterFiles(files, "forms").map((f) => f.id)).toEqual(["a", "e"]);
  });

  it("groups an uploaded plan and its conversion under Plantas", () => {
    expect(filterFiles(files, "plans").map((f) => f.id)).toEqual(["b", "c"]);
  });

  it("shows a classification only under Classificação", () => {
    expect(filterFiles(files, "classification").map((f) => f.id)).toEqual([
      "f",
    ]);
    expect(filterFiles(files, "forms").map((f) => f.id)).not.toContain("f");
  });

  it("shows nothing for a toggle with no file", () => {
    expect(filterFiles(files, "other")).toEqual([]);
  });
});

describe("countByFilter", () => {
  it("counts what each toggle would show, and all of them under Todos", () => {
    expect(countByFilter(files)).toEqual({
      all: 6,
      forms: 2,
      classification: 1,
      proposals: 1,
      plans: 2,
      other: 0,
    });
  });
});

describe("searchFiles", () => {
  const named = [
    { ...file("a", "form"), file_name: "Anexo C - Loja Centro.pdf" },
    { ...file("b", "conversion"), file_name: "Térreo - Loja Centro.dwg" },
  ];

  it("finds a file by words of its name, ignoring accents and case", () => {
    expect(searchFiles(named, "terreo LOJA").map((f) => f.id)).toEqual(["b"]);
  });

  it("keeps every file for a blank search and none for a word that is nowhere", () => {
    expect(searchFiles(named, "  ")).toHaveLength(2);
    expect(searchFiles(named, "cobertura")).toEqual([]);
  });
});
