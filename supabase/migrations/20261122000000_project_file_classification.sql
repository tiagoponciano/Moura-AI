-- A classification kept as a file of the project: `classification` joins the kinds
-- `project_files.kind` accepts. Existing rows are untouched.

alter table public.project_files
  drop constraint project_files_kind_check,
  add constraint project_files_kind_check
    check (kind in ('form', 'proposal', 'plan', 'conversion', 'classification', 'other'));
