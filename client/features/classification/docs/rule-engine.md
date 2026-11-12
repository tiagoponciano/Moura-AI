# Classification rule engine

How the rule engine in `features/classification/lib/engine/` evaluates a building against versioned rules. For developers writing rule sets and wiring the engine into the module. It describes the code as it is now.

## What this is

A pure, deterministic evaluator. It takes a list of `Rule`, a map of facts about a building and an analysis date, and returns the building's risk level, the required systems, why each was decided, and what is still unknown. It has no React, no Supabase and no model call, so it runs the same offline and in tests.

Invariants:

- **Three values, never two.** A condition is `true`, `false` or `unknown`. A fact that is missing or a declared "não sei" makes a comparison `unknown`; it is never read as `false`. An unknown never silently becomes "not required".
- **The engine decides only what a rule says.** Every result comes from a rule that carries its source (`doc`, `locator`, optional `quote`), a version and a status. No rule, no result.
- **Rules are data.** Thresholds live in rule objects with an explicit operator, not in code branches.

## Surface

Exports of `lib/engine/`:

| Export                                 | Signature                                       | Contract                                                                                                                                                  |
| -------------------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `evaluateCondition` (`condition.ts`)   | `(condition, facts) => { outcome, missing }`    | Three-valued evaluation; `missing` names the facts that made it unknown                                                                                   |
| `evaluateRules` (`evaluate-rules.ts`)  | `(rules, facts, analysisDate) => Evaluation`    | Runs the rules in force on `analysisDate` through the four stages                                                                                         |
| `inForce` (`evaluate-rules.ts`)        | `(rule, analysisDate) => boolean`               | Whether the rule's validity window includes the date, both ends inclusive                                                                                 |
| `lintRules` (`lint-rules.ts`)          | `(rules) => LintIssue[]`                        | Structural problems of a rule set: duplicate ids, bad validity, missing source, misplaced results, rules that compete for one slot with the same priority |
| `findDeriveOverlaps` (`lint-rules.ts`) | `(rules, samples, analysisDate) => LintIssue[]` | Derive rules for one fact that are true together on a sample                                                                                              |
| `numericThresholds` (`lint-rules.ts`)  | `(rules) => Record<fact, number[]>`             | Every number a rule compares a fact with                                                                                                                  |
| `boundarySamples` (`lint-rules.ts`)    | `(rules, step = 0.01) => Facts[]`               | One sample per combination of just below, exactly at and just above each threshold                                                                        |
| `RISK_FACT` (`evaluate-rules.ts`)      | `"risk_level"`                                  | The fact the risk stage sets, for `systems` rules to read                                                                                                 |
| Types (`types.ts`)                     | `Facts`, `Condition`, `Rule`, `Evaluation`…     | `FactValue` is `number \| string \| boolean \| null`; `null` is "não sei", an absent key is unanswered                                                    |

## Data shapes

```ts
const rule: Rule = {
  id: "example-extinguishers",
  name: "Example rule",
  version: "1",
  validFrom: "2026-01-01", // ISO date, inclusive
  validTo: undefined, // ISO date, inclusive, while in force
  stage: "systems", // "derive" | "risk" | "systems" | "overlay"
  priority: 10, // lower runs first
  when: { all: [{ fact: "area_m2", op: "gt", value: 750 }] },
  then: { require: "extinguishers", vital: true },
  source: { doc: "IN-1-P2", locator: "Tabela 5" },
  status: "provisional", // "approved" | "provisional"
};
```

Conditions: `{ fact, op: "lt" | "lte" | "gt" | "gte", value: number }`, `{ fact, op: "eq", value }`, `{ fact, op: "in", value: [...] }`, and `{ all: [...] }`, `{ any: [...] }`, `{ not: ... }`. Numbers are in the unit of the fact (the engine does not convert).

Results by stage:

| Stage     | Allowed `then`                                                                                                       |
| --------- | -------------------------------------------------------------------------------------------------------------------- |
| `derive`  | `{ set: { fact, value } }`                                                                                           |
| `risk`    | `{ set: { fact: "risk_level", value } }` or `{ specificAnalysis }`                                                   |
| `systems` | `{ require: systemId, vital?, scope? }`, `{ substitute: systemId, by: systemId[], note? }` or `{ specificAnalysis }` |
| `overlay` | `{ overlay: systemId, class: "vital" \| "indispensable" \| "adaptable" }`                                            |

`Evaluation`: `facts` (input plus derived), `risk`, `systems`, `systemsCovered`, `specificAnalyses`, `declaredUnknown`, `unanswered`, `provisional`, `trace`.

## Rules and behavior

Conditions:

