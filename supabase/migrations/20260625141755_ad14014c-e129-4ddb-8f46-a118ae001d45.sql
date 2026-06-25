
DROP POLICY IF EXISTS "Teachers and admins can view gollanma" ON public.gollanma;
CREATE POLICY "All signed-in users can view gollanma"
ON public.gollanma FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "Teachers and admins can read gollanma files" ON storage.objects;
CREATE POLICY "All signed-in users can read gollanma files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'gollanma');
