# Mixed and secondary occupancy

How a building with more than one occupation is classified (IN 1 parte 2, arts. 11 and 12). For developers wiring it into the screen and for whoever reviews the readings with Moura. It describes the code as it is now; read `rule-engine.md` first.

## What this is

`classifyMixed` (`lib/mixed-occupancy.ts`) runs the single-occupation rules once per part of the building and joins the results as the articles say. It adds no table and no rule: each part is classified by its own tables, and only the facts they read (area, height, storeys, fire load) change from part to part. It is a pure function, called through `classifyWithParts` (`lib/mixed-parts.ts`): when the user says the property mixes uses and they are not all subsidiary (`single_use` false, `only_subsidiary` false), the chat records the occupations with the `record_parts` tool and the panel shows them under "Ocupações da edificação". Until there are two occupations the panel asks for them instead of ending in `GUARD-mixed-use`.

Invariants:

- Each part is evaluated with `single_block` and `single_use` true, so its own tables apply and the mixed-use guard does not.
- A requirement for the whole building is never narrowed by another part.
- The caller decides whether the building is mixed (art. 11) or has secondary occupations (art. 12), using the criteria of IN 1 parte 1, art. 4º; the function does not.

## Surface

```ts
classifyMixed({ kind: "mixed" | "secondary", base, parts }, analysisDate, rules?)
```

| Input        | Meaning                                                                                                          |
| ------------ | ---------------------------------------------------------------------------------------------------------------- |
| `base`       | Facts that do not depend on the occupation (risks, fire load class, basement…)                                   |
| `parts[]`    | Predominant occupation first: `division`, `area_m2`, `top_height_m`, `storeys`, `separation`, `fire_load_class?` |
| `separation` | `isolated`, `compartmented` or `open` (not isolated and not compartmented)                                       |

The result has `systems` (id, status, `vital`, the divisions that require it, the scopes), `analyses` (specific analyses any part ended in), `notes` (what the norm adds and the code does not apply) and the evaluation of each part.

## Rules and behavior

- **Art. 11, I (isolated).** An isolated part is evaluated alone, with its own area and height.
- **Art. 11, II (open).** The areas of the non-isolated parts are added, and every part is evaluated with the sum and the height of the building (the highest last floor). The systems are the union: a system required by any part is required.
- **Art. 11, III (compartmented).** The areas are still added, but each part uses the height of its own last floor. The reductions of III, a and b let some systems be sized by the part itself: on a single storey, sprinklers, smoke control and horizontal compartmentation; on more storeys, horizontal compartmentation, smoke control, the emergency elevator below 21 m and the sprinklers of residential areas (A divisions). For those systems the summed run does not decide; the part's own run does.
- **Art. 12 (secondary).** The predominant occupation is evaluated for the whole building (total area, highest floor). Each secondary occupation is evaluated with its own area and height, and what it requires is limited to its area: the scope reads "somente na área da ocupação secundária <divisão>".
- **Art. 12, § 1º (secondary, compartmented).** When any secondary occupation is compartmented, the reductions of art. 11, III apply: the systems that art. 11 lets a compartmented part size by itself (horizontal compartmentation, smoke control, sprinklers on a single storey, and so on) are decided for the predominant occupation by its own area and height, not the building's.
- **Art. 11, IV (towers over a podium).** A part with `role: "podium"` is the lower floors that join the towers, and each `role: "tower"` is isolated from the others. For each tower the area is the tower's plus the podium's, the height is the tower's, and it owes the systems of its own occupation and of the podium's. A tower needs a podium: `pickParts` drops the list otherwise, and `classifyMixed` throws. The result carries a note saying how the areas were counted.
- **Notes.** The result always repeats the garage rule (arts. 10, § 1º, and 12, § 2º), and, when vertical compartmentation is required in a building with more than one open part, the rule of art. 11, parágrafo único.

## The screen's view

`classifyMixedBuilding` (`lib/mixed-classification.ts`) shapes the `classifyMixed` result like a single-occupation `Classification`, so the same panel can show it. Each system keeps the single-occupation outcome that decided it (its rules, substitutions and what is missing, through `systemView` in `lib/system-view.ts`) with the status, `vital` and scopes of the join. The questions are the ones the rules of any part still need; area, height, storeys and division come from the parts and are never asked. A part that ends in a specific analysis replaces the list, as in the single case, and the result is always provisional.

## The chat and the occupations

`record_parts` takes the whole list (2 to 6 occupations, the predominant first) and each call replaces the previous one, so a replayed chat ends with the same list. The client sends the list in the request body as `parts`, and `buildInstructions` writes it into the prompt (the model sees only the last messages). Mixed or secondary is decided by `mixedKind` in code, following IN 1 parte 1, art. 4º, IV: mixed when the secondary areas are more than 10% of the building, or when a secondary occupation takes 90% or more of one floor (the optional `largest_floor_share_pct` of that part); secondary otherwise. The third criterion of the definition, a subsidiary store above 1,000 m², is the `only_subsidiary` question, which sends the property to the mixed path when answered false. The reading is provisional until Moura confirms it. The list is kept only in the `useClassification` hook, like the answers.

## What this does NOT do

- **It does not replicate vertical compartmentation** in the lower floors (art. 11, parágrafo único); it only reminds.
- **It does not size an F subsidiary occupation above 100 people by its own group** (art. 10, § 4º): the panel only states the exception, since the classification of a subsidiary occupation has no list of occupations to run.
- **The floor share is only as good as what is told.** `largest_floor_share_pct` is optional and nobody computes it from plans: without it `mixedKind` falls back to the 10% share.
- **The panel does not edit the occupations**: they are recorded by the chat.
- **It does not approve a reading.** The readings of the reductions (which systems are autonomous) and of the height used when parts are open are open until a person confirms them with Moura.
