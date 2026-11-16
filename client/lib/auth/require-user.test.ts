import { beforeEach, describe, expect, it, vi } from "vitest";

const { createSupabaseServerClient } = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient }));

import { isCurrentUserAdmin } from "./is-admin";
import { requireUser } from "./require-user";

const getUser = vi.fn();
const maybeSingle = vi.fn();
const client = {
  auth: { getUser },
  rpc: () => ({ maybeSingle }),
};

beforeEach(() => {
  vi.resetAllMocks();
  createSupabaseServerClient.mockResolvedValue(client);
});

describe("requireUser", () => {
  it("answers 503 with the given message when Supabase is not configured", async () => {
    createSupabaseServerClient.mockResolvedValue(undefined);
    const { error } = await requireUser("not configured");
    expect(error?.status).toBe(503);
    expect(await error?.json()).toEqual({ error: "not configured" });
  });

  it("answers 401 without a session", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    const { error } = await requireUser("x");
    expect(error?.status).toBe(401);
  });

  it("returns the client and the user of a session", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    const result = await requireUser("x");
    expect(result.error).toBeUndefined();
    expect(result.user).toEqual({ id: "u1" });
    expect(result.supabase).toBe(client);
  });
});

describe("isCurrentUserAdmin", () => {
  it("is false without Supabase", async () => {
    createSupabaseServerClient.mockResolvedValue(undefined);
    expect(await isCurrentUserAdmin()).toBe(false);
  });

  it("is true only for an approved admin", async () => {
    maybeSingle.mockResolvedValue({
      data: { status: "approved", role: "admin" },
    });
    expect(await isCurrentUserAdmin()).toBe(true);
  });

  it("is false for an approved member, a pending admin or no row", async () => {
    maybeSingle.mockResolvedValue({
      data: { status: "approved", role: "member" },
    });
    expect(await isCurrentUserAdmin()).toBe(false);
    maybeSingle.mockResolvedValue({
      data: { status: "pending", role: "admin" },
    });
    expect(await isCurrentUserAdmin()).toBe(false);
    maybeSingle.mockResolvedValue({ data: null });
    expect(await isCurrentUserAdmin()).toBe(false);
  });
});
