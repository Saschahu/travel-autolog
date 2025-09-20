import { supabase } from '@/integrations/supabase/client';

interface DayData {
  date?: string;
  travelStart?: string;
  travelEnd?: string;
  workStart?: string;
  workEnd?: string;
  departureStart?: string;
  departureEnd?: string;
  note?: string;
}

function isEmptyDay(day: DayData): boolean {
  const hasValidTimes =
    (day.travelStart && day.travelEnd && day.travelStart !== '00:00' && day.travelEnd !== '00:00') ||
    (day.workStart && day.workEnd && day.workStart !== '00:00' && day.workEnd !== '00:00') ||
    (day.departureStart && day.departureEnd && day.departureStart !== '00:00' && day.departureEnd !== '00:00');
  const hasNote = Boolean(day.note && String(day.note).trim().length > 0);
  return !(hasValidTimes || hasNote);
}

export async function removeDuplicateSeptember10th(jobId: string) {
  try {
    // Load the job's days_data
    const { data: job, error: fetchError } = await supabase
      .from('jobs')
      .select('id, days_data')
      .eq('id', jobId)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (!job || !Array.isArray(job.days_data)) {
      console.log('No job found or invalid days_data');
      return false;
    }

    const targetDate = '2025-09-10';
    const days = job.days_data as DayData[];

    // If there's 0 or 1 entries for the target date, nothing to do
    const duplicatesCount = days.filter((d) => d?.date === targetDate).length;
    if (duplicatesCount <= 1) {
      return true;
    }

    // Keep one entry for 2025-09-10: prefer the first non-empty, otherwise keep the first
    const hasNonEmpty = days.some((d) => d?.date === targetDate && !isEmptyDay(d));
    let keptNonEmpty = false;
    let keptAny = false;

    const filteredDaysData = days.filter((d) => {
      if (d?.date !== targetDate) return true;

      if (hasNonEmpty) {
        if (!isEmptyDay(d) && !keptNonEmpty) {
          keptNonEmpty = true; // keep the first non-empty entry
          return true;
        }
        return false; // drop other entries for the same date
      } else {
        if (!keptAny) {
          keptAny = true; // keep the first (all are empty)
          return true;
        }
        return false; // drop the rest
      }
    });

    // Update the job with cleaned data
    const { error: updateError } = await supabase
      .from('jobs')
      .update({ days_data: filteredDaysData })
      .eq('id', jobId);

    if (updateError) throw updateError;

    console.log('Successfully removed duplicate September 10th entry');
    return true;
  } catch (error) {
    console.error('Error fixing duplicate entry:', error);
    return false;
  }
}
