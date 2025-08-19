-- Create GPS sessions table
CREATE TABLE public.gps_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  job_id UUID REFERENCES public.jobs(id),
  events JSONB NOT NULL DEFAULT '[]'::jsonb,
  totals JSONB NOT NULL DEFAULT '{"travelTime": 0, "workTime": 0, "returnTime": 0}'::jsonb,
  start_timestamp TIMESTAMP WITH TIME ZONE,
  end_timestamp TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gps_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for GPS sessions
CREATE POLICY "Users can view their own GPS sessions" 
ON public.gps_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own GPS sessions" 
ON public.gps_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own GPS sessions" 
ON public.gps_sessions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own GPS sessions" 
ON public.gps_sessions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_gps_sessions_user_date ON public.gps_sessions(user_id, date);
CREATE INDEX idx_gps_sessions_job_id ON public.gps_sessions(job_id);

-- Create function to automatically update job timestamps from GPS events
CREATE OR REPLACE FUNCTION public.sync_gps_to_job()
RETURNS TRIGGER AS $$
DECLARE
  session_events JSONB;
  first_event JSONB;
  last_event JSONB;
  work_start_event JSONB;
  work_end_event JSONB;
BEGIN
  -- Only proceed if job_id is set
  IF NEW.job_id IS NULL THEN
    RETURN NEW;
  END IF;

  session_events := NEW.events;
  
  -- Find relevant events
  SELECT event INTO first_event 
  FROM jsonb_array_elements(session_events) AS event
  WHERE event->>'type' IN ('HOME_LEAVE', 'WORK_SELECTED')
  ORDER BY (event->>'timestamp')::timestamp
  LIMIT 1;
  
  SELECT event INTO work_start_event 
  FROM jsonb_array_elements(session_events) AS event
  WHERE event->>'type' = 'AT_CUSTOMER_START'
  ORDER BY (event->>'timestamp')::timestamp
  LIMIT 1;
  
  SELECT event INTO work_end_event 
  FROM jsonb_array_elements(session_events) AS event
  WHERE event->>'type' IN ('AT_CUSTOMER_END', 'WORK_DONE')
  ORDER BY (event->>'timestamp')::timestamp DESC
  LIMIT 1;
  
  SELECT event INTO last_event 
  FROM jsonb_array_elements(session_events) AS event
  WHERE event->>'type' = 'HOME_ARRIVAL_CONFIRMED'
  ORDER BY (event->>'timestamp')::timestamp DESC
  LIMIT 1;

  -- Update job with GPS-derived timestamps
  UPDATE public.jobs SET
    travel_start_date = CASE 
      WHEN first_event IS NOT NULL THEN (first_event->>'timestamp')::timestamp::date 
      ELSE travel_start_date 
    END,
    travel_start_time = CASE 
      WHEN first_event IS NOT NULL THEN (first_event->>'timestamp')::timestamp::time 
      ELSE travel_start_time 
    END,
    work_start_date = CASE 
      WHEN work_start_event IS NOT NULL THEN (work_start_event->>'timestamp')::timestamp::date 
      ELSE work_start_date 
    END,
    work_start_time = CASE 
      WHEN work_start_event IS NOT NULL THEN (work_start_event->>'timestamp')::timestamp::time 
      ELSE work_start_time 
    END,
    work_end_date = CASE 
      WHEN work_end_event IS NOT NULL THEN (work_end_event->>'timestamp')::timestamp::date 
      ELSE work_end_date 
    END,
    work_end_time = CASE 
      WHEN work_end_event IS NOT NULL THEN (work_end_event->>'timestamp')::timestamp::time 
      ELSE work_end_time 
    END,
    travel_end_date = CASE 
      WHEN last_event IS NOT NULL THEN (last_event->>'timestamp')::timestamp::date 
      ELSE travel_end_date 
    END,
    travel_end_time = CASE 
      WHEN last_event IS NOT NULL THEN (last_event->>'timestamp')::timestamp::time 
      ELSE travel_end_time 
    END,
    updated_at = now()
  WHERE id = NEW.job_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic job sync
CREATE TRIGGER sync_gps_to_job_trigger
  AFTER INSERT OR UPDATE ON public.gps_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_gps_to_job();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_gps_sessions_updated_at
  BEFORE UPDATE ON public.gps_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();