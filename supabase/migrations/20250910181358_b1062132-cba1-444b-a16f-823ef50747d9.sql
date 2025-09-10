-- Add hotel price field to jobs table
ALTER TABLE public.jobs ADD COLUMN hotel_price numeric DEFAULT 0;