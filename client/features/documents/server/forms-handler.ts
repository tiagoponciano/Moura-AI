import { requireUser } from "@/lib/auth/require-user";
import {
  compareForms,
  FORM_COLUMNS,
  fromFormRow,
} from "@/lib/cbmsc-forms/catalog";
import { fetchGoogleDocTextHash } from "@/lib/cbmsc-forms/google";
import { GOOGLE_ID_PATTERN } from "@/lib/cbmsc-forms/links";

/** `GET /api/documents/forms`: active CBMSC forms, sorted by IN and annex. */
export async function handleListCbmscForms(): Promise<Response> {
  const session = await requireUser("Forms catalog is not configured");
  if (session.error) return session.error;

  const { data, error } = await session.supabase
    .from("cbmsc_forms")
    .select(FORM_COLUMNS)
    .eq("active", true);
  if (error) {
    console.error("Failed to load forms", error);
    return Response.json({ error: "Failed to load forms" }, { status: 500 });
  }
  return Response.json({ forms: data.map(fromFormRow).sort(compareForms) });
}

/**
 * `GET /api/documents/forms/:docId/version`: the text hash of the form as the
 * CBMSC has it now, compared by the browser to the one its template was made from.
 */
export async function handleGetFormVersion(
  _req: Request,
  { params }: { params: Promise<{ docId: string }> },
): Promise<Response> {
  const session = await requireUser("Forms catalog is not configured");
  if (session.error) return session.error;

  const { docId } = await params;
  if (!GOOGLE_ID_PATTERN.test(docId)) {
    return Response.json({ error: "Form not found" }, { status: 404 });
  }
  try {
    return Response.json({ textHash: await fetchGoogleDocTextHash(docId) });
  } catch (cause) {
    console.error("Failed to read a form version from Google", cause);
    return Response.json(
      { error: "Failed to read the form from Google" },
      { status: 502 },
    );
  }
}
