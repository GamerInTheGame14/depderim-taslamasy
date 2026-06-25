
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill profiles
INSERT INTO public.profiles (id, email, display_name)
SELECT u.id, u.email, COALESCE(u.raw_user_meta_data->>'display_name', split_part(u.email,'@',1))
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- Backfill roles: first user (oldest) = admin, rest = student
WITH ordered AS (
  SELECT u.id, ROW_NUMBER() OVER (ORDER BY u.created_at) AS rn
  FROM auth.users u
  LEFT JOIN public.user_roles ur ON ur.user_id = u.id
  WHERE ur.user_id IS NULL
)
INSERT INTO public.user_roles (user_id, role)
SELECT id, CASE WHEN rn = 1 AND NOT EXISTS (SELECT 1 FROM public.user_roles) THEN 'admin'::app_role ELSE 'student'::app_role END
FROM ordered;
