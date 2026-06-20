-- Pastler Dashboard — CLAUDE RLS policies (Eigentümer + Mitarbeiter)
-- Applies to pastler_* tables on shared Supabase with Haller

-- Eigentümer policies (filtered by eigentuemer_email)
DROP POLICY IF EXISTS "eigentümer_pastler_inserate" ON public.pastler_inserate;
CREATE POLICY "eigentümer_pastler_inserate" ON public.pastler_inserate
  FOR ALL TO authenticated
  USING (eigentuemer_email = auth.email());

DROP POLICY IF EXISTS "eigentümer_pastler_mieter" ON public.pastler_mieter;
CREATE POLICY "eigentümer_pastler_mieter" ON public.pastler_mieter
  FOR ALL TO authenticated
  USING (
    inserat_id IN (
      SELECT id FROM public.pastler_inserate WHERE eigentuemer_email = auth.email()
    )
  );

DROP POLICY IF EXISTS "eigentümer_pastler_todos" ON public.pastler_todos;
CREATE POLICY "eigentümer_pastler_todos" ON public.pastler_todos
  FOR ALL TO authenticated
  USING (
    inserat_id IN (
      SELECT id FROM public.pastler_inserate WHERE eigentuemer_email = auth.email()
    )
  );

-- Mitarbeiter policies (full access via app_metadata.role)
DROP POLICY IF EXISTS "mitarbeiter_pastler_inserate" ON public.pastler_inserate;
CREATE POLICY "mitarbeiter_pastler_inserate" ON public.pastler_inserate
  FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'mitarbeiter');

DROP POLICY IF EXISTS "mitarbeiter_pastler_mieter" ON public.pastler_mieter;
CREATE POLICY "mitarbeiter_pastler_mieter" ON public.pastler_mieter
  FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'mitarbeiter');

DROP POLICY IF EXISTS "mitarbeiter_pastler_todos" ON public.pastler_todos;
CREATE POLICY "mitarbeiter_pastler_todos" ON public.pastler_todos
  FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'mitarbeiter');

-- pastler_emails: NO authenticated policy — service role only (n8n)
