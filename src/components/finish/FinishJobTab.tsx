import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useEmailService } from '@/hooks/useEmailService';
import { useOvertimeCalculation } from '@/hooks/useOvertimeCalculation';
import { FileCheck, Mail, Eye, LayoutDashboard } from 'lucide-react';
import { Job } from '@/hooks/useJobs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useExcelExport } from '@/hooks/useExcelExport';
import { useNavigate } from 'react-router-dom';
import { TimeEntriesTable } from './TimeEntriesTable';
import { OvertimeBreakdown } from './OvertimeBreakdown';
import { A4Preview } from './A4Preview';
import { extractTimeEntriesFromJob, calculateTotalHoursFromEntries } from '@/lib/timeCalc';

interface FinishJobTabProps {
  job: Job;
  onJobUpdate: (updatedJob: Job) => void;
  onCloseDialog?: () => void;
}

export const FinishJobTab = ({ job, onJobUpdate, onCloseDialog }: FinishJobTabProps) => {
  const [workReport, setWorkReport] = useState(job.workReport || '');
  const [isSaved, setIsSaved] = useState(!!job.workReport);
  const [isSending, setIsSending] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  const { toast } = useToast();
  const { sendJobReport } = useEmailService();
  const { generateJobExcel } = useExcelExport();
  const navigate = useNavigate();

  const { calculateOvertime } = useOvertimeCalculation();

  // Calculate time entries and totals
  const timeEntries = useMemo(() => extractTimeEntriesFromJob(job), [job]);
  const { totalMinutes, totalBreakMinutes } = useMemo(() => 
    calculateTotalHoursFromEntries(timeEntries), [timeEntries]
  );
  
  // Calculate overtime
  const overtimeCalculation = useMemo(() => calculateOvertime(job), [job, calculateOvertime]);

  // Check if there are unsaved changes
  const hasUnsavedChanges = workReport !== (job.workReport || '');

  const handleSaveWorkReport = async () => {
    try {
      const updatedJob = { ...job, workReport: workReport };
      onJobUpdate(updatedJob);
      setIsSaved(true);
      toast({
        title: 'Gespeichert',
        description: 'Arbeitsbericht wurde gespeichert',
      });
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Fehler beim Speichern des Arbeitsberichts',
        variant: 'destructive',
      });
    }
  };

  const handleSendReport = async () => {
    setIsSending(true);
    try {
      const jobWithReport = { ...job, workReport: workReport };
      const success = await sendJobReport(jobWithReport);
      
      if (success) {
        toast({
          title: 'Bericht gesendet',
          description: 'Der Auftragsbericht wurde erfolgreich per E-Mail versendet.',
        });
      }
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Fehler beim Versenden des Berichts',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handlePreviewReport = () => {
    setIsPreviewOpen(true);
  };

  const handleGoDashboard = () => {
    if (hasUnsavedChanges) {
      setShowConfirmDialog(true);
    } else {
      onCloseDialog?.();
      navigate('/');
    }
  };

  const confirmGoToDashboard = () => {
    setShowConfirmDialog(false);
    onCloseDialog?.();
    navigate('/');
  };

  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              Auftrag abschließen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="work-report">Arbeitsbericht</Label>
              <Textarea
                id="work-report"
                placeholder="Beschreiben Sie die durchgeführten Arbeiten, Befunde, verwendete Materialien, etc..."
                value={workReport}
                onChange={(e) => setWorkReport(e.target.value)}
                className="min-h-[120px] mt-2"
              />
            </div>
            
            {/* Save button directly under textarea */}
            <Button 
              data-testid="btn-save-report"
              onClick={handleSaveWorkReport}
              variant="default"
              className="mt-3"
            >
              Arbeitsbericht speichern
            </Button>
            
            {/* Action row with Preview and Email buttons */}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button 
                data-testid="btn-preview"
                onClick={handlePreviewReport}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                Report Vorschau
              </Button>
              
              <Button 
                data-testid="btn-send-email"
                onClick={handleSendReport}
                disabled={isSending}
                variant="default"
                className="flex items-center gap-2"
              >
                <Mail className="h-4 w-4" />
                {isSending ? 'Sende...' : 'Per E-Mail versenden'}
              </Button>
            </div>
            
            {/* Dashboard button at bottom */}
            <div className="mt-6 flex justify-end">
              <Button 
                data-testid="btn-dashboard"
                onClick={handleGoDashboard}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Time Entries Table */}
        <TimeEntriesTable 
          entries={timeEntries}
          totalMinutes={totalMinutes}
          totalBreakMinutes={totalBreakMinutes}
        />
        
        {/* Overtime Breakdown */}
        <OvertimeBreakdown calculation={overtimeCalculation} />
      </div>

      {/* A4 Preview Dialog */}
      <A4Preview 
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        job={job}
        workReport={workReport}
        timeEntries={timeEntries}
        totalMinutes={totalMinutes}
        overtimeCalculation={overtimeCalculation}
      />

      {/* Confirmation Dialog for unsaved changes */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ungespeicherte Änderungen</DialogTitle>
          </DialogHeader>
          <p>Es liegen ungespeicherte Änderungen vor. Trotzdem zum Dashboard wechseln?</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Zurück
            </Button>
            <Button onClick={confirmGoToDashboard}>
              Weiter zum Dashboard
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};