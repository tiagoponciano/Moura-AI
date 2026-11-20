import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const PUBLIC = join(__dirname, "../../../public/templates/cbmsc");

function keyOf(templateId: string, field: string): string | undefined {
  const schema = JSON.parse(
    readFileSync(join(PUBLIC, `${templateId}.schema.json`), "utf-8"),
  ) as { fields: { name: string; projectKey?: string }[] };
  return schema.fields.find((f) => f.name === field)?.projectKey;
}

describe("the forms that ask for the building's height, capacity, area and storeys", () => {
  it("read them from the project data, so they come filled", () => {
    expect(keyOf("in-9-anexo-e", "field_015")).toBe("block_height");
    expect(keyOf("in-15-anexo-c", "field_019")).toBe("block_height");
    expect(keyOf("in-28-anexo-c", "field_013")).toBe("property_total_area");
    expect(keyOf("in-28-anexo-c", "field_014")).toBe("property_floors");
    expect(keyOf("in-28-anexo-c", "field_015")).toBe("block_height");
    expect(keyOf("in-28-anexo-c", "field_017")).toBe("block_capacity");
  });

  it("do not tie the storage height of IN 15 to the building's", () => {
    expect(keyOf("in-15-anexo-c", "field_020")).toBeUndefined();
  });
});
