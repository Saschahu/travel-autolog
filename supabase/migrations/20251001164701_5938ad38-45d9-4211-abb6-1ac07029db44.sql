-- Add addons column to jobs table for special equipment
ALTER TABLE public.jobs 
ADD COLUMN addons TEXT;