# Grupos I and J rules

How the rule set for Grupo I (indústria: I-1 a I-3) and Grupo J (depósito: J-1 a J-4) is built and how it differs from the other covered groups. For developers adding other groups and for whoever reviews the readings with Moura. It describes the code as it is now; read `group-c-rules.md` first, because these groups reuse its engine, facts, regime, guards and risk rules.

## What this is

`GROUP_IJ_RULES` (`lib/rulesets/group-ij.ts`) compiles the **"I, J e M3" column of Tabela 2** (for I and J only; M-3 is not covered) for area ≤ 750 m² and height ≤ 12 m, and **four tables by height** for area ≥ 750 m² or height ≥ 12 m: Tabela 18 for I-1 and I-2, Tabela 19 for I-3, Tabela 20 for J-1 and J-2 and Tabela 21 for J-3 and J-4. It adds the six rows of Quadro 2 for I and J to the risk III rules. `classify` names the table from the division.

Invariants (as for the other groups): every rule is `provisional`; a cell with an uncoded note throws at compile time; outside the scope (several blocks, mixed or secondary use, exactly 750 m² or 12 m, a division without rules) the result is a specific analysis.

`docs/group-ij-review-sheet.md` is generated from the code and kept equal to it by a test.

## Surface

| Export                                                                                | File                | Contract                                                           |
| ------------------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------ |
| `GROUP_IJ_RULES`                                                                      | `group-ij.ts`       | Tabela 2 (I, J), Tabelas 18 to 21 and the Quadro 2 rows of I and J |
| `TABLE_2_IJ_SPEC`, `TABLE_18_SPEC`, `TABLE_19_SPEC`, `TABLE_20_SPEC`, `TABLE_21_SPEC` | `group-ij.ts`       | The columns, base condition and note readings of each table        |
| `TABLE_2_IJ_NOTES`, `TABLE_18_NOTES` to `TABLE_21_NOTES`                              | `group-ij-notes.ts` | The reading of each note and its questions                         |
| `renderGroupIJReviewSheet()`                                                          | `review-sheet.ts`   | The Portuguese review sheet for these groups                       |

## Rules and behavior

- **New fact: `storage_area_m2`** (m², the floor area used as storage, not the total area; 0 allowed; "não sei" allowed). Tabela 20 note 2 (sprinklers and hydraulic system of J-2: depósito ≥ 750 m² up to 30 m, ≥ 500 m² above 30 m) and Tabela 21 note 6 (sprinklers for J-3 with depósito ≥ 500 m²) read it. It is asked only when one of those rules is open.
- **Tabela 2.** Notes 2 (area ≥ 200 m²) and 6 (hydraulic system from 4 storeys) as for Grupo C. Note 1 exempts J-1 from the brigade; the other divisions of I and J keep it.
- **Tabela 18 (I-1, I-2).** Sprinklers only for I-2 (2); horizontal compartmentation up to 6 m only for I-2, replaceable by sprinklers (7), and replaceable by sprinklers above that (3); detection and the plan up to 12 m only for I-2 with area ≥ 5.000 m² (6); the elevator from 60 m (4).
- **Tabela 19 (I-3).** Sprinklers above 10.000 m² (2); smoke control above 20.000 m² (7); detection in every room except bathrooms and negligible load, up to 12 m only from 5.000 m² (5); the elevator from 60 m (6). The private brigade for I-3 is an observation.
- **Tabela 20 (J-1, J-2).** J-1 is exempt from the brigade (1), from the sprinklers (2), the plan (7), finishing materials (8) and detection (9). Vertical compartmentation `x⁴⁻⁵` is read as notes 4 and 5. Note 5 reads "área maior que 500 m²" as the total area.
- **Tabela 21 (J-3, J-4).** Sprinklers: J-4 from 10.000 m² (2) and J-3 by the depósito area (6); smoke control only for J-4 above 20.000 m² (8); detection in every room except bathrooms and negligible load (7); the elevator from 60 m (5).
- **Risk.** Quadro 2: I-1 and J-1 up to 21 m and 5.000 m²; I-2 up to 12 m and 5.000 m²; I-3 and J-2 up to 6 m and 4.000 m², or 6 to 12 m and 3.000 m²; J-3 up to 6 m and 3.000 m²; J-4 up to 6 m and 2.500 m². Risk V, I, II and IV are the shared rules.

## What this does NOT do

- **It covers only I-1 to I-3 and J-1 to J-4.** M-3 shares the Tabela 2 column but has no rules; another division gets `GUARD-not-covered`.
- **It does not compute the depósito area.** The user answers it.
- **It does not size anything.** Which systems, not how many.
- **It does nothing for existing buildings (IN 5).**
- **It does not approve a reading.** The questions in the review sheet are open until a person answers them.

## Gotchas

- A division shows the wrong table → `LARGE_TABLE` in `classify.ts` maps each division to its table.
- A J rule stays "needs info" → it waits for `storage_area_m2`; answer 0 when there is no depósito.
- The review sheet test fails after a change to a rule or a question → run `UPDATE_REVIEW_SHEET=1 pnpm exec vitest run features/classification/lib/rulesets/review-sheet` and review the diff.
