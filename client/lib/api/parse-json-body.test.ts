import { describe, expect, it } from "vitest";
import { z } from "zod";
import { MAX_JSON_BODY_BYTES, parseJsonBody } from "./parse-json-body";

const schema = z.object({ name: z.string({ error: "Name is required" }) });

const post = (body: string) =>
  new Request("http://localhost/api/test", { method: "POST", body });

describe("parseJsonBody", () => {
  it("returns the parsed data when the body fits the schema", async () => {
    const result = await parseJsonBody(post('{"name":"Moura"}'), schema);
    expect(result).toEqual({ data: { name: "Moura" } });
  });

  it("answers 400 with the first issue's message when the body does not fit", async () => {
    const result = await parseJsonBody(post("{}"), schema);
    expect(result.error?.status).toBe(400);
    expect(await result.error?.json()).toEqual({ error: "Name is required" });
  });

  it("answers 400 when the body is not JSON", async () => {
    const result = await parseJsonBody(post("not json"), schema);
    expect(result.error?.status).toBe(400);
  });

  it("answers 413 when the body is larger than the limit", async () => {
    const name = "a".repeat(MAX_JSON_BODY_BYTES);
    const result = await parseJsonBody(post(JSON.stringify({ name })), schema);
    expect(result.error?.status).toBe(413);
    expect(await result.error?.json()).toEqual({
      error: "Request body is too large",
    });
  });

  it("counts the limit in bytes, not characters", async () => {
    const name = "ç".repeat(MAX_JSON_BODY_BYTES / 2);
    const result = await parseJsonBody(post(JSON.stringify({ name })), schema);
    expect(result.error?.status).toBe(413);
  });
});
