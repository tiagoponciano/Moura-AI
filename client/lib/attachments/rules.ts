/** Supabase Storage bucket created by supabase/migrations/*_attachments.sql. */
export const ATTACHMENTS_BUCKET = "attachments";

/** Keep in sync with the bucket's `file_size_limit`. */
export const ATTACHMENT_MAX_BYTES = 20 * 1024 * 1024;

/** Keep in sync with the bucket's `allowed_mime_types`. */
export const ATTACHMENT_MIME_TYPES: readonly string[] = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

/** `accept` attribute of the file input. */
export const ATTACHMENT_ACCEPT = ".pdf,.png,.jpg,.jpeg,.webp,.docx";

export type AttachmentProblem = "empty" | "too_large" | "unsupported_type";

export function checkAttachment({
  mimeType,
  sizeBytes,
}: {
  mimeType: string;
  sizeBytes: number;
}): AttachmentProblem | undefined {
  if (!ATTACHMENT_MIME_TYPES.includes(mimeType)) return "unsupported_type";
  if (sizeBytes <= 0) return "empty";
  if (sizeBytes > ATTACHMENT_MAX_BYTES) return "too_large";
  return undefined;
}

/** `<userId>/<id>-<safe name>`: the bucket policies only allow the user's own top-level folder. */
export function buildStoragePath(
  userId: string,
  fileName: string,
  id: string,
): string {
  const safeName =
    fileName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^A-Za-z0-9._-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 100) || "file";
  return `${userId}/${id}-${safeName}`;
}

/** A file directly inside the user's folder, as `buildStoragePath` produces. */
export function isOwnStoragePath(path: string, userId: string): boolean {
  const [folder, name, ...rest] = path.split("/");
  return (
    folder === userId &&
    rest.length === 0 &&
    !!name &&
    name !== "." &&
    name !== ".."
  );
}
