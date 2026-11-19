import { describe, expect, it } from "vitest";
import { formatArea, summarizeProject } from "./project-summary";

const project = (data: Record<string, string>) => ({
  id: "1",
  name: "Loja Centro",
  data,
});

describe("summarizeProject", () => {
  it("reads the city, the occupation and the block area", () => {
    expect(
      summarizeProject(
        project({
          property_city: "Joinville",
          property_occupancy: "C-2",
          block_area: "820",
        }),
      ),
    ).toEqual({ city: "Joinville", occupancy: "C-2", area: "820" });
  });

  it("falls back to the property area when the block has none", () => {
    expect(
      summarizeProject(project({ property_total_area: "1500" })).area,
    ).toBe("1500");
  });

  it("leaves what the project does not know undefined", () => {
    expect(summarizeProject(project({}))).toEqual({
      city: undefined,
      occupancy: undefined,
      area: undefined,
    });
  });
});

describe("formatArea", () => {
  it("writes a number in square meters the Brazilian way", () => {
    expect(formatArea("2340")).toBe("2.340 m²");
    expect(formatArea("820,5")).toBe("820,5 m²");
  });

  it("keeps text that is not a number and gives nothing for a blank", () => {
    expect(formatArea("cerca de 800")).toBe("cerca de 800");
    expect(formatArea(undefined)).toBeUndefined();
  });
});
