-- Remove broad staff policies (USING true) so Eigentümer RLS filtering works.
-- Mitarbeiter access via app_metadata.role = 'mitarbeiter' remains.

DROP POLICY IF EXISTS "staff_select_pastler_inserate" ON public.pastler_inserate;
DROP POLICY IF EXISTS "staff_insert_pastler_inserate" ON public.pastler_inserate;
DROP POLICY IF EXISTS "staff_update_pastler_inserate" ON public.pastler_inserate;

DROP POLICY IF EXISTS "staff_select_pastler_mieter" ON public.pastler_mieter;
DROP POLICY IF EXISTS "staff_insert_pastler_mieter" ON public.pastler_mieter;
DROP POLICY IF EXISTS "staff_update_pastler_mieter" ON public.pastler_mieter;

DROP POLICY IF EXISTS "staff_select_pastler_todos" ON public.pastler_todos;
DROP POLICY IF EXISTS "staff_insert_pastler_todos" ON public.pastler_todos;
DROP POLICY IF EXISTS "staff_update_pastler_todos" ON public.pastler_todos;
