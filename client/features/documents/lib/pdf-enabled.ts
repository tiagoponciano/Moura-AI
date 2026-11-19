/**
 * Whether the app offers PDF output. Off until a PDF service is hosted: the
 * `.docx` and `.pptx` downloads do not depend on it. Set
 * `NEXT_PUBLIC_PDF_ENABLED=true` to show the PDF actions again.
 */
export const PDF_ENABLED = process.env.NEXT_PUBLIC_PDF_ENABLED === "true";
