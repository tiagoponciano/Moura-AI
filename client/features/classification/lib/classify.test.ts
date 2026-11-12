import { describe, expect, it } from "vitest";
import { classify } from "./classify";
import type { Facts } from "./engine/types";

const DATE = "2026-11-12";

const shop = (overrides: Facts = {}): Facts => ({
  division: "C-2",
  area_m2: 700,
  storeys: 2,
  height_m: 8,
  single_block: true,
  single_use: true,
  storage_over_3_5m: false,
  ...overrides,
});

const labels = (views: { label: string }[]) => views.map((v) => v.label);

describe("classify: nothing answered", () => {
  const result = classify({}, DATE);

  it("is pending and asks the division first", () => {
    expect(result.status).toBe("pending");
    expect(result.nextQuestions[0].fact).toBe("division");
    expect(result.nextQuestions.map((q) => q.fact)).toEqual(
      expect.arrayContaining([
        "area_m2",
        "storeys",
        "single_block",
        "single_use",
      ]),
    );
  });

  it("lists every system as waiting for answers, none required", () => {
    expect(result.groups.required).toEqual([]);
    expect(result.groups.needsInfo.length).toBeGreaterThan(10);
  });

  it("is provisional and has answered nothing", () => {
    expect(result.provisional).toBe(true);
    expect(result.progress.answered).toBe(0);
    expect(result.table).toBeUndefined();
  });
});

describe("classify: the scope confirmations", () => {
  const open = { division: "C-2", area_m2: 1800, storeys: 2, height_m: 9 };

  it("asks the three at once", () => {
    const result = classify(open, DATE);
    expect(result.next?.facts).toEqual([
      "single_block",
      "single_use",
      "storage_over_3_5m",
    ]);
    expect(result.next?.ask).toContain("é um bloco só");
    expect(result.nextQuestions).toHaveLength(3);
  });

  it("asks only what is still open once one is answered", () => {
    const result = classify({ ...open, single_block: true }, DATE);
    expect(result.next?.facts).toEqual(["single_use", "storage_over_3_5m"]);
  });

  it("has nothing to ask once all three are answered", () => {
    const result = classify(
      {
        ...open,
        single_block: true,
        single_use: true,
        storage_over_3_5m: false,
      },
      DATE,
    );
    expect(result.next).toBeUndefined();
  });
});

describe("classify: a complete small shop", () => {
  const result = classify(shop(), DATE);

  it("is complete and names the table that applied", () => {
    expect(result.status).toBe("complete");
    expect(result.table).toBe("Tabela 2 (imóvel até 750 m² e 12 m)");
    expect(result.nextQuestions).toEqual([]);
  });

  it("lists the required systems in the order of the catalog, with extinguishers vital", () => {
    expect(labels(result.groups.required)).toEqual([
      "Brigada de incêndio",
      "Extintores",
      "Gás combustível",
      "Iluminação de emergência",
      "Instalações elétricas de baixa tensão",
      "Saídas de emergência",
      "Sinalização para abandono de local",
    ]);
    expect(
      result.groups.required.find((s) => s.id === "extinguishers")?.vital,
    ).toBe(true);
  });

  it("explains each system with the printed cell it came from", () => {
    const extinguishers = result.groups.required.find(
      (s) => s.id === "extinguishers",
    )!;
    expect(extinguishers.reasons).toEqual([
      {
        locator: "Tabela 2, Extintores, C",
        quote: expect.stringContaining("Extintores (C): x (V)"),
      },
    ]);
  });

  it("keeps the systems the table does not require in their own group", () => {
    expect(labels(result.groups.notRequired)).toContain("Controle de fumaça");
    expect(result.groups.needsInfo).toEqual([]);
  });

  it("counts the answers and what is still needed", () => {
    expect(result.progress).toEqual({ answered: 7, total: 7 });
  });
});

