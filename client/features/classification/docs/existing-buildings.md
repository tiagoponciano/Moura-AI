# Existing and recent buildings (IN 5)

How the classes vital, indispensable and adaptable of IN 5 are shown for existing and recent buildings. For developers extending the rules and for whoever reviews the readings with Moura. It describes the code as it is now; read `rule-engine.md` first.

## What this is

`IN5_RULES` (`lib/rulesets/in5.ts`) are `overlay` rules built from `norms/in-5/annex-b.json` (see `norm-extraction.md`). For a division and a building that is existing or recent, each system the tables already require gets one of three labels, shown in the panel with what IN 5 allows for that class (arts. 21, 23 and 25). The overlay never adds a system: it only labels one that is required.

Invariants:

- A label appears only when the fact `building_condition` is `existing`. New buildings and answers without the fact show nothing.
- The first matching label wins: vital, then indispensable, then adaptable ("TE", every other system).
- Every rule is `provisional`.

## Surface

| Export / field         | File          | Contract                                                  |
| ---------------------- | ------------- | --------------------------------------------------------- |
| `IN5_RULES`            | `in5.ts`      | One overlay rule per division, system and class           |
| `SystemView.treatment` | `classify.ts` | `vital`, `indispensable` or `adaptable`, absent otherwise |

## Rules and behavior

- **Fact.** `building_condition` (`new` or `existing`) is not asked. The model records it only when the user says the building is existing or recent, so the questions and the progress do not change.
- **Abbreviations.** Each abbreviation of Annex B maps to catalog systems (for example `Comp` to both compartmentations, `RES` to foam and cooling). `TODOS` (L-2, L-3) labels every system vital. `TE` labels the rest adaptable.
- **Conditional cells.** K-2 `SHP²` (only thermal plants) and M-2 `PE³` (liquids above 20 m³ or gases above 10 m³) label the system only while the condition holds; otherwise it falls to `TE`.
- **Panel.** A required system shows its class; vital also keeps the vital tag.

## What this does NOT do

- **It does not read the `SA¹` footnote** (A-2, A-3, B: only when automatic detection is required): the alarm is labelled indispensable regardless.
- **It reads `BI` as the fire brigade**, because the printed legend omits it.
- **It does not apply the criteria for enlargements** (arts. 13 to 19), the adaptations of Annex C, or the compensatory measures of Annex D.
- **It does not ask whether the building is existing or recent** and does not check the proof (art. 26).
- **It does not approve a reading.** The mapping of abbreviations and the conditional cells are open until a person confirms them with Moura.
