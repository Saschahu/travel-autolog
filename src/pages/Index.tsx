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
import { LocationSettings } from '@/components/location/LocationSettings';
import { LocationTracker } from '@/components/location/LocationTracker';
import { useLocation } from '@/hooks/useLocation';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { useToast } from '@/hooks/use-toast';
import { useJobs, type Job } from '@/hooks/useJobs';
import { supabase } from '@/integrations/supabase/client';
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
              // Update legacy fields for display
              workStartTime: editData.days[0]?.workStart,
              workEndTime: editData.days[editData.currentDay - 1]?.workEnd,
            } 
          : j
      ));
      
      toast({
        title: 'Gespeichert',
        description: 'Zeiteinträge wurden erfolgreich gespeichert'
      });
      
      setEditOpen(false);
    } catch (error) {
      console.error('Error saving job data:', error);
      toast({
        title: 'Fehler',
        description: 'Fehler beim Speichern der Zeiteinträge',
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

  const handleDelete = async (jobId: string) => {
    const confirmDelete = window.confirm('Möchtest du diesen Job wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.');
    
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
        title: 'Job gelöscht',
        description: 'Der Job wurde erfolgreich gelöscht'
      });
    } catch (error) {
      console.error('Error deleting job:', error);
      toast({
        title: 'Fehler',
        description: 'Fehler beim Löschen des Jobs',
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
        title: 'Arbeitsreise gestartet',
        description: 'Du kannst jetzt einen neuen Job erfassen',
      });
    } else {
      toast({
        title: 'Private Reise',
        description: 'Viel Spaß bei deinen privaten Aktivitäten!',
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
            Neuer Job
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
          />
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Schnellaktionen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full justify-start gap-2">
            <Clock className="h-4 w-4" />
            Arbeitszeit jetzt starten
          </Button>
          <Button variant="outline" className="w-full justify-start gap-2">
            <MapPin className="h-4 w-4" />
            Reisezeit jetzt starten
          </Button>
          <Button variant="outline" className="w-full justify-start gap-2">
            <FileText className="h-4 w-4" />
            Letzten Export anzeigen
          </Button>
        </CardContent>
      </Card>
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
              {t('newEntry')}
            </TabsTrigger>
            <TabsTrigger value="location" className="flex items-center gap-2">
              <Navigation className="h-4 w-4" />
              {t('gps')}
            </TabsTrigger>
            <TabsTrigger value="export" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Export
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard" className="p-4 mt-6">
            {renderDashboard()}
          </TabsContent>
          
          <TabsContent value="new-job" className="mt-6">
            <JobEntryForm onJobSaved={() => fetchJobs()} />
          </TabsContent>
          
          <TabsContent value="location" className="p-4 mt-6">
            <LocationTracker />
          </TabsContent>
          
          <TabsContent value="export" className="mt-6">
            <ExportPage jobs={jobs} />
          </TabsContent>
        </Tabs>

        {/* Modals */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Auftragsdetails</DialogTitle>
              <DialogDescription>Informationen zum ausgewählten Auftrag</DialogDescription>
            </DialogHeader>
            <div className="space-y-2 text-sm">
              <div><span className="font-medium">Kunde:</span> {selectedJob?.customerName}</div>
              <div><span className="font-medium">Status:</span> {selectedJob?.status}</div>
              <div><span className="font-medium">Startdatum:</span> {selectedJob ? selectedJob.startDate.toLocaleDateString() : ''}</div>
              {selectedJob?.estimatedDays !== undefined && (
                <div><span className="font-medium">Tage:</span> {selectedJob?.currentDay}/{selectedJob?.estimatedDays}</div>
              )}
              {selectedJob?.workStartTime && (
                <div><span className="font-medium">Arbeitsbeginn:</span> {selectedJob.workStartTime}</div>
              )}
              {selectedJob?.workEndTime && (
                <div><span className="font-medium">Arbeitsende:</span> {selectedJob.workEndTime}</div>
              )}
              {selectedJob?.totalHours && (
                <div><span className="font-medium">Gesamtstunden:</span> {selectedJob.totalHours}h</div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDetailsOpen(false)}>Schließen</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>Auftrag bearbeiten</DialogTitle>
              <DialogDescription>Alle Job-Daten bearbeiten</DialogDescription>
            </DialogHeader>
            
            <div className="flex-1 overflow-hidden">
              <Tabs defaultValue="customer" className="h-full flex flex-col">
                <TabsList className="grid w-full grid-cols-4 flex-shrink-0">
                  <TabsTrigger value="customer">Kundendaten</TabsTrigger>
                  <TabsTrigger value="machine">Maschine</TabsTrigger>
                  <TabsTrigger value="times">Zeiten</TabsTrigger>
                  <TabsTrigger value="overtime">Overtime</TabsTrigger>
                </TabsList>
                
                <div className="flex-1 overflow-y-auto mt-4">
                  <TabsContent value="customer" className="space-y-4 mt-0">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="edit-customer">Kundenname *</Label>
                        <Input 
                          id="edit-customer" 
                          value={editData.customerName} 
                          onChange={(e) => setEditData(prev => ({ ...prev, customerName: e.target.value }))} 
                          placeholder="Name des Kunden"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-customer-address">Kundenadresse</Label>
                        <Input 
                          id="edit-customer-address" 
                          value={editData.customerAddress} 
                          onChange={(e) => setEditData(prev => ({ ...prev, customerAddress: e.target.value }))} 
                          placeholder="Vollständige Adresse des Kunden"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-evatic">EVATIC-Nummer</Label>
                        <Input 
                          id="edit-evatic" 
                          value={editData.evaticNo} 
                          onChange={(e) => setEditData(prev => ({ ...prev, evaticNo: e.target.value }))} 
                          placeholder="EVATIC-Nummer (falls vorhanden)"
                        />
                      </div>
                      
                      <div className="border-t pt-4">
                        <h4 className="font-medium text-sm mb-3">Hotel & Übernachtung</h4>
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor="edit-hotel-name">Hotel Name</Label>
                            <Input 
                              id="edit-hotel-name" 
                              value={editData.hotelName} 
                              onChange={(e) => setEditData(prev => ({ ...prev, hotelName: e.target.value }))} 
                              placeholder="Name des Hotels"
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit-hotel-address">Hotel Adresse</Label>
                            <Input 
                              id="edit-hotel-address" 
                              value={editData.hotelAddress} 
                              onChange={(e) => setEditData(prev => ({ ...prev, hotelAddress: e.target.value }))} 
                              placeholder="Adresse des Hotels"
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit-hotel-nights">Anzahl Nächte</Label>
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
                        <h4 className="font-medium text-sm mb-3">Reisekosten</h4>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <Label htmlFor="edit-km-outbound">Kilometer Hinfahrt</Label>
                            <Input 
                              id="edit-km-outbound" 
                              type="number"
                              min="0"
                              value={editData.kilometersOutbound} 
                              onChange={(e) => setEditData(prev => ({ ...prev, kilometersOutbound: parseInt(e.target.value) || 0 }))} 
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit-km-return">Kilometer Rückfahrt</Label>
                            <Input 
                              id="edit-km-return" 
                              type="number"
                              min="0"
                              value={editData.kilometersReturn} 
                              onChange={(e) => setEditData(prev => ({ ...prev, kilometersReturn: parseInt(e.target.value) || 0 }))} 
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit-toll">Mautgebühren (€)</Label>
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
                          <Label htmlFor="edit-manufacturer">Hersteller</Label>
                          <Input 
                            id="edit-manufacturer"
                            value={editData.manufacturer} 
                            onChange={(e) => setEditData(prev => ({ ...prev, manufacturer: e.target.value }))} 
                            placeholder="z.B. Siemens, ABB, Schneider"
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-model">Modell/Typ</Label>
                          <Input 
                            id="edit-model"
                            value={editData.model} 
                            onChange={(e) => setEditData(prev => ({ ...prev, model: e.target.value }))} 
                            placeholder="z.B. S7-1200, CP1E"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="edit-serial">Seriennummer</Label>
                        <Input 
                          id="edit-serial"
                          value={editData.serialNumber} 
                          onChange={(e) => setEditData(prev => ({ ...prev, serialNumber: e.target.value }))} 
                          placeholder="Seriennummer der Maschine/Anlage"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-work-performed">Durchgeführte Arbeiten</Label>
                        <textarea 
                          id="edit-work-performed"
                          className="w-full min-h-[120px] p-3 border rounded-md resize-y"
                          value={editData.workPerformed} 
                          onChange={(e) => setEditData(prev => ({ ...prev, workPerformed: e.target.value }))} 
                          placeholder="Detaillierte Beschreibung der durchgeführten Arbeiten..."
                        />
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="times" className="space-y-4 mt-0">
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <Label htmlFor="edit-estimated-days">Geplante Tage</Label>
                          <Input 
                            id="edit-estimated-days" 
                            type="number"
                            min="1"
                            value={editData.estimatedDays} 
                            onChange={(e) => updateEstimatedDays(parseInt(e.target.value) || 1)} 
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-current-day">Aktueller Tag</Label>
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
                          <Label htmlFor="edit-total-hours">Gesamtzeit</Label>
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
                        Gesamtzeit wird automatisch berechnet: Anreise + Arbeitszeit + Abreise aller Tage
                      </p>

                      {/* Daily Time Entries */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-sm">Tägliche Zeiten</h4>
                        {editData.days.map((day, dayIndex) => (
                          <div key={dayIndex} className="border rounded-lg p-4 space-y-3">
                            <div className="flex items-center gap-3">
                              <h5 className="font-medium text-sm text-primary">Tag {day.day}</h5>
                              <Input 
                                type="date"
                                value={day.date || ''} 
                                onChange={(e) => updateDayField(dayIndex, 'date', e.target.value)}
                                className="w-auto text-xs"
                              />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <Label htmlFor={`travel-start-${dayIndex}`}>Anreise Start</Label>
                                <Input 
                                  id={`travel-start-${dayIndex}`}
                                  type="time"
                                  value={day.travelStart || ''} 
                                  onChange={(e) => updateDayField(dayIndex, 'travelStart', e.target.value)} 
                                />
                              </div>
                              <div>
                                <Label htmlFor={`travel-end-${dayIndex}`}>Anreise Ende</Label>
                                <Input 
                                  id={`travel-end-${dayIndex}`}
                                  type="time"
                                  value={day.travelEnd || ''} 
                                  onChange={(e) => updateDayField(dayIndex, 'travelEnd', e.target.value)} 
                                />
                              </div>
                              <div>
                                <Label htmlFor={`work-start-${dayIndex}`}>Arbeit Start</Label>
                                <Input 
                                  id={`work-start-${dayIndex}`}
                                  type="time"
                                  value={day.workStart || ''} 
                                  onChange={(e) => updateDayField(dayIndex, 'workStart', e.target.value)} 
                                />
                              </div>
                              <div>
                                <Label htmlFor={`work-end-${dayIndex}`}>Arbeit Ende</Label>
                                <Input 
                                  id={`work-end-${dayIndex}`}
                                  type="time"
                                  value={day.workEnd || ''} 
                                  onChange={(e) => updateDayField(dayIndex, 'workEnd', e.target.value)} 
                                />
                              </div>
                              <div>
                                <Label htmlFor={`departure-start-${dayIndex}`}>Abreise Start</Label>
                                <Input 
                                  id={`departure-start-${dayIndex}`}
                                  type="time"
                                  value={day.departureStart || ''} 
                                  onChange={(e) => updateDayField(dayIndex, 'departureStart', e.target.value)} 
                                />
                              </div>
                              <div>
                                <Label htmlFor={`departure-end-${dayIndex}`}>Abreise Ende</Label>
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
                    {selectedJob && <OvertimeTab job={selectedJob} />}
                  </TabsContent>
                </div>
              </Tabs>
            </div>
            
            <DialogFooter className="flex-shrink-0 mt-4">
              <Button variant="outline" onClick={() => setEditOpen(false)}>Abbrechen</Button>
              <Button onClick={saveEdit}>Speichern</Button>
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
