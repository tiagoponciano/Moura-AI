import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadFormData } from "./load-form-data";
import type { TemplateEntry, TemplateSchema } from "./templates";

const { fetchFillings, loadTemplateSchema, loadTemplateGuide } = vi.hoisted(
  () => ({
    fetchFillings: vi.fn(),
    loadTemplateSchema: vi.fn(),
    loadTemplateGuide: vi.fn(),
  }),
);
vi.mock("./fillings", () => ({ fetchFillings }));
vi.mock("./templates", async (original) => ({
  ...(await original<typeof import("./templates")>()),
  loadTemplateSchema,
  loadTemplateGuide,
}));

const template = { id: "form-a", name: "Form A" } as TemplateEntry;
const schema: TemplateSchema = {
  fields: [
    {
      name: "city",
      type: "string",
      description: "",
      required: false,
      projectKey: "property_city",
    },
    { name: "owner_name", type: "string", description: "", required: false },
  ],
} as unknown as TemplateSchema;

beforeEach(() => {
  vi.resetAllMocks();
  loadTemplateSchema.mockResolvedValue(schema);
  loadTemplateGuide.mockResolvedValue(undefined);
});

describe("loadFormData", () => {
  it("fills a form with no project from nothing and does not ask for fillings", async () => {
    const form = await loadFormData(template, undefined, {});
    expect(form.values).toEqual({});
    expect(form.fillings).toEqual([]);
    expect(fetchFillings).not.toHaveBeenCalled();
  });

  it("lets what the user saved for this form win over the project's data", async () => {
    fetchFillings.mockResolvedValue({
      fillings: [
        {
          template_id: "form-a",
          values: { city: "Joinville" },
          updated_at: "",
        },
        { template_id: "other", values: { city: "Lages" }, updated_at: "" },
      ],
    });
    const form = await loadFormData(template, "p1", {
      property_city: "Itajaí",
    });
    expect(form.values.city).toBe("Joinville");
    expect(form.fillings).toHaveLength(2);
    expect(form.sources.city).toBe("user");
  });

  it("falls back to the project's data when the fillings cannot be read", async () => {
    fetchFillings.mockRejectedValue(new Error("offline"));
    const form = await loadFormData(template, "p1", {
      property_city: "Itajaí",
    });
    expect(form.fillings).toEqual([]);
    expect(form.values.city).toBe("Itajaí");
    expect(form.sources.city).toBe("project");
  });
});
