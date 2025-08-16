import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from 'react-i18next';

export type JobFilter = 'open' | 'active' | 'completed' | 'completed-sent' | 'all';

interface JobFilterDropdownProps {
  value: JobFilter;
  onValueChange: (value: JobFilter) => void;
}

export const JobFilterDropdown = ({ value, onValueChange }: JobFilterDropdownProps) => {
  const { t } = useTranslation();
  
  const filterOptions = [
    { value: 'open' as const, label: 'Offene (noch abzuarbeiten)' },
    { value: 'active' as const, label: 'Aktive (gerade in Bearbeitung)' },
    { value: 'completed' as const, label: 'Abgeschlossene' },
    { value: 'completed-sent' as const, label: 'Abgeschlossene und gesendet' },
    { value: 'all' as const, label: 'Alle Aufträge' }
  ];

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Aufträge filtern..." />
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