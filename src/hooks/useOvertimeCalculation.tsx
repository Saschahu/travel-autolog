import { useState, useEffect } from 'react';
import { OvertimeSettings, OvertimeCalculation, DEFAULT_OVERTIME_SETTINGS } from '@/types/overtime';
import { Job as JobData } from '@/hooks/useJobs'; // Assuming this is the old, less strict Job type
import { Job as StrictJob, DayData } from '@/types/job';
import { calcDailyMinutes, calcOvertime as calcOvertimePure } from '@/lib/overtime';

export const useOvertimeCalculation = () => {
  const [overtimeSettings, setOvertimeSettings] = useState<OvertimeSettings>(DEFAULT_OVERTIME_SETTINGS);

  useEffect(() => {
    const saved = localStorage.getItem('overtimeSettings');
    if (saved) {
      try {
        setOvertimeSettings(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading overtime settings:', error);
      }
    }
  }, []);

  const saveSettings = (settings: OvertimeSettings) => {
    setOvertimeSettings(settings);
    localStorage.setItem('overtimeSettings', JSON.stringify(settings));
  };

  const formatMinutesToDecimalHours = (minutes: number): number => {
    return Math.round((minutes / 60) * 100) / 100;
  };

  const calculateTimeBreakdown = (job: JobData): {
    travelTime: number, 
    workTime: number, 
    departureTime: number 
  } => {
    const result = calcOvertimePure(job as StrictJob);
    return {
      travelTime: result.sumTravel,
      workTime: result.sumWork,
      departureTime: result.sumDeparture,
    };
  };

  const calculateOvertime = (job: JobData): OvertimeCalculation => {
    // This is a temporary adapter. The UI passes a less strict Job type.
    const strictJob: StrictJob = {
      id: job.id,
      days: job.days as DayData[] | undefined
    };

    // The pure function `calcOvertimePure` does not handle the complex overtime tiers (50%, 100%)
    // or guaranteed hours. This hook's purpose is now to adapt the pure calculation
    // to the complex structure expected by the UI (`OvertimeCalculation`).
    // The core minute calculation is now delegated and tested.

    let totalRegularHours = 0;
    let totalOvertime1Hours = 0;
    let totalOvertime2Hours = 0;
    let totalSaturdayHours = 0;
    let totalSundayHours = 0;
    
    if (strictJob.days && Array.isArray(strictJob.days) && strictJob.days.length > 0) {
      strictJob.days.forEach((day) => {
        const daily = calcDailyMinutes(day);
        const dayHours = formatMinutesToDecimalHours(daily.total);
        
        const dayRegularHours = Math.min(dayHours, overtimeSettings.overtimeThreshold1);
        const dayOvertime1Hours = Math.max(0, Math.min(dayHours - overtimeSettings.overtimeThreshold1, overtimeSettings.overtimeThreshold2 - overtimeSettings.overtimeThreshold1));
        const dayOvertime2Hours = Math.max(0, dayHours - overtimeSettings.overtimeThreshold2);
        
        totalRegularHours += dayRegularHours;
        totalOvertime1Hours += dayOvertime1Hours;
        totalOvertime2Hours += dayOvertime2Hours;
        
        const dayOfWeek = day.date ? new Date(`${day.date}T00:00:00Z`).getUTCDay() : -1;
        if (dayOfWeek === 6) { // Saturday
          totalSaturdayHours += dayHours;
        } else if (dayOfWeek === 0) { // Sunday
          totalSundayHours += dayHours;
        }
      });
    }
    
    const actualWorkedHours = totalRegularHours + totalOvertime1Hours + totalOvertime2Hours;
    
    const overtimeBreakdown = [];
    if (totalOvertime1Hours > 0) {
      const premiumHours = totalOvertime1Hours * (overtimeSettings.overtimeRate1 / 100);
      overtimeBreakdown.push({
        type: `Überstunden ${overtimeSettings.overtimeThreshold1}-${overtimeSettings.overtimeThreshold2}h`,
        hours: totalOvertime1Hours,
        rate: overtimeSettings.overtimeRate1,
        amount: premiumHours
      });
    }
    if (totalOvertime2Hours > 0) {
      const premiumHours = totalOvertime2Hours * (overtimeSettings.overtimeRate2 / 100);
      overtimeBreakdown.push({
        type: `Überstunden über ${overtimeSettings.overtimeThreshold2}h`,
        hours: totalOvertime2Hours,
        rate: overtimeSettings.overtimeRate2,
        amount: premiumHours
      });
    }
    if (overtimeSettings.weekendEnabled) {
      if (totalSaturdayHours > 0) {
        const premiumHours = totalSaturdayHours * (overtimeSettings.saturdayRate / 100);
        overtimeBreakdown.push({
          type: 'Samstag',
          hours: totalSaturdayHours,
          rate: overtimeSettings.saturdayRate,
          amount: premiumHours
        });
      }
      if (totalSundayHours > 0) {
        const premiumHours = totalSundayHours * (overtimeSettings.sundayRate / 100);
        overtimeBreakdown.push({
          type: 'Sonntag/Feiertag',
          hours: totalSundayHours,
          rate: overtimeSettings.sundayRate,
          amount: premiumHours
        });
      }
    }
    
    const totalOvertimeHours = totalOvertime1Hours + totalOvertime2Hours;
    const totalPremiumAmount = overtimeBreakdown.reduce((sum, item) => sum + item.amount, 0);
    
    const numberOfPaidDays = (strictJob.days || []).filter(day => calcDailyMinutes(day).total > 0).length;
    const guaranteedHours = overtimeSettings.guaranteedHours * numberOfPaidDays;
    
    const baseHours = actualWorkedHours;
    const totalPayableHours = Math.max(guaranteedHours, baseHours + totalPremiumAmount);

    return {
      guaranteedHours,
      actualWorkedHours,
      regularHours: totalRegularHours,
      overtime1Hours: totalOvertime1Hours,
      overtime2Hours: totalOvertime2Hours,
      saturdayHours: totalSaturdayHours,
      sundayHours: totalSundayHours,
      overtimeBreakdown,
      totalOvertimeHours,
      totalOvertimeAmount: totalPremiumAmount,
      totalPayableHours
    };
  };

  return {
    overtimeSettings,
    saveSettings,
    calculateOvertime,
    calculateTimeBreakdown,
    formatMinutesToHours: formatMinutesToDecimalHours
  };
};