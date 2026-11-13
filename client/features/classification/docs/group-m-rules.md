# Grupo M rules (M-1 and M-2)

How the rule set for the special divisions M-1 (tunnels) and M-2 is built and how it differs from the other covered groups. For developers adding other groups and for whoever reviews the readings with Moura. It describes the code as it is now; read `group-c-rules.md` first, because Grupo M reuses its engine, facts, guards and risk rules, and `group-k-rules.md`, which is built the same way.

## What this is

`GROUP_M_RULES` (`lib/rulesets/group-m.ts`) compiles **Tabela 23** (M-1) and **Tabela 24** (M-2) of IN 1 parte 2, Anexo B. Neither is split by area or height, so neither is the regime of the other groups. M-3 to M-11 and Tabela 30 have no rules yet and get `GUARD-not-covered`.

- **Tabela 23** has four columns by the length of the tunnel: up to 200 m, above 200 up to 500 m, above 500 up to 1.000 m, above 1.000 m. The printed ranges overlap at their limits ("200 ≤ 500 m"), so the code reads each middle range as above the lower limit and up to the upper one; the sheet asks Moura to confirm.
- **Tabela 24** has five columns: tanks, cylinders and processes (liquids up to or above 20 m³, gases up to or above 10 m³), loading and unloading platform, and packaged products (liquids up to or above 20 m³, gases up to or above 12.480 kg).

Invariants (as for the other groups): every rule is `provisional`; a cell with an uncoded note throws at compile time; outside the scope (several blocks, mixed or secondary use, a division without rules) the result is a specific analysis.

`docs/group-m-review-sheet.md` is generated from the code and kept equal to it by a test.

## Surface

| Export                             | File               | Contract                                    |
| ---------------------------------- | ------------------ | ------------------------------------------- |
| `GROUP_M_RULES`                    | `group-m.ts`       | The rules compiled from Tabelas 23 and 24   |
| `TABLE_23_SPEC`, `TABLE_24_SPEC`   | `group-m.ts`       | The columns, base condition and notes       |
| `TABLE_23_NOTES`, `TABLE_24_NOTES` | `group-m-notes.ts` | The reading of each note and its questions  |
| `renderGroupMReviewSheet()`        | `review-sheet.ts`  | The Portuguese review sheet for M-1 and M-2 |

## Rules and behavior

- **New facts** (all but the length allow "não sei"): `tunnel_length_m` (M-1), `m2_installation` (`tanks_processes`, `loading_platform` or `packaged_products`), `m2_liquid_m3`, `m2_gas_quantity` (m³ for tanks, kg for packaged products) and `hose_reach_60m` (note 1). They are asked only when a rule that reads them is open.
- **One installation per answer.** M-2 classifies one installation at a time. A property with several installations is not modeled; the sheet asks Moura how to treat it.
- **No regime boundary.** `DIVISION_SCOPE_GUARDS` gives K and M only `multiple-blocks` and `mixed-use`.
- **Notes of Tabela 24.** 1: dispensed when the hose reaches within 60 m. 3: area from 750 m². 4: height above 12 m. 6: only when the liquid volume is above zero. 7: kept as the scope "somente nos locais em que exista o acondicionamento de líquidos e gases". 2 and 5 are observations.
- **Cells with several notes** (`x 3_4`, `x 3_7`) require the system when any of their notes holds.
- **Systems added to the catalog:** communication system and TV circuit (monitoramento), which only Tabela 23 prints; foam and cooling come from Grupo K. Table-specific labels (for example "Detecção de Incêndio", "Iluminação de Emergência 5") are aliases of existing systems.
- **Risk.** There is no Quadro 2 row for M-1 and M-2, so risk comes from the shared rules (V, I, II) and ends at IV.

## What this does NOT do

- **It covers M-1 and M-2.** M-3 to M-11 get `GUARD-not-covered`.
- **It does not consult the specific norms** for flammable and combustible liquids that note 6 mentions.
- **It evaluates the property, not each place** (note 7).
- **It does nothing for existing buildings (IN 5).**
- **It does not approve a reading.** The questions in the review sheet are open until a person answers them.
