import { useState, useEffect, ReactNode } from 'react';
import { ConsentDialog } from './ConsentDialog';
import { shouldShowConsentDialog } from '@/lib/privacy/consentStorage';
import { initializeApp } from '@/boot/appInit';

interface ConsentWrapperProps {
  children: ReactNode;
}

/**
 * Wrapper that handles app initialization and consent dialog
 */
export const ConsentWrapper = ({ children }: ConsentWrapperProps) => {
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    initializeAppAndCheckConsent();
  }, []);

  const initializeAppAndCheckConsent = async () => {
    try {
      // Initialize the app (migrations, etc.)
      await initializeApp();
      
      // Check if we need to show the consent dialog
      const shouldShow = await shouldShowConsentDialog();
      setShowConsentDialog(shouldShow);
      
    } catch (error) {
      console.error('Failed to initialize app or check consent:', error);
      // Continue anyway - app should still work
    } finally {
      setIsInitialized(true);
    }
  };

  const handleConsentGiven = (accepted: boolean) => {
    console.log('Consent given:', accepted);
    setShowConsentDialog(false);
  };

  // Show loading while app initializes
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      {children}
      <ConsentDialog 
        open={showConsentDialog}
        onConsentGiven={handleConsentGiven}
      />
    </>
  );
};