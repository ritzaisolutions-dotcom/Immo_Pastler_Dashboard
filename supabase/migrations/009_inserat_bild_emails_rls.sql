-- Inserat profile image + Mitarbeiter email read + Storage bucket

ALTER TABLE public.pastler_inserate
  ADD COLUMN IF NOT EXISTS bild_url TEXT;

COMMENT ON COLUMN public.pastler_inserate.bild_url IS
  'Public URL to image in storage bucket pastler-inserate';

-- Mitarbeiter may read emails (Eigentümer: no policy → no access)
DROP POLICY IF EXISTS "mitarbeiter_select_pastler_emails" ON public.pastler_emails;
CREATE POLICY "mitarbeiter_select_pastler_emails" ON public.pastler_emails
  FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'mitarbeiter');

-- Storage bucket for inserat photos (public read for next/image URLs)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pastler-inserate',
  'pastler-inserate',
  true,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "mitarbeiter_insert_pastler_inserate_storage" ON storage.objects;
CREATE POLICY "mitarbeiter_insert_pastler_inserate_storage" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'pastler-inserate'
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'mitarbeiter'
  );

DROP POLICY IF EXISTS "mitarbeiter_update_pastler_inserate_storage" ON storage.objects;
CREATE POLICY "mitarbeiter_update_pastler_inserate_storage" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'pastler-inserate'
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'mitarbeiter'
  );

DROP POLICY IF EXISTS "mitarbeiter_delete_pastler_inserate_storage" ON storage.objects;
CREATE POLICY "mitarbeiter_delete_pastler_inserate_storage" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'pastler-inserate'
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'mitarbeiter'
  );

DROP POLICY IF EXISTS "public_read_pastler_inserate_storage" ON storage.objects;
CREATE POLICY "public_read_pastler_inserate_storage" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'pastler-inserate');
