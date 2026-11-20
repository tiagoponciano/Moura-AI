import { describe, expect, it } from "vitest";
import { buildNormsInstructions } from "./norms-instructions";

describe("buildNormsInstructions", () => {
  const text = buildNormsInstructions();

  it("names both tools and forbids answering a norm from memory", () => {
    expect(text).toContain("`search_norm`");
    expect(text).toContain("`read_norm_text`");
    expect(text).toContain("Never answer what a norm says from memory");
  });

  it("asks for the instruction and the article, or the annex page, in every statement", () => {
    expect(text).toContain("the instruction and the article");
    expect(text).toContain("annex page, which has no article number");
  });

  it("says what to do when nothing is found, and which instructions do not exist", () => {
    expect(text).toContain("say so plainly and do not guess");
    expect(text).toContain("IN 16, IN 17 and IN 32 do not exist");
  });

  it("keeps the assistant from deciding what a project needs, and replies in Portuguese", () => {
    expect(text).toContain("You do not classify a building");
    expect(text).toContain("Brazilian Portuguese");
  });
});
