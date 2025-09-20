import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { AppHeader } from '@/components/layout/AppHeader';
import { JobEntryForm } from '@/components/forms/JobEntryForm';
import { JobStatusCard } from '@/components/dashboard/JobStatusCard';
import { JobFilterDropdown, type JobFilter } from '@/components/dashboard/JobFilterDropdown';
import { useEmailService } from '@/hooks/useEmailService';
import { SettingsDialog } from '@/components/settings/SettingsDialog';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Navigation, BarChart3, Settings } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { LeavingHomeDialog } from '@/components/location/LeavingHomeDialog';
import { useLocation } from '@/hooks/useLocation';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { useToast } from '@/hooks/use-toast';
import { useJobs, type Job } from '@/hooks/useJobs';
import { supabase } from '@/integrations/supabase/client';
import { BuildInfo } from '@/components/ui/build-info';
import React from 'react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const { t } = useTranslation();
  const { profile } = useUserProfile();
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [jobFilter, setJobFilter] = useState<JobFilter>('open');
  const { sendJobReport } = useEmailService();
  const { jobs, isLoading: isLoadingJobs, fetchJobs, setJobs } = useJobs();

  console.log('Index component render:', { 
    jobsCount: jobs.length, 
    isLoadingJobs,
    hasProfile: !!profile 
  });
  
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [newJobOpen, setNewJobOpen] = useState(false);
  const [leavingHomeOpen, setLeavingHomeOpen] = useState(false);
  const { hasLeftHome } = useLocation();
  const { toast } = useToast();

  const handleDetails = (job: Job) => {
    setSelectedJob(job);
    setDetailsOpen(true);
  };

  const handleEdit = (job: Job) => {
    setSelectedJob(job);
    setEditOpen(true);
  };

  const handleComplete = async (job: Job) => {
    const success = await sendJobReport(job);
    if (success) {
      setJobs(prev => prev.map(j => 
        j.id === job.id 
          ? { ...j, status: 'completed-sent' as const }
          : j
      ));
    }
  };

  const handleStatusChange = async (jobId: string, newStatus: 'open' | 'active') => {
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ status: newStatus })
        .eq('id', jobId);

      if (error) throw error;

      setJobs(prev => prev.map(j => 
        j.id === jobId ? { ...j, status: newStatus } : j
      ));
      
      const statusText = newStatus === 'active' ? t('jobStarted') : t('jobPaused');
      toast({
        title: t('statusChanged'),
        description: `Job wurde ${statusText}`
      });
    } catch (error) {
      console.error('Error updating job status:', error);
      toast({
        title: t('error'),
        description: t('errorChangingStatus'),
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (jobId: string) => {
    const confirmDelete = window.confirm(t('deleteConfirm'));
    
    if (!confirmDelete) return;
    
    try {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', jobId);

      if (error) throw error;

      // Remove from local state
      setJobs(prev => prev.filter(j => j.id !== jobId));
      
      toast({
        title: t('jobDeleted'),
        description: t('jobDeletedSuccess')
      });
    } catch (error) {
      console.error('Error deleting job:', error);
      toast({
        title: t('error'),
        description: t('errorDeletingJob'),
        variant: 'destructive'
      });
    }
  };

  const filteredJobs = jobs.filter(job => {
    if (jobFilter === 'all') return true;
    return job.status === jobFilter;
  });

  const handleLeavingHomeSelection = (type: 'work' | 'private') => {
    if (type === 'work') {
      setNewJobOpen(true);
      toast({
        title: t('workTripStarted'),
        description: t('newJobDescription'),
      });
    } else {
      toast({
        title: t('privateTrip'),
        description: t('privateTripDescription'),
      });
    }
  };

  // Fetch jobs on component mount
  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Set default filter based on available jobs
  useEffect(() => {
    if (jobs.length > 0) {
      const hasActiveJobs = jobs.some(job => job.status === 'active');
      const hasOpenJobs = jobs.some(job => job.status === 'open');
      
      if (hasActiveJobs) {
        setJobFilter('active');
      } else if (hasOpenJobs) {
        setJobFilter('open');
      }
    }
  }, [jobs]);

  // Monitor leaving home status
  React.useEffect(() => {
    if (hasLeftHome && !leavingHomeOpen) {
      setLeavingHomeOpen(true);
    }
  }, [hasLeftHome, leavingHomeOpen]);

  return (
    <MobileLayout>
      <AppHeader onSettingsClick={() => setSettingsOpen(true)} />
      
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">{t('dashboard')}</h1>
          </div>

          {/* Quick Navigation */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex flex-col gap-1 h-auto py-3"
              onClick={() => navigate('/gps')}
            >
              <Navigation className="h-5 w-5" />
              <span className="text-xs">{t('location')}</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex flex-col gap-1 h-auto py-3"
              onClick={() => navigate('/export')}
            >
              <FileText className="h-5 w-5" />
              <span className="text-xs">{t('export')}</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex flex-col gap-1 h-auto py-3"
              onClick={() => navigate('/settings')}
            >
              <Settings className="h-5 w-5" />
              <span className="text-xs">{t('settings')}</span>
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Current Jobs */}
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <JobFilterDropdown value={jobFilter} onValueChange={setJobFilter} />
              </div>
              <Button 
                size="sm" 
                className="gap-2 ml-2"
                onClick={() => setNewJobOpen(true)}
              >
                <Plus className="h-4 w-4" />
                {t('newJob')}
              </Button>
            </div>
            
            {filteredJobs.map((job) => (
              <JobStatusCard 
                key={job.id} 
                {...job}
                onDetails={() => handleDetails(job)}
                onEdit={() => handleEdit(job)}
                onComplete={() => handleComplete(job)}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        </div>

        {/* New Job Dialog */}
        <Dialog open={newJobOpen} onOpenChange={setNewJobOpen}>
          <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
            <JobEntryForm onJobSaved={() => { 
              setNewJobOpen(false); 
              fetchJobs(); 
            }} />
          </DialogContent>
        </Dialog>

        {/* Job Details Dialog */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('jobDetails')}</DialogTitle>
              <DialogDescription>{t('jobDetailsDescription')}</DialogDescription>
            </DialogHeader>
            <div className="space-y-2 text-sm">
              <div><span className="font-medium">{t('customer')}:</span> {selectedJob?.customerName}</div>
              <div><span className="font-medium">{t('status')}:</span> {selectedJob?.status}</div>
              <div><span className="font-medium">{t('startDate')}:</span> {selectedJob ? selectedJob.startDate.toLocaleDateString() : ''}</div>
              {selectedJob?.estimatedDays !== undefined && (
                <div><span className="font-medium">{t('days')}:</span> {selectedJob?.currentDay}/{selectedJob?.estimatedDays}</div>
              )}
              {selectedJob?.workStartTime && (
                <div><span className="font-medium">{t('workStart')}:</span> {selectedJob.workStartTime}</div>
              )}
              {selectedJob?.workEndTime && (
                <div><span className="font-medium">{t('workEnd')}:</span> {selectedJob.workEndTime}</div>
              )}
              {selectedJob?.totalHours && (
                <div><span className="font-medium">{t('totalHours')}:</span> {selectedJob.totalHours}h</div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDetailsOpen(false)}>{t('close')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Job Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
            {selectedJob && (
              <JobEntryForm
                key={selectedJob.id}
                jobId={selectedJob.id}
                onJobSaved={() => {
                  setEditOpen(false);
                  fetchJobs();
                }}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Leaving Home Dialog */}
        <LeavingHomeDialog
          isOpen={leavingHomeOpen}
          onClose={() => setLeavingHomeOpen(false)}
          onSelection={handleLeavingHomeSelection}
        />

        {/* Settings Dialog */}
        <SettingsDialog
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
        />
      </div>
      
      {/* BuildInfo Badge */}
      <BuildInfo />
    </MobileLayout>
  );
};

export default Index;