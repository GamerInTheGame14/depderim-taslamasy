
-- 1) Teacher → student note shares
CREATE TABLE public.teacher_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL,
  student_id UUID NOT NULL,
  source_note_id UUID,
  note_title TEXT NOT NULL,
  course_name TEXT,
  blocks JSONB NOT NULL DEFAULT '[]'::jsonb,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teacher_shares TO authenticated;
GRANT ALL ON public.teacher_shares TO service_role;
ALTER TABLE public.teacher_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teacher manages own outgoing shares"
  ON public.teacher_shares FOR ALL TO authenticated
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid() AND public.has_role(auth.uid(), 'teacher'));

CREATE POLICY "Student reads received shares"
  ON public.teacher_shares FOR SELECT TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Student marks received shares as read"
  ON public.teacher_shares FOR UPDATE TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Admin reads all shares"
  ON public.teacher_shares FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX teacher_shares_student_idx ON public.teacher_shares (student_id, read_at);
CREATE INDEX teacher_shares_teacher_idx ON public.teacher_shares (teacher_id, created_at DESC);

-- 2) Tie submissions to the chosen teacher's term/course + add read_at
ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS teacher_term_id UUID,
  ADD COLUMN IF NOT EXISTS teacher_course_id UUID,
  ADD COLUMN IF NOT EXISTS teacher_term_name TEXT,
  ADD COLUMN IF NOT EXISTS teacher_course_name TEXT,
  ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- 3) Let students browse a teacher's seasons & lessons for categorization
CREATE POLICY "Anyone authenticated views teacher terms"
  ON public.terms FOR SELECT TO authenticated
  USING (public.has_role(user_id, 'teacher'));

CREATE POLICY "Anyone authenticated views teacher courses"
  ON public.courses FOR SELECT TO authenticated
  USING (public.has_role(user_id, 'teacher'));

-- 4) Admin oversight on submissions & grades
CREATE POLICY "Admin reads all submissions"
  ON public.submissions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin reads all grades"
  ON public.grades FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
