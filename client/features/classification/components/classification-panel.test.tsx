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
  special_risks: false,
  risk_exempt: false,
  fire_load_class: "medium",
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
    const html = render({ ...shop, area_m2: 3200, fire_load_class: undefined });
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
      fire_load_class: "medium",
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
      fire_load_class: "medium",
    });
    expect(html).toContain(
      "O imóvel é um bloco só (sem outras edificações no terreno)",
    );
    expect(html).toContain("não tem GLP");
    expect(html).not.toContain("Depois:");
  });

  it("still names what is only one system's own", () => {
    const html = render({ ...shop, area_m2: 3200, fire_load_class: undefined });
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

  it("shows what the chosen activity set, where it came from, and nothing without one", () => {
    const html = render({
      ...shop,
      activity: "C-2-vestuario-e-acessorios",
      division: undefined,
      fire_load_class: undefined,
    });
    expect(html).toContain("Da atividade escolhida");
    expect(html).toContain("IN 3, Anexo A · C-2 Vestuário e acessórios");
    expect(html).toContain(
      "Comércio com média, alta ou altíssima carga de incêndio",
    );
    expect(html).toContain("600 MJ/m² (média)");
    expect(html).toContain("C-2 · Vestuário e acessórios");
    expect(render(shop)).not.toContain("Da atividade escolhida");
  });

  it("warns when the activity disagrees with the division that was given", () => {
    const html = render({
      ...shop,
      activity: "C-2-vestuario-e-acessorios",
      division: "C-1",
    });
    expect(html).toContain(
      "A atividade &quot;Vestuário e acessórios&quot; é da divisão C-2",
    );
    expect(html).toContain("Vale a divisão informada.");
  });

  it("lets the user clear the activity", () => {
    expect(
      render({ ...shop, activity: "C-2-vestuario-e-acessorios" }),
    ).toContain("limpar");
    expect(render(shop)).toContain("Não informada");
    expect(render(shop)).not.toContain("limpar");
  });

  it("shows the risk level, what it means for the process and its source", () => {
    const html = render(shop);
    expect(html).toContain("Risco II");
    expect(html).toContain("sem prévia regularização e fiscalização do imóvel");
    expect(html).toContain("Anexo A, Quadro 1");
  });

  it("says the risk depends on the answers that are missing, without a level", () => {
    const html = render({ ...shop, fire_load_class: undefined });
    expect(html).toContain("Nível de risco");
    expect(html).toContain("Depende das respostas que faltam.");
    expect(html).not.toContain("Risco II");
  });

  it("shows no risk while a specific analysis replaces the result", () => {
    expect(render({ ...shop, area_m2: 750 })).not.toContain("Nível de risco");
  });

  it("lists every question as a row and always carries the provisional notice", () => {
    const html = render({});
    for (const label of [
      "Atividade (IN 3, Anexo A)",
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

  it("shows what the norm adds for subsidiary occupations, and nothing for a single use", () => {
    const html = render({ ...shop, single_use: false, only_subsidiary: true });
    expect(html).toContain("Observações da norma");
    expect(html).toContain("compartimentados em relação aos acessos");
    expect(html).toContain("IN 1 parte 2, art. 10");
    expect(render(shop)).not.toContain("Observações da norma");
  });

  it("asks whether the other occupations are only subsidiary", () => {
    const html = render({ ...shop, single_use: false });
    expect(html).toContain("As outras atividades são todas subsidiárias");
  });
});
