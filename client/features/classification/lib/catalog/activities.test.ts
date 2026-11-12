import { describe, expect, it } from "vitest";
import {
  ACTIVITIES,
  ACTIVITY_BY_ID,
  DIVISIONS,
  activityLabel,
  searchActivities,
} from "./activities";

const top = (query: string) => searchActivities(query)[0]?.activity;

describe("activity catalog", () => {
  it("has the 262 printed rows less the one the norm prints twice", () => {
    expect(ACTIVITIES).toHaveLength(261);
  });

  it("gives every activity a unique, readable id", () => {
    expect(new Set(ACTIVITIES.map((a) => a.id)).size).toBe(ACTIVITIES.length);
    expect(ACTIVITY_BY_ID.get("C-2-vestuario-e-acessorios")).toMatchObject({
      division: "C-2",
      destination: "Vestuário e acessórios",
      qfi: 600,
    });
  });

  it("keeps the printed reference when the load is in another annex", () => {
    const silos = ACTIVITIES.find((a) => a.division === "M-5")!;
    expect(silos.qfi).toBeUndefined();
    expect(silos.qfiRef).toBe("Anexo C");
  });

  it("lists the divisions in group and number order", () => {
    expect(DIVISIONS.slice(0, 6)).toEqual([
      "A-1",
      "A-2",
      "A-3",
      "B-1",
      "B-2",
      "C-1",
    ]);
    expect(DIVISIONS.indexOf("C-3")).toBeLessThan(DIVISIONS.indexOf("D-1"));
    expect(DIVISIONS.indexOf("M-2")).toBeLessThan(DIVISIONS.indexOf("M-11"));
  });

  it("labels an activity with its division", () => {
    expect(activityLabel(ACTIVITY_BY_ID.get("C-1-acougue")!)).toBe(
      "C-1 · Açougue",
    );
  });
});

describe("searchActivities", () => {
  it("finds a clothes shop under clothing, not under the factory that makes clothes", () => {
    expect(top("loja de roupas")?.id).toBe("C-2-vestuario-e-acessorios");
  });

  it("finds the factory when the description says so", () => {
    expect(top("fábrica de roupas")).toMatchObject({
      division: "I-2",
      destination: "Roupas",
    });
  });

  it("finds an activity by its own word, with or without accents and plurals", () => {
    expect(top("açougue")?.id).toBe("C-1-acougue");
    expect(top("acougues")?.id).toBe("C-1-acougue");
    expect(top("sapatos")?.destination).toBe("Calçados");
    expect(top("móveis")?.destination).toBe("Móveis");
  });

  it("maps everyday words to the norm's words", () => {
    expect(top("farmácia")?.destination).toContain("Drogarias");
    expect(top("mercado")?.destination).toBe("Supermercados (vendas)");
    expect(top("pet shop")?.destination).toContain("pet shop");
  });

  it("finds a shopping center as C-3", () => {
    expect(top("shopping center")).toMatchObject({ division: "C-3" });
  });

  it("returns several options and at most the limit", () => {
    const matches = searchActivities("loja de roupas", 3);
    expect(matches.length).toBeGreaterThan(1);
    expect(matches.length).toBeLessThanOrEqual(3);
  });

  it("returns nothing for an activity the annex does not list", () => {
    expect(searchActivities("pizzaria")).toEqual([]);
    expect(searchActivities("")).toEqual([]);
    expect(searchActivities("de da o")).toEqual([]);
  });

  it("offers both the commercial and the industrial bakery, so the user chooses", () => {
    expect(searchActivities("padaria").map((m) => m.activity.id)).toEqual([
      "F-8-padarias-comerciais",
      "I-2-padarias-industriais",
    ]);
  });

  it("returns nothing when less than half of the words match", () => {
    expect(searchActivities("loja de roupas e armas e motos e barcos")).toEqual(
      [],
    );
  });
});
