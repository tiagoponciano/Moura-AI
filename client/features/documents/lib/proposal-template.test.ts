import { readFileSync } from "node:fs";
import { join } from "node:path";
import PizZip from "pizzip";
import { describe, expect, it } from "vitest";
import { checkProposalTemplate } from "./proposal-template";

const bundled = new Uint8Array(
  readFileSync(join(process.cwd(), "public/templates/proposal/proposal.pptx")),
);
const listDeck = new Uint8Array(
  readFileSync(join(__dirname, "fixtures/list-deck.pptx")),
);

/** The bundled deck with one tag renamed in every slide. */
function renamed(from: string, to: string) {
  const zip = new PizZip(listDeck);
  for (const path of Object.keys(zip.files)) {
    if (!/^ppt\/slides\/slide\d+\.xml$/.test(path)) continue;
    zip.file(
      path,
      zip.file(path)!.asText().replaceAll(`{{${from}}}`, `{{${to}}}`),
    );
  }
  return zip.generate({ type: "uint8array" });
}

/** The plain deck with every tag turned into plain text. */
function untagged() {
  const zip = new PizZip(listDeck);
  for (const path of Object.keys(zip.files)) {
    if (!/^ppt\/slides\/slide\d+\.xml$/.test(path)) continue;
    zip.file(
      path,
      zip
        .file(path)!
        .asText()
        .replace(/\{\{\s*\w+\s*\}\}/g, "texto"),
    );
  }
  return zip.generate({ type: "uint8array" });
}

describe("checkProposalTemplate", () => {
  it("accepts the deck bundled with the app and says which tags it leaves unused", () => {
    const check = checkProposalTemplate(bundled);
    expect(check.ok).toBe(true);
    if (check.ok) {
      expect(check.tags).toEqual([
        "city_state",
        "client",
        "date",
        "plan_description",
        "plan_title",
        "price",
        "project_name",
        "validity_days",
      ]);
      expect(check.unused).toContain("plan_items");
    }
  });

  it("accepts a deck that uses every tag", () => {
    const check = checkProposalTemplate(listDeck);
    expect(check).toMatchObject({ ok: true });
  });

  it("refuses a file that is not a deck", () => {
    const check = checkProposalTemplate(new TextEncoder().encode("not a zip"));
    expect(check).toMatchObject({ ok: false, unknown: [], missing: [] });
  });

  it("refuses a deck with no tags, naming the client and the price", () => {
    const check = checkProposalTemplate(untagged());
    expect(check).toMatchObject({ ok: false, missing: ["client", "price"] });
  });

  it("refuses a deck that has other tags but not the price", () => {
    const check = checkProposalTemplate(renamed("price", "date"));
    expect(check).toMatchObject({ ok: false, missing: ["price"] });
  });

  it("refuses a deck that has other tags but not the client", () => {
    const check = checkProposalTemplate(renamed("client", "date"));
    expect(check).toMatchObject({ ok: false, missing: ["client"] });
  });

  it("refuses a deck with a tag the app does not fill, naming it", () => {
    const check = checkProposalTemplate(renamed("price", "valor"));
    expect(check).toMatchObject({ ok: false, unknown: ["valor"] });
  });
});
