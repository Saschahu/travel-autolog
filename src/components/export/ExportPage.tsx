import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Download, FileSpreadsheet, Mail, Calendar } from 'lucide-react';
import { useExcelExport } from '@/hooks/useExcelExport';
import { JobFilterDropdown, type JobFilter } from '@/components/dashboard/JobFilterDropdown';
import { ExcelUpload } from './ExcelUpload';

interface ExportPageProps {
  jobs: any[];
}

export const ExportPage = ({ jobs }: ExportPageProps) => {
  const { t } = useTranslation();
  const { exportToExcel } = useExcelExport();
  const [exportFilter, setExportFilter] = useState<JobFilter>('all');
  const [isExporting, setIsExporting] = useState(false);

  const getFilteredJobs = () => {
    if (exportFilter === 'all') return jobs;
    return jobs.filter(job => job.status === exportFilter);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const filteredJobs = getFilteredJobs();
      if (filteredJobs.length === 0) {
        return;
      }
      
      const filename = `Auftraege_${exportFilter}_${new Date().toISOString().split('T')[0]}.xlsx`;
      await exportToExcel(filteredJobs, filename);
    } finally {
      setIsExporting(false);
    }
  };

  const filteredJobs = getFilteredJobs();
  const stats = {
    total: filteredJobs.length,
    active: filteredJobs.filter(j => j.status === 'active').length,
    open: filteredJobs.filter(j => j.status === 'open').length,
    completed: filteredJobs.filter(j => j.status === 'completed' || j.status === 'completed-sent').length,
  };

  return (
    <div className="p-4 space-y-6">
      {/* Export Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Excel Export
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Zu exportierende Aufträge:</label>
            <JobFilterDropdown value={exportFilter} onValueChange={setExportFilter} />
          </div>
          
          {/* Export Statistics */}
          <div className="bg-secondary/30 p-4 rounded-lg">
            <h4 className="text-sm font-medium mb-3">Export-Übersicht</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span>Gesamt:</span>
                <Badge variant="outline">{stats.total}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Aktive:</span>
                <Badge variant="default">{stats.active}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Offene:</span>
                <Badge variant="outline">{stats.open}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Abgeschlossen:</span>
                <Badge variant="secondary">{stats.completed}</Badge>
              </div>
            </div>
          </div>

          <Separator />

          <Button 
            onClick={handleExport} 
            disabled={isExporting || filteredJobs.length === 0}
            className="w-full gap-2"
          >
            <Download className="h-4 w-4" />
            {isExporting ? 'Exportiere...' : `Excel exportieren (${filteredJobs.length} Aufträge)`}
          </Button>
        </CardContent>
      </Card>

      {/* Excel Upload */}
      <ExcelUpload />

      {/* Export History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Export-Verlauf
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">Noch keine Exports erstellt</p>
            <p className="text-xs mt-1">Deine Export-Historie wird hier angezeigt</p>
          </div>
        </CardContent>
      </Card>

      {/* Export Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Export-Informationen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <p className="font-medium text-foreground">Excel-Format</p>
              <p>Exportiert als .xlsx Datei mit formatierten Tabellen</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <p className="font-medium text-foreground">E-Mail Integration</p>
              <p>Direkte Weiterleitung an deine bevorzugte E-Mail-App</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <p className="font-medium text-foreground">Mobile Kompatibilität</p>
              <p>Optimiert für iOS und Android Geräte</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};