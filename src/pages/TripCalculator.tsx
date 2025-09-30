import { ManualTripInput } from '@/components/trip/ManualTripInput';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TripInput } from '@/types/trip';
import { DEFAULT_ROUTE_SOURCE } from '@/flags/remoteConfig';

export const TripCalculator = () => {
  const { t } = useTranslation('trip');
  
  const handleCalculate = (input: TripInput) => {
    console.log('Calculate route:', input);
    // TODO: Implement scraper call
  };
  
  const handleSaveDraft = (input: TripInput) => {
    console.log('Save draft:', input);
    // TODO: Implement draft saving
  };
  
  return (
    <div className="container mx-auto p-4 space-y-6">
      {DEFAULT_ROUTE_SOURCE === 'manual' && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            {t('noGpsHint')}
          </AlertDescription>
        </Alert>
      )}
      
      <ManualTripInput 
        onCalculate={handleCalculate}
        onSaveDraft={handleSaveDraft}
      />
      
      {/* Future: Add result display component here */}
    </div>
  );
};
