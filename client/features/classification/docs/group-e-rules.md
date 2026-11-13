# Grupo E rules

How the rule set for Grupo E (educacional: E-1 a E-6) is built and how it differs from Grupos C and D. For developers adding other groups and for whoever reviews the readings with Moura. It describes the code as it is now; read `group-c-rules.md` and `group-d-rules.md` first, because Grupo E reuses their engine, facts, regime, guards and risk rules.

## What this is

`GROUP_E_RULES` (`lib/rulesets/group-e.ts`) compiles Tabela 2, column "A-2, A-3, D, E e G" (area ≤ 750 m² and height ≤ 12 m) and Tabela 7 (area ≥ 750 m² or height ≥ 12 m, one column per height class) like the other groups, and adds the two rows of Quadro 2 for E to the risk III rules. `ALL_RULES` includes them; `classify` names the table "Tabela 7, coluna …" for this group.

Invariants (as for the other groups): every rule is `provisional`; a cell with an uncoded note throws at compile time; outside the scope (several blocks, mixed or secondary use, exactly 750 m² or 12 m, a division without rules) the result is a specific analysis.

`docs/group-e-review-sheet.md` is generated from the code and kept equal to it by a test.

## Surface

| Export                             | File               | Contract                                                    |
| ---------------------------------- | ------------------ | ----------------------------------------------------------- |
| `GROUP_E_RULES`                    | `group-e.ts`       | Tabela 2 (column E), Tabela 7 and the Quadro 2 rows of E    |
| `TABLE_2_E_SPEC`, `TABLE_7_SPEC`   | `group-e.ts`       | The columns, base condition and note readings of each table |
| `TABLE_2_E_NOTES`, `TABLE_7_NOTES` | `group-e-notes.ts` | The reading of each note and its questions                  |
| `renderGroupEReviewSheet()`        | `review-sheet.ts`  | The Portuguese review sheet for Grupo E                     |

## Rules and behavior

- **Facts.** The same as Grupo D, plus `classrooms_exit_outside`. `storage_over_3_5m` is not read.
- **Tabela 2, column E.** The same readings as Grupo D; note 1 exempts only A-1, A-2 and J-1, so the brigade is required.
- **Tabela 7.** Thirteen notes. Note 1 requires the alarm for E-1 to E-4 from 1.500 m² and for E-5 and E-6 whatever the area; note 11 requires the emergency plan only for E-5 and E-6; notes 3, 6 and 9 require sprinklers from 75 m and smoke control and the emergency elevator from 90 m; note 5 limits vertical compartmentation to facades, shafts and ducts; notes 4 and 12 are substitutions, shown and never applied.
- **Detection (notes 7 and 8).** Required above 5.000 m² for E-1 to E-4 and above 750 m² for E-5 and E-6, in the rooms of note 7 (storage above 300 MJ/m² and any room above 1.200 MJ/m²). The cells for single-storey buildings and up to 6 m cite both notes: note 8 exempts a school of up to two storeys whose classrooms mostly open outdoors, which the user answers with a yes or no. The question is asked only when that exemption can matter; from 6 m the cell cites note 7 alone.
- **Multi-reference cells.** `x⁷⁻⁸` and `x⁹ _ ¹³` are read as two notes each, because that makes every one of the 13 notes cited exactly once; the sheet asks Moura to confirm it is not a range.
- **Risk.** Quadro 2: E-1 to E-4 up to 21 m and 5.000 m²; E-5 and E-6 up to 12 m and 750 m². Risk V, I, II and IV are the shared rules.

## What this does NOT do

- **It covers only E-1 to E-6.** Another division gets `GUARD-not-covered`.
- **It does not evaluate note 13.** The exemption of the emergency elevator for an E-3 subsidiary to groups A and B needs a subsidiary occupation, which goes to a specific analysis today.
- **It does not count the area across compartmented blocks** as note 7 describes for E-1 to E-4; it uses the total area it is given.
- **It does nothing for existing buildings (IN 5).**
- **It does not approve a reading.** The questions in the review sheet are open until a person answers them.

## Gotchas

- Detection is required for a school the user says has classrooms opening outdoors → the exemption only exists in the cells up to 6 m (`x⁷⁻⁸`); from 6 m the table cites note 7 alone and the answer is ignored → this is what the table prints.
- The assistant never asks about the classrooms → the question is asked only for a school of up to two storeys whose detection depends on it → check the area and the height class.
- The review sheet test fails after a change to a rule or a question → run `UPDATE_REVIEW_SHEET=1 pnpm exec vitest run features/classification/lib/rulesets/review-sheet` and review the diff.
