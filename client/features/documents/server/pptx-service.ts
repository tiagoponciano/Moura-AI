import "server-only";

const TIMEOUT_MS = 30_000;

/** Whether the PPTX service is set up; without it no proposal can be generated. */
export const isPptxServiceConfigured = () =>
  Boolean(process.env.PPTX_SERVICE_URL && process.env.PPTX_SERVICE_TOKEN);

/** Server-only. Asks the PPTX service for the proposal deck; throws on any failure. */
export async function renderProposal(
  values: Record<string, string | string[]>,
): Promise<Uint8Array> {
  const response = await fetch(`${process.env.PPTX_SERVICE_URL}/render`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PPTX_SERVICE_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(values),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`The PPTX service answered ${response.status}`);
  }
  return new Uint8Array(await response.arrayBuffer());
}
