import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { tt } from '@/lib/i18nSafe';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { AppHeader } from '@/components/layout/AppHeader';
import { JobEntryForm } from '@/components/forms/JobEntryForm';
import { JobStatusCard } from '@/components/dashboard/JobStatusCard';
import { JobFilterDropdown, type JobFilter } from '@/components/dashboard/JobFilterDropdown';
import { useEmailService } from '@/hooks/useEmailService';
import { ExportPage } from '@/components/export/ExportPage';
import { SettingsDialog } from '@/components/settings/SettingsDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Clock, TrendingUp, Settings, Navigation, BarChart3, MapPin } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUserProfile } from '@/contexts/user-profile-context.helpers';
import { useToast } from '@/hooks/use-toast';
import { useJobs, type Job } from '@/hooks/useJobs';
import { supabase } from '@/integrations/supabase/client';
import { OvertimeTab } from '@/components/overtime/OvertimeTab';
import { FinishJobTab } from '@/components/finish/FinishJobTab';
import { ReportTab } from '@/components/reports/ReportTab';
import { BuildInfo } from '@/components/ui/build-info';
import React from 'react';
import { DayReport } from '@/types/dayReport';
import { initializeReports, adjustReportsToEstimatedDays } from '@/features/jobs/report/helpers';

type DayData = {
  day: number;
  date?: string;
  travelStart?: string;
  travelEnd?: string;
  workStart?: string;
  workEnd?: string;
  departureStart?: string;
  departureEnd?: string;
};

