import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export type JobFilter = 'open' | 'active' | 'completed' | 'completed-sent' | 'all';

interface JobFilterDropdownProps {
  value: JobFilter;
  onValueChange: (value: JobFilter) => void;
}

export const JobFilterDropdown = ({ value, onValueChange }: JobFilterDropdownProps) => {
  const { t } = useTranslation();
  
  const filterOptions = [
    { value: 'open' as const, label: t('openJobs') },
    { value: 'active' as const, label: t('activeJobsFilter') },
    { value: 'completed' as const, label: t('completedJobsFilter') },
    { value: 'completed-sent' as const, label: t('completedSentJobs') },
    { value: 'all' as const, label: t('allJobs') }
  ];

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={t('filterJobs')} />
      </SelectTrigger>
      <SelectContent>
        {filterOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};