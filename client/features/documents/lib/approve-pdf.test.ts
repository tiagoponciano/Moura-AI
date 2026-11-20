import { beforeEach, describe, expect, it, vi } from "vitest";

const { saveAs, keepProjectFile } = vi.hoisted(() => ({
  saveAs: vi.fn(),
  keepProjectFile: vi.fn(),
}));
vi.mock("file-saver", () => ({ saveAs }));
vi.mock("@/lib/projects/files-client", () => ({ keepProjectFile }));

import { NOT_KEPT_MESSAGE, approvePdf } from "./approve-pdf";

const pdf = { url: "blob:x", fileName: "Anexo C - Loja Centro.pdf" };
const fetchMock = vi.fn();

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockResolvedValue(new Response("%PDF", { status: 200 }));
  keepProjectFile.mockResolvedValue(true);
});

describe("approvePdf", () => {
  it("downloads the previewed file under its name and keeps that same file in the project", async () => {
    expect(await approvePdf(pdf, "p1")).toEqual({});
    expect(fetchMock).toHaveBeenCalledWith("blob:x");
    const [blob, name] = saveAs.mock.calls[0];
    expect(name).toBe("Anexo C - Loja Centro.pdf");
    expect(keepProjectFile).toHaveBeenCalledWith("p1", blob, {
      kind: "form",
      fileName: "Anexo C - Loja Centro.pdf",
    });
  });

  it("only downloads when there is no project", async () => {
    await approvePdf(pdf, undefined);
    expect(saveAs).toHaveBeenCalledTimes(1);
    expect(keepProjectFile).not.toHaveBeenCalled();
  });

  it("warns, without undoing the download, when the file cannot be kept", async () => {
    keepProjectFile.mockResolvedValue(false);
    expect(await approvePdf(pdf, "p1")).toEqual({ warning: NOT_KEPT_MESSAGE });
    expect(saveAs).toHaveBeenCalledTimes(1);
  });

  it("throws, and downloads nothing, when the preview cannot be read", async () => {
    fetchMock.mockResolvedValue(new Response("no", { status: 404 }));
    await expect(approvePdf(pdf, "p1")).rejects.toThrow(
      "Não foi possível ler a prévia",
    );
    expect(saveAs).not.toHaveBeenCalled();
    expect(keepProjectFile).not.toHaveBeenCalled();
  });
});
