import { useState } from 'react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { AppHeader } from '@/components/layout/AppHeader';
import { JobEntryForm } from '@/components/forms/JobEntryForm';
import { JobStatusCard } from '@/components/dashboard/JobStatusCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Clock, TrendingUp } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Job = {
  id: string;
  customerName: string;
  status: 'active' | 'completed' | 'pending';
  startDate: Date;
  estimatedDays?: number;
  currentDay?: number;
  workStartTime?: string;
  workEndTime?: string;
  totalHours?: number;
};

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [jobs, setJobs] = useState<Job[]>([
    { 
      id: 'job-1', 
      customerName: 'Siemens AG', 
      status: 'active', 
      startDate: new Date('2025-01-15'), 
      estimatedDays: 3, 
      currentDay: 2,
      workStartTime: '08:30',
      workEndTime: '16:45',
      totalHours: 16.5
    },
    { 
      id: 'job-2', 
      customerName: 'ABB Industrial', 
      status: 'completed', 
      startDate: new Date('2025-01-10'), 
      estimatedDays: 2, 
      currentDay: 2,
      workStartTime: '09:00',
      workEndTime: '17:30',
      totalHours: 17.0
    },
    { 
      id: 'job-3', 
      customerName: 'Hydro Norge', 
      status: 'pending', 
      startDate: new Date('2025-01-20'), 
      estimatedDays: 1, 
      currentDay: 0 
    },
    { 
      id: 'job-4', 
      customerName: 'Schneider Electric', 
      status: 'pending', 
      startDate: new Date('2025-01-22'), 
      estimatedDays: 2, 
      currentDay: 0 
    },
  ]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState({
    customerName: '',
    workStartTime: '',
    workEndTime: '',
    totalHours: 0,
    estimatedDays: 1,
    currentDay: 0,
  });


  const handleDetails = (job: Job) => {
    setSelectedJob(job);
    setDetailsOpen(true);
  };

  const handleEdit = (job: Job) => {
    setSelectedJob(job);
    setEditData({
      customerName: job.customerName,
      workStartTime: job.workStartTime || '',
      workEndTime: job.workEndTime || '',
      totalHours: job.totalHours || 0,
      estimatedDays: job.estimatedDays || 1,
      currentDay: job.currentDay || 0,
    });
    setEditOpen(true);
  };

  const saveEdit = () => {
    if (!selectedJob) return;
    setJobs(prev => prev.map(j => 
      j.id === selectedJob.id 
        ? { 
            ...j, 
            customerName: editData.customerName,
            workStartTime: editData.workStartTime,
            workEndTime: editData.workEndTime,
            totalHours: editData.totalHours,
            estimatedDays: editData.estimatedDays,
            currentDay: editData.currentDay,
          } 
        : j
    ));
    setEditOpen(false);
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Aktive Jobs</p>
                <p className="text-2xl font-bold text-primary">2</p>
              </div>
              <Clock className="h-8 w-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Diese Woche</p>
                <p className="text-2xl font-bold text-success">47.5h</p>
              </div>
              <TrendingUp className="h-8 w-8 text-success/60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Jobs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Aktuelle Aufträge</h2>
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Neuer Job
          </Button>
        </div>
        
        {jobs.map((job) => (
          <JobStatusCard 
            key={job.id} 
            {...job}
            onDetails={() => handleDetails(job)}
            onEdit={() => handleEdit(job)}
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
            <FileText className="h-4 w-4" />
            Letzten Export anzeigen
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <MobileLayout>
      <AppHeader />
      
      <div className="flex-1">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mx-4 mt-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="new-job">Neuer Job</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard" className="p-4 mt-6">
            {renderDashboard()}
          </TabsContent>
          
          <TabsContent value="new-job" className="mt-6">
            <JobEntryForm />
          </TabsContent>
          
          <TabsContent value="export" className="p-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Excel Export
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Exportiere deine Reisedaten in das norwegische Travelcosts-Format.
                </p>
                <Button className="w-full" disabled>
                  <FileText className="h-4 w-4 mr-2" />
                  KW03_2025-01-15_Siemens.xlsx erstellen
                </Button>
                <Badge variant="outline" className="w-full justify-center">
                  Coming Soon - Excel Integration
                </Badge>
              </CardContent>
            </Card>
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
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Auftrag bearbeiten</DialogTitle>
              <DialogDescription>Alle Job-Daten bearbeiten</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              <div>
                <Label htmlFor="edit-customer">Kundenname</Label>
                <Input 
                  id="edit-customer" 
                  value={editData.customerName} 
                  onChange={(e) => setEditData(prev => ({ ...prev, customerName: e.target.value }))} 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="edit-work-start">Arbeit Start</Label>
                  <Input 
                    id="edit-work-start" 
                    type="time"
                    value={editData.workStartTime} 
                    onChange={(e) => setEditData(prev => ({ ...prev, workStartTime: e.target.value }))} 
                  />
                </div>
                <div>
                  <Label htmlFor="edit-work-end">Arbeit Ende</Label>
                  <Input 
                    id="edit-work-end" 
                    type="time"
                    value={editData.workEndTime} 
                    onChange={(e) => setEditData(prev => ({ ...prev, workEndTime: e.target.value }))} 
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="edit-total-hours">Gesamtstunden</Label>
                <Input 
                  id="edit-total-hours" 
                  type="number"
                  step="0.5"
                  value={editData.totalHours} 
                  onChange={(e) => setEditData(prev => ({ ...prev, totalHours: parseFloat(e.target.value) || 0 }))} 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="edit-estimated-days">Geplante Tage</Label>
                  <Input 
                    id="edit-estimated-days" 
                    type="number"
                    min="1"
                    value={editData.estimatedDays} 
                    onChange={(e) => setEditData(prev => ({ ...prev, estimatedDays: parseInt(e.target.value) || 1 }))} 
                  />
                </div>
                <div>
                  <Label htmlFor="edit-current-day">Aktueller Tag</Label>
                  <Input 
                    id="edit-current-day" 
                    type="number"
                    min="0"
                    value={editData.currentDay} 
                    onChange={(e) => setEditData(prev => ({ ...prev, currentDay: parseInt(e.target.value) || 0 }))} 
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditOpen(false)}>Abbrechen</Button>
              <Button onClick={saveEdit}>Speichern</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MobileLayout>
  );
};

export default Index;
