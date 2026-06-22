-- Retention documentation + Eigentümer read-only (SELECT) policies
-- Mitarbeiter retain FOR ALL via app_metadata.role = 'mitarbeiter'

-- Eigentümer: read-only (no INSERT/UPDATE/DELETE on pastler data)
DROP POLICY IF EXISTS "eigentümer_pastler_inserate" ON public.pastler_inserate;
CREATE POLICY "eigentümer_pastler_inserate" ON public.pastler_inserate
  FOR SELECT TO authenticated
  USING (eigentuemer_email = auth.email());

DROP POLICY IF EXISTS "eigentümer_pastler_mieter" ON public.pastler_mieter;
CREATE POLICY "eigentümer_pastler_mieter" ON public.pastler_mieter
  FOR SELECT TO authenticated
  USING (
    inserat_id IN (
      SELECT id FROM public.pastler_inserate WHERE eigentuemer_email = auth.email()
    )
  );

DROP POLICY IF EXISTS "eigentümer_pastler_todos" ON public.pastler_todos;
CREATE POLICY "eigentümer_pastler_todos" ON public.pastler_todos
  FOR SELECT TO authenticated
  USING (
    inserat_id IN (
      SELECT id FROM public.pastler_inserate WHERE eigentuemer_email = auth.email()
    )
  );

-- Retention: run via n8n Cron Workflow 2 + 3 (see n8n/README.md)
-- Workflow 2 (daily 02:00): null email body after 90 days
--   UPDATE pastler_emails SET inhalt_text = NULL
--   WHERE created_at < NOW() - INTERVAL '90 days' AND inhalt_text IS NOT NULL;
--
-- Workflow 3 (daily 02:30): anonymize @180d + delete @365d + clear todos @365d (PARALLEL)
--   3a) UPDATE pastler_emails SET von_email='redacted@deleted.local', ...
--       WHERE created_at < NOW() - INTERVAL '180 days' AND von_email <> 'redacted@deleted.local'
--   3b) DELETE FROM pastler_emails WHERE created_at < NOW() - INTERVAL '365 days'
--   3c) UPDATE pastler_todos SET beschreibung=NULL
--       WHERE status='erledigt' AND created_at < NOW() - INTERVAL '365 days'
