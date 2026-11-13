# Grupo D rules

How the rule set for Grupo D (serviços profissionais: D-1 a D-4) is built and how it differs from Grupo C. For developers adding other groups and for whoever reviews the readings with Moura. It describes the code as it is now; read `group-c-rules.md` first, because Grupo D reuses its engine, facts, regime, guards and risk rules.

## What this is

`GROUP_D_RULES` (`lib/rulesets/group-d.ts`) compiles two tables of IN 1 parte 2 the same way as Grupo C: Tabela 2, column "A-2, A-3, D, E e G" (area ≤ 750 m² and height ≤ 12 m) and Tabela 6 (area ≥ 750 m² or height ≥ 12 m, one column per height class). It adds the three rows of Quadro 2 for D to the risk III rules. `ALL_RULES` (`all-rules.ts`) is the Grupo C rules, which also hold what every covered group shares, plus those of Grupo D and Grupo E. `classify` runs `ALL_RULES`.

Invariants (as for Grupo C):

- **Every rule is `provisional`.** `compileTable` throws when a cell cites a note without a reading.
- **Outside its scope the rule set lists nothing.** One block and one use are required; several blocks, mixed use and exactly 750 m² or 12 m return a specific analysis.

`docs/group-d-review-sheet.md` is generated from the code (each note as printed, how it is read, its limits and the open questions for Moura), and a test keeps it equal to the code's output.

## Surface

| Export                             | File               | Contract                                                    |
| ---------------------------------- | ------------------ | ----------------------------------------------------------- |
| `GROUP_D_RULES`                    | `group-d.ts`       | Tabela 2 (column D), Tabela 6 and the Quadro 2 rows of D    |
| `TABLE_2_D_SPEC`, `TABLE_6_SPEC`   | `group-d.ts`       | The columns, base condition and note readings of each table |
| `TABLE_2_D_NOTES`, `TABLE_6_NOTES` | `group-d-notes.ts` | The reading of each note and its questions                  |
| `ALL_RULES`                        | `all-rules.ts`     | Everything loaded; the default of `classify`                |
| `renderGroupDReviewSheet()`        | `review-sheet.ts`  | The Portuguese review sheet for Grupo D                     |

## Rules and behavior

- **Facts.** The same as Grupo C, except that `storage_over_3_5m` is not read: that rule is IN 3, art. 8 and belongs to Grupo C, so a Grupo D building is never asked about storage and an answer to it does not stop the result.
- **Tabela 2, column D.** Notes 2 (area ≥ 200 m²) and 6 (hydraulic system from 4 storeys) read as for Grupo C. Note 1 exempts A-1, A-2 and J-1 from brigades; Grupo D is not in the list, so the brigade is required.
- **Tabela 6.** Ten notes: sprinklers from 45 m (2), emergency elevator from 60 m (8), smoke control from 90 m (7), and detection limited to the rooms of note 10 (storage above 300 MJ/m² and any room above 1.200 MJ/m²) from 23 m. Notes 3, 4, 5, 6 and 9 are substitutions, shown and never applied; the systems of a substitution replace together.
- **Risk.** Quadro 2, "D, Todas": height ≤ 6 m with area ≤ 5.000 m², 6 to 12 m with ≤ 3.000 m², 12 to 21 m with ≤ 2.000 m², all with the same height rule as for the systems (single-storey is 0). Risk V, I, II and IV are the shared rules.
- **The table hint** reads "Tabela 6, coluna …" for Grupo D and "Tabela 5, coluna …" for Grupo C.

## What this does NOT do

- **It covers only D-1 to D-4.** Another division gets `GUARD-not-covered`.
- **It does not size anything.** Which systems, not how many.
- **It does nothing for existing buildings (IN 5).**
- **It does not approve a reading.** The questions in the review sheet are open until a person answers them.
- **It does not split D-1 to D-4.** The tables list them together, and the rules do not tell them apart.

## Gotchas

- A Grupo D building shows "Tabela 6" but the Grupo C review sheet does not mention it → the groups have separate sheets → open `group-d-review-sheet.md`.
- A rule of the shared set mentions Grupo C in its name (`GUARD-storage-over-3-5m`) but applies to others → only the storage guard is Grupo C only; the others test `COVERED_DIVISIONS` → add a new group to `COVERED_DIVISIONS` in `group-c-conditions.ts` and to `LARGE_TABLE` in `classify.ts`.
- The review sheet test fails after a change to a rule or a question → the sheets are generated → run `UPDATE_REVIEW_SHEET=1 pnpm exec vitest run features/classification/lib/rulesets/review-sheet` and review the diff.
