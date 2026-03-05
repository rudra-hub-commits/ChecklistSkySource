-- Run this in Supabase SQL Editor to enable the Activity Log tab
-- Dashboard → SQL Editor → New Query → paste → Run

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
