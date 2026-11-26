import { describe, expect, it } from "vitest";
import {
  addConsulted,
  normLabel,
  recheckMessage,
  type ConsultedNorm,
} from "./consulted-norms";

const hit = (doc: string, article: number | undefined, page = 3) => ({
  doc,
  kind: article === undefined ? "annex" : "article",
  article,
  page,
  excerpt: `Texto de ${doc} ${article ?? "anexo"}`,
  matched: ["saida"],
});

describe("addConsulted", () => {
  it("lists each hit of a search with its instruction, article and excerpt", () => {
    const list = addConsulted([], "search_norm", {
      hits: [hit("IN 9", 12), hit("IN 1", undefined, 4)],
    });
    expect(list.map(normLabel)).toEqual(["IN 9, art. 12", "IN 1, anexo, p. 4"]);
    expect(list[0]).toMatchObject({ confirmed: false, page: 3 });
    expect(list[0].excerpt).toContain("IN 9");
  });

  it("does not list the same passage twice, and keeps what the person confirmed", () => {
    let list = addConsulted([], "search_norm", { hits: [hit("IN 9", 12)] });
    list = list.map((item) => ({ ...item, confirmed: true }));
    list = addConsulted(list, "search_norm", { hits: [hit("IN 9", 12)] });
    expect(list).toHaveLength(1);
    expect(list[0].confirmed).toBe(true);
  });

  it("replaces the excerpt with the text of a whole reading", () => {
    let list = addConsulted([], "search_norm", { hits: [hit("IN 9", 12)] });
    list = addConsulted(list, "read_norm_text", {
      doc: "IN 9",
      kind: "article",
      article: 12,
      page: 3,
      text: "O artigo inteiro\n  com quebras",
      truncated: false,
    });
    expect(list).toHaveLength(1);
    expect(list[0].excerpt).toBe("O artigo inteiro com quebras");
  });

  it("ignores other tools, empty results and outputs of another shape", () => {
    expect(addConsulted([], "fill_fields", { hits: [hit("IN 9", 1)] })).toEqual(
      [],
    );
    expect(addConsulted([], "search_norm", { hits: [], note: "none" })).toEqual(
      [],
    );
    expect(addConsulted([], "search_norm", "oops")).toEqual([]);
    expect(addConsulted([], "read_norm_text", { error: "no article" })).toEqual(
      [],
    );
  });

  it("keeps at most twelve, dropping the oldest unconfirmed one first", () => {
    let list: ConsultedNorm[] = [];
    for (let n = 1; n <= 13; n++) {
      list = addConsulted(list, "search_norm", { hits: [hit("IN 9", n)] });
      if (n === 1) list = list.map((item) => ({ ...item, confirmed: true }));
    }
    expect(list).toHaveLength(12);
    expect(list[0].article).toBe(1);
    expect(list.map((item) => item.article)).not.toContain(2);
  });
});

describe("normLabel", () => {
  it("calls a section of a technical note an item, not an article", () => {
    const [note] = addConsulted([], "search_norm", {
      hits: [hit("NT-01-2025", 3)],
    });
    expect(normLabel(note)).toBe("NT-01-2025, item 3");
  });
});

describe("recheckMessage", () => {
  it("names the passage that does not match and asks for a new search", () => {
    const [norm] = addConsulted([], "search_norm", { hits: [hit("IN 9", 12)] });
    expect(recheckMessage(norm)).toBe(
      "O trecho IN 9, art. 12 não confere com a norma. Busque de novo, com outras palavras, e confira antes de responder.",
    );
  });
});
