import { describe, it, expect } from 'vitest';
import { calcDailyMinutes, calcOvertime } from './overtime';
import { Job, DayData } from '@/types/job';

describe('overtime', () => {
  describe('calcDailyMinutes', () => {
    it('should calculate minutes for a full day', () => {
      const day: DayData = { travelStart: '07:00', travelEnd: '08:00', workStart: '08:00', workEnd: '16:30', departureStart: '16:30', departureEnd: '17:30' };
      const result = calcDailyMinutes(day);
      expect(result.travel).toBe(60);
      expect(result.work).toBe(510);
      expect(result.departure).toBe(60);
      expect(result.total).toBe(630);
    });

    it('should return 0 for missing start/end times', () => {
      const day: DayData = { workStart: '08:00' };
      const result = calcDailyMinutes(day);
      expect(result.work).toBe(0);
      expect(result.total).toBe(0);
    });

    it('should handle empty day data gracefully', () => {
      const day: DayData = {};
      const result = calcDailyMinutes(day);
      expect(result).toEqual({ travel: 0, work: 0, departure: 0, total: 0 });
    });
  });

  describe('calcOvertime', () => {
    it('A) should calculate zero overtime for a standard workday', () => {
      const job: Job = { id: '1', days: [{ date: '2025-09-08', workStart: '08:00', workEnd: '16:00' }] }; // 480 mins
      const result = calcOvertime(job);
      expect(result.workdays).toBe(1);
      expect(result.sumWork).toBe(480);
      expect(result.overtime).toBe(0);
    });

    it('B) should handle overnight work correctly', () => {
      const job: Job = { id: '1', days: [{ date: '2025-09-08', workStart: '22:10', workEnd: '00:20' }] }; // 130 mins
      const result = calcOvertime(job);
      expect(result.sumWork).toBe(130);
      expect(result.overtime).toBe(0);
    });

    it('C) should apply sundayFactor to work minutes on a Sunday', () => {
      const job: Job = { id: '1', days: [{ date: '2025-09-07', workStart: '10:00', workEnd: '12:00' }] }; // 120 mins on Sunday
      const result = calcOvertime(job, { sundayFactor: 2 });
      expect(result.sumWork).toBe(240); // 120 * 2
      expect(result.overtime).toBe(0); // Base work minutes (120) is less than 480
    });

    it('D) should sum travel time but not count it towards overtime', () => {
      const job: Job = { id: '1', days: [{ date: '2025-09-08', travelStart: '08:00', travelEnd: '12:00' }] }; // 240 mins travel
      const result = calcOvertime(job);
      expect(result.sumTravel).toBe(240);
      expect(result.sumWork).toBe(0);
      expect(result.workdays).toBe(0);
      expect(result.overtime).toBe(0);
    });

    it('E) should handle empty or undefined days array', () => {
      const job1: Job = { id: '1', days: [] };
      const job2: Job = { id: '1' };
      expect(calcOvertime(job1)).toEqual({ sumTravel: 0, sumWork: 0, sumDeparture: 0, sumTotal: 0, workdays: 0, overtime: 0 });
      expect(calcOvertime(job2)).toEqual({ sumTravel: 0, sumWork: 0, sumDeparture: 0, sumTotal: 0, workdays: 0, overtime: 0 });
    });

    it('F) should calculate overtime for a mixed week', () => {
      const job: Job = {
        id: '1',
        days: [
          { date: '2025-09-06', workStart: '08:00', workEnd: '12:00' }, // Saturday, 240 mins work
          { date: '2025-09-07', workStart: '09:00', workEnd: '11:00' }, // Sunday, 120 mins work
          { date: '2025-09-08', workStart: '08:00', workEnd: '18:00' }, // Monday, 600 mins work
        ],
      };
      const result = calcOvertime(job, { sundayFactor: 2, baseDailyMinutes: 480 });
      expect(result.workdays).toBe(3);
      expect(result.sumWork).toBe(240 + (120 * 2) + 600); // 1080
      expect(result.overtime).toBe(120); // Only from Monday (600 - 480)
    });

    it('should calculate overtime correctly when work exceeds base minutes', () => {
      const job: Job = { id: '1', days: [{ date: '2025-09-08', workStart: '08:00', workEnd: '17:00' }] }; // 540 mins
      const result = calcOvertime(job, { baseDailyMinutes: 480 });
      expect(result.overtime).toBe(60); // 540 - 480
    });
  });
});
