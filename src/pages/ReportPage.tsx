import React from 'react';
import { ExportPage } from '@/components/export/ExportPage';
import { useJobs } from '@/hooks/useJobs';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { AppHeader } from '@/components/layout/AppHeader';
import { useState } from 'react';
import { SettingsDialog } from '@/components/settings/SettingsDialog';

const ReportPage: React.FC = () => {
  const { jobs } = useJobs();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <MobileLayout>
      <AppHeader onSettingsClick={() => setSettingsOpen(true)} />
      <div className="flex-1 overflow-y-auto p-4">
        <ExportPage jobs={jobs} />
      </div>
      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />
    </MobileLayout>
  );
};

export default ReportPage;