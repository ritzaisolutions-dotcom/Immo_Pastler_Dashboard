-- Retention via Supabase RPC (n8n ruft POST /rest/v1/rpc/... mit Service Role auf)
-- Kein direkter Postgres-Zugang in n8n nötig.

CREATE OR REPLACE FUNCTION public.pastler_retention_purge_email_body_90d()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected integer;
BEGIN
  UPDATE pastler_emails
  SET inhalt_text = NULL
  WHERE created_at < NOW() - INTERVAL '90 days'
    AND inhalt_text IS NOT NULL;
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;

CREATE OR REPLACE FUNCTION public.pastler_retention_anonymize_emails_180d()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected integer;
BEGIN
  UPDATE pastler_emails
  SET von_email = 'redacted@deleted.local',
      von_name = NULL,
      betreff = '[gelöscht]'
  WHERE created_at < NOW() - INTERVAL '180 days'
    AND inhalt_text IS NULL
    AND von_email <> 'redacted@deleted.local';
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;

CREATE OR REPLACE FUNCTION public.pastler_retention_delete_emails_365d()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected integer;
BEGIN
  DELETE FROM pastler_emails
  WHERE created_at < NOW() - INTERVAL '365 days';
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;

CREATE OR REPLACE FUNCTION public.pastler_retention_clear_todo_descriptions_365d()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected integer;
BEGIN
  UPDATE pastler_todos
  SET beschreibung = NULL
  WHERE status = 'erledigt'
    AND created_at < NOW() - INTERVAL '365 days'
    AND beschreibung IS NOT NULL;
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;

REVOKE ALL ON FUNCTION public.pastler_retention_purge_email_body_90d() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.pastler_retention_anonymize_emails_180d() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.pastler_retention_delete_emails_365d() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.pastler_retention_clear_todo_descriptions_365d() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.pastler_retention_purge_email_body_90d() TO service_role;
GRANT EXECUTE ON FUNCTION public.pastler_retention_anonymize_emails_180d() TO service_role;
GRANT EXECUTE ON FUNCTION public.pastler_retention_delete_emails_365d() TO service_role;
GRANT EXECUTE ON FUNCTION public.pastler_retention_clear_todo_descriptions_365d() TO service_role;

COMMENT ON FUNCTION public.pastler_retention_purge_email_body_90d() IS
  'n8n Workflow 2: E-Mail-Volltext nach 90 Tagen löschen. Aufruf via Supabase REST RPC.';

COMMENT ON FUNCTION public.pastler_retention_anonymize_emails_180d() IS
  'n8n Workflow 3a: E-Mail-Metadaten nach 180 Tagen anonymisieren.';

COMMENT ON FUNCTION public.pastler_retention_delete_emails_365d() IS
  'n8n Workflow 3b: E-Mail-Zeilen nach 365 Tagen löschen.';

COMMENT ON FUNCTION public.pastler_retention_clear_todo_descriptions_365d() IS
  'n8n Workflow 3c: Todo-Beschreibungen (erledigt) nach 365 Tagen löschen.';
