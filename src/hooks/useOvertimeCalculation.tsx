import { useState, useEffect } from 'react';
import { OvertimeSettings, OvertimeCalculation, TimeSlot, DEFAULT_OVERTIME_SETTINGS } from '@/types/overtime';
import { Job } from '@/hooks/useJobs';

export const useOvertimeCalculation = () => {
  const [overtimeSettings, setOvertimeSettings] = useState<OvertimeSettings>(DEFAULT_OVERTIME_SETTINGS);
  const [recalcTrigger, setRecalcTrigger] = useState(0);

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
    
    // Work buckets for proper calculation
    let totalRegularMinutes = 0;
    let totalOvertime1Minutes = 0;
    let totalOvertime2Minutes = 0;
    let totalSaturdayMinutes = 0;
    let totalSundayMinutes = 0;
    
    // Track weekend hours in regular/OT buckets to avoid double counting
    let weekendRegularMinutes = 0;
    let weekendOT1Minutes = 0;
    let weekendOT2Minutes = 0;
    
    // Calculate per day to properly handle overtime thresholds
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
        
        const dayOfWeek = getDayOfWeek(day.date);
        const isWeekendDay = dayOfWeek === 6 || dayOfWeek === 0; // Saturday or Sunday
        
        // Categorize minutes into regular/OT1/OT2 for this day
        const threshold1Minutes = overtimeSettings.overtimeThreshold1 * 60;
        const threshold2Minutes = overtimeSettings.overtimeThreshold2 * 60;
        
        const dayRegularMinutes = Math.min(dayTotalMinutes, threshold1Minutes);
        const dayOT1Minutes = Math.max(0, Math.min(dayTotalMinutes - threshold1Minutes, threshold2Minutes - threshold1Minutes));
        const dayOT2Minutes = Math.max(0, dayTotalMinutes - threshold2Minutes);
        
        // Add to totals
        totalRegularMinutes += dayRegularMinutes;
        totalOvertime1Minutes += dayOT1Minutes;
        totalOvertime2Minutes += dayOT2Minutes;
        
        // Track weekend hours separately for premium calculation
        if (isWeekendDay && overtimeSettings.weekendEnabled) {
          if (dayOfWeek === 6) { // Saturday
            totalSaturdayMinutes += dayTotalMinutes;
          } else if (dayOfWeek === 0) { // Sunday
            totalSundayMinutes += dayTotalMinutes;
          }
          
          // Track weekend hours by category for correct premium calculation
          weekendRegularMinutes += dayRegularMinutes;
          weekendOT1Minutes += dayOT1Minutes;
          weekendOT2Minutes += dayOT2Minutes;
        }
      });
    } else {
      // Single day calculation (fallback)
      const totalMinutes = timeBreakdown.travelTime + timeBreakdown.workTime + timeBreakdown.departureTime;
      
      const threshold1Minutes = overtimeSettings.overtimeThreshold1 * 60;
      const threshold2Minutes = overtimeSettings.overtimeThreshold2 * 60;
      
      totalRegularMinutes = Math.min(totalMinutes, threshold1Minutes);
      totalOvertime1Minutes = Math.max(0, Math.min(totalMinutes - threshold1Minutes, threshold2Minutes - threshold1Minutes));
      totalOvertime2Minutes = Math.max(0, totalMinutes - threshold2Minutes);
      
      // Check if single day falls on weekend
      const dayOfWeek = getDayOfWeek(job.travelStartDate || job.workStartDate || job.departureStartDate);
      if ((dayOfWeek === 6 || dayOfWeek === 0) && overtimeSettings.weekendEnabled) {
        if (dayOfWeek === 6) {
          totalSaturdayMinutes = totalMinutes;
        } else if (dayOfWeek === 0) {
          totalSundayMinutes = totalMinutes;
        }
        
        weekendRegularMinutes = totalRegularMinutes;
        weekendOT1Minutes = totalOvertime1Minutes;
        weekendOT2Minutes = totalOvertime2Minutes;
      }
    }
    
    // Convert back to hours for display
    const totalRegularHours = formatMinutesToHours(totalRegularMinutes);
    const totalOvertime1Hours = formatMinutesToHours(totalOvertime1Minutes);
    const totalOvertime2Hours = formatMinutesToHours(totalOvertime2Minutes);
    const totalSaturdayHours = formatMinutesToHours(totalSaturdayMinutes);
    const totalSundayHours = formatMinutesToHours(totalSundayMinutes);
    
    const actualWorkedHours = totalRegularHours + totalOvertime1Hours + totalOvertime2Hours;
    
    // Calculate premiums correctly
    const overtimeBreakdown = [];
    let totalPremiumHours = 0;
    
    // Regular overtime premiums (only on non-weekend hours)
    const nonWeekendOT1Minutes = totalOvertime1Minutes - weekendOT1Minutes;
    const nonWeekendOT2Minutes = totalOvertime2Minutes - weekendOT2Minutes;
    
    if (nonWeekendOT1Minutes > 0) {
      const premiumHours = formatMinutesToHours(nonWeekendOT1Minutes) * (overtimeSettings.overtimeRate1 / 100);
      totalPremiumHours += premiumHours;
      overtimeBreakdown.push({
        type: `Überstunden ${overtimeSettings.overtimeThreshold1}-${overtimeSettings.overtimeThreshold2}h`,
        hours: formatMinutesToHours(nonWeekendOT1Minutes),
        rate: overtimeSettings.overtimeRate1,
        amount: premiumHours
      });
    }
    
    if (nonWeekendOT2Minutes > 0) {
      const premiumHours = formatMinutesToHours(nonWeekendOT2Minutes) * (overtimeSettings.overtimeRate2 / 100);
      totalPremiumHours += premiumHours;
      overtimeBreakdown.push({
        type: `Überstunden über ${overtimeSettings.overtimeThreshold2}h`,
        hours: formatMinutesToHours(nonWeekendOT2Minutes),
        rate: overtimeSettings.overtimeRate2,
        amount: premiumHours
      });
    }
    
    // Weekend premiums (applied to ALL weekend hours)
    if (overtimeSettings.weekendEnabled) {
      if (totalSaturdayMinutes > 0) {
        const saturdayHours = formatMinutesToHours(totalSaturdayMinutes);
        const premiumHours = saturdayHours * (overtimeSettings.saturdayRate / 100);
        totalPremiumHours += premiumHours;
        overtimeBreakdown.push({
          type: 'Samstag-Zuschlag',
          hours: saturdayHours,
          rate: overtimeSettings.saturdayRate,
          amount: premiumHours
        });
        
        // Add weekend overtime premiums on top of Saturday premium
        if (weekendOT1Minutes > 0) {
          const weekendOT1Hours = formatMinutesToHours(weekendOT1Minutes);
          const weekendOT1Premium = weekendOT1Hours * (overtimeSettings.overtimeRate1 / 100);
          totalPremiumHours += weekendOT1Premium;
          overtimeBreakdown.push({
            type: `Samstag Überstunden ${overtimeSettings.overtimeThreshold1}-${overtimeSettings.overtimeThreshold2}h`,
            hours: weekendOT1Hours,
            rate: overtimeSettings.overtimeRate1,
            amount: weekendOT1Premium
          });
        }
        
        if (weekendOT2Minutes > 0) {
          const weekendOT2Hours = formatMinutesToHours(weekendOT2Minutes);
          const weekendOT2Premium = weekendOT2Hours * (overtimeSettings.overtimeRate2 / 100);
          totalPremiumHours += weekendOT2Premium;
          overtimeBreakdown.push({
            type: `Samstag Überstunden über ${overtimeSettings.overtimeThreshold2}h`,
            hours: weekendOT2Hours,
            rate: overtimeSettings.overtimeRate2,
            amount: weekendOT2Premium
          });
        }
      }
      
      if (totalSundayMinutes > 0) {
        const sundayHours = formatMinutesToHours(totalSundayMinutes);
        const premiumHours = sundayHours * (overtimeSettings.sundayRate / 100);
        totalPremiumHours += premiumHours;
        overtimeBreakdown.push({
          type: 'Sonntag/Feiertag-Zuschlag',
          hours: sundayHours,
          rate: overtimeSettings.sundayRate,
          amount: premiumHours
        });
        
        // Add weekend overtime premiums on top of Sunday premium
        const sundayOT1Minutes = totalSundayMinutes > 0 ? weekendOT1Minutes : 0;
        const sundayOT2Minutes = totalSundayMinutes > 0 ? weekendOT2Minutes : 0;
        
        if (sundayOT1Minutes > 0) {
          const sundayOT1Hours = formatMinutesToHours(sundayOT1Minutes);
          const sundayOT1Premium = sundayOT1Hours * (overtimeSettings.overtimeRate1 / 100);
          totalPremiumHours += sundayOT1Premium;
          overtimeBreakdown.push({
            type: `Sonntag Überstunden ${overtimeSettings.overtimeThreshold1}-${overtimeSettings.overtimeThreshold2}h`,
            hours: sundayOT1Hours,
            rate: overtimeSettings.overtimeRate1,
            amount: sundayOT1Premium
          });
        }
        
        if (sundayOT2Minutes > 0) {
          const sundayOT2Hours = formatMinutesToHours(sundayOT2Minutes);
          const sundayOT2Premium = sundayOT2Hours * (overtimeSettings.overtimeRate2 / 100);
          totalPremiumHours += sundayOT2Premium;
          overtimeBreakdown.push({
            type: `Sonntag Überstunden über ${overtimeSettings.overtimeThreshold2}h`,
            hours: sundayOT2Hours,
            rate: overtimeSettings.overtimeRate2,
            amount: sundayOT2Premium
          });
        }
      }
    }
    
    // Calculate guaranteed hours (per day with time entries)
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
    
    // Correct payable hours calculation
    const totalPayableHours = Math.max(guaranteedHours, actualWorkedHours + totalPremiumHours);
    const totalOvertimeHours = totalOvertime1Hours + totalOvertime2Hours;

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
      totalOvertimeAmount: totalPremiumHours,
      totalPayableHours
    };
  };

  const forceRecalculation = () => {
    console.log('Force recalculation triggered!');
    setRecalcTrigger(prev => {
      const newValue = prev + 1;
      console.log('Recalc trigger updated:', newValue);
      return newValue;
    });
  };

  return {
    overtimeSettings,
    saveSettings,
    calculateOvertime,
    calculateTimeBreakdown,
    formatMinutesToHours,
    forceRecalculation,
    recalcTrigger
  };
};