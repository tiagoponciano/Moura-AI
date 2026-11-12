import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { classify } from "../lib/classify";
import type { Facts } from "../lib/engine/types";
import { ClassificationPanel } from "./classification-panel";

const DATE = "2026-11-12";
const shop: Facts = {
  division: "C-2",
  area_m2: 700,
  storeys: 2,
  height_m: 8,
  single_block: true,
  single_use: true,
  storage_over_3_5m: false,
};

function render(answers: Facts): string {
  return renderToStaticMarkup(
    createElement(ClassificationPanel, {
      answers,
      sources: {},
      classification: classify(answers, DATE),
      onChange: () => {},
      onReset: () => {},
    }),
  );
}

describe("ClassificationPanel", () => {
  it("asks the first question and explains what the panel will show when nothing is answered", () => {
    const html = render({});
    expect(html).toContain("Dados da edificação");
    expect(html).toContain("0 de");
    expect(html).toContain("Próxima pergunta");
    expect(html).toContain("Qual é a atividade do imóvel?");
    expect(html).toContain("Responda às perguntas");
    expect(html).not.toContain("Exigidos");
  });

  it("lists the required systems, the table that applied and why, for a complete small shop", () => {
    const html = render(shop);
    expect(html).toContain("Exigidos");
    expect(html).toContain("Aplicando: Tabela 2");
    expect(html).toContain("Extintores");
    expect(html).toContain("vital");
    expect(html).toContain("Tabela 2, Extintores, C");
    expect(html).not.toContain("Próxima pergunta");
  });

  it("shows what is missing when only the fire load is unanswered", () => {
    const html = render({ ...shop, area_m2: 3200 });
    expect(html).toContain("Dependem de respostas");
    expect(html).toContain("Falta");
    expect(html).toContain("carga de incêndio");
    expect(html).toContain("Próxima pergunta");
  });

  it("says once what every pending system waits for instead of repeating it on each row", () => {
    const html = render({
      division: "C-2",
      area_m2: 1800,
      storeys: 2,
      height_m: 9,
    });
    expect(html).toContain(
      "Todos aguardam: bloco único, uma só ocupação, armazenamento acima de 3,5 m.",
    );
    expect(html).not.toContain("Falta");
  });

  it("asks the three scope confirmations as one question", () => {
    const html = render({
      division: "C-2",
      area_m2: 1800,
      storeys: 2,
      height_m: 9,
    });
    expect(html).toContain(
      "O imóvel é um bloco só (sem outras edificações no terreno)",
    );
    expect(html).not.toContain("Depois:");
  });

  it("still names what is only one system's own", () => {
    const html = render({ ...shop, area_m2: 3200 });
    expect(html).toContain("Falta");
    expect(html).not.toContain("Todos aguardam");
  });

  it("flags what only a professional can answer after a não sei", () => {
    const html = render({ ...shop, area_m2: 3200, fire_load_class: null });
    expect(html).toContain("Pendente de profissional habilitado");
    expect(html).not.toContain("Próxima pergunta");
  });

  it("shows the reason instead of a list at exactly 750 m²", () => {
    const html = render({ ...shop, area_m2: 750 });
    expect(html).toContain("Caso para análise específica");
    expect(html).toContain("750 m²");
    expect(html).toContain("Fonte: Anexo B");
    expect(html).not.toContain("Exigidos");
  });

  it("limits a requirement to part of the building and shows the substitutions", () => {
    const html = render({
      ...shop,
      division: "C-3",
      area_m2: 6000,
      storeys: 5,
      height_m: 20,
      fire_load_class: "medium",
    });
    expect(html).toContain("Exigido em parte do imóvel");
    expect(html).toContain("Limitado a:");
    expect(html).toContain("A norma permite substituir por:");
  });

  it("lists every question as a row and always carries the provisional notice", () => {
    const html = render({});
    for (const label of [
      "Divisão da ocupação",
      "Área construída (m²)",
      "Pavimentos",
      "Altura (m)",
      "Carga de incêndio",
      "Bloco único",
      "Uma só ocupação",
      "Armazenamento acima de 3,5 m",
    ]) {
      expect(html).toContain(label);
    }
    expect(html).toContain("Regras provisórias.");
  });

  it("disables the reset button until something is answered", () => {
    const resetButton = (html: string) =>
      html.slice(html.lastIndexOf("<button"));
    expect(resetButton(render({}))).toContain("Limpar respostas");
    expect(resetButton(render({}))).toContain(`disabled=""`);
    expect(resetButton(render(shop))).not.toContain(`disabled=""`);
  });
});
