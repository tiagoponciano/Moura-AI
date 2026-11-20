import { describe, expect, it } from "vitest";
import { projectDataFromFacts } from "./project-prefill";

describe("projectDataFromFacts", () => {
  it("turns the building answers into the Annex B keys", () => {
    expect(
      projectDataFromFacts(
        {
          area_m2: 820,
          storeys: 3,
          height_m: 9.5,
          capacity_people: 120,
          division: "C-2",
          fire_load_class: "medium",
        },
        {},
      ),
    ).toEqual({
      block_area: "820",
      block_floors: "3",
      block_height: "9.5",
      block_capacity: "120",
      property_occupancy: "C-2",
      building_fire_load: "Média",
    });
  });

  it("never replaces a value the project already has", () => {
    const change = projectDataFromFacts(
      { area_m2: 820, storeys: 3 },
      { block_area: "700" },
    );
    expect(change).toEqual({ block_floors: "3" });
  });

  it("gives nothing for answers that are missing or not numbers", () => {
    expect(projectDataFromFacts({ area_m2: "grande" }, {})).toEqual({});
    expect(projectDataFromFacts({}, {})).toEqual({});
  });

  it("shares a label between the fire load classes Annex B does not tell apart", () => {
    const label = (fire_load_class: string) =>
      projectDataFromFacts({ fire_load_class }, {}).building_fire_load;
    expect(label("negligible")).toBe("Baixa");
    expect(label("low")).toBe("Baixa");
    expect(label("very_high")).toBe("Alta");
  });

  it("also fills the property-level area and storeys when the property has one block", () => {
    expect(
      projectDataFromFacts(
        { area_m2: 820, storeys: 3, single_block: true },
        {},
      ),
    ).toMatchObject({
      block_area: "820",
      block_floors: "3",
      property_total_area: "820",
      property_floors: "3",
    });
  });

  it("leaves the property-level fields alone for several blocks, where one block is not the whole property", () => {
    const change = projectDataFromFacts(
      { area_m2: 820, storeys: 3, single_block: false },
      {},
    );
    expect(change).not.toHaveProperty("property_total_area");
    expect(change).not.toHaveProperty("property_floors");
    expect(change.block_area).toBe("820");
  });

  it("does not replace a property area the person typed", () => {
    expect(
      projectDataFromFacts(
        { area_m2: 820, single_block: true },
        { property_total_area: "1500" },
      ).property_total_area,
    ).toBeUndefined();
  });
});
