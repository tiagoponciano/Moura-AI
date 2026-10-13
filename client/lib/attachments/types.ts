export type Attachment = {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  /** Signed download URL valid for one hour; `null` if signing failed. */
  url: string | null;
};
