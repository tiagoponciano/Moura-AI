import type { ToolUIPart } from "ai";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ToolCallStatus } from "./tool-call-status";

const part = (output: unknown): ToolUIPart =>
  ({
    type: "tool-record",
    toolCallId: "1",
    state: "output-available",
    input: {},
    output,
  }) as unknown as ToolUIPart;

const render = (output: unknown) =>
  renderToStaticMarkup(createElement(ToolCallStatus, { part: part(output) }));

describe("ToolCallStatus", () => {
  it("lists the keys of a flat tool output", () => {
    expect(render({ area_m2: 800, storeys: 2 })).toContain(
      "Campos atualizados: area_m2, storeys",
    );
  });

  it("lists the `fields` of a tool that returns more than the recorded fields", () => {
    const html = render({
      answers: { area_m2: 800 },
      unknown: [],
      status: "pending",
      next: [],
      fields: ["area_m2"],
    });
    expect(html).toContain("Campos atualizados: area_m2");
    expect(html).not.toContain("status");
  });

  it("shows a tool's own summary instead of a list of fields", () => {
    const html = render({
      matches: [],
      summary: "Nenhuma atividade encontrada na IN 3",
    });
    expect(html).toContain("Nenhuma atividade encontrada na IN 3");
    expect(html).not.toContain("Campos atualizados");
  });

  it("says none when nothing was recorded", () => {
    expect(render({ fields: [] })).toContain("Campos atualizados: nenhum");
  });
});
