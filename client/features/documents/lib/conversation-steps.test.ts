import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  type ConversationGuide,
  conversationSteps,
  deriveSteps,
  guideProblems,
  MAX_STEP_FIELDS,
} from "./conversation-steps";
import type { TemplateEntry, TemplateField, TemplateSchema } from "./templates";

const PUBLIC = join(__dirname, "../../../public");
const readJson = <T>(path: string) =>
  JSON.parse(readFileSync(join(PUBLIC, path), "utf8")) as T;

const mark = (name: string): TemplateField => ({
  name,
  type: "boolean",
  label: name,
  description: name,
  mark: true,
});
const text = (name: string): TemplateField => ({
  name,
  type: "string",
  label: name,
  description: name,
});

describe("deriveSteps", () => {
  it("keeps consecutive marks in one step", () => {
    const schema = { fields: [mark("external"), mark("internal")] };
    expect(deriveSteps(schema)).toEqual([{ fields: ["external", "internal"] }]);
  });

  it("puts the field right after a mark in the mark's step", () => {
    const schema = {
      fields: [mark("has_re"), text("re_number"), text("city")],
    };
    expect(deriveSteps(schema)).toEqual([
      { fields: ["has_re", "re_number"] },
      { fields: ["city"] },
    ]);
  });

  it("starts a new step when a mark follows plain fields", () => {
    const schema = { fields: [text("name"), mark("has_re")] };
    expect(deriveSteps(schema)).toEqual([
      { fields: ["name"] },
      { fields: ["has_re"] },
    ]);
  });

  it("splits plain fields past the step limit", () => {
    const names = Array.from(
      { length: MAX_STEP_FIELDS + 1 },
      (_, i) => `f${i}`,
    );
    const steps = deriveSteps({ fields: names.map(text) });
    expect(steps.map((step) => step.fields.length)).toEqual([
      MAX_STEP_FIELDS,
      1,
    ]);
  });
});

describe("guideProblems", () => {
  const schema = { fields: [text("name"), text("city")] };

  it("accepts a guide that covers every field once", () => {
    const guide = { steps: [{ fields: ["name"] }, { fields: ["city"] }] };
    expect(guideProblems(schema, guide)).toEqual([]);
  });

  it("reports unknown, repeated and missing fields", () => {
    const guide = { steps: [{ fields: ["name", "name", "street"] }] };
    expect(guideProblems(schema, guide)).toEqual([
      "Field in two steps: name",
      "Unknown field: street",
      "Field in no step: city",
    ]);
  });
});

it("uses the guide's steps when the form has one", () => {
  const schema = { fields: [text("name")] };
  const guide = { steps: [{ fields: ["name"], question: "Quem?" }] };
  expect(conversationSteps(schema, guide)).toEqual(guide.steps);
});

const entries = readJson<TemplateEntry[]>("templates/index.json");

describe.each(entries)("steps of $id", (entry) => {
  const schema = readJson<TemplateSchema>(entry.schema);
  const guide = entry.guide
    ? readJson<ConversationGuide>(entry.guide)
    : undefined;
  const steps = conversationSteps(schema, guide);

  it("ask about every field exactly once", () => {
    expect(guideProblems(schema, { steps })).toEqual([]);
  });

  it("stay within the step limit unless written by hand", () => {
    if (guide) return;
    expect(
      steps.filter((step) => step.fields.length > MAX_STEP_FIELDS),
    ).toEqual([]);
  });
});
