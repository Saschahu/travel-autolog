import { Clock } from 'lucide-react';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { TimeEntry} from '@/lib/timeCalc';
import { minutesBetween, formatHm, formatHours } from '@/lib/timeCalc';

interface TimeEntriesTableProps {
  entries: TimeEntry[];
  totalMinutes: number;
  totalBreakMinutes: number;
}

export const TimeEntriesTable = ({ entries, totalMinutes, totalBreakMinutes }: TimeEntriesTableProps) => {
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('de-DE');
    } catch {
      return dateStr;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'travel': return 'Anreise';
      case 'work': return 'Arbeitszeit';
      case 'departure': return 'Abreise';
      default: return type;
    }
  };

  if (entries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Zeiteinträge
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Keine Zeiteinträge vorhanden.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Zeiteinträge
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Datum</TableHead>
                <TableHead>Typ</TableHead>
                <TableHead>Beginn</TableHead>
                <TableHead>Ende</TableHead>
                <TableHead>Pause (Min)</TableHead>
                <TableHead>Dauer</TableHead>
                <TableHead>Notiz</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => {
                const rawMinutes = minutesBetween(entry.start, entry.end);
                const breakMinutes = entry.breakMinutes || 0;
                const workMinutes = Math.max(0, rawMinutes - breakMinutes);
                
                return (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">
                      {formatDate(entry.date)}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-secondary text-secondary-foreground">
                        {getTypeLabel(entry.type)}
                      </span>
                    </TableCell>
                    <TableCell>{entry.start}</TableCell>
                    <TableCell>{entry.end}</TableCell>
                    <TableCell>{breakMinutes}</TableCell>
                    <TableCell className="font-medium">
                      {formatHm(workMinutes)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {entry.note || '-'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        
        {/* Totals Row */}
        <div className="mt-4 pt-4 border-t space-y-2">
          <div className="flex justify-between items-center font-semibold">
            <span>Gesamtstunden:</span>
            <span className="text-lg">{formatHours(totalMinutes)}</span>
          </div>
          {totalBreakMinutes > 0 && (
            <div className="flex justify-between items-center text-muted-foreground">
              <span>Gesamtpause:</span>
              <span>{formatHours(totalBreakMinutes)}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};