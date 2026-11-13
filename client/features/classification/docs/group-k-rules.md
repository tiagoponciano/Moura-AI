# Grupo K rules

How the rule set for Grupo K (energia: K-1 and K-2) is built and how it differs from the other covered groups. For developers adding other groups and for whoever reviews the readings with Moura. It describes the code as it is now; read `group-c-rules.md` first, because Grupo K reuses its engine, facts, guards and risk rules.

## What this is

`GROUP_K_RULES` (`lib/rulesets/group-k.ts`) compiles **Tabela 22** of IN 1 parte 2, Anexo B. Unlike the other groups it is not split by area or height: one table covers every building of the division, with four columns. K-1 is split by the volume of combustible liquid (up to 20 m³, above 20 m³) and K-2 by the type of plant (hydro, thermal). `classify` names the table and the column.

Invariants (as for the other groups): every rule is `provisional`; a cell with an uncoded note throws at compile time; outside the scope (several blocks, mixed or secondary use, a division without rules) the result is a specific analysis.

`docs/group-k-review-sheet.md` is generated from the code and kept equal to it by a test.

## Surface

| Export                      | File               | Contract                                   |
| --------------------------- | ------------------ | ------------------------------------------ |
| `GROUP_K_RULES`             | `group-k.ts`       | The rules compiled from Tabela 22          |
| `TABLE_22_SPEC`             | `group-k.ts`       | The four columns, base condition and notes |
| `TABLE_22_NOTES`            | `group-k-notes.ts` | The reading of each of the ten notes       |
| `renderGroupKReviewSheet()` | `review-sheet.ts`  | The Portuguese review sheet for Grupo K    |

## Rules and behavior

- **New facts** (all allow "não sei"): `combustible_liquid_m3` (K-1 column), `power_plant_type` (`hydro` or `thermal`, K-2 column), `combustible_liquid_storage` (note 7), `solid_fuel_storage_m2` (note 2) and `public_road_within_50m` (note 1). They are asked only when a rule that reads them is open.
- **No regime boundary.** `DIVISION_SCOPE_GUARDS` gives K-1 and K-2 only `multiple-blocks` and `mixed-use`, so exactly 750 m² or 12 m is not a specific analysis for them.
- **Systems added to the catalog:** foam (Espuma) and cooling (Resfriamento), which only Tabela 22 prints. The label "Sinalização de emergência" is an alias of the signage system.
- **Thresholds.** Sprinklers of K-2 thermal from 60 m (note 4); emergency elevator from 40 m (note 6); alarm and horizontal compartmentation only with more than 750 m² of solid fuel storage (note 2); vertical compartmentation, structural protection and hydraulic preventive follow notes 10, 7 and 2 or 9.
- **Fire load.** Notes 9 and 10 read "carga de incêndio maior que 1.200 MJ/m²" as the high or very high class, and keep the printed places as the scope of the requirement.
- **Substitution.** Note 8: in K-1 the foam (and cooling) can be replaced by a fixed automated system for transformers and power reactors (NBR 13231).
- **Multi-reference cells.** `x²⁻ 9` (hydraulic preventive) is read as notes 2 and 9; the sheet asks Moura to confirm.
- **Risk.** There is no Quadro 2 row for K, so risk comes from the shared rules (V, I, II) and ends at IV.

## What this does NOT do

- **It covers K-1 and K-2.** Another division gets `GUARD-not-covered`.
- **It evaluates the building, not each place.** Notes that say "locais com carga de incêndio maior que 1.200 MJ/m²" use the building's fire load class.
- **It does not consult the specific norm for liquid fuels** (note 2).
- **It does nothing for existing buildings (IN 5).**
- **It does not approve a reading.** The questions in the review sheet are open until a person answers them.
