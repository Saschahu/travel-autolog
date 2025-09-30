import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, X, Check } from 'lucide-react';
import { PrivacySummary } from './PrivacySummary';
import { setConsentStatus } from '@/lib/privacy/consentStorage';
import { setTelemetryEnabled } from '@/boot/monitoring';

interface ConsentDialogProps {
  open: boolean;
  onConsentGiven: (accepted: boolean) => void;
}

/**
 * Privacy consent dialog shown on first app launch
 */
export const ConsentDialog = ({ open, onConsentGiven }: ConsentDialogProps) => {
  const { t } = useTranslation('common');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConsent = async (accepted: boolean) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      // Store consent choice
      await setConsentStatus(accepted ? 'accepted' : 'declined');
      
      // Enable/disable telemetry based on choice
      setTelemetryEnabled(accepted);
      
      // Notify parent component
      onConsentGiven(accepted);
      
    } catch (error) {
      console.error('Failed to save consent:', error);
      // Still close dialog even if storage fails
      onConsentGiven(accepted);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}} modal>
      <DialogContent 
        className="max-w-md sm:max-w-lg max-h-[90vh] overflow-y-auto"
        // Prevent closing by clicking outside or pressing escape
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary" />
            </div>
          </div>
          
          <DialogTitle className="text-xl font-semibold">
            {t('privacy.consentTitle')}
          </DialogTitle>
          
          <DialogDescription className="text-center text-muted-foreground">
            {t('privacy.consentSubtitle')}
          </DialogDescription>
        </DialogHeader>

        <Card className="mt-4">
          <CardContent className="pt-6">
            <PrivacySummary variant="brief" />
          </CardContent>
        </Card>

        <div className="space-y-3 pt-4">
          <Button
            onClick={() => handleConsent(true)}
            disabled={isProcessing}
            className="w-full"
            aria-label={t('privacy.acceptTelemetry')}
          >
            <Check className="mr-2 h-4 w-4" />
            {isProcessing ? t('privacy.saving') : t('privacy.acceptTelemetry')}
          </Button>
          
          <Button
            onClick={() => handleConsent(false)}
            disabled={isProcessing}
            variant="outline"
            className="w-full"
            aria-label={t('privacy.declineTelemetry')}
          >
            <X className="mr-2 h-4 w-4" />
            {t('privacy.declineTelemetry')}
          </Button>
        </div>

        <div className="text-center text-xs text-muted-foreground mt-4 space-y-2">
          <p>{t('privacy.consentNote')}</p>
          <p>
            <a 
              href="/privacy.html" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
              aria-label={t('privacy.readFullPolicy')}
            >
              {t('privacy.readFullPolicy')}
            </a>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};