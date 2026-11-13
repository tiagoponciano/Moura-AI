# A-1 rules

How the rule set for division A-1 (houses and horizontal condominiums) is built. For developers adding other groups and for whoever reviews the readings with Moura. It describes the code as it is now; read `group-c-rules.md` first, and `group-a-rules.md` for A-2 and A-3, which share Tabela 3.

## What this is

`GROUP_A1_RULES` (`lib/rulesets/group-a1.ts`) compiles the first grid of **Tabela 3** of IN 1 parte 2, Anexo B (`part` 0 of the extracted table). Its three columns depend on how the dwelling is built, not on area or height: geminada/conjugada, isolada, and unifamiliar em edificação mista with H < 6 m. `classify` names the table and the column from the construction type.

Invariants (as for the other groups): every rule is `provisional`; a cell with an uncoded note throws at compile time.

`docs/group-a1-review-sheet.md` is generated from the code and kept equal to it by a test.

## Surface

| Export                       | File                | Contract                                    |
| ---------------------------- | ------------------- | ------------------------------------------- |
| `GROUP_A1_RULES`             | `group-a1.ts`       | The A-1 grid and the guard for note 13      |
| `TABLE_3_A1_SPEC`            | `group-a1.ts`       | The three columns, base condition and notes |
| `TABLE_3_A1_NOTES`           | `group-a1-notes.ts` | The reading of notes 11, 12, 13, 14 and 18  |
| `renderGroupA1ReviewSheet()` | `review-sheet.ts`   | The Portuguese review sheet for A-1         |

## Rules and behavior

- **New facts** (all allow "não sei"): `a1_construction` (`attached`, `detached` or `mixed_single_family`), `shared_gas_shelter` (note 12) and `lot_count` (note 18). They are asked only when a rule that reads them is open.
- **No scope guards.** `DIVISION_SCOPE_GUARDS` gives A-1 none: the table does not use area or height, a horizontal condominium is several blocks by nature, and the mixed single-family column already treats the mixed building.
- **Notes.** 11: building isolation only between attached units (the row is required for that column and not for the others). 12: fuel gas for the attached and detached columns only with a shared gas shelter or central LPG. 14: structural protection of the mixed column follows the predominant occupation (shown as an observation). 18: urban hydrants above 350 lots.
- **Note 13.** A mixed single-family unit of 6 m or more gets `GUARD-a1-mixed-over-6m` (specific analysis), because the norm sends it to Tabela 2 or 3 (as A-2) or to the predominant occupation, whichever is stricter.
- **Systems added to the catalog:** building isolation and urban hydrants, which only the A-1 grid prints. The labels "(qualquer área)" are aliases of the existing systems.
- **Risk.** Quadro 2 lists A-1 and A-2 together (up to 21 m and 5.000 m²); the risk III rule applies to both.

## What this does NOT do

- **It does not compare the A-2 tables and the predominant occupation** for the mixed unit of 6 m or more: that is a specific analysis.
- **It does not evaluate the mixed or secondary occupation** of arts. 11 and 12 beyond the construction column.
- **It does nothing for existing buildings (IN 5).**
- **It does not approve a reading.** The questions in the review sheet are open until a person answers them.
