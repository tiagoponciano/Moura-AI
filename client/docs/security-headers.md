# Security headers

The HTTP headers every response carries to limit what a page can load and who can embed it. It describes the headers as they are now, for developers adding an external script, image or API to the app.

## What this is

`client/next.config.ts` returns the headers below from `headers()` for the source `/(.*)`, so pages, API routes and static files all get them. They are built when the config loads: `NEXT_PUBLIC_SUPABASE_URL` and `NODE_ENV` are read at build and server start, not per request.

Invariants:

- **No nonces.** A nonce-based CSP would force every page into dynamic rendering, so scripts and styles allow `'unsafe-inline'`. The CSP restricts _where_ code and data come from; it does not stop an injected inline script. XSS protection still rests on React's escaping (the app has no `dangerouslySetInnerHTML`).
- **Every external origin is listed by hand.** Anything not in the table below is blocked by the browser, with a `Refused to …` error in the console.

## Surface

| Header                      | Value                                                                |
| --------------------------- | -------------------------------------------------------------------- |
| `Content-Security-Policy`   | see the directives below                                             |
| `X-Frame-Options`           | `DENY`                                                               |
| `X-Content-Type-Options`    | `nosniff`                                                            |
| `Referrer-Policy`           | `strict-origin-when-cross-origin`                                    |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains` (two years; ignored over HTTP) |
| `Permissions-Policy`        | `camera=(), microphone=(), geolocation=()`                           |

CSP directives:

| Directive                   | Sources                                                                                                     | Needed by                                                                                                               |
| --------------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `default-src`               | `'self'`                                                                                                    | everything not listed                                                                                                   |
| `script-src`                | `'self' 'unsafe-inline' https://accounts.google.com`, plus `'unsafe-eval'` when `NODE_ENV` is `development` | Next's inline bootstrap, next-themes, Google's sign-in client; React's dev tooling                                      |
| `style-src`                 | `'self' 'unsafe-inline' https://accounts.google.com`                                                        | inline `style` attributes (Radix, three.js canvas), Google's sign-in styles                                             |
| `img-src`                   | `'self' blob: data: https://*.googleusercontent.com`                                                        | `next/image`, generated images, Google avatars                                                                          |
| `font-src`                  | `'self'`                                                                                                    | IBM Plex via `next/font` (self-hosted)                                                                                  |
| `connect-src`               | `'self' https://accounts.google.com` and the value of `NEXT_PUBLIC_SUPABASE_URL`                            | our API, Google sign-in, Supabase Auth and Storage from the browser                                                     |
| `frame-src`                 | `https://accounts.google.com blob:`                                                                         | Google's sign-in iframes; `blob:` for the floor plan PDF preview (`features/floor-plans/docs/floor-plan-conversion.md`) |
| `object-src`                | `'none'`                                                                                                    | —                                                                                                                       |
| `base-uri`, `form-action`   | `'self'`                                                                                                    | —                                                                                                                       |
| `frame-ancestors`           | `'none'`                                                                                                    | no site may embed the app (clickjacking)                                                                                |
| `upgrade-insecure-requests` | present except in development                                                                               | —                                                                                                                       |

## Rules and behavior

- Without `NEXT_PUBLIC_SUPABASE_URL`, `connect-src` is `'self' https://accounts.google.com`; nothing in the browser talks to Supabase then.
- Opening an attachment is a navigation to a Supabase signed URL in a new tab, not a `fetch`, so it needs no CSP source.
- `pnpm start` locally runs with `NODE_ENV=production`, so `upgrade-insecure-requests` is sent; browsers treat `localhost` as secure, so the app still loads over `http://localhost`.

## What this does NOT do

- No CSP reporting (`report-to`/`report-uri`): violations show only in the visitor's console.
- No nonce or hash for inline scripts, so an injected inline `<script>` is not blocked.
- No `Cross-Origin-Opener-Policy`: Google's popup sign-in needs to talk back to the opener.
- No per-route headers: API responses get the same CSP as pages.

## Gotchas

- **A new external script, font, image host or API fails silently in the browser** → the CSP blocks it; the console shows `Refused to load … because it violates the following Content Security Policy directive`. → Add the origin to the matching directive in `next.config.ts`, as narrowly as possible.
- **Login works locally but not on a preview deployment after changing Supabase projects** → `connect-src` holds the Supabase URL read at build. → Redeploy after changing `NEXT_PUBLIC_SUPABASE_URL`.
- **The app cannot be shown inside another site (an iframe, a Notion embed)** → `frame-ancestors 'none'` and `X-Frame-Options: DENY`, on purpose. → Change both together if an embed is ever wanted.
- **Dev server errors mention `eval`** → `'unsafe-eval'` is only added when `NODE_ENV` is `development`. → Run `pnpm dev`, not a production build, when debugging with React's dev tooling.
