import { describe, expect, it } from "vitest";
import { ACTIVITIES } from "./catalog/activities";
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
  special_risks: false,
  risk_exempt: false,
  fire_load_class: "medium",
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
  const open = {
    division: "C-2",
    area_m2: 1800,
    storeys: 2,
    height_m: 9,
    fire_load_class: "medium",
  };

  it("asks the four that keep the building in scope at once", () => {
    const result = classify(open, DATE);
    expect(result.next?.facts).toEqual([
      "single_block",
      "single_use",
      "storage_over_3_5m",
      "special_risks",
    ]);
    expect(result.next?.ask).toContain("é um bloco só");
    expect(result.next?.ask).toContain("não tem GLP");
    expect(result.nextQuestions).toHaveLength(4);
  });

  it("asks only what is still open once one is answered", () => {
    const result = classify({ ...open, single_block: true }, DATE);
    expect(result.next?.facts).toEqual([
      "single_use",
      "storage_over_3_5m",
      "special_risks",
    ]);
  });

  it("asks about the risk I exemptions after the others, and then nothing", () => {
    const four = {
      ...open,
      single_block: true,
      single_use: true,
      storage_over_3_5m: false,
      special_risks: false,
    };
    expect(classify(four, DATE).next?.facts).toEqual(["risk_exempt"]);
    expect(
      classify({ ...four, risk_exempt: false }, DATE).next,
    ).toBeUndefined();
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
    expect(result.progress).toEqual({ answered: 10, total: 10 });
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
    expect(result.analyses[0].reason).toContain("ainda não está coberta");
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

describe("classify: the activity", () => {
  const base = { storeys: 2, height_m: 9, area_m2: 1800 };
  const scope = {
    single_block: true,
    single_use: true,
    storage_over_3_5m: false,
    special_risks: false,
    risk_exempt: false,
  };

  it("fills the division and the fire load from the activity", () => {
    const result = classify(
      { ...base, ...scope, activity: "C-2-vestuario-e-acessorios" },
      DATE,
    );
    expect(result.derived).toEqual([
      {
        label: "Divisão",
        value: "C-2 · Comércio com média, alta ou altíssima carga de incêndio",
        source: "IN 3, Anexo A · C-2 Vestuário e acessórios",
      },
      {
        label: "Carga de incêndio",
        value: "600 MJ/m² (média)",
        source: "IN 3, Anexo A · C-2 Vestuário e acessórios",
      },
    ]);
    expect(result.status).toBe("complete");
    expect(result.table).toBe("Tabela 5, coluna 6 < H ≤ 12");
  });

  it("does not ask the division or the fire load once the activity says them", () => {
    const result = classify(
      {
        ...base,
        ...scope,
        area_m2: 3200,
        activity: "C-2-vestuario-e-acessorios",
      },
      DATE,
    );
    expect(result.nextQuestions).toEqual([]);
    // a medium fire load does not meet note 2, so no sprinklers and nothing pending
    expect(result.groups.needsInfo).toEqual([]);
  });

  it("counts the division the activity gave as answered", () => {
    const result = classify({ activity: "C-2-vestuario-e-acessorios" }, DATE);
    expect(result.progress.answered).toBe(1);
    expect(result.nextQuestions[0].fact).toBe("area_m2");
  });

  it("lets what the user typed win, and says when the activity disagrees", () => {
    const result = classify(
      {
        ...base,
        ...scope,
        division: "C-1",
        activity: "C-2-vestuario-e-acessorios",
      },
      DATE,
    );
    expect(result.derived.map((d) => d.label)).toEqual(["Carga de incêndio"]);
    expect(result.conflicts).toEqual([
      'A atividade "Vestuário e acessórios" é da divisão C-2, mas a divisão informada é C-1.',
    ]);
  });

  it("keeps a fire load class the user gave instead of the activity's load", () => {
    const result = classify(
      {
        ...base,
        ...scope,
        area_m2: 3200,
        fire_load_class: "high",
        activity: "C-2-vestuario-e-acessorios",
      },
      DATE,
    );
    expect(result.derived.map((d) => d.label)).toEqual(["Divisão"]);
    expect(result.groups.required.map((s) => s.id)).toContain("sprinklers");
  });

  it("sends an activity of another group to analysis, naming its division", () => {
    const result = classify(
      {
        ...base,
        ...scope,
        activity: ACTIVITIES.find((a) => a.group === "F")!.id,
      },
      DATE,
    );
    expect(result.derived[0]).toMatchObject({
      label: "Divisão",
      value: expect.stringContaining("F-"),
    });
    expect(result.status).toBe("analysis");
  });

  it("says when the norm points to another annex for the load", () => {
    const silos = ACTIVITIES.find((a) => a.division === "M-5")!;
    const result = classify({ activity: silos.id }, DATE);
    expect(result.derived).toContainEqual({
      label: "Carga de incêndio",
      value: "a norma remete ao Anexo C",
      source: expect.stringContaining("M-5"),
    });
  });

  it("ignores an activity id that is not in the catalog", () => {
    const result = classify({ activity: "C-9-invented" }, DATE);
    expect(result.derived).toEqual([]);
    expect(result.nextQuestions[0].fact).toBe("division");
  });
});

describe("classify: the risk level", () => {
  it("decides II for a small shop, with the norm's process and source", () => {
    const result = classify(shop(), DATE);
    expect(result.risk).toMatchObject({
      status: "decided",
      level: "II",
      reason: { locator: "Anexo A, Quadro 1" },
    });
    expect(result.risk?.status === "decided" && result.risk.process).toContain(
      "autodeclaração (Anexo G)",
    );
  });

  it("is pending until the fire load is known, because risk V needs it", () => {
    const result = classify(shop({ fire_load_class: undefined }), DATE);
    expect(result.risk).toEqual({ status: "pending" });
    expect(result.nextQuestions.map((q) => q.fact)).toEqual([
      "fire_load_class",
    ]);
  });

  it("asks the amounts only when there is something special", () => {
    const withSpecial = classify(shop({ special_risks: true }), DATE);
    expect(withSpecial.nextQuestions.map((q) => q.fact)).toEqual([
      "hazardous_substances",
      "flammable_internal_l",
      "flammable_external_m3",
    ]);
    const without = classify(shop({ special_risks: undefined }), DATE);
    expect(without.nextQuestions.map((q) => q.fact)).toEqual(["special_risks"]);
  });

  it("is not shown while a specific analysis replaces the result", () => {
    expect(classify(shop({ area_m2: 750 }), DATE).risk).toBeUndefined();
  });

  it("is not covered outside Grupo C", () => {
    const result = classify(
      { ...shop(), activity: undefined, division: "F-1" },
      DATE,
    );
    expect(result.risk).toBeUndefined();
  });

  it("takes the fire load from the activity, so it is not asked", () => {
    const result = classify(
      {
        ...shop({ fire_load_class: undefined }),
        division: undefined,
        activity: "C-2-vestuario-e-acessorios",
      },
      DATE,
    );
    expect(result.risk).toMatchObject({ status: "decided", level: "II" });
  });
});
