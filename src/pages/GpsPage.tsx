import React from 'react';
import { GPSPage as GPSPageComponent } from '@/components/gps/GPSPage';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { AppHeader } from '@/components/layout/AppHeader';
import { useState } from 'react';
import { SettingsDialog } from '@/components/settings/SettingsDialog';

const GpsPage: React.FC = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <MobileLayout>
      <AppHeader onSettingsClick={() => setSettingsOpen(true)} />
      <GPSPageComponent />
      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />
    </MobileLayout>
  );
};

export default GpsPage;