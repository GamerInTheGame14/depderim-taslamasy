CREATE TABLE public.shared_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Atsyz',
  blocks JSONB NOT NULL DEFAULT '[]'::jsonb,
  access TEXT NOT NULL CHECK (access IN ('read','write')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.shared_notes TO authenticated;
GRANT SELECT ON public.shared_notes TO anon;
GRANT ALL ON public.shared_notes TO service_role;

ALTER TABLE public.shared_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view shared notes"
  ON public.shared_notes FOR SELECT
  USING (true);

CREATE POLICY "Owner can insert shared notes"
  ON public.shared_notes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owner or write-access can update"
  ON public.shared_notes FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id OR access = 'write')
  WITH CHECK (auth.uid() = owner_id OR access = 'write');

CREATE POLICY "Owner can delete shared notes"
  ON public.shared_notes FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_shared_notes_updated_at
  BEFORE UPDATE ON public.shared_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();