import {
  handleGetProposalTemplate,
  handleResetProposalTemplate,
  handleSetProposalTemplate,
} from "@/features/documents/server";

export const GET = handleGetProposalTemplate;
export const PUT = handleSetProposalTemplate;
export const DELETE = handleResetProposalTemplate;
