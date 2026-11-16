import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireUser } = vi.hoisted(() => ({ requireUser: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/require-user", () => ({ requireUser }));

import {
  handleListProjectPlans,
  handleRecordProjectPlan,
} from "./project-plans-handler";

const ID = "6f1c0a52-3b7a-4d61-9a2e-0f4f2d6c9a11";
const params = { params: Promise.resolve({ id: ID }) };
const limit = vi.fn();
const order = vi.fn(() => ({ limit }));
const eq = vi.fn(() => ({ order }));
const select = vi.fn(() => ({ eq }));
const single = vi.fn();
const insertSelect = vi.fn(() => ({ single }));
const insert = vi.fn(() => ({ select: insertSelect }));
const supabase = { from: vi.fn(() => ({ select, insert })) };

const post = (body: unknown) =>
  new Request("http://localhost", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
const record = {
  fileName: "terreo.pdf",
  mode: "vector",
  scale: 100,
  format: "dwg",
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  order.mockReturnValue({ limit });
  eq.mockReturnValue({ order });
  select.mockReturnValue({ eq });
  insertSelect.mockReturnValue({ single });
  insert.mockReturnValue({ select: insertSelect });
  supabase.from.mockReturnValue({ select, insert });
  requireUser.mockResolvedValue({ supabase, user: { id: "u1" } });
});

describe("handleListProjectPlans", () => {
  it("answers with the session's error when there is none", async () => {
    requireUser.mockResolvedValue({
      error: Response.json(
        { error: "Authentication required" },
        { status: 401 },
      ),
    });
    expect(
      (await handleListProjectPlans(new Request("http://x"), params)).status,
    ).toBe(401);
  });

  it("rejects an id that is not a uuid", async () => {
    const response = await handleListProjectPlans(new Request("http://x"), {
      params: Promise.resolve({ id: "nope" }),
    });
    expect(response.status).toBe(400);
  });

  it("lists the conversions of the project, newest first, up to the limit", async () => {
    limit.mockResolvedValue({ data: [{ id: "a" }], error: null });
    const response = await handleListProjectPlans(
      new Request("http://x"),
      params,
    );
    expect(await response.json()).toEqual({ plans: [{ id: "a" }] });
    expect(eq).toHaveBeenCalledWith("project_id", ID);
    expect(order).toHaveBeenCalledWith("created_at", { ascending: false });
    expect(limit).toHaveBeenCalledWith(20);
  });

  it("answers 500 when the table cannot be read, as before the migration is applied", async () => {
    limit.mockResolvedValue({
      data: null,
      error: { message: "relation missing" },
    });
    expect(
      (await handleListProjectPlans(new Request("http://x"), params)).status,
    ).toBe(500);
  });
});

describe("handleRecordProjectPlan", () => {
  it("keeps the conversion for the project and answers 201", async () => {
    single.mockResolvedValue({ data: { id: "a", ...record }, error: null });
    const response = await handleRecordProjectPlan(post(record), params);
    expect(response.status).toBe(201);
    expect(insert).toHaveBeenCalledWith({
      project_id: ID,
      file_name: "terreo.pdf",
      mode: "vector",
      scale: 100,
      format: "dwg",
    });
  });

  it("keeps a conversion without a scale as null", async () => {
    single.mockResolvedValue({ data: { id: "a" }, error: null });
    await handleRecordProjectPlan(
      post({ ...record, scale: undefined }),
      params,
    );
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ scale: null }),
    );
  });

  it("rejects a format, a mode or a scale it does not know", async () => {
    for (const bad of [
      { ...record, format: "pdf" },
      { ...record, mode: "other" },
      { ...record, scale: 9000 },
      { ...record, fileName: "" },
      { ...record, extra: 1 },
    ]) {
      expect((await handleRecordProjectPlan(post(bad), params)).status).toBe(
        400,
      );
    }
    expect(insert).not.toHaveBeenCalled();
  });

  it("answers 500 when the save fails", async () => {
    single.mockResolvedValue({ data: null, error: { message: "denied" } });
    expect((await handleRecordProjectPlan(post(record), params)).status).toBe(
      500,
    );
  });
});
