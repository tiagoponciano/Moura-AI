import { beforeEach, describe, expect, it, vi } from "vitest";

const { requestJson, createClient } = vi.hoisted(() => ({
  requestJson: vi.fn(),
  createClient: vi.fn(),
}));
vi.mock("@/lib/api/request-json", () => ({ requestJson }));
vi.mock("@/lib/supabase/client", () => ({
  createSupabaseBrowserClient: createClient,
}));

import { PROJECT_FILE_MAX_BYTES } from "./files";
import {
  ProjectFileError,
  keepProjectFile,
  uploadProjectFile,
} from "./files-client";

const PROJECT = "6f1c0a52-3b7a-4d61-9a2e-0f4f2d6c9a11";
const upload = vi.fn();
const remove = vi.fn();
const bucket = { upload, remove };
const supabase = { storage: { from: vi.fn(() => bucket) } };
const file = new Blob(["abc"], { type: "application/pdf" });
const options = { kind: "plan" as const, fileName: "Térreo.pdf" };

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  supabase.storage.from.mockReturnValue(bucket);
  createClient.mockReturnValue(supabase);
});

describe("uploadProjectFile", () => {
  it("uploads into the project's folder and then records the file", async () => {
    upload.mockResolvedValue({ error: null });
    requestJson.mockResolvedValue({ file: { id: "f1" } });
    const recorded = await uploadProjectFile(PROJECT, file, options);
    expect(recorded).toEqual({ id: "f1" });
    const [path] = upload.mock.calls[0];
    expect(path.startsWith(`${PROJECT}/`)).toBe(true);
    const [url, init] = requestJson.mock.calls[0];
    expect(url).toBe(`/api/projects/${PROJECT}/files`);
    expect(JSON.parse(init.body)).toMatchObject({
      kind: "plan",
      fileName: "Térreo.pdf",
      mimeType: "application/pdf",
      sizeBytes: 3,
      storagePath: path,
    });
  });

  it("refuses a file over the limit before touching the bucket", async () => {
    const big = { size: PROJECT_FILE_MAX_BYTES + 1, type: "" } as Blob;
    await expect(uploadProjectFile(PROJECT, big, options)).rejects.toThrow(
      "Arquivo maior que 25 MB",
    );
    expect(upload).not.toHaveBeenCalled();
  });

  it("records nothing when the upload fails", async () => {
    upload.mockResolvedValue({ error: { message: "denied" } });
    await expect(
      uploadProjectFile(PROJECT, file, options),
    ).rejects.toBeInstanceOf(ProjectFileError);
    expect(requestJson).not.toHaveBeenCalled();
  });

  it("removes the stored object again when recording fails, so nothing is kept without a row", async () => {
    upload.mockResolvedValue({ error: null });
    requestJson.mockRejectedValue(new Error("500"));
    remove.mockResolvedValue({ error: null });
    await expect(
      uploadProjectFile(PROJECT, file, options),
    ).rejects.toBeInstanceOf(ProjectFileError);
    expect(remove).toHaveBeenCalledWith([upload.mock.calls[0][0]]);
  });

  it("fails without Supabase", async () => {
    createClient.mockReturnValue(undefined);
    await expect(
      uploadProjectFile(PROJECT, file, options),
    ).rejects.toBeInstanceOf(ProjectFileError);
  });
});

describe("keepProjectFile", () => {
  it("resolves to true when the file was kept", async () => {
    upload.mockResolvedValue({ error: null });
    requestJson.mockResolvedValue({ file: { id: "f1" } });
    expect(await keepProjectFile(PROJECT, file, options)).toBe(true);
  });

  it("resolves to false instead of throwing, so a download is never held back", async () => {
    upload.mockResolvedValue({ error: { message: "denied" } });
    await expect(keepProjectFile(PROJECT, file, options)).resolves.toBe(false);
  });

  it("resolves to false for a file over the limit", async () => {
    const big = { size: PROJECT_FILE_MAX_BYTES + 1, type: "" } as Blob;
    expect(await keepProjectFile(PROJECT, big, options)).toBe(false);
  });
});
