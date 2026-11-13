# Grupo M rules (M-3 to M-7 and M-11)

How the rule sets for the special divisions M-3, M-4, M-5, M-6, M-7 and M-11 are built. For developers adding other groups and for whoever reviews the readings with Moura. It describes the code as it is now; read `group-c-rules.md` first, and `group-m-rules.md` for M-1 and M-2, which is built the same way.

## What this is

`GROUP_M_DIVISIONS_RULES` (`lib/rulesets/group-m-divisions.ts`) compiles:

| Division       | Table                                                 | Columns                                                        |
| -------------- | ----------------------------------------------------- | -------------------------------------------------------------- |
| M-3            | Tabela 2, column "I, J e M3", and Tabela 25 by height | the regime of Grupo C: small building, then six height classes |
| M-4 and M-7    | Tabela 26                                             | M-4 above 1.500 m²; M-7 (térreo, áreas externas)               |
| M-5 (silo)     | Tabela 27                                             | any area                                                       |
| M-6            | Tabela 28                                             | planted area above 500 ha                                      |
| M-11 (estufas) | Tabela 29                                             | area below 750 m²; 750 m² or more                              |

M-8, M-9, M-10 and Tabela 30 (subsolos) have no rules and get `GUARD-not-covered`. M-3 keeps the three scope guards, including the regime boundary; the others declare only `multiple-blocks` and `mixed-use` (`DIVISION_SCOPE_GUARDS`).

Invariants (as for the other groups): every rule is `provisional`; a cell with an uncoded note throws at compile time; outside the scope the result is a specific analysis.

`docs/group-m-divisions-review-sheet.md` is generated from the code and kept equal to it by a test.

## Surface

| Export                                                | File                         | Contract                                                             |
| ----------------------------------------------------- | ---------------------------- | -------------------------------------------------------------------- |
| `GROUP_M_DIVISIONS_RULES`                             | `group-m-divisions.ts`       | The rules compiled from Tabelas 2 (M-3) and 25 to 29, and two guards |
| `TABLE_2_M3_SPEC`, `TABLE_25_SPEC` to `TABLE_29_SPEC` | `group-m-divisions.ts`       | The columns, base condition and notes                                |
| `TABLE_25_NOTES` to `TABLE_29_NOTES`                  | `group-m-divisions-notes.ts` | The reading of each note and its questions                           |
| `renderGroupMDivisionsReviewSheet()`                  | `review-sheet.ts`            | The Portuguese review sheet                                          |

## Rules and behavior

- **New facts** (all but the planted area allow "não sei"): `silo_support_area_m2` (M-5, note 3), `planting_area_ha` (M-6), `greenhouse_uses_gas` (M-11, note 1), `gas_suppression_system` (M-3, note 5) and `isotank_total_m3` (M-7, note 5). They are asked only when a rule that reads them is open.
- **Guards for what the tables leave out.** `GUARD-m4-up-to-1500` (M-4 up to 1.500 m²) and `GUARD-m6-up-to-500ha` (M-6 up to 500 ha) return a specific analysis, because the tables print only the larger case.
- **Thresholds.** M-3 elevator from 60 m (note 3); M-5 hydraulic system from 750 m² of support buildings; M-7 foam above 20 m³ of isotanks; M-11 lighting above 300 m² when the greenhouse is below 750 m² and fuel gas only when it uses gas.
- **Notes kept as text.** Notes that only point to other INs (Tabela 27, notes 2, 4, 5 and 6; Tabela 26, notes 1, 3 and 4; Tabela 28) or that apply per place (Tabela 25, notes 4, 6 and 7) are shown as observations or as the scope of the requirement, not evaluated per place.
- **Risk.** There is no Quadro 2 row for these divisions, so risk comes from the shared rules (V, I, II) and ends at IV.

## What this does NOT do

- **It does not cover M-8, M-9, M-10 or Tabela 30.**
- **It does not consult the INs the notes point to** (IN 22, IN 34 and the specific norms).
- **It does nothing for existing buildings (IN 5).**
- **It does not approve a reading.** The questions in the review sheet are open until a person answers them.
