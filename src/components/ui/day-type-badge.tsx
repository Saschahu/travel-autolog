import React from 'react';
import { Badge } from '@/components/ui/badge';
import { DayTypeResult } from '@/lib/holidays';
import { Calendar, Sun, Moon, Star } from 'lucide-react';

interface DayTypeBadgeProps {
  dayType: DayTypeResult;
  showSource?: boolean;
}

export const DayTypeBadge = ({ dayType, showSource = false }: DayTypeBadgeProps) => {
  const getIcon = () => {
    switch (dayType.type) {
      case 'saturday':
        return <Sun className="h-3 w-3" />;
      case 'sunday':
        return <Moon className="h-3 w-3" />;
      case 'holiday':
        return <Star className="h-3 w-3" />;
      default:
        return <Calendar className="h-3 w-3" />;
    }
  };

  const getVariant = () => {
    if (dayType.source === 'override') return 'default';
    
    switch (dayType.type) {
      case 'saturday':
        return 'secondary';
      case 'sunday':
        return 'secondary';
      case 'holiday':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getText = () => {
    switch (dayType.type) {
      case 'saturday':
        return 'Samstag';
      case 'sunday':
        return 'Sonntag';
      case 'holiday':
        return dayType.holidayName || 'Feiertag';
      default:
        return 'Arbeitstag';
    }
  };

  const getSourceText = () => {
    if (!showSource || !dayType.source) return '';
    
    switch (dayType.source) {
      case 'override':
        return ' (manuell)';
      case 'ics':
        return ' (Kalender)';
      case 'builtin':
        return ' (gesetzlich)';
      case 'weekend':
        return ' (automatisch)';
      default:
        return '';
    }
  };

  return (
    <Badge variant={getVariant()} className="flex items-center gap-1">
      {getIcon()}
      {getText()}{getSourceText()}
    </Badge>
  );
};