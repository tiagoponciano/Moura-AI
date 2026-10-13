import { describe, expect, it } from "vitest";
import {
  ATTACHMENT_MAX_BYTES,
  buildStoragePath,
  checkAttachment,
  isOwnStoragePath,
} from "./rules";

const USER = "11111111-1111-1111-1111-111111111111";
const ID = "3b241101-e2bb-4255-8caf-4136c566a962";

describe("checkAttachment", () => {
  it("accepts a PDF within the size limit", () => {
    expect(
      checkAttachment({ mimeType: "application/pdf", sizeBytes: 1024 }),
    ).toBeUndefined();
  });

  it("accepts a file of exactly the maximum size", () => {
    expect(
      checkAttachment({
        mimeType: "image/png",
        sizeBytes: ATTACHMENT_MAX_BYTES,
      }),
    ).toBeUndefined();
  });

  it("rejects a file one byte over the limit", () => {
    expect(
      checkAttachment({
        mimeType: "image/png",
        sizeBytes: ATTACHMENT_MAX_BYTES + 1,
      }),
    ).toBe("too_large");
  });

  it("rejects an empty file", () => {
    expect(checkAttachment({ mimeType: "application/pdf", sizeBytes: 0 })).toBe(
      "empty",
    );
  });

  it("rejects types outside the list, including an empty browser type", () => {
    expect(
      checkAttachment({ mimeType: "application/zip", sizeBytes: 10 }),
    ).toBe("unsupported_type");
    expect(checkAttachment({ mimeType: "", sizeBytes: 10 })).toBe(
      "unsupported_type",
    );
  });
});

describe("buildStoragePath", () => {
  it("places the file in the user's folder, prefixed with its id", () => {
    expect(buildStoragePath(USER, "planta.pdf", ID)).toBe(
      `${USER}/${ID}-planta.pdf`,
    );
  });

  it("strips accents, spaces and unsafe characters from the name", () => {
    expect(buildStoragePath(USER, "Habite-se Ação (1)/../x.pdf", ID)).toBe(
      `${USER}/${ID}-Habite-se-Acao-1-..-x.pdf`,
    );
  });

  it("falls back to a generic name when nothing safe remains", () => {
    expect(buildStoragePath(USER, "???", ID)).toBe(`${USER}/${ID}-file`);
  });
});

describe("isOwnStoragePath", () => {
  it("accepts a file directly inside the user's folder", () => {
    expect(isOwnStoragePath(`${USER}/${ID}-a.pdf`, USER)).toBe(true);
  });

  it("rejects another user's folder, nested folders and traversal", () => {
    expect(isOwnStoragePath(`other/${ID}-a.pdf`, USER)).toBe(false);
    expect(isOwnStoragePath(`${USER}/sub/a.pdf`, USER)).toBe(false);
    expect(isOwnStoragePath(`${USER}/..`, USER)).toBe(false);
    expect(isOwnStoragePath(`${USER}/`, USER)).toBe(false);
  });
});
