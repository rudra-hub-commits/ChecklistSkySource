-- ══════════════════════════════════════════════════════════════
-- RUN THIS if your DB already exists (tables already created)
-- Supabase → SQL Editor → Run
-- ══════════════════════════════════════════════════════════════

-- 1. Drop old role constraint and add new one with master_admin
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('master_admin', 'admin', 'user'));

-- 2. Create activity_log if missing
CREATE TABLE IF NOT EXISTS public.activity_log (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid,
  username    text        NOT NULL,
  action_type text        NOT NULL,
  detail      text        DEFAULT '{}',
  created_at  timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at  ON public.activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id     ON public.activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_action_type ON public.activity_log(action_type);
ALTER TABLE public.activity_log DISABLE ROW LEVEL SECURITY;

-- 3. Create audit_trail if missing
CREATE TABLE IF NOT EXISTS public.audit_trail (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id bigint      NOT NULL,
  user_id      uuid,
  username     text        NOT NULL,
  field_id     text,
  field_label  text,
  section      text,
  change_type  text        NOT NULL,
  old_value    text,
  new_value    text,
  created_at   timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_trail_checklist ON public.audit_trail(checklist_id, created_at DESC);
ALTER TABLE public.audit_trail DISABLE ROW LEVEL SECURITY;

-- 4. Promote Rudra to master_admin (change username if yours is different)
UPDATE public.users SET role = 'master_admin' WHERE username = 'Rudra';

-- Verify:
SELECT username, role FROM public.users ORDER BY created_at;
