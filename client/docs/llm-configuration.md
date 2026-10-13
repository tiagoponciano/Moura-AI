# LLM configuration

How the chat routes pick the AI provider, model and API key now: only from what an admin saved on `/admin`. For developers adding a model or provider, or debugging "which model answered".

## What this is

Every chat route (`/api/documents/chat`, `/api/classification/chat`) calls `resolveChatModel()` from `lib/llm/index.ts` once per request. It reads the configuration saved in the admin console (provider, model and the provider's key from Supabase Vault) with the service role. Providers: Anthropic (`@ai-sdk/anthropic`), OpenAI (`@ai-sdk/openai`) and Google (`@ai-sdk/google`).

Invariants:

- **The admin console is the only source.** No API key or model is read from environment variables; `SUPABASE_SERVICE_ROLE_KEY` is the one server variable involved, and only to read what the console saved.
- **The key never reaches the browser.** It is decrypted by `get_llm_config()`, which only `service_role` may execute, and is used only in server code.
- **Any failure to read the config means "not configured".** No service role key, Supabase not configured, an RPC error, nothing saved or no key for the saved provider all end in the same 500; RPC errors are also logged as `Failed to read the LLM config`.
- Resolution happens on every request; there is no cache. A change saved in the console applies to the next message.

## Surface

| Export                              | File                    | Contract                                                                                                                      |
| ----------------------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `resolveChatModel()`                | `lib/llm/index.ts`      | Server-only, async. `{ model: LanguageModel }` or `{ error: Response }` (500, see below)                                      |
| `toChatResponse`, `ChatPersistence` | `lib/llm/index.ts`      | Stream wrapper used by the chat handlers (see `chat-history.md`); stream errors are masked (see `chat-request-limits.md`)     |
| `pickModelConfig(stored)`           | `lib/llm/config.ts`     | Pure. `{ provider, model, apiKey }` when `stored.api_key` is non-empty, else `undefined`                                      |
| `LLM_CATALOG`                       | `lib/llm/catalog.ts`    | Providers and models the admin console offers; safe to import in the browser                                                  |
| `LLM_PROVIDERS`                     | `lib/llm/catalog.ts`    | `["anthropic", "openai", "google"]`, same values as the `llm_provider` enum                                                   |
| `isCatalogModel(p, m)`              | `lib/llm/catalog.ts`    | `true` only when `m` is listed under provider `p`                                                                             |
| `createSupabaseAdminClient()`       | `lib/supabase/admin.ts` | Server-only (`import "server-only"`). Service role client, or `undefined` without Supabase env or `SUPABASE_SERVICE_ROLE_KEY` |
| `chatErrorMessage(error)`           | `lib/chat-error.ts`     | Text the chat shows for a failed request: the `error` field of a JSON body, else `error.message` unchanged                    |

`get_llm_config()` returns zero or one row: `provider`, `model` and `api_key` (the decrypted Vault secret `llm_api_key_<provider>`, `null` when that provider has no secret). No row when `app_settings.llm_provider` or `llm_model` is null.

### Catalog

| Provider    | Model IDs                                                                          |
| ----------- | ---------------------------------------------------------------------------------- |
| `anthropic` | `claude-sonnet-4-6`, `claude-sonnet-5-5`, `claude-opus-5-5`, `claude-haiku-4-5`    |
| `openai`    | `gpt-5.5`, `gpt-5.4`, `gpt-5.4-mini`                                               |
| `google`    | `gemini-3.5-flash`, `gemini-3.1-pro-preview`, `gemini-2.5-pro`, `gemini-2.5-flash` |

IDs are passed verbatim to the provider package (`createAnthropic({ apiKey })(id)`, `createOpenAI`, `createGoogle`).

## Rules and behavior

| Saved in console | Key for that provider | `SUPABASE_SERVICE_ROLE_KEY` | Result              |
| ---------------- | --------------------- | --------------------------- | ------------------- |
| provider + model | yes                   | set                         | the saved model     |
| provider + model | no                    | set                         | 500, not configured |
| provider + model | yes                   | unset                       | 500, not configured |
| nothing          | any                   | any                         | 500, not configured |

The 500 body is `{"error":"Nenhum modelo de IA configurado. Peça a um administrador para configurar em Administração."}`. The message is in Portuguese on purpose: it is shown to the user. The AI SDK passes the raw response body as `error.message`, and the `Chat` component renders `Erro: ` plus `chatErrorMessage(error)`, so the user reads only the sentence. The same applies to every JSON error from the chat routes (e.g. the quota message, see `chat-request-limits.md`).

Cost: one RPC (`get_llm_config`) per chat request when the service role key is set.

## What this does NOT do

- No environment fallback: `ANTHROPIC_API_KEY` and `LLM_MODEL` are not read. Without Supabase (or without the service role key) the chats cannot run at all.
- No per-module or per-user model: every chat uses the same configuration.
- No way to clear the saved model from the console; it can only be replaced by another catalog model.
- No provider-specific options (temperature, reasoning effort, caching); every provider gets the same `streamText` call.
- No automatic failover: if the saved provider returns an error (wrong key, quota, unknown model), the chat shows a generic "Não foi possível obter a resposta do assistente" and the provider's message goes only to the server log.

## Gotchas

- **Chat shows "Nenhum modelo de IA configurado" although a model is saved** → `SUPABASE_SERVICE_ROLE_KEY` is missing on the server, or the saved provider has no key. → The admin console warns about both; set the variable on Vercel (Production and Preview) and redeploy, or add the key on `/admin`.
- **Same message in a fresh local setup** → the console was never configured for this Supabase project, or `client/.env.local` lacks the service role key (Next reads `.env.local` only at startup). → Configure `/admin`, add the variable, restart `pnpm dev`.
- **Chat says "Não foi possível obter a resposta do assistente" right after switching provider** → wrong key or a model the account cannot use; the provider's message is in the server log as `Chat stream failed`. → Replace the key or pick another model in the console.
- **The documents tool call fails on Gemini** → Google's function calling accepts a narrower JSON Schema subset than Anthropic and OpenAI, and the `fill_fields` input schema is generated from each template. → Test a template on Google before relying on it; switch provider if the call is rejected.
- **`server-only` import error in a client component or test** → something client-side imported `lib/llm/index.ts` or `lib/supabase/admin.ts`. → Import `lib/llm/catalog.ts` (browser-safe) instead; tests should target `config.ts`/`catalog.ts`.
- **A model ID added to `LLM_CATALOG` fails at chat time** → the ID is not one the provider accepts. → Use the IDs listed in the provider package's model ID type (`node_modules/@ai-sdk/<provider>/dist/index.d.ts`).

## Setup

1. Supabase configured and the migrations applied (see `authentication.md`).
2. `SUPABASE_SERVICE_ROLE_KEY` in `client/.env.local` and on Vercel as a Secret (Production and Preview). Server-only; never prefix it with `NEXT_PUBLIC_`.
3. An admin picks provider and model and saves that provider's key on `/admin`.

To add a model, append it to the provider's `models` in `lib/llm/catalog.ts`. To add a provider: add the value to the `llm_provider` enum (new migration), install its `@ai-sdk/*` package, add a `case` in `createModel` (`lib/llm/index.ts`), an entry in `LLM_CATALOG` and the enum value in `database.types.ts`.
