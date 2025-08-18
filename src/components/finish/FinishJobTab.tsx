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
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [reportContent, setReportContent] = useState<string>('');
  const { toast } = useToast();
  const { sendJobReport } = useEmailService();
  const { calculateOvertime, calculateTimeBreakdown } = useOvertimeCalculation();

  const generateReportContent = () => {
    const timeBreakdown = calculateTimeBreakdown(job);
    const overtimeCalc = calculateOvertime(job);
    
    // Format dates for display
    const formatDate = (dateStr?: string) => {
      if (!dateStr) return 'Nicht angegeben';
      return new Date(dateStr).toLocaleDateString('de-DE');
    };

    // Format time for display
    const formatTime = (minutes: number) => {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h ${mins}m`;
    };

    const reportData = `
AUFTRAGSBERICHT

Kunde: ${job.customerName}
Adresse: ${job.customerAddress || 'Nicht angegeben'}
EVATIC-Nr: ${job.evaticNo || 'Nicht angegeben'}

Maschinendaten:
Hersteller: ${job.manufacturer || 'Nicht angegeben'}
Modell: ${job.model || 'Nicht angegeben'}
Seriennummer: ${job.serialNumber || 'Nicht angegeben'}

Zeitaufschlüsselung:
Anreise: ${formatTime(timeBreakdown.travelTime)}
Arbeitszeit: ${formatTime(timeBreakdown.workTime)}  
Abreise: ${formatTime(timeBreakdown.departureTime)}

Überstundenberechnung:
Garantiestunden: ${overtimeCalc.guaranteedHours}h
Gearbeitete Stunden: ${overtimeCalc.actualWorkedHours}h
Reguläre Stunden: ${overtimeCalc.regularHours}h
Überstunden: ${overtimeCalc.totalOvertimeHours}h
Gesamte abrechenbare Stunden: ${overtimeCalc.totalPayableHours}h

${overtimeCalc.overtimeBreakdown.length > 0 ? 'Überstundenzuschläge:' : ''}
${overtimeCalc.overtimeBreakdown.map(item => 
  `${item.type}: ${item.hours}h x ${item.rate}% = ${item.amount.toFixed(2)}h`
).join('\n')}

Arbeitsbericht:
${workReport || 'Kein Arbeitsbericht verfügbar'}

Hotel & Übernachtungen:
Hotel: ${job.hotelName || 'Nicht angegeben'}
Adresse: ${job.hotelAddress || 'Nicht angegeben'}
Übernachtungen: ${job.hotelNights || 0}

Reisekosten:
Kilometer Hinfahrt: ${job.kilometersOutbound || 0}
Kilometer Rückfahrt: ${job.kilometersReturn || 0}
Mautgebühren: ${job.tollAmount || 0}€

Durchgeführte Arbeiten:
${job.workPerformed || 'Nicht angegeben'}
`;

    return reportData;
  };

  const handleGenerateReport = () => {
    setIsGeneratingReport(true);
    try {
      const content = generateReportContent();
      setReportContent(content);
      setShowPreview(true);
      toast({
        title: 'Report generiert',
        description: 'Bericht wurde erfolgreich erstellt. Überprüfen Sie die Inhalte.',
      });
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Fehler beim Generieren des Berichts',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleSaveWorkReport = async () => {
    try {
      const updatedJob = { ...job, workReport: workReport };
      onJobUpdate(updatedJob);
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
    try {
      const jobWithReport = { ...job, workReport: workReport };
      const success = await sendJobReport(jobWithReport);
      
      if (success) {
        toast({
          title: 'Bericht gesendet',
          description: 'Der Auftragsbericht wurde erfolgreich per E-Mail versendet.',
        });
        setShowPreview(false);
      }
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Fehler beim Versenden des Berichts',
        variant: 'destructive',
      });
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
            
            <Button 
              onClick={handleGenerateReport}
              disabled={isGeneratingReport}
              className="w-full"
            >
              <Eye className="h-4 w-4 mr-2" />
              {isGeneratingReport ? 'Generiere Bericht...' : 'Bericht generieren & vorschau'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Berichtsvorschau</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto">
            <div className="bg-muted/50 p-4 rounded-lg">
              <pre className="whitespace-pre-wrap text-sm font-mono">
                {reportContent}
              </pre>
            </div>
          </div>
          
          <div className="flex gap-3 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => setShowPreview(false)}
              className="flex-1"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück & Bearbeiten
            </Button>
            
            <Button 
              onClick={handleSendReport}
              className="flex-1"
            >
              <Mail className="h-4 w-4 mr-2" />
              Per E-Mail versenden
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};