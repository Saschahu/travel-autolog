import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
import { LeavingHomeDialog } from '@/components/location/LeavingHomeDialog';
import { GPSPage } from '@/components/gps/GPSPage';
import { useLocation } from '@/hooks/useLocation';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { useToast } from '@/hooks/use-toast';
import { useJobs, type Job } from '@/hooks/useJobs';
import { supabase } from '@/integrations/supabase/client';
import { OvertimeTab } from '@/components/overtime/OvertimeTab';
import { FinishJobTab } from '@/components/finish/FinishJobTab';
import React from 'react';

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
  const { t, i18n } = useTranslation();
  const { profile } = useUserProfile();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [jobFilter, setJobFilter] = useState<JobFilter>('open');
  const { sendJobReport } = useEmailService();
  const { jobs, isLoading: isLoadingJobs, fetchJobs, setJobs } = useJobs();
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [leavingHomeOpen, setLeavingHomeOpen] = useState(false);
  const { hasLeftHome } = useLocation();
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
    
    setEditData({
      customerName: job.customerName,
      customerAddress: job.customerAddress || '',
      evaticNo: job.evaticNo || '',
      totalHours: job.totalHours?.toString() || '0h 0m',
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
        })
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
    const days = [...editData.days];
    
    // Add missing days
    for (let i = days.length; i < newEstimatedDays; i++) {
      days.push({ day: i + 1 });
    }
    
    // Remove excess days
    if (days.length > newEstimatedDays) {
      days.splice(newEstimatedDays);
    }
    
    setEditData(prev => ({
      ...prev,
      estimatedDays: newEstimatedDays,
      days: days,
      currentDay: Math.min(prev.currentDay, newEstimatedDays)
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
      setActiveTab('new-job');
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

  // Initialize language based on user profile
  useEffect(() => {
    if (profile.preferredLanguage && i18n.language !== profile.preferredLanguage) {
      i18n.changeLanguage(profile.preferredLanguage);
    }
  }, [profile.preferredLanguage, i18n]);

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

  // Monitor leaving home status
  React.useEffect(() => {
    if (hasLeftHome && !leavingHomeOpen) {
      setLeavingHomeOpen(true);
    }
  }, [hasLeftHome, leavingHomeOpen]);

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
            onClick={() => setActiveTab('new-job')}
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
      
      <div className="flex-1">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mx-4 mt-4">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              {t('dashboard')}
            </TabsTrigger>
            <TabsTrigger value="new-job" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              {t('newJob')}
            </TabsTrigger>
            <TabsTrigger value="location" className="flex items-center gap-2">
              <Navigation className="h-4 w-4" />
              {t('location')}
            </TabsTrigger>
            <TabsTrigger value="export" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {t('export')}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard" className="p-4 mt-6">
            {renderDashboard()}
          </TabsContent>
          
          <TabsContent value="new-job" className="mt-6">
            <JobEntryForm onJobSaved={() => fetchJobs()} />
          </TabsContent>
          
          <TabsContent value="location" className="mt-6">
            <GPSPage />
          </TabsContent>
          
          <TabsContent value="export" className="mt-6">
            <ExportPage jobs={jobs} />
          </TabsContent>
        </Tabs>

        {/* Modals */}
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
          <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>{t('editJob')}</DialogTitle>
              <DialogDescription>{t('editAllJobData')}</DialogDescription>
            </DialogHeader>
            
            <div className="flex-1 overflow-hidden">
              <Tabs defaultValue="customer" className="h-full flex flex-col">
                <TabsList className="grid w-full grid-cols-5 flex-shrink-0">
                  <TabsTrigger value="customer">{t('customer')}</TabsTrigger>
                  <TabsTrigger value="machine">{t('machine')}</TabsTrigger>
                  <TabsTrigger value="times">{t('times')}</TabsTrigger>
                  <TabsTrigger value="overtime">{t('overtime')}</TabsTrigger>
                  <TabsTrigger value="finish">{t('finish')}</TabsTrigger>
                </TabsList>
                
                <div className="flex-1 overflow-y-auto mt-4">
                  <TabsContent value="customer" className="space-y-4 mt-0">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="edit-customer">{t('customerName')} *</Label>
                        <Input 
                          id="edit-customer" 
                          value={editData.customerName} 
                          onChange={(e) => setEditData(prev => ({ ...prev, customerName: e.target.value }))} 
                          placeholder={t('customerNamePlaceholder')}
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-customer-address">{t('customerAddress')}</Label>
                        <Input 
                          id="edit-customer-address" 
                          value={editData.customerAddress} 
                          onChange={(e) => setEditData(prev => ({ ...prev, customerAddress: e.target.value }))} 
                          placeholder={t('customerAddressPlaceholder')}
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-evatic">{t('evaticNumber')}</Label>
                        <Input 
                          id="edit-evatic" 
                          value={editData.evaticNo} 
                          onChange={(e) => setEditData(prev => ({ ...prev, evaticNo: e.target.value }))} 
                          placeholder={t('evaticPlaceholder')}
                        />
                      </div>
                      
                      <div className="border-t pt-4">
                        <h4 className="font-medium text-sm mb-3">{t('hotelOvernight')}</h4>
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor="edit-hotel-name">{t('hotelName')}</Label>
                            <Input 
                              id="edit-hotel-name" 
                              value={editData.hotelName} 
                              onChange={(e) => setEditData(prev => ({ ...prev, hotelName: e.target.value }))} 
                              placeholder={t('hotelNamePlaceholder')}
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit-hotel-address">{t('hotelAddress')}</Label>
                            <Input 
                              id="edit-hotel-address" 
                              value={editData.hotelAddress} 
                              onChange={(e) => setEditData(prev => ({ ...prev, hotelAddress: e.target.value }))} 
                              placeholder={t('hotelAddressPlaceholder')}
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit-hotel-nights">{t('hotelNights')}</Label>
                            <Input 
                              id="edit-hotel-nights" 
                              type="number"
                              min="0"
                              value={editData.hotelNights} 
                              onChange={(e) => setEditData(prev => ({ ...prev, hotelNights: parseInt(e.target.value) || 0 }))} 
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="border-t pt-4">
                        <h4 className="font-medium text-sm mb-3">{t('travelCosts')}</h4>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <Label htmlFor="edit-km-outbound">{t('kmOutbound')}</Label>
                            <Input 
                              id="edit-km-outbound" 
                              type="number"
                              min="0"
                              value={editData.kilometersOutbound} 
                              onChange={(e) => setEditData(prev => ({ ...prev, kilometersOutbound: parseInt(e.target.value) || 0 }))} 
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit-km-return">{t('kmInbound')}</Label>
                            <Input 
                              id="edit-km-return" 
                              type="number"
                              min="0"
                              value={editData.kilometersReturn} 
                              onChange={(e) => setEditData(prev => ({ ...prev, kilometersReturn: parseInt(e.target.value) || 0 }))} 
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit-toll">{t('tollFees')}</Label>
                            <Input 
                              id="edit-toll" 
                              type="number"
                              min="0"
                              step="0.01"
                              value={editData.tollAmount} 
                              onChange={(e) => setEditData(prev => ({ ...prev, tollAmount: parseFloat(e.target.value) || 0 }))} 
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="machine" className="space-y-4 mt-0">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="edit-manufacturer">{t('manufacturer')}</Label>
                          <Input 
                            id="edit-manufacturer"
                            value={editData.manufacturer} 
                            onChange={(e) => setEditData(prev => ({ ...prev, manufacturer: e.target.value }))} 
                            placeholder={t('manufacturerPlaceholder')}
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-model">{t('modelType')}</Label>
                          <Input 
                            id="edit-model"
                            value={editData.model} 
                            onChange={(e) => setEditData(prev => ({ ...prev, model: e.target.value }))} 
                            placeholder={t('modelPlaceholder')}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="edit-serial">{t('serialNumber')}</Label>
                        <Input 
                          id="edit-serial"
                          value={editData.serialNumber} 
                          onChange={(e) => setEditData(prev => ({ ...prev, serialNumber: e.target.value }))} 
                          placeholder={t('serialPlaceholder')}
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-work-performed">{t('workPerformed')}</Label>
                        <textarea 
                          id="edit-work-performed"
                          className="w-full min-h-[120px] p-3 border rounded-md resize-y"
                          value={editData.workPerformed} 
                          onChange={(e) => setEditData(prev => ({ ...prev, workPerformed: e.target.value }))} 
                          placeholder={t('workPerformedPlaceholder')}
                        />
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="times" className="space-y-4 mt-0">
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <Label htmlFor="edit-estimated-days">{t('estimatedDays')}</Label>
                          <Input 
                            id="edit-estimated-days" 
                            type="number"
                            min="1"
                            value={editData.estimatedDays} 
                            onChange={(e) => updateEstimatedDays(parseInt(e.target.value) || 1)} 
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-current-day">{t('currentDay')}</Label>
                          <Input 
                            id="edit-current-day" 
                            type="number"
                            min="0"
                            max={editData.estimatedDays}
                            value={editData.currentDay} 
                            onChange={(e) => setEditData(prev => ({ ...prev, currentDay: parseInt(e.target.value) || 0 }))} 
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-total-hours">{t('totalHours')}</Label>
                          <Input 
                            id="edit-total-hours" 
                            type="text"
                            value={editData.totalHours} 
                            readOnly
                            className="bg-muted font-mono"
                            placeholder="0h 0m"
                          />
                        </div>
                      </div>
                      
                      <p className="text-xs text-muted-foreground">
                        {t('totalTimeCalculated')}
                      </p>

                      {/* Daily Time Entries */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-sm">{t('dailyTimes')}</h4>
                        {editData.days.map((day, dayIndex) => (
                          <div key={dayIndex} className="border rounded-lg p-4 space-y-3">
                            <div className="flex items-center gap-3">
                              <h5 className="font-medium text-sm text-primary">{t('day')} {day.day}</h5>
                              <Input 
                                type="date"
                                value={day.date || ''} 
                                onChange={(e) => updateDayField(dayIndex, 'date', e.target.value)}
                                className="w-auto text-xs"
                              />
                            </div>
                            
                             <div className="grid grid-cols-2 gap-2 text-xs">
                               <div>
                                 <Label htmlFor={`travel-start-${dayIndex}`}>{t('travelStart')}</Label>
                                 <Input 
                                   id={`travel-start-${dayIndex}`}
                                   type="time"
                                   value={day.travelStart || ''} 
                                   onChange={(e) => updateDayField(dayIndex, 'travelStart', e.target.value)} 
                                 />
                               </div>
                               <div>
                                 <Label htmlFor={`travel-end-${dayIndex}`}>{t('travelEnd')}</Label>
                                 <Input 
                                   id={`travel-end-${dayIndex}`}
                                   type="time"
                                   value={day.travelEnd || ''} 
                                   onChange={(e) => updateDayField(dayIndex, 'travelEnd', e.target.value)} 
                                 />
                               </div>
                               <div>
                                 <Label htmlFor={`work-start-${dayIndex}`}>{t('workStart')}</Label>
                                 <Input 
                                   id={`work-start-${dayIndex}`}
                                   type="time"
                                   value={day.workStart || ''} 
                                   onChange={(e) => updateDayField(dayIndex, 'workStart', e.target.value)} 
                                 />
                               </div>
                               <div>
                                 <Label htmlFor={`work-end-${dayIndex}`}>{t('workEnd')}</Label>
                                 <Input 
                                   id={`work-end-${dayIndex}`}
                                   type="time"
                                   value={day.workEnd || ''} 
                                   onChange={(e) => updateDayField(dayIndex, 'workEnd', e.target.value)} 
                                 />
                               </div>
                               <div>
                                 <Label htmlFor={`departure-start-${dayIndex}`}>{t('departureStart')}</Label>
                                 <Input 
                                   id={`departure-start-${dayIndex}`}
                                   type="time"
                                   value={day.departureStart || ''} 
                                   onChange={(e) => updateDayField(dayIndex, 'departureStart', e.target.value)} 
                                 />
                               </div>
                               <div>
                                 <Label htmlFor={`departure-end-${dayIndex}`}>{t('departureEnd')}</Label>
                                 <Input 
                                   id={`departure-end-${dayIndex}`}
                                   type="time"
                                   value={day.departureEnd || ''} 
                                   onChange={(e) => updateDayField(dayIndex, 'departureEnd', e.target.value)} 
                                 />
                               </div>
                             </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="overtime" className="space-y-4 mt-0">
                    {selectedJob && (
                      <OvertimeTab 
                        job={{
                          ...selectedJob,
                          ...editData,
                          days: editData.days
                        } as Job} 
                      />
                    )}
                  </TabsContent>
                  
                  <TabsContent value="finish" className="space-y-4 mt-0">
                    {selectedJob && (
                      <FinishJobTab 
                        job={{
                          ...selectedJob,
                          ...editData,
                          days: editData.days
                        } as Job}
                        onJobUpdate={(updatedJob) => {
                          setEditData(prev => ({ ...prev, workReport: updatedJob.workReport }));
                        }}
                      />
                    )}
                  </TabsContent>
                </div>
              </Tabs>
            </div>
            
            <DialogFooter className="flex-shrink-0 mt-4">
              <Button variant="outline" onClick={() => setEditOpen(false)}>{t('cancel')}</Button>
              <Button onClick={saveEdit}>{t('save')}</Button>
            </DialogFooter>
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
          onSaved={() => {
            setSettingsOpen(false);
            setActiveTab('dashboard');
          }}
          onGoDashboard={() => {
            setSettingsOpen(false);
            setActiveTab('dashboard');
          }}
        />
      </div>
    </MobileLayout>
  );
};

export default Index;
