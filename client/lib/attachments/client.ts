import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  ATTACHMENTS_BUCKET,
  buildStoragePath,
  checkAttachment,
  type AttachmentProblem,
} from "./rules";
import type { Attachment } from "./types";

const PROBLEM_MESSAGES: Record<AttachmentProblem | "failed", string> = {
  unsupported_type: "Tipo de arquivo não suportado. Envie PDF, imagem ou DOCX.",
  too_large: "Arquivo maior que 20 MB.",
  empty: "O arquivo está vazio.",
  failed: "Não foi possível enviar o arquivo.",
};

/** Carries the Portuguese message to show for a failed upload. */
export class AttachmentUploadError extends Error {
  constructor(
    readonly fileName: string,
    problem: AttachmentProblem | "failed",
  ) {
    super(`${fileName}: ${PROBLEM_MESSAGES[problem]}`);
  }
}

/**
 * Browser-only. Uploads straight to Supabase Storage (no Vercel body limit),
 * then records the file through `POST /api/attachments`. The stored object
 * is removed again if recording fails.
 */
export async function uploadAttachment(
  file: File,
  chatId: string,
): Promise<Attachment> {
  const problem = checkAttachment({
    mimeType: file.type,
    sizeBytes: file.size,
  });
  if (problem) throw new AttachmentUploadError(file.name, problem);

  const supabase = createSupabaseBrowserClient();
  const user = supabase && (await supabase.auth.getUser()).data.user;
  if (!supabase || !user) throw new AttachmentUploadError(file.name, "failed");

  const bucket = supabase.storage.from(ATTACHMENTS_BUCKET);
  const storagePath = buildStoragePath(user.id, file.name, crypto.randomUUID());
  const { error: uploadError } = await bucket.upload(storagePath, file, {
    contentType: file.type,
  });
  if (uploadError) {
    console.error("Failed to upload attachment", uploadError);
    throw new AttachmentUploadError(file.name, "failed");
  }

  const response = await fetch("/api/attachments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chatId,
      storagePath,
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
    }),
  });
  if (!response.ok) {
    await bucket.remove([storagePath]);
    throw new AttachmentUploadError(file.name, "failed");
  }
  const { attachment } = (await response.json()) as { attachment: Attachment };
  return attachment;
}

export async function fetchAttachments(chatId: string): Promise<Attachment[]> {
  const response = await fetch(`/api/attachments?chatId=${chatId}`);
  if (!response.ok) {
    throw new Error(`Listing attachments failed with ${response.status}`);
  }
  const { attachments } = (await response.json()) as {
    attachments: Attachment[];
  };
  return attachments;
}
