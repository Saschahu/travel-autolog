import React from 'react';
import { I18nextProvider } from 'react-i18next';
import { createReportI18n } from '@/lib/i18n/reportI18n';
import ReportView from './ReportView';
import { Job } from '@/hooks/useJobs';
import { TimeEntry } from '@/lib/timeCalc';
import { OvertimeCalculation } from '@/types/overtime';

interface ReportData {
  job: Job;
  workReport: string;
  timeEntries: TimeEntry[];
  totalMinutes: number;
  overtimeCalculation: OvertimeCalculation;
}

export async function renderReportElement(data: ReportData, lang: string) {
  console.debug('[report] Rendering with lang:', lang);
  
  const i18n = await createReportI18n(lang);
  
  console.debug('[report] i18n initialized, language:', i18n.language);
  
  const element = React.createElement(
    I18nextProvider,
    { i18n },
    React.createElement(ReportView, {
      job: data.job,
      workReport: data.workReport,
      timeEntries: data.timeEntries,
      totalMinutes: data.totalMinutes,
      overtimeCalculation: data.overtimeCalculation,
      lang: lang
    })
  );
  
  return { element, i18n };
}