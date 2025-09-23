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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useExportSettings } from '@/hooks/useExportSettings';
import { Job } from '@/hooks/useJobs';

interface ExportPageProps {
  jobs: Job[];
}

export const ExportPage = ({ jobs }: ExportPageProps) => {
  const { t } = useTranslation();
  const { exportToExcel } = useExcelExport();
  const exportSettings = useExportSettings();
  const [exportFilter, setExportFilter] = useState<JobFilter>('all');
  const [isExporting, setIsExporting] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | 'all'>('all');

  const getFilteredJobs = () => {
    // Wenn ein bestimmter Auftrag gewählt ist, hat das Vorrang
    if (selectedJobId !== 'all') return jobs.filter(j => j.id === selectedJobId);
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
      
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = filteredJobs.length === 1
        ? `ServiceTracker_Arbeitszeit-Nachweis_${(filteredJobs[0].customerName || 'Kunde').replace(/\s+/g,'_')}_${dateStr}.xlsx`
        : `Auftraege_${exportFilter}_${dateStr}.xlsx`;
      await exportToExcel(filteredJobs, filename, exportSettings.exportDirUri);
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
            {t('excelExport')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">{t('jobsToExport')}</label>
            <JobFilterDropdown value={exportFilter} onValueChange={setExportFilter} />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">{t('singleJobTemplate')}</label>
            <Select value={selectedJobId} onValueChange={(v: string) => setSelectedJobId(v as string | 'all')}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Alle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('exportAll')}</SelectItem>
                {jobs.map(j => (
                  <SelectItem key={j.id} value={j.id}>{`${j.customerName || 'Unbenannt'} — ${j.id}`}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Export Statistics */}
          <div className="bg-secondary/30 p-4 rounded-lg">
            <h4 className="text-sm font-medium mb-3">{t('exportOverview')}</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span>{t('totalJobs')}</span>
                <Badge variant="outline">{stats.total}</Badge>
              </div>
              <div className="flex justify-between">
                <span>{t('activeJobsStats')}</span>
                <Badge variant="default">{stats.active}</Badge>
              </div>
              <div className="flex justify-between">
                <span>{t('openJobsStats')}</span>
                <Badge variant="outline">{stats.open}</Badge>
              </div>
              <div className="flex justify-between">
                <span>{t('completedJobsStats')}</span>
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
            {isExporting ? t('exporting') : `${t('exportExcel')} (${filteredJobs.length} ${t('jobsCount')})`}
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
            {t('exportHistory')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">{t('noExportsCreated')}</p>
            <p className="text-xs mt-1">{t('exportHistoryWillShow')}</p>
          </div>
        </CardContent>
      </Card>

      {/* Export Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            {t('exportInformation')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <p className="font-medium text-foreground">{t('excelFormat')}</p>
              <p>{t('exportedAsXlsx')}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <p className="font-medium text-foreground">{t('emailIntegration')}</p>
              <p>{t('directForwarding')}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <p className="font-medium text-foreground">{t('mobileCompatibility')}</p>
              <p>{t('mobileOptimized')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};