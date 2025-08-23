import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useEmailService } from '@/hooks/useEmailService';
import { useOvertimeCalculation } from '@/hooks/useOvertimeCalculation';
import { FileCheck, Mail, Eye, LayoutDashboard } from 'lucide-react';
import { Job } from '@/hooks/useJobs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useExcelExport } from '@/hooks/useExcelExport';
import { useNavigate } from 'react-router-dom';

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
  const [previewContent, setPreviewContent] = useState<string>('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  const { toast } = useToast();
  const { sendJobReport } = useEmailService();
  const { generateJobExcel } = useExcelExport();
  const navigate = useNavigate();

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
    try {
      const jobWithReport = { ...job, workReport: workReport };
      
      // Generate HTML preview content
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
          <h2>Arbeitsauftrag - ${jobWithReport.customerName}</h2>
          <hr>
          <div style="margin: 20px 0;">
            <h3>Auftragsinformationen</h3>
            <p><strong>Kunde:</strong> ${jobWithReport.customerName || 'Nicht angegeben'}</p>
            <p><strong>Startdatum:</strong> ${jobWithReport.startDate ? new Date(jobWithReport.startDate).toLocaleDateString('de-DE') : 'Nicht angegeben'}</p>
            <p><strong>Status:</strong> ${jobWithReport.status === 'pending' ? 'Offen' : jobWithReport.status === 'active' ? 'In Bearbeitung' : 'Abgeschlossen'}</p>
          </div>
          
          <div style="margin: 20px 0;">
            <h3>Maschineninformationen</h3>
            <p><strong>Hersteller:</strong> ${jobWithReport.manufacturer || 'Nicht angegeben'}</p>
            <p><strong>Modell:</strong> ${jobWithReport.model || 'Nicht angegeben'}</p>
            <p><strong>Seriennummer:</strong> ${jobWithReport.serialNumber || 'Nicht angegeben'}</p>
          </div>
          
          <div style="margin: 20px 0;">
            <h3>Arbeitszeiten</h3>
            <p><strong>Gesamtstunden:</strong> ${jobWithReport.totalHours || '0h 0m'}</p>
            <p><strong>Geschätzte Tage:</strong> ${jobWithReport.estimatedDays || 1}</p>
          </div>
          
          <div style="margin: 20px 0;">
            <h3>Arbeitsbericht</h3>
            <div style="border: 1px solid #ccc; padding: 15px; background-color: #f9f9f9; white-space: pre-wrap;">
              ${workReport || 'Kein Arbeitsbericht verfasst.'}
            </div>
          </div>
        </div>
      `;
      
      setPreviewContent(htmlContent);
      setIsPreviewOpen(true);
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Fehler beim Erstellen der Vorschau',
        variant: 'destructive',
      });
    }
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
      </div>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Report Vorschau</DialogTitle>
          </DialogHeader>
          <div 
            dangerouslySetInnerHTML={{ __html: previewContent }}
            className="border rounded-lg p-4 bg-background"
          />
        </DialogContent>
      </Dialog>

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