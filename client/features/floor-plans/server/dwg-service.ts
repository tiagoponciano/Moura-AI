import "server-only";

const TIMEOUT_MS = 60_000;

/** Whether the DWG service is set up; without it no plan can be converted. */
export const isDwgServiceConfigured = () =>
  Boolean(process.env.DWG_SERVICE_URL && process.env.DWG_SERVICE_TOKEN);

const headers = () => ({
  Authorization: `Bearer ${process.env.DWG_SERVICE_TOKEN}`,
});

function upload(file: Blob, name: string) {
  const form = new FormData();
  form.append("file", file, name);
  return form;
}

/** Server-only. The service's answer to a conversion, headers included; throws when it is not a success. */
export async function convertWithDwgService(
  file: Blob,
  name: string,
  format: "dxf" | "dwg",
  scale: number,
): Promise<Response> {
  const response = await fetch(
    `${process.env.DWG_SERVICE_URL}/convert?format=${format}&scale=${scale}`,
    {
      method: "POST",
      headers: headers(),
      body: upload(file, name),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    },
  );
  if (!response.ok) {
    throw new DwgServiceError(response.status);
  }
  return response;
}

/** Server-only. The small crops (base64 PNG) of the title block and the scale strip. */
export async function cropsFromDwgService(
  file: Blob,
  name: string,
): Promise<{ name: string; png_base64: string }[]> {
  const response = await fetch(`${process.env.DWG_SERVICE_URL}/crops`, {
    method: "POST",
    headers: headers(),
    body: upload(file, name),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) throw new DwgServiceError(response.status);
  return (await response.json()).crops;
}

export class DwgServiceError extends Error {
  constructor(readonly status: number) {
    super(`The DWG service answered ${status}`);
  }
}
