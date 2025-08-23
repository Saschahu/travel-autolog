import React from 'react';
import { saveExportHandle } from '@/lib/fsStore';

// Bridge page that runs at top-level to handle directory picking in cross-origin contexts
export default function DirectoryPickerBridge() {
  React.useEffect(() => {
    (async () => {
      // Check if File System Access API is supported
      if (!('showDirectoryPicker' in window)) {
        alert('Ihr Browser unterstützt die Ordnerauswahl (File System Access API) nicht.');
        return;
      }

      try {
        const handle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
        
        // Request permission for read/write access
        if (handle.requestPermission) {
          const permission = await handle.requestPermission({ mode: 'readwrite' });
          if (permission !== 'granted') {
            throw new Error('Berechtigung nicht erteilt');
          }
        }

        // Save the handle to IndexedDB
        await saveExportHandle(handle);

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

        // Close the tab
        window.close();
      } catch (err: any) {
        const message = err?.name === 'AbortError' 
          ? 'Auswahl abgebrochen' 
          : `Auswahl fehlgeschlagen: ${err?.message || 'Unbekannter Fehler'}`;
        alert(message);
        // Keep tab open so user can try again
      }
    })();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <h1 className="text-lg font-semibold">Ordnerauswahl wird gestartet…</h1>
        <p className="text-sm text-muted-foreground">
          Falls kein Dialog erscheint, prüfen Sie bitte Ihren Pop-Up-Blocker.
        </p>
      </div>
    </div>
  );
}
