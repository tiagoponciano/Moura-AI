# LLM configuration

How the chat routes pick the AI provider, model and API key now: the admin console's choice first, the environment as fallback. For developers adding a model or provider, or debugging "which model answered".

## What this is

Every chat route (`/api/documents/chat`, `/api/classification/chat`) calls `resolveChatModel()` from `lib/llm/index.ts` once per request. It reads the configuration saved in the admin console (provider, model and the provider's key from Supabase Vault) with the service role, and falls back to `ANTHROPIC_API_KEY`/`LLM_MODEL`. Providers: Anthropic (`@ai-sdk/anthropic`), OpenAI (`@ai-sdk/openai`) and Google (`@ai-sdk/google`).

Invariants:

- **The key never reaches the browser.** It is decrypted by `get_llm_config()`, which only `service_role` may execute, and is used only in server code.
- **Reading the stored config is best-effort.** Any failure (no service role key, Supabase not configured, RPC error) silently means "no stored config" and the env fallback applies; RPC errors are logged as `Failed to read the LLM config`.
- Resolution happens on every request; there is no cache. A change saved in the console applies to the next message.

## Surface

| Export                              | File                    | Contract                                                                                                                      |
| ----------------------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `resolveChatModel()`                | `lib/llm/index.ts`      | Server-only, async. `{ model: LanguageModel }` or `{ error: Response }` (500, see below)                                      |
| `toChatResponse`, `ChatPersistence` | `lib/llm/index.ts`      | Stream wrapper used by the chat handlers (see `chat-history.md`)                                                              |
| `pickModelConfig(stored, env)`      | `lib/llm/config.ts`     | Pure. `{ provider, model, apiKey }` or `undefined` (order below)                                                              |
| `DEFAULT_ANTHROPIC_MODEL`           | `lib/llm/config.ts`     | `"claude-sonnet-4-6"`                                                                                                         |
| `LLM_CATALOG`                       | `lib/llm/catalog.ts`    | Providers and models the admin console offers; safe to import in the browser                                                  |
| `LLM_PROVIDERS`                     | `lib/llm/catalog.ts`    | `["anthropic", "openai", "google"]`, same values as the `llm_provider` enum                                                   |
| `isCatalogModel(p, m)`              | `lib/llm/catalog.ts`    | `true` only when `m` is listed under provider `p`                                                                             |
| `createSupabaseAdminClient()`       | `lib/supabase/admin.ts` | Server-only (`import "server-only"`). Service role client, or `undefined` without Supabase env or `SUPABASE_SERVICE_ROLE_KEY` |

`get_llm_config()` returns zero or one row: `provider`, `model` and `api_key` (the decrypted Vault secret `llm_api_key_<provider>`, `null` when that provider has no secret). No row when `app_settings.llm_provider` or `llm_model` is null.

### Catalog

| Provider    | Model IDs                                                                          |
| ----------- | ---------------------------------------------------------------------------------- |
| `anthropic` | `claude-sonnet-4-6`, `claude-sonnet-5-5`, `claude-opus-5-5`, `claude-haiku-4-5`    |
| `openai`    | `gpt-5.5`, `gpt-5.4`, `gpt-5.4-mini`                                               |
| `google`    | `gemini-3.5-flash`, `gemini-3.1-pro-preview`, `gemini-2.5-pro`, `gemini-2.5-flash` |

IDs are passed verbatim to the provider package (`createAnthropic({ apiKey })(id)`, `createOpenAI`, `createGoogle`). The catalog only restricts what the console can save; `LLM_MODEL` is not checked against it.

## Rules and behavior

`pickModelConfig(stored, env)`:

1. `stored` has a non-empty `api_key` → `{ provider: stored.provider, model: stored.model, apiKey: stored.api_key }`.
2. Else `env.ANTHROPIC_API_KEY` is non-empty → `{ provider: "anthropic", model: env.LLM_MODEL || "claude-sonnet-4-6", apiKey }`.
3. Else `undefined` → `resolveChatModel` returns `500 {"error":"No AI provider configured"}`.

| Saved in console           | Key for that provider | `SUPABASE_SERVICE_ROLE_KEY` | `ANTHROPIC_API_KEY` | Model used                      |
| -------------------------- | --------------------- | --------------------------- | ------------------- | ------------------------------- |
| provider + model           | yes                   | set                         | any                 | the saved one                   |
| provider + model           | no                    | set                         | set                 | Anthropic `LLM_MODEL`/default   |
| provider + model           | yes                   | unset                       | set                 | Anthropic `LLM_MODEL`/default   |
| nothing (`llm: null`)      | any                   | any                         | set                 | Anthropic `LLM_MODEL`/default   |
| any of the above fallbacks | —                     | —                           | unset               | 500 `No AI provider configured` |

Cost: one extra RPC (`get_llm_config`) per chat request when the service role key is set.

## What this does NOT do

- No per-module or per-user model: every chat uses the same configuration.
- No environment fallback for OpenAI or Google: only `ANTHROPIC_API_KEY` is read from the environment.
- No provider-specific options (temperature, reasoning effort, caching); every provider gets the same `streamText` call.
- No automatic failover: if the saved provider returns an error (wrong key, quota, unknown model), the chat shows that error; it does not retry with the env fallback.

## Gotchas

- **Chats keep using Claude after choosing OpenAI or Google in the console** → the service role key is missing on the server, or the chosen provider has no key; both fall back silently. → The admin console warns about both; check `SUPABASE_SERVICE_ROLE_KEY` on Vercel and redeploy.
- **Chat fails right after switching provider** → wrong key or a model the account cannot use; the provider's message reaches the chat unmasked. → Replace the key or pick another model in the console.
- **The documents tool call fails on Gemini** → Google's function calling accepts a narrower JSON Schema subset than Anthropic and OpenAI, and the `fill_fields` input schema is generated from each template. → Test a template on Google before relying on it; switch provider if the call is rejected.
- **`server-only` import error in a client component or test** → something client-side imported `lib/llm/index.ts` or `lib/supabase/admin.ts`. → Import `lib/llm/catalog.ts` (browser-safe) instead; tests should target `config.ts`/`catalog.ts`.
- **A model ID added to `LLM_CATALOG` fails at chat time** → the ID is not one the provider accepts. → Use the IDs listed in the provider package's model ID type (`node_modules/@ai-sdk/<provider>/dist/index.d.ts`).

## Setup

| Variable                    | Where       | Purpose                                           |
| --------------------------- | ----------- | ------------------------------------------------- |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | Lets `resolveChatModel` read the console's choice |
| `ANTHROPIC_API_KEY`         | server only | Fallback key (Anthropic)                          |
| `LLM_MODEL`                 | server only | Fallback model ID; default `claude-sonnet-4-6`    |

To add a model, append it to the provider's `models` in `lib/llm/catalog.ts`. To add a provider: add the value to the `llm_provider` enum (new migration), install its `@ai-sdk/*` package, add a `case` in `createModel` (`lib/llm/index.ts`), an entry in `LLM_CATALOG` and the enum value in `database.types.ts`.
