import type { ProposalRequest } from "./proposal";

/** Asks the server for the proposal and resolves to the file; throws with the server's message. */
export async function requestProposal(
  projectId: string,
  request: ProposalRequest,
): Promise<Blob> {
  const response = await fetch(
    `/api/documents/projects/${projectId}/proposal`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    },
  );
  if (!response.ok) {
    const body = await response.json().catch(() => undefined);
    throw new Error(body?.error ?? "Não foi possível gerar a proposta.");
  }
  return response.blob();
}
