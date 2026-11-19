import { describe, expect, it } from "vitest";
import {
  PROJECT_FILE_MAX_BYTES,
  buildProjectFilePath,
  checkProjectFile,
  formatFileSize,
  projectFileRecordBody,
} from "./files";

const PROJECT = "6f1c0a52-3b7a-4d61-9a2e-0f4f2d6c9a11";

describe("checkProjectFile", () => {
  it("accepts a size up to the limit and refuses an empty or larger file", () => {
    expect(checkProjectFile(1)).toBeUndefined();
    expect(checkProjectFile(PROJECT_FILE_MAX_BYTES)).toBeUndefined();
    expect(checkProjectFile(0)).toBe("empty");
    expect(checkProjectFile(PROJECT_FILE_MAX_BYTES + 1)).toBe("too_large");
  });
});

describe("buildProjectFilePath", () => {
  it("starts with the project id, the one thing the table checks", () => {
    expect(buildProjectFilePath(PROJECT, "Planta.pdf", "abc")).toBe(
      `${PROJECT}/abc-Planta.pdf`,
    );
  });

  it("makes the name safe: no accents, spaces or slashes, no leading dots", () => {
    const path = buildProjectFilePath(
      PROJECT,
      "../Requerimento de análise (v2).docx",
      "x",
    );
    expect(path.startsWith(`${PROJECT}/x-`)).toBe(true);
    expect(path.split("/")).toHaveLength(2);
    expect(path).toMatch(/^[0-9a-f-]+\/x-[A-Za-z0-9._-]+$/);
    expect(path).toContain("Requerimento_de_analise");
  });

  it("falls back to a name when nothing usable is left", () => {
    expect(buildProjectFilePath(PROJECT, "???", "x")).toBe(
      `${PROJECT}/x-arquivo`,
    );
  });
});

describe("projectFileRecordBody", () => {
  const base = {
    kind: "form",
    fileName: "a.docx",
    mimeType: "application/octet-stream",
    sizeBytes: 10,
    storagePath: `${PROJECT}/x-a.docx`,
  };

  it("accepts a record and refuses an unknown kind, an extra key or a size over the limit", () => {
    expect(projectFileRecordBody.safeParse(base).success).toBe(true);
    expect(
      projectFileRecordBody.safeParse({ ...base, kind: "virus" }).success,
    ).toBe(false);
    expect(projectFileRecordBody.safeParse({ ...base, extra: 1 }).success).toBe(
      false,
    );
    expect(
      projectFileRecordBody.safeParse({
        ...base,
        sizeBytes: PROJECT_FILE_MAX_BYTES + 1,
      }).success,
    ).toBe(false);
  });
});

describe("formatFileSize", () => {
  it("writes bytes, kilobytes and megabytes the Brazilian way", () => {
    expect(formatFileSize(42)).toBe("42 B");
    expect(formatFileSize(380 * 1024)).toBe("380 KB");
    expect(formatFileSize(1.25 * 1024 * 1024)).toBe("1,3 MB");
  });
});
