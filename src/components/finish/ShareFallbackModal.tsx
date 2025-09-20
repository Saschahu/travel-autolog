import { Download, Mail, X } from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Job } from '@/hooks/useJobs';
import { downloadBlob, buildEmailContent, buildMailtoUrl, openMailtoLink } from '@/lib/shareWithEmail';

interface UserProfile {
  reportTo?: string;
  reportCc?: string;
  reportBcc?: string;
  email?: string;
}

interface ShareFallbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file?: File;
  job: Job;
  workReport: string;
  profile?: UserProfile;
}

export const ShareFallbackModal = ({ 
  open, 
  onOpenChange, 
  file, 
  job, 
  workReport, 
  profile 
}: ShareFallbackModalProps) => {
  
  const handleDownloadPdf = () => {
    if (!file) return;
    downloadBlob(file, file.name);
    onOpenChange(false);
  };

  const handleEmailWithoutAttachment = () => {
    const { subject, body } = buildEmailContent(job, workReport);
    
    const recipients = {
      to: profile?.reportTo || profile?.email,
      cc: profile?.reportCc,
      bcc: profile?.reportBcc
    };

    const mailtoUrl = buildMailtoUrl(recipients, subject, body);
    openMailtoLink(mailtoUrl);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            E-Mail mit Anhang nicht unterstützt
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Ihr Gerät/Browser erlaubt das direkte Versenden mit Anhang nicht. 
            Sie können den Report herunterladen und anschließend in Ihrer E-Mail anhängen – 
            oder wir öffnen Ihre E-Mail-App ohne Anhang.
          </p>
          
          <div className="space-y-3">
            <Button 
              onClick={handleDownloadPdf}
              variant="default"
              className="w-full flex items-center gap-2"
              disabled={!file}
            >
              <Download className="h-4 w-4" />
              PDF herunterladen
            </Button>
            
            <Button 
              onClick={handleEmailWithoutAttachment}
              variant="secondary"
              className="w-full flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              E-Mail ohne Anhang
            </Button>
            
            <Button 
              onClick={() => onOpenChange(false)}
              variant="outline"
              className="w-full flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Abbrechen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};