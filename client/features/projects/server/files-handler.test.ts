import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireUser } = vi.hoisted(() => ({ requireUser: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/require-user", () => ({ requireUser }));

import {
  handleDeleteProjectFile,
  handleListProjectFiles,
  handleRecordProjectFile,
} from "./files-handler";

const ID = "6f1c0a52-3b7a-4d61-9a2e-0f4f2d6c9a11";
const FILE = "0b9d0e4e-2f35-4a64-8b9c-1f1c2a3b4c5d";
const params = { params: Promise.resolve({ id: ID }) };
const fileParams = { params: Promise.resolve({ id: ID, fileId: FILE }) };

const limit = vi.fn();
const order = vi.fn(() => ({ limit }));
const eqList = vi.fn(() => ({ order }));
const maybeSingle = vi.fn();
const eqId = vi.fn(() => ({ maybeSingle }));
const eqProject = vi.fn(() => ({ eq: eqId }));
const select = vi.fn((columns?: string) =>
  columns === "storage_path" ? { eq: eqProject } : { eq: eqList },
);
const single = vi.fn();
const insertSelect = vi.fn(() => ({ single }));
const insert = vi.fn(() => ({ select: insertSelect }));
const deleteEq = vi.fn();
const del = vi.fn(() => ({ eq: deleteEq }));
const remove = vi.fn();
const supabase = {
  from: vi.fn(() => ({ select, insert, delete: del })),
  storage: { from: vi.fn(() => ({ remove })) },
};

const post = (body: unknown) =>
  new Request("http://localhost", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
const record = {
  kind: "form",
  fileName: "requerimento.docx",
  mimeType: "application/octet-stream",
  sizeBytes: 4200,
  storagePath: `${ID}/abc-requerimento.docx`,
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  order.mockReturnValue({ limit });
  eqList.mockReturnValue({ order });
  eqId.mockReturnValue({ maybeSingle });
  eqProject.mockReturnValue({ eq: eqId });
  select.mockImplementation((columns?: string) =>
    columns === "storage_path" ? { eq: eqProject } : { eq: eqList },
  );
  insertSelect.mockReturnValue({ single });
  insert.mockReturnValue({ select: insertSelect });
  del.mockReturnValue({ eq: deleteEq });
  supabase.from.mockReturnValue({ select, insert, delete: del });
  supabase.storage.from.mockReturnValue({ remove });
  requireUser.mockResolvedValue({ supabase, user: { id: "u1" } });
});

describe("handleListProjectFiles", () => {
  it("answers with the session's error when there is none", async () => {
    requireUser.mockResolvedValue({
      error: Response.json(
        { error: "Authentication required" },
        { status: 401 },
      ),
    });
    expect(
      (await handleListProjectFiles(new Request("http://x"), params)).status,
    ).toBe(401);
  });

  it("rejects an id that is not a uuid", async () => {
    const response = await handleListProjectFiles(new Request("http://x"), {
      params: Promise.resolve({ id: "nope" }),
    });
    expect(response.status).toBe(400);
  });

  it("lists the files of the project, newest first, up to the limit", async () => {
    limit.mockResolvedValue({ data: [{ id: "a" }], error: null });
    const response = await handleListProjectFiles(
      new Request("http://x"),
      params,
    );
    expect(await response.json()).toEqual({ files: [{ id: "a" }] });
    expect(eqList).toHaveBeenCalledWith("project_id", ID);
    expect(order).toHaveBeenCalledWith("created_at", { ascending: false });
    expect(limit).toHaveBeenCalledWith(100);
  });

  it("answers 500 when the table cannot be read, as before the migration is applied", async () => {
    limit.mockResolvedValue({ data: null, error: { message: "missing" } });
    expect(
      (await handleListProjectFiles(new Request("http://x"), params)).status,
    ).toBe(500);
  });
});

describe("handleRecordProjectFile", () => {
  it("records the file with its project and answers 201", async () => {
    single.mockResolvedValue({ data: { id: "f1" }, error: null });
    const response = await handleRecordProjectFile(post(record), params);
    expect(response.status).toBe(201);
    expect(insert).toHaveBeenCalledWith({
      project_id: ID,
      kind: "form",
      file_name: "requerimento.docx",
      mime_type: "application/octet-stream",
      size_bytes: 4200,
      storage_path: `${ID}/abc-requerimento.docx`,
    });
  });

  it("refuses a path outside the project's folder, and writes nothing", async () => {
    for (const storagePath of [
      "someone-else/abc-a.docx",
      `${ID}/deep/abc-a.docx`,
      `${ID}/`,
    ]) {
      const response = await handleRecordProjectFile(
        post({ ...record, storagePath }),
        params,
      );
      expect(response.status, storagePath).toBe(400);
    }
    expect(insert).not.toHaveBeenCalled();
  });

  it("refuses a body that does not fit", async () => {
    expect(
      (
        await handleRecordProjectFile(
          post({ ...record, kind: "virus" }),
          params,
        )
      ).status,
    ).toBe(400);
  });

  it("answers 500 when the row cannot be saved", async () => {
    single.mockResolvedValue({ data: null, error: { message: "denied" } });
    expect((await handleRecordProjectFile(post(record), params)).status).toBe(
      500,
    );
  });
});

describe("handleDeleteProjectFile", () => {
  it("removes the stored object, then the row, and answers 204", async () => {
    maybeSingle.mockResolvedValue({
      data: { storage_path: `${ID}/abc-a.docx` },
      error: null,
    });
    remove.mockResolvedValue({ error: null });
    deleteEq.mockResolvedValue({ error: null });
    const response = await handleDeleteProjectFile(
      new Request("http://x"),
      fileParams,
    );
    expect(response.status).toBe(204);
    expect(remove).toHaveBeenCalledWith([`${ID}/abc-a.docx`]);
    expect(deleteEq).toHaveBeenCalledWith("id", FILE);
  });

  it("answers 404 for a file the project does not have, and removes nothing", async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null });
    const response = await handleDeleteProjectFile(
      new Request("http://x"),
      fileParams,
    );
    expect(response.status).toBe(404);
    expect(remove).not.toHaveBeenCalled();
  });

  it("keeps the row when the stored object cannot be removed", async () => {
    maybeSingle.mockResolvedValue({
      data: { storage_path: `${ID}/abc-a.docx` },
      error: null,
    });
    remove.mockResolvedValue({ error: { message: "denied" } });
    const response = await handleDeleteProjectFile(
      new Request("http://x"),
      fileParams,
    );
    expect(response.status).toBe(500);
    expect(del).not.toHaveBeenCalled();
  });

  it("rejects a file id that is not a uuid", async () => {
    const response = await handleDeleteProjectFile(new Request("http://x"), {
      params: Promise.resolve({ id: ID, fileId: "nope" }),
    });
    expect(response.status).toBe(400);
  });
});
