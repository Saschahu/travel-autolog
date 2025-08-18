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

    // First check if we have individual time fields
    if (job.travelStart && job.travelEnd) {
      const startMinutes = parseTime(job.travelStart);
      const endMinutes = parseTime(job.travelEnd);
      travelTime = endMinutes > startMinutes ? endMinutes - startMinutes : (24 * 60) - startMinutes + endMinutes;
    }

    if (job.workStart && job.workEnd) {
      const startMinutes = parseTime(job.workStart);
      const endMinutes = parseTime(job.workEnd);
      workTime = endMinutes > startMinutes ? endMinutes - startMinutes : (24 * 60) - startMinutes + endMinutes;
    }

    if (job.departureStart && job.departureEnd) {
      const startMinutes = parseTime(job.departureStart);
      const endMinutes = parseTime(job.departureEnd);
      departureTime = endMinutes > startMinutes ? endMinutes - startMinutes : (24 * 60) - startMinutes + endMinutes;
    }

    // If no individual times but we have days_data, calculate from there
    if (travelTime === 0 && workTime === 0 && departureTime === 0 && job.days && Array.isArray(job.days)) {
      job.days.forEach((day: any) => {
        if (day.travelStart && day.travelEnd) {
          const startMinutes = parseTime(day.travelStart);
          const endMinutes = parseTime(day.travelEnd);
          travelTime += endMinutes > startMinutes ? endMinutes - startMinutes : (24 * 60) - startMinutes + endMinutes;
        }
        
        if (day.workStart && day.workEnd) {
          const startMinutes = parseTime(day.workStart);
          const endMinutes = parseTime(day.workEnd);
          workTime += endMinutes > startMinutes ? endMinutes - startMinutes : (24 * 60) - startMinutes + endMinutes;
        }
        
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
    const totalMinutes = timeBreakdown.travelTime + timeBreakdown.workTime + timeBreakdown.departureTime;
    const actualWorkedHours = formatMinutesToHours(totalMinutes);
    
    // Create time slots from job times with dates - check both individual fields and days_data
    const timeSlots: TimeSlot[] = [];
    
    // Individual time fields
    if (job.travelStart && job.travelEnd) {
      timeSlots.push({
        start: job.travelStart,
        end: job.travelEnd,
        startDate: job.travelStartDate,
        endDate: job.travelEndDate,
        duration: timeBreakdown.travelTime
      });
    }
    
    if (job.workStart && job.workEnd) {
      timeSlots.push({
        start: job.workStart,
        end: job.workEnd,
        startDate: job.workStartDate,
        endDate: job.workEndDate,
        duration: timeBreakdown.workTime
      });
    }
    
    if (job.departureStart && job.departureEnd) {
      timeSlots.push({
        start: job.departureStart,
        end: job.departureEnd,
        startDate: job.departureStartDate,
        endDate: job.departureEndDate,
        duration: timeBreakdown.departureTime
      });
    }

    // If no individual slots but we have days_data, use that
    if (timeSlots.length === 0 && job.days && Array.isArray(job.days)) {
      job.days.forEach((day: any) => {
        if (day.travelStart && day.travelEnd) {
          timeSlots.push({
            start: day.travelStart,
            end: day.travelEnd,
            startDate: day.date,
            endDate: day.date,
            duration: (() => {
              const startMinutes = parseTime(day.travelStart);
              const endMinutes = parseTime(day.travelEnd);
              return endMinutes > startMinutes ? endMinutes - startMinutes : (24 * 60) - startMinutes + endMinutes;
            })()
          });
        }
        
        if (day.workStart && day.workEnd) {
          timeSlots.push({
            start: day.workStart,
            end: day.workEnd,
            startDate: day.date,
            endDate: day.date,
            duration: (() => {
              const startMinutes = parseTime(day.workStart);
              const endMinutes = parseTime(day.workEnd);
              return endMinutes > startMinutes ? endMinutes - startMinutes : (24 * 60) - startMinutes + endMinutes;
            })()
          });
        }
        
        if (day.departureStart && day.departureEnd) {
          timeSlots.push({
            start: day.departureStart,
            end: day.departureEnd,
            startDate: day.date,
            endDate: day.date,
            duration: (() => {
              const startMinutes = parseTime(day.departureStart);
              const endMinutes = parseTime(day.departureEnd);
              return endMinutes > startMinutes ? endMinutes - startMinutes : (24 * 60) - startMinutes + endMinutes;
            })()
          });
        }
      });
    }

    // Calculate weekend hours
    const { saturdayHours, sundayHours } = calculateWeekendHours(timeSlots);
    
    // Calculate regular vs overtime hours based on total worked time
    const regularHours = Math.min(actualWorkedHours, overtimeSettings.overtimeThreshold1);
    const overtime1Hours = Math.max(0, Math.min(actualWorkedHours - overtimeSettings.overtimeThreshold1, overtimeSettings.overtimeThreshold2 - overtimeSettings.overtimeThreshold1));
    const overtime2Hours = Math.max(0, actualWorkedHours - overtimeSettings.overtimeThreshold2);
    
    // Build overtime breakdown
    const overtimeBreakdown = [];
    
    // Hour-based overtime
    if (overtime1Hours > 0) {
      overtimeBreakdown.push({
        type: `Überstunden ${overtimeSettings.overtimeThreshold1}-${overtimeSettings.overtimeThreshold2}h`,
        hours: overtime1Hours,
        rate: overtimeSettings.overtimeRate1,
        amount: overtime1Hours * (overtimeSettings.overtimeRate1 / 100)
      });
    }
    
    if (overtime2Hours > 0) {
      overtimeBreakdown.push({
        type: `Überstunden über ${overtimeSettings.overtimeThreshold2}h`,
        hours: overtime2Hours,
        rate: overtimeSettings.overtimeRate2,
        amount: overtime2Hours * (overtimeSettings.overtimeRate2 / 100)
      });
    }
    
    // Weekend overtime (if enabled)
    if (overtimeSettings.weekendEnabled) {
      if (saturdayHours > 0) {
        overtimeBreakdown.push({
          type: 'Samstag',
          hours: saturdayHours,
          rate: overtimeSettings.saturdayRate,
          amount: saturdayHours * (overtimeSettings.saturdayRate / 100)
        });
      }
      
      if (sundayHours > 0) {
        overtimeBreakdown.push({
          type: 'Sonntag/Feiertag',
          hours: sundayHours,
          rate: overtimeSettings.sundayRate,
          amount: sundayHours * (overtimeSettings.sundayRate / 100)
        });
      }
    }
    
    const totalOvertimeHours = overtime1Hours + overtime2Hours;
    const totalOvertimeAmount = overtimeBreakdown.reduce((sum, item) => sum + item.amount, 0);
    const guaranteedHours = overtimeSettings.guaranteedHours;
    const totalPayableHours = guaranteedHours + totalOvertimeAmount;

    return {
      guaranteedHours,
      actualWorkedHours,
      regularHours,
      overtime1Hours,
      overtime2Hours,
      saturdayHours,
      sundayHours,
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