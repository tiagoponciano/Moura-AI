import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  type ConversationGuide,
  conversationSteps,
  deriveSteps,
  guideProblems,
  MAX_STEP_FIELDS,
  stepProgress,
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

it("falls back to derived steps when the guide does not fit the schema", () => {
  const schema = { fields: [text("name"), text("city")] };
  const guide = { steps: [{ fields: ["name"] }] };
  expect(conversationSteps(schema, guide)).toEqual(deriveSteps(schema));
});

describe("stepProgress", () => {
  const schema = {
    fields: [
      { ...text("name"), required: true },
      text("email"),
      mark("has_re"),
      text("re_number"),
    ],
  };
  const steps = [
    { fields: ["name", "email"] },
    { fields: ["has_re", "re_number"] },
  ];

  it("starts at the first step when nothing is filled", () => {
    expect(stepProgress(schema, steps, {}).index).toBe(0);
  });

  it("stays on a step while a required field in it is empty", () => {
    expect(stepProgress(schema, steps, { email: "a@b.c" }).index).toBe(0);
  });

  it("moves on once the step's required fields are filled", () => {
    expect(stepProgress(schema, steps, { name: "Ana" }).index).toBe(1);
  });

  it("counts a mark answered false as an answer", () => {
    const progress = stepProgress(schema, steps, {
      name: "Ana",
      has_re: false,
    });
    expect(progress).toEqual({ index: 2, total: 2, step: undefined });
  });

  it("moves past a skipped step", () => {
    expect(stepProgress(schema, steps, { name: "Ana" }, [1]).index).toBe(2);
  });

  it("names the next pending step, past skipped ones", () => {
    const three = [...steps, { fields: ["email"] }];
    expect(stepProgress(schema, three, {}, [1]).next).toEqual({
      fields: ["email"],
    });
  });
});
