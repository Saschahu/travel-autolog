import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type Job = {
  id: string;
  customerName: string;
  status: 'open' | 'active' | 'completed' | 'completed-sent' | 'pending';
  startDate: Date;
  estimatedDays?: number;
  currentDay?: number;
  workStartTime?: string;
  workEndTime?: string;
  totalHours?: number | string;
  days?: any[];
  customerAddress?: string;
  contactName?: string;
  contactPhone?: string;
  evaticNo?: string;
  // Zeit-Felder mit Datum
  travelStart?: string;
  travelStartDate?: string;
  travelEnd?: string;
  travelEndDate?: string;
  workStart?: string;
  workStartDate?: string;
  workEnd?: string;
  workEndDate?: string;
  departureStart?: string;
  departureStartDate?: string;
  departureEnd?: string;
  departureEndDate?: string;
  // Weitere Felder
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  workPerformed?: string;
  hotelName?: string;
  hotelAddress?: string;
  hotelNights?: number;
  kilometersOutbound?: number;
  kilometersReturn?: number;
  tollAmount?: number;
  workReport?: string;
};

export const useJobs = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchJobs = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Fetching jobs for user:', user?.id || 'no user');
      
      if (!user) {
        console.log('User not authenticated');
        setJobs([]);
        return;
      }

      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedJobs: Job[] = data.map(job => ({
        id: job.id,
        customerName: job.customer_name,
        status: job.status as 'open' | 'active' | 'completed' | 'completed-sent' | 'pending',
        startDate: new Date(job.created_at),
        estimatedDays: job.estimated_days,
        currentDay: job.current_day,
        workStartTime: job.work_start_time,
        workEndTime: job.work_end_time,
        totalHours: '0h 0m', // Calculated later
        days: Array.isArray(job.days_data) ? job.days_data : [],
        customerAddress: job.customer_address,
        contactName: undefined, // Will be added when database is updated
        contactPhone: undefined, // Will be added when database is updated
        evaticNo: job.evatic_no,
        // Add all time fields from database
        travelStart: job.travel_start_time,
        travelStartDate: job.travel_start_date,
        travelEnd: job.travel_end_time,
        travelEndDate: job.travel_end_date,
        workStart: job.work_start_time,
        workStartDate: job.work_start_date,
        workEnd: job.work_end_time,
        workEndDate: job.work_end_date,
        departureStart: job.departure_start_time,
        departureStartDate: job.departure_start_date,
        departureEnd: job.departure_end_time,
        departureEndDate: job.departure_end_date,
        // Add other fields that might be missing
        manufacturer: job.manufacturer,
        model: job.model,
        serialNumber: job.serial_number,
        workPerformed: job.work_performed,
        hotelName: job.hotel_name,
        hotelAddress: job.hotel_address,
        hotelNights: job.hotel_nights,
        kilometersOutbound: job.kilometers_outbound,
        kilometersReturn: job.kilometers_return,
        tollAmount: job.toll_amount,
        workReport: job.work_report
      }));

      setJobs(transformedJobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast({
        title: 'Fehler',
        description: 'Fehler beim Laden der Jobs',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const refreshJobs = useCallback(() => {
    fetchJobs();
  }, [fetchJobs]);

  return {
    jobs,
    isLoading,
    fetchJobs,
    refreshJobs,
    setJobs
  };
};