| Combinator | `true` when        | `false` when        | Otherwise |
| ---------- | ------------------ | ------------------- | --------- |
| `all`      | every part is true | any part is false   | `unknown` |
| `any`      | any part is true   | every part is false | `unknown` |
| `not`      | the part is false  | the part is true    | `unknown` |

`all` is false as soon as one part is false, even if another is unknown; `any` is true as soon as one part is true. An empty `all` is true and an empty `any` is false. A leaf on a missing or `null` fact is `unknown`. Comparisons are exact: `gt` is false at the threshold and `gte` is true there.

`evaluateRules` keeps only rules in force: `validFrom <= analysisDate` and (`validTo` absent or `analysisDate <= validTo`), both ends inclusive. It then runs, in this order, with rules sorted by `priority` ascending and then `id`:

1. **`derive`.** A rule sets its fact when its condition is true. First match per fact wins, and a fact that already has a value, including `null`, is never overwritten. Derived facts feed every later stage.
2. **`risk`.** An ordered cascade. A `false` rule is skipped. The first `true` rule decides: `decided` with the level, or `specific_analysis` with its reason. If a rule is `unknown` before any rule decided, the cascade stops with `pending` (`blockedBy`, `missing`), even when a later rule would match. If no rule decides, the result is `no_rule`, never a level.
3. **`systems`.** All rules run. A system is `required` when any of its `require` rules is true (`vital` when any true rule says so, `ruleIds` lists the true ones); otherwise `needs_info` when some rule of it is unknown (`missing` names the facts); otherwise `not_required`. A `require` rule may carry a `scope` (a part of the building); `scopes` lists the scopes of the true rules and `partial` is true when every true rule has one. A true `substitute` rule adds an entry to `substitutions` of that system, with `by` (systems that replace it together; an alternative is a separate rule) and the ones of `by` that are already required (`alreadyRequired`); it is kept only for required systems and never changes a status. Systems appear in the order their ids first show up in the sorted rules. A true `specificAnalysis` rule is added to `specificAnalyses`.
4. **`overlay`.** For each true rule, the system's `overlayClass` is set only if the system is `required` and has no class yet (first by priority wins). A system that is not required is never added or labelled.

Result fields:

| Field             | Meaning                                                                                                     |
| ----------------- | ----------------------------------------------------------------------------------------------------------- |
| `systemsCovered`  | `false` when no `systems` rule was in force; an empty `systems` list then does not mean nothing is required |
| `declaredUnknown` | Facts needed by an unknown rule whose value is `null` (a "não sei")                                         |
| `unanswered`      | Facts needed by an unknown rule that are absent                                                             |
| `provisional`     | `true` when any evaluated rule has a status other than `approved`                                           |
| `trace`           | One entry per evaluated rule: id, stage, outcome, missing facts. Rules skipped by `derive` are absent       |

## What this does NOT do

- **It is not wired into the page.** `/classification` still evaluates `PROVISIONAL_RULES` with `evaluateBuilding`; nothing imports this engine yet, and no rule set is loaded from it.
- **It holds no normative values.** The engine has no thresholds, occupancy codes or system lists; they belong to rule sets.
- **It does not convert units or parse input.** Facts arrive already as numbers, strings or booleans.
- **`evaluateRules` does not validate the rule set.** `lintRules` and `findDeriveOverlaps` do, and the caller runs them; a rule without a boundary test and a stale source document are not detected by either.
- **It does not apply a substitution.** `substitutions` is information for the screen: a system the norm lets another replace stays `required`, and whether the replacement is in place is for a person to judge.
- **It cannot see an overlap that no sample reaches.** `findDeriveOverlaps` checks the samples it is given; `boundarySamples` generates the ones at every threshold, which is where two rules usually both claim a value.
- **It does not read the norm documents.** A rule's `source` is a label for people; the engine never opens it.
- **A `false` provisional rule still makes the result provisional.** `provisional` looks at every evaluated rule, not only the ones that fired, because a wrong false is as harmful as a wrong true.

## Gotchas

- A later risk rule matches but the result is `pending` → an earlier rule in the cascade is unknown (often a special-risk question not answered) → answer the fact named in `missing`.
- A `derive` rule is true but its fact keeps another value → the fact already had a value, even `null`; `derive` never overwrites an answer → clear the answer or do not derive that fact.
- `RangeError … is not YYYY-MM-DD` → the analysis date or a rule's `validFrom`/`validTo` is not an ISO date → write it as `2026-06-25`.
- `TypeError … not allowed in "<stage>"` → a rule's `then` does not belong to its stage → see the table in Data shapes.
- `TypeError Fact "x" is not a number` → a numeric operator was applied to a string or boolean fact → use `eq` or `in`, or fix the fact's type at its source.
