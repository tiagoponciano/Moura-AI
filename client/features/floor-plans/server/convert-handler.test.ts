import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireUser, convertWithDwgService, isDwgServiceConfigured } =
  vi.hoisted(() => ({
    requireUser: vi.fn(),
    convertWithDwgService: vi.fn(),
    isDwgServiceConfigured: vi.fn(),
  }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/require-user", () => ({ requireUser }));
vi.mock("./dwg-service", () => ({
  convertWithDwgService,
  isDwgServiceConfigured,
  DwgServiceError: class extends Error {},
}));

import { handleConvertFloorPlan } from "./convert-handler";

const fixture = (name: string) =>
  readFileSync(join(__dirname, "../lib/fixtures", name));

function convert(
  file: Blob,
  format: string,
  extra: Record<string, string> = {},
) {
  const form = new FormData();
  form.append("file", file, "planta.pdf");
  form.append("format", format);
  for (const [key, value] of Object.entries(extra)) form.append(key, value);
  return handleConvertFloorPlan(
    new Request("http://localhost", { method: "POST", body: form }),
  );
}

const pdf = (name: string) =>
  new Blob([fixture(name)], { type: "application/pdf" });

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  requireUser.mockResolvedValue({ supabase: {} });
  isDwgServiceConfigured.mockReturnValue(false);
});

describe("handleConvertFloorPlan", () => {
  it("converts a vector PDF to DXF without the service", async () => {
    const response = await convert(pdf("vector-plan.pdf"), "dxf");
    expect(response.status).toBe(200);
    expect(response.headers.get("x-mode")).toBe("vector");
    expect(await response.text()).toContain("AC1009");
    expect(convertWithDwgService).not.toHaveBeenCalled();
  });

  it("applies the scale to the drawing", async () => {
    const response = await convert(pdf("vector-plan.pdf"), "dxf", {
      scale: "100",
    });
    expect(await response.text()).toContain("$EXTMAX\n10\n20990");
  });

  it("still converts a vector PDF in the app when the service is set up", async () => {
    isDwgServiceConfigured.mockReturnValue(true);
    await convert(pdf("vector-plan.pdf"), "dxf");
    expect(convertWithDwgService).not.toHaveBeenCalled();
  });

  it("says DWG needs the service when it is not set up", async () => {
    const response = await convert(pdf("vector-plan.pdf"), "dwg");
    expect(response.status).toBe(503);
    expect((await response.json()).error).toMatch(/DWG/);
  });

  it("says a plan without vector lines needs the service when it is not set up", async () => {
    const response = await convert(pdf("few-strokes.pdf"), "dxf");
    expect(response.status).toBe(503);
    expect((await response.json()).error).toMatch(/linhas vetoriais/);
  });

  it("sends DWG to the service when it is set up", async () => {
    isDwgServiceConfigured.mockReturnValue(true);
    convertWithDwgService.mockResolvedValue(
      new Response("dwg", { headers: { "x-mode": "vector" } }),
    );
    const response = await convert(pdf("vector-plan.pdf"), "dwg");
    expect(response.status).toBe(200);
    expect(convertWithDwgService).toHaveBeenCalledOnce();
  });

  it("answers 422 for a file that is not a readable PDF", async () => {
    const broken = new Blob(["not a pdf"], { type: "application/pdf" });
    const response = await convert(broken, "dxf");
    expect(response.status).toBe(422);
  });
});
