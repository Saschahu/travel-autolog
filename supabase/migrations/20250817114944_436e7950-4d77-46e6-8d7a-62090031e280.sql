-- Temporarily disable RLS for testing purposes
-- Create a policy that allows anonymous access for testing
CREATE POLICY "Allow anonymous access for testing" 
ON public.jobs 
FOR ALL 
USING (true) 
WITH CHECK (true);