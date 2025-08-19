import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GPSSession, GPSEvent } from '@/types/gps-events';
import { useToast } from '@/hooks/use-toast';

interface SupabaseGPSSession {
  id: string;
  user_id: string;
  date: string;
  job_id?: string;
  events: any;
  totals: any;
  start_timestamp?: string;
  end_timestamp?: string;
  created_at: string;
  updated_at: string;
}

export const useSupabaseGPS = () => {
  const { toast } = useToast();

  const saveSession = useCallback(async (session: GPSSession, jobId?: string): Promise<boolean> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast({
          title: 'Fehler',
          description: 'Benutzer nicht angemeldet',
          variant: 'destructive'
        });
        return false;
      }

      // Prepare events data for Supabase
      const eventsData = session.events.map(event => ({
        id: event.id,
        timestamp: event.timestamp.toISOString(),
        type: event.type,
        location: {
          latitude: event.location.latitude,
          longitude: event.location.longitude,
          timestamp: event.location.timestamp.toISOString(),
          accuracy: event.location.accuracy,
          speed: event.location.speed,
          heading: event.location.heading
        },
        note: event.note,
        customer: event.customer
      }));

      const { error } = await supabase
        .from('gps_sessions')
        .upsert({
          id: session.id,
          user_id: userData.user.id,
          date: session.date,
          job_id: jobId || null,
          events: eventsData,
          totals: session.totals,
          start_timestamp: session.startTimestamp?.toISOString(),
          end_timestamp: session.endTimestamp?.toISOString()
        }, {
          onConflict: 'id'
        });

      if (error) {
        console.error('Error saving GPS session:', error);
        toast({
          title: 'Fehler',
          description: 'Session konnte nicht gespeichert werden',
          variant: 'destructive'
        });
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in saveSession:', error);
      toast({
        title: 'Fehler', 
        description: 'Unerwarteter Fehler beim Speichern',
        variant: 'destructive'
      });
      return false;
    }
  }, [toast]);

  const loadSession = useCallback(async (date: string): Promise<GPSSession | null> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return null;

      const { data, error } = await supabase
        .from('gps_sessions')
        .select('*')
        .eq('user_id', userData.user.id)
        .eq('date', date)
        .single();

      if (error) {
        if (error.code !== 'PGRST116') { // Not found error
          console.error('Error loading GPS session:', error);
        }
        return null;
      }

      if (!data) return null;

      // Convert Supabase data back to GPSSession format
      const session: GPSSession = {
        id: data.id,
        date: data.date,
        events: Array.isArray(data.events) ? data.events.map((event: any) => ({
          id: event.id,
          timestamp: new Date(event.timestamp),
          type: event.type,
          location: {
            latitude: event.location.latitude,
            longitude: event.location.longitude,
            timestamp: new Date(event.location.timestamp),
            accuracy: event.location.accuracy,
            speed: event.location.speed,
            heading: event.location.heading
          },
          note: event.note,
          customer: event.customer
        })) : [],
        totals: typeof data.totals === 'object' && data.totals !== null 
          ? data.totals as { travelTime: number; workTime: number; returnTime: number; }
          : { travelTime: 0, workTime: 0, returnTime: 0 },
        startTimestamp: data.start_timestamp ? new Date(data.start_timestamp) : undefined,
        endTimestamp: data.end_timestamp ? new Date(data.end_timestamp) : undefined
      };

      return session;
    } catch (error) {
      console.error('Error in loadSession:', error);
      return null;
    }
  }, []);

  const deleteSession = useCallback(async (sessionId: string): Promise<boolean> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return false;

      const { error } = await supabase
        .from('gps_sessions')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', userData.user.id);

      if (error) {
        console.error('Error deleting GPS session:', error);
        toast({
          title: 'Fehler',
          description: 'Session konnte nicht gelöscht werden',
          variant: 'destructive'
        });
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteSession:', error);
      return false;
    }
  }, [toast]);

  const linkSessionToJob = useCallback(async (sessionId: string, jobId: string): Promise<boolean> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return false;

      const { error } = await supabase
        .from('gps_sessions')
        .update({ job_id: jobId })
        .eq('id', sessionId)
        .eq('user_id', userData.user.id);

      if (error) {
        console.error('Error linking session to job:', error);
        toast({
          title: 'Fehler',
          description: 'Session konnte nicht mit Job verknüpft werden',
          variant: 'destructive'
        });
        return false;
      }

      toast({
        title: 'Erfolg',
        description: 'GPS-Session mit Job verknüpft'
      });
      return true;
    } catch (error) {
      console.error('Error in linkSessionToJob:', error);
      return false;
    }
  }, [toast]);

  const getSessionsForJob = useCallback(async (jobId: string): Promise<GPSSession[]> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return [];

      const { data, error } = await supabase
        .from('gps_sessions')
        .select('*')
        .eq('user_id', userData.user.id)
        .eq('job_id', jobId)
        .order('date', { ascending: true });

      if (error) {
        console.error('Error getting sessions for job:', error);
        return [];
      }

      return data.map((sessionData: SupabaseGPSSession) => ({
        id: sessionData.id,
        date: sessionData.date,
        events: Array.isArray(sessionData.events) ? sessionData.events.map((event: any) => ({
          id: event.id,
          timestamp: new Date(event.timestamp),
          type: event.type,
          location: {
            latitude: event.location.latitude,
            longitude: event.location.longitude,
            timestamp: new Date(event.location.timestamp),
            accuracy: event.location.accuracy,
            speed: event.location.speed,
            heading: event.location.heading
          },
          note: event.note,
          customer: event.customer
        })) : [],
        totals: typeof sessionData.totals === 'object' && sessionData.totals !== null
          ? sessionData.totals as { travelTime: number; workTime: number; returnTime: number; }
          : { travelTime: 0, workTime: 0, returnTime: 0 },
        startTimestamp: sessionData.start_timestamp ? new Date(sessionData.start_timestamp) : undefined,
        endTimestamp: sessionData.end_timestamp ? new Date(sessionData.end_timestamp) : undefined
      }));
    } catch (error) {
      console.error('Error in getSessionsForJob:', error);
      return [];
    }
  }, []);

  const getOpenJobs = useCallback(async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return [];

      const { data, error } = await supabase
        .from('jobs')
        .select('id, customer_name, status, created_at')
        .eq('user_id', userData.user.id)
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting open jobs:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getOpenJobs:', error);
      return [];
    }
  }, []);

  return {
    saveSession,
    loadSession,
    deleteSession,
    linkSessionToJob,
    getSessionsForJob,
    getOpenJobs
  };
};