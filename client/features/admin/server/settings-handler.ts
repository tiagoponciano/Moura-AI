import { parseJsonBody } from "@/lib/api/parse-json-body";
import type { Database } from "@/lib/supabase/database.types";
import type { AdminSettingsResponse } from "../lib/types";
import {
  providerAccessSchema,
  providerKeySchema,
  providerSchema,
  settingsUpdateSchema,
} from "../lib/validation";
import { requireSession, rpcErrorResponse } from "./respond";

type SettingsUpdate = Database["public"]["Tables"]["app_settings"]["Update"];

/** `GET /api/admin/settings`: model, domain and key hints (never the keys). */
export async function handleGetSettings(): Promise<Response> {
  const session = await requireSession();
  if (session.error) return session.error;

  const { data: settings, error } = await session.supabase
    .from("app_settings")
    .select("llm_provider, llm_model, allowed_email_domain, updated_at")
    .single();
  if (error) return rpcErrorResponse(error, "Failed to load settings");

  const { data: keys, error: keysError } = await session.supabase.rpc(
    "admin_list_provider_keys",
  );
  if (keysError) return rpcErrorResponse(keysError, "Failed to load settings");

  const { data: providers, error: providersError } = await session.supabase
    .from("llm_provider_settings")
    .select("provider, restricted");
  const { data: grants, error: grantsError } = await session.supabase
    .from("llm_provider_access")
    .select("provider, user_id");
  if (providersError || grantsError) {
    return rpcErrorResponse(
      providersError ?? grantsError!,
      "Failed to load settings",
    );
  }

  const body: AdminSettingsResponse = {
    settings: {
      provider: settings.llm_provider,
      model: settings.llm_model,
      allowedEmailDomain: settings.allowed_email_domain,
      updatedAt: settings.updated_at,
    },
    keys: keys.map((key) => ({
      provider: key.provider,
      lastFour: key.last_four,
      updatedAt: key.updated_at,
    })),
    access: providers.map((row) => ({
      provider: row.provider,
      restricted: row.restricted,
      userIds: grants
        .filter((grant) => grant.provider === row.provider)
        .map((grant) => grant.user_id),
    })),
    serviceRoleConfigured: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  };
  return Response.json(body);
}

/** `PUT /api/admin/settings` with `{ llm?, allowedEmailDomain? }`. */
export async function handleUpdateSettings(req: Request): Promise<Response> {
  const session = await requireSession();
  if (session.error) return session.error;

  const body = await parseJsonBody(req, settingsUpdateSchema);
  if (body.error) return body.error;

  const update: SettingsUpdate = {};
  if (body.data.llm) {
    update.llm_provider = body.data.llm.provider;
    update.llm_model = body.data.llm.model;
  }
  if (body.data.allowedEmailDomain !== undefined) {
    update.allowed_email_domain = body.data.allowedEmailDomain;
  }

  const { data, error } = await session.supabase
    .from("app_settings")
    .update(update)
    .eq("id", true)
    .select("id");
  if (error) return rpcErrorResponse(error, "Failed to save settings");
  if (!data.length) {
    return Response.json({ error: "Admin only" }, { status: 403 });
  }
  if (body.data.llm) {
    // Kept per provider, for the users who fall back to a provider that is not the default.
    const { error: modelError } = await session.supabase
      .from("llm_provider_settings")
      .upsert({
        provider: body.data.llm.provider,
        model: body.data.llm.model,
      });
    if (modelError)
      return rpcErrorResponse(modelError, "Failed to save settings");
  }
  return new Response(null, { status: 204 });
}

/** `PUT /api/admin/settings/keys/:provider` with `{ key }`; write-only. */
export async function handleSetProviderKey(
  req: Request,
  { params }: { params: Promise<{ provider: string }> },
): Promise<Response> {
  const session = await requireSession();
  if (session.error) return session.error;

  const provider = providerSchema.safeParse((await params).provider);
  if (!provider.success) {
    return Response.json({ error: "Unknown provider" }, { status: 404 });
  }
  const body = await parseJsonBody(req, providerKeySchema);
  if (body.error) return body.error;

  const { error } = await session.supabase.rpc("admin_set_provider_key", {
    provider: provider.data,
    api_key: body.data.key,
  });
  if (error) return rpcErrorResponse(error, "Failed to save the API key");
  return new Response(null, { status: 204 });
}

/** `PUT /api/admin/settings/access/:provider` with `{ restricted, userIds }`. */
export async function handleSetProviderAccess(
  req: Request,
  { params }: { params: Promise<{ provider: string }> },
): Promise<Response> {
  const session = await requireSession();
  if (session.error) return session.error;

  const provider = providerSchema.safeParse((await params).provider);
  if (!provider.success) {
    return Response.json({ error: "Unknown provider" }, { status: 404 });
  }
  const body = await parseJsonBody(req, providerAccessSchema);
  if (body.error) return body.error;

  const { error } = await session.supabase.rpc("admin_set_provider_access", {
    target: provider.data,
    is_restricted: body.data.restricted,
    user_ids: body.data.userIds,
  });
  if (error) return rpcErrorResponse(error, "Failed to save the access");
  return new Response(null, { status: 204 });
}
