import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useSettingsStore, type LocaleCode } from '@/state/settingsStore';
import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'de', name: 'Deutsch' },
  { code: 'en', name: 'English' },
  { code: 'nb', name: 'Norsk' },
  { code: 'sv', name: 'Svenska' },
  { code: 'da', name: 'Dansk' }
];

export const LanguageSettings = () => {
  const { t } = useTranslation();
  const { locale, setLocale } = useSettingsStore();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Languages className="h-4 w-4 text-primary" />
          {t('appLanguage')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="app-language">{t('uiLanguage')}</Label>
          <Select value={locale} onValueChange={(value: LocaleCode) => setLocale(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {languages.map((lang) => (
                <SelectItem key={lang.code} value={lang.code as LocaleCode}>
                  {lang.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-xs text-muted-foreground">
          {t('languageNote')}
        </p>
      </CardContent>
    </Card>
  );
};