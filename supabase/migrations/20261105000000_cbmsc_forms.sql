-- Catalog of official CBMSC forms. Each row points at a public Google Doc that
-- the CBMSC keeps up to date; the app never stores the document itself
-- (see client/docs/cbmsc-forms-catalog.md).

create table public.cbmsc_forms (
  google_doc_id text primary key check (google_doc_id ~ '^[A-Za-z0-9_-]{20,}$'),
  normative smallint not null check (normative > 0),
  annex text not null check (annex ~ '^[A-Z]{1,2}$'),
  name text not null check (char_length(btrim(name)) between 1 and 200),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);

create function public.touch_cbmsc_form()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end;
$$;

create trigger cbmsc_forms_touch
  before insert or update on public.cbmsc_forms
  for each row execute function public.touch_cbmsc_form();

alter table public.cbmsc_forms enable row level security;

create policy "Approved users read active forms"
  on public.cbmsc_forms for select
  to authenticated
  using (active and public.is_approved());

create policy "Admins read all forms"
  on public.cbmsc_forms for select
  to authenticated
  using (public.is_admin());

create policy "Admins add forms"
  on public.cbmsc_forms for insert
  to authenticated
  with check (public.is_admin());

-- No delete policy: admins deactivate a form instead.
create policy "Admins update forms"
  on public.cbmsc_forms for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- The forms published under "Anexos de INs em vigor" on
-- https://cbm.sc.gov.br/index.php/sci/instrucoes-normativas
insert into public.cbmsc_forms (google_doc_id, normative, annex, name) values
  ('1JoCbd1zYEfTBX2OX_OlelX95i35UTbvwpCjy1pogVks', 1, 'C', 'Modelo de RPCI'),
  ('1K6DrXe04P4pBnT3zcNB736g_H2_PyUZSXe-_FkTH8qs', 1, 'D', 'Formulário para consulta técnica'),
  ('1GKB8-_CQwtbEuNeegvgt98Wi5yzMcd57bPdkoq1y-K8', 1, 'E', 'Formulário para requerimento técnico'),
  ('1ZcfbW4HQPwnw3rAyxCSWd_HiucmZodjl_tOldeJKjkw', 1, 'F', 'Formulário para recurso técnico'),
  ('1MIvxep9risltA52r6YBqfpPcXErQWU7qwAUkviuzzEU', 1, 'G', 'Declaração e Termo de Responsabilidade (responsável pelo imóvel)'),
  ('19CQsglI1GEIxHypHLLWySm1tVcjBpbpqWjpm5AvxYu4', 1, 'H', 'Declaração e Termo de Responsabilidade (responsável)'),
  ('11AG6qpnjh6oz2CT-aFfMUoMEcc514ZhbiGoQhVq9Mgg', 1, 'I', 'Relatório de conformidade e termo de responsabilidade'),
  ('1PUIh5BfyFZdti98Fe1WrFY6q2hjhRaP3bN7nUyWifXg', 1, 'J', 'Termo de entrega do imóvel'),
  ('1M4mMAFxvC84Va4QI71uta0evpw-JO48CENY1mVdJmvA', 1, 'K', 'Termo de retirada de PPCI'),
  ('12RucG-chaxbUyzjd8esQvBur2H1Gq42HapHWNQl0xS8', 2, 'J', 'Formulário de Recurso'),
  ('1fhyQzBFl2QVCF4-_7KTk6A1uT-UOQgqZdrY0hAyK3l0', 2, 'K', 'Requerimento para ressarcimento de multa para pessoa física'),
  ('1IfIcY3-tQFsPNHm59A9trMBbR4a1GZJLLaRXszCfXXA', 2, 'L', 'Requerimento para ressarcimento de multa para pessoa jurídica'),
  ('1gXWF1l3Uotwzk3ewJNEUsZblV1XcbX7DA-Hg-0ucJmQ', 7, 'C', 'Relatório de Comissionamento do SHP'),
  ('1LjX43B1J7GIIL1DHs1r7twhR7JSWl5_CEeXGfM8ZRz4', 9, 'E', 'Relatório de Comissionamento do Elevador de Emergência'),
  ('14sxejQu0326WlNguc6nsevLWD5-482eXM3K9Fv6gSM8', 10, 'B', 'Relatório de Apresentação do Sistema de Controle de Fumaça'),
  ('1RHjtjBKRsK0qMRVLFsB04sPMtxJoSRakzYbqu3bBcH4', 10, 'C', 'Relatório de Inspeção do Sistema de Controle de Fumaça'),
  ('1e1FXOjfh8kGmH41a4XZDQnMIZO3zHuq2q4V6NPpQYPU', 15, 'B', 'Relatório de Comissionamento do Sistema de Chuveiros Automáticos'),
  ('1F9D8upQNlq48UIyIG_ufapL1xZFKKta-z6k4U3JBNHc', 15, 'C', 'Relatório de Inspeção do Sistema de Chuveiros Automáticos'),
  ('1k1DTXjjolgSWgJChs2csjd3K-4Thavw_6BgaXSXE2ow', 24, 'B', 'Evento Pequeno Porte'),
  ('17CKxnFtz1UZ-39IRKYqg4s_IZCInWCiwcILm5w1HrmY', 24, 'C', 'Evento Médio Porte'),
  ('1n66n-IbiiwlCOFCL5ZxR8cN5Wx2xpk1MvH9wYmJw4zA', 24, 'D', 'Evento Grande Porte'),
  ('18CRp-rASxd9KTYu4TBiSG-AawQugf_X_CVIt3E62sl0', 24, 'E', 'Evento Grande Porte - Laudo Comissionamento'),
  ('1OZHRaKWPlBjDR6OGBhqwJClzlf4qthgy8-85bvcSHVw', 27, 'A', 'Modelo de Requerimento'),
  ('1Tv0l-Tp9EIXTA-6tjoelKEdaENgxsADJyQk5G53v5js', 27, 'B', 'Modelo de Plano de Segurança'),
  ('1JvsXb9q5vRd-k7hf634M7eF7inQpbtilKd247bA4nzA', 27, 'C', 'Sugestão de modelo de Croqui'),
  ('1UhcbZh9K0Hl3MJV5_PpZph3A29GO-0ptsutEfv4QeUg', 28, 'C', 'Modelo de Plano de Implementação de Brigada de Incêndio (PIBI)'),
  ('1syDzh-iBcqhv_YBMlKPmCm_lGOK-UP_ZWpTFTajSjPo', 28, 'E', 'Relatório das atividades desenvolvidas pelas empresas de formação de Brigadistas'),
  ('1BB64yY07hpxflLbBdo704w47naFcNr9OUjgRXxijykA', 28, 'F', 'Relatório das atividades desenvolvidas pelas empresas de prestação de serviço de Brigadistas');
