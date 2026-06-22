-- Eigentümer: read-only (SELECT). Writes remain Mitarbeiter-only via mitarbeiter_* policies.

DROP POLICY IF EXISTS "eigentümer_pastler_inserate" ON public.pastler_inserate;
CREATE POLICY "eigentümer_select_pastler_inserate" ON public.pastler_inserate
  FOR SELECT TO authenticated
  USING (eigentuemer_email = auth.email());

DROP POLICY IF EXISTS "eigentümer_pastler_mieter" ON public.pastler_mieter;
CREATE POLICY "eigentümer_select_pastler_mieter" ON public.pastler_mieter
  FOR SELECT TO authenticated
  USING (
    inserat_id IN (
      SELECT id FROM public.pastler_inserate WHERE eigentuemer_email = auth.email()
    )
  );

DROP POLICY IF EXISTS "eigentümer_pastler_todos" ON public.pastler_todos;
CREATE POLICY "eigentümer_select_pastler_todos" ON public.pastler_todos
  FOR SELECT TO authenticated
  USING (
    inserat_id IN (
      SELECT id FROM public.pastler_inserate WHERE eigentuemer_email = auth.email()
    )
  );
