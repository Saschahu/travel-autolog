-- Add expenses_list field to jobs table for structured expense tracking
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS expenses_list JSONB DEFAULT '[]'::jsonb;