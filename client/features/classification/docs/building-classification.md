# Building classification

How the Classificação module (`/classification`) works now: four key questions about a building, a deterministic rule set that turns the answers into required fire protection systems, and a chat that extracts the answers from free text. For developers replacing the provisional rules or extending the questions.

## What this is

The user describes a building in the chat or types the answers in the side panel. The page evaluates every rule in `PROVISIONAL_RULES` against the answers and lists each system as required, not required, or waiting for an answer, with the checks to verify for each required one.

Invariants:

- The LLM never decides requirements. It only extracts the four answers through the `record_building` tool; `evaluateBuilding` decides.
- **The rule set is provisional.** Its thresholds are placeholders, not taken from the CBMSC Instruções Normativas, and the panel footer says so. Real criteria (IN 1 classification tables, first layer of the checklist) are expected from Moura.
- Answers live only in the `useClassification` hook and are never saved; reloading clears them. The conversation is saved when chat history is available (`client/docs/chat-history.md`), and reopening it restores the answers the tool recorded.

## Surface

### HTTP

| Method | Path                       | Caller           | Returns                                                                                                                                                                                                                                                                          |
| ------ | -------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST` | `/api/classification/chat` | `Chat` component | AI SDK UI message stream (SSE). `500` with a Portuguese "Nenhum modelo de IA configurado…" message when no model is configured on `/admin` (see `client/docs/llm-configuration.md`); `400`/`413`/`429` from the request checks and quota in `client/docs/chat-request-limits.md` |

Requires a signed-in, approved user (`client/docs/authentication.md`); without Supabase it answers 503. Body: `{ id, trigger, messages }` as sent by the AI SDK transport. `id` (the chat's UUID) and `messages` are read; when history is available the chat is saved with `module: "classification"` and `context: {}` once the response finishes.

### Library (`client/features/classification/lib/`)

| Export                 | Signature                             | Contract                                                           |
| ---------------------- | ------------------------------------- | ------------------------------------------------------------------ |
| `RECORD_BUILDING_TOOL` | `"record_building"`                   | Tool name shared by the route and the hook                         |
| `OCCUPANCIES`          | `{ id, label }[]`                     | The nine occupancy ids and their Portuguese labels                 |
| `pickBuildingAnswers`  | `(output: unknown) => Building`       | Maps snake_case tool output to `Building`, dropping invalid values |
| `QUESTION_COUNT`       | `4`                                   | Number of key questions (keys of `BUILDING_FIELD_LABEL`)           |
| `countAnswers`         | `(building) => number`                | Answers that are not `undefined`                                   |
| `PROVISIONAL_RULES`    | `SystemRule[]`                        | The rule set used by the page; order is display order              |
| `evaluateRule`         | `(rule, building) => Requirement`     | See resolution order below                                         |
| `evaluateBuilding`     | `(rules, building) => Requirement[]`  | One requirement per rule, same order                               |
| `groupRequirements`    | `(requirements) => RequirementGroups` | `{ required, needsInfo, notRequired }`, each in rule order         |

### Feature layout

| File                                      | Role                                                                      |
| ----------------------------------------- | ------------------------------------------------------------------------- |
| `index.ts` / `server/index.ts`            | Public entries: `ClassificationWorkspace` / `handleClassificationChat`    |
| `server/instructions.ts`                  | System prompt (English; replies in Brazilian Portuguese)                  |
| `server/chat-handler.ts`                  | Model call and `record_building` tool                                     |
| `hooks/use-classification.ts`             | Answers, their sources, answer count and grouped requirements             |
| `components/classification-workspace.tsx` | Layout: chat edge to edge, 360px panel on the right, tabs below `lg`      |
| `components/classification-panel.tsx`     | Panel: `BuildingForm`, `RequirementsList`, notice and "Limpar respostas"  |
| `components/building-form.tsx`            | "Dados da edificação" header, progress bar and the four answer rows       |
| `components/requirements-list.tsx`        | "Sistemas preventivos" header, summary bar and the status groups          |
| `components/requirement-row.tsx`          | One system: expandable checks when required, missing answers when pending |
| `components/provisional-notice.tsx`       | "Regras provisórias" note in the panel footer                             |

`app/(app)/classification/page.tsx` renders only `ClassificationWorkspace` in a full-height column with no padding and no `PageHeader`, as Documentos does. The panel reuses app-wide pieces shared with Documentos: `WorkspaceTabs` (`components/shared/workspace-tabs.tsx`), `SourceTagBadge` (`components/shared/source-tag-badge.tsx`) and `recordSources` / `sourceTag` (`lib/field-sources.ts`).

## Data shapes

```ts
type Building = {
  areaM2?: number; // total built area, m², > 0
  heightM?: number; // building height, m, > 0
  floorCount?: number; // integer > 0
  occupancy?:
    | "residential"
    | "lodging"
    | "commercial"
    | "professional_services"
    | "education"
    | "public_assembly"
    | "health"
    | "industrial"
    | "storage";
};

type SystemRule = {
  id: string; // "hydrants"
  system: string; // "Hidrantes e mangotinhos" (shown to users)
  checks: string[]; // second layer, shown under a required system
  when: Condition[]; // required if ANY condition holds; [] = always required
};

type Condition = {
  // ALL present criteria must hold; thresholds are exclusive (>)
  minAreaM2?: number; // m²
  minHeightM?: number; // m
  minFloorCount?: number;
  occupancies?: OccupancyId[]; // building occupancy must be one of these
};

type Requirement = {
  id: string;
  system: string;
  checks: string[];
  status: "required" | "not_required" | "needs_info";
  reason?: string; // required only, Portuguese: "área acima de 750 m²"
  missing: BuildingField[]; // needs_info only: answers that could settle the rule
};
```

`record_building` tool input (all optional): `{ "area_m2": 2000, "height_m": 9, "floor_count": 1, "occupancy": "storage" }`. Zod enforces positive numbers, an integer floor count and a known occupancy id.

## Rules and behavior

### Evaluating one rule (`evaluateRule`)

1. `when` is empty → `required`, reason `vale para todas as edificações`.
2. Each criterion of each condition is `true`, `false`, or `unknown` (the answer it needs is not given). A condition is `false` if any criterion is false, else `unknown` if any is unknown, else `true`.
3. Some condition is `true` → `required`; the reason joins that condition's criteria with `e` (first matching condition wins).
4. Else some condition is `unknown` → `needs_info`; `missing` lists, once each, the unknown fields of all unknown conditions.
5. Else → `not_required`.

A condition already ruled out by a known answer does not add to `missing` (a health-only condition does not ask for area when the occupancy is commercial).

Criterion texts: `área acima de <n> m²`, `altura acima de <n> m`, `mais de <n> pavimentos`, `ocupação <labels in lower case>`. Numbers use `pt-BR` formatting (`1.500`).

### Provisional rule set

| System                    | Required when (any line)                                                                   |
| ------------------------- | ------------------------------------------------------------------------------------------ |
| Extintores de incêndio    | always                                                                                     |
| Sinalização de emergência | always                                                                                     |
| Saídas de emergência      | always                                                                                     |
| Iluminação de emergência  | area > 750 · floors > 2 · public assembly                                                  |
| Alarme de incêndio        | area > 1500 · height > 12 · (public assembly, lodging, health or education) and area > 750 |
| Hidrantes e mangotinhos   | area > 750 · height > 12                                                                   |
| SPDA                      | area > 1500 · height > 12                                                                  |
| Chuveiros automáticos     | height > 30 · (storage, industrial or commercial) and area > 5000                          |

### Answers

- Chat: on each `record_building` result, `pickBuildingAnswers` keeps valid values and shallow-merges them over the current answers (manual edits to other fields are kept). Reopening a saved chat from "Histórico" replays its `record_building` results the same way, over whatever answers are on screen.
- Form: numbers that are empty, non-numeric, zero or negative become `undefined`; the floor count is truncated to an integer. "Limpar respostas" clears all answers and their sources but not the chat; it is disabled while nothing is answered.
- Sources: every answer kept from a `record_building` result is marked `assistant`; any edit in the panel marks that field `user`, even when the typed value is invalid and becomes `undefined`. The row shows "IA" or "editado" from `sourceTag`, and nothing while the answer is empty. A later tool result for the field marks it `assistant` again.
- Requirements are recomputed on every change.

### Display

From `lg` (1024px) up, the chat fills the left and a 360px panel (`bg-card`, left border) sits on the right; the panel body scrolls and its footer stays fixed. Below `lg`, `WorkspaceTabs` shows one pane at a time: "Conversa" (initial) or "Classificação <answered>/4"; tool results update the panel while it is hidden.

Panel, top to bottom:

1. **Dados da edificação**: `<answered> de 4 respondidas` and four bar segments, the first `<answered>` in `success`. Then one row per question in the order área, altura, pavimentos, ocupação, styled as Documentos field rows: status dot (`success` when answered), label with unit, optional source tag, and a borderless control (`Não informado` placeholder). The row turns `muted` on hover and `accent` while focused.
2. **Sistemas preventivos**: `<required> exigidos · <needs_info> pendentes` and one bar segment per rule, ordered required (`primary`), needs-info (`input`), not-required (`muted`). Then up to three groups, each skipped when empty:

| Group (uppercase header) | Row                                                                                                                             |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| Exigidos                 | `primary` dot, system, `reason` with its first letter capitalized; a `<details>` that expands to the checks (closed by default) |
| Dependem de respostas    | Hollow dot, system, "Falta" followed by one pill per missing field label in lower case                                          |
| Não exigidos             | `input` dot, system name in muted text                                                                                          |

3. **Footer**: the provisional notice (`accent`) and the outline "Limpar respostas" button.

## What this does NOT do

- No real classification: no risk class, no occupancy subdivisions from IN 1, no lotação, no checks scaled by size (e.g. number of extinguishers).
- The chat does not see the form. A value typed in the form is not sent to the model, which may overwrite it with an answer from the conversation.
- No export or link to Documentos. The requirements and typed answers are not saved; only the conversation is.
- Height is never derived from floors (or the reverse), by the model or the code.

## Gotchas

- **Every system stays "Depende de…"** → the answers did not reach the hook: the tool output had invalid values (e.g. `occupancy` outside the list, `floor_count: 1.5`), which `pickBuildingAnswers` drops silently.
- **A rule fires at exactly the threshold value** → it should not: thresholds are exclusive. 750 m² does not exceed `minAreaM2: 750`.
- **Replacing the rules** → edit `PROVISIONAL_RULES` (or add a new rule set and pass it in `useClassification`). `evaluate.test.ts` uses its own rules, so it keeps passing; add tests for the real thresholds once they exist.

## Setup

Same as Documentos: Supabase with `SUPABASE_SERVICE_ROLE_KEY`, and a provider, model and key saved on `/admin` (see `client/docs/llm-configuration.md`). The form and rules work without them; only the chat needs them.
