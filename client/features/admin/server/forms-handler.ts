import { parseJsonBody } from "@/lib/api/parse-json-body";
import {
  compareForms,
  FORM_COLUMNS,
  fromFormRow,
} from "@/lib/cbmsc-forms/catalog";
import {
  fetchGoogleDocTitle,
  resolveGoogleDocIds,
} from "@/lib/cbmsc-forms/google";
import { GOOGLE_ID_PATTERN, parseGoogleLink } from "@/lib/cbmsc-forms/links";
import { parseFormTitle } from "@/lib/cbmsc-forms/title";
import type { AdminFormsResponse, ResolveFormLinkResponse } from "../lib/types";
import {
  formActiveSchema,
  formLinkSchema,
  formsSaveSchema,
} from "../lib/validation";
import { requireSession, rpcErrorResponse } from "./respond";

/** `GET /api/admin/forms`: every form, inactive ones included. */
export async function handleListForms(): Promise<Response> {
  const session = await requireSession();
  if (session.error) return session.error;

  const { data, error } = await session.supabase
    .from("cbmsc_forms")
    .select(FORM_COLUMNS);
  if (error) return rpcErrorResponse(error, "Failed to load forms");

  const body: AdminFormsResponse = {
    forms: data.map(fromFormRow).sort(compareForms),
  };
  return Response.json(body);
}

/** `POST /api/admin/forms/resolve` with `{ url }`: drafts read from Google; saves nothing. */
export async function handleResolveFormLink(req: Request): Promise<Response> {
  const session = await requireSession();
  if (session.error) return session.error;

  const body = await parseJsonBody(req, formLinkSchema);
  if (body.error) return body.error;

  const link = parseGoogleLink(body.data.url);
  if (!link) {
    return Response.json(
      {
        error:
          "Link não reconhecido. Use um link do Google Docs ou do Google Drive.",
      },
      { status: 400 },
    );
  }

  let ids: string[];
  let titles: string[];
  try {
    ids = await resolveGoogleDocIds(link);
    titles = await Promise.all(ids.map(fetchGoogleDocTitle));
  } catch (cause) {
    console.error("Failed to read a form link from Google", cause);
    return Response.json(
      {
        error:
          "Não foi possível ler esse link no Google. Confira se ele é público.",
      },
      { status: 502 },
    );
  }
  if (!ids.length) {
    return Response.json(
      { error: "Nenhum Google Docs encontrado nesse arquivo." },
      { status: 422 },
    );
  }

  const { data, error } = await session.supabase
    .from("cbmsc_forms")
    .select("google_doc_id")
    .in("google_doc_id", ids);
  if (error) return rpcErrorResponse(error, "Failed to load forms");
  const listed = new Set(data.map((row) => row.google_doc_id));

  const response: ResolveFormLinkResponse = {
    drafts: ids.map((id, index) => ({
      googleDocId: id,
      ...parseFormTitle(titles[index]),
      listed: listed.has(id),
    })),
  };
  return Response.json(response);
}

/** `POST /api/admin/forms` with `{ forms }`: adds or updates each one and marks it active. */
export async function handleSaveForms(req: Request): Promise<Response> {
  const session = await requireSession();
  if (session.error) return session.error;

  const body = await parseJsonBody(req, formsSaveSchema);
  if (body.error) return body.error;

  const { error } = await session.supabase.from("cbmsc_forms").upsert(
    body.data.forms.map((form) => ({
      google_doc_id: form.googleDocId,
      normative: form.normative,
      annex: form.annex,
      name: form.name,
      active: true,
    })),
    { onConflict: "google_doc_id" },
  );
  if (error) return rpcErrorResponse(error, "Failed to save forms");
  return new Response(null, { status: 204 });
}

/** `PATCH /api/admin/forms/:docId` with `{ active }`. */
export async function handleUpdateForm(
  req: Request,
  { params }: { params: Promise<{ docId: string }> },
): Promise<Response> {
  const session = await requireSession();
  if (session.error) return session.error;

  const { docId } = await params;
  if (!GOOGLE_ID_PATTERN.test(docId)) {
    return Response.json({ error: "Form not found" }, { status: 404 });
  }
  const body = await parseJsonBody(req, formActiveSchema);
  if (body.error) return body.error;

  const { data, error } = await session.supabase
    .from("cbmsc_forms")
    .update({ active: body.data.active })
    .eq("google_doc_id", docId)
    .select("google_doc_id");
  if (error) return rpcErrorResponse(error, "Failed to update the form");
  if (!data.length) {
    return Response.json({ error: "Form not found" }, { status: 404 });
  }
  return new Response(null, { status: 204 });
}
