import React from 'react';
import { saveExportHandle } from '@/lib/fsStore';
import { isFileSystemAccessSupported } from '@/lib/fsAccess';

// Bridge page that runs at top-level to handle directory picking in cross-origin contexts
export default function DirectoryPickerBridge() {
  const [error, setError] = React.useState<string | null>(null);
  const [isStarting, setIsStarting] = React.useState(false);

  const handleStartPicker = async () => {
    setIsStarting(true);
    setError(null);

    try {
      // Check if File System Access API is supported
      if (!isFileSystemAccessSupported()) {
        throw new Error('Ihr Browser unterstützt die Ordnerauswahl nicht.');
      }

      const handle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
      
      // Request permission for read/write access
      if (handle.requestPermission) {
        const permission = await handle.requestPermission({ mode: 'readwrite' });
        if (permission !== 'granted') {
          throw new Error('Berechtigung nicht erteilt');
        }
      }

      // Save the handle to IndexedDB with metadata
      await saveExportHandle(handle, { displayName: handle.name });

      // Notify parent via BroadcastChannel
      try {
        const bc = new BroadcastChannel('fs-bridge');
        bc.postMessage({ type: 'fs:selected', key: 'exportDir' });
        bc.close();
      } catch (bcError) {
        console.warn('BroadcastChannel failed, using localStorage fallback');
      }

      // Fallback signal via localStorage
      localStorage.setItem('fs.exportDir.selectedAt', String(Date.now()));

      // Close the tab after success
      window.close();
    } catch (err: any) {
      let message = 'Unbekannter Fehler';
      
      if (err?.name === 'AbortError') {
        message = 'Auswahl abgebrochen';
      } else if (err?.name === 'NotAllowedError') {
        message = 'Berechtigung verweigert';
      } else if (err?.message) {
        message = err.message;
      }
      
      setError(message);
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="max-w-md w-full rounded-lg border bg-card p-6 shadow-lg">
        <h1 className="text-lg font-semibold mb-3 text-card-foreground">Ordner auswählen</h1>
        <p className="text-sm text-muted-foreground mb-4">
          Klicken Sie auf „Ordnerauswahl starten". Der System-Dialog öffnet sich in diesem Tab.
        </p>
        
        {error && (
          <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
            Fehler: {error}
          </div>
        )}
        
        <button
          type="button"
          onClick={handleStartPicker}
          disabled={isStarting}
          className="w-full rounded-md px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isStarting ? 'Ordnerauswahl läuft...' : 'Ordnerauswahl starten'}
        </button>
        
        <p className="mt-3 text-xs text-muted-foreground">
          Hinweis: Der Dialog öffnet sich direkt in diesem Tab - keine Pop-up-Blocker nötig.
        </p>
      </div>
    </div>
  );
}
