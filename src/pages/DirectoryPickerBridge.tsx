import { FolderOpen, AlertCircle, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { pickDirectoryWeb } from '@/lib/fs/webDirectory';

export const DirectoryPickerBridge = () => {
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartPicker = async () => {
    setIsStarting(true);
    setError(null);

    try {
      if (!('showDirectoryPicker' in window)) {
        throw new Error('File System Access API is not supported in this browser');
      }

      const result = await pickDirectoryWeb();
      
      if (result) {
        // Notify parent window via BroadcastChannel
        try {
          const bc = new BroadcastChannel('fs-bridge');
          bc.postMessage({
            type: 'fs:selected',
            key: 'exportDir',
            timestamp: Date.now()
          });
          bc.close();
        } catch (bcError) {
          console.warn('BroadcastChannel failed, using localStorage fallback');
          // Fallback: use localStorage
          localStorage.setItem('fs.exportDir.selectedAt', String(Date.now()));
        }

        // Close this tab
        window.close();
      } else {
        setError('Directory selection was cancelled');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Directory picker error:', err);
      
      let friendlyMessage = errorMessage;
      if (errorMessage.includes('No user activation')) {
        friendlyMessage = 'Please click the button directly (no automated actions allowed).';
      } else if (errorMessage.includes('not supported')) {
        friendlyMessage = 'Your browser does not support directory selection.';
      } else if (errorMessage.includes('denied')) {
        friendlyMessage = 'Permission denied. Please try again.';
      }
      
      setError(friendlyMessage);
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-primary" />
            Directory Picker
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Click the button below to select a directory for exporting files. 
            This window will close automatically after selection.
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleStartPicker}
            disabled={isStarting}
            className="w-full"
            size="lg"
          >
            {isStarting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Starting Directory Picker...
              </>
            ) : (
              <>
                <FolderOpen className="mr-2 h-4 w-4" />
                Start Directory Selection
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};