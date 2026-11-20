import { describe, expect, it } from "vitest";
import {
  normalize,
  queryWords,
  searchArticles,
  type NormDoc,
} from "./norm-search";

const docs: NormDoc[] = [
  {
    doc: "IN-6",
    articles: [
      {
        number: 1,
        page: 2,
        text: "Art. 1º Esta IN trata dos extintores de incêndio.",
      },
      {
        number: 2,
        page: 2,
        text: "Art. 2º A distância máxima a percorrer até o extintor é de 20 m.",
      },
    ],
  },
  {
    doc: "IN-11",
    articles: [
      {
        number: 5,
        page: 3,
        text: "Art. 5º A iluminação de emergência deve ter autonomia de 1 hora.",
      },
    ],
  },
];

describe("normalize and queryWords", () => {
  it("drops accents and case", () => {
    expect(normalize("ILUMINAÇÃO")).toBe("iluminacao");
  });

  it("keeps the words worth searching and drops filler and short words", () => {
    expect(queryWords("A distância de um extintor até o ponto")).toEqual([
      "distancia",
      "extintor",
      "ate",
      "ponto",
    ]);
  });

  it("limits a long query", () => {
    expect(
      queryWords("um dois tres quatro cinco seis sete oito nove dez onze")
        .length,
    ).toBeLessThanOrEqual(8);
  });
});

describe("searchArticles", () => {
  it("finds an article across accents and cites where it is", () => {
    const [hit] = searchArticles(docs, "iluminacao emergencia");
    expect(hit).toMatchObject({
      doc: "IN-11",
      article: 5,
      page: 3,
      matched: 2,
    });
    expect(hit.excerpt).toContain("autonomia de 1 hora");
  });

  it("ranks the article with more of the query's words first", () => {
    const hits = searchArticles(docs, "distancia extintor");
    expect(hits[0]).toMatchObject({ doc: "IN-6", article: 2, matched: 2 });
    expect(hits[1]).toMatchObject({ article: 1, matched: 1 });
  });

  it("returns nothing for a query with no searchable word or no match", () => {
    expect(searchArticles(docs, "a de o")).toEqual([]);
    expect(searchArticles(docs, "helicoptero")).toEqual([]);
  });

  it("finds a page of the annexes, marked as one and with no article number", () => {
    const withAnnex: NormDoc[] = [
      {
        doc: "IN-7",
        articles: [{ number: 1, page: 2, text: "Art. 1º Objetivo." }],
        annexes: [
          {
            page: 16,
            title: "Anexo A",
            text: "Tabela 1 - Tipo de sistema: mangotinho",
          },
        ],
      },
    ];
    const [hit] = searchArticles(withAnnex, "mangotinho");
    expect(hit).toMatchObject({ doc: "IN-7", kind: "annex", page: 16 });
    expect(hit.article).toBeUndefined();
    expect(hit.excerpt).toContain("mangotinho");
  });

  it("marks an article hit as one", () => {
    expect(searchArticles(docs, "iluminacao")[0].kind).toBe("article");
  });

  it("respects the limit", () => {
    expect(searchArticles(docs, "extintor", 1)).toHaveLength(1);
  });

  it("shortens a long article around the match", () => {
    const long: NormDoc = {
      doc: "IN-X",
      articles: [
        {
          number: 1,
          page: 1,
          text: `${"palavra ".repeat(300)}extintor ${"fim ".repeat(300)}`,
        },
      ],
    };
    const [hit] = searchArticles([long], "extintor");
    expect(hit.excerpt.length).toBeLessThan(760);
    expect(hit.excerpt).toContain("extintor");
  });
});
