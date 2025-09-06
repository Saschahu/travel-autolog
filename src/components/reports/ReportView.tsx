import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Job } from '@/hooks/useJobs';
import { TimeEntry } from '@/lib/timeCalc';
import { OvertimeCalculation } from '@/types/overtime';
import { getOrderRefs } from '@/lib/orderRefs';
import { formatDateA4, formatHours, formatDecimalHours } from '@/lib/format';

interface ReportViewProps {
  job: Job;
  workReport: string;
  timeEntries: TimeEntry[];
  totalMinutes: number;
  overtimeCalculation: OvertimeCalculation;
  lang: string;
}

export default function ReportView({ 
  job, 
  workReport, 
  timeEntries, 
  totalMinutes, 
  overtimeCalculation, 
  lang 
}: ReportViewProps) {
  const { t } = useTranslation('report');
  const [createdAtFormatted, setCreatedAtFormatted] = useState('');
  const [timeEntriesFormatted, setTimeEntriesFormatted] = useState<Array<TimeEntry & { formattedDate: string }>>([]);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    // Format created date
    formatDateA4(new Date(), lang).then(setCreatedAtFormatted);

    // Format time entry dates
    Promise.all(
      timeEntries.map(async (entry) => ({
        ...entry,
        formattedDate: await formatDateA4(new Date(entry.date), lang)
      }))
    ).then(setTimeEntriesFormatted);
  }, [lang, timeEntries]);

  const orderRefs = getOrderRefs({ id: job.id, evaticNo: job.evaticNo });

  const getTypeLabel = (type: string): string => {
    return t(type as any) || type;
  };

  return (
    <div className="a4-page bg-white text-black print:shadow-none print:w-auto print:min-h-0 print:m-0">
      {/* Header */}
      <div className="header mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{t('title')}</h2>
          </div>
          <div className="text-right text-sm text-gray-600">
            <p>{t('createdAt')}: {createdAtFormatted}</p>
            <div data-testid="report-order-refs" className="space-y-1">
              {orderRefs.map(ref => (
                <p key={ref.label}>
                  <span className="font-medium">{ref.label}:</span> {ref.value}
                </p>
              ))}
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-300 pt-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p><span className="font-semibold">{t('customer')}:</span> {job.customerName}</p>
              <p><span className="font-semibold">{t('address')}:</span> {job.customerAddress || t('notSpecified')}</p>
              {(job.contactName || job.contactPhone) && (
                <p><span className="font-semibold">{t('contact')}:</span> {[job.contactName, job.contactPhone].filter(Boolean).join(' - ')}</p>
              )}
              {job.evaticNo && (
                <p><span className="font-semibold">{t('evaticNo')}:</span> {job.evaticNo}</p>
              )}
            </div>
            <div>
              <p><span className="font-semibold">{t('manufacturer')}:</span> {job.manufacturer || t('notSpecified')}</p>
              <p><span className="font-semibold">{t('model')}:</span> {job.model || t('notSpecified')}</p>
              <p><span className="font-semibold">{t('serialNumber')}:</span> {job.serialNumber || t('notSpecified')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Time Entries Table */}
      <div className="section mb-6">
        <h2 className="text-lg font-bold mb-3 text-gray-900">{t('workTimes')}</h2>
        {timeEntriesFormatted.length > 0 ? (
          <table className="w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-2 py-1 text-left">{t('date')}</th>
                <th className="border border-gray-300 px-2 py-1 text-left">{t('type')}</th>
                <th className="border border-gray-300 px-2 py-1 text-left">{t('from')}</th>
                <th className="border border-gray-300 px-2 py-1 text-left">{t('to')}</th>
                <th className="border border-gray-300 px-2 py-1 text-left">{t('break')}</th>
                <th className="border border-gray-300 px-2 py-1 text-left">{t('duration')}</th>
                <th className="border border-gray-300 px-2 py-1 text-left">{t('note')}</th>
              </tr>
            </thead>
            <tbody>
              {timeEntriesFormatted.map((entry) => {
                const rawMinutes = entry.end && entry.start ? 
                  (new Date(`2000-01-01T${entry.end}:00`).getTime() - new Date(`2000-01-01T${entry.start}:00`).getTime()) / (1000 * 60) : 0;
                const workMinutes = Math.max(0, rawMinutes - (entry.breakMinutes || 0));
                
                return (
                  <tr key={entry.id}>
                    <td className="border border-gray-300 px-2 py-1">{entry.formattedDate}</td>
                    <td className="border border-gray-300 px-2 py-1">{getTypeLabel(entry.type)}</td>
                    <td className="border border-gray-300 px-2 py-1">{entry.start}</td>
                    <td className="border border-gray-300 px-2 py-1">{entry.end}</td>
                    <td className="border border-gray-300 px-2 py-1">{entry.breakMinutes || 0} {t('minutesShort')}</td>
                    <td className="border border-gray-300 px-2 py-1 font-medium">{formatHours(workMinutes)}</td>
                    <td className="border border-gray-300 px-2 py-1">{entry.note || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-bold">
                <td colSpan={5} className="border border-gray-300 px-2 py-1 text-right">{t('totalHours')}:</td>
                <td className="border border-gray-300 px-2 py-1">{formatHours(totalMinutes)}</td>
                <td className="border border-gray-300 px-2 py-1"></td>
              </tr>
            </tfoot>
          </table>
        ) : (
          <p className="text-gray-600">{t('noTimeEntries')}</p>
        )}
      </div>

      {/* Overtime Breakdown */}
      <div className="section mb-6">
        <h2 className="text-lg font-bold mb-3 text-gray-900">{t('overtimeBreakdown')}</h2>
        <div className="grid grid-cols-3 gap-4 text-sm mb-4">
          <div className="border border-gray-300 p-2 text-center">
            <div className="font-semibold">{t('regular')}</div>
            <div>{formatDecimalHours(overtimeCalculation.regularHours)}</div>
          </div>
          <div className="border border-gray-300 p-2 text-center">
            <div className="font-semibold">{t('overtime50')}</div>
            <div>{formatDecimalHours(overtimeCalculation.overtime1Hours)}</div>
          </div>
          <div className="border border-gray-300 p-2 text-center">
            <div className="font-semibold">{t('overtime100')}</div>
            <div>{formatDecimalHours(overtimeCalculation.overtime2Hours)}</div>
          </div>
        </div>
        
        {(overtimeCalculation.saturdayHours > 0 || overtimeCalculation.sundayHours > 0) && (
          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
            <div className="border border-gray-300 p-2 text-center">
              <div className="font-semibold">{t('saturday50')}</div>
              <div>{formatDecimalHours(overtimeCalculation.saturdayHours)}</div>
            </div>
            <div className="border border-gray-300 p-2 text-center">
              <div className="font-semibold">{t('sundayHoliday100')}</div>
              <div>{formatDecimalHours(overtimeCalculation.sundayHours)}</div>
            </div>
          </div>
        )}
        
        <div className="border border-gray-300 p-3 bg-gray-50 font-bold text-center">
          {t('totalHours')}: {formatHours(totalMinutes)}
        </div>
      </div>

      {/* Work Report */}
      <div className="section mb-6">
        <h2 className="text-lg font-bold mb-3 text-gray-900">{t('workReport')}</h2>
        <div className="border border-gray-300 p-3 bg-gray-50 min-h-[100px] whitespace-pre-wrap text-sm">
          {workReport || t('noWorkReport')}
        </div>
      </div>

      {/* Signature Section */}
      <div className="section mt-8">
        <h2 className="text-lg font-bold mb-4 text-gray-900">{t('signatures')}</h2>
        <div className="grid grid-cols-2 gap-8">
          <div>
            <div className="border-t border-gray-400 pt-2">
              <p className="text-sm text-gray-600">{t('technician')}</p>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-600">{t('dateLabel')}: _________________</p>
            </div>
          </div>
          <div>
            <div className="border-t border-gray-400 pt-2">
              <p className="text-sm text-gray-600">{t('customerSig')}</p>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-600">{t('dateLabel')}: _________________</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}