import { useTranslation } from 'react-i18next';

interface PrivacySummaryProps {
  variant?: 'full' | 'brief';
  className?: string;
}

/**
 * Reusable privacy summary component with safe HTML rendering
 */
export const PrivacySummary = ({ variant = 'brief', className = '' }: PrivacySummaryProps) => {
  const { t } = useTranslation();

  if (variant === 'full') {
    return (
      <div className={`space-y-4 text-sm text-muted-foreground ${className}`}>
        <div>
          <h4 className="font-medium text-foreground mb-2">{t('privacy.whatWeCollect')}</h4>
          <p>{t('privacy.collectDescription')}</p>
        </div>
        
        <div>
          <h4 className="font-medium text-foreground mb-2">{t('privacy.howWeUseData')}</h4>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>{t('privacy.useCase1')}</li>
            <li>{t('privacy.useCase2')}</li>
            <li>{t('privacy.useCase3')}</li>
          </ul>
        </div>
        
        <div>
          <h4 className="font-medium text-foreground mb-2">{t('privacy.yourRights')}</h4>
          <p>{t('privacy.rightsDescription')}</p>
        </div>
        
        <div className="pt-2 border-t">
          <p className="text-xs">
            {t('privacy.lastUpdated')}: {t('privacy.lastUpdatedDate')}
          </p>
        </div>
      </div>
    );
  }

  // Brief variant
  return (
    <div className={`space-y-3 text-sm text-muted-foreground ${className}`}>
      <p>
        {t('privacy.briefDescription')}
      </p>
      
      <p>
        {t('privacy.dataTypes')}
      </p>
      
      <p className="text-xs">
        {t('privacy.canChangeAnytime')} {' '}
        <a 
          href="/privacy.html" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          {t('privacy.learnMore')}
        </a>
      </p>
    </div>
  );
};