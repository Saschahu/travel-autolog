import { useState, useEffect } from 'react';
import { OvertimeSettings, OvertimeCalculation, TimeSlot, DEFAULT_OVERTIME_SETTINGS } from '@/types/overtime';
import { Job } from '@/hooks/useJobs';
import { minutesBetweenAcrossMidnight, isSundayUTC } from '@/lib/timeMath';

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

  const calculateTimeBreakdown = (job: Job): { 
    travelTime: number, 
    workTime: number, 
    departureTime: number 
  } => {
    let travelTime = 0;
    let workTime = 0; 
    let departureTime = 0;

    // Travel time: prefer top-level, otherwise sum from days
    if (job.travelStart && job.travelEnd) {
      travelTime = minutesBetweenAcrossMidnight(job.travelStart, job.travelEnd);
    } else if (job.days && Array.isArray(job.days)) {
      job.days.forEach((day: any) => {
        if (day.travelStart && day.travelEnd) {
          travelTime += minutesBetweenAcrossMidnight(day.travelStart, day.travelEnd);
        }
      });
    }

    // Work time: prefer top-level, otherwise sum from days
    if (job.workStart && job.workEnd) {
      workTime = minutesBetweenAcrossMidnight(job.workStart, job.workEnd);
    } else if (job.days && Array.isArray(job.days)) {
      job.days.forEach((day: any) => {
        if (day.workStart && day.workEnd) {
          workTime += minutesBetweenAcrossMidnight(day.workStart, day.workEnd);
        }
      });
    }

    // Departure time: prefer top-level, otherwise sum from days
    if (job.departureStart && job.departureEnd) {
      departureTime = minutesBetweenAcrossMidnight(job.departureStart, job.departureEnd);
    } else if (job.days && Array.isArray(job.days)) {
      job.days.forEach((day: any) => {
        if (day.departureStart && day.departureEnd) {
          departureTime += minutesBetweenAcrossMidnight(day.departureStart, day.departureEnd);
        }
      });
    }

    return { travelTime, workTime, departureTime };
  };

  const getDayOfWeek = (dateString?: string): number => {
    if (!dateString) return new Date().getUTCDay(); // Use UTC for consistency
    return new Date(`${dateString}T00:00:00Z`).getUTCDay();
  };

  const calculateOvertime = (job: Job): OvertimeCalculation => {
    const timeBreakdown = calculateTimeBreakdown(job);
    
    // For multi-day jobs, we need to calculate overtime per day
    let totalRegularHours = 0;
    let totalOvertime1Hours = 0;
    let totalOvertime2Hours = 0;
    let totalSaturdayHours = 0;
    let totalSundayHours = 0;
    
    // If we have days data, calculate per day
    if (job.days && Array.isArray(job.days) && job.days.length > 0) {
      job.days.forEach((day: any) => {
        let dayTotalMinutes = 0;
        if (day.travelStart && day.travelEnd) dayTotalMinutes += minutesBetweenAcrossMidnight(day.travelStart, day.travelEnd);
        if (day.workStart && day.workEnd) dayTotalMinutes += minutesBetweenAcrossMidnight(day.workStart, day.workEnd);
        if (day.departureStart && day.departureEnd) dayTotalMinutes += minutesBetweenAcrossMidnight(day.departureStart, day.departureEnd);
        
        const dayHours = formatMinutesToHours(dayTotalMinutes);
        
        // Calculate regular vs overtime for this day
        const dayRegularHours = Math.min(dayHours, overtimeSettings.overtimeThreshold1);
        const dayOvertime1Hours = Math.max(0, Math.min(dayHours - overtimeSettings.overtimeThreshold1, overtimeSettings.overtimeThreshold2 - overtimeSettings.overtimeThreshold1));
        const dayOvertime2Hours = Math.max(0, dayHours - overtimeSettings.overtimeThreshold2);
        
        totalRegularHours += dayRegularHours;
        totalOvertime1Hours += dayOvertime1Hours;
        totalOvertime2Hours += dayOvertime2Hours;
        
        // Weekend hours
        const dayOfWeek = getDayOfWeek(day.date);
        if (dayOfWeek === 6) { // Saturday
          totalSaturdayHours += dayHours;
        } else if (isSundayUTC(day.date)) { // Sunday
          totalSundayHours += dayHours;
        }
      });
    } else {
      // Single day calculation (fallback)
      const totalMinutes = timeBreakdown.travelTime + timeBreakdown.workTime + timeBreakdown.departureTime;
      const totalHours = formatMinutesToHours(totalMinutes);
      
      totalRegularHours = Math.min(totalHours, overtimeSettings.overtimeThreshold1);
      totalOvertime1Hours = Math.max(0, Math.min(totalHours - overtimeSettings.overtimeThreshold1, overtimeSettings.overtimeThreshold2 - overtimeSettings.overtimeThreshold1));
      totalOvertime2Hours = Math.max(0, totalHours - overtimeSettings.overtimeThreshold2);
      
      // Check if single day falls on weekend
      const dayOfWeek = getDayOfWeek(job.travelStartDate || job.workStartDate || job.departureStartDate);
      if (dayOfWeek === 6) {
        totalSaturdayHours = totalHours;
      } else if (isSundayUTC(job.travelStartDate || job.workStartDate || job.departureStartDate || new Date())) {
        totalSundayHours = totalHours;
      }
    }
    
    const actualWorkedHours = totalRegularHours + totalOvertime1Hours + totalOvertime2Hours;
    
    // Build overtime breakdown
    const overtimeBreakdown = [];
    
    // Hour-based overtime - Only premium portion (rate/100, not 1+rate/100)
    if (totalOvertime1Hours > 0) {
      const premiumHours = totalOvertime1Hours * (overtimeSettings.overtimeRate1 / 100);
      overtimeBreakdown.push({
        type: `Überstunden ${overtimeSettings.overtimeThreshold1}-${overtimeSettings.overtimeThreshold2}h`,
        hours: totalOvertime1Hours,
        rate: overtimeSettings.overtimeRate1,
        amount: premiumHours // Only the premium portion
      });
    }
    
    if (totalOvertime2Hours > 0) {
      const premiumHours = totalOvertime2Hours * (overtimeSettings.overtimeRate2 / 100);
      overtimeBreakdown.push({
        type: `Überstunden über ${overtimeSettings.overtimeThreshold2}h`,
        hours: totalOvertime2Hours,
        rate: overtimeSettings.overtimeRate2,
        amount: premiumHours // Only the premium portion
      });
    }
    
    // Weekend overtime (if enabled) - Only premium portion
    if (overtimeSettings.weekendEnabled) {
      if (totalSaturdayHours > 0) {
        const premiumHours = totalSaturdayHours * (overtimeSettings.saturdayRate / 100);
        overtimeBreakdown.push({
          type: 'Samstag',
          hours: totalSaturdayHours,
          rate: overtimeSettings.saturdayRate,
          amount: premiumHours // Only the premium portion
        });
      }
      
      if (totalSundayHours > 0) {
        const premiumHours = totalSundayHours * (overtimeSettings.sundayRate / 100);
        overtimeBreakdown.push({
          type: 'Sonntag/Feiertag',
          hours: totalSundayHours,
          rate: overtimeSettings.sundayRate,
          amount: premiumHours // Only the premium portion
        });
      }
    }
    
    const totalOvertimeHours = totalOvertime1Hours + totalOvertime2Hours;
    const totalPremiumAmount = overtimeBreakdown.reduce((sum, item) => sum + item.amount, 0);
    
    // For multi-day jobs, calculate guaranteed hours per actual days with time entries
    let numberOfPaidDays = 0;
    if (job.days && Array.isArray(job.days) && job.days.length > 0) {
      numberOfPaidDays = job.days.filter((day: any) => {
        const hasTravel = !!(day.travelStart && day.travelEnd);
        const hasWork = !!(day.workStart && day.workEnd);
        const hasDeparture = !!(day.departureStart && day.departureEnd);
        return hasTravel || hasWork || hasDeparture;
      }).length;
    } else {
      const hasTravel = !!(job.travelStart && job.travelEnd);
      const hasWork = !!(job.workStart && job.workEnd);
      const hasDeparture = !!(job.departureStart && job.departureEnd);
      numberOfPaidDays = hasTravel || hasWork || hasDeparture ? 1 : 0;
    }
    const guaranteedHours = overtimeSettings.guaranteedHours * numberOfPaidDays;
    
    // Correct calculation: base hours + premium
    const baseHours = actualWorkedHours; // All actual work hours
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
    formatMinutesToHours
  };
};