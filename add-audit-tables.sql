-- Run BOTH of these in Supabase SQL Editor

-- 1. Audit trail (field-level change history on checklists)
CREATE TABLE IF NOT EXISTS public.audit_trail (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  checklist_id uuid NOT NULL,
  user_id uuid,
  username text NOT NULL,
  field_id text,
  field_label text,
  section text,
  change_type text NOT NULL,
  old_value text,
  new_value text,
  created_at timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_trail_checklist ON public.audit_trail(checklist_id, created_at DESC);

-- 2. Activity log (already created if you ran the previous SQL)
CREATE TABLE IF NOT EXISTS public.activity_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  username text NOT NULL,
  action_type text NOT NULL,
  detail text DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON public.activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON public.activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_action_type ON public.activity_log(action_type);

-- 3. Add twofa_enabled column to users table (admin 2FA flag)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS twofa_enabled boolean DEFAULT true;
