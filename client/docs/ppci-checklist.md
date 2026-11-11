# PPCI checklist

How Moura's PPCI review checklist gets into the database. Describes the code as it is now.

## What this is

The checklist is the "Check list de projetos" sheet used to review a fire-prevention project (PPCI): 12 groups of items such as emergency exits or extinguishers. It is stored in Supabase as numbered versions (`v1`, `v2`…), imported from the sheet by a script that writes a seed migration. The app only reads it; no screen uses it yet.

Invariants:

- A version is immutable once seeded. A changed sheet becomes a new version, never an edit.
- Group and item order is the sheet's order, kept in `position`.
- Every approved user can read; nobody can write through the API (RLS has select policies only).

## Data shapes

| Table                   | Key                                             | Columns                                                           |
| ----------------------- | ----------------------------------------------- | ----------------------------------------------------------------- |
| `ppci_checklists`       | `version`                                       | `created_at`                                                      |
| `ppci_checklist_groups` | `(checklist_version, position)`                 | `name`                                                            |
| `ppci_checklist_items`  | `(checklist_version, group_position, position)` | `section` (sub-heading, nullable), `text`, `reference` (nullable) |

`reference` is the normative passage an item cites, such as `Art.10 da IN06` or `tabela 1 da IN01 parte 2`, found by pattern in the text; items that cite none have `null`.

## Rules and behavior

`client/scripts/import-ppci-checklist.mjs <sheet.xlsx> <vN> <YYYYMMDDHHMMSS>` reads the sheet and writes `supabase/migrations/<timestamp>_ppci_checklist_<vN>.sql`. The parsing is `parseChecklist` in `client/lib/ppci-checklist/parse-checklist.ts`:

1. The control panel at the top of the sheet lists each group with its item count.
2. A row holding only a group name opens that group.
3. A row with status cells and text in column D is an item. The header row ("Atende", "Adequar"…) and the "Não possui este sistema" switch are skipped.
4. A row with only text in column D is a sub-heading; it becomes the `section` of the items after it, until the next group.
5. Whitespace inside an item is collapsed.

The script prints each group's item count and says when it differs from the panel's. It fails only when a group in the panel has no heading in the sheet.

Version `v1` has 12 groups and 154 items.

## What this does NOT do

- The panel counts are not enforced. In `v1` the panel says 156 items in total; the sheet has 154. Three groups differ: "Hidrantes e mangotinhos" (panel 38, 33 imported, since five sub-headings are not items), "Acesso de viaturas" (panel 7, 4 imported) and "Sistema preventivos aplicáveis ao PPCI" (panel 17, 23 imported, which are the real list of systems).
- The status columns (Atende, Adequar, Ñ Aplic.) are not imported; they belong to a review of one project, not to the checklist.
- There is no screen, per-project answers or report yet.

## Gotchas

- A new version's migration timestamp must be later than every existing one → Supabase applies migrations by timestamp, and two files with the same one collide → pick a timestamp after the newest file in `supabase/migrations/`.
- The script reads the first worksheet only → a sheet with the checklist on another tab imports nothing → move it to the first tab.
