# Grupo B rules

How the rule set for Grupo B (serviço de hospedagem: B-1 e B-2) is built and how it differs from the other covered groups. For developers adding other groups and for whoever reviews the readings with Moura. It describes the code as it is now; read `group-c-rules.md` first, because Grupo B reuses its engine, facts, regime, guards and risk rules.

## What this is

`GROUP_B_RULES` (`lib/rulesets/group-b.ts`) compiles Tabela 2, column B (area ≤ 750 m² and height ≤ 12 m) and Tabela 4 (area ≥ 750 m² or height ≥ 12 m) like the other groups, and adds the two rows of Quadro 2 for B to the risk III rules. `ALL_RULES` includes them, and `classify` names the table "Tabela 4, coluna …".

**Tabela 4 has five height columns, not six**: Térrea, H ≤ 6, 6 < H ≤ 12, 12 < H ≤ 30 and > 30. The other tables split at 23 m. `group-b.ts` builds the five columns from the shared height conditions, and `classify` names the 12 to 30 m column by the table's own heading even though the derived `height_class` is `h12_23` or `h23_30`.

Invariants (as for the other groups): every rule is `provisional`; a cell with an uncoded note throws at compile time; outside the scope (several blocks, mixed use, exactly 750 m² or 12 m, a division without rules) the result is a specific analysis.

`docs/group-b-review-sheet.md` is generated from the code and kept equal to it by a test.

## Surface

| Export                             | File               | Contract                                                    |
| ---------------------------------- | ------------------ | ----------------------------------------------------------- |
| `GROUP_B_RULES`                    | `group-b.ts`       | Tabela 2 (column B), Tabela 4 and the Quadro 2 rows of B    |
| `TABLE_2_B_SPEC`, `TABLE_4_SPEC`   | `group-b.ts`       | The columns, base condition and note readings of each table |
| `TABLE_2_B_NOTES`, `TABLE_4_NOTES` | `group-b-notes.ts` | The reading of each note and its questions                  |
| `renderGroupBReviewSheet()`        | `review-sheet.ts`  | The Portuguese review sheet for Grupo B                     |

## Rules and behavior

- **Facts.** The same as Grupo D. `storage_over_3_5m` is not read.
- **Tabela 2, column B.** The brigade has no note (no exemption to read). The low voltage installations are vital in this column, as printed (`x² (V)`), with note 2 (area ≥ 200 m²). Detection is limited to the bedrooms (note 5). The hydraulic system comes from 4 storeys (note 6).
- **Tabela 4.** Horizontal compartmentation: from 6 m only between the autonomous units (note 2), then replaceable by sprinklers (note 3), unrestricted above 30 m. Vertical compartmentation from 12 m, replaceable by smoke control and sprinklers up to 90 m (note 4). Smoke control above 30 m only in atria above 6 m and the communicating escape corridors, and from 90 m also in the circulation corridors and in rooms above 300 m² (note 5); detection in every room except bathrooms and rooms of negligible load (note 6); the emergency elevator from 60 m (note 7); sprinklers only above 30 m.
- **Risk.** Quadro 2, B-1 and B-2: up to 6 m and 5.000 m², or 6 to 12 m and 4.000 m². Risk V, I, II and IV are the shared rules.

## What this does NOT do

- **It covers only B-1 and B-2.** Another division gets `GUARD-not-covered`.
- **It treats a hotel with a restaurant, a party room or a garage as mixed use,** which goes to a specific analysis; the sheet asks if that is acceptable.
- **It does not size anything.** Which systems, not how many.
- **It does nothing for existing buildings (IN 5).**
- **It does not approve a reading.** The questions in the review sheet are open until a person answers them.

## Gotchas

- The panel says "12 < H ≤ 30" for a 25 m hotel → Tabela 4 has one column for that range; for the other groups the same height is "12 < H ≤ 23" → this is the table's own heading.
- A system is required in the wrong column of Tabela 4 → the columns are built by position from `HEIGHT_CLASSES`; destructure the right element when changing them (a wrong index once gave "> 30" the 23 to 30 m condition and a test caught it).
- The review sheet test fails after a change to a rule or a question → run `UPDATE_REVIEW_SHEET=1 pnpm exec vitest run features/classification/lib/rulesets/review-sheet` and review the diff.
