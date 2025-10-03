-- Add expenses field to jobs table for tracking tools and consumables
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS expenses TEXT;