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

  const calculateOvertime = (job: Job): OvertimeCalculation => {
    const timeBreakdown = calculateTimeBreakdown(job);
    const totalMinutes = timeBreakdown.travelTime + timeBreakdown.workTime + timeBreakdown.departureTime;
    
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

    // Calculate weekend hours first
    let weekendMinutes = 0;
    timeSlots.forEach(slot => {
      if (isWeekendTime(slot.startDate, slot.endDate, slot.start, slot.end)) {
        weekendMinutes += slot.duration;
      }
    });

    const overtimeSlots = overtimeSettings.timeSlots.map(setting => {
      let overlappingMinutes = 0;
      
      timeSlots.forEach(slot => {
        // Skip weekend calculation for time-based slots if weekend rate applies
        const slotIsWeekend = isWeekendTime(slot.startDate, slot.endDate, slot.start, slot.end);
        
        const slotStart = parseTime(slot.start);
        const slotEnd = parseTime(slot.end);
        const settingStart = parseTime(setting.start);
        const settingEnd = parseTime(setting.end);
        
        // Handle overnight periods
        if (settingEnd < settingStart) {
          // Setting spans midnight (e.g., 18:00-06:00)
          if (slotEnd < slotStart) {
            // Slot also spans midnight
            const overlapStart = Math.max(slotStart, settingStart);
            const overlapEnd = Math.min(slotEnd + 24 * 60, settingEnd + 24 * 60);
            if (overlapEnd > overlapStart) {
              const overlap = overlapEnd - overlapStart;
              // Don't double-count weekend time
              if (!slotIsWeekend || !overtimeSettings.weekendEnabled) {
                overlappingMinutes += overlap;
              }
            }
          } else {
            // Slot doesn't span midnight
            // Check first part (start to midnight)
            if (slotStart >= settingStart) {
              const overlap = Math.min(slotEnd, 24 * 60) - slotStart;
              if (!slotIsWeekend || !overtimeSettings.weekendEnabled) {
                overlappingMinutes += overlap;
              }
            }
            // Check second part (midnight to end)
            if (slotEnd <= settingEnd) {
              const overlap = slotEnd - Math.max(slotStart, 0);
              if (!slotIsWeekend || !overtimeSettings.weekendEnabled) {
                overlappingMinutes += overlap;
              }
            }
          }
        } else {
          // Normal time range
          const overlapStart = Math.max(slotStart, settingStart);
          const overlapEnd = Math.min(slotEnd, settingEnd);
          if (overlapEnd > overlapStart) {
            const overlap = overlapEnd - overlapStart;
            // Don't double-count weekend time
            if (!slotIsWeekend || !overtimeSettings.weekendEnabled) {
              overlappingMinutes += overlap;
            }
          }
        }
      });
      
      const hours = formatMinutesToHours(overlappingMinutes);
      return {
        slotId: setting.id,
        name: setting.name,
        hours,
        rate: setting.rate,
        amount: hours * (setting.rate / 100),
        isWeekend: false
      };
    });

    // Add weekend overtime slot if enabled and there are weekend hours
    const weekendHours = formatMinutesToHours(weekendMinutes);
    if (overtimeSettings.weekendEnabled && weekendHours > 0) {
      overtimeSlots.push({
        slotId: 'weekend',
        name: 'Wochenende (Fr-So/Mo)',
        hours: weekendHours,
        rate: overtimeSettings.weekendRate,
        amount: weekendHours * (overtimeSettings.weekendRate / 100),
        isWeekend: true
      });
    }

    const totalOvertime = overtimeSlots.reduce((sum, slot) => sum + slot.hours, 0);
    const totalAmount = overtimeSlots.reduce((sum, slot) => sum + slot.amount, 0);
    const regularHours = Math.max(0, formatMinutesToHours(totalMinutes) - totalOvertime);

    return {
      regularHours,
      overtimeSlots,
      weekendHours,
      totalOvertime,
      totalAmount
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