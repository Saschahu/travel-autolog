import { Briefcase, Link } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSupabaseGPS } from '@/hooks/useSupabaseGPS';

interface JobLinkDialogProps {
  sessionId: string;
  currentJobId?: string;
  onJobLinked: (jobId: string) => void;
}

interface Job {
  id: string;
  customer_name: string;
  status: string;
  created_at: string;
}

export const JobLinkDialog: React.FC<JobLinkDialogProps> = ({
  sessionId,
  currentJobId,
  onJobLinked
}) => {
  const [open, setOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string>(currentJobId || '');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  
  const { linkSessionToJob, getOpenJobs } = useSupabaseGPS();

  useEffect(() => {
    if (open) {
      loadJobs();
    }
  }, [open]);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const openJobs = await getOpenJobs();
      setJobs(openJobs);
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkJob = async () => {
    if (!selectedJobId) return;

    const success = await linkSessionToJob(sessionId, selectedJobId);
    if (success) {
      onJobLinked(selectedJobId);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Link className="h-4 w-4 mr-2" />
          {currentJobId ? 'Job ändern' : 'Mit Job verknüpfen'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            GPS-Session mit Job verknüpfen
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {currentJobId && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="text-sm text-muted-foreground">Aktuell verknüpft mit:</div>
              <Badge variant="secondary" className="mt-1">
                Job ID: {currentJobId}
              </Badge>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Job auswählen:</label>
            <Select 
              value={selectedJobId} 
              onValueChange={setSelectedJobId}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder={loading ? "Lade Jobs..." : "Job auswählen"} />
              </SelectTrigger>
              <SelectContent>
                {jobs.map((job) => (
                  <SelectItem key={job.id} value={job.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{job.customer_name}</span>
                      <Badge variant="outline" className="ml-2">
                        {job.status}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
                {jobs.length === 0 && !loading && (
                  <SelectItem value="" disabled>
                    Keine offenen Jobs gefunden
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Abbrechen
            </Button>
            <Button 
              onClick={handleLinkJob}
              disabled={!selectedJobId || loading}
            >
              <Link className="h-4 w-4 mr-2" />
              Verknüpfen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};