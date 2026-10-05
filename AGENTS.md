# Moura AI — agent guide

Conventions for anyone (human or agent) changing this repository. The README explains what the app does and how to run it; this file explains how code is expected to be written. Git workflow, commit format and documentation rules come from the TPA working agreement (`~/.claude/CLAUDE.md`, from `tiagoponciano/AI-TPA-Setup`) and are not repeated here.

All app code lives in `client/` (Next.js App Router, TypeScript, Tailwind v4, shadcn/ui). Next.js in this repo is newer than most training data: read `client/node_modules/next/dist/docs/` before using a Next API (see `client/AGENTS.md`).

## 1. Folder layout

```
client/
├── app/          # routing only: page.tsx, layout.tsx, route.ts, globals.css, icon.png
├── features/     # one folder per module: documents, home, classification, floor-plans
├── components/   # app-wide UI: ui/ (shadcn), layout/, chat/, shared/
├── lib/          # app-wide logic: utils, module registry
├── hooks/        # app-wide hooks
├── public/       # brand assets and .docx templates
├── docs/         # app-wide documentation (app shell, theming)
└── scripts/      # one-off generators
```

A feature is organized like `features/documents/`:

| Folder / file     | Holds                                                      |
| ----------------- | ---------------------------------------------------------- |
| `index.ts`        | Public client entry. Exports only what `app/` renders      |
| `server/index.ts` | Public server entry, when the feature has route handlers   |
| `components/`     | The feature's React components                             |
| `hooks/`          | The feature's client state                                 |
| `lib/`            | Pure logic and data access, no React; tests sit next to it |
| `server/`         | Route handler logic and LLM prompts                        |
| `docs/`           | One document per behavior of this feature                  |

## 2. Module boundaries

Enforced by `no-restricted-imports` in `client/eslint.config.mjs`; `pnpm run lint` fails on a violation.

- `page.tsx` and `route.ts` contain no logic. They import a feature only through `@/features/<name>` or `@/features/<name>/server`.
- A feature never imports another feature. Inside a feature, use relative imports.
- `components/`, `lib/` and `hooks/` never import a feature. When two features need the same code, move it up there.
- Route segment config (`maxDuration`, `runtime`…) stays in the `route.ts` / `page.tsx` itself; Next only reads it from that file.
- Not caught by lint: relative imports that climb into another feature (`../../home/...`). Reviewers check those.

## 3. Components

- One exported component per file, file named after it in kebab-case (`form-panel.tsx` → `FormPanel`).
- Server components by default. Add `"use client"` only to files that use state, effects, browser APIs or event handlers, as high in the tree as the interactivity starts (`DocumentWorkspace`, not `DocumentsPage`).
- Props are a named `type <Component>Props`. No `any`.
- Extract a component when a block has its own name in the UI (a panel, a card, a list) or is reused; do not extract one-line wrappers.
- JSX renders; it does not decide. Validation, filtering and formatting live in `lib/` and are called from hooks.
- `components/ui/` is shadcn-generated. Add primitives with `pnpm exec shadcn add <name>`; avoid editing them by hand.

## 4. State and logic

- Pure functions in `features/<name>/lib/` hold the rules and are what gets tested.
- Client state lives in one hook per workspace (`features/<name>/hooks/use-*.ts`) that calls those functions and exposes values plus actions.
- The LLM never decides or writes output. It extracts structured data through a tool whose input schema comes from code (`schemaToZod`); deterministic code validates it and produces the result. Keep that split for new modules.
- No persistence and no auth exist. Do not add storage without discussing it first.

## 5. Naming and language

- Everything in the repo is English: identifiers, file and folder names, routes, JSON keys, comments, docs, commit messages, LLM system prompts.
- Portuguese only where a user reads it: UI copy, field descriptions in `*.schema.json`, template names in `index.json`, validation messages shown on screen. Prompts tell the model to reply in Brazilian Portuguese.
- Brazilian domain terms with no clean English equivalent stay as-is (`CBMSC`, `CNPJ`).
- Files: kebab-case. Components and types: PascalCase. Hooks: `use-*.ts` exporting `useX`. Constants: `UPPER_SNAKE_CASE`. Template field names: snake_case English (`company_name`).

## 6. Styling

- Colors only through theme tokens (`bg-primary`, `text-muted-foreground`, `border`, `text-success`…). Never hex values or Tailwind palette colors (`bg-red-500`), which break dark mode. Tokens and the palette are in `client/docs/theming.md`.
- Font is IBM Plex Sans / Mono via `next/font`; do not add font families ad hoc.
- Prettier (default config) formats everything except `components/ui/`. Run `pnpm run format` before committing; `pnpm run format:check` must pass.

## 7. Tests

- Vitest, node environment. `pnpm run test` (root or `client/`); `pnpm run test:watch` while developing.
- Test files sit next to the code as `<file>.test.ts`.
- Required for rules and derived values in `lib/`: filters, validation, formulas, classification. Bug fixes start with a failing test.
- Not required for markup-only components or config. Say so in the PR instead.
- Test names describe behavior (`treats an untouched boolean as false…`), one subject per test.

## 8. Verification and documentation

Before opening a PR, from `client/`:

```bash
pnpm run format:check && pnpm run lint && npx tsc --noEmit && pnpm run test && pnpm run build
```

- Feature behavior is documented in `features/<name>/docs/<feature>.md`; app-wide behavior in `client/docs/`. Update the document in the same branch, in its own commit, describing the code as it is now.
- If the dev server shows unstyled new classes or old routes after large moves, restart `pnpm run dev` (delete `client/.next/` if it persists).
