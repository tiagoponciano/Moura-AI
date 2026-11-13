# Grupo A rules (A-2 and A-3)

How the rule set for the residential divisions A-2 (multifamiliar vertical) and A-3 (coletiva) is built and how it differs from the other covered groups. For developers adding other groups and for whoever reviews the readings with Moura. It describes the code as it is now; read `group-c-rules.md` first, because it reuses its engine, facts, regime, guards and risk rules. A-1 (houses and horizontal condominiums) is in `group-a1-rules.md`.

## What this is

`GROUP_A_RULES` (`lib/rulesets/group-a.ts`) compiles Tabela 2, column "A-2, A-3, D, E e G" (area ≤ 750 m² and height ≤ 12 m) and the **A-2/A-3 grid of Tabela 3** (area ≥ 750 m² or height ≥ 12 m), and adds the A-2 and A-3 rows of Quadro 2 to the risk III rules. `classify` names the table "Tabela 3, coluna …".

Tabela 3 has two grids: A-1 by type of construction, and A-2/A-3 by height. The extractor numbers them as `part` 0 and 1 (see `norm-extraction.md`); the specification names `part: 1`, so the A-1 rows are compiled by `group-a1.ts`, not here. The columns split at 6, 15 and 30 m, unlike the other tables, and `classify` names them from the height (`tableThreeColumn`) instead of from the derived `height_class`.

Invariants (as for the other groups): every rule is `provisional`; a cell with an uncoded note throws at compile time; outside the scope (several blocks, mixed or secondary use, exactly 750 m² or 12 m, a division without rules) the result is a specific analysis.

`docs/group-a-review-sheet.md` is generated from the code and kept equal to it by a test.

## Surface

| Export                                 | File               | Contract                                                                |
| -------------------------------------- | ------------------ | ----------------------------------------------------------------------- |
| `GROUP_A_RULES`                        | `group-a.ts`       | Tabela 2 (column A), the A-2/A-3 grid of Tabela 3 and the Quadro 2 rows |
| `TABLE_2_A_SPEC`, `TABLE_3_A23_SPEC`   | `group-a.ts`       | The columns, part, base condition and note readings of each table       |
| `TABLE_2_A_NOTES`, `TABLE_3_A23_NOTES` | `group-a-notes.ts` | The reading of each note and its questions                              |
| `renderGroupAReviewSheet()`            | `review-sheet.ts`  | The Portuguese review sheet                                             |

## Rules and behavior

- **Facts.** The same as Grupo D. `storage_over_3_5m` is not read.
- **Brigade (note 1).** A-2 is exempt, A-3 is not, in both tables (`exempt_when`).
- **Tabela 3, A-2 and A-3.** Sprinklers from 100 m (2); elevator from 60 m (6); horizontal compartmentation above 75 m between the autonomous units, replaceable by sprinklers up to 150 m (3); vertical compartmentation limited to the atria from 15 m, replaceable by smoke control there (4), and above 30 m replaceable by detection up to 40 m (9) and by sprinklers up to 100 m (10); the emergency plan only for A-3 from 15 m (7) and above 30 m from 30 m for A-3 and 60 m for A-2 (8); smoke control above 30 m, above 90 m for A-2 and above 60 m for A-3, in atria and escape corridors (17).
- **Detection (note 5).** From 40 m, with a scope by division and height: A-2 from 40 to under 100 m in the common circulation and one point inside each flat; A-2 from 100 m also inside the flats' kitchens and sleeping rooms; A-3 in storage above 1.200 MJ/m², bedrooms and kitchens with fryers or wood or charcoal equipment.
- **Finishing materials (notes 15 and 16).** Note 15 exempts up to 12 m (`exempt_when`) and note 16 limits A-2 to the common areas; where a cell cites only note 16, there is no height exemption.
- **Risk.** Quadro 2: A-2 up to 21 m and 5.000 m²; A-3 up to 21 m and 2.500 m². Risk V, I, II and IV are the shared rules.

## What this does NOT do

- **It does not cover A-1.** The A-1 grid and notes 11 to 14 and 18 are in `group-a1-rules.md`.
- **A garage, party room or gym is asked about, not assumed.** If the user says they are only subsidiary, the rules of the A-2 or A-3 apply (art. 10); otherwise it is mixed or secondary use and goes to a specific analysis.
- **It does not evaluate the garage and car park rules of note 17;** they stay in the printed observation.
- **It does not ask whether an A-2 has detection installed,** which note 10 uses to move the compartmentation requirement to 60 m; the sentence is shown as information.
- **It does nothing for existing buildings (IN 5).**
- **It does not approve a reading.** The questions in the review sheet are open until a person answers them.

## Gotchas

- A rule of a group never decides risk III → its priority is above the risk IV rule's (90), which takes what is left → keep every Quadro 2 row below 90; a test over all rules enforces it.
- The compiler throws `Unknown system label` for a row of Tabela 3 → a label printed truncated ("…ou de área") was not in the alias list → add the alias after checking it is the same system.
- A row of the A-1 grid shows up in the A-2 sheet → the specification does not name its `part` → set `part: 1`.
- The review sheet test fails after a change to a rule or a question → run `UPDATE_REVIEW_SHEET=1 pnpm exec vitest run features/classification/lib/rulesets/review-sheet` and review the diff.
