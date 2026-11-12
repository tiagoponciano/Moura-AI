import { describe, expect, it } from "vitest";
import { z } from "zod";
import { searchActivity, searchActivityInput } from "./search-activity";

describe("searchActivityInput", () => {
  it("accepts a description and trims it", () => {
    expect(
      searchActivityInput.parse({ query: "  loja de roupas " }).query,
    ).toBe("loja de roupas");
  });

  it("rejects an empty or very long description", () => {
    expect(searchActivityInput.safeParse({ query: "  " }).success).toBe(false);
    expect(
      searchActivityInput.safeParse({ query: "x".repeat(121) }).success,
    ).toBe(false);
  });

  it("serializes to the JSON schema the model provider receives", () => {
    const schema = z.toJSONSchema(searchActivityInput) as unknown as {
      properties: { query: { description: string } };
    };
    expect(schema.properties.query.description).toContain("user's own words");
  });
});

describe("searchActivity", () => {
  it("returns the matching activities with their division and load, best first", () => {
    const out = searchActivity({ query: "loja de roupas" });
    expect(out.matches[0]).toEqual({
      id: "C-2-vestuario-e-acessorios",
      division: "C-2",
      destination: "Vestuário e acessórios",
      fire_load_mj_m2: 600,
      fire_load_ref: null,
    });
    expect(out.summary).toBe(
      `Atividades encontradas na IN 3: ${out.matches.length}`,
    );
  });

  it("tells the model to ask the user, even for a single match", () => {
    const out = searchActivity({ query: "açougue" });
    expect(out.matches).toHaveLength(1);
    expect(out.note).toContain("Ask the user which one is theirs");
  });

  it("says when the norm does not list the activity", () => {
    const out = searchActivity({ query: "pizzaria" });
    expect(out.matches).toEqual([]);
    expect(out.note).toContain("not listed");
    expect(out.summary).toBe("Nenhuma atividade encontrada na IN 3");
  });

  it("returns the printed reference when the load is in another annex", () => {
    const out = searchActivity({ query: "silos moegas" });
    expect(out.matches[0].fire_load_mj_m2).toBeNull();
    expect(out.matches[0].fire_load_ref).toBe("Anexo C");
  });
});
