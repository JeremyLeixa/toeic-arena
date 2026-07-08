-- ═══════════════════════════════════════════════════════════
-- 2026-07-08 : Rapport hebdo formateur (Edge Function weekly-teacher-report)
--
-- Ajoute l'adresse de destination du rapport + un opt-in par cohorte.
-- Un même teacher_code peut couvrir plusieurs lignes groups ; la fonction
-- dédoublonne par teacher_email et envoie UN mail par formateur, avec une
-- section par cohorte.
--
-- RLS : groups n'a pas de RLS (comme ses tables sœurs) — écriture service-role.
-- Idempotent : re-jouable sans erreur.
-- ═══════════════════════════════════════════════════════════

alter table groups add column if not exists teacher_email text;
alter table groups add column if not exists weekly_report_optin boolean default true;

comment on column groups.teacher_email is
  'Destinataire du rapport hebdo cohorte (Edge Function weekly-teacher-report). NULL = pas de rapport.';
comment on column groups.weekly_report_optin is
  'Si false, la cohorte est exclue du rapport hebdo formateur même si teacher_email est renseigné.';
