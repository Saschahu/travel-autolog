-- Create jobs table for storing job/customer data
CREATE TABLE public.jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  customer_name TEXT NOT NULL,
  customer_address TEXT,
  evatic_no TEXT,
  manufacturer TEXT,
  model TEXT,
  serial_number TEXT,
  work_performed TEXT,
  hotel_name TEXT,
  hotel_address TEXT,
  hotel_nights INTEGER DEFAULT 0,
  kilometers_outbound INTEGER DEFAULT 0,
  kilometers_return INTEGER DEFAULT 0,
  toll_amount DECIMAL(10,2) DEFAULT 0,
  travel_start_time TIME,
  travel_start_date DATE,
  travel_end_time TIME,
  travel_end_date DATE,
  work_start_time TIME,
  work_start_date DATE,
  work_end_time TIME,
  work_end_date DATE,
  departure_start_time TIME,
  departure_start_date DATE,
  departure_end_time TIME,
  departure_end_date DATE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'active', 'completed', 'completed-sent', 'pending')),
  estimated_days INTEGER DEFAULT 1,
  current_day INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own jobs" 
ON public.jobs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own jobs" 
ON public.jobs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own jobs" 
ON public.jobs 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own jobs" 
ON public.jobs 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_jobs_updated_at
BEFORE UPDATE ON public.jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();