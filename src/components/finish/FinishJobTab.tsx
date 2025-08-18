import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useEmailService } from '@/hooks/useEmailService';
import { useOvertimeCalculation } from '@/hooks/useOvertimeCalculation';
import { FileCheck, Mail, ArrowLeft, Eye } from 'lucide-react';
import { Job } from '@/hooks/useJobs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface FinishJobTabProps {
  job: Job;
  onJobUpdate: (updatedJob: Job) => void;
}

export const FinishJobTab = ({ job, onJobUpdate }: FinishJobTabProps) => {
  const [workReport, setWorkReport] = useState(job.workReport || '');
  const [isSaved, setIsSaved] = useState(!!job.workReport);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();
  const { sendJobReport } = useEmailService();
  const { calculateOvertime, calculateTimeBreakdown } = useOvertimeCalculation();

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

  return (
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
          
          <Separator />
          
          <div className="flex flex-col gap-3">
            <Button 
              onClick={handleSaveWorkReport}
              variant="outline"
              className="w-full"
            >
              Arbeitsbericht speichern
            </Button>
            
            {isSaved && (
              <Button 
                onClick={handleSendReport}
                disabled={isSending}
                className="w-full"
              >
                <Mail className="h-4 w-4 mr-2" />
                {isSending ? 'Sende...' : 'Per E-Mail versenden'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};