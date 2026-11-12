-- Classification replaces the PPCI review checklist, so its tables go. Answers
-- first (they reference the checklist items); dropping the table also drops its
-- trigger and policies. `if exists` because not every environment applied
-- 20261111000000_ppci_answers.

drop table if exists public.ppci_answers;
drop function if exists public.touch_ppci_answer();
drop table if exists public.ppci_checklist_items;
drop table if exists public.ppci_checklist_groups;
drop table if exists public.ppci_checklists;