describe("classify: a large building", () => {
  const big = shop({ area_m2: 3200, fire_load_class: undefined });

  it("asks only the fire load, and says which systems wait for it", () => {
    const result = classify(big, DATE);
    expect(result.status).toBe("pending");
    expect(result.nextQuestions.map((q) => q.fact)).toEqual([
      "fire_load_class",
    ]);
    expect(result.table).toBe("Tabela 5, coluna 6 < H ≤ 12");
    const sprinklers = result.groups.needsInfo.find(
      (s) => s.id === "sprinklers",
    )!;
    expect(sprinklers.missing).toEqual(["Carga de incêndio"]);
    expect(sprinklers.reasons).toEqual([]);
  });

  it("requires sprinklers once the fire load is high, and shows the notes it came from", () => {
    const result = classify({ ...big, fire_load_class: "high" }, DATE);
    const sprinklers = result.groups.required.find(
      (s) => s.id === "sprinklers",
    )!;
    expect(result.status).toBe("complete");
    expect(sprinklers.reasons[0].locator).toBe(
      "Tabela 5, Chuveiros automáticos, 6 < H ≤ 12",
    );
    expect(sprinklers.reasons[0].quote).toContain(
      "Nota 2: Dispensado para C-1.",
    );
  });

  it("stays pending but stops asking when the user does not know the fire load", () => {
    const result = classify({ ...big, fire_load_class: null }, DATE);
    expect(result.status).toBe("pending");
    expect(result.nextQuestions).toEqual([]);
    expect(result.declaredUnknown.map((q) => q.fact)).toEqual([
      "fire_load_class",
    ]);
    expect(result.groups.needsInfo.map((s) => s.id)).toContain("sprinklers");
  });

  it("shows the substitutions the notes allow and which are already required", () => {
    const result = classify(
      shop({
        division: "C-3",
        area_m2: 6000,
        storeys: 5,
        height_m: 20,
        fire_load_class: "medium",
      }),
      DATE,
    );
    const vertical = result.groups.required.find(
      (s) => s.id === "vertical_compartmentation",
    )!;
    expect(vertical.substitutions[0]).toMatchObject({
      by: ["Detecção automática de incêndio", "Chuveiros automáticos"],
      alreadyRequired: [
        "Detecção automática de incêndio",
        "Chuveiros automáticos",
      ],
    });
  });

  it("marks a system limited to part of the building", () => {
    const result = classify(
      shop({
        division: "C-3",
        area_m2: 6000,
        storeys: 5,
        height_m: 20,
        fire_load_class: "medium",
      }),
      DATE,
    );
    const detection = result.groups.required.find(
      (s) => s.id === "automatic_detection",
    )!;
    expect(detection.partial).toBe(true);
    expect(detection.scopes[0]).toContain("todos os ambientes");
  });

  it("carries the information notes of a system", () => {
    const result = classify(
      shop({
        division: "C-3",
        area_m2: 6000,
        storeys: 5,
        height_m: 20,
        fire_load_class: "medium",
      }),
      DATE,
    );
    const brigade = result.groups.required.find(
      (s) => s.id === "fire_brigade",
    )!;
    expect(brigade.notes[0]).toContain("brigadistas orgânicos");
  });
});

describe("classify: cases the tables do not settle", () => {
  it("replaces the list with the reason at exactly 750 m²", () => {
    const result = classify(shop({ area_m2: 750 }), DATE);
    expect(result.status).toBe("analysis");
    expect(result.analyses).toHaveLength(1);
    expect(result.analyses[0].reason).toContain("750 m²");
    expect(result.groups).toEqual({
      required: [],
      needsInfo: [],
      notRequired: [],
    });
  });

  it("sends a division outside Grupo C to analysis", () => {
    const result = classify(shop({ division: "other" }), DATE);
    expect(result.status).toBe("analysis");
    expect(result.analyses[0].reason).toContain("Grupo C");
  });

  it("sends several blocks, mixed use and high storage to analysis", () => {
    for (const overrides of [
      { single_block: false },
      { single_use: false },
      { storage_over_3_5m: true },
    ]) {
      expect(classify(shop(overrides), DATE).status).toBe("analysis");
    }
  });

  it("gives the source of the analysis", () => {
    const result = classify(shop({ storage_over_3_5m: true }), DATE);
    expect(result.analyses[0].locator).toBe("Art. 8º");
    expect(result.analyses[0].quote).toContain("ocupação mista (C e J)");
  });
});

describe("classify: single-storey buildings", () => {
  it("does not ask for the height of a single-storey building", () => {
    const result = classify(shop({ storeys: 1, height_m: undefined }), DATE);
    expect(result.status).toBe("complete");
    expect(result.nextQuestions).toEqual([]);
  });

  it("uses the Térreo column whatever the roof height", () => {
    const result = classify(
      shop({ storeys: 1, height_m: 14, area_m2: 800 }),
      DATE,
    );
    expect(result.table).toBe("Tabela 5, coluna Térreo");
  });
});
