# Grupo F rules

How the rule set for Grupo F (reunião de público: F-1 a F-6 e F-8 a F-11) is built and how it differs from the other covered groups. For developers adding other groups and for whoever reviews the readings with Moura. It describes the code as it is now; read `group-c-rules.md` first, because Grupo F reuses its engine, facts, regime, guards and risk rules.

## What this is

`GROUP_F_RULES` (`lib/rulesets/group-f.ts`) compiles **three columns of Tabela 2** (F-1 to F-6, F-8 and F-10; F-9; F-11) for area ≤ 750 m² and height ≤ 12 m, and **five tables by height** for area ≥ 750 m² or height ≥ 12 m: Tabela 8 (F-1, F-2), 9 (F-3, F-9), 10 (F-5, F-6, F-8, F-10), 11 (F-4) and 12 (F-11). Risk III comes from Quadro 3, not Quadro 2. `classify` names the table from the division.

Invariants (as for the other groups): every rule is `provisional`; a cell with an uncoded note throws at compile time; outside the scope (several blocks, mixed or secondary use, exactly 750 m² or 12 m, a division without rules) the result is a specific analysis.

`docs/group-f-review-sheet.md` is generated from the code and kept equal to it by a test; it prints the three Tabela 2 columns side by side.

## Surface

| Export                                                                                          | File               | Contract                                                       |
| ----------------------------------------------------------------------------------------------- | ------------------ | -------------------------------------------------------------- |
| `GROUP_F_RULES`                                                                                 | `group-f.ts`       | Tabela 2 (three columns), Tabelas 8 to 12 and the Quadro 3 row |
| `TABLE_2_F_MAIN_SPEC`, `TABLE_2_F9_SPEC`, `TABLE_2_F11_SPEC`, `TABLE_8_SPEC` to `TABLE_12_SPEC` | `group-f.ts`       | The columns, base condition and note readings of each table    |
| `TABLE_2_F_NOTES`, `TABLE_8_NOTES` to `TABLE_12_NOTES`                                          | `group-f-notes.ts` | The reading of each note and its questions                     |
| `renderGroupFReviewSheet()`                                                                     | `review-sheet.ts`  | The Portuguese review sheet for Grupo F                        |

## Rules and behavior

- **New facts** (all allow "não sei"): `capacity_people` (lotação, in people), `ends_by_18h` (operates only until 18:00) and `windowless` (no windows). They are asked only when a rule that reads them is open.
- **Capacity thresholds.** Tabela 2: 50 people or more than one storey (lighting, signage; note 7), 100 (finishing materials; note 3), 250 (low voltage for the main column; note 10), 500 with no windows (smoke control; note 4). Tabelas 8 to 12: 100, 1.000 (plan), 2.000 (smoke control, F-5, F-6, F-10 and Tabela 11 plan), 3.000 (F-11 sprinklers) and 500 (F-11 plan).
- **Height thresholds.** The elevator from 60 m (note 11 of Tabela 8 and note 6 of Tabela 12), or from 40 m (Tabelas 9, 10 and 11, and note 9 of Tabela 12). Smoke control of F-1 from 90 m and of F-2 above 12 m (Tabela 8, note 7). Sprinklers of F-1 from 30 m (Tabela 8, note 3).
- **Exemption (note 12 of Tabela 8, note 8 of Tabela 10).** Signage (Tabela 8) and lighting (Tabela 10) are dispensed below 200 people when the venue closes by 18:00.
- **Multi-reference cells.** `x⁴⁻⁵` (Tabela 8), `x⁷⁻¹²` (Tabela 10) and `x⁵⁻⁶` (Tabela 12) are read as two notes each; the sheet asks Moura to confirm.
- **Risk.** Quadro 3: any F division with a capacity of 200 people or fewer is risk III when it is not II; above that the cascade ends at IV. Risk V, I, II and IV are the shared rules.
- **Label footnotes.** A row label may carry a superscript (Tabela 8, "Detecção automática de incêndio¹"); `systemIdFromLabel` ignores a trailing superscript.

## What this does NOT do

- **It covers F-1 to F-6 and F-8 to F-11.** Another division gets `GUARD-not-covered`.
- **It uses one capacity for the whole property.** Notes that say "locais com público" are read on the total capacity.
- **It does not evaluate the salão de festas dispensations** (Tabela 10, notes 11 and 12): they are observations.
- **It does not size anything.** Which systems, not how many.
- **It does nothing for existing buildings (IN 5).**
- **It does not approve a reading.** The questions in the review sheet are open until a person answers them.

## Gotchas

- A division shows the wrong table → `LARGE_TABLE` in `classify.ts` maps each division to its table.
- A test that needs a division outside the covered groups → use M-1 or another uncovered division, not an F one.
- A rule stays "needs info" → it waits for the capacity or the 18h answer.
- The review sheet test fails after a change to a rule or a question → run `UPDATE_REVIEW_SHEET=1 pnpm exec vitest run features/classification/lib/rulesets/review-sheet` and review the diff.
