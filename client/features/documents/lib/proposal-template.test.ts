import { readFileSync } from "node:fs";
import { join } from "node:path";
import PizZip from "pizzip";
import { describe, expect, it } from "vitest";
import { PROPOSAL_TAGS, checkProposalTemplate } from "./proposal-template";

const bundled = new Uint8Array(
  readFileSync(join(process.cwd(), "public/templates/proposal/proposal.pptx")),
);

/** The bundled deck with one tag renamed in every slide. */
function renamed(from: string, to: string) {
  const zip = new PizZip(bundled);
  for (const path of Object.keys(zip.files)) {
    if (!/^ppt\/slides\/slide\d+\.xml$/.test(path)) continue;
    zip.file(
      path,
      zip.file(path)!.asText().replaceAll(`{{${from}}}`, `{{${to}}}`),
    );
  }
  return zip.generate({ type: "uint8array" });
}

describe("checkProposalTemplate", () => {
  it("accepts the deck bundled with the app", () => {
    const check = checkProposalTemplate(bundled);
    expect(check.ok).toBe(true);
    if (check.ok) expect(check.tags).toEqual([...PROPOSAL_TAGS]);
  });

  it("refuses a file that is not a deck", () => {
    const check = checkProposalTemplate(new TextEncoder().encode("not a zip"));
    expect(check).toMatchObject({ ok: false, missing: [], unknown: [] });
  });

  it("names the tag a deck lacks and the one it adds", () => {
    const check = checkProposalTemplate(renamed("price", "valor"));
    expect(check).toMatchObject({
      ok: false,
      missing: ["price"],
      unknown: ["valor"],
    });
  });
});
