-- Add work_report column to jobs table for final job report
ALTER TABLE public.jobs 
ADD COLUMN work_report TEXT;