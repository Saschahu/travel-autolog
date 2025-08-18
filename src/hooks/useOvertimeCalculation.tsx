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

    // Calculate travel time
    if (job.travelStart && job.travelEnd) {
      const startMinutes = parseTime(job.travelStart);
      const endMinutes = parseTime(job.travelEnd);
      travelTime = endMinutes > startMinutes ? endMinutes - startMinutes : (24 * 60) - startMinutes + endMinutes;
    }

    // Calculate work time
    if (job.workStart && job.workEnd) {
      const startMinutes = parseTime(job.workStart);
      const endMinutes = parseTime(job.workEnd);
      workTime = endMinutes > startMinutes ? endMinutes - startMinutes : (24 * 60) - startMinutes + endMinutes;
    }

    // Calculate departure time
    if (job.departureStart && job.departureEnd) {
      const startMinutes = parseTime(job.departureStart);
      const endMinutes = parseTime(job.departureEnd);
      departureTime = endMinutes > startMinutes ? endMinutes - startMinutes : (24 * 60) - startMinutes + endMinutes;
    }

    return { travelTime, workTime, departureTime };
  };

  const calculateOvertime = (job: Job): OvertimeCalculation => {
    const timeBreakdown = calculateTimeBreakdown(job);
    const totalMinutes = timeBreakdown.travelTime + timeBreakdown.workTime + timeBreakdown.departureTime;
    
    // Create time slots from job times
    const timeSlots: TimeSlot[] = [];
    
    if (job.travelStart && job.travelEnd) {
      timeSlots.push({
        start: job.travelStart,
        end: job.travelEnd,
        duration: timeBreakdown.travelTime
      });
    }
    
    if (job.workStart && job.workEnd) {
      timeSlots.push({
        start: job.workStart,
        end: job.workEnd,
        duration: timeBreakdown.workTime
      });
    }
    
    if (job.departureStart && job.departureEnd) {
      timeSlots.push({
        start: job.departureStart,
        end: job.departureEnd,
        duration: timeBreakdown.departureTime
      });
    }

    const overtimeSlots = overtimeSettings.timeSlots.map(setting => {
      let overlappingMinutes = 0;
      
      timeSlots.forEach(slot => {
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
              overlappingMinutes += overlapEnd - overlapStart;
            }
          } else {
            // Slot doesn't span midnight
            // Check first part (start to midnight)
            if (slotStart >= settingStart) {
              overlappingMinutes += Math.min(slotEnd, 24 * 60) - slotStart;
            }
            // Check second part (midnight to end)
            if (slotEnd <= settingEnd) {
              overlappingMinutes += slotEnd - Math.max(slotStart, 0);
            }
          }
        } else {
          // Normal time range
          const overlapStart = Math.max(slotStart, settingStart);
          const overlapEnd = Math.min(slotEnd, settingEnd);
          if (overlapEnd > overlapStart) {
            overlappingMinutes += overlapEnd - overlapStart;
          }
        }
      });
      
      const hours = formatMinutesToHours(overlappingMinutes);
      return {
        slotId: setting.id,
        name: setting.name,
        hours,
        rate: setting.rate,
        amount: hours * (setting.rate / 100)
      };
    });

    const totalOvertime = overtimeSlots.reduce((sum, slot) => sum + slot.hours, 0);
    const totalAmount = overtimeSlots.reduce((sum, slot) => sum + slot.amount, 0);
    const regularHours = formatMinutesToHours(totalMinutes) - totalOvertime;

    return {
      regularHours: Math.max(0, regularHours),
      overtimeSlots,
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