import { supabase } from '@/integrations/supabase/client';

export async function removeDuplicateSeptember10th() {
  try {
    // Get the specific job with duplicate entries
    const { data: job, error: fetchError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', '0b1a69b5-b80b-475c-84ee-b5ed6a6c32ae')
      .single();

    if (fetchError) throw fetchError;
    
    if (!job || !Array.isArray(job.days_data)) {
      console.log('No job found or invalid days_data');
      return;
    }

    // Filter out the duplicate entry (day:5 with date:2025-09-10)
    const filteredDaysData = job.days_data.filter((day: any) => {
      // Keep all entries except the duplicate one (day:5 AND date:2025-09-10)
      if (day.date === '2025-09-10' && day.day === 5) {
        return false; // Remove this duplicate entry
      }
      return true; // Keep all other entries
    });

    // Update the job with cleaned data
    const { error: updateError } = await supabase
      .from('jobs')
      .update({ days_data: filteredDaysData })
      .eq('id', '0b1a69b5-b80b-475c-84ee-b5ed6a6c32ae');

    if (updateError) throw updateError;
    
    console.log('Successfully removed duplicate September 10th entry');
    return true;
  } catch (error) {
    console.error('Error fixing duplicate entry:', error);
    return false;
  }
}
