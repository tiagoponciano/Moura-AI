# Building classification

How the Classificação module (`/classification`) works now: a chat that asks the questions a building needs, a deterministic engine that turns the answers into the required fire protection systems with the printed source of each, and a panel that shows both. For developers extending the questions or the rule sets. The engine is in `rule-engine.md`, the rules in `group-c-rules.md`.

## What this is

The user describes a commercial building in the chat, or types the answers in the side panel. After every change the page runs the Grupo C rules over the answers and lists each system as required, not required or waiting for an answer; for a required one it shows where in IN 1 parte 2 it comes from. A case the tables do not settle (exactly 750 m² or 12 m, several blocks, mixed use, a division outside Grupo C…) shows its reason instead of a list. The assistant finds the activity in IN 3, Annex A and asks the user to confirm it, which sets the division and the fire load; then it asks one question at a time, taken from what the engine could not settle.

Invariants:

- **The model never decides requirements.** It records answers through `record_answers`; `classify` decides. The prompt carries no norm text and forbids stating requirements.
- **Every result is provisional.** The rules are read from IN 1 parte 2 and have not been approved by Moura; the panel footer says so.
- **The chat and the panel share one set of answers.** Each chat request carries the answers the panel holds, so the assistant does not ask for what was typed.
- Answers live only in the `useClassification` hook and are never saved; reloading clears them. The conversation is saved when chat history is available (`client/docs/chat-history.md`), and reopening it restores the answers its `record_answers` results recorded.

## Surface

### HTTP

