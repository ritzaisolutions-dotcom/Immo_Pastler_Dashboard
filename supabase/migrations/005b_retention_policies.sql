-- Pastler Dashboard — documented retention (executed by n8n cron via Supabase RPC, not pg_cron)
-- RPC functions: supabase/migrations/008_retention_rpc.sql
-- n8n: HTTP POST /rest/v1/rpc/<function_name> with service role key (no direct Postgres)

-- Workflow 2 (90 days): inhalt_text purge — already documented
-- UPDATE pastler_emails SET inhalt_text = NULL
--   WHERE created_at < NOW() - INTERVAL '90 days';

-- Workflow 3a (180 days): anonymize email metadata after body purge
-- UPDATE pastler_emails
--   SET von_email = 'redacted@deleted.local',
--       von_name = NULL,
--       betreff = '[gelöscht]'
--   WHERE created_at < NOW() - INTERVAL '180 days'
--     AND inhalt_text IS NULL
--     AND von_email <> 'redacted@deleted.local';

-- Workflow 3b (365 days): delete email records entirely
-- DELETE FROM pastler_emails
--   WHERE created_at < NOW() - INTERVAL '365 days';

-- Workflow 3c (365 days): clear beschreibung on completed todos (email extracts)
-- UPDATE pastler_todos
--   SET beschreibung = NULL
--   WHERE status = 'erledigt'
--     AND created_at < NOW() - INTERVAL '365 days'
--     AND beschreibung IS NOT NULL;

COMMENT ON TABLE public.pastler_emails IS
  'Retention: inhalt_text NULL @90d; metadata anonymized @180d; row deleted @365d (n8n cron).';

COMMENT ON TABLE public.pastler_todos IS
  'Retention: beschreibung cleared on erledigt todos @365d (n8n cron).';
