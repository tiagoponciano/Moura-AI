import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CompensatoryMeasures } from "./compensatory-measures";

const render = (faults: string[]) =>
  renderToStaticMarkup(createElement(CompensatoryMeasures, { faults }));

describe("CompensatoryMeasures", () => {
  it("shows nothing without a recorded error", () => {
    expect(render([])).toBe("");
  });

  it("shows the system, the fault, the parameter and the measures as printed", () => {
    const html = render(["D6"]);
    expect(html).toContain("Saídas de emergência");
    expect(html).toContain("2% &lt; L ≤10%");
    expect(html).toContain("Instalação de SDAI");
    expect(html).toContain("não confirmado com a Moura");
  });

  it("marks an error the norm does not admit", () => {
    expect(render(["D9"])).toContain("Não admitido");
  });

  it("leaves out the parameter of a row that has none", () => {
    expect(render(["D1"])).not.toContain("não aplicável");
  });
});
