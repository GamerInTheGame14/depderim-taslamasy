
CREATE TABLE public.gollanma (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  pdf_path TEXT NOT NULL,
  page_count INT NOT NULL DEFAULT 0,
  outline JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.gollanma TO authenticated;
GRANT ALL ON public.gollanma TO service_role;

ALTER TABLE public.gollanma ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers and admins can view gollanma"
ON public.gollanma FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers and admins can insert their own gollanma"
ON public.gollanma FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = owner_id
  AND (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Owners and admins can update gollanma"
ON public.gollanma FOR UPDATE TO authenticated
USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owners and admins can delete gollanma"
ON public.gollanma FOR DELETE TO authenticated
USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_gollanma_updated_at
BEFORE UPDATE ON public.gollanma
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage policies on the private 'gollanma' bucket
CREATE POLICY "Teachers and admins can read gollanma files"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'gollanma'
  AND (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Teachers and admins can upload gollanma files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'gollanma'
  AND (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Teachers and admins can delete gollanma files"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'gollanma'
  AND (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'))
);