const Index = () => {
  const { t: tJob } = useTranslation('jobs');
  const { t } = useTranslation('common');
  const { profile } = useUserProfile();
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('activeTab') || 'dashboard');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [jobFilter, setJobFilter] = useState<JobFilter>('open');
  const { sendJobReport } = useEmailService();
  const { jobs, isLoading: isLoadingJobs, fetchJobs, setJobs } = useJobs();

  useEffect(() => {
    try { localStorage.setItem('activeTab', activeTab); } catch { /* ignore localStorage errors */ }
  }, [activeTab]);

  console.log('Index component render:', { 
    activeTab, 
    jobsCount: jobs.length, 
    isLoadingJobs,
    hasProfile: !!profile 
  });
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [newJobOpen, setNewJobOpen] = useState(false);
  const { toast } = useToast();
  const [editData, setEditData] = useState({
    customerName: '',
    customerAddress: '',
    evaticNo: '',
    totalHours: '',
    estimatedDays: 1,
    currentDay: 0,
    days: [] as DayData[],
    manufacturer: '',
    model: '',
    serialNumber: '',
    workPerformed: '',
    hotelName: '',
    hotelAddress: '',
    hotelNights: 0,
    kilometersOutbound: 0,
    kilometersReturn: 0,
    tollAmount: 0,
    workReport: '',
    reports: [] as DayReport[],
  });


  const handleDetails = (job: Job) => {
    setSelectedJob(job);
    setDetailsOpen(true);
  };

  const handleEdit = (job: Job) => {
    setSelectedJob(job);
    
    // Ensure we have at least estimatedDays worth of day entries
    const days = [...(job.days || [])];
    const estimatedDays = job.estimatedDays || 1;
    
    // Fill missing days
    for (let i = days.length; i < estimatedDays; i++) {
      days.push({ day: i + 1 });
    }
    
    // Initialize reports only if missing; keep existing texts
    const baseReports = (job.reports && job.reports.length > 0)
      ? job.reports
      : initializeReports(estimatedDays, job.reports, job.workReport);
    // Sync dateISO from times only if not already set
    const reports = (baseReports || []).map((r) => ({
      ...r,
      dateISO: r.dateISO ?? days[r.dayIndex]?.date,
    }));
    
    // Compute initial total hours (travel + work + departure) or fallback to estimatedDays * 8h
    let initialTotalMinutes = 0;
    
    days.forEach((day) => {
      if (day.travelStart && day.travelEnd) {
        const [sH, sM] = day.travelStart.split(':').map(Number);
        const [eH, eM] = day.travelEnd.split(':').map(Number);
        const m = (eH * 60 + eM) - (sH * 60 + sM);
        if (m > 0) initialTotalMinutes += m;
      }
      if (day.workStart && day.workEnd) {
        const [sH, sM] = day.workStart.split(':').map(Number);
        const [eH, eM] = day.workEnd.split(':').map(Number);
        const m = (eH * 60 + eM) - (sH * 60 + sM);
        if (m > 0) initialTotalMinutes += m;
      }
      if (day.departureStart && day.departureEnd) {
        const [sH, sM] = day.departureStart.split(':').map(Number);
        const [eH, eM] = day.departureEnd.split(':').map(Number);
        const m = (eH * 60 + eM) - (sH * 60 + sM);
        if (m > 0) initialTotalMinutes += m;
      }
    });
    
    if (initialTotalMinutes === 0) {
      initialTotalMinutes = estimatedDays * 8 * 60;
    }
    
    const initialHours = Math.floor(initialTotalMinutes / 60);
    const initialMinutes = initialTotalMinutes % 60;
    const totalTimeString = `${initialHours}h ${initialMinutes}m`;
    
    setEditData({
      customerName: job.customerName,
      customerAddress: job.customerAddress || '',
      evaticNo: job.evaticNo || '',
      totalHours: totalTimeString,
      estimatedDays: estimatedDays,
      currentDay: job.currentDay || 0,
      days: days,
      manufacturer: job.manufacturer || '',
      model: job.model || '',
      serialNumber: job.serialNumber || '',
      workPerformed: job.workPerformed || '',
      hotelName: job.hotelName || '',
      hotelAddress: job.hotelAddress || '',
      hotelNights: job.hotelNights || 0,
      kilometersOutbound: job.kilometersOutbound || 0,
      kilometersReturn: job.kilometersReturn || 0,
      tollAmount: job.tollAmount || 0,
      workReport: job.workReport || '',
      reports,
    });
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!selectedJob) return;
    
    try {
      // Save to database
      const { error } = await supabase
        .from('jobs')
        .update({
          customer_name: editData.customerName,
          customer_address: editData.customerAddress,
          evatic_no: editData.evaticNo,
          estimated_days: editData.estimatedDays,
          current_day: editData.currentDay,
          days_data: editData.days,
          work_start_time: editData.days[0]?.workStart,
          work_end_time: editData.days[editData.currentDay - 1]?.workEnd,
          manufacturer: editData.manufacturer,
          model: editData.model,
          serial_number: editData.serialNumber,
          work_performed: editData.workPerformed,
          hotel_name: editData.hotelName,
          hotel_address: editData.hotelAddress,
          hotel_nights: editData.hotelNights,
          kilometers_outbound: editData.kilometersOutbound,
          kilometers_return: editData.kilometersReturn,
          toll_amount: editData.tollAmount,
          work_report: editData.workReport,
          reports: editData.reports,
        } as any)
        .eq('id', selectedJob.id);

      if (error) throw error;

      // Update local state
      setJobs(prev => prev.map(j => 
        j.id === selectedJob.id 
          ? { 
              ...j, 
              customerName: editData.customerName,
              customerAddress: editData.customerAddress,
              evaticNo: editData.evaticNo,
              totalHours: editData.totalHours,
              estimatedDays: editData.estimatedDays,
              currentDay: editData.currentDay,
              days: editData.days,
              manufacturer: editData.manufacturer,
              model: editData.model,
              serialNumber: editData.serialNumber,
              workPerformed: editData.workPerformed,
              hotelName: editData.hotelName,
              hotelAddress: editData.hotelAddress,
              hotelNights: editData.hotelNights,
              kilometersOutbound: editData.kilometersOutbound,
              kilometersReturn: editData.kilometersReturn,
              tollAmount: editData.tollAmount,
              workReport: editData.workReport,
              reports: editData.reports,
              // Update legacy fields for display
              workStartTime: editData.days[0]?.workStart,
              workEndTime: editData.days[editData.currentDay - 1]?.workEnd,
            } 
          : j
      ));
      
      toast({
        title: t('saved'),
        description: t('timeEntriesSaved')
      });
      
      setEditOpen(false);
    } catch (error) {
      console.error('Error saving job data:', error);
      toast({
        title: t('error'),
        description: t('errorSavingEntries'),
        variant: 'destructive'
      });
    }
  };

  const updateDayField = (dayIndex: number, field: keyof DayData, value: string) => {
    setEditData(prev => {
      const newDays = prev.days.map((day, index) => 
        index === dayIndex ? { ...day, [field]: value } : day
      );
      
      // Calculate total time (travel + work) for all days
      let totalMinutes = 0;
      
      newDays.forEach(day => {
        // Calculate travel time (anreise)
        if (day.travelStart && day.travelEnd) {
          const [startHours, startMinutes] = day.travelStart.split(':').map(Number);
          const [endHours, endMinutes] = day.travelEnd.split(':').map(Number);
          const travelMinutes = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);
          if (travelMinutes > 0) totalMinutes += travelMinutes;
        }
        
        // Calculate work time
        if (day.workStart && day.workEnd) {
          const [startHours, startMinutes] = day.workStart.split(':').map(Number);
          const [endHours, endMinutes] = day.workEnd.split(':').map(Number);
          const workMinutes = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);
          if (workMinutes > 0) totalMinutes += workMinutes;
        }
        
        // Calculate departure time (abreise)
        if (day.departureStart && day.departureEnd) {
          const [startHours, startMinutes] = day.departureStart.split(':').map(Number);
          const [endHours, endMinutes] = day.departureEnd.split(':').map(Number);
          const departureMinutes = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);
          if (departureMinutes > 0) totalMinutes += departureMinutes;
        }
      });
      
      // If no actual times entered, show estimated hours (estimatedDays * 8 hours)
      if (totalMinutes === 0) {
        totalMinutes = prev.estimatedDays * 8 * 60; // Convert to minutes
      }
      
      // Convert to hours and minutes format
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      const totalTimeString = `${hours}h ${minutes}m`;
      
      return {
        ...prev,
        days: newDays,
        totalHours: totalTimeString
      };
    });
  };

  const updateEstimatedDays = (newEstimatedDays: number) => {
    const prev = editData;
    const days = [...prev.days];

    // Add missing days
    for (let i = days.length; i < newEstimatedDays; i++) {
      days.push({ day: i + 1 });
    }
    // Remove excess days in UI list only after confirmation (handled below)

    // Adjust reports without losing existing texts unless confirmed
    const prevReports = (prev.reports || []) as DayReport[];
    const { reports: adjustedReports, needsConfirmation } = adjustReportsToEstimatedDays(prevReports, newEstimatedDays);

    if (needsConfirmation) {
      const from = newEstimatedDays + 1;
      const to = prevReports.length;
      const confirmed = window.confirm(t('report.trimBody', { from, to }));
      if (!confirmed) {
        // Revert input by not changing state
        return;
      }
    }

    // Apply slicing if neededConfirmation true; adjustedReports already sliced
    const finalReports = adjustedReports.map((r) => ({
      ...r,
      dateISO: r.dateISO ?? days[r.dayIndex]?.date,
    }));

    // Finally trim days to newEstimatedDays
    if (days.length > newEstimatedDays) {
      days.splice(newEstimatedDays);
    }

    // Recompute totalHours based on current days or estimatedDays*8 if empty
    let totalMinutes = 0;
    days.forEach((day) => {
      if (day.travelStart && day.travelEnd) {
        const [sH, sM] = day.travelStart.split(':').map(Number);
        const [eH, eM] = day.travelEnd.split(':').map(Number);
        const m = (eH * 60 + eM) - (sH * 60 + sM);
        if (m > 0) totalMinutes += m;
      }
      if (day.workStart && day.workEnd) {
        const [sH, sM] = day.workStart.split(':').map(Number);
        const [eH, eM] = day.workEnd.split(':').map(Number);
        const m = (eH * 60 + eM) - (sH * 60 + sM);
        if (m > 0) totalMinutes += m;
      }
      if (day.departureStart && day.departureEnd) {
        const [sH, sM] = day.departureStart.split(':').map(Number);
        const [eH, eM] = day.departureEnd.split(':').map(Number);
        const m = (eH * 60 + eM) - (sH * 60 + sM);
        if (m > 0) totalMinutes += m;
      }
    });
    if (totalMinutes === 0) {
      totalMinutes = newEstimatedDays * 8 * 60;
    }
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const totalTimeString = `${hours}h ${minutes}m`;

    setEditData(prevState => ({
      ...prevState,
      estimatedDays: newEstimatedDays,
      days,
      currentDay: Math.min(prevState.currentDay, newEstimatedDays - 1),
      reports: finalReports,
      totalHours: totalTimeString,
    }));
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

  const handleStatusChange = async (jobId: string, newStatus: 'open' | 'active' | 'completed') => {
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ status: newStatus })
        .eq('id', jobId);

      if (error) throw error;

      setJobs(prev => prev.map(j => 
        j.id === jobId ? { ...j, status: newStatus as 'open' | 'active' | 'completed' | 'completed-sent' | 'pending' } : j
      ));
      
      const statusText = newStatus === 'active' ? t('jobStarted') : newStatus === 'open' ? t('jobReopened') : t('jobPaused');
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

  // Fetch jobs on component mount and when activeTab changes to dashboard
  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchJobs();
    }
  }, [activeTab, fetchJobs]);

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

  const renderDashboard = () => (
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
  );

  return (
    <MobileLayout>
      <AppHeader onSettingsClick={() => setSettingsOpen(true)} />
      
      <div className="flex-1 overflow-y-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-2 mx-4 mt-4">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              {t('dashboard')}
            </TabsTrigger>
            <TabsTrigger value="export" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {t('export')}
            </TabsTrigger>
          </TabsList>
          
          <div className="flex-1 overflow-y-auto">
            <TabsContent value="dashboard" className="p-4 mt-6 h-full">
              {renderDashboard()}
            </TabsContent>
            
            <TabsContent value="export" className="mt-6 h-full">
              <ExportPage jobs={jobs} />
            </TabsContent>
          </div>
        </Tabs>

        {/* New Job Dialog */}
        <Dialog open={newJobOpen} onOpenChange={setNewJobOpen}>
          <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
            <JobEntryForm onJobSaved={() => { 
              setNewJobOpen(false); 
              fetchJobs(); 
            }} />
          </DialogContent>
        </Dialog>

        {/* Edit Job Dialog */}
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

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
            {selectedJob && (
              <JobEntryForm
                key={selectedJob.id} // Force re-mount when different job is selected
                jobId={selectedJob.id}
                onJobSaved={() => {
                  setEditOpen(false);
                  fetchJobs(); // Refresh the job list
                }}
              />
            )}
          </DialogContent>
        </Dialog>

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
