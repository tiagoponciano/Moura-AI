import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { Facts } from "../lib/engine/types";
import { EnlargementNotice } from "./enlargement-notice";

const enlargement = {
  originalAreaM2: 700,
  addedAreaM2: 300,
  originalRegularized: true,
  compartmented: true,
  newIsolatedBlock: false,
  graceYearsMet: true,
  raisesRigor: true,
};
const render = (answers: Facts, value = enlargement) =>
  renderToStaticMarkup(
    createElement(EnlargementNotice, { answers, enlargement: value }),
  );

describe("EnlargementNotice", () => {
  it("shows nothing without an enlargement", () => {
    expect(
      renderToStaticMarkup(createElement(EnlargementNotice, { answers: {} })),
    ).toBe("");
  });

  it("shows the share, the articles and what happens to each area, as provisional", () => {
    const html = render({ division: "A-2" });
    expect(html).toContain("42,9%");
    expect(html).toContain("art. 18, I e parágrafo único");
    expect(html).toContain("Área original");
    expect(html).toContain("Área ampliada");
    expect(html).toContain("ainda não confirmada");
  });

  it("asks for the activity while the division is unknown", () => {
    const html = render({});
    expect(html).toContain("Informe a atividade");
    expect(html).not.toContain("Área original");
  });
});
