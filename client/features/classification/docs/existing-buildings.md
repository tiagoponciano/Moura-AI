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

## Adaptations (Annex C)

`adaptationsFor(systemId, class)` (`lib/in5-adaptations.ts`) reads `norms/in-5/annex-c.json` and returns the sections of the system's table that its class allows. Arts. 21 and 23: a vital or indispensable system gets the adaptations and their compensations, never the substitutions or exemptions. Art. 25: an adaptable one gets all four sections. A section the annex marks as "não aplicável" is left out. The annex has tables for the hydraulic system (IN 7), exits (IN 9), alarm and detection (IN 12), low-voltage installations (IN 19), combustible gas (IN 8) and compartmentation (IN 14, horizontal and vertical apart); any other system shows nothing. `SystemView.adaptations` carries it, and a required row of an existing building shows it under "Adaptações admitidas (IN 5, Anexo C)".

## Enlargements (arts. 11 to 19)

`classifyEnlargement` (`lib/enlargement.ts`) says how an enlargement of an existing building is regularized. It is a pure function over the answers the articles read: the original area and what was added since the reference date (art. 11; additions sum up, as in Nota 1), whether the original is regularized, whether the areas are compartmented, whether the enlargement made a new isolated block, whether 5 years have passed since the habite-se, and whether the enlargement raises the rigor of IN 1. The caller says whether the rigor rises; the function does not compute it.

The order it applies:

1. No 5 years of grace: the whole building follows IN 1 (art. 12, § 1º).
2. A new isolated block follows IN 1 in full (art. 13).
3. Up to 20% without more rigor: a regularized building keeps its systems and extends them; an irregular one is regularized by IN 5 (art. 15). A regularized building that crosses the IN 1 threshold with up to 20% does not count as more rigor (art. 16), except for I-3, J-4 and the F divisions of § 1º.
4. 20% to 50% without more rigor: IN 5 is admitted (art. 17).
5. Up to 50% with more rigor: compartmented, IN 1 for the enlarged area and the original area keeps its systems or uses IN 5; not compartmented, IN 1 for everything. In both, adaptable systems proven unfeasible may follow IN 5 (art. 18).
6. Over 50%: compartmented, IN 1 for the enlarged area; not compartmented, IN 1 for everything with no adaptations (art. 19).

## The chat and the panel

When the user says an existing building will be enlarged, the assistant collects the seven answers and calls the `record_enlargement` tool (`server/record-enlargement.ts`) with all of them; each call replaces the previous record, so a replayed chat settles. The client keeps it in `useClassification`, sends it in the request body as `enlargement`, and `buildInstructions` writes it into the prompt. The panel shows "Ampliação da edificação" (`components/enlargement-notice.tsx`) with the share, the articles and what happens to each area; the division comes from the answers or the chosen activity, and without it the panel asks for the activity. The record is kept only in the hook, like the answers.

Every result repeats that the requirements are sized by the sum of the areas (art. 14) and that the original systems get no waiver (art. 12, § 2º). The boundaries are 20% and 50%, both inclusive in the lower band. The reading is provisional until Moura confirms it.

## What this does NOT do

- **It does not read the `SA¹` footnote** (A-2, A-3, B: only when automatic detection is required): the alarm is labelled indispensable regardless.
- **It reads `BI` as the fire brigade**, because the printed legend omits it.
- **It does not apply the compensatory measures of Annex D.**
- **It does not choose an adaptation.** Annex C is shown as printed; the responsible engineer decides which one fits, with the justification the articles ask for.
- **It does not ask whether the building is existing or recent** and does not check the proof (art. 26).
- **It does not approve a reading.** The mapping of abbreviations and the conditional cells are open until a person confirms them with Moura.
