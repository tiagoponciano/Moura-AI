# Activity catalog

How the activities of IN 3, Annex A become something the chat can search and the classification can use. For developers extending the search or adding the other annexes. It describes the code as it is now.

## What this is

Annex A of IN 3 lists, for every occupancy group, what a building is used for (the "destinação") and its specific fire load in MJ/m². `tools/norms/extract_annex_a.py` dumps it to `norms/in-3/annex-a.json`; `lib/catalog/activities.ts` loads it as `ACTIVITIES` and searches it. When the user confirms an activity, recording its id sets the division and, when the norm gives a number, the fire load, so the assistant does not ask for them.

Invariants:

- **The model never chooses the activity alone.** The prompt tells it to show the options and ask, even for a single match; code cannot enforce that, only validate that a recorded id exists in the catalog.
- **What the user typed wins over the activity.** An answered division or fire load is never overwritten, and a disagreement is shown.
- **The catalog is the printed annex.** Nothing is added to it; the synonyms in the search are a search aid and never a classification.

## Surface

| Export                                         | File                        | Contract                                                                                |
| ---------------------------------------------- | --------------------------- | --------------------------------------------------------------------------------------- |
| `ACTIVITIES`, `ACTIVITY_BY_ID`                 | `lib/catalog/activities.ts` | 261 activities, one per division and destination, each with a stable id                 |
| `DIVISIONS`                                    | `lib/catalog/activities.ts` | Every division that has an activity, in group and number order                          |
| `searchActivities(query, limit = 5)`           | `lib/catalog/activities.ts` | `{ activity, score }[]`, best first; empty when the annex does not list the description |
| `activityLabel(activity)`                      | `lib/catalog/activities.ts` | `"C-2 · Vestuário e acessórios"`                                                        |
| `searchActivityInput`, `searchActivity(input)` | `server/search-activity.ts` | The `search_activity` tool: `{ matches, note, summary }`                                |

Extraction: `python tools/norms/extract_annex_a.py <IN3.pdf> --out client/features/classification/norms/in-3 [--url …] [--verify]`. It writes `annex-a.json` and `manifest.json` (PDF hash, row count and a hash of the table); `--verify` writes nothing and exits 1 when the PDF no longer gives the committed table. `norms/in-3/annex-a.test.ts` validates the committed files.

## Data shapes

```ts
type Activity = {
  id: string; // "C-2-vestuario-e-acessorios"
  group: string; // "C"
  division: string; // "C-2"
  destination: string; // "Vestuário e acessórios", as printed
  qfi?: number; // specific fire load, MJ/m²
  qfiRef?: string; // "Anexo C", when the load column points elsewhere
  page: number; // PDF page
};
```

`search_activity` returns `{ matches, note, summary }`: each match is `{ id, division, destination, fire_load_mj_m2, fire_load_ref }` (one of the two load fields is `null`), `note` tells the model what to do next and `summary` is the line the chat shows.

## Rules and behavior

- **Id.** `<division>-<slug of the destination>`, the slug being the accent-free lower-case destination with hyphens, cut at 48 characters. A division and destination printed twice (I-2 "Estaleiros") keeps the first row.
- **Search.** The description is lower-cased, stripped of accents and split into words; the stop words (articles, prepositions, "venda", "vendas") are dropped and a plural is cut to its singular (`s`, `ais`→`al`, `eis`→`el`). A description word matches a destination word that is equal or is one of its synonyms. The score is the share of description words matched, minus 0.001 per word of the destination (a shorter destination wins a tie). At least half the words must match.
- **Cues.** "loja", "boutique", "comércio", "varejo", "revenda" and "vende" add 0.2 to Grupo C; "fábrica", "indústria", "produção", "fabricação" and "confecção" add 0.2 to Grupo I, and none of these words is matched against a destination. This is what puts a clothes shop under "Vestuário e acessórios" and a clothes factory under "Roupas".
- **Synonyms.** A short fixed list (roupa, moda, camisa, camiseta and vestido → vestuário; sapato and tênis → calçado; farmácia → drogaria; mercado, mercadinho and hipermercado → supermercado; pet → animal; livro → livraria). They only widen the search.
- **Derivation** (`classify`). With a valid `activity`: the division is set when none was answered; `fire_load_mj_m2` is set when the activity has a number and neither `fire_load_class` nor `fire_load_mj_m2` was answered; when the load column points to another annex, the screen says so and the class is still asked. Each value shows its source, `IN 3, Anexo A · <division> <destination>`. An answered division that differs from the activity's is kept and a warning is shown.
- **Not listed.** A description with no match returns no activities; the note tells the model to say the activity is not listed (the norm leaves it to similarity, IN 3 art. 6º § 1º) and to record the division as `other`.

## What this does NOT do

- **No similarity.** An activity the annex does not list is not matched to the nearest one; the norm assigns that to a person.
- **No other annex.** Annex B (load by storage height), C (deterministic method), D (calorific potential) and E (worksheet) are not loaded. The five loads that point to them (F-9, F-10, M-5, M-6, M-7) have no number here.
- **No ranking beyond the words and the cues.** It does not know which activity is more common.
- **It does not describe the groups.** A division other than C-1, C-2 and C-3 is shown by its id; the catalog of occupations (Tabela 1 of IN 1 parte 2) is not loaded.
- **The model can still misread.** A confirmed activity can be the wrong one if the user confirms without reading; the panel shows what was recorded.

## Gotchas

- "Roupas" finds a factory, not a shop → in Annex A the word belongs to I-2; the shop is "Vestuário e acessórios" in C-2 → say "loja" (the cue) or rely on the synonym; the user confirms either way.
- "Padaria" gives two options → the norm lists "Padarias comerciais" (F-8) and "Padarias industriais" (I-2), and neither is Grupo C → the assistant asks which one and the result is a specific analysis.
- An id stops resolving after a re-extraction → the destination text changed in the norm and so did its slug → ids are stable only while the printed text is; a saved answer that holds an id would need migrating.
- A division is missing from `DIVISIONS` → the annex has no activity for it (for example the groups J, K and L) → it can still be recorded as an answer only if it is in the registry's options, which come from this list.
