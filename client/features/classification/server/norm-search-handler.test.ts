import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireUser } = vi.hoisted(() => ({ requireUser: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/require-user", () => ({ requireUser }));

import { handleSearchNormText } from "./norm-search-handler";

const get = (query: string) =>
  handleSearchNormText(
    new Request(`http://localhost/api/classification/norm?${query}`),
  );

beforeEach(() => {
  requireUser.mockResolvedValue({ supabase: {}, user: { id: "u1" } });
});

describe("handleSearchNormText", () => {
  it("answers with the session's error when there is none", async () => {
    requireUser.mockResolvedValue({
      error: Response.json(
        { error: "Authentication required" },
        { status: 401 },
      ),
    });
    expect((await get("q=extintor")).status).toBe(401);
  });

  it("refuses a search with fewer than 3 letters", async () => {
    expect((await get("q=ab")).status).toBe(400);
    expect((await get("")).status).toBe(400);
  });

  it("finds articles of the instruction named, with where they come from", async () => {
    const response = await get("q=hidrante%20mangueira&doc=IN%207");
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      hits: {
        doc: string;
        kind: string;
        article?: number;
        page: number;
        excerpt: string;
      }[];
    };
    expect(body.hits.length).toBeGreaterThan(0);
    expect(body.hits.length).toBeLessThanOrEqual(8);
    for (const hit of body.hits) {
      expect(hit.doc).toBe("IN-7");
      if (hit.kind === "article") expect(hit.article).toBeGreaterThan(0);
      expect(hit.excerpt.length).toBeGreaterThan(0);
    }
  });

  it("says when nothing matches", async () => {
    const body = await (await get("q=helicoptero%20zeppelin")).json();
    expect(body.hits).toEqual([]);
    expect(body.note).toBeTruthy();
  });
});
