import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireUser } = vi.hoisted(() => ({ requireUser: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/require-user", () => ({ requireUser }));

import {
  handleGetProjectState,
  handlePutProjectState,
} from "./project-state-handler";

const ID = "6f1c0a52-3b7a-4d61-9a2e-0f4f2d6c9a11";
const params = { params: Promise.resolve({ id: ID }) };
const maybeSingle = vi.fn();
const upsert = vi.fn();
const eq = vi.fn(() => ({ maybeSingle }));
const select = vi.fn(() => ({ eq }));
const supabase = { from: vi.fn(() => ({ select, upsert })) };

const put = (body: unknown) =>
  new Request("http://localhost", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  eq.mockReturnValue({ maybeSingle });
  select.mockReturnValue({ eq });
  supabase.from.mockReturnValue({ select, upsert });
  requireUser.mockResolvedValue({ supabase, user: { id: "u1" } });
});

describe("handleGetProjectState", () => {
  it("answers with the session's error when there is none", async () => {
    requireUser.mockResolvedValue({
      error: Response.json(
        { error: "Authentication required" },
        { status: 401 },
      ),
    });
    const response = await handleGetProjectState(
      new Request("http://x"),
      params,
    );
    expect(response.status).toBe(401);
  });

  it("rejects an id that is not a uuid", async () => {
    const response = await handleGetProjectState(new Request("http://x"), {
      params: Promise.resolve({ id: "nope" }),
    });
    expect(response.status).toBe(400);
  });

  it("returns null when nothing was saved", async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null });
    const response = await handleGetProjectState(
      new Request("http://x"),
      params,
    );
    expect(await response.json()).toEqual({ state: null, updated_at: null });
  });

  it("returns the saved state checked again on the way out", async () => {
    maybeSingle.mockResolvedValue({
      data: {
        state: { facts: { division: "C-2", nope: 1 }, faults: ["D99"] },
        updated_at: "2026-11-16T10:00:00Z",
      },
      error: null,
    });
    const body = await (
      await handleGetProjectState(new Request("http://x"), params)
    ).json();
    expect(body.state.facts).toEqual({ division: "C-2" });
    expect(body.state.faults).toEqual([]);
  });

  it("answers 500 when the table cannot be read, as before the migration is applied", async () => {
    maybeSingle.mockResolvedValue({
      data: null,
      error: { message: "relation missing" },
    });
    const response = await handleGetProjectState(
      new Request("http://x"),
      params,
    );
    expect(response.status).toBe(500);
  });
});

describe("handlePutProjectState", () => {
  it("saves only the validated inputs of the project", async () => {
    upsert.mockResolvedValue({ error: null });
    const response = await handlePutProjectState(
      put({
        state: {
          facts: { division: "C-2", nope: 1 },
          parts: [{ division: "Z-9" }],
          faults: ["D5"],
        },
      }),
      params,
    );
    expect(response.status).toBe(204);
    expect(upsert).toHaveBeenCalledWith({
      project_id: ID,
      state: { facts: { division: "C-2" }, parts: [], faults: ["D5"] },
    });
  });

  it("rejects a body with something besides the state", async () => {
    const response = await handlePutProjectState(
      put({ state: {}, extra: 1 }),
      params,
    );
    expect(response.status).toBe(400);
    expect(upsert).not.toHaveBeenCalled();
  });

  it("answers 500 when the save fails", async () => {
    upsert.mockResolvedValue({ error: { message: "denied" } });
    const response = await handlePutProjectState(put({ state: {} }), params);
    expect(response.status).toBe(500);
  });
});
