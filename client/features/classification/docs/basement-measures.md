# Basement measures

How the additional measures for occupied basements (Tabela 30 of IN 1 parte 2, Anexo B) are decided and shown. For developers extending the rules and for whoever reviews the readings with Moura. It describes the code as it is now; read `rule-engine.md` first.

## What this is

Tabela 30 is not an x/- table: for each basement it prints a list of alternative measures. `BASEMENT_RULES` (`lib/rulesets/basement.ts`) holds one `derive` rule per printed row (14 rows). Each rule sets the fact `basement_case` to the row's key (for example `first-b250-storage`) when the building has a basement and its level, area and use match the row. `classify` then shows the row's text as an observation, with the notes it cites and note 7. The rows are read from `norms/in-1-p2/tables/table-30.json` when the module loads; a label nobody reviewed throws, so a row cannot be dropped silently.

Invariants:

- The measures are shown, not chosen: the norm lists alternatives ("ou"), and the engine never picks one.
- Every rule is `provisional`.
- The observation appears only when no specific analysis replaces the result.

## Surface

| Export                      | File          | Contract                                                          |
| --------------------------- | ------------- | ----------------------------------------------------------------- |
| `BASEMENT_RULES`            | `basement.ts` | One derive rule per row of Tabela 30                              |
| `BASEMENT_CASE_FACT`        | `basement.ts` | The derived fact, `basement_case`                                 |
| `basementMeasuresText(key)` | `basement.ts` | The row's alternatives, the cited notes and note 7, in Portuguese |

## Rules and behavior

- **New facts** (all allow "não sei"): `has_basement`, `basement_level` (`first_second` or `other`), `basement_area_m2` and `basement_use` (`storage`, `assembly` or `other`). `has_basement` is asked once the risk I exemption is answered "no"; the other three only when `has_basement` is true.
- **Area bands.** First and second basement: up to 100, above 100 up to 250, above 250 up to 500, above 500 m². Deeper basements: up to 100 and above 100 m². The printed bands ("Entre 100 e 250") do not say which side the limit falls on; the code puts the limit in the lower band.
- **Use.** `assembly` is the divisions F-1, F-3, F-5, F-6, F-10 and F-11. A row marked "Depósito⁵" (note 5) is for storage in a residential building (division A-1, A-2 or A-3). A storage basement in another building, and an assembly basement in a band with no F row, read the "Outras ocupações" row.
- **Up to 100 m² on the first or second basement** prints "Sem exigências adicionais"; note 7 (compartmentation of the basement) still applies.

## What this does NOT do

- **It does not pick an alternative** or check the measures against the systems the tables list.
- **It does not apply the general notes** printed under the table (uses allowed in any basement without measures, such as garages with smoke exhaust). Those uses are answered as `other`.
- **It does not size anything.**
- **It does not approve a reading.** The bands, the residential reading of note 5 and the use mapping are open until a person confirms them with Moura.
