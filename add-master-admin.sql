-- ══════════════════════════════════════════════════════════════
-- SKY SOURCE — Master Admin + Email OTP Migration
-- Run this in Supabase → SQL Editor → Run
-- ══════════════════════════════════════════════════════════════

-- 1. Add master_admin to the allowed roles
ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE public.users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('master_admin', 'admin', 'user'));

-- 2. Add twofa_enabled column if not already there
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS twofa_enabled boolean DEFAULT false;

-- 3. Promote the first admin (Rudra) to master_admin
--    Change 'Rudra' to your actual master admin username if different
UPDATE public.users
  SET role = 'master_admin', twofa_enabled = true
  WHERE username = 'Rudra';

-- 4. OTP table for email-based 2FA codes
CREATE TABLE IF NOT EXISTS public.otp_codes (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  code       text NOT NULL,
  expires_at timestamptz NOT NULL,
  used       boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_otp_codes_user_id ON public.otp_codes(user_id);
ALTER TABLE public.otp_codes DISABLE ROW LEVEL SECURITY;

-- 5. Also create audit + activity tables if not present (idempotent)
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

-- Done!
-- After running this, add these to your .env.local:
--   SMTP_HOST=smtp.gmail.com
--   SMTP_PORT=587
--   SMTP_USER=your@gmail.com
--   SMTP_PASS=your_app_password
--   SMTP_FROM=SkySource <your@gmail.com>
