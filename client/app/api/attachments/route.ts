import {
  handleCreateAttachment,
  handleListAttachments,
} from "@/lib/attachments/server";

export const GET = handleListAttachments;

export const POST = handleCreateAttachment;
