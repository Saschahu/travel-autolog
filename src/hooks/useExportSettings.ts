import { useState, useEffect } from 'react';

export interface ExportSettings {
  exportDirUri?: string;
  preferredEmailProvider: string;
}

export const useExportSettings = () => {
  const [settings, setSettings] = useState<ExportSettings>({
    preferredEmailProvider: 'mailto'
  });

  useEffect(() => {
    // Load settings from localStorage
    const savedExportUri = localStorage.getItem('android-export-dir-uri');
    const savedEmailProvider = localStorage.getItem('preferred-email-provider');
    
    setSettings({
      exportDirUri: savedExportUri || undefined,
      preferredEmailProvider: savedEmailProvider || 'mailto'
    });
  }, []);

  return settings;
};