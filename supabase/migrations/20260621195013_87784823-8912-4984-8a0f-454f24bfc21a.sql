
-- Attach the new-user trigger so signups always get a profile + role
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill profiles for existing auth.users
INSERT INTO public.profiles (id, email, display_name)
SELECT u.id, u.email, COALESCE(u.raw_user_meta_data->>'display_name', split_part(u.email,'@',1))
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id);

-- Backfill roles: first signup becomes admin, rest become students
DO $$
DECLARE
  r RECORD;
  is_first BOOLEAN;
BEGIN
  is_first := NOT EXISTS (SELECT 1 FROM public.user_roles);
  FOR r IN SELECT u.id FROM auth.users u
           WHERE NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = u.id)
           ORDER BY u.created_at
  LOOP
    INSERT INTO public.user_roles (user_id, role)
    VALUES (r.id, CASE WHEN is_first THEN 'admin'::app_role ELSE 'student'::app_role END);
    is_first := FALSE;
  END LOOP;
END $$;
