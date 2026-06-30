-- Drop Rückmeldung-Watches (feature removed from dashboard)

DROP TRIGGER IF EXISTS trg_pastler_resolve_rueckmeldung_watch ON public.pastler_emails;
DROP FUNCTION IF EXISTS public.pastler_resolve_rueckmeldung_watch();
DROP TABLE IF EXISTS public.pastler_rueckmeldung_watches;
