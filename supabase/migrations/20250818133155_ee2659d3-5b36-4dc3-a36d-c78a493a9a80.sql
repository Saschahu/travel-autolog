-- Add days_data JSONB column to store per-day time entries and ensure it's an array
ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS days_data jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Ensure existing rows are arrays (in case column existed nullable somewhere)
UPDATE public.jobs SET days_data = '[]'::jsonb WHERE days_data IS NULL;

-- Add a check constraint to ensure it stays an array
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.check_constraints c
    JOIN information_schema.table_constraints t
      ON t.constraint_name = c.constraint_name
     AND t.table_schema = c.constraint_schema
    WHERE t.table_schema = 'public'
      AND t.table_name = 'jobs'
      AND t.constraint_type = 'CHECK'
      AND c.constraint_name = 'jobs_days_data_is_array'
  ) THEN
    ALTER TABLE public.jobs
      ADD CONSTRAINT jobs_days_data_is_array CHECK (jsonb_typeof(days_data) = 'array');
  END IF;
END $$;