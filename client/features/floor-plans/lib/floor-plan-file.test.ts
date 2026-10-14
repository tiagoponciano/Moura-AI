import { describe, expect, it } from "vitest";
import { ATTACHMENT_MAX_BYTES } from "@/lib/attachments/rules";
import { checkFloorPlanFile } from "./floor-plan-file";

describe("checkFloorPlanFile", () => {
  it("accepts a PDF within the size limit", () => {
    expect(
      checkFloorPlanFile({ mimeType: "application/pdf", sizeBytes: 1024 }),
    ).toBeUndefined();
  });

  it("accepts a PDF of exactly the size limit", () => {
    expect(
      checkFloorPlanFile({
        mimeType: "application/pdf",
        sizeBytes: ATTACHMENT_MAX_BYTES,
      }),
    ).toBeUndefined();
  });

  it("rejects files that are not PDFs, including images and DWG", () => {
    expect(
      checkFloorPlanFile({ mimeType: "image/jpeg", sizeBytes: 1024 }),
    ).toBe("not_pdf");
    expect(
      checkFloorPlanFile({ mimeType: "image/vnd.dwg", sizeBytes: 1024 }),
    ).toBe("not_pdf");
    expect(checkFloorPlanFile({ mimeType: "", sizeBytes: 1024 })).toBe(
      "not_pdf",
    );
  });

  it("rejects an empty PDF", () => {
    expect(
      checkFloorPlanFile({ mimeType: "application/pdf", sizeBytes: 0 }),
    ).toBe("empty");
  });

  it("rejects a PDF over the size limit", () => {
    expect(
      checkFloorPlanFile({
        mimeType: "application/pdf",
        sizeBytes: ATTACHMENT_MAX_BYTES + 1,
      }),
    ).toBe("too_large");
  });
});
