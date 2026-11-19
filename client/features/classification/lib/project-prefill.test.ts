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
});
