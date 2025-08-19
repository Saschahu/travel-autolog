import { useState, useEffect } from 'react';
import { OvertimeSettings, OvertimeCalculation, TimeSlot, DEFAULT_OVERTIME_SETTINGS } from '@/types/overtime';
import { Job } from '@/hooks/useJobs';

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

  const parseTime = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const formatMinutesToHours = (minutes: number): number => {
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
      const startMinutes = parseTime(job.travelStart);
      const endMinutes = parseTime(job.travelEnd);
      travelTime = endMinutes > startMinutes ? endMinutes - startMinutes : (24 * 60) - startMinutes + endMinutes;
    } else if (job.days && Array.isArray(job.days)) {
      job.days.forEach((day: any) => {
        if (day.travelStart && day.travelEnd) {
          const startMinutes = parseTime(day.travelStart);
          const endMinutes = parseTime(day.travelEnd);
          travelTime += endMinutes > startMinutes ? endMinutes - startMinutes : (24 * 60) - startMinutes + endMinutes;
        }
      });
    }

    // Work time: prefer top-level, otherwise sum from days
    if (job.workStart && job.workEnd) {
      const startMinutes = parseTime(job.workStart);
      const endMinutes = parseTime(job.workEnd);
      workTime = endMinutes > startMinutes ? endMinutes - startMinutes : (24 * 60) - startMinutes + endMinutes;
    } else if (job.days && Array.isArray(job.days)) {
      job.days.forEach((day: any) => {
        if (day.workStart && day.workEnd) {
          const startMinutes = parseTime(day.workStart);
          const endMinutes = parseTime(day.workEnd);
          workTime += endMinutes > startMinutes ? endMinutes - startMinutes : (24 * 60) - startMinutes + endMinutes;
        }
      });
    }

    // Departure time: prefer top-level, otherwise sum from days
    if (job.departureStart && job.departureEnd) {
      const startMinutes = parseTime(job.departureStart);
      const endMinutes = parseTime(job.departureEnd);
      departureTime = endMinutes > startMinutes ? endMinutes - startMinutes : (24 * 60) - startMinutes + endMinutes;
    } else if (job.days && Array.isArray(job.days)) {
      job.days.forEach((day: any) => {
        if (day.departureStart && day.departureEnd) {
          const startMinutes = parseTime(day.departureStart);
          const endMinutes = parseTime(day.departureEnd);
          departureTime += endMinutes > startMinutes ? endMinutes - startMinutes : (24 * 60) - startMinutes + endMinutes;
        }
      });
    }

    return { travelTime, workTime, departureTime };
  };

  const isWeekend = (dateString?: string): boolean => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
    return dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
  };

  const isWeekendTime = (startDate?: string, endDate?: string, startTime?: string, endTime?: string): boolean => {
    if (!overtimeSettings.weekendEnabled) return false;
    
    // Check if any part of the time period falls on weekend
    if (startDate && isWeekend(startDate)) return true;
    if (endDate && isWeekend(endDate)) return true;
    
    // Special case: Friday evening to Monday morning
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const startDay = start.getDay();
      const endDay = end.getDay();
      
      // Friday (5) to Sunday/Monday (0/1) or Saturday (6) to Monday (1)
      if ((startDay === 5 && (endDay === 0 || endDay === 1)) || 
          (startDay === 6 && endDay === 1)) {
        return true;
      }
    }
    
    return false;
  };

  const getDayOfWeek = (dateString?: string): number => {
    if (!dateString) return new Date().getDay();
    return new Date(dateString).getDay();
  };

  const calculateWeekendHours = (timeSlots: TimeSlot[]): { saturdayHours: number, sundayHours: number } => {
    let saturdayMinutes = 0;
    let sundayMinutes = 0;
    
    timeSlots.forEach(slot => {
      const dayOfWeek = getDayOfWeek(slot.startDate);
      
      if (dayOfWeek === 6) { // Saturday
        saturdayMinutes += slot.duration;
      } else if (dayOfWeek === 0) { // Sunday
        sundayMinutes += slot.duration;
      }
    });
    
    return {
      saturdayHours: formatMinutesToHours(saturdayMinutes),
      sundayHours: formatMinutesToHours(sundayMinutes)
    };
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
        
        // Calculate total minutes for this day
        if (day.travelStart && day.travelEnd) {
          const startMinutes = parseTime(day.travelStart);
          const endMinutes = parseTime(day.travelEnd);
          dayTotalMinutes += endMinutes > startMinutes ? endMinutes - startMinutes : (24 * 60) - startMinutes + endMinutes;
        }
        
        if (day.workStart && day.workEnd) {
          const startMinutes = parseTime(day.workStart);
          const endMinutes = parseTime(day.workEnd);
          dayTotalMinutes += endMinutes > startMinutes ? endMinutes - startMinutes : (24 * 60) - startMinutes + endMinutes;
        }
        
        if (day.departureStart && day.departureEnd) {
          const startMinutes = parseTime(day.departureStart);
          const endMinutes = parseTime(day.departureEnd);
          dayTotalMinutes += endMinutes > startMinutes ? endMinutes - startMinutes : (24 * 60) - startMinutes + endMinutes;
        }
        
        const dayHours = formatMinutesToHours(dayTotalMinutes);
        const dayOfWeek = getDayOfWeek(day.date);
        
        // Calculate regular vs overtime for this day
        const dayRegularHours = Math.min(dayHours, overtimeSettings.overtimeThreshold1);
        const dayOvertime1Hours = Math.max(0, Math.min(dayHours - overtimeSettings.overtimeThreshold1, overtimeSettings.overtimeThreshold2 - overtimeSettings.overtimeThreshold1));
        const dayOvertime2Hours = Math.max(0, dayHours - overtimeSettings.overtimeThreshold2);
        
        totalRegularHours += dayRegularHours;
        totalOvertime1Hours += dayOvertime1Hours;
        totalOvertime2Hours += dayOvertime2Hours;
        
        // Weekend hours
        if (dayOfWeek === 6) { // Saturday
          totalSaturdayHours += dayHours;
        } else if (dayOfWeek === 0) { // Sunday
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
      } else if (dayOfWeek === 0) {
        totalSundayHours = totalHours;
      }
    }
    
    const actualWorkedHours = totalRegularHours + totalOvertime1Hours + totalOvertime2Hours;
    
    // Build overtime breakdown
    const overtimeBreakdown = [];
    
    // Hour-based overtime - Grundlohn + Zuschlag
    if (totalOvertime1Hours > 0) {
      overtimeBreakdown.push({
        type: `Überstunden ${overtimeSettings.overtimeThreshold1}-${overtimeSettings.overtimeThreshold2}h`,
        hours: totalOvertime1Hours,
        rate: overtimeSettings.overtimeRate1,
        amount: totalOvertime1Hours * (1 + overtimeSettings.overtimeRate1 / 100)
      });
    }
    
    if (totalOvertime2Hours > 0) {
      overtimeBreakdown.push({
        type: `Überstunden über ${overtimeSettings.overtimeThreshold2}h`,
        hours: totalOvertime2Hours,
        rate: overtimeSettings.overtimeRate2,
        amount: totalOvertime2Hours * (1 + overtimeSettings.overtimeRate2 / 100)
      });
    }
    
    // Weekend overtime (if enabled) - Grundlohn + Zuschlag
    if (overtimeSettings.weekendEnabled) {
      if (totalSaturdayHours > 0) {
        overtimeBreakdown.push({
          type: 'Samstag',
          hours: totalSaturdayHours,
          rate: overtimeSettings.saturdayRate,
          amount: totalSaturdayHours * (1 + overtimeSettings.saturdayRate / 100)
        });
      }
      
      if (totalSundayHours > 0) {
        overtimeBreakdown.push({
          type: 'Sonntag/Feiertag',
          hours: totalSundayHours,
          rate: overtimeSettings.sundayRate,
          amount: totalSundayHours * (1 + overtimeSettings.sundayRate / 100)
        });
      }
    }
    
    const totalOvertimeHours = totalOvertime1Hours + totalOvertime2Hours;
    const totalOvertimeAmount = overtimeBreakdown.reduce((sum, item) => sum + item.amount, 0);
    
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
    const totalPayableHours = guaranteedHours + totalOvertimeAmount;

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
      totalOvertimeAmount,
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