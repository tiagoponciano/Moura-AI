# Building classification

How the Classificação module (`/classification`) works now: four key questions about a building, a deterministic rule set that turns the answers into required fire protection systems, and a chat that extracts the answers from free text. For developers replacing the provisional rules or extending the questions.

## What this is

The user describes a building in the chat or types the answers in the form. The page evaluates every rule in `PROVISIONAL_RULES` against the answers and lists each system as required, not required, or waiting for an answer, with the checks to verify for each required one.

Invariants:

- The LLM never decides requirements. It only extracts the four answers through the `record_building` tool; `evaluateBuilding` decides.
- **The rule set is provisional.** Its thresholds are placeholders, not taken from the CBMSC Instruções Normativas, and the page says so in a banner. Real criteria (IN 1 classification tables, first layer of the checklist) are expected from Moura.
- Answers live only in the `useClassification` hook and are never saved; reloading clears them. The conversation is saved when chat history is available (`client/docs/chat-history.md`), and reopening it restores the answers the tool recorded.

## Surface

### HTTP

| Method | Path                       | Caller           | Returns                                                                                                                                                                                                                                                                          |
| ------ | -------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST` | `/api/classification/chat` | `Chat` component | AI SDK UI message stream (SSE). `500` with a Portuguese "Nenhum modelo de IA configurado…" message when no model is configured on `/admin` (see `client/docs/llm-configuration.md`); `400`/`413`/`429` from the request checks and quota in `client/docs/chat-request-limits.md` |

Requires a signed-in, approved user (`client/docs/authentication.md`); without Supabase it answers 503. Body: `{ id, trigger, messages }` as sent by the AI SDK transport. `id` (the chat's UUID) and `messages` are read; when history is available the chat is saved with `module: "classification"` and `context: {}` once the response finishes.

### Library (`client/features/classification/lib/`)

| Export                 | Signature                            | Contract                                                           |
| ---------------------- | ------------------------------------ | ------------------------------------------------------------------ |
| `RECORD_BUILDING_TOOL` | `"record_building"`                  | Tool name shared by the route and the hook                         |
| `OCCUPANCIES`          | `{ id, label }[]`                    | The nine occupancy ids and their Portuguese labels                 |
| `pickBuildingAnswers`  | `(output: unknown) => Building`      | Maps snake_case tool output to `Building`, dropping invalid values |
| `PROVISIONAL_RULES`    | `SystemRule[]`                       | The rule set used by the page; order is display order              |
| `evaluateRule`         | `(rule, building) => Requirement`    | See resolution order below                                         |
| `evaluateBuilding`     | `(rules, building) => Requirement[]` | One requirement per rule, same order                               |

### Feature layout

| File                                      | Role                                                                   |
| ----------------------------------------- | ---------------------------------------------------------------------- |
| `index.ts` / `server/index.ts`            | Public entries: `ClassificationWorkspace` / `handleClassificationChat` |
| `server/instructions.ts`                  | System prompt (English; replies in Brazilian Portuguese)               |
| `server/chat-handler.ts`                  | Model call and `record_building` tool                                  |
| `hooks/use-classification.ts`             | Answers state, tool merge, memoized requirements                       |
| `components/classification-workspace.tsx` | Layout: notice, form and requirements on the left, chat on the right   |
| `components/building-form.tsx`            | The four inputs and "Limpar"                                           |
| `components/requirements-list.tsx`        | Groups by status                                                       |
| `components/requirement-card.tsx`         | One system with reason or missing answers, and its checks              |
| `components/provisional-notice.tsx`       | "Regras provisórias" banner                                            |

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
- Form: numbers that are empty, non-numeric, zero or negative become `undefined`; the floor count is truncated to an integer. "Limpar" clears all answers but not the chat.
- Requirements are recomputed on every change.

### Display

Required and needs-info systems render as cards (`Por quê: …` / `Depende de: …`); checks are shown only for required systems. Not-required systems are listed by name in one line.

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
