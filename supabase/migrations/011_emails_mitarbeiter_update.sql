-- Mitarbeiter may update email Zuordnung (manual assignment in dashboard)

DROP POLICY IF EXISTS "mitarbeiter_update_pastler_emails" ON public.pastler_emails;
CREATE POLICY "mitarbeiter_update_pastler_emails" ON public.pastler_emails
  FOR UPDATE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'mitarbeiter')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'mitarbeiter');
