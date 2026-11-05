import { requireUser } from "@/lib/auth/require-user";
import {
  compareForms,
  FORM_COLUMNS,
  fromFormRow,
} from "@/lib/cbmsc-forms/catalog";

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
