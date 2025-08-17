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
  evaticNo?: string;
};

export const useJobs = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchJobs = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('User not authenticated');
        setJobs([]);
        return;
      }

      const { data, error } = await supabase
        .from('jobs')
        .select('*')
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
        days: [],
        customerAddress: job.customer_address,
        evaticNo: job.evatic_no
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