| Method | Path                       | Caller           | Returns                                                                                                                                                                                                                                                                          |
| ------ | -------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST` | `/api/classification/chat` | `Chat` component | AI SDK UI message stream (SSE). `500` with a Portuguese "Nenhum modelo de IA configurado…" message when no model is configured on `/admin` (see `client/docs/llm-configuration.md`); `400`/`413`/`429` from the request checks and quota in `client/docs/chat-request-limits.md` |

Requires a signed-in, approved user (`client/docs/authentication.md`); without Supabase it answers 503. Body: `{ id, trigger, messages, facts? }`. `facts` is the panel's answers; `pickFacts` keeps the ones the registry accepts and drops the rest silently. When history is available the chat is saved with `module: "classification"` and `context: {}` once the response finishes.

### Library (`client/features/classification/lib/`)

| Export                                                | File           | Contract                                                                                                |
| ----------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------- |
| `RECORD_ANSWERS_TOOL`                                 | `questions.ts` | `"record_answers"`, shared by the route and the hook                                                    |
| `QUESTIONS`, `ASKABLE_QUESTIONS`, `questionFor(fact)` | `questions.ts` | The registry in the order the assistant asks; `ASKABLE_QUESTIONS` leaves out `fire_load_mj_m2`          |
| `pickAnswers(output)`                                 | `answers.ts`   | `{ values, unknown }` from a tool output, keeping only what the registry accepts                        |
| `applyAnswers(facts, picked)`                         | `answers.ts`   | Merges picked answers over the facts; a "não sei" becomes `null`                                        |
| `applyEdit(facts, fact, value)`                       | `answers.ts`   | A value typed in the panel, checked like a tool answer; an invalid or empty one clears the fact         |
| `pickFacts(raw)`                                      | `answers.ts`   | The panel's facts sent with a chat request, validated                                                   |
| `nextAsk(questions)`                                  | `questions.ts` | The question to ask now and the facts it covers; one combined question for the open scope confirmations |
| `classify(answers, analysisDate, rules?)`             | `classify.ts`  | The `Classification` shown on screen; `rules` defaults to `GROUP_C_RULES`                               |
| `analysisDate(now?)`                                  | `today.ts`     | `YYYY-MM-DD` in `America/Sao_Paulo`                                                                     |

Server (`server/`): `recordAnswersInput` (zod, generated from the registry), `recordAnswers(input, state, date)`, `searchActivityInput` and `searchActivity(input)` (the `search_activity` tool, see `activity-catalog.md`), `buildInstructions(state, date)` and `handleClassificationChat`. `lib/catalog/activities.ts` holds the activity catalog.

### Feature layout

| File                                                      | Role                                                                                                 |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `index.ts` / `server/index.ts`                            | Public entries: `ClassificationWorkspace` / `handleClassificationChat`                               |
| `server/instructions.ts`                                  | System prompt (English; replies in Brazilian Portuguese) with the recorded answers and next question |
| `server/record-answers.ts`                                | The tool's input schema and what it returns                                                          |
| `server/chat-handler.ts`                                  | Model call and the `record_answers` tool                                                             |
| `lib/engine/`, `lib/rulesets/`                            | The rule engine and the Grupo C rules                                                                |
| `lib/questions.ts`, `answers.ts`, `classify.ts`           | The registry, answer validation and the result shaped for the screen                                 |
| `hooks/use-classification.ts`                             | Answers, their sources and the classification                                                        |
| `components/classification-workspace.tsx`                 | Layout: chat edge to edge, 360px panel on the right, tabs below `lg`                                 |
| `components/classification-panel.tsx`                     | Panel: form, next question, analysis notice, systems, provisional notice and "Limpar respostas"      |
| `components/building-form.tsx`                            | Header, progress bar and one row per question                                                        |
| `components/next-questions.tsx`                           | The next question and what waits for a professional                                                  |
| `components/analysis-notice.tsx`                          | The reason a case needs a specific analysis                                                          |
| `components/requirements-list.tsx`, `requirement-row.tsx` | Summary bar, status groups and one system per row                                                    |
| `components/provisional-notice.tsx`                       | "Regras provisórias" note in the panel footer                                                        |

`app/(app)/classification/page.tsx` renders only `ClassificationWorkspace` in a full-height column with no padding and no `PageHeader`, as Documentos does. The panel reuses app-wide pieces shared with Documentos: `WorkspaceTabs` (`components/shared/workspace-tabs.tsx`), `SourceTagBadge` (`components/shared/source-tag-badge.tsx`) and `recordSources` / `sourceTag` (`lib/field-sources.ts`).

## Data shapes

Answers are engine facts (`Record<fact, number | string | boolean | null | undefined>`): `undefined` is not answered yet, `null` is "não sei". The facts and their units are in `group-c-rules.md`; `activity` (the id of a catalog activity) is the tenth and is not asked directly, and `division` accepts the 63 divisions of IN 1 parte 2, Tabela 1, each labelled with the norm's description, and `other`; `QUESTIONS` holds, per fact, its panel label, the Portuguese question, the English description given to the model, and whether "não sei" is allowed.

`record_answers` input (all fields optional; zod enforces positive numbers, an integer `storeys` and the listed option values):

```json
{
  "division": "C-2",
  "area_m2": 3200,
  "storeys": 2,
  "height_m": 8,
  "fire_load_class": "high",
  "unknown": ["single_use"]
}
```

`unknown` lists facts the user does not know; only facts that allow "não sei" are accepted. What the tool returns: `answers` (the validated values), `unknown` and `fields` (the fact ids the chat's status line lists as "Campos atualizados") for the client, and `status` and `next` (`{ facts, ask }`, at most one, with the Portuguese question) for the model.

`Classification` (what `classify` returns):

| Field             | Meaning                                                                                                                                                                                                      |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `status`          | `analysis` when a rule stops at a specific analysis; `pending` when a question is unanswered or answered "não sei"; `complete` otherwise                                                                     |
| `analyses`        | `{ reason, locator, quote? }` per specific analysis, in Portuguese                                                                                                                                           |
| `table`           | Which table and column applied, once known, e.g. `Tabela 5, coluna 6 < H ≤ 12`                                                                                                                               |
| `risk`            | `decided` with `level`, the `process` the norm describes and the `reason` (source); `pending` while answers are missing; `not_covered` outside Grupo C. Absent while a specific analysis replaces the result |
| `groups`          | `required`, `needsInfo` and `notRequired`, each a list of `SystemView`; all three are empty while `status` is `analysis`                                                                                     |
| `derived`         | `{ label, value, source }` for what the chosen activity set (division, fire load), with `IN 3, Anexo A · <division> <destination>` as the source                                                             |
| `conflicts`       | Warnings when the activity points one way and an answer another; the answer wins                                                                                                                             |
| `nextQuestions`   | Askable questions the engine still needs, in registry order                                                                                                                                                  |
| `next`            | What the assistant asks now: `{ ask, facts }`. While two or more scope confirmations are open it is one question that covers them all                                                                        |
| `declaredUnknown` | Askable questions answered "não sei" that the engine needs                                                                                                                                                   |
| `progress`        | `{ answered, total }`: askable facts with an answer (including "não sei"), and that plus `nextQuestions`                                                                                                     |
| `provisional`     | `true` while any rule that took part is not approved                                                                                                                                                         |

`SystemView`: `id`, `label`, `status`, `vital`, `partial`, `scopes`, `substitutions` (`by`, `alreadyRequired`, `note?`, as system names), `reasons` (`locator`, `quote?` of the cells and notes behind a required system, empty otherwise), `notes` (observations that do not change the requirement) and `missing` (labels of the answers that would settle a pending one). Systems are ordered as in the system catalog.

## Rules and behavior

- **Activity.** The assistant calls `search_activity` with the user's words, shows the options and records the confirmed id as `activity`; `classify` then fills the division and the fire load unless the user already gave them. A description the annex does not list is recorded as division `other`.
- **Chat.** On each `record_answers` result, `pickAnswers` keeps valid values and `applyAnswers` merges them over the current answers; facts the user listed in `unknown` become `null`. Manual edits to other fields are kept. Reopening a saved chat from "Histórico" replays its `record_answers` results the same way, over whatever answers are on screen.
- **Panel edits.** `applyEdit` validates like the tool: an empty, non-numeric, zero, negative or fractional-`storeys` value clears the fact; "Não sei" is offered only where the registry allows it.
- **Sources.** Every answer kept from a `record_answers` result, including a "não sei", is marked `assistant`; any edit in the panel marks that field `user`, even when the typed value is invalid and clears the fact. The row shows "IA" or "editado" from `sourceTag`, and nothing while the answer is empty. A later tool result marks it `assistant` again.
- **The prompt.** `buildInstructions` lists every fact with its description, the answers already recorded (the panel's, with "não sei" for `null`) and the next question, which is `next.ask`. It tells the model to ask one question at a time, to record a plain "sim" to a combined question as every point being true of the building (`single_block` true, `single_use` true, `storage_over_3_5m` false) and a denial as that one point only, to put what the user does not know in `unknown`, to map the activity to C-1, C-2, C-3 or `other` and ask when it fits more than one, never to state requirements or cite norms, and to answer in Brazilian Portuguese.
- **The analysis date** is today in `America/Sao_Paulo`: on the server per request, in the browser once when the page mounts.
- **Reset.** "Limpar respostas" clears all answers and their sources but not the chat; it is disabled while `progress.answered` is 0.
- **Questions.** `nextQuestions` is what the engine reported unanswered, in registry order. The three scope confirmations (one block, one use, no storage above 3,5 m) carry a `scope` in the registry; while two or more are open they are asked as one sentence built from their clauses. A single-storey building is never asked its height, and a Grupo C building outside the fire-load cases is never asked its fire load, because the rules do not need them.

### Display

From `lg` (1024px) up, the chat fills the left and a 360px panel (`bg-card`, left border) sits on the right; the panel body scrolls and its footer stays fixed. Below `lg`, `WorkspaceTabs` shows one pane at a time: "Conversa" (initial) or "Classificação <answered>/<total>"; tool results update the panel while it is hidden.

Panel, top to bottom:

1. **Dados da edificação**: `<answered> de <total> respondidas` and one bar segment per question, the first `<answered>` in `success`. Then one row per entry of `QUESTIONS` (the activity first, read-only with a "limpar" link, and including the optional fire load in MJ/m²): status dot (`success` when answered), label, optional source tag and a borderless control — a number input, or a select with "Sim"/"Não" or the options, plus "Não sei" where allowed.
2. **Da atividade escolhida**: what `derived` holds with its source, and the warnings of `conflicts`. Hidden when both are empty.
3. **Próxima pergunta**: `next.ask`, the wording the assistant uses, and "Depois: …" with the labels of the `nextQuestions` it does not cover. A second paragraph, "Pendente de profissional habilitado", lists `declaredUnknown`. Hidden while `status` is `analysis` or nothing is pending.
4. **Caso para análise específica**: each analysis' reason and its source, only while `status` is `analysis`.
5. **Nível de risco**: "Risco <level>", what the norm says about the process at that level and the source of the decision; "Depende das respostas que faltam." while pending; hidden when it is not covered or a specific analysis replaces the result.
6. **Sistemas preventivos**: while nothing is answered, a sentence explaining what the panel will show. Otherwise `<required> exigidos · <pending> pendentes`, the line "Aplicando: <table>" once known, a bar segment per system (required `primary`, pending `input`, not required `muted`) and up to three groups:

| Group                 | Row                                                                                                                                                                                                                |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Exigidos              | `primary` dot, name, "vital" when vital, and the first source or "Exigido em parte do imóvel"; a `<details>` with each source and its printed text, "Limitado a:", "A norma permite substituir por:" and the notes |
| Dependem de respostas | Hollow dot, name, "Falta" and one pill per missing answer. When two or more systems are pending, what all of them wait for is said once above them ("Todos aguardam: …") and left out of the rows                  |
| Não exigidos          | `input` dot, name in muted text                                                                                                                                                                                    |

7. **Footer**: the provisional notice (`accent`) and the outline "Limpar respostas" button.

## What this does NOT do

- **Only Grupo C and Grupo D.** Another division gets a specific analysis. Nothing for existing buildings (IN 5).
- **No sizing.** It says which systems are required, not how many extinguishers or how large a reservoir; that is in the IN of each system.
- **No approved rules.** The result stays provisional until a person confirms the readings in `group-c-review-sheet.md`.
- **No export and no link to Documentos or Plantas.** Answers and results are not saved; only the conversation is.
- **Height is never derived from storeys (or the reverse),** by the model or the code.
- **The model does not see the result.** It sees the answers, the next question and `status`; it cannot explain why a system is required, which is why the panel shows the source.
- **Chats saved with the earlier `record_building` tool do not restore answers.** The hook reads only `record_answers` results.
- **The history is still sent in full with every message.** The prompt carries the current answers so nothing is re-asked, but the conversation is not trimmed.

## Gotchas

- **Every system stays "Depende de…"** → the answers did not reach the hook: the tool output had invalid values (a division outside the options, `storeys: 1.5`), which `pickAnswers` drops silently → check the registry options and the model's output in the chat.
- **The assistant asks something already typed in the panel** → the panel's facts were not in the request, or `pickFacts` dropped them as invalid → check the value against the registry.
- **A Grupo C shop shows no systems and a reason** → the case is a boundary or out of scope (exactly 750 m² or 12 m, several blocks, mixed use, storage above 3,5 m, another division) → this is the intended answer, not an error.
- **The height of a single-storey building is ignored** → art. 8, inciso V counts it as 0 → set `storeys` to 1; the rules do not read `height_m` then.
- **Adding a question or a rule set** → add the fact to `QUESTIONS` first; `questions.test.ts` fails when a rule reads a fact that has no question or an option the registry lacks.

## Setup

Same as Documentos: Supabase with `SUPABASE_SERVICE_ROLE_KEY`, and a provider, model and key saved on `/admin` (see `client/docs/llm-configuration.md`). The form and the rules work without them; only the chat needs them.
