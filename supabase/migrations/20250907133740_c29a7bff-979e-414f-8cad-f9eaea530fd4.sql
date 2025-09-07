-- Add missing reports column to jobs for daily report persistence
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'jobs' 
      AND column_name = 'reports'
  ) THEN
    ALTER TABLE public.jobs
      ADD COLUMN reports jsonb; -- nullable on purpose; frontend initializes when missing
    COMMENT ON COLUMN public.jobs.reports IS 'Array of DayReport objects for per-day report texts';
  END IF;
END $